import * as userService from "../services/userService.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const filters = req.validQuery;
  const { total, data } = await userService.list(filters);
  return sendPaginated(res, "Users retrieved", { ...filters, total, data });
});

export const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.validParams.id);
  return sendSuccess(res, 200, "User retrieved", user);
});

export const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.validBody, req);
  return sendSuccess(res, 201, "User created", user);
});

export const update = asyncHandler(async (req, res) => {
  const user = await userService.update(req.validParams.id, req.validBody, req);
  return sendSuccess(res, 200, "User updated", user);
});
