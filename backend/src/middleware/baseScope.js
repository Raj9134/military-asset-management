import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";

/**
 * Resource level authorisation.
 *
 * The important property here is that this returns a Prisma `where` fragment
 * rather than a boolean. A boolean has to be remembered at every call site, and
 * the one place somebody forgets is exactly where a base commander reads
 * another base's records. Merging the scope into the query makes that class of
 * bug impossible to write.
 *
 * Admin sees everything. Everyone else is pinned to their own base, and asking
 * for a different one is an explicit refusal rather than a silently empty list.
 */
export function resolveBaseScope(user, requestedBaseId) {
  if (user.role === ROLES.ADMIN) {
    // Admin may filter by any base, or by none to see the whole picture.
    return requestedBaseId ? { baseId: requestedBaseId } : {};
  }

  if (!user.baseId) {
    throw ApiError.forbidden("Your account has no base assigned. Contact an administrator.");
  }

  if (requestedBaseId && Number(requestedBaseId) !== Number(user.baseId)) {
    throw ApiError.forbidden("You are not authorised to access another base");
  }

  return { baseId: user.baseId };
}

/**
 * A transfer involves two bases, so a single scope fragment is not enough.
 * A non-admin may see a transfer when their base is either end of it, and may
 * act on it only when their base is the side the action applies to.
 */
export function canAccessTransfer(user, transfer, side = "either") {
  if (user.role === ROLES.ADMIN) return true;
  if (!user.baseId) return false;

  const isSource = Number(user.baseId) === Number(transfer.sourceBaseId);
  const isDestination = Number(user.baseId) === Number(transfer.destinationBaseId);

  if (side === "source") return isSource;
  if (side === "destination") return isDestination;
  return isSource || isDestination;
}

/**
 * Confirms the signed-in user may read a record that is already loaded.
 * Used by single-record endpoints where the id came from the client.
 *
 * Returns false instead of throwing so callers can decide whether to surface a
 * 403 or a 404. Listing endpoints never need this, because the scope is already
 * part of the query.
 */
export function ownsBase(user, baseId) {
  if (user.role === ROLES.ADMIN) return true;
  return Number(user.baseId) === Number(baseId);
}
