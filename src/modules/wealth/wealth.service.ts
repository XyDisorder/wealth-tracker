import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../db/prisma/prisma.service';
import { NotFoundError } from '../../common/errors';
import { WealthSummary, AccountView, TimelineEvent } from '../../common/types';
import {
  Provider,
  EventKind,
  EventStatus,
} from '../../common/constants/data.constants';
import { safeJsonParse } from '../../common/utils';

/**
 * Service for querying wealth data
 * Reads from materialized views (projections)
 */
@Injectable()
export class WealthService {
  private readonly logger = new Logger(WealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gets wealth summary for a user
   * Returns empty summary if no projections exist yet
   */
  async getWealthSummary(userId: string): Promise<WealthSummary> {
    const summary = await this.prisma.userSummaryView.findUnique({
      where: {
        userId,
      },
    });

    if (!summary) {
      // Return empty summary if no projections exist yet
      return {
        userId,
        balancesByCurrency: {},
        cryptoPositions: {},
        valuation: {
          status: 'FULL',
          missingCryptoValuations: 0,
        },
        lastUpdatedAt: new Date(),
      };
    }

    // Parse JSON fields with error handling
    let balancesByCurrency: Record<string, string> = {};
    let cryptoPositions: Record<string, string> = {};

    try {
      balancesByCurrency = safeJsonParse(summary.balancesByCurrency) || {};
    } catch (error) {
      this.logger.warn(
        `Invalid balancesByCurrency JSON for user ${userId}, using empty object`,
        error,
      );
    }

    try {
      cryptoPositions = safeJsonParse(summary.cryptoPositions) || {};
    } catch (error) {
      this.logger.warn(
        `Invalid cryptoPositions JSON for user ${userId}, using empty object`,
        error,
      );
    }

    return {
      userId: summary.userId,
      balancesByCurrency,
      cryptoPositions,
      valuation: {
        status: summary.valuationStatus as 'FULL' | 'PARTIAL',
        missingCryptoValuations: summary.missingCryptoValuations,
      },
      lastUpdatedAt: summary.lastUpdatedAt,
    };
  }

  /**
   * Gets account views for a user
   */
  async getAccountViews(userId: string): Promise<AccountView[]> {
    const accounts = await this.prisma.accountView.findMany({
      where: {
        userId,
      },
      orderBy: {
        lastUpdatedAt: 'desc',
      },
    });

    return accounts.map((account) => {
      let balancesByCurrency: Record<string, string> = {};
      let cryptoPositions: Record<string, string> = {};

      try {
        balancesByCurrency = safeJsonParse(account.balancesByCurrency) || {};
      } catch (error) {
        this.logger.warn(
          `Invalid balancesByCurrency JSON for account ${account.accountId}, using empty object`,
          error,
        );
      }

      try {
        cryptoPositions = safeJsonParse(account.cryptoPositions) || {};
      } catch (error) {
        this.logger.warn(
          `Invalid cryptoPositions JSON for account ${account.accountId}, using empty object`,
          error,
        );
      }

      return {
        accountId: account.accountId,
        provider: account.provider as Provider,
        balancesByCurrency,
        cryptoPositions,
        lastUpdatedAt: account.lastUpdatedAt,
      };
    });
  }

  /**
   * Gets timeline events for a user with cursor pagination
   */
  async getTimeline(
    userId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<{
    events: TimelineEvent[];
    nextCursor?: string;
  }> {
    // Parse cursor if provided
    let cursorDate: Date | undefined;
    let cursorId: string | undefined;

    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [dateStr, id] = decoded.split('|');
        cursorDate = new Date(dateStr);
        cursorId = id;
      } catch (error) {
        this.logger.warn(`Invalid cursor: ${cursor}`);
      }
    }

    // Build where clause
    const where: {
      userId: string;
      OR?: Array<
        | {
            occurredAt: { lt: Date };
          }
        | {
            occurredAt: Date;
            id: { lt: string };
          }
      >;
    } = {
      userId,
    };

    if (cursorDate && cursorId) {
      where.OR = [
        { occurredAt: { lt: cursorDate } },
        {
          occurredAt: cursorDate,
          id: { lt: cursorId },
        },
      ];
    }

    // Fetch events
    const events = await this.prisma.timelineView.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there's more
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    });

    // Check if there's a next page
    const hasNext = events.length > limit;
    const eventsToReturn = hasNext ? events.slice(0, limit) : events;

    // Build next cursor
    let nextCursor: string | undefined;
    if (hasNext && eventsToReturn.length > 0) {
      const lastEvent = eventsToReturn[eventsToReturn.length - 1];
      const cursorData = `${lastEvent.occurredAt.toISOString()}|${lastEvent.id}`;
      nextCursor = Buffer.from(cursorData).toString('base64');
    }

    return {
      events: eventsToReturn.map((event) => ({
        eventId: event.eventId,
        occurredAt: event.occurredAt,
        provider: event.provider as Provider,
        accountId: event.accountId,
        kind: event.kind as EventKind,
        description: event.description,
        fiatCurrency: event.fiatCurrency,
        fiatAmountMinor: event.fiatAmountMinor,
        assetSymbol: event.assetSymbol,
        assetAmount: event.assetAmount,
        status: event.status as EventStatus,
      })),
      nextCursor,
    };
  }
}
