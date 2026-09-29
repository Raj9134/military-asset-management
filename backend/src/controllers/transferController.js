import * as transferService from "../services/transferService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await transferService.list(filters, req.user);
  return sendPaginated(res, "Transfers retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const transfer = await transferService.getById(req.validParams.id, req.user);
  return sendSuccess(res, 200, "Transfer retrieved", transfer);
});

export const create = asyncHandler(async (req, res) => {
  const transfer = await transferService.create(req.validBody, req);
  return sendSuccess(res, 201, "Transfer initiated", transfer);
});

export const approve = asyncHandler(async (req, res) => {
  const transfer = await transferService.approve(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Transfer approved", transfer);
});

export const reject = asyncHandler(async (req, res) => {
  const transfer = await transferService.reject(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Transfer rejected", transfer);
});

export const cancel = asyncHandler(async (req, res) => {
  const transfer = await transferService.cancel(req.validParams.id, req);
  return sendSuccess(res, 200, "Transfer cancelled", transfer);
});

export const complete = asyncHandler(async (req, res) => {
  const transfer = await transferService.complete(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Transfer completed", transfer);
});
