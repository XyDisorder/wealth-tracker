import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const config = appConfig();
  const app = await NestFactory.create(AppModule);

  // Enable CORS if needed
  // app.enableCors();

  // Global prefix for API routes
  // app.setGlobalPrefix('api');

  await app.listen(config.port);
  console.log(`Application is running on: http://localhost:${config.port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
