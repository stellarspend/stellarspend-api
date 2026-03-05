import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SavingsController } from './savings.controller';
import { SavingsService, ValidationError, AuthorizationError, NotFoundError } from './savings.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { createTestSavingsGoal } from '../../common/test-utils/fixtures';

describe('SavingsController', () => {
  let controller: SavingsController;
  let mockSavingsService: jest.Mocked<SavingsService>;

  beforeEach(() => {
    // Create mock service
    mockSavingsService = {
      createGoal: jest.fn(),
      findGoalsByUser: jest.fn(),
      addContribution: jest.fn(),
      calculateProgress: jest.fn(),
      validateGoalOwnership: jest.fn(),
    } as any;

    // Create controller with mock service
    controller = new SavingsController(mockSavingsService);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('createGoal', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const createGoalDto: CreateGoalDto = {
      name: 'Emergency Fund',
      targetAmount: 1000,
    };

    it('should create a goal and return 201 with GoalResponseDto', async () => {
      const mockGoal = createTestSavingsGoal({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
        name: 'Emergency Fund',
        targetAmount: 1000,
        currentAmount: 0,
        progress: 0,
        isCompleted: false,
      });

      mockSavingsService.createGoal.mockResolvedValue(mockGoal);

      const result = await controller.createGoal(userId, createGoalDto);

      expect(mockSavingsService.createGoal).toHaveBeenCalledWith(
        userId,
        createGoalDto.name,
        createGoalDto.targetAmount,
      );
      expect(result).toEqual({
        id: mockGoal.id,
        name: mockGoal.name,
        targetAmount: mockGoal.targetAmount,
        currentAmount: mockGoal.currentAmount,
        progress: mockGoal.progress,
        isCompleted: mockGoal.isCompleted,
        createdAt: mockGoal.createdAt,
        updatedAt: mockGoal.updatedAt,
      });
    });

    it('should throw BadRequestException when userId is not provided', async () => {
      await expect(controller.createGoal('', createGoalDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.createGoal('', createGoalDto)).rejects.toThrow(
        'User ID is required in x-user-id header',
      );
      expect(mockSavingsService.createGoal).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when service throws ValidationError', async () => {
      mockSavingsService.createGoal.mockRejectedValue(
        new ValidationError('Target amount must be greater than 0'),
      );

      await expect(controller.createGoal(userId, createGoalDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.createGoal(userId, createGoalDto)).rejects.toThrow(
        'Target amount must be greater than 0',
      );
    });

    it('should handle validation error for invalid target amount', async () => {
      const invalidDto: CreateGoalDto = {
        name: 'Test Goal',
        targetAmount: -100,
      };

      mockSavingsService.createGoal.mockRejectedValue(
        new ValidationError('Target amount must be greater than 0'),
      );

      await expect(controller.createGoal(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should propagate non-validation errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockSavingsService.createGoal.mockRejectedValue(unexpectedError);

      await expect(controller.createGoal(userId, createGoalDto)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });

    it('should handle database errors with generic message', async () => {
      const dbError = new Error('ECONNREFUSED: Connection refused');
      mockSavingsService.createGoal.mockRejectedValue(dbError);

      await expect(controller.createGoal(userId, createGoalDto)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });

    it('should handle unexpected errors with generic message', async () => {
      const unexpectedError = new Error('Something went wrong');
      mockSavingsService.createGoal.mockRejectedValue(unexpectedError);

      await expect(controller.createGoal(userId, createGoalDto)).rejects.toThrow(
        'An unexpected error occurred',
      );
    });
  });

  describe('getGoals', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return 200 with array of GoalResponseDto', async () => {
      const mockGoals = [
        createTestSavingsGoal({
          id: '123e4567-e89b-12d3-a456-426614174001',
          userId,
          name: 'Emergency Fund',
          targetAmount: 1000,
          currentAmount: 500,
          progress: 50,
          isCompleted: false,
        }),
        createTestSavingsGoal({
          id: '123e4567-e89b-12d3-a456-426614174002',
          userId,
          name: 'Vacation',
          targetAmount: 2000,
          currentAmount: 1000,
          progress: 50,
          isCompleted: false,
        }),
      ];

      mockSavingsService.findGoalsByUser.mockResolvedValue(mockGoals);

      const result = await controller.getGoals(userId);

      expect(mockSavingsService.findGoalsByUser).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockGoals[0].id,
        name: mockGoals[0].name,
        targetAmount: mockGoals[0].targetAmount,
        currentAmount: mockGoals[0].currentAmount,
        progress: mockGoals[0].progress,
        isCompleted: mockGoals[0].isCompleted,
        createdAt: mockGoals[0].createdAt,
        updatedAt: mockGoals[0].updatedAt,
      });
      expect(result[1]).toEqual({
        id: mockGoals[1].id,
        name: mockGoals[1].name,
        targetAmount: mockGoals[1].targetAmount,
        currentAmount: mockGoals[1].currentAmount,
        progress: mockGoals[1].progress,
        isCompleted: mockGoals[1].isCompleted,
        createdAt: mockGoals[1].createdAt,
        updatedAt: mockGoals[1].updatedAt,
      });
    });

    it('should return empty array when user has no goals', async () => {
      mockSavingsService.findGoalsByUser.mockResolvedValue([]);

      const result = await controller.getGoals(userId);

      expect(mockSavingsService.findGoalsByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it('should throw BadRequestException when userId is not provided', async () => {
      await expect(controller.getGoals('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getGoals('')).rejects.toThrow(
        'User ID is required in x-user-id header',
      );
      expect(mockSavingsService.findGoalsByUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when service throws ValidationError', async () => {
      mockSavingsService.findGoalsByUser.mockRejectedValue(
        new ValidationError('User ID must be a valid UUID'),
      );

      await expect(controller.getGoals(userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getGoals(userId)).rejects.toThrow(
        'User ID must be a valid UUID',
      );
    });

    it('should propagate non-validation errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockSavingsService.findGoalsByUser.mockRejectedValue(unexpectedError);

      await expect(controller.getGoals(userId)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });

    it('should handle database errors with generic message', async () => {
      const dbError = new Error('Connection timeout');
      mockSavingsService.findGoalsByUser.mockRejectedValue(dbError);

      await expect(controller.getGoals(userId)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });
  });

  describe('updateContribution', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const goalId = '123e4567-e89b-12d3-a456-426614174001';
    const updateContributionDto: UpdateContributionDto = {
      amount: 100,
    };

    it('should add contribution and return 200 with updated GoalResponseDto', async () => {
      const mockGoal = createTestSavingsGoal({
        id: goalId,
        userId,
        name: 'Emergency Fund',
        targetAmount: 1000,
        currentAmount: 100,
        progress: 10,
        isCompleted: false,
      });

      mockSavingsService.addContribution.mockResolvedValue(mockGoal);

      const result = await controller.updateContribution(userId, goalId, updateContributionDto);

      expect(mockSavingsService.addContribution).toHaveBeenCalledWith(
        userId,
        goalId,
        updateContributionDto.amount,
      );
      expect(result).toEqual({
        id: mockGoal.id,
        name: mockGoal.name,
        targetAmount: mockGoal.targetAmount,
        currentAmount: mockGoal.currentAmount,
        progress: mockGoal.progress,
        isCompleted: mockGoal.isCompleted,
        createdAt: mockGoal.createdAt,
        updatedAt: mockGoal.updatedAt,
      });
    });

    it('should throw BadRequestException when userId is not provided', async () => {
      await expect(controller.updateContribution('', goalId, updateContributionDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.updateContribution('', goalId, updateContributionDto)).rejects.toThrow(
        'User ID is required in x-user-id header',
      );
      expect(mockSavingsService.addContribution).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when service throws ValidationError', async () => {
      mockSavingsService.addContribution.mockRejectedValue(
        new ValidationError('Contribution amount must be greater than 0'),
      );

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'Contribution amount must be greater than 0',
      );
    });

    it('should throw BadRequestException when contribution would exceed target', async () => {
      mockSavingsService.addContribution.mockRejectedValue(
        new ValidationError('Contribution would exceed target amount'),
      );

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'Contribution would exceed target amount',
      );
    });

    it('should throw ForbiddenException when service throws AuthorizationError', async () => {
      mockSavingsService.addContribution.mockRejectedValue(
        new AuthorizationError('You do not have permission to access this goal'),
      );

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'You do not have permission to access this goal',
      );
    });

    it('should throw NotFoundException when service throws NotFoundError', async () => {
      mockSavingsService.addContribution.mockRejectedValue(
        new NotFoundError('Goal not found'),
      );

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'Goal not found',
      );
    });

    it('should handle contribution that completes the goal', async () => {
      const completedGoal = createTestSavingsGoal({
        id: goalId,
        userId,
        name: 'Emergency Fund',
        targetAmount: 1000,
        currentAmount: 1000,
        progress: 100,
        isCompleted: true,
      });

      mockSavingsService.addContribution.mockResolvedValue(completedGoal);

      const result = await controller.updateContribution(userId, goalId, updateContributionDto);

      expect(result.isCompleted).toBe(true);
      expect(result.progress).toBe(100);
      expect(result.currentAmount).toBe(1000);
    });

    it('should propagate non-validation errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockSavingsService.addContribution.mockRejectedValue(unexpectedError);

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });

    it('should handle database constraint violations', async () => {
      const constraintError = new Error('Duplicate key constraint violation');
      mockSavingsService.addContribution.mockRejectedValue(constraintError);

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });

    it('should handle deadlock errors', async () => {
      const deadlockError = new Error('Deadlock detected');
      mockSavingsService.addContribution.mockRejectedValue(deadlockError);

      await expect(controller.updateContribution(userId, goalId, updateContributionDto)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });
  });
});
