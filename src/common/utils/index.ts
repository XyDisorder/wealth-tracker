/**
 * Shared utilities
 */

import { ValidationError } from '../errors';

/**
 * Converts a bigint to string for JSON serialization
 */
export function bigintToString(value: bigint | null): string | null {
  return value !== null ? value.toString() : null;
}

/**
 * Converts a string to bigint
 */
export function stringToBigint(value: string | null): bigint | null {
  return value !== null ? BigInt(value) : null;
}

/**
 * Generates a stable hash from an object
 */
export function hashObject(obj: Record<string, unknown>): string {
  const str = safeJsonStringify(obj, (key, value: unknown) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value as string | number | boolean | null;
  });
  // Simple hash function (for prototype, use crypto in production)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Returns the default value if null/undefined
 */
export function defaultTo<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Safely parses JSON string with error handling
 * @throws ValidationError if JSON is invalid
 */
export function safeJsonParse<T = unknown>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    const message =
      error instanceof Error
        ? `Invalid JSON: ${error.message}`
        : 'Invalid JSON format';
    throw new ValidationError(message);
  }
}

/**
 * Safely stringifies an object to JSON
 * @throws ValidationError if object cannot be stringified
 */
export function safeJsonStringify(
  value: unknown,
  replacer?: (key: string, value: unknown) => unknown,
  space?: string | number,
): string {
  try {
    return JSON.stringify(value, replacer as never, space);
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to stringify: ${error.message}`
        : 'Failed to stringify object';
    throw new ValidationError(message);
  }
}
