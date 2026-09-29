import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      baseId: user.baseId,
      // Changing the version invalidates every previously issued token for this
      // user without needing a blacklist.
      tv: user.tokenVersion,
      type: "access",
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function signRefreshToken(user, tokenId) {
  return jwt.sign({ sub: user.id, jti: tokenId, type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  // Refresh tokens are signed with a different secret and so are already
  // rejected, but the type check makes the intent explicit and protects against
  // a future mistake where the same secret serves both purposes.
  if (payload.type !== "access") {
    throw new Error("Wrong token type");
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwtRefreshSecret);
  if (payload.type !== "refresh") {
    throw new Error("Wrong token type");
  }
  return payload;
}

/**
 * Refresh tokens are stored as a SHA-256 hash rather than the token itself.
 * SHA-256 would be unacceptable for a password and is correct here, because the
 * input is already 64 bytes of cryptographic randomness: there is no dictionary
 * to brute force, and lookups have to be fast because they happen on every
 * refresh.
 */
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * Decodes without verifying, to read the `sub` claim during logout. A tampered
 * or expired token yields null rather than throwing, since a logout attempt
 * should still succeed from the caller's point of view.
 */
export const decodeUnsafe = (token) => jwt.decode(token);
