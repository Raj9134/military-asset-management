import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import * as audit from "./auditService.js";

/**
 * Bases.
 *
 * There is no delete. A base is referenced by inventory, movements, assets and
 * user accounts, so removing one would either destroy history or fail on a
 * foreign key. Bases are deactivated instead, which hides them from selection
 * lists while leaving every historical record intact and reportable.
 */

export async function list({ page, limit, includeInactive, search }, user) {
  const where = {};

  if (!includeInactive) {
    where.isActive = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // Everyone can see the list of bases: pickers and reports need to name them.
  // What a non-admin cannot do is read the operational detail inside another
  // base, and that is enforced by resolveBaseScope in the movement services
  // rather than by hiding the base from this list.
  const [total, data] = await Promise.all([
    prisma.base.count({ where }),
    prisma.base.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Only the current balance, and only where the caller is entitled to it.
        _count: { select: { users: true, assets: true } },
      },
    }),
  ]);

  // A base commander has no business seeing how many assets another base holds.
  if (user.role !== ROLES.ADMIN) {
    return data.map(({ _count, ...base }) => ({
      ...base,
      isOwnBase: base.id === user.baseId,
    }));
  }

  return data;
}

/**
 * Total matching the filter, ignoring pagination. Separate from list so the
 * controller can report "showing 1-20 of 47" without loading every row.
 */
export async function countAll({ includeInactive, search }) {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.base.count({ where });
}

export async function getById(id) {
  const base = await prisma.base.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, assets: true, purchases: true, transfersOut: true, transfersIn: true } },
    },
  });

  if (!base) {
    throw ApiError.notFound("Base not found");
  }

  return base;
}

export async function create(payload, req) {
  const base = await prisma.base.create({
    data: {
      code: payload.code,
      name: payload.name,
      location: payload.location || null,
      description: payload.description || null,
      isActive: payload.isActive,
    },
  });

  await audit.record({ req, action: "BASE_CREATED", entityType: "Base", entityId: base.id, metadata: { code: base.code, name: base.name } });

  return base;
}

export async function update(id, payload, req) {
  const existing = await prisma.base.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Base not found");
  }

  const base = await prisma.base.update({
    where: { id },
    data: {
      name: payload.name,
      location: payload.location === undefined ? undefined : payload.location,
      description: payload.description === undefined ? undefined : payload.description,
      isActive: payload.isActive,
    },
  });

  await audit.record({
    req,
    action: "BASE_UPDATED",
    entityType: "Base",
    entityId: base.id,
    // Only what changed, so the log answers "what did they do" rather than
    // repeating the entire row on every save.
    metadata: { changes: diff(existing, base) },
  });

  return base;
}

function diff(before, after) {
  const changes = {};
  for (const field of ["name", "location", "description", "isActive"]) {
    if (before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  return changes;
}

/**
 * Reports what references a base. Exposed so an administrator can see the
 * consequences before deactivating, rather than discovering them later.
 */
export async function getUsage(id) {
  const base = await prisma.base.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          users: true,
          assets: true,
          purchases: true,
          transfersOut: true,
          transfersIn: true,
          assignments: true,
          expenditures: true,
          stockBalances: true,
        },
      },
    },
  });

  if (!base) {
    throw ApiError.notFound("Base not found");
  }

  return base._count;
}
