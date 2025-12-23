import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookDetectorService } from './webhook-detector.service';
import { BankAdapter } from './adapters/bank.adapter';
import { CryptoAdapter } from './adapters/crypto.adapter';
import { InsurerAdapter } from './adapters/insurer.adapter';
import { Provider } from '../../common/constants/data.constants';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import {
  BankWebhookPayloadDto,
  CryptoWebhookPayloadDto,
  InsurerWebhookPayloadDto,
} from './dto/webhook-payload.dto';
import { ValidationError } from '../../common/errors';

/**
 * Controller for webhook ingestion endpoints
 * Accepts events from different providers and queues them for processing
 */
@ApiTags('webhooks')
@ApiExtraModels(BankWebhookPayloadDto, CryptoWebhookPayloadDto, InsurerWebhookPayloadDto)
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
  @ApiOperation({
    summary: 'Send webhook event',
    description:
      'Unified endpoint that automatically detects the provider (Bank, Crypto, or Insurer) from the payload structure. Returns 202 Accepted and processes the event asynchronously.',
  })
  @ApiBody({
    description: 'Webhook payload (provider is auto-detected)',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(BankWebhookPayloadDto) },
        { $ref: getSchemaPath(CryptoWebhookPayloadDto) },
        { $ref: getSchemaPath(InsurerWebhookPayloadDto) },
      ],
      examples: {
        bank: {
          summary: 'Bank webhook example',
          value: {
            userId: 'user-001',
            bankId: 'BNP',
            txnId: 'txn-12345',
            date: '2024-01-01T12:00:00Z',
            type: 'credit',
            amount: 2000,
            currency: 'EUR',
            account: 'acc-01',
            description: 'Salary transfer',
          },
        },
        crypto: {
          summary: 'Crypto webhook example',
          value: {
            userId: 'user-001',
            platform: 'Coinbase',
            id: 'tx-abc123',
            time: 1704110400000,
            type: 'crypto_deposit',
            asset: 'BTC',
            amount: 0.05,
            fiatValue: { amount: 20000, currency: 'EUR' },
            walletId: 'acc-03',
          },
        },
        insurer: {
          summary: 'Insurer webhook example',
          value: {
            userId: 'user-001',
            insurer: 'AXA',
            transactionId: 'av-2025-001',
            timestamp: 1704110400000,
            movementType: 'premium',
            amount: 500,
            currency: 'EUR',
            policyNumber: 'acc-04',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Webhook accepted and queued for processing',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or validation error',
  })
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
   * Bank provider webhook endpoint
   * Explicit endpoint for bank events (alternative to unified /webhooks)
   */
  @Post('bank')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send bank webhook',
    description:
      'Explicit endpoint for bank provider webhooks. Accepts bank transaction events and queues them for processing. Alternative to the unified POST /webhooks endpoint.',
  })
  @ApiBody({
    type: BankWebhookPayloadDto,
    description: 'Bank webhook payload',
    examples: {
      credit: {
        summary: 'Bank credit transaction',
        value: {
          userId: 'user-001',
          bankId: 'BNP',
          txnId: 'txn-12345',
          date: '2024-01-01T12:00:00Z',
          type: 'credit',
          amount: 2000,
          currency: 'EUR',
          account: 'acc-01',
          description: 'Salary transfer',
        },
      },
      debit: {
        summary: 'Bank debit transaction',
        value: {
          userId: 'user-001',
          bankId: 'BNP',
          txnId: 'txn-12346',
          date: '2024-01-01T14:00:00Z',
          type: 'debit',
          amount: 500,
          currency: 'EUR',
          account: 'acc-01',
          description: 'Purchase',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Webhook accepted and queued for processing',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or validation error',
  })
  async handleBankWebhook(
    @Body() payload: unknown,
  ): Promise<WebhookResponseDto> {
    return this.handleWebhook(payload);
  }

  /**
   * Crypto provider webhook endpoint
   * Explicit endpoint for crypto events (alternative to unified /webhooks)
   */
  @Post('crypto')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send crypto webhook',
    description:
      'Explicit endpoint for crypto provider webhooks. Accepts crypto transaction events and queues them for processing. Alternative to the unified POST /webhooks endpoint.',
  })
  @ApiBody({
    type: CryptoWebhookPayloadDto,
    description: 'Crypto webhook payload',
    examples: {
      depositWithValue: {
        summary: 'Crypto deposit with fiat value',
        value: {
          userId: 'user-001',
          platform: 'Coinbase',
          id: 'tx-abc123',
          time: 1704110400000,
          type: 'crypto_deposit',
          asset: 'BTC',
          amount: 0.05,
          fiatValue: { amount: 20000, currency: 'EUR' },
          walletId: 'acc-03',
        },
      },
      depositWithoutValue: {
        summary: 'Crypto deposit without fiat value (will be enriched)',
        value: {
          userId: 'user-001',
          platform: 'Coinbase',
          id: 'tx-abc124',
          time: 1704110400000,
          type: 'crypto_deposit',
          asset: 'ETH',
          amount: 1.5,
          currency: 'EUR',
          walletId: 'acc-03',
        },
      },
      withdrawal: {
        summary: 'Crypto withdrawal',
        value: {
          userId: 'user-001',
          platform: 'Coinbase',
          id: 'tx-abc125',
          time: 1704110400000,
          type: 'crypto_withdrawal',
          asset: 'BTC',
          amount: 0.01,
          fiatValue: { amount: 4000, currency: 'EUR' },
          walletId: 'acc-03',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Webhook accepted and queued for processing',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or validation error',
  })
  async handleCryptoWebhook(
    @Body() payload: unknown,
  ): Promise<WebhookResponseDto> {
    return this.handleWebhook(payload);
  }

  /**
   * Insurer provider webhook endpoint
   * Explicit endpoint for insurance events (alternative to unified /webhooks)
   */
  @Post('insurer')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send insurer webhook',
    description:
      'Explicit endpoint for insurer provider webhooks. Accepts insurance transaction events and queues them for processing. Alternative to the unified POST /webhooks endpoint.',
  })
  @ApiBody({
    type: InsurerWebhookPayloadDto,
    description: 'Insurer webhook payload',
    examples: {
      premium: {
        summary: 'Insurance premium payment',
        value: {
          userId: 'user-001',
          insurer: 'AXA',
          transactionId: 'av-2025-001',
          timestamp: 1704110400000,
          movementType: 'premium',
          amount: 500,
          currency: 'EUR',
          policyNumber: 'acc-04',
          description: 'Monthly premium',
        },
      },
      claim: {
        summary: 'Insurance claim',
        value: {
          userId: 'user-001',
          insurer: 'AXA',
          transactionId: 'av-2025-002',
          timestamp: 1704110400000,
          movementType: 'claim',
          amount: 2000,
          currency: 'EUR',
          policyNumber: 'acc-04',
          description: 'Claim reimbursement',
        },
      },
      refund: {
        summary: 'Insurance refund',
        value: {
          userId: 'user-001',
          insurer: 'AXA',
          transactionId: 'av-2025-003',
          timestamp: 1704110400000,
          movementType: 'refund',
          amount: 100,
          currency: 'EUR',
          policyNumber: 'acc-04',
          description: 'Premium refund',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Webhook accepted and queued for processing',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or validation error',
  })
  async handleInsurerWebhook(
    @Body() payload: unknown,
  ): Promise<WebhookResponseDto> {
    return this.handleWebhook(payload);
  }
}
