import { EventKind } from '../../../common/constants/data.constants';
import { CURRENCY_CONSTANTS } from '../../../common/constants/numeric.constants';
import { insurerWebhookSchema } from '../schemas/insurer.schema';

/**
 * Adapter for Insurer provider
 * Normalizes insurer webhook payload to canonical event structure
 */
export class InsurerAdapter {
  /**
   * Validates and normalizes insurer webhook payload
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
    const validated = insurerWebhookSchema.parse(payload);

    // Map movement type to event kind
    // For now, all insurance movements are treated as INSURANCE_PREMIUM
    // In the future, we could add INSURANCE_CLAIM, INSURANCE_REFUND, etc.
    const kind = EventKind.INSURANCE_PREMIUM;

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
      providerEventId: validated.transactionId,
      accountId: validated.policyNumber,
      occurredAt: validated.timestamp,
      kind,
      description: validated.description || null,
      fiatCurrency,
      fiatAmountMinor,
    };
  }
}
