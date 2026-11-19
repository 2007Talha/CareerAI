/**
 * CareerAI — Runtime Validation Schemas
 *
 * Provides runtime validation envelopes and strict type validators
 * for inputs and API payloads.
 */

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
}

/**
 * Creates a normalized API success envelope.
 * @param data Payload payload
 * @returns Standardized ApiResponseEnvelope
 */
export function createSuccessEnvelope<T>(data: T): ApiResponseEnvelope<T> {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a normalized API error envelope.
 * @param errorMessage Explanation of the failure
 * @returns Standardized ApiResponseEnvelope
 */
export function createErrorEnvelope<T>(errorMessage: string): ApiResponseEnvelope<T> {
  return {
    success: false,
    data: null,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that an email matches standard RFC formatting.
 * @param email Email candidate string
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates non-empty string input within character boundaries.
 * @param value String to validate
 * @param minLength Minimum allowed length
 * @param maxLength Maximum allowed length
 * @returns True if valid
 */
export function isValidString(value: unknown, minLength = 1, maxLength = 5000): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}
