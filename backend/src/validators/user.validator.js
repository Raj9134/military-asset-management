import { z } from "zod";
import { paginationSchema } from "./common.js";

export const listUsersSchema = paginationSchema.extend({
  role: z.enum(["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]).optional(),
  baseId: z.coerce.number().int().positive().optional(),
  includeInactive: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  search: z.string().trim().max(120).optional(),
});

/** Admin creates an account on someone's behalf. Password policy is enforced here. */
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  role: z.enum(["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]),
  baseId: z.coerce.number().int().positive().nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
  role: z.enum(["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]).optional(),
  baseId: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  // Re-authentication for the admin performing a role change. Verified against
  // the acting admin's own password, never the target user's.
  currentPassword: z.string().min(1).optional(),
});
