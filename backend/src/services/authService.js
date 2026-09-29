import prisma from "../config/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeUnsafe,
  hashToken,
} from "../utils/tokenService.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import * as audit from "./auditService.js";
import { ApiError } from "../utils/ApiError.js";

const USER_SELECT = {
  id: true, name: true, email: true, role: true, baseId: true,
  isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true,
  base: { select: { id: true, code: true, name: true } },
};

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

async function issueSession(user, req) {
  // The row is created before the token is signed so the id can go into the
  // JWT as `jti`, letting a specific session be revoked later.
  const refreshToken = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "pending",
      expiresAt: new Date(Date.now() + REFRESH_MS),
      userAgent: req.userAgent || null,
      ipAddress: req.ipAddress || null,
    },
  });

  const plain = signRefreshToken(user, refreshToken.id);
  await prisma.refreshToken.update({
    where: { id: refreshToken.id },
    data: { tokenHash: hashToken(plain) },
  });

  return { accessToken: signAccessToken(user), refreshToken: plain };
}

export async function login({ email, password }, req) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { base: { select: { id: true, code: true, name: true } } },
  });

  // One generic message for both "no such user" and "wrong password". Telling
  // them apart would turn the login form into an account enumeration tool.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await audit.recordFailedLogin({ req, email, reason: user ? "invalid password" : "unknown account" });
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    await audit.recordFailedLogin({ req, email, reason: "account deactivated" });
    throw ApiError.forbidden("This account has been deactivated");
  }

  const session = await issueSession(user, req);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  // Written after the success so the log and the database cannot disagree.
  await audit.record({
    req: { ...req, user },
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  const { passwordHash, ...safe } = user;
  return { ...session, user: safe };
}

export async function register({ name, email, password, role, baseId }, req) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash: await hashPassword(password), role, baseId: baseId || null },
    select: USER_SELECT,
  });

  await audit.record({ req: { ...req, user }, action: "REGISTER", entityType: "User", entityId: user.id });

  const session = await issueSession(user, req);
  return { ...session, user };
}

/**
 * Rotates the refresh token.
 *
 * The presented token is revoked and a new one issued in the same transaction.
 * If a token that has already been rotated is presented again, that means it was
 * captured and replayed, so every session for the user is dropped.
 */
export async function refresh(plainToken, req) {
  const payload = verifyRefreshToken(plainToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(plainToken) } });

  if (!stored || stored.revokedAt) {
    if (stored) {
      await prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await prisma.user.update({ where: { id: stored.userId }, data: { tokenVersion: { increment: 1 } } });
    }
    throw ApiError.unauthorized("Refresh token is no longer valid, please sign in again");
  }

  if (stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token has expired, please sign in again");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { ...USER_SELECT, tokenVersion: true } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account is not available");
  }

  const session = await issueSession(user, req);

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  return { ...session, user };
}

/**
 * Revokes the caller's session and bumps tokenVersion, which also kills the
 * access token immediately rather than at its natural expiry.
 */
export async function logout(req) {
  const header = req.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const payload = decodeUnsafe(header.slice(7).trim());
    if (payload?.sub) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.user.update({ where: { id: payload.sub }, data: { tokenVersion: { increment: 1 } } });
    }
  }

  await audit.record({ req, action: "LOGOUT", entityType: "User", entityId: req.user.id });
}

export async function changePassword({ currentPassword, newPassword }, req) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
  });

  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit.record({ req, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id });
}
