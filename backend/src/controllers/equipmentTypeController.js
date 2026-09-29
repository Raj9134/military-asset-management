import * as equipmentTypeService from "../services/equipmentTypeService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await equipmentTypeService.list(filters);
  return sendPaginated(res, "Equipment types retrieved", { ...filters, total, data });
});

export const listAll = asyncHandler(async (req, res) => {
  const data = await equipmentTypeService.listAll({ includeInactive: req.query.includeInactive === "true" });
  return sendSuccess(res, 200, "Equipment types retrieved", data);
});

export const getById = asyncHandler(async (req, res) => {
  const item = await equipmentTypeService.getById(req.validParams.id);
  return sendSuccess(res, 200, "Equipment type retrieved", item);
});

export const create = asyncHandler(async (req, res) => {
  const item = await equipmentTypeService.create(req.validBody, req);
  return sendSuccess(res, 201, "Equipment type created", item);
});

export const update = asyncHandler(async (req, res) => {
  const item = await equipmentTypeService.update(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Equipment type updated", item);
});

export const usage = asyncHandler(async (req, res) => {
  const usage = await equipmentTypeService.getUsage(req.validParams.id);
  return sendSuccess(res, 200, "Equipment type usage", usage);
});

export const listForBase = asyncHandler(async (req, res) => {
  const data = await equipmentTypeService.listForBase(req.validParams.id, req.user);
  return sendSuccess(res, 200, "Equipment held at base", data);
});
