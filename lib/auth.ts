import { z } from "zod";

export const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(10).max(128)
  .regex(/[a-z]/, "password_lowercase_required")
  .regex(/[A-Z]/, "password_uppercase_required")
  .regex(/[0-9]/, "password_number_required")
  .regex(/[^A-Za-z0-9]/, "password_symbol_required");

export function authError(error: { message?: string; code?: string } | null, fallback = "authentication_failed") {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("already registered") || message.includes("already been registered")) return "email_already_registered";
  if (message.includes("invalid login")) return "invalid_credentials";
  if (message.includes("email not confirmed")) return "email_verification_required";
  if (message.includes("rate limit")) return "rate_limited";
  if (message.includes("expired")) return "verification_expired";
  return error?.code || fallback;
}
