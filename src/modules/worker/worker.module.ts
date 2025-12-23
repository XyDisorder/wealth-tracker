import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ReconcileRawEventHandler } from './handlers/reconcile-raw-event.handler';
import { EnrichCryptoValuationHandler } from './handlers/enrich-crypto-valuation.handler';
import { PrismaModule } from '../../db/prisma/prisma.module';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';
import { WealthModule } from '../wealth/wealth.module';

/**
 * Worker module
 * Handles background job processing
 */
@Module({
  imports: [PrismaModule, ReconciliationModule, WealthModule],
  providers: [
    WorkerService,
    ReconcileRawEventHandler,
    EnrichCryptoValuationHandler,
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
