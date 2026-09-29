import * as assignmentService from "../services/assignmentService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await assignmentService.list(filters, req.user);
  return sendPaginated(res, "Assignments retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.getById(req.validParams.id, req.user);
  return sendSuccess(res, 200, "Assignment retrieved", assignment);
});

export const create = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.create(req.validBody, req);
  return sendSuccess(res, 201, "Equipment issued", assignment);
});

export const returnEquipment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.returnEquipment(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Equipment returned", assignment);
});
