import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/tokenService.js";

// Columns that must never reach a response. Selecting explicitly rather than
// fetching the row and deleting the hash afterwards means the secret is never
// in memory on the response path at all.
const SAFE_USER_SELECT = {
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
  base: {
    select: { id: true, code: true, name: true, location: true },
  },
};

/**
 * Verifies the bearer token and loads the current user.
 *
 * The user is re-read on every request rather than trusted from the token body.
 * That costs one indexed lookup and buys immediate revocation: a deactivated
 * account or a changed role takes effect on the very next call instead of
 * whenever the token happens to expire.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.get("authorization");
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing bearer token");
    }

    const token = header.slice(7).trim();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      // jwt distinguishes an expired token from an invalid one, and the
      // distinction matters to a client deciding whether to refresh.
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized("Token has expired");
      }
      throw ApiError.unauthorized("Invalid token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw ApiError.unauthorized("Account no longer exists");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("This account has been deactivated");
    }

    // Password changes and role changes bump tokenVersion, retiring every token
    // issued before the change.
    if (user.tokenVersion !== payload.tv) {
      throw ApiError.unauthorized("Session is no longer valid, please sign in again");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role gate. Composes with authenticate, never replaces it.
 *
 * An ADMIN listing is deliberately written out rather than derived from a
 * permission map, so that reading a route tells you exactly who can reach it.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(", ")}`
        )
      );
    }

    return next();
  };
}
