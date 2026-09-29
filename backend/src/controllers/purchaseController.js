import * as purchaseService from "../services/purchaseService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await purchaseService.list(filters, req.user);
  return sendPaginated(res, "Purchases retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getById(req.validParams.id, req.user);
  return sendSuccess(res, 200, "Purchase retrieved", purchase);
});

export const create = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.create(req.validBody, req);
  return sendSuccess(res, 201, "Purchase recorded", purchase);
});

export const reverse = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.reverse(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "Purchase reversed", purchase);
});
