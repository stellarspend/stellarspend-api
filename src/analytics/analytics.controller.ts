import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/** Exposes the analytics API surface. */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  /** Reports module availability for operations and smoke tests. */
  @Get('status')
  status(): { module: string; status: string } {
    return this.service.status();
  }

  /**
   * GET /analytics/trend?asset=USDC&weeks=8
   * Returns weekly spending buckets for the given asset.
   */
  @UseGuards(JwtAuthGuard)
  @Get('trend')
  async getSpendingTrend(
    @Req() req: any,
    @Query('asset') asset: string,
    @Query('weeks') weeks?: string,
  ) {
    const userId = req.user.sub;
    return this.service.getSpendingTrend(userId, asset, weeks ? Number(weeks) : 8);
  }

  /**
   * GET /analytics/category-breakdown?asset=XLM&since=2026-01-01
   * Returns per-category spending totals with percentages.
   */
  @UseGuards(JwtAuthGuard)
  @Get('category-breakdown')
  async getCategoryBreakdown(
    @Req() req: any,
    @Query('asset') asset: string,
    @Query('since') since?: string,
  ) {
    const userId = req.user.sub;
    const sinceDate = since ? new Date(since) : new Date(0);
    return this.service.getCategoryBreakdown(userId, asset, sinceDate);
  }
}