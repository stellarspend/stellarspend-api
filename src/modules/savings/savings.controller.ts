import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Headers,
  Logger,
} from '@nestjs/common';
import { SavingsService, ValidationError, AuthorizationError, NotFoundError } from './savings.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { GoalResponseDto } from './dto/goal-response.dto';

@Controller('savings')
export class SavingsController {
  private readonly logger = new Logger(SavingsController.name);

  constructor(private readonly savingsService: SavingsService) {}

  /**
   * Create a new savings goal
   * POST /savings/goals
   */
  @Post('goals')
  @HttpCode(HttpStatus.CREATED)
  async createGoal(
    @Headers('x-user-id') userId: string,
    @Body() createGoalDto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    // Validate userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required in x-user-id header');
    }

    try {
      const goal = await this.savingsService.createGoal(
        userId,
        createGoalDto.name,
        createGoalDto.targetAmount,
      );

      // Map to response DTO
      return {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: goal.progress,
        isCompleted: goal.isCompleted,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      };
    } catch (error) {
      return this.handleError(error, 'createGoal', { userId, name: createGoalDto.name });
    }
  }

  /**
   * Get all savings goals for the authenticated user
   * GET /savings/goals
   */
  @Get('goals')
  @HttpCode(HttpStatus.OK)
  async getGoals(
    @Headers('x-user-id') userId: string,
  ): Promise<GoalResponseDto[]> {
    // Validate userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required in x-user-id header');
    }

    try {
      const goals = await this.savingsService.findGoalsByUser(userId);

      // Map to response DTOs
      return goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: goal.progress,
        isCompleted: goal.isCompleted,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      }));
    } catch (error) {
      return this.handleError(error, 'getGoals', { userId });
    }
  }

  /**
   * Add a contribution to a savings goal
   * PATCH /savings/goals/:id/contribution
   */
  @Patch('goals/:id/contribution')
  @HttpCode(HttpStatus.OK)
  async updateContribution(
    @Headers('x-user-id') userId: string,
    @Param('id') goalId: string,
    @Body() updateContributionDto: UpdateContributionDto,
  ): Promise<GoalResponseDto> {
    // Validate userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required in x-user-id header');
    }

    try {
      const goal = await this.savingsService.addContribution(
        userId,
        goalId,
        updateContributionDto.amount,
      );

      // Map to response DTO
      return {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: goal.progress,
        isCompleted: goal.isCompleted,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      };
    } catch (error) {
      return this.handleError(error, 'updateContribution', { userId, goalId, amount: updateContributionDto.amount });
    }
  }

  /**
   * Centralized error handling method
   * Maps service errors to appropriate HTTP status codes and logs errors
   */
  private handleError(error: unknown, method: string, context: Record<string, any>): never {
    // Handle known service errors
    if (error instanceof ValidationError) {
      this.logger.warn(`Validation error in ${method}`, { error: error.message, context });
      throw new BadRequestException(error.message);
    }

    if (error instanceof AuthorizationError) {
      this.logger.warn(`Authorization error in ${method}`, { error: error.message, context });
      throw new ForbiddenException(error.message);
    }

    if (error instanceof NotFoundError) {
      this.logger.warn(`Not found error in ${method}`, { error: error.message, context });
      throw new NotFoundException(error.message);
    }

    // Handle database errors
    if (this.isDatabaseError(error)) {
      this.logger.error(`Database error in ${method}`, { error: this.getErrorMessage(error), context });
      throw new InternalServerErrorException('An error occurred while processing your request');
    }

    // Handle unexpected errors
    this.logger.error(`Unexpected error in ${method}`, { 
      error: this.getErrorMessage(error), 
      stack: error instanceof Error ? error.stack : undefined,
      context 
    });
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  /**
   * Checks if an error is a database-related error
   */
  private isDatabaseError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const dbErrorPatterns = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'connection',
      'database',
      'constraint',
      'duplicate key',
      'foreign key',
      'deadlock',
    ];

    const errorMessage = error.message.toLowerCase();
    return dbErrorPatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
  }

  /**
   * Safely extracts error message from unknown error type
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
