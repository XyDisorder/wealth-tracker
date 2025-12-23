import { describe, it, expect } from 'vitest';
import { InsurerAdapter } from './insurer.adapter';
import { EventKind } from '../../../common/constants/data.constants';

describe('InsurerAdapter', () => {
  describe('validateAndNormalize', () => {
    it('should normalize valid insurer premium event', () => {
      const payload = {
        userId: 'user-001',
        insurer: 'AXA',
        transactionId: 'av-2025-001',
        timestamp: 1704110400000, // 2024-01-01T12:00:00Z
        movementType: 'premium',
        amount: 500.5,
        currency: 'EUR',
        policyNumber: 'acc-04',
        description: 'Monthly premium',
      };

      const result = InsurerAdapter.validateAndNormalize(payload);

      expect(result.userId).toBe('user-001');
      expect(result.providerEventId).toBe('av-2025-001');
      expect(result.accountId).toBe('acc-04');
      expect(result.kind).toBe(EventKind.INSURANCE_PREMIUM);
      expect(result.description).toBe('Monthly premium');
      expect(result.fiatCurrency).toBe('EUR');
      expect(result.fiatAmountMinor).toBe(BigInt(50050)); // 500.5 * 100
    });

    it('should default currency to EUR when missing', () => {
      const payload = {
        userId: 'user-001',
        insurer: 'AXA',
        transactionId: 'av-2025-001',
        timestamp: 1704110400000,
        movementType: 'premium',
        amount: 500,
        policyNumber: 'acc-04',
      };

      const result = InsurerAdapter.validateAndNormalize(payload);

      expect(result.fiatCurrency).toBe('EUR');
    });

    it('should handle null description', () => {
      const payload = {
        userId: 'user-001',
        insurer: 'AXA',
        transactionId: 'av-2025-001',
        timestamp: 1704110400000,
        movementType: 'premium',
        amount: 500,
        currency: 'EUR',
        policyNumber: 'acc-04',
      };

      const result = InsurerAdapter.validateAndNormalize(payload);

      expect(result.description).toBeNull();
    });

    it('should handle different movement types', () => {
      const basePayload = {
        userId: 'user-001',
        insurer: 'AXA',
        transactionId: 'av-2025-001',
        timestamp: 1704110400000,
        amount: 500,
        currency: 'EUR',
        policyNumber: 'acc-04',
      };

      // All movement types map to INSURANCE_PREMIUM for now
      const result1 = InsurerAdapter.validateAndNormalize({
        ...basePayload,
        movementType: 'premium',
      });
      expect(result1.kind).toBe(EventKind.INSURANCE_PREMIUM);

      const result2 = InsurerAdapter.validateAndNormalize({
        ...basePayload,
        movementType: 'claim',
      });
      expect(result2.kind).toBe(EventKind.INSURANCE_PREMIUM);
    });

    it('should reject invalid payload', () => {
      const invalidPayload = {
        userId: 'user-001',
        // Missing required fields
      };

      expect(() => {
        InsurerAdapter.validateAndNormalize(invalidPayload);
      }).toThrow();
    });

    it('should handle timestamp as Date object', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const payload = {
        userId: 'user-001',
        insurer: 'AXA',
        transactionId: 'av-2025-001',
        timestamp: date.getTime(), // Zod expects number
        movementType: 'premium',
        amount: 500,
        currency: 'EUR',
        policyNumber: 'acc-04',
      };

      const result = InsurerAdapter.validateAndNormalize(payload);

      expect(result.occurredAt).toBeInstanceOf(Date);
      expect(result.occurredAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });
  });
});
