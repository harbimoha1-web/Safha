// Supabase/PostgREST Error Codes
// Use these instead of hardcoded strings for better maintainability

export const SUPABASE_ERROR_CODES = {
  // PostgREST errors
  NOT_FOUND: 'PGRST116', // Row not found (single result expected)
  SCHEMA_CACHE: 'PGRST205', // Function not found in cache
  MULTIPLE_ROWS: 'PGRST300', // Multiple rows returned when single expected

  // Auth errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  USER_NOT_FOUND: 'user_not_found',
  INVALID_OTP: 'otp_expired',

  // RLS errors
  INSUFFICIENT_PRIVILEGE: '42501',
  ROW_LEVEL_SECURITY: 'PGRST301',
} as const;

// Type for error codes
export type SupabaseErrorCode = typeof SUPABASE_ERROR_CODES[keyof typeof SUPABASE_ERROR_CODES];

// Helper to check if an error matches a code
export function isErrorCode(error: unknown, code: SupabaseErrorCode): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string };
  return err.code === code;
}

// Helper to check if error is "not found" (common case)
export function isNotFoundError(error: unknown): boolean {
  return isErrorCode(error, SUPABASE_ERROR_CODES.NOT_FOUND);
}

// Helper to check if error is schema cache (usually means function doesn't exist)
export function isSchemaCacheError(error: unknown): boolean {
  return isErrorCode(error, SUPABASE_ERROR_CODES.SCHEMA_CACHE);
}

// Common error messages for user display
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  NOT_FOUND: 'Content not found.',
  UNAUTHORIZED: 'Please sign in to continue.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
} as const;
