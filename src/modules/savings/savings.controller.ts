import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { SavingsService, ValidationError, AuthorizationError, NotFoundError } from './savings.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { GoalResponseDto } from './dto/goal-response.dto';

@ApiTags('savings')
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
  @ApiOperation({ summary: 'Create a new savings goal' })
  @ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID', required: true })
  @ApiBody({ type: CreateGoalDto })
  @ApiResponse({ status: 201, description: 'Savings goal created', type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or missing x-user-id header' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ summary: 'Get all savings goals for the authenticated user' })
  @ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID', required: true })
  @ApiResponse({ status: 200, description: 'List of savings goals', type: [GoalResponseDto] })
  @ApiResponse({ status: 400, description: 'Missing x-user-id header' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ summary: 'Add a contribution to a savings goal' })
  @ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID', required: true })
  @ApiParam({ name: 'id', description: 'Savings goal ID', format: 'uuid' })
  @ApiBody({ type: UpdateContributionDto })
  @ApiResponse({ status: 200, description: 'Contribution added', type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body or missing x-user-id header' })
  @ApiResponse({ status: 403, description: 'User does not own this goal' })
  @ApiResponse({ status: 404, description: 'Savings goal not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
   * Delete a savings goal
   * DELETE /savings/goals/:id
   */
  @Delete('goals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a savings goal' })
  @ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID', required: true })
  @ApiParam({ name: 'id', description: 'Savings goal ID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Goal deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or missing x-user-id header' })
  @ApiResponse({ status: 403, description: 'User does not own this goal' })
  @ApiResponse({ status: 404, description: 'Savings goal not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteGoal(
    @Headers('x-user-id') userId: string,
    @Param('id') goalId: string,
  ): Promise<void> {
    // Validate userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required in x-user-id header');
    }

    try {
      await this.savingsService.deleteGoal(userId, goalId);
    } catch (error) {
      return this.handleError(error, 'deleteGoal', { userId, goalId });
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
