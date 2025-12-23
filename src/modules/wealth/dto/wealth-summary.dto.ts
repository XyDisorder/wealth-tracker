import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for wealth summary response
 */
export class WealthSummaryDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-001',
  })
  userId: string;

  @ApiProperty({
    description: 'Balances by currency (amount in minor units as string)',
    example: { EUR: '100000', USD: '50000' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  balancesByCurrency: Record<string, string>;

  @ApiProperty({
    description: 'Crypto positions (amount as decimal string)',
    example: { BTC: '0.5', ETH: '10.0' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  cryptoPositions: Record<string, string>;

  @ApiProperty({
    description: 'Valuation status',
    example: { status: 'FULL', missingCryptoValuations: 0 },
  })
  valuation: {
    status: 'FULL' | 'PARTIAL';
    missingCryptoValuations: number;
  };

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  lastUpdatedAt: Date;
}

