import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

/**
 * Standalone worker entry point
 * Can be run separately with: pnpm worker
 * Worker starts automatically via OnModuleInit in WorkerService
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Worker starts automatically via OnModuleInit
  // We just need to keep the process alive
  console.log('Worker started. Press Ctrl+C to stop.');

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('Shutting down worker...');
    app
      .close()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error closing app:', error);
        process.exit(1);
      });
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down worker...');
    app
      .close()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error closing app:', error);
        process.exit(1);
      });
  });
}

bootstrap().catch((error) => {
  console.error('Error starting worker:', error);
  process.exit(1);
});
