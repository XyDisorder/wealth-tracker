import { z } from 'zod';

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
    .or(z.date())
    .transform((val) => {
      if (typeof val === 'string') {
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
