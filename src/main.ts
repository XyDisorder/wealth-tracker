import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const config = appConfig();
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'file://'],
    credentials: true,
  });

  // Swagger/OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wealth Tracker API')
    .setDescription(
      'Backend API for financial wealth management. Receives, reconciles, and exposes financial events from multiple external sources (banks, crypto brokers, insurers).',
    )
    .setVersion('1.0')
    .addTag('webhooks', 'Webhook ingestion endpoints')
    .addTag('wealth', 'Wealth query endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(config.port);
  console.log(`Application is running on: http://localhost:${config.port}`);
  console.log(`Swagger documentation available at: http://localhost:${config.port}/api`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
