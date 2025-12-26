import { z } from 'zod';
import { TIMESTAMP_CONSTANTS } from '../../../common/constants/numeric.constants';

/**
 * Zod schema for Insurer provider webhook payload
 * Validates AXA-like insurance premium events
 */
export const insurerWebhookSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  insurer: z.string().optional(),
  transactionId: z.string().min(1, 'transactionId is required'),
  policyNumber: z.string().min(1, 'policyNumber is required'),
  timestamp: z
    .number()
    .or(z.string())
    .or(z.date())
    .optional()
    .transform((val) => {
      // If no timestamp provided, use current time (Date.now())
      if (val === undefined || val === null || val === '') {
        return new Date();
      }

      if (typeof val === 'number') {
        // If timestamp is less than threshold, assume it's in seconds and convert to milliseconds
        const timestamp =
          val < TIMESTAMP_CONSTANTS.SECONDS_THRESHOLD
            ? val * TIMESTAMP_CONSTANTS.MS_PER_SECOND
            : val;
        let date = new Date(timestamp);

        // If the resulting date is before minimum valid year, it's likely invalid
        // Try treating it as milliseconds if we converted from seconds
        if (
          date.getFullYear() < TIMESTAMP_CONSTANTS.MIN_VALID_YEAR &&
          val < TIMESTAMP_CONSTANTS.SECONDS_THRESHOLD
        ) {
          // It was already small, try as milliseconds directly
          date = new Date(val);
          // If still invalid, keep the converted version
          if (date.getFullYear() >= TIMESTAMP_CONSTANTS.MIN_VALID_YEAR) {
            return date;
          }
        }

        return date;
      }
      if (typeof val === 'string') {
        // Try to parse as number first (could be string representation of number)
        const numVal = Number(val);
        if (!isNaN(numVal) && val !== '') {
          const timestamp =
            numVal < TIMESTAMP_CONSTANTS.SECONDS_THRESHOLD
              ? numVal * TIMESTAMP_CONSTANTS.MS_PER_SECOND
              : numVal;
          let date = new Date(timestamp);

          // If the resulting date is before minimum valid year, it's likely invalid
          if (
            date.getFullYear() < TIMESTAMP_CONSTANTS.MIN_VALID_YEAR &&
            numVal < TIMESTAMP_CONSTANTS.SECONDS_THRESHOLD
          ) {
            date = new Date(numVal);
            if (date.getFullYear() >= TIMESTAMP_CONSTANTS.MIN_VALID_YEAR) {
              return date;
            }
          }

          return date;
        }
        return new Date(val);
      }
      return val;
    }),
  movementType: z
    .enum([
      'premium',
      'claim',
      'refund',
      'commission',
      'fee',
      'adjustment',
      'PREMIUM',
      'CLAIM',
      'REFUND',
      'COMMISSION',
      'FEE',
      'ADJUSTMENT',
    ])
    .optional(),
  amount: z.number(),
  currency: z
    .string()
    .length(3, 'Currency must be ISO 3-letter code')
    .optional(),
  description: z.string().nullable().optional(),
});

export type InsurerWebhookPayload = z.infer<typeof insurerWebhookSchema>;
