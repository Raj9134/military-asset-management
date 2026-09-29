import { ROLES } from "../constants/options.js";

/**
 * Mirrors the backend's permission map.
 *
 * This controls only what is *displayed*. Every action hidden here is still
 * refused by the API, so removing this file would make the interface show more
 * buttons and nothing else would change. That is the point: the frontend is a
 * convenience, never a control.
 *
 * Backend: src/config/permissions.js
 */

const ADMIN_PERMISSIONS = [
  "users:read", "users:write",
  "bases:read", "bases:write",
  "equipment:read", "equipment:write",
  "dashboard:read",
  "purchases:read", "purchases:write", "purchases:reverse",
  "transfers:read", "transfers:write", "transfers:approve",
  "assignments:read", "assignments:write",
  "expenditures:read", "expenditures:write", "expenditures:reverse",
  "audit:read",
];

const BASE_COMMANDER_PERMISSIONS = [
  "dashboard:read",
  "purchases:read",
  "transfers:read", "transfers:write", "transfers:approve",
  "assignments:read", "assignments:write",
  "expenditures:read", "expenditures:write",
  "audit:read",
];

const LOGISTICS_OFFICER_PERMISSIONS = [
  "dashboard:read",
  "purchases:read", "purchases:write",
  "transfers:read", "transfers:write",
  "assignments:read", "assignments:write",
  "expenditures:read", "expenditures:write",
  "audit:read",
];

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.BASE_COMMANDER]: BASE_COMMANDER_PERMISSIONS,
  [ROLES.LOGISTICS_OFFICER]: LOGISTICS_OFFICER_PERMISSIONS,
};

export const can = (role, permission) =>
  (ROLE_PERMISSIONS[role] || []).includes(permission);

export const isAdmin = (role) => role === ROLES.ADMIN;

/** Initials for the avatar. Falls back to a single character for odd names. */
export const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
