import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../db/prisma/prisma.service';
import { ValuationStatus } from '../../../common/constants/data.constants';
import { ProjectionsService } from '../../wealth/projections.service';

/**
 * Handler for ENRICH_CRYPTO_VALUATION jobs
 * Enriches crypto events with fiat valuation
 */
@Injectable()
export class EnrichCryptoValuationHandler {
  private readonly logger = new Logger(EnrichCryptoValuationHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectionsService: ProjectionsService,
  ) {}

  /**
   * Handles an ENRICH_CRYPTO_VALUATION job
   */
  async handle(jobPayload: { normalizedEventId: string }): Promise<void> {
    const { normalizedEventId } = jobPayload;

    this.logger.log(
      `Enriching crypto valuation for event ${normalizedEventId}`,
    );

    // Fetch normalized event
    const event = await this.prisma.normalizedEvent.findUnique({
      where: { id: normalizedEventId },
    });

    if (!event) {
      throw new Error(`Normalized event ${normalizedEventId} not found`);
    }

    if (!event.assetSymbol || !event.assetAmount) {
      throw new Error(
        `Event ${normalizedEventId} is not a crypto event or missing asset data`,
      );
    }

    if (event.valuationStatus === ValuationStatus.VALUED) {
      this.logger.warn(
        `Event ${normalizedEventId} is already valued, skipping`,
      );
      return;
    }

    // Get price (for prototype, use mock/deterministic pricing)
    const price = await this.getAssetPrice(
      event.assetSymbol,
      event.fiatCurrency || 'EUR',
      event.occurredAt,
    );

    if (!price) {
      this.logger.warn(
        `No price found for ${event.assetSymbol} in ${event.fiatCurrency || 'EUR'}`,
      );
      return;
    }

    // Calculate fiat amount
    const assetAmount = parseFloat(event.assetAmount);
    const priceMinor = BigInt(price.priceMinor);
    // Multiply assetAmount by priceMinor, then divide by 100 to get minor units
    // For simplicity, we'll use a basic calculation
    const fiatAmountMinor = BigInt(
      Math.round((assetAmount * Number(priceMinor)) / 100),
    );

    // Update event
    await this.prisma.normalizedEvent.update({
      where: { id: normalizedEventId },
      data: {
        fiatAmountMinor: fiatAmountMinor.toString(),
        fiatCurrency: price.fiatCurrency,
        valuationStatus: ValuationStatus.VALUED,
      },
    });

    this.logger.log(
      `Enriched event ${normalizedEventId} with fiat value: ${fiatAmountMinor.toString()} ${price.fiatCurrency}`,
    );

    // Recompute projections for the user (async, don't wait to avoid blocking)
    this.projectionsService
      .recomputeUserProjections(event.userId)
      .catch((error) => {
        this.logger.error(
          `Failed to recompute projections for user ${event.userId}`,
          error,
        );
      });
  }

  /**
   * Gets asset price from database or mock
   * For prototype: uses deterministic mock pricing
   */
  private async getAssetPrice(
    assetSymbol: string,
    fiatCurrency: string,
    asOf: Date,
  ): Promise<{ priceMinor: string; fiatCurrency: string } | null> {
    // Try to get from database first
    const price = await this.prisma.assetPrice.findFirst({
      where: {
        assetSymbol,
        fiatCurrency,
        asOf: {
          lte: asOf,
        },
      },
      orderBy: {
        asOf: 'desc',
      },
    });

    if (price) {
      return {
        priceMinor: price.priceMinor,
        fiatCurrency: price.fiatCurrency,
      };
    }

    // Mock pricing for prototype (deterministic)
    // In production, this would fetch from an external API
    const mockPrices: Record<string, Record<string, number>> = {
      BTC: { EUR: 40000, USD: 43000 },
      ETH: { EUR: 2500, USD: 2700 },
      USDT: { EUR: 0.92, USD: 1.0 },
    };

    const mockPrice = mockPrices[assetSymbol]?.[fiatCurrency];
    if (mockPrice) {
      // Convert to minor units (2 decimal places)
      const priceMinor = BigInt(Math.round(mockPrice * 100));
      return {
        priceMinor: priceMinor.toString(),
        fiatCurrency,
      };
    }

    return null;
  }
}
