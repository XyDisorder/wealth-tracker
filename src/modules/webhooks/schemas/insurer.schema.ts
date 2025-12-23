import { z } from 'zod';

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
    .transform((val) => {
      if (typeof val === 'number') {
        return new Date(val);
      }
      if (typeof val === 'string') {
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
