import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary with optional filters' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Analytics summary' })
  async getSummary(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSummary({ userId, startDate, endDate });
  }

  @Get('spending-summary')
  @ApiOperation({ summary: 'Get spending summary by category and period with trend analysis' })
  @ApiQuery({ name: 'period', required: true, enum: ['daily', 'weekly', 'monthly'], description: 'Time period for aggregation' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, description: 'Spending summary with category breakdown and trend' })
  async getSpendingSummary(
    @Query('period') period?: string,
    @Query('userId') userId?: string,
  ) {
    if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
      throw new BadRequestException('Period must be one of: daily, weekly, monthly');
    }
    return this.analyticsService.getSpendingSummary(period as 'daily' | 'weekly' | 'monthly', userId);
  }
}
