import { Provider } from '../../../common/constants/data.constants';
import { hashObject } from '../../../common/utils';

/**
 * Reconciliation utilities
 * Pure functions for event reconciliation logic
 */

/**
 * Computes the canonical key for an event
 * Format: ${provider}:${userId}:${providerEventId}:${accountId}
 */
export function computeCanonicalKey(
  provider: Provider,
  userId: string,
  providerEventId: string,
  accountId: string,
): string {
  return `${provider}:${userId}:${providerEventId}:${accountId}`;
}

/**
 * Computes a stable hash of meaningful fields for duplicate detection
 * Excludes: id, ingestedAt, status, supersededById, version
 */
export function computeHashMeaningful(event: {
  userId: string;
  provider: Provider;
  providerEventId: string;
  accountId: string;
  occurredAt: Date;
  kind: string;
  description: string | null;
  fiatCurrency: string | null;
  fiatAmountMinor: bigint | null;
  assetSymbol: string | null;
  assetAmount: string | null;
  valuationStatus: string | null;
}): string {
  const meaningfulFields = {
    userId: event.userId,
    provider: event.provider,
    providerEventId: event.providerEventId,
    accountId: event.accountId,
    occurredAt: event.occurredAt.toISOString(),
    kind: event.kind,
    description: event.description,
    fiatCurrency: event.fiatCurrency,
    fiatAmountMinor: event.fiatAmountMinor?.toString() || null,
    assetSymbol: event.assetSymbol,
    assetAmount: event.assetAmount,
    valuationStatus: event.valuationStatus,
  };

  return hashObject(meaningfulFields);
}

/**
 * Normalizes occurredAt from various formats to Date
 * Handles ISO strings, epoch milliseconds, and Date objects
 */
export function normalizeOccurredAt(date: string | number | Date): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'number') {
    // Assume epoch milliseconds
    return new Date(date);
  }

  // ISO string
  return new Date(date);
}
