import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../db/prisma/prisma.service';
import { EventStatus } from '../../common/constants/data.constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for computing materialized views (projections)
 * Recomputes user summaries, account views, and timeline from normalized events
 */
@Injectable()
export class ProjectionsService {
  private readonly logger = new Logger(ProjectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recomputes all projections for a user
   * Called after reconciliation or enrichment
   */
  async recomputeUserProjections(userId: string): Promise<void> {
    this.logger.log(`Recomputing projections for user ${userId}`);

    // Get all APPLIED event heads for this user
    const eventHeads = await this.prisma.eventHead.findMany({
      where: {
        userId,
      },
    });

    // Get all latest events (APPLIED only)
    const eventIds = eventHeads.map((head) => head.latestEventId);
    const events =
      eventIds.length > 0
        ? await this.prisma.normalizedEvent.findMany({
            where: {
              id: { in: eventIds },
              status: EventStatus.APPLIED,
            },
          })
        : [];

    // Recompute user summary
    await this.recomputeUserSummary(userId, events);

    // Recompute account views
    await this.recomputeAccountViews(userId, events);

    // Recompute timeline
    await this.recomputeTimeline(userId, events);
  }

  /**
   * Recomputes user summary view
   * Creates empty summary if no events exist
   */
  private async recomputeUserSummary(
    userId: string,
    events: Array<{
      fiatCurrency: string | null;
      fiatAmountMinor: string | null;
      assetSymbol: string | null;
      assetAmount: string | null;
      valuationStatus: string | null;
    }>,
  ): Promise<void> {
    // Aggregate balances by currency
    const balancesByCurrency: Record<string, bigint> = {};
    const cryptoPositions: Record<string, string> = {};
    let missingCryptoValuations = 0;

    for (const event of events) {
      // Fiat balances (only valued amounts)
      if (event.fiatCurrency && event.fiatAmountMinor) {
        const currency = event.fiatCurrency;
        const amount = BigInt(event.fiatAmountMinor);
        balancesByCurrency[currency] =
          (balancesByCurrency[currency] || BigInt(0)) + amount;
      }

      // Crypto positions
      if (event.assetSymbol && event.assetAmount) {
        const asset = event.assetSymbol;
        const currentAmount = parseFloat(cryptoPositions[asset] || '0');
        const eventAmount = parseFloat(event.assetAmount);
        cryptoPositions[asset] = (currentAmount + eventAmount).toString();

        // Count missing valuations
        if (event.valuationStatus !== 'VALUED') {
          missingCryptoValuations++;
        }
      }
    }

    // Convert bigint to string for JSON storage
    const balancesByCurrencyString: Record<string, string> = {};
    for (const [currency, amount] of Object.entries(balancesByCurrency)) {
      balancesByCurrencyString[currency] = amount.toString();
    }

    // Determine valuation status
    // If no events, status is FULL (no missing valuations)
    const valuationStatus = missingCryptoValuations === 0 ? 'FULL' : 'PARTIAL';

    // Upsert user summary (always create/update, even if empty)
    await this.prisma.userSummaryView.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        balancesByCurrency: JSON.stringify(balancesByCurrencyString),
        cryptoPositions: JSON.stringify(cryptoPositions),
        valuationStatus,
        missingCryptoValuations,
      },
      update: {
        balancesByCurrency: JSON.stringify(balancesByCurrencyString),
        cryptoPositions: JSON.stringify(cryptoPositions),
        valuationStatus,
        missingCryptoValuations,
      },
    });
  }

  /**
   * Recomputes account views for all accounts of a user
   */
  private async recomputeAccountViews(
    userId: string,
    events: Array<{
      accountId: string;
      provider: string;
      fiatCurrency: string | null;
      fiatAmountMinor: string | null;
      assetSymbol: string | null;
      assetAmount: string | null;
    }>,
  ): Promise<void> {
    // Group events by account
    const accountEvents: Record<
      string,
      Array<{
        fiatCurrency: string | null;
        fiatAmountMinor: string | null;
        assetSymbol: string | null;
        assetAmount: string | null;
        provider: string;
      }>
    > = {};

    for (const event of events) {
      if (!accountEvents[event.accountId]) {
        accountEvents[event.accountId] = [];
      }
      accountEvents[event.accountId].push({
        fiatCurrency: event.fiatCurrency,
        fiatAmountMinor: event.fiatAmountMinor,
        assetSymbol: event.assetSymbol,
        assetAmount: event.assetAmount,
        provider: event.provider,
      });
    }

    // Recompute each account view
    for (const [accountId, accountEventList] of Object.entries(accountEvents)) {
      const provider = accountEventList[0]?.provider || 'UNKNOWN';
      const balancesByCurrency: Record<string, bigint> = {};
      const cryptoPositions: Record<string, string> = {};

      for (const event of accountEventList) {
        // Fiat balances
        if (event.fiatCurrency && event.fiatAmountMinor) {
          const currency = event.fiatCurrency;
          const amount = BigInt(event.fiatAmountMinor);
          balancesByCurrency[currency] =
            (balancesByCurrency[currency] || BigInt(0)) + amount;
        }

        // Crypto positions
        if (event.assetSymbol && event.assetAmount) {
          const asset = event.assetSymbol;
          const currentAmount = parseFloat(cryptoPositions[asset] || '0');
          const eventAmount = parseFloat(event.assetAmount);
          cryptoPositions[asset] = (currentAmount + eventAmount).toString();
        }
      }

      // Convert bigint to string
      const balancesByCurrencyString: Record<string, string> = {};
      for (const [currency, amount] of Object.entries(balancesByCurrency)) {
        balancesByCurrencyString[currency] = amount.toString();
      }

      // Upsert account view
      // Note: Prisma doesn't support composite unique constraints in upsert where clause
      // We need to use findFirst + create/update pattern
      const existing = await this.prisma.accountView.findFirst({
        where: {
          userId,
          accountId,
        },
      });

      if (existing) {
        await this.prisma.accountView.update({
          where: {
            id: existing.id,
          },
          data: {
            balancesByCurrency: JSON.stringify(balancesByCurrencyString),
            cryptoPositions: JSON.stringify(cryptoPositions),
          },
        });
      } else {
        await this.prisma.accountView.create({
          data: {
            id: uuidv4(),
            userId,
            accountId,
            provider,
            balancesByCurrency: JSON.stringify(balancesByCurrencyString),
            cryptoPositions: JSON.stringify(cryptoPositions),
          },
        });
      }
    }
  }

  /**
   * Recomputes timeline view for a user
   */
  private async recomputeTimeline(
    userId: string,
    events: Array<{
      id: string;
      occurredAt: Date;
      provider: string;
      accountId: string;
      kind: string;
      description: string | null;
      fiatCurrency: string | null;
      fiatAmountMinor: string | null;
      assetSymbol: string | null;
      assetAmount: string | null;
      status: string;
    }>,
  ): Promise<void> {
    // Delete existing timeline entries for this user
    await this.prisma.timelineView.deleteMany({
      where: {
        userId,
      },
    });

    // If no events, timeline is empty (already deleted above)
    if (events.length === 0) {
      return;
    }

    // Sort events by occurredAt (descending)
    const sortedEvents = [...events].sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
    );

    // Create timeline entries
    const timelineEntries = sortedEvents.map((event) => ({
      id: uuidv4(),
      userId,
      eventId: event.id,
      occurredAt: event.occurredAt,
      provider: event.provider,
      accountId: event.accountId,
      kind: event.kind,
      description: event.description,
      fiatCurrency: event.fiatCurrency,
      fiatAmountMinor: event.fiatAmountMinor,
      assetSymbol: event.assetSymbol,
      assetAmount: event.assetAmount,
      status: event.status,
    }));

    // Batch insert
    await this.prisma.timelineView.createMany({
      data: timelineEntries,
    });
  }
}
