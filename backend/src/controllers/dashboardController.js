import * as dashboardService from "../services/dashboardService.js";
import { sendSuccess } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.summary(req.validQuery, req.user);
  return sendSuccess(res, 200, "Dashboard summary", data);
});

export const movements = asyncHandler(async (req, res) => {
  const data = await dashboardService.movements(req.validQuery, req.user);
  return sendSuccess(res, 200, "Movement breakdown", data);
});

export const netMovementDetails = asyncHandler(async (req, res) => {
  const data = await dashboardService.netMovementDetails(req.validQuery, req.user);
  return sendSuccess(res, 200, "Net movement detail", data);
});

export const filterOptions = asyncHandler(async (req, res) => {
  const data = await dashboardService.filterOptions(req.user);
  return sendSuccess(res, 200, "Filter options", data);
});
