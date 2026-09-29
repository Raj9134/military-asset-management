import * as authService from "../services/authService.js";
import { sendSuccess } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listPermissions } from "../config/permissions.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validBody, req);
  return sendSuccess(res, 200, "Signed in successfully", result);
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validBody, req);
  return sendSuccess(res, 201, "Account created", result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.validBody.refreshToken, req);
  return sendSuccess(res, 200, "Session refreshed", result);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req);
  return sendSuccess(res, 200, "Signed out successfully");
});

/**
 * The client calls this on load to confirm a stored token is still usable, and
 * uses the returned permission list to decide what to render. The frontend
 * hides controls from this list, but every one of them is enforced server side
 * as well.
 */
export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Current user", {
    user: req.user,
    permissions: listPermissions(req.user.role),
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.validBody, req);
  return sendSuccess(res, 200, "Password updated, please sign in again");
});
