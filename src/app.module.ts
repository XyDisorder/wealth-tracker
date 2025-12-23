import { Module } from '@nestjs/common';
import { AppModule as AppFeatureModule } from './modules/app/app.module';
import { PrismaModule } from './db/prisma/prisma.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { WorkerModule } from './modules/worker/worker.module';
import { WealthModule } from './modules/wealth/wealth.module';

@Module({
  imports: [
    PrismaModule,
    AppFeatureModule,
    WebhooksModule,
    ReconciliationModule,
    WorkerModule,
    WealthModule,
  ],
})
export class AppModule {}
