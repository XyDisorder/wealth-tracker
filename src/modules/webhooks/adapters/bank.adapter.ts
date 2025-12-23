import { EventKind } from '../../../common/constants/data.constants';
import { bankWebhookSchema } from '../schemas/bank.schema';

/**
 * Adapter for Bank provider
 * Normalizes bank webhook payload to canonical event structure
 */
export class BankAdapter {
  /**
   * Validates and normalizes bank webhook payload
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
  } {
    const validated = bankWebhookSchema.parse(payload);

    // Map bank type to event kind
    const kind =
      validated.type === 'CREDIT'
        ? EventKind.CASH_CREDIT
        : EventKind.CASH_DEBIT;

    // Convert amount to minor units (assuming 2 decimal places for fiat)
    const fiatAmountMinor = validated.amount
      ? BigInt(Math.round(validated.amount * 100))
      : null;

    // Default currency to EUR if missing
    const fiatCurrency = validated.currency || 'EUR';

    return {
      userId: validated.userId,
      providerEventId: validated.txnId,
      accountId: validated.account,
      occurredAt: validated.date,
      kind,
      description: validated.description || null,
      fiatCurrency,
      fiatAmountMinor,
    };
  }
}
