import { z } from "zod";
import { paginationSchema, withDateRange, quantitySchema } from "./common.js";

const assignmentDate = z.coerce.date().refine(
  (date) => date <= new Date(Date.now() + 24 * 60 * 60 * 1000),
  { message: "Assignment date cannot be in the future" }
);

export const createAssignmentSchema = z
  .object({
    baseId: z.coerce.number().int().positive(),
    equipmentTypeId: z.coerce.number().int().positive().nullable().optional(),
    assetId: z.coerce.number().int().positive().nullable().optional(),
    quantity: quantitySchema.default(1),
    personnelName: z.string().trim().min(2, "Personnel name is required").max(120),
    personnelId: z.string().trim().max(60).nullable().optional(),
    designation: z.string().trim().max(80).nullable().optional(),
    assignmentDate,
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  // Either a specific serialised asset or a bulk quantity of an equipment type.
  // The database enforces this too; catching it here gives a field-level error.
  .refine((value) => value.assetId || value.equipmentTypeId, {
    message: "Select either a specific asset or an equipment type",
    path: ["equipmentTypeId"],
  })
  // Assigning one named asset by quantity would be meaningless and could
  // silently over-issue.
  .refine((value) => !value.assetId || value.quantity === 1, {
    message: "A single asset must be assigned with a quantity of 1",
    path: ["quantity"],
  });

export const returnAssignmentSchema = z.object({
  // Partial returns are allowed, which is why this is not the full quantity.
  returnedQuantity: quantitySchema,
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const listAssignmentsSchema = withDateRange(
  paginationSchema.extend({
    baseId: z.coerce.number().int().positive().optional(),
    equipmentTypeId: z.coerce.number().int().positive().optional(),
    status: z.enum(["ACTIVE", "PARTIALLY_RETURNED", "RETURNED", "EXPIRED"]).optional(),
  })
);
