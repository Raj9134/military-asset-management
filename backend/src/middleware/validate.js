import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

// Validates one part of the request against a schema and replaces it with the
// parsed result. Parsing is what makes the rest of the request trustworthy:
// after this middleware runs, req.body.quantity is a number, not a string.
const validatePart = (part) => (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req[part]);
    // req.query and req.params are getter-only on some Express versions, so the
    // parsed values are stashed where controllers can read them consistently.
    req[`valid${part.charAt(0).toUpperCase()}${part.slice(1)}`] = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join(".") || part,
        message: issue.message,
      }));
      return next(ApiError.badRequest("Validation failed", details));
    }
    return next(error);
  }
};

export const validateBody = validatePart("body");
export const validateQuery = validatePart("query");
export const validateParams = validatePart("params");
