import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { PrismaModule } from '../../db/prisma/prisma.module';
import { WealthModule } from '../wealth/wealth.module';

/**
 * Reconciliation module
 * Handles event deduplication, corrections, and late arrivals
 */
@Module({
  imports: [PrismaModule, WealthModule],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
