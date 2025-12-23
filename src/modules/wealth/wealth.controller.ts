import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { WealthService } from './wealth.service';
import { WealthSummary, AccountView } from '../../common/types';

/**
 * Controller for wealth query endpoints
 * Exposes user wealth data via REST API
 */
@Controller('users/:userId/wealth')
export class WealthController {
  constructor(private readonly wealthService: WealthService) {}

  /**
   * GET /users/:userId/wealth/summary
   * Returns global wealth summary for a user
   */
  @Get('summary')
  async getSummary(@Param('userId') userId: string): Promise<WealthSummary> {
    return this.wealthService.getWealthSummary(userId);
  }

  /**
   * GET /users/:userId/wealth/accounts
   * Returns list of account views for a user
   */
  @Get('accounts')
  async getAccounts(@Param('userId') userId: string): Promise<AccountView[]> {
    return this.wealthService.getAccountViews(userId);
  }

  /**
   * GET /users/:userId/wealth/timeline?limit=50&cursor=...
   * Returns timeline of events with cursor pagination
   */
  @Get('timeline')
  async getTimeline(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.wealthService.getTimeline(userId, limit, cursor);
  }
}
