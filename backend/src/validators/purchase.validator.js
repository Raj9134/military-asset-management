import { z } from "zod";
import { paginationSchema, withDateRange, quantitySchema } from "./common.js";

const purchaseDate = z.coerce.date().refine(
  (date) => date <= new Date(Date.now() + 24 * 60 * 60 * 1000),
  { message: "Purchase date cannot be in the future" }
);

export const createPurchaseSchema = z.object({
  baseId: z.coerce.number().int().positive(),
  equipmentTypeId: z.coerce.number().int().positive(),
  quantity: quantitySchema,
  purchaseDate,
  supplier: z.string().trim().max(150).nullable().optional(),
  unitPrice: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const listPurchasesSchema = withDateRange(
  paginationSchema.extend({
    baseId: z.coerce.number().int().positive().optional(),
    equipmentTypeId: z.coerce.number().int().positive().optional(),
    status: z.enum(["ACTIVE", "REVERSED"]).optional(),
  })
);

export const reversePurchaseSchema = z.object({
  reason: z.string().trim().min(3, "A reason is required").max(500),
});
