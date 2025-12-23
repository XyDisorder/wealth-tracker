import { ApiProperty } from '@nestjs/swagger';
import {
  Provider,
  EventKind,
  EventStatus,
} from '../../../common/constants/data.constants';

/**
 * DTO for timeline event
 */
export class TimelineEventDto {
  @ApiProperty({
    description: 'Event ID',
    example: 'event-123',
  })
  eventId: string;

  @ApiProperty({
    description: 'When the event occurred',
    example: '2024-01-01T12:00:00.000Z',
  })
  occurredAt: Date;

  @ApiProperty({
    description: 'Provider',
    enum: Provider,
    example: Provider.BANK,
  })
  provider: Provider;

  @ApiProperty({
    description: 'Account ID',
    example: 'acc-01',
  })
  accountId: string;

  @ApiProperty({
    description: 'Event kind',
    enum: EventKind,
    example: EventKind.CASH_CREDIT,
  })
  kind: EventKind;

  @ApiProperty({
    description: 'Event description',
    example: 'Salary transfer',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Fiat currency',
    example: 'EUR',
    nullable: true,
  })
  fiatCurrency: string | null;

  @ApiProperty({
    description: 'Fiat amount in minor units (as string)',
    example: '100000',
    nullable: true,
  })
  fiatAmountMinor: string | null;

  @ApiProperty({
    description: 'Asset symbol (for crypto)',
    example: 'BTC',
    nullable: true,
  })
  assetSymbol: string | null;

  @ApiProperty({
    description: 'Asset amount (as decimal string)',
    example: '0.5',
    nullable: true,
  })
  assetAmount: string | null;

  @ApiProperty({
    description: 'Event status',
    enum: EventStatus,
    example: EventStatus.APPLIED,
  })
  status: EventStatus;
}

/**
 * DTO for timeline response
 */
export class TimelineResponseDto {
  @ApiProperty({
    description: 'List of timeline events',
    type: [TimelineEventDto],
  })
  events: TimelineEventDto[];

  @ApiProperty({
    description: 'Cursor for pagination (base64 encoded)',
    example: 'MjAyNC0wMS0wMVQxMjowMDowMC4wMDBafGV2ZW50LTEyMw==',
    required: false,
  })
  nextCursor?: string;
}
