import { z } from "zod";
import { paginationSchema, withDateRange, quantitySchema } from "./common.js";

export const createTransferSchema = z
  .object({
    sourceBaseId: z.coerce.number().int().positive(),
    destinationBaseId: z.coerce.number().int().positive(),
    equipmentTypeId: z.coerce.number().int().positive(),
    quantity: quantitySchema,
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => value.sourceBaseId !== value.destinationBaseId, {
    message: "Source and destination base must be different",
    path: ["destinationBaseId"],
  });

export const listTransfersSchema = withDateRange(
  paginationSchema.extend({
    // Either end of the transfer, because a base legitimately has an interest in
    // stock leaving it as well as stock arriving.
    baseId: z.coerce.number().int().positive().optional(),
    equipmentTypeId: z.coerce.number().int().positive().optional(),
    status: z.enum(["PENDING", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"]).optional(),
    direction: z.enum(["inbound", "outbound", "any"]).default("any"),
  })
);

export const decisionSchema = z.object({
  reason: z.string().trim().max(500).nullable().optional(),
});

export const completeTransferSchema = z.object({
  notes: z.string().trim().max(1000).nullable().optional(),
});
