import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root endpoint',
    description: 'Simple health check endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: String,
  })
  healthCheck(): string {
    return this.appService.healthCheck();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns application health status',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T12:00:00.000Z' },
      },
    },
  })
  health(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
