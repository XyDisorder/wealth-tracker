import {
  EventKind,
  ValuationStatus,
} from '../../../common/constants/data.constants';
import { cryptoWebhookSchema } from '../schemas/crypto.schema';

/**
 * Adapter for Crypto provider
 * Normalizes crypto webhook payload to canonical event structure
 */
export class CryptoAdapter {
  /**
   * Validates and normalizes crypto webhook payload
   */
  static validateAndNormalize(payload: unknown): {
    userId: string;
    providerEventId: string;
    accountId: string;
    occurredAt: Date;
    kind: EventKind;
    description: string | null;
    fiatCurrency: string | null;
    fiatAmountMinor: bigint | null;
    assetSymbol: string | null;
    assetAmount: string | null;
    valuationStatus: ValuationStatus;
  } {
    const validated = cryptoWebhookSchema.parse(payload);

    // Map crypto type to event kind
    const kind =
      validated.type === 'DEPOSIT'
        ? EventKind.CRYPTO_DEPOSIT
        : EventKind.CRYPTO_WITHDRAWAL;

    // Extract fiat value if available
    let fiatCurrency: string | null = null;
    let fiatAmountMinor: bigint | null = null;
    let valuationStatus: ValuationStatus = ValuationStatus.PENDING;

    if (validated.fiatValue?.amount) {
      fiatCurrency =
        validated.fiatValue.currency || validated.currency || 'EUR';
      // Convert to minor units (assuming 2 decimal places)
      fiatAmountMinor = BigInt(Math.round(validated.fiatValue.amount * 100));
      valuationStatus = ValuationStatus.VALUED;
    } else if (validated.currency) {
      // Currency specified but no fiat value
      fiatCurrency = validated.currency;
    }

    return {
      userId: validated.userId,
      providerEventId: validated.id,
      accountId: validated.walletId,
      occurredAt: validated.time,
      kind,
      description: validated.description || null,
      fiatCurrency,
      fiatAmountMinor,
      assetSymbol: validated.asset,
      assetAmount: validated.amount,
      valuationStatus,
    };
  }
}
