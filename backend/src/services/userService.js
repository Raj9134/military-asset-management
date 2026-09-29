import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import { verifyPassword, hashPassword } from "../utils/password.js";
import * as audit from "./auditService.js";

/**
 * Administrative user management: role, base assignment and active status.
 *
 * This service owns none of the password policy. Hashing and login belong to
 * authService; this file only ever *verifies* a password, through the shared
 * helper, and only for admin re-authentication. That keeps a single definition
 * of what a strong password is and stops the two domains from tangling.
 */

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  baseId: true,
  isActive: true,
  tokenVersion: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  base: { select: { id: true, code: true, name: true } },
};

export async function list({ page, limit, role, baseId, includeInactive, search }) {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (role) where.role = role;
  if (baseId) where.baseId = baseId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: SAFE_SELECT,
    }),
  ]);

  return { total, data };
}

export async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
}

/**
 * Administrative account creation.
 *
 * The password is hashed by the shared helper but this service never decides
 * the policy, and never handles login. It exists because creating an account is
 * an administrative act even though the credential it sets is an auth concern.
 */
export async function create(payload, req) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  assertRoleHasBase(payload.role, payload.baseId);
  if (payload.role !== ROLES.ADMIN) {
    await assertBaseExists(payload.baseId);
  }

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash: await hashPassword(payload.password),
      role: payload.role,
      baseId: payload.role === ROLES.ADMIN ? null : payload.baseId,
      isActive: true,
    },
    select: SAFE_SELECT,
  });

  await audit.record({
    req,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role, baseId: user.baseId },
  });

  return user;
}

/**
 * Role, base and active-status changes.
 *
 * A role change requires the acting admin to re-enter their own password. This
 * is the narrow control the RBAC model actually needs: without it, a hijacked
 * admin session could silently promote an attacker to ADMIN, and nothing in the
 * audit trail would look unusual. Requiring a credential the attacker does not
 * have is what makes that attack fail.
 *
 * Changing a base does not require re-entry; it is audited with before/after.
 */
export async function update(id, payload, req) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  // An admin cannot change their own role. Without this, an admin could demote
  // themselves and lock the system out of administration entirely, and more
  // subtly could avoid accountability for the change.
  if (id === req.user.id && payload.role !== undefined && payload.role !== existing.role) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  const roleChanging = payload.role !== undefined && payload.role !== existing.role;

  if (roleChanging) {
    await assertAdminReauthenticated(payload.currentPassword, req);
  }

  const nextRole = payload.role ?? existing.role;
  const nextBaseId = payload.baseId === undefined ? existing.baseId : payload.baseId;

  assertRoleHasBase(nextRole, nextBaseId);

  if (payload.role !== undefined && payload.role !== existing.role) {
    // Moving someone into a base that does not exist would produce a user who
    // can authenticate but never see any records.
    if (nextRole !== ROLES.ADMIN) {
      await assertBaseExists(nextBaseId);
    }
  }

  const deactivating = payload.isActive === false && existing.isActive === true;

  if (deactivating) {
    if (id === req.user.id) {
      throw ApiError.badRequest("You cannot deactivate your own account");
    }
    await assertNotLastAdmin(existing);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: payload.name,
      email: payload.email === undefined ? undefined : payload.email.toLowerCase(),
      role: payload.role,
      baseId: payload.role === ROLES.ADMIN ? null : nextBaseId,
      isActive: payload.isActive,
      // Any change to what this user may do retires their existing tokens, so
      // the old permissions do not linger in a token issued a minute ago.
      tokenVersion:
        roleChanging || deactivating || payload.isActive === true
          ? { increment: 1 }
          : undefined,
    },
    select: SAFE_SELECT,
  });

  await audit.record({
    req,
    action: deactivating ? "USER_DEACTIVATED" : "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    // Diff rather than the whole row, so the log answers "what changed".
    // The acting admin's password is never included.
    metadata: {
      targetEmail: user.email,
      changes: diff(existing, user),
      reauthenticatedForRoleChange: roleChanging,
    },
  });

  return user;
}

/**
 * Verifies the acting admin's own password. Deliberately reads the hash fresh
 * from the database rather than trusting a claim in the token.
 */
async function assertAdminReauthenticated(currentPassword, req) {
  if (!currentPassword) {
    throw ApiError.badRequest("Current password is required to change a user's role");
  }

  const actingAdmin = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { passwordHash: true },
  });

  const valid = await verifyPassword(currentPassword, actingAdmin.passwordHash);
  if (!valid) {
    // Deliberately not audited as a failure here; the login limiter covers
    // credential guessing, and this endpoint is already admin-gated.
    throw ApiError.forbidden("Current password is incorrect");
  }
}

/**
 * Refuses to remove the last active administrator. A system with no admin can
 * never be repaired through the API, so this is a lockout guard rather than a
 * business rule.
 */
async function assertNotLastAdmin(existing) {
  if (existing.role !== ROLES.ADMIN) return;

  const remaining = await prisma.user.count({
    where: { role: ROLES.ADMIN, isActive: true, id: { not: existing.id } },
  });

  if (remaining === 0) {
    throw ApiError.conflict("Cannot deactivate the last active administrator");
  }
}

function assertRoleHasBase(role, baseId) {
  if (role !== ROLES.ADMIN && !baseId) {
    throw ApiError.badRequest(`${role} must be assigned to a base`);
  }
}

async function assertBaseExists(baseId) {
  if (!baseId) return;
  const base = await prisma.base.findUnique({ where: { id: baseId }, select: { id: true } });
  if (!base) {
    throw ApiError.badRequest("Selected base does not exist");
  }
}

function diff(before, after) {
  const changes = {};
  for (const field of ["name", "email", "role", "baseId", "isActive"]) {
    if (before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  return changes;
}
