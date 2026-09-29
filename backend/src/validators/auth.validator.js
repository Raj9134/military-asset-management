import { z } from "zod";

// Rejects whitespace-only strings, which pass an isEmail() check far less often
// than people assume and produce confusing "required field" errors later.
const requiredText = (field) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, { message: `${field} is required` });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: requiredText("Name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    role: z.enum(["BASE_COMMANDER", "LOGISTICS_OFFICER"]).default("LOGISTICS_OFFICER"),
    baseId: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  // A base-scoped role is meaningless without a base, and allowing it would
  // create a user who can never see any data.
  .refine((value) => value.role === "ADMIN" || Boolean(value.baseId), {
    message: "A base must be selected for this role",
    path: ["baseId"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
