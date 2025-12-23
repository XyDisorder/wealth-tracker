import { describe, it, expect } from 'vitest';
import {
  Provider,
  EventKind,
  ValuationStatus,
} from '../../../common/constants/data.constants';
import {
  computeCanonicalKey,
  computeHashMeaningful,
} from './reconciliation.utils';

describe('Reconciliation Utils', () => {
  describe('computeCanonicalKey', () => {
    it('should generate canonical key with correct format', () => {
      const key = computeCanonicalKey(
        Provider.BANK,
        'user-001',
        'txn-123',
        'acc-01',
      );

      expect(key).toBe('BANK:user-001:txn-123:acc-01');
    });

    it('should handle different providers', () => {
      expect(
        computeCanonicalKey(Provider.CRYPTO, 'user-001', 'tx-abc', 'wallet-01'),
      ).toBe('CRYPTO:user-001:tx-abc:wallet-01');

      expect(
        computeCanonicalKey(
          Provider.INSURER,
          'user-002',
          'av-001',
          'policy-01',
        ),
      ).toBe('INSURER:user-002:av-001:policy-01');
    });

    it('should be deterministic for same inputs', () => {
      const key1 = computeCanonicalKey(
        Provider.BANK,
        'user-001',
        'txn-123',
        'acc-01',
      );
      const key2 = computeCanonicalKey(
        Provider.BANK,
        'user-001',
        'txn-123',
        'acc-01',
      );

      expect(key1).toBe(key2);
    });
  });

  describe('computeHashMeaningful', () => {
    it('should generate same hash for identical events', () => {
      const event1 = {
        userId: 'user-001',
        provider: Provider.BANK,
        providerEventId: 'txn-123',
        accountId: 'acc-01',
        occurredAt: new Date('2024-01-01T12:00:00Z'),
        kind: EventKind.CASH_CREDIT,
        description: 'Test transaction',
        fiatCurrency: 'EUR',
        fiatAmountMinor: BigInt(10000),
        assetSymbol: null,
        assetAmount: null,
        valuationStatus: null,
      };

      const event2 = { ...event1 };

      const hash1 = computeHashMeaningful(event1);
      const hash2 = computeHashMeaningful(event2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different amounts', () => {
      const baseEvent = {
        userId: 'user-001',
        provider: Provider.BANK,
        providerEventId: 'txn-123',
        accountId: 'acc-01',
        occurredAt: new Date('2024-01-01T12:00:00Z'),
        kind: EventKind.CASH_CREDIT,
        description: 'Test transaction',
        fiatCurrency: 'EUR',
        assetSymbol: null,
        assetAmount: null,
        valuationStatus: null,
      };

      const event1 = { ...baseEvent, fiatAmountMinor: BigInt(10000) };
      const event2 = { ...baseEvent, fiatAmountMinor: BigInt(20000) };

      const hash1 = computeHashMeaningful(event1);
      const hash2 = computeHashMeaningful(event2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hash for different dates', () => {
      const baseEvent = {
        userId: 'user-001',
        provider: Provider.BANK,
        providerEventId: 'txn-123',
        accountId: 'acc-01',
        kind: EventKind.CASH_CREDIT,
        description: 'Test transaction',
        fiatCurrency: 'EUR',
        fiatAmountMinor: BigInt(10000),
        assetSymbol: null,
        assetAmount: null,
        valuationStatus: null,
      };

      const event1 = {
        ...baseEvent,
        occurredAt: new Date('2024-01-01T12:00:00Z'),
      };
      const event2 = {
        ...baseEvent,
        occurredAt: new Date('2024-01-02T12:00:00Z'),
      };

      const hash1 = computeHashMeaningful(event1);
      const hash2 = computeHashMeaningful(event2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle crypto events with asset fields', () => {
      const event = {
        userId: 'user-001',
        provider: Provider.CRYPTO,
        providerEventId: 'tx-abc',
        accountId: 'wallet-01',
        occurredAt: new Date('2024-01-01T12:00:00Z'),
        kind: EventKind.CRYPTO_DEPOSIT,
        description: null,
        fiatCurrency: 'EUR',
        fiatAmountMinor: BigInt(50000),
        assetSymbol: 'BTC',
        assetAmount: '0.5',
        valuationStatus: ValuationStatus.VALUED,
      };

      const hash = computeHashMeaningful(event);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle null values correctly', () => {
      const event = {
        userId: 'user-001',
        provider: Provider.BANK,
        providerEventId: 'txn-123',
        accountId: 'acc-01',
        occurredAt: new Date('2024-01-01T12:00:00Z'),
        kind: EventKind.CASH_CREDIT,
        description: null,
        fiatCurrency: null,
        fiatAmountMinor: null,
        assetSymbol: null,
        assetAmount: null,
        valuationStatus: null,
      };

      const hash = computeHashMeaningful(event);
      expect(hash).toBeDefined();
    });
  });
});
