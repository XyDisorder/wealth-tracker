import { describe, it, expect } from 'vitest';
import { BankAdapter } from './bank.adapter';
import { EventKind } from '../../../common/constants/data.constants';

describe('BankAdapter', () => {
  describe('validateAndNormalize', () => {
    it('should normalize valid bank credit event', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'credit',
        amount: 1000.5,
        currency: 'EUR',
        account: 'acc-01',
        description: 'Salary transfer',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.userId).toBe('user-001');
      expect(result.providerEventId).toBe('txn-12345');
      expect(result.accountId).toBe('acc-01');
      expect(result.kind).toBe(EventKind.CASH_CREDIT);
      expect(result.description).toBe('Salary transfer');
      expect(result.fiatCurrency).toBe('EUR');
      expect(result.fiatAmountMinor).toBe(BigInt(100050)); // 1000.5 * 100
    });

    it('should normalize valid bank debit event', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12346',
        date: '2024-01-01T12:00:00Z',
        type: 'debit',
        amount: 500.25,
        currency: 'USD',
        account: 'acc-01',
        description: 'Purchase',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.kind).toBe(EventKind.CASH_DEBIT);
      expect(result.fiatCurrency).toBe('USD');
      expect(result.fiatAmountMinor).toBe(BigInt(50025)); // 500.25 * 100
    });

    it('should default currency to EUR when missing', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'credit',
        amount: 1000,
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.fiatCurrency).toBe('EUR');
    });

    it('should handle null description', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.description).toBeNull();
    });

    it('should handle zero amount', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'credit',
        amount: 0,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      // Zero amount results in null (as per adapter logic: validated.amount ? ... : null)
      expect(result.fiatAmountMinor).toBeNull();
    });

    it('should reject invalid payload', () => {
      const invalidPayload = {
        userId: 'user-001',
        // Missing required fields
      };

      expect(() => {
        BankAdapter.validateAndNormalize(invalidPayload);
      }).toThrow();
    });

    it('should handle date as Date object', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: new Date('2024-01-01T12:00:00Z'),
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(result.occurredAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle negative amounts (debits)', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'debit',
        amount: -500.5,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.kind).toBe(EventKind.CASH_DEBIT);
      expect(result.fiatAmountMinor).toBe(BigInt(-50050)); // -500.5 * 100
    });

    it('should handle very large amounts', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'credit',
        amount: 999999999.99,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.fiatAmountMinor).toBe(BigInt(99999999999)); // Large amount
    });

    it('should handle special characters in description', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '2024-01-01T12:00:00Z',
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
        description: 'Virement avec caractères spéciaux: éàù€$',
      };

      const result = BankAdapter.validateAndNormalize(payload);

      expect(result.description).toBe(
        'Virement avec caractères spéciaux: éàù€$',
      );
    });

    it('should handle invalid date format (creates Invalid Date)', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: 'invalid-date',
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
      };

      // Zod transforms invalid dates to Invalid Date objects (doesn't throw)
      const result = BankAdapter.validateAndNormalize(payload);
      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(isNaN(result.occurredAt.getTime())).toBe(true); // Invalid Date
    });

    it('should handle numeric timestamp in seconds', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: 1704110400, // 2024-01-01T12:00:00Z in seconds
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);
      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(result.occurredAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle numeric timestamp in milliseconds', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: 1704110400000, // 2024-01-01T12:00:00Z in milliseconds
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);
      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(result.occurredAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle string timestamp in seconds', () => {
      const payload = {
        userId: 'user-001',
        bankId: 'BNP',
        txnId: 'txn-12345',
        date: '1704110400', // String representation of seconds
        type: 'credit',
        amount: 1000,
        currency: 'EUR',
        account: 'acc-01',
      };

      const result = BankAdapter.validateAndNormalize(payload);
      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(result.occurredAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });
  });
});
