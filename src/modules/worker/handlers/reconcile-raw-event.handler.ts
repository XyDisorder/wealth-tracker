import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma/prisma.service';
import { ReconciliationService } from '../../reconciliation/reconciliation.service';
import { BankAdapter } from '../../webhooks/adapters/bank.adapter';
import { CryptoAdapter } from '../../webhooks/adapters/crypto.adapter';
import { InsurerAdapter } from '../../webhooks/adapters/insurer.adapter';
import {
  Provider,
  EventKind,
  ValuationStatus,
} from '../../../common/constants/data.constants';
import { safeJsonParse } from '../../../common/utils';

/**
 * Handler for RECONCILE_RAW_EVENT jobs
 * Processes raw events: normalizes and reconciles them
 */
@Injectable()
export class ReconcileRawEventHandler {
  private readonly logger = new Logger(ReconcileRawEventHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  /**
   * Handles a RECONCILE_RAW_EVENT job
   */
  async handle(jobPayload: { rawEventId: string }): Promise<void> {
    const { rawEventId } = jobPayload;

    this.logger.log(`Processing raw event ${rawEventId}`);

    // Fetch raw event
    const rawEvent = await this.prisma.rawEvent.findUnique({
      where: { id: rawEventId },
    });

    if (!rawEvent) {
      throw new Error(`Raw event ${rawEventId} not found`);
    }

    // Parse payload
    const payload = safeJsonParse(rawEvent.payload);

    // Normalize based on provider
    let normalizedData:
      | ReturnType<typeof BankAdapter.validateAndNormalize>
      | ReturnType<typeof CryptoAdapter.validateAndNormalize>
      | ReturnType<typeof InsurerAdapter.validateAndNormalize>;
    try {
      if (rawEvent.provider === (Provider.BANK as string)) {
        normalizedData = BankAdapter.validateAndNormalize(payload);
      } else if (rawEvent.provider === (Provider.CRYPTO as string)) {
        normalizedData = CryptoAdapter.validateAndNormalize(payload);
      } else if (rawEvent.provider === (Provider.INSURER as string)) {
        normalizedData = InsurerAdapter.validateAndNormalize(payload);
      } else {
        throw new Error(`Unknown provider: ${rawEvent.provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to normalize raw event ${rawEventId}`, error);
      throw error;
    }

    // Add provider to normalized data (adapters don't return it)
    // Ensure provider is a valid Provider enum value
    const provider = rawEvent.provider as Provider;
    if (!provider || !Object.values(Provider).includes(provider)) {
      throw new Error(
        `Invalid provider: ${rawEvent.provider}. Expected one of: ${Object.values(Provider).join(', ')}`,
      );
    }

    // Type assertion for normalizedDataWithProvider to match NormalizedEventData
    // The adapters return EventKind but TypeScript infers it as string
    // Ensure all required fields are present
    const normalizedDataWithProvider: {
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
    } = {
      ...normalizedData,
      provider,
      kind: normalizedData.kind as EventKind,
      assetSymbol: 'assetSymbol' in normalizedData ? normalizedData.assetSymbol ?? null : null,
      assetAmount: 'assetAmount' in normalizedData ? normalizedData.assetAmount ?? null : null,
      valuationStatus:
        'valuationStatus' in normalizedData
          ? (normalizedData.valuationStatus as ValuationStatus | null)
          : null,
    };

    this.logger.debug(
      `Normalized data with provider: ${provider} for event ${rawEventId}`,
    );

    // Reconcile normalized event
    const result = await this.reconciliationService.reconcileNormalizedEvent(
      normalizedDataWithProvider,
    );

    this.logger.log(
      `Reconciled event ${rawEventId} -> ${result.eventId} (${result.action})`,
    );

    // Note: Projection recomputation will be handled separately
    // This keeps the handler focused on reconciliation only
  }
}
