/**
 * Shared utilities
 */

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
  const str = JSON.stringify(obj, (key, value: unknown) => {
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
