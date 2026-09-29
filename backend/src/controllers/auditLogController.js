import * as auditLogService from "../services/auditLogService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await auditLogService.list(filters, req.user);
  return sendPaginated(res, "Audit log retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const entry = await auditLogService.getById(req.validParams.id, req.user);
  return sendSuccess(res, 200, "Audit log entry", entry);
});

export const filterOptions = asyncHandler(async (req, res) => {
  const data = await auditLogService.filterOptions(req.user);
  return sendSuccess(res, 200, "Audit filter options", data);
});
