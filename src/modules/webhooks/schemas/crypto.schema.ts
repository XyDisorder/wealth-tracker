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
    .optional()
    .transform((val) => {
      // If no timestamp provided, use current time
      if (val === undefined || val === null) {
        return new Date();
      }
      
      if (typeof val === 'number') {
        // If timestamp is less than 1e12, assume it's in seconds and convert to milliseconds
        let timestamp = val < 1e12 ? val * 1000 : val;
        let date = new Date(timestamp);
        
        // If the resulting date is before 2000, it's likely invalid
        // Try treating it as milliseconds if we converted from seconds
        if (date.getFullYear() < 2000 && val < 1e12) {
          // It was already small, try as milliseconds directly
          date = new Date(val);
          // If still invalid, keep the converted version
          if (date.getFullYear() >= 2000) {
            return date;
          }
        }
        
        return date;
      }
      // Try to parse as number first (could be string representation of number)
      const numVal = Number(val);
      if (!isNaN(numVal) && val !== '') {
        let timestamp = numVal < 1e12 ? numVal * 1000 : numVal;
        let date = new Date(timestamp);
        
        // If the resulting date is before 2000, it's likely invalid
        if (date.getFullYear() < 2000 && numVal < 1e12) {
          date = new Date(numVal);
          if (date.getFullYear() >= 2000) {
            return date;
          }
        }
        
        return date;
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
