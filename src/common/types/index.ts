/**
 * Types partagés dans toute l'application
 */

import {
  EventKind,
  EventStatus,
  Provider,
  ValuationStatus,
} from '../constants/data.constants';

// Money representation
export interface Money {
  currency: string;
  amountMinor: bigint | null;
}

// Crypto representation
export interface Crypto {
  assetSymbol: string | null;
  assetAmount: string | null; // decimal string
  valuationStatus: ValuationStatus;
}

// Normalized event
export interface NormalizedEvent {
  id: string;
  userId: string;
  provider: Provider;
  providerEventId: string;
  accountId: string;
  occurredAt: Date;
  ingestedAt: Date;
  kind: EventKind;
  description: string | null;
  fiatCurrency: string | null;
  fiatAmountMinor: bigint | null;
  crypto: Crypto | null;
  canonicalKey: string;
  status: EventStatus;
  supersededById: string | null;
  version: number;
  hashMeaningful: string;
}

// API Response types
export interface WealthSummary {
  userId: string;
  balancesByCurrency: Record<string, string>; // currency -> amountMinor as string
  cryptoPositions: Record<string, string>; // asset -> amount as decimal string
  valuation: {
    status: 'FULL' | 'PARTIAL';
    missingCryptoValuations: number;
  };
  lastUpdatedAt: Date;
}

export interface AccountView {
  accountId: string;
  provider: Provider;
  balancesByCurrency: Record<string, string>;
  cryptoPositions: Record<string, string>;
  lastUpdatedAt: Date;
}

export interface TimelineEvent {
  eventId: string;
  occurredAt: Date;
  provider: Provider;
  accountId: string;
  kind: EventKind;
  description: string | null;
  fiatCurrency: string | null;
  fiatAmountMinor: string | null;
  assetSymbol: string | null;
  assetAmount: string | null;
  status: EventStatus;
}
