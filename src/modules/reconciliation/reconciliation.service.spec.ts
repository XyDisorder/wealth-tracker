import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../db/prisma/prisma.service';
import { ProjectionsService } from '../wealth/projections.service';
import {
  Provider,
  EventKind,
  EventStatus,
  ValuationStatus,
  JobType,
} from '../../common/constants/data.constants';
import { NormalizedEventData } from './types/reconciliation.types';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let prisma: PrismaService;
  let projectionsService: ProjectionsService;

  beforeEach(() => {
    // Create mocks
    prisma = {
      eventHead: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      normalizedEvent: {
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      job: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    } as unknown as PrismaService;

    projectionsService = {
      recomputeUserProjections: vi.fn().mockResolvedValue(undefined),
    } as unknown as ProjectionsService;

    service = new ReconciliationService(prisma, projectionsService);
  });

  const createEventData = (
    overrides?: Partial<NormalizedEventData>,
  ): NormalizedEventData => ({
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
    ...overrides,
  });

  describe('reconcileNormalizedEvent', () => {
    it('should create new event when no existing head exists', async () => {
      const eventData = createEventData();

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-123',
              version: 1,
            }),
          },
          eventHead: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.APPLIED);
      expect(result.action).toBe('APPLIED');
      expect(result.version).toBe(1);
      expect(prisma.eventHead.findUnique).toHaveBeenCalled();
    });

    it('should ignore duplicate event (same hash)', async () => {
      const eventData = createEventData();

      // Compute the hash that will be generated
      const { computeHashMeaningful } =
        await import('./utils/reconciliation.utils');
      const hash = computeHashMeaningful(eventData);

      const existingHead = {
        canonicalKey: 'BANK:user-001:txn-123:acc-01',
        userId: 'user-001',
        latestEventId: 'event-123',
        latestVersion: 1,
        updatedAt: new Date(),
      };

      const existingEvent = {
        id: 'event-123',
        hashMeaningful: hash, // Same hash as new event
        version: 1,
      };

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(existingHead);
      vi.mocked(prisma.normalizedEvent.findUnique).mockResolvedValue(
        existingEvent as any,
      );

      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.IGNORED);
      expect(result.action).toBe('IGNORED');
      expect(result.version).toBe(1);
    });

    it('should handle correction when hash differs (same canonical key)', async () => {
      const eventData = createEventData({
        fiatAmountMinor: BigInt(20000), // Different amount
      });

      const existingHead = {
        canonicalKey: 'BANK:user-001:txn-123:acc-01',
        userId: 'user-001',
        latestEventId: 'event-123',
        latestVersion: 1,
        updatedAt: new Date(),
      };

      const existingEvent = {
        id: 'event-123',
        hashMeaningful: 'old-hash',
        version: 1,
      };

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(existingHead);
      vi.mocked(prisma.normalizedEvent.findUnique).mockResolvedValue(
        existingEvent as any,
      );

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-124',
              version: 2,
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          eventHead: {
            update: vi.fn().mockResolvedValue({}),
          },
          job: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.APPLIED);
      expect(result.action).toBe('CORRECTION');
      expect(result.version).toBe(2);
    });

    it('should throw error when provider is missing', async () => {
      const eventData = createEventData({
        provider: undefined as any,
      });

      await expect(service.reconcileNormalizedEvent(eventData)).rejects.toThrow(
        'Provider is required',
      );
    });

    it('should create new event when head exists but event is missing', async () => {
      const eventData = createEventData();

      const existingHead = {
        canonicalKey: 'BANK:user-001:txn-123:acc-01',
        userId: 'user-001',
        latestEventId: 'event-123',
        latestVersion: 1,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(existingHead);
      vi.mocked(prisma.normalizedEvent.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-124',
              version: 1,
            }),
          },
          eventHead: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.APPLIED);
      expect(result.action).toBe('APPLIED');
    });

    it('should handle crypto events with valuation status', async () => {
      const eventData = createEventData({
        provider: Provider.CRYPTO,
        assetSymbol: 'BTC',
        assetAmount: '0.5',
        valuationStatus: ValuationStatus.VALUED,
        fiatAmountMinor: BigInt(20000),
      });

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-123',
              version: 1,
            }),
          },
          eventHead: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.APPLIED);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should create enrichment job for crypto events without fiat value', async () => {
      const eventData = createEventData({
        provider: Provider.CRYPTO,
        assetSymbol: 'BTC',
        assetAmount: '0.5',
        valuationStatus: ValuationStatus.PENDING,
        fiatAmountMinor: null,
        fiatCurrency: null,
      });

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-123',
              version: 1,
            }),
          },
          eventHead: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      await service.reconcileNormalizedEvent(eventData);

      // Verify enrichment job was created
      expect(prisma.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: JobType.ENRICH_CRYPTO_VALUATION,
            status: 'PENDING',
          }),
        }),
      );
    });

    it('should handle late arrival events (earlier occurredAt)', async () => {
      // Event with earlier date than existing
      const eventData = createEventData({
        occurredAt: new Date('2024-01-01T10:00:00Z'), // Earlier
        providerEventId: 'txn-124',
      });

      const existingHead = {
        canonicalKey: 'BANK:user-001:txn-124:acc-01',
        userId: 'user-001',
        latestEventId: 'event-123',
        latestVersion: 1,
        updatedAt: new Date(),
      };

      const existingEvent = {
        id: 'event-123',
        hashMeaningful: 'different-hash',
        version: 1,
        occurredAt: new Date('2024-01-01T12:00:00Z'), // Later
      };

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(existingHead);
      vi.mocked(prisma.normalizedEvent.findUnique).mockResolvedValue(
        existingEvent as any,
      );

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-124',
              version: 2,
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          eventHead: {
            update: vi.fn().mockResolvedValue({}),
          },
          job: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      const result = await service.reconcileNormalizedEvent(eventData);

      // Late arrival should still be processed as correction
      expect(result.status).toBe(EventStatus.APPLIED);
      expect(result.action).toBe('CORRECTION');
    });

    it('should handle database transaction errors gracefully', async () => {
      const eventData = createEventData();

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.reconcileNormalizedEvent(eventData)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle projection recomputation errors without failing', async () => {
      const eventData = createEventData();

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(null);
      vi.mocked(projectionsService.recomputeUserProjections).mockRejectedValue(
        new Error('Projection error'),
      );

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-123',
              version: 1,
            }),
          },
          eventHead: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      // Should not throw even if projections fail
      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.APPLIED);
      // Projection error should be caught and logged, not thrown
      expect(projectionsService.recomputeUserProjections).toHaveBeenCalled();
    });

    it('should handle events with negative amounts', async () => {
      const eventData = createEventData({
        fiatAmountMinor: BigInt(-5000), // Negative amount (debit)
        kind: EventKind.CASH_DEBIT,
      });

      vi.mocked(prisma.eventHead.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          normalizedEvent: {
            create: vi.fn().mockResolvedValue({
              id: 'event-123',
              version: 1,
            }),
          },
          eventHead: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx as any);
      });

      const result = await service.reconcileNormalizedEvent(eventData);

      expect(result.status).toBe(EventStatus.APPLIED);
    });
  });
});
