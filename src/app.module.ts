import { Module } from '@nestjs/common';
import { AppModule as AppFeatureModule } from './modules/app/app.module';

@Module({
  imports: [AppFeatureModule],
})
export class AppModule {}
