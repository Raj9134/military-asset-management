import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    error: `No route matches ${req.method} ${req.originalUrl}`,
  });
}

// Express identifies a 4-argument function as an error handler, so `next` must
// stay in the signature even though it is not used.
export function errorHandler(err, req, res, next) {
  let status = 500;
  let message = "An unexpected error occurred";
  let errorName = "INTERNAL_ERROR";
  let details = null;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    errorName = err.name;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    errorName = "VALIDATION_ERROR";
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      message = "A record with these values already exists";
      errorName = "DUPLICATE_RECORD";
      details = err.meta?.target ?? null;
    } else if (err.code === "P2025") {
      status = 404;
      message = "Resource not found";
      errorName = "NOT_FOUND";
    } else {
      console.error("Prisma error:", err.code, err.message);
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    message = "Malformed database query";
    errorName = "DATABASE_VALIDATION_ERROR";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON";
    errorName = "INVALID_JSON";
  } else {
    console.error("Unhandled error:", err);
  }

  const body = { success: false, message, error: errorName };
  if (details) body.details = details;

  // Stack traces are useful locally and a security leak in production.
  if (!env.isProduction && err.stack) {
    body.stack = err.stack;
  }

  return res.status(status).json(body);
}
