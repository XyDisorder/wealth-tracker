/**
 * Numeric constants
 * Centralized numeric constants to avoid magic numbers
 */

/**
 * Timestamp conversion constants
 */
export const TIMESTAMP_CONSTANTS = {
  /** Threshold to distinguish seconds from milliseconds (1e12 = 2001-09-09) */
  SECONDS_THRESHOLD: 1e12,
  /** Milliseconds per second */
  MS_PER_SECOND: 1000,
  /** Minimum valid year for dates */
  MIN_VALID_YEAR: 2000,
} as const;

/**
 * Currency conversion constants
 */
export const CURRENCY_CONSTANTS = {
  /** Decimal places for fiat currencies (standard: 2) */
  FIAT_DECIMAL_PLACES: 2,
  /** Multiplier to convert fiat amount to minor units (100 = 2 decimal places) */
  MINOR_UNITS_MULTIPLIER: 100,
  /** Default currency */
  DEFAULT_CURRENCY: 'EUR',
} as const;

/**
 * Payload size limits
 */
export const PAYLOAD_CONSTANTS = {
  /** Maximum payload size in bytes (1MB) */
  MAX_PAYLOAD_SIZE: 1024 * 1024,
} as const;

/**
 * Re-export for convenience
 */
export const MAX_PAYLOAD_SIZE = PAYLOAD_CONSTANTS.MAX_PAYLOAD_SIZE;

/**
 * String length limits
 */
export const STRING_LIMITS = {
  /** Maximum length for userId */
  MAX_USER_ID_LENGTH: 100,
  /** Maximum length for accountId */
  MAX_ACCOUNT_ID_LENGTH: 200,
  /** Maximum length for description */
  MAX_DESCRIPTION_LENGTH: 1000,
  /** Maximum length for providerEventId */
  MAX_PROVIDER_EVENT_ID_LENGTH: 200,
} as const;
