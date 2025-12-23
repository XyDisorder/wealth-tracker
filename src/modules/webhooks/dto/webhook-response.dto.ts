/**
 * DTO for webhook response
 */
export interface WebhookResponseDto {
  accepted: boolean;
  rawEventId: string;
  jobId: string;
}
