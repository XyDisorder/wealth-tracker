/**
 * Data constants
 * Shared data constants throughout the application
 */

// Job types
export enum JobType {
  RECONCILE_RAW_EVENT = 'RECONCILE_RAW_EVENT',
  ENRICH_CRYPTO_VALUATION = 'ENRICH_CRYPTO_VALUATION',
  REFRESH_FX_RATES = 'REFRESH_FX_RATES',
}

// Job status
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

// Providers
export enum Provider {
  BANK = 'BANK',
  CRYPTO = 'CRYPTO',
  INSURER = 'INSURER',
}

// Event kinds
export enum EventKind {
  CASH_CREDIT = 'CASH_CREDIT',
  CASH_DEBIT = 'CASH_DEBIT',
  CRYPTO_DEPOSIT = 'CRYPTO_DEPOSIT',
  CRYPTO_WITHDRAWAL = 'CRYPTO_WITHDRAWAL',
  INSURANCE_PREMIUM = 'INSURANCE_PREMIUM',
}

// Event status
export enum EventStatus {
  APPLIED = 'APPLIED',
  SUPERSEDED = 'SUPERSEDED',
  IGNORED = 'IGNORED',
}

// Valuation status
export enum ValuationStatus {
  PENDING = 'PENDING',
  VALUED = 'VALUED',
}
