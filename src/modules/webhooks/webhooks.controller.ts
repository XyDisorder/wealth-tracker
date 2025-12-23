import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookDetectorService } from './webhook-detector.service';
import { BankAdapter } from './adapters/bank.adapter';
import { CryptoAdapter } from './adapters/crypto.adapter';
import { InsurerAdapter } from './adapters/insurer.adapter';
import { Provider } from '../../common/constants/data.constants';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { ValidationError } from '../../common/errors';

/**
 * Controller for webhook ingestion endpoints
 * Accepts events from different providers and queues them for processing
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly webhookDetectorService: WebhookDetectorService,
  ) {}

  /**
   * Unified webhook endpoint
   * Automatically detects provider from payload structure
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handleWebhook(@Body() payload: unknown): Promise<WebhookResponseDto> {
    try {
      // Detect provider from payload
      const provider = this.webhookDetectorService.detectProvider(payload);

      this.logger.log(`Detected provider: ${provider} for webhook`);

      // Validate and normalize based on provider
      let userId: string;
      switch (provider) {
        case Provider.BANK: {
          const normalized = BankAdapter.validateAndNormalize(payload);
          userId = normalized.userId;
          break;
        }
        case Provider.CRYPTO: {
          const normalized = CryptoAdapter.validateAndNormalize(payload);
          userId = normalized.userId;
          break;
        }
        case Provider.INSURER: {
          const normalized = InsurerAdapter.validateAndNormalize(payload);
          userId = normalized.userId;
          break;
        }
        default: {
          throw new Error(`Unsupported provider: ${String(provider)}`);
        }
      }

      // Ingest webhook
      const result = await this.webhooksService.ingestWebhook(
        provider,
        userId,
        payload,
      );

      return {
        accepted: true,
        rawEventId: result.rawEventId,
        jobId: result.jobId,
      };
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Legacy endpoint for Bank provider (kept for backward compatibility)
   * @deprecated Use POST /webhooks instead
   */
  @Post('bank')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleBankWebhook(
    @Body() payload: unknown,
  ): Promise<WebhookResponseDto> {
    return this.handleWebhook(payload);
  }

  /**
   * Legacy endpoint for Crypto provider (kept for backward compatibility)
   * @deprecated Use POST /webhooks instead
   */
  @Post('crypto')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleCryptoWebhook(
    @Body() payload: unknown,
  ): Promise<WebhookResponseDto> {
    return this.handleWebhook(payload);
  }

  /**
   * Legacy endpoint for Insurer provider (kept for backward compatibility)
   * @deprecated Use POST /webhooks instead
   */
  @Post('insurer')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleInsurerWebhook(
    @Body() payload: unknown,
  ): Promise<WebhookResponseDto> {
    return this.handleWebhook(payload);
  }
}
