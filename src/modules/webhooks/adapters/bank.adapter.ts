import { EventKind } from '../../../common/constants/data.constants';
import { CURRENCY_CONSTANTS } from '../../../common/constants/numeric.constants';
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

    // Convert amount to minor units
    const fiatAmountMinor = validated.amount
      ? BigInt(
          Math.round(
            validated.amount * CURRENCY_CONSTANTS.MINOR_UNITS_MULTIPLIER,
          ),
        )
      : null;

    // Default currency if missing
    const fiatCurrency =
      validated.currency || CURRENCY_CONSTANTS.DEFAULT_CURRENCY;

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
