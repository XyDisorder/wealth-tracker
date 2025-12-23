import { z } from 'zod';

/**
 * Zod schema for Crypto provider webhook payload
 * Validates Coinbase-like crypto transaction events
 */
export const cryptoWebhookSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  platform: z.string().optional(),
  id: z.string().min(1, 'id is required'),
  walletId: z.string().min(1, 'walletId is required'),
  time: z
    .number()
    .or(z.string())
    .transform((val) => {
      if (typeof val === 'number') {
        return new Date(val);
      }
      return new Date(val);
    }),
  asset: z.string().min(1, 'asset symbol is required'),
  amount: z
    .number()
    .or(z.string())
    .transform((val) => {
      // Convert to decimal string
      return typeof val === 'number' ? val.toString() : val;
    }),
  type: z
    .enum(['crypto_deposit', 'crypto_withdrawal', 'DEPOSIT', 'WITHDRAWAL'])
    .transform((val) => {
      // Normalize to DEPOSIT/WITHDRAWAL
      if (val === 'crypto_deposit' || val === 'DEPOSIT') {
        return 'DEPOSIT';
      }
      return 'WITHDRAWAL';
    }),
  fiatValue: z
    .number()
    .or(
      z.object({
        amount: z.number().optional(),
        currency: z.string().optional(),
      }),
    )
    .nullable()
    .optional()
    .transform((val) => {
      // Normalize to object format
      if (typeof val === 'number') {
        return { amount: val, currency: 'EUR' };
      }
      return val;
    }),
  currency: z.string().optional(),
  description: z.string().nullable().optional(),
});

export type CryptoWebhookPayload = z.infer<typeof cryptoWebhookSchema>;
