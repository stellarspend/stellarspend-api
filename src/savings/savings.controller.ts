import { Controller, Get, Post, Body, Param, Req, Delete, UseGuards } from '@nestjs/common';
import { SavingsService } from './savings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/** Exposes the savings API surface. */
@Controller('savings')
@UseGuards(JwtAuthGuard)
export class SavingsController {
  constructor(private readonly service: SavingsService) {}

  /** Reports module availability for operations and smoke tests. */
  @Get('status') status(): { module: string; status: string } { return this.service.status(); }

  @Post('goals')
  createGoal(@Req() req: any, @Body() body: { name: string; targetAmount: string; asset: string }) {
    const userId = req.user?.sub || req.headers['x-user-id'];
    return this.service.createGoal(userId, body);
  }

  @Get('goals')
  getGoals(@Req() req: any) {
    const userId = req.user?.sub || req.headers['x-user-id'];
    return this.service.getGoals(userId);
  }

  @Get('goals/:id')
  getGoal(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.headers['x-user-id'];
    return this.service.getGoal(userId, id);
  }

  @Post('goals/:id/contribute')
  contribute(@Req() req: any, @Param('id') id: string, @Body() body: { amount: string }) {
    const userId = req.user?.sub || req.headers['x-user-id'];
    return this.service.contribute(userId, id, body.amount);
  }

  @Delete('goals/:id')
  deleteGoal(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.headers['x-user-id'];
    return this.service.deleteGoal(userId, id);
  }
}
