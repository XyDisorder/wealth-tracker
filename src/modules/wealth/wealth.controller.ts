import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { WealthService } from './wealth.service';
import { WealthSummary, AccountView } from '../../common/types';
import { WealthSummaryDto } from './dto/wealth-summary.dto';
import { AccountViewDto } from './dto/account-view.dto';
import { TimelineResponseDto } from './dto/timeline-response.dto';

/**
 * Controller for wealth query endpoints
 * Exposes user wealth data via REST API
 */
@ApiTags('wealth')
@Controller('users/:userId/wealth')
export class WealthController {
  constructor(private readonly wealthService: WealthService) {}

  /**
   * GET /users/:userId/wealth/summary
   * Returns global wealth summary for a user
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get wealth summary',
    description:
      'Returns global wealth summary for a user including balances by currency, crypto positions, and valuation status',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'user-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Wealth summary',
    type: WealthSummaryDto,
  })
  async getSummary(@Param('userId') userId: string): Promise<WealthSummary> {
    return this.wealthService.getWealthSummary(userId);
  }

  /**
   * GET /users/:userId/wealth/accounts
   * Returns list of account views for a user
   */
  @Get('accounts')
  @ApiOperation({
    summary: 'Get account views',
    description:
      'Returns list of account views for a user with balances and crypto positions per account',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'user-001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of account views',
    type: [AccountViewDto],
  })
  async getAccounts(@Param('userId') userId: string): Promise<AccountView[]> {
    return this.wealthService.getAccountViews(userId);
  }

  /**
   * GET /users/:userId/wealth/timeline?limit=50&cursor=...
   * Returns timeline of events with cursor pagination
   */
  @Get('timeline')
  @ApiOperation({
    summary: 'Get timeline',
    description:
      'Returns timeline of events with cursor-based pagination, ordered by occurredAt (most recent first)',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'user-001',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of events to return',
    required: false,
    type: Number,
    example: 50,
  })
  @ApiQuery({
    name: 'cursor',
    description: 'Pagination cursor (base64 encoded)',
    required: false,
    type: String,
    example: 'MjAyNC0wMS0wMVQxMjowMDowMC4wMDBafGV2ZW50LTEyMw==',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline response with events and optional next cursor',
    type: TimelineResponseDto,
  })
  async getTimeline(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.wealthService.getTimeline(userId, limit, cursor);
  }
}
