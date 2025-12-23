import {
  Provider,
  EventKind,
  EventStatus,
  ValuationStatus,
} from '../../../common/constants/data.constants';

/**
 * Normalized event data for reconciliation
 */
export interface NormalizedEventData {
  userId: string;
  provider: Provider;
  providerEventId: string;
  accountId: string;
  occurredAt: Date;
  kind: EventKind;
  description: string | null;
  fiatCurrency: string | null;
  fiatAmountMinor: bigint | null;
  assetSymbol: string | null;
  assetAmount: string | null;
  valuationStatus: ValuationStatus | null;
}

/**
 * Reconciliation result
 */
export interface ReconciliationResult {
  eventId: string;
  status: EventStatus;
  action: 'APPLIED' | 'IGNORED' | 'SUPERSEDED' | 'CORRECTION';
  previousEventId?: string;
  version: number;
}
