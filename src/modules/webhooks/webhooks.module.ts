import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDetectorService } from './webhook-detector.service';
import { PrismaModule } from '../../db/prisma/prisma.module';

/**
 * Webhooks module
 * Handles ingestion of events from external providers
 */
@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDetectorService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
