import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for webhook response
 */
export class WebhookResponseDto {
  @ApiProperty({
    description: 'Whether the webhook was accepted',
    example: true,
  })
  accepted: boolean;

  @ApiProperty({
    description: 'ID of the raw event created',
    example: 'raw-event-123',
  })
  rawEventId: string;

  @ApiProperty({
    description: 'ID of the processing job created',
    example: 'job-456',
  })
  jobId: string;
}
