import { Module } from '@nestjs/common';
import { AppModule as AppFeatureModule } from './modules/app/app.module';
import { PrismaModule } from './db/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AppFeatureModule],
})
export class AppModule {}
