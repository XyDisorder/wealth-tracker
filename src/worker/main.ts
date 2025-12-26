import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';

/**
 * Standalone worker entry point
 * Can be run separately with: pnpm worker
 * Worker starts automatically via OnModuleInit in WorkerService
 */
async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(AppModule);

  // Worker starts automatically via OnModuleInit
  // We just need to keep the process alive
  logger.log('Worker started. Press Ctrl+C to stop.');

  // Keep the process alive
  process.on('SIGINT', () => {
    logger.log('Shutting down worker...');
    app
      .close()
      .then(() => {
        logger.log('Worker closed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error closing app', error);
        process.exit(1);
      });
  });

  process.on('SIGTERM', () => {
    logger.log('Shutting down worker...');
    app
      .close()
      .then(() => {
        logger.log('Worker closed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error closing app', error);
        process.exit(1);
      });
  });
}

bootstrap().catch((error) => {
  const logger = new Logger('WorkerBootstrap');
  logger.error('Error starting worker', error);
  process.exit(1);
});
