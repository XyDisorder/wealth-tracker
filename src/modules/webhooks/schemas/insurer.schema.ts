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
      if (typeof val === 'string') {
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
