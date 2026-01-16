import { z } from "zod";

/**
 * Contact form validation schema
 * Implements strict validation with sanitization
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
    .transform((val) => val.trim()),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .transform((val) => val.trim()),

  company: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must not exceed 200 characters")
    .optional()
    .transform((val) => val?.trim()),

  phone: z
    .string()
    .regex(
      /^[\d\s\-\(\)\+]+$/,
      "Phone number contains invalid characters"
    )
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .transform((val) => val?.trim()),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must not exceed 2000 characters")
    .transform((val) => val.trim()),

  turnstileToken: z
    .string()
    .min(1, "Verification token is required"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Newsletter subscription validation schema
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .transform((val) => val.trim()),

  turnstileToken: z
    .string()
    .min(1, "Verification token is required"),
});

export type NewsletterData = z.infer<typeof newsletterSchema>;

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize all form inputs
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
