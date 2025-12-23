import { Module } from '@nestjs/common';
import { WealthController } from './wealth.controller';
import { WealthService } from './wealth.service';
import { ProjectionsService } from './projections.service';
import { PrismaModule } from '../../db/prisma/prisma.module';

/**
 * Wealth module
 * Handles wealth data queries and projection computation
 */
@Module({
  imports: [PrismaModule],
  controllers: [WealthController],
  providers: [WealthService, ProjectionsService],
  exports: [WealthService, ProjectionsService],
})
export class WealthModule {}
