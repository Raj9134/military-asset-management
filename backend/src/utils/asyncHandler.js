import { ApiError } from "../utils/ApiError.js";

// Wraps an async route handler so a rejected promise reaches Express's error
// handler instead of hanging the request. Express 4 does not await handlers;
// without this every await that throws becomes a request that never responds.
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
