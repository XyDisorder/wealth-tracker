import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '../../../common/constants/data.constants';

/**
 * DTO for account view response
 */
export class AccountViewDto {
  @ApiProperty({
    description: 'Account ID',
    example: 'acc-01',
  })
  accountId: string;

  @ApiProperty({
    description: 'Provider',
    enum: Provider,
    example: Provider.BANK,
  })
  provider: Provider;

  @ApiProperty({
    description: 'Balances by currency (amount in minor units as string)',
    example: { EUR: '100000', USD: '50000' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  balancesByCurrency: Record<string, string>;

  @ApiProperty({
    description: 'Crypto positions (amount as decimal string)',
    example: { BTC: '0.5' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  cryptoPositions: Record<string, string>;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  lastUpdatedAt: Date;
}

