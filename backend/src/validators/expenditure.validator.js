import { z } from "zod";
import { paginationSchema, withDateRange, quantitySchema } from "./common.js";

const expenditureDate = z.coerce.date().refine(
  (date) => date <= new Date(Date.now() + 24 * 60 * 60 * 1000),
  { message: "Expenditure date cannot be in the future" }
);

export const createExpenditureSchema = z.object({
  baseId: z.coerce.number().int().positive(),
  equipmentTypeId: z.coerce.number().int().positive(),
  quantity: quantitySchema,
  expenditureDate,
  reason: z.enum(["TRAINING", "DAMAGE", "LOSS", "MAINTENANCE", "OTHER"]),
  // Linking the expenditure to the assignment it consumed from is what lets the
  // service clear committed stock at the same time. Without it an issued asset
  // would be subtracted from onHand while still counted as committed.
  assignmentId: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const listExpendituresSchema = withDateRange(
  paginationSchema.extend({
    baseId: z.coerce.number().int().positive().optional(),
    equipmentTypeId: z.coerce.number().int().positive().optional(),
    reason: z.enum(["TRAINING", "DAMAGE", "LOSS", "MAINTENANCE", "OTHER"]).optional(),
    status: z.enum(["ACTIVE", "REVERSED"]).optional(),
  })
);

export const reverseExpenditureSchema = z.object({
  reason: z.string().trim().min(3, "A reason is required").max(500),
});
