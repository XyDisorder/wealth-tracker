import { ApiProperty } from '@nestjs/swagger';

/**
 * Example payloads for different providers
 */
export class BankWebhookPayloadDto {
  @ApiProperty({ example: 'user-001' })
  userId: string;

  @ApiProperty({ example: 'BNP', required: false })
  bankId?: string;

  @ApiProperty({ example: 'txn-12345' })
  txnId: string;

  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  date: string;

  @ApiProperty({ example: 'credit', enum: ['credit', 'debit'] })
  type: string;

  @ApiProperty({ example: 2000 })
  amount: number;

  @ApiProperty({ example: 'EUR', required: false })
  currency?: string;

  @ApiProperty({ example: 'acc-01' })
  account: string;

  @ApiProperty({ example: 'Salary transfer', required: false })
  description?: string;
}

export class CryptoWebhookPayloadDto {
  @ApiProperty({ example: 'user-001' })
  userId: string;

  @ApiProperty({ example: 'Coinbase', required: false })
  platform?: string;

  @ApiProperty({ example: 'tx-abc123' })
  id: string;

  @ApiProperty({ example: 1704110400000 })
  time: number;

  @ApiProperty({
    example: 'crypto_deposit',
    enum: ['crypto_deposit', 'crypto_withdrawal'],
  })
  type: string;

  @ApiProperty({ example: 'BTC' })
  asset: string;

  @ApiProperty({ example: 0.05 })
  amount: number | string;

  @ApiProperty({ example: { amount: 20000, currency: 'EUR' }, required: false })
  fiatValue?: { amount: number; currency?: string } | number;

  @ApiProperty({ example: 'EUR', required: false })
  currency?: string;

  @ApiProperty({ example: 'wallet-01' })
  walletId: string;

  @ApiProperty({ example: 'BTC deposit', required: false })
  description?: string;
}

export class InsurerWebhookPayloadDto {
  @ApiProperty({ example: 'user-001' })
  userId: string;

  @ApiProperty({ example: 'AXA' })
  insurer: string;

  @ApiProperty({ example: 'av-2025-001' })
  transactionId: string;

  @ApiProperty({ example: 1704110400000 })
  timestamp: number;

  @ApiProperty({ example: 'premium', enum: ['premium', 'claim', 'refund'] })
  movementType: string;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: 'EUR', required: false })
  currency?: string;

  @ApiProperty({ example: 'acc-04' })
  policyNumber: string;

  @ApiProperty({ example: 'Monthly premium', required: false })
  description?: string;
}
