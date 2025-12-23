import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../../db/prisma/prisma.service';
import { JobType, JobStatus } from '../../common/constants/data.constants';
import { appConfig } from '../../config/app.config';
import { ReconcileRawEventHandler } from './handlers/reconcile-raw-event.handler';
import { EnrichCryptoValuationHandler } from './handlers/enrich-crypto-valuation.handler';

/**
 * Worker service for processing background jobs
 * Polls jobs from database and processes them
 */
@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private readonly config = appConfig();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reconcileRawEventHandler: ReconcileRawEventHandler,
    private readonly enrichCryptoValuationHandler: EnrichCryptoValuationHandler,
  ) {}

  /**
   * Starts the worker on module init
   */
  async onModuleInit() {
    if (!this.config.worker.enabled) {
      this.logger.log('Worker is disabled in configuration');
      return;
    }

    this.logger.log('Starting worker service');
    this.startPolling();
  }

  /**
   * Stops the worker on module destroy
   */
  async onModuleDestroy() {
    this.stopPolling();
  }

  /**
   * Starts polling for jobs
   */
  private startPolling() {
    this.pollingInterval = setInterval(() => {
      this.processNextJob().catch((error) => {
        this.logger.error('Error in job processing loop', error);
      });
    }, this.config.worker.pollInterval);
  }

  /**
   * Stops polling for jobs
   */
  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Processes the next available job
   */
  private async processNextJob(): Promise<void> {
    if (this.isProcessing) {
      return; // Skip if already processing
    }

    try {
      this.isProcessing = true;
      const job = await this.claimJob();

      if (!job) {
        return; // No job available
      }

      await this.executeJob(job);
    } catch (error) {
      this.logger.error('Error processing job', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Claims a job atomically
   * Only claims PENDING jobs that are not locked or have expired lock
   */
  private async claimJob() {
    const lockTimeout = new Date(Date.now() - this.config.worker.lockTimeout);

    // Find and claim a job atomically
    const job = await this.prisma.$transaction(async (tx) => {
      // Find a PENDING job that is not locked or has expired lock
      const availableJob = await tx.job.findFirst({
        where: {
          status: JobStatus.PENDING,
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockTimeout } }],
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!availableJob) {
        return null;
      }

      // Claim the job atomically
      const updated = await tx.job.updateMany({
        where: {
          id: availableJob.id,
          status: JobStatus.PENDING,
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockTimeout } }],
        },
        data: {
          status: JobStatus.RUNNING,
          lockedAt: new Date(),
          attempts: availableJob.attempts + 1,
        },
      });

      if (updated.count === 0) {
        // Job was claimed by another worker
        return null;
      }

      return {
        ...availableJob,
        status: JobStatus.RUNNING,
        lockedAt: new Date(),
        attempts: availableJob.attempts + 1,
      };
    });

    return job;
  }

  /**
   * Executes a job based on its type
   */
  private async executeJob(job: {
    id: string;
    type: string;
    payload: string;
    attempts: number;
  }): Promise<void> {
    const payload = JSON.parse(job.payload);

    try {
      switch (job.type) {
        case JobType.RECONCILE_RAW_EVENT:
          await this.reconcileRawEventHandler.handle(payload);
          break;
        case JobType.ENRICH_CRYPTO_VALUATION:
          await this.enrichCryptoValuationHandler.handle(payload);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as done
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.DONE,
          lockedAt: null,
        },
      });

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed`, error);

      // Check if max attempts reached
      if (job.attempts >= this.config.worker.maxAttempts) {
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            lastError: error instanceof Error ? error.message : String(error),
            lockedAt: null,
          },
        });
      } else {
        // Release lock and retry later
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.PENDING,
            lockedAt: null,
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
  }
}
