import { z } from 'zod';
import { TIMESTAMP_CONSTANTS } from '../../../common/constants/numeric.constants';

/**
 * Zod schema for Bank provider webhook payload
 * Validates BNP-like bank transaction events
 */
export const bankWebhookSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  bankId: z.string().optional(),
  txnId: z.string().min(1, 'txnId is required'),
  account: z.string().min(1, 'account is required'),
  date: z
    .string()
    .or(z.number())
    .or(z.date())
    .optional()
    .transform((val) => {
      // If no date provided, use current time (Date.now())
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
        if (!isNaN(numVal) && val !== '' && !val.includes('-') && !val.includes('T')) {
          // It's a numeric string (timestamp), not a date string
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
        // It's a date string, parse it
        return new Date(val);
      }

      return val;
    }),
  type: z.enum(['credit', 'debit', 'CREDIT', 'DEBIT']).transform((val) => {
    // Normalize to uppercase
    return val.toUpperCase();
  }),
  amount: z.number(),
  currency: z
    .string()
    .length(3, 'Currency must be ISO 3-letter code')
    .optional(),
  description: z.string().nullable().optional(),
});

export type BankWebhookPayload = z.infer<typeof bankWebhookSchema>;
