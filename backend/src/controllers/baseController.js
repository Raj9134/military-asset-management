import * as baseService from "../services/baseService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const data = await baseService.list(filters, req.user);

  // The count reflects the whole filtered set, not the page, so the frontend
  // can show "showing 1-20 of 47".
  const total = await baseService.countAll(filters);

  return sendPaginated(res, "Bases retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const base = await baseService.getById(req.validParams.id);
  return sendSuccess(res, 200, "Base retrieved", base);
});

export const create = asyncHandler(async (req, res) => {
  const base = await baseService.create(req.validBody, req);
  return sendSuccess(res, 201, "Base created", base);
});

export const update = asyncHandler(async (req, res) => {
  const base = await baseService.update(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Base updated", base);
});

export const usage = asyncHandler(async (req, res) => {
  const usage = await baseService.getUsage(req.validParams.id);
  return sendSuccess(res, 200, "Base usage", usage);
});
