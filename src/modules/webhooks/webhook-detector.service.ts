import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '../../common/constants/data.constants';
import { bankWebhookSchema } from './schemas/bank.schema';
import { cryptoWebhookSchema } from './schemas/crypto.schema';
import { insurerWebhookSchema } from './schemas/insurer.schema';

/**
 * Service for detecting webhook provider type
 * Analyzes payload structure to determine provider
 */
@Injectable()
export class WebhookDetectorService {
  private readonly logger = new Logger(WebhookDetectorService.name);

  /**
   * Detects provider from webhook payload
   * Tries each schema validation to identify the provider
   */
  detectProvider(payload: unknown): Provider {
    // Try Bank schema
    try {
      bankWebhookSchema.parse(payload);
      return Provider.BANK;
    } catch {
      // Not a bank payload
    }

    // Try Crypto schema
    try {
      cryptoWebhookSchema.parse(payload);
      return Provider.CRYPTO;
    } catch {
      // Not a crypto payload
    }

    // Try Insurer schema
    try {
      insurerWebhookSchema.parse(payload);
      return Provider.INSURER;
    } catch {
      // Not an insurer payload
    }

    // If none match, try heuristic detection
    const payloadObj = payload as Record<string, unknown>;

    // Bank heuristics: txnId + account + date
    if (
      'txnId' in payloadObj &&
      'account' in payloadObj &&
      ('date' in payloadObj || 'amount' in payloadObj)
    ) {
      this.logger.warn('Heuristically detected BANK provider');
      return Provider.BANK;
    }

    // Crypto heuristics: id + walletId + asset + time
    if (
      'id' in payloadObj &&
      'walletId' in payloadObj &&
      ('asset' in payloadObj || 'assetSymbol' in payloadObj) &&
      ('time' in payloadObj || 'timestamp' in payloadObj)
    ) {
      this.logger.warn('Heuristically detected CRYPTO provider');
      return Provider.CRYPTO;
    }

    // Insurer heuristics: transactionId + policyNumber + timestamp
    if (
      'transactionId' in payloadObj &&
      'policyNumber' in payloadObj &&
      ('timestamp' in payloadObj || 'movementType' in payloadObj)
    ) {
      this.logger.warn('Heuristically detected INSURER provider');
      return Provider.INSURER;
    }

    throw new Error(
      'Unable to detect provider from payload. Payload does not match any known schema.',
    );
  }
}
