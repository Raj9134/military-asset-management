import { z } from "zod";
import { PAGINATION } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";

// Route params always arrive as strings, so an id has to be coerced before it
// can be compared with a database column.
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

// Kept as a plain object so it can be merged into other schemas. A refined
// schema would be a ZodEffects, which has no .extend() or .merge().
export const dateRangeFields = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

/**
 * Adds the date range to a schema and enforces that it runs forwards.
 *
 * An impossible range is refused rather than quietly returning no rows, because
 * "no results" reads like a real answer when it is actually a mistake.
 */
export function withDateRange(schema) {
  return schema.merge(dateRangeFields).superRefine((value, ctx) => {
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "dateFrom must be on or before dateTo",
      });
    }
  });
}

// Quantities are integers because nothing in this system is issued in fractions.
// Rejecting 0 and negatives at the edge keeps the arithmetic honest downstream.
export const quantitySchema = z.coerce.number().int().positive({ message: "Quantity must be greater than zero" });

export const optionalIdSchema = z.coerce.number().int().positive().nullable().optional();

// Base and equipment filters are shared by every list endpoint, so they live
// here rather than being repeated per validator.
export const scopeFilterSchema = z.object({
  baseId: optionalIdSchema,
  equipmentTypeId: optionalIdSchema,
});

