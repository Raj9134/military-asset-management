import { z } from "zod";
import { paginationSchema } from "./common.js";

const code = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "Code must be at least 2 characters")
  .max(20, "Code must be at most 20 characters")
  .regex(/^[A-Z0-9-]+$/, "Code may contain letters, numbers and hyphens only");

export const createBaseSchema = z.object({
  code,
  name: z.string().trim().min(2, "Name is required").max(120),
  location: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().default(true),
});

// The code is the identifier people use in conversation and reports, so it is
// deliberately immutable once a base exists. Changing it would break every
// reference an operator had memorised.
export const updateBaseSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  location: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listBasesSchema = paginationSchema.extend({
  includeInactive: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  search: z.string().trim().max(120).optional(),
});
