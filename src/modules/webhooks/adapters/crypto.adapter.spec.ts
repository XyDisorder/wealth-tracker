import { describe, it, expect } from 'vitest';
import { CryptoAdapter } from './crypto.adapter';
import {
  EventKind,
  ValuationStatus,
} from '../../../common/constants/data.constants';

describe('CryptoAdapter', () => {
  describe('validateAndNormalize', () => {
    it('should normalize valid crypto deposit with fiat value', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000, // 2024-01-01T12:00:00Z
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        fiatValue: {
          amount: 20000,
          currency: 'EUR',
        },
        currency: 'EUR',
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.userId).toBe('user-001');
      expect(result.providerEventId).toBe('tx-abc123');
      expect(result.accountId).toBe('wallet-01');
      expect(result.kind).toBe(EventKind.CRYPTO_DEPOSIT);
      expect(result.assetSymbol).toBe('BTC');
      expect(result.assetAmount).toBe('0.5');
      expect(result.fiatCurrency).toBe('EUR');
      expect(result.fiatAmountMinor).toBe(BigInt(2000000)); // 20000 * 100
      expect(result.valuationStatus).toBe(ValuationStatus.VALUED);
    });

    it('should normalize crypto withdrawal', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc124',
        time: 1704110400000,
        type: 'crypto_withdrawal',
        asset: 'ETH',
        amount: 1.5,
        fiatValue: {
          amount: 3000,
          currency: 'USD',
        },
        currency: 'USD',
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.kind).toBe(EventKind.CRYPTO_WITHDRAWAL);
      expect(result.assetSymbol).toBe('ETH');
      expect(result.assetAmount).toBe('1.5');
    });

    it('should set PENDING status when fiat value is missing', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        currency: 'EUR',
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.valuationStatus).toBe(ValuationStatus.PENDING);
      expect(result.fiatAmountMinor).toBeNull();
      expect(result.fiatCurrency).toBe('EUR');
    });

    it('should default currency to EUR when missing', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        fiatValue: {
          amount: 20000,
          // currency missing
        },
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.fiatCurrency).toBe('EUR');
    });

    it('should use currency from fiatValue when available', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        fiatValue: {
          amount: 20000,
          currency: 'USD',
        },
        currency: 'EUR', // Should be ignored
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.fiatCurrency).toBe('USD');
    });

    it('should handle null description', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        fiatValue: {
          amount: 20000,
          currency: 'EUR',
        },
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.description).toBeNull();
    });

    it('should reject invalid payload', () => {
      const invalidPayload = {
        userId: 'user-001',
        // Missing required fields
      };

      expect(() => {
        CryptoAdapter.validateAndNormalize(invalidPayload);
      }).toThrow();
    });

    it('should handle time as epoch milliseconds', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: date.getTime(), // Zod schema expects number (epoch ms)
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        fiatValue: {
          amount: 20000,
          currency: 'EUR',
        },
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(result.occurredAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle very small crypto amounts', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.00000001, // Very small amount
        fiatValue: {
          amount: 0.5,
          currency: 'EUR',
        },
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      // JavaScript toString() converts very small numbers to scientific notation
      // The adapter uses .toString() which may produce "1e-8"
      expect(result.assetAmount).toMatch(/^(0\.00000001|1e-8)$/);
    });

    it('should handle very large crypto amounts', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'ETH',
        amount: 999999.99999999,
        fiatValue: {
          amount: 2000000,
          currency: 'EUR',
        },
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.assetAmount).toBe('999999.99999999');
    });

    it('should handle crypto amount as string', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 1704110400000,
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: '0.5', // String format
        fiatValue: {
          amount: 20000,
          currency: 'EUR',
        },
        walletId: 'wallet-01',
      };

      const result = CryptoAdapter.validateAndNormalize(payload);

      expect(result.assetAmount).toBe('0.5');
    });

    it('should handle invalid time format (creates Invalid Date)', () => {
      const payload = {
        userId: 'user-001',
        platform: 'Coinbase',
        id: 'tx-abc123',
        time: 'invalid-time', // Zod accepts string and transforms to Date
        type: 'crypto_deposit',
        asset: 'BTC',
        amount: 0.5,
        walletId: 'wallet-01',
      };

      // Zod transforms invalid time strings to Invalid Date objects (doesn't throw)
      const result = CryptoAdapter.validateAndNormalize(payload);
      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(isNaN(result.occurredAt.getTime())).toBe(true); // Invalid Date
    });
  });
});

