import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma/prisma.service';
import { ReconciliationService } from '../../reconciliation/reconciliation.service';
import { JobType } from '../../../common/constants/data.constants';
import { BankAdapter } from '../../webhooks/adapters/bank.adapter';
import { CryptoAdapter } from '../../webhooks/adapters/crypto.adapter';
import { InsurerAdapter } from '../../webhooks/adapters/insurer.adapter';
import { Provider } from '../../../common/constants/data.constants';

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
    const payload = JSON.parse(rawEvent.payload);

    // Normalize based on provider
    let normalizedData;
    try {
      switch (rawEvent.provider) {
        case Provider.BANK:
          normalizedData = BankAdapter.validateAndNormalize(payload);
          break;
        case Provider.CRYPTO:
          normalizedData = CryptoAdapter.validateAndNormalize(payload);
          break;
        case Provider.INSURER:
          normalizedData = InsurerAdapter.validateAndNormalize(payload);
          break;
        default:
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

    const normalizedDataWithProvider = {
      ...normalizedData,
      provider,
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
