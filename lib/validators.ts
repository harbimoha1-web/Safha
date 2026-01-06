// Input Validation Schemas using Zod
// Protects against invalid inputs and SQL injection

import { z } from 'zod';

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schemas
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Story query schema
export const StoryQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  topicIds: z.array(uuidSchema).optional(),
});

// Search query schema - sanitizes search input
export const SearchQuerySchema = z
  .string()
  .min(1, 'Search query cannot be empty')
  .max(200, 'Search query too long')
  .transform((val) => val.trim());

// Story ID schema
export const StoryIdSchema = uuidSchema;

// User ID schema
export const UserIdSchema = uuidSchema;

// Profile update schema
export const ProfileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  full_name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name too long')
    .optional(),
  language: z.enum(['ar', 'en']).optional(),
  notification_preferences: z
    .object({
      daily_digest: z.boolean(),
      breaking_news: z.boolean(),
      weekly_summary: z.boolean(),
      push_enabled: z.boolean(),
      email_enabled: z.boolean(),
    })
    .partial()
    .optional(),
  selected_topics: z.array(uuidSchema).optional(),
});

// Interaction type schema
export const InteractionTypeSchema = z.enum(['view', 'save', 'share', 'skip']);

// Topic selection schema (for onboarding)
export const TopicSelectionSchema = z.object({
  topicIds: z
    .array(uuidSchema)
    .min(1, 'Please select at least 1 topic')
    .max(20, 'Maximum 20 topics allowed'),
});

// Phone number schema (Saudi format)
export const SaudiPhoneSchema = z
  .string()
  .regex(/^(\+966|966|05|5)[0-9]{8}$/, 'Invalid Saudi phone number')
  .transform((val) => {
    // Normalize to +966 format
    if (val.startsWith('05')) return '+966' + val.slice(1);
    if (val.startsWith('5')) return '+966' + val;
    if (val.startsWith('966')) return '+' + val;
    return val;
  });

// Email schema
export const EmailSchema = z.string().email('Invalid email address');

// Password schema
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

// OTP schema
export const OTPSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^[0-9]+$/, 'OTP must contain only numbers');

// Escape SQL wildcards for LIKE queries
export function escapeSqlWildcards(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

// Validate and parse with helpful errors
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message).join(', ');
    throw new ValidationError(errors);
  }
  return result.data;
}

// Custom validation error
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
