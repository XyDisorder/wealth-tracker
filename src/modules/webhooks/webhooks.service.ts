import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../db/prisma/prisma.service';
import { Provider, JobType } from '../../common/constants/data.constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling webhook ingestion
 * Persists raw events and creates reconciliation jobs
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingests a webhook event from a provider
   * Creates RawEvent and reconciliation Job
   */
  async ingestWebhook(
    provider: Provider,
    userId: string,
    payload: unknown,
  ): Promise<{ rawEventId: string; jobId: string }> {
    // Check for duplicate raw event (idempotency)
    const payloadString = JSON.stringify(payload);
    const existingRawEvent = await this.prisma.rawEvent.findFirst({
      where: {
        provider,
        userId,
        payload: payloadString,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingRawEvent) {
      this.logger.warn(
        `Duplicate raw event detected for provider ${provider}, userId ${userId}`,
      );
      // Return existing job if any
      const existingJob = await this.prisma.job.findFirst({
        where: {
          type: JobType.RECONCILE_RAW_EVENT,
          payload: JSON.stringify({ rawEventId: existingRawEvent.id }),
        },
      });
      return {
        rawEventId: existingRawEvent.id,
        jobId: existingJob?.id || uuidv4(),
      };
    }

    // Create raw event
    const rawEvent = await this.prisma.rawEvent.create({
      data: {
        id: uuidv4(),
        provider,
        userId,
        payload: payloadString,
      },
    });

    // Create reconciliation job
    const job = await this.prisma.job.create({
      data: {
        id: uuidv4(),
        type: JobType.RECONCILE_RAW_EVENT,
        payload: JSON.stringify({ rawEventId: rawEvent.id }),
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Created raw event ${rawEvent.id} and job ${job.id} for provider ${provider}`,
    );

    return {
      rawEventId: rawEvent.id,
      jobId: job.id,
    };
  }
}
