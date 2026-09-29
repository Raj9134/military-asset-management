import * as expenditureService from "../services/expenditureService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await expenditureService.list(filters, req.user);
  return sendPaginated(res, "Expenditures retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const expenditure = await expenditureService.getById(req.validParams.id, req.user);
  return sendSuccess(res, 200, "Expenditure retrieved", expenditure);
});

export const create = asyncHandler(async (req, res) => {
  const expenditure = await expenditureService.create(req.validBody, req);
  return sendSuccess(res, 201, "Expenditure recorded", expenditure);
});

export const reverse = asyncHandler(async (req, res) => {
  const expenditure = await expenditureService.reverse(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Expenditure reversed", expenditure);
});
