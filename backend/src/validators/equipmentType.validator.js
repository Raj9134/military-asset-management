import { z } from "zod";
import { paginationSchema } from "./common.js";

const code = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "Code must be at least 2 characters")
  .max(20, "Code must be at most 20 characters")
  .regex(/^[A-Z0-9_]+$/, "Code may contain letters, numbers and underscores only");

export const createEquipmentTypeSchema = z.object({
  code,
  name: z.string().trim().min(2, "Name is required").max(120),
  category: z.enum(["VEHICLE", "WEAPON", "AMMUNITION", "OTHER"]),
  unitOfMeasure: z.string().trim().min(1).max(30).default("unit"),
  isTrackable: z.boolean().default(false),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateEquipmentTypeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  category: z.enum(["VEHICLE", "WEAPON", "AMMUNITION", "OTHER"]).optional(),
  unitOfMeasure: z.string().trim().min(1).max(30).optional(),
  isTrackable: z.boolean().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listEquipmentTypesSchema = paginationSchema.extend({
  includeInactive: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  category: z.enum(["VEHICLE", "WEAPON", "AMMUNITION", "OTHER"]).optional(),
  search: z.string().trim().max(120).optional(),
});
