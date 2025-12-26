import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../db/prisma/prisma.service';
import {
  EventStatus,
  ValuationStatus,
  JobType,
} from '../../common/constants/data.constants';
import {
  computeCanonicalKey,
  computeHashMeaningful,
} from './utils/reconciliation.utils';
import {
  NormalizedEventData,
  ReconciliationResult,
} from './types/reconciliation.types';
import { ProjectionsService } from '../wealth/projections.service';
import { v4 as uuidv4 } from 'uuid';
import { safeJsonStringify } from '../../common/utils';

/**
 * Service for event reconciliation
 * Handles deduplication, corrections, and late arrivals
 *
 * Note: Uses forwardRef to resolve circular dependency with ProjectionsService.
 * This is necessary because:
 * - ReconciliationService needs ProjectionsService to recompute projections after reconciliation
 * - ProjectionsService needs ReconciliationService to access normalized events
 * The circular dependency is resolved at runtime via NestJS dependency injection.
 */
@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ProjectionsService))
    private readonly projectionsService: ProjectionsService,
  ) {}

  /**
   * Reconciles a normalized event
   * Returns the reconciliation result with status and action
   */
  async reconcileNormalizedEvent(
    eventData: NormalizedEventData,
  ): Promise<ReconciliationResult> {
    // Validate provider is present
    if (!eventData.provider) {
      throw new Error('Provider is required in normalized event data');
    }

    const canonicalKey = computeCanonicalKey(
      eventData.provider,
      eventData.userId,
      eventData.providerEventId,
      eventData.accountId,
    );

    const hashMeaningful = computeHashMeaningful(eventData);

    // Check for existing event head
    const existingHead = await this.prisma.eventHead.findUnique({
      where: {
        canonicalKey,
      },
    });

    // If no existing head, create new event
    if (!existingHead) {
      return await this.createNewEvent(eventData, canonicalKey, hashMeaningful);
    }

    // Get the latest event
    const latestEvent = await this.prisma.normalizedEvent.findUnique({
      where: {
        id: existingHead.latestEventId,
      },
    });

    if (!latestEvent) {
      // Head exists but event is missing, create new
      return await this.createNewEvent(eventData, canonicalKey, hashMeaningful);
    }

    // Check if duplicate (same hash)
    if (latestEvent.hashMeaningful === hashMeaningful) {
      this.logger.debug(
        `Duplicate event detected for canonicalKey: ${canonicalKey}`,
      );
      return {
        eventId: latestEvent.id,
        status: EventStatus.IGNORED,
        action: 'IGNORED',
        version: latestEvent.version,
      };
    }

    // Different hash = correction/contradiction
    return await this.handleCorrection(
      eventData,
      canonicalKey,
      hashMeaningful,
      latestEvent,
    );
  }

  /**
   * Creates a new normalized event
   */
  private async createNewEvent(
    eventData: NormalizedEventData,
    canonicalKey: string,
    hashMeaningful: string,
  ): Promise<ReconciliationResult> {
    const eventId = uuidv4();

    await this.prisma.$transaction(async (tx) => {
      // Create normalized event
      await tx.normalizedEvent.create({
        data: {
          id: eventId,
          userId: eventData.userId,
          provider: eventData.provider, // Must be included
          providerEventId: eventData.providerEventId,
          accountId: eventData.accountId,
          occurredAt: eventData.occurredAt,
          kind: eventData.kind,
          description: eventData.description,
          fiatCurrency: eventData.fiatCurrency,
          fiatAmountMinor: eventData.fiatAmountMinor?.toString() || null,
          assetSymbol: eventData.assetSymbol || null,
          assetAmount: eventData.assetAmount || null,
          valuationStatus: eventData.valuationStatus || null,
          canonicalKey,
          status: EventStatus.APPLIED,
          version: 1,
          hashMeaningful,
        },
      });

      // Create or update event head
      await tx.eventHead.upsert({
        where: {
          canonicalKey,
        },
        create: {
          canonicalKey,
          userId: eventData.userId,
          latestEventId: eventId,
          latestVersion: 1,
        },
        update: {
          latestEventId: eventId,
          latestVersion: 1,
        },
      });
    });

    // If crypto without fiat value, create enrichment job
    if (
      eventData.assetSymbol &&
      eventData.valuationStatus === ValuationStatus.PENDING
    ) {
      await this.createEnrichmentJob(eventId);
    }

    // Recompute projections (async, don't wait to avoid blocking)
    this.projectionsService
      .recomputeUserProjections(eventData.userId)
      .catch((error) => {
        this.logger.error(
          `Failed to recompute projections for user ${eventData.userId}`,
          error,
        );
      });

    return {
      eventId,
      status: EventStatus.APPLIED,
      action: 'APPLIED',
      version: 1,
    };
  }

  /**
   * Handles correction/contradiction
   * Marks previous event as SUPERSEDED and creates new version
   */
  private async handleCorrection(
    eventData: NormalizedEventData,
    canonicalKey: string,
    hashMeaningful: string,
    previousEvent: {
      id: string;
      version: number;
    },
  ): Promise<ReconciliationResult> {
    const newEventId = uuidv4();
    const newVersion = previousEvent.version + 1;

    await this.prisma.$transaction(async (tx) => {
      // Mark previous event as SUPERSEDED
      await tx.normalizedEvent.update({
        where: {
          id: previousEvent.id,
        },
        data: {
          status: EventStatus.SUPERSEDED,
          supersededById: newEventId,
        },
      });

      // Create new event with incremented version
      await tx.normalizedEvent.create({
        data: {
          id: newEventId,
          userId: eventData.userId,
          provider: eventData.provider,
          providerEventId: eventData.providerEventId,
          accountId: eventData.accountId,
          occurredAt: eventData.occurredAt,
          kind: eventData.kind,
          description: eventData.description,
          fiatCurrency: eventData.fiatCurrency,
          fiatAmountMinor: eventData.fiatAmountMinor?.toString() || null,
          assetSymbol: eventData.assetSymbol || null,
          assetAmount: eventData.assetAmount || null,
          valuationStatus: eventData.valuationStatus || null,
          canonicalKey,
          status: EventStatus.APPLIED,
          version: newVersion,
          hashMeaningful,
        },
      });

      // Update event head
      await tx.eventHead.update({
        where: {
          canonicalKey,
        },
        data: {
          latestEventId: newEventId,
          latestVersion: newVersion,
        },
      });
    });

    // If crypto without fiat value, create enrichment job
    if (
      eventData.assetSymbol &&
      eventData.valuationStatus === ValuationStatus.PENDING
    ) {
      await this.createEnrichmentJob(newEventId);
    }

    // Recompute projections (async, don't wait to avoid blocking)
    this.projectionsService
      .recomputeUserProjections(eventData.userId)
      .catch((error) => {
        this.logger.error(
          `Failed to recompute projections for user ${eventData.userId}`,
          error,
        );
      });

    return {
      eventId: newEventId,
      status: EventStatus.APPLIED,
      action: 'CORRECTION',
      previousEventId: previousEvent.id,
      version: newVersion,
    };
  }

  /**
   * Creates a crypto valuation enrichment job
   */
  private async createEnrichmentJob(normalizedEventId: string): Promise<void> {
    await this.prisma.job.create({
      data: {
        id: uuidv4(),
        type: JobType.ENRICH_CRYPTO_VALUATION,
        payload: safeJsonStringify({ normalizedEventId }),
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Created enrichment job for normalized event ${normalizedEventId}`,
    );
  }
}
