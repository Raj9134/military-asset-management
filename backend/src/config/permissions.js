import { ROLES } from "../config/constants.js";

/**
 * The single description of who may do what, shared by the backend and mirrored
 * in the frontend's permissions helper.
 *
 * Two things are deliberate here. Admin permissions are never written out,
 * because they are the implicit default rather than a list that could fall out
 * of step. And the frontend import is a check rather than a convenience, so a
 * role added to one side without the other fails the test suite instead of
 * silently hiding a nav item.
 */
export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    "users:read", "users:write",
    "bases:read", "bases:write",
    "equipment:read", "equipment:write",
    "dashboard:read",
    "purchases:read", "purchases:write", "purchases:reverse",
    "transfers:read", "transfers:write", "transfers:approve",
    "assignments:read", "assignments:write",
    "expenditures:read", "expenditures:write", "expenditures:reverse",
    "audit:read",
  ],

  // Scoped to their own base. Sees inventory and movements, issues and writes
  // off equipment, but cannot purchase or manage master data.
  [ROLES.BASE_COMMANDER]: [
    "dashboard:read",
    "purchases:read",
    "transfers:read", "transfers:write", "transfers:approve",
    "assignments:read", "assignments:write",
    "expenditures:read", "expenditures:write",
    "audit:read",
  ],

  // Logistics movement across bases, without any administrative capability.
  [ROLES.LOGISTICS_OFFICER]: [
    "dashboard:read",
    "purchases:read", "purchases:write",
    "transfers:read", "transfers:write",
    "assignments:read", "assignments:write",
    "expenditures:read", "expenditures:write",
    "audit:read",
  ],
};

export function can(role, permission) {
  const granted = PERMISSIONS[role];
  return Array.isArray(granted) && granted.includes(permission);
}

export const listPermissions = (role) => PERMISSIONS[role] || [];
