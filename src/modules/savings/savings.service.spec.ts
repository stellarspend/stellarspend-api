/**
 * Savings Service Unit Tests
 * Tests business logic for savings goals management
 */

import { SavingsService, ValidationError, NotFoundError, AuthorizationError } from './savings.service';
import { MockSavingsGoalRepository } from '../../common/mocks/savings-repository.mock';
import { createTestSavingsGoal } from '../../common/test-utils/fixtures';

describe('SavingsService', () => {
  let service: SavingsService;
  let repository: MockSavingsGoalRepository;

  beforeEach(() => {
    repository = new MockSavingsGoalRepository();
    service = new SavingsService(repository);
  });

  afterEach(() => {
    repository.clear();
  });

  describe('createGoal', () => {
    it('should create a goal with valid data', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const name = 'Emergency Fund';
      const targetAmount = 1000.00;

      const goal = await service.createGoal(userId, name, targetAmount);

      expect(goal).toBeDefined();
      expect(goal.id).toBeDefined();
      expect(goal.userId).toBe(userId);
      expect(goal.name).toBe(name);
      expect(goal.targetAmount).toBe(targetAmount);
      expect(goal.currentAmount).toBe(0);
      expect(goal.progress).toBe(0);
      expect(goal.isCompleted).toBe(false);
      expect(goal.createdAt).toBeInstanceOf(Date);
      expect(goal.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject goal with target amount less than or equal to zero', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const name = 'Invalid Goal';

      await expect(service.createGoal(userId, name, 0)).rejects.toThrow(ValidationError);
      await expect(service.createGoal(userId, name, -100)).rejects.toThrow(ValidationError);
    });

    it('should reject goal with invalid user ID', async () => {
      await expect(service.createGoal('', 'Goal', 1000)).rejects.toThrow(ValidationError);
      await expect(service.createGoal('invalid-uuid', 'Goal', 1000)).rejects.toThrow(ValidationError);
    });

    it('should reject goal with invalid name', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await expect(service.createGoal(userId, '', 1000)).rejects.toThrow(ValidationError);
      await expect(service.createGoal(userId, 'A', 1000)).rejects.toThrow(ValidationError);
    });

    it('should reject goal with more than 2 decimal places', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await expect(service.createGoal(userId, 'Goal', 100.123)).rejects.toThrow(ValidationError);
    });
  });

  describe('findGoalsByUser', () => {
    it('should return all goals for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goal1 = createTestSavingsGoal({ userId });
      const goal2 = createTestSavingsGoal({ id: '123e4567-e89b-12d3-a456-426614174004', userId, name: 'Vacation' });

      repository.seed([goal1, goal2]);

      const goals = await service.findGoalsByUser(userId);

      expect(goals).toHaveLength(2);
      expect(goals[0].userId).toBe(userId);
      expect(goals[1].userId).toBe(userId);
    });

    it('should return empty array when user has no goals', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const goals = await service.findGoalsByUser(userId);

      expect(goals).toEqual([]);
    });

    it('should not return goals from other users', async () => {
      const userId1 = '123e4567-e89b-12d3-a456-426614174000';
      const userId2 = '123e4567-e89b-12d3-a456-426614174001';
      const goal1 = createTestSavingsGoal({ userId: userId1 });
      const goal2 = createTestSavingsGoal({ id: '123e4567-e89b-12d3-a456-426614174004', userId: userId2 });

      repository.seed([goal1, goal2]);

      const goals = await service.findGoalsByUser(userId1);

      expect(goals).toHaveLength(1);
      expect(goals[0].userId).toBe(userId1);
    });

    it('should reject invalid user ID', async () => {
      await expect(service.findGoalsByUser('')).rejects.toThrow(ValidationError);
      await expect(service.findGoalsByUser('invalid-uuid')).rejects.toThrow(ValidationError);
    });
  });

  describe('addContribution', () => {
    it('should add valid contribution to goal', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goal = createTestSavingsGoal({ userId, currentAmount: 100, targetAmount: 1000 });
      repository.seed([goal]);

      const updatedGoal = await service.addContribution(userId, goal.id, 200);

      expect(updatedGoal.currentAmount).toBe(300);
      expect(updatedGoal.progress).toBe(30);
      expect(updatedGoal.isCompleted).toBe(false);
    });

    it('should mark goal as completed when reaching target', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goal = createTestSavingsGoal({ userId, currentAmount: 800, targetAmount: 1000 });
      repository.seed([goal]);

      const updatedGoal = await service.addContribution(userId, goal.id, 200);

      expect(updatedGoal.currentAmount).toBe(1000);
      expect(updatedGoal.progress).toBe(100);
      expect(updatedGoal.isCompleted).toBe(true);
    });

    it('should reject contribution that exceeds target', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goal = createTestSavingsGoal({ userId, currentAmount: 900, targetAmount: 1000 });
      repository.seed([goal]);

      await expect(service.addContribution(userId, goal.id, 200)).rejects.toThrow(ValidationError);
      await expect(service.addContribution(userId, goal.id, 200)).rejects.toThrow('Contribution would exceed target amount');
    });

    it('should reject contribution less than or equal to zero', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goal = createTestSavingsGoal({ userId });
      repository.seed([goal]);

      await expect(service.addContribution(userId, goal.id, 0)).rejects.toThrow(ValidationError);
      await expect(service.addContribution(userId, goal.id, -50)).rejects.toThrow(ValidationError);
    });

    it('should reject contribution to non-existent goal', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goalId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(service.addContribution(userId, goalId, 100)).rejects.toThrow(NotFoundError);
    });

    it('should reject contribution from non-owner', async () => {
      const ownerId = '123e4567-e89b-12d3-a456-426614174000';
      const otherUserId = '123e4567-e89b-12d3-a456-426614174001';
      const goal = createTestSavingsGoal({ userId: ownerId });
      repository.seed([goal]);

      await expect(service.addContribution(otherUserId, goal.id, 100)).rejects.toThrow(AuthorizationError);
      await expect(service.addContribution(otherUserId, goal.id, 100)).rejects.toThrow('You do not have permission to access this goal');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      expect(service.calculateProgress(0, 1000)).toBe(0);
      expect(service.calculateProgress(250, 1000)).toBe(25);
      expect(service.calculateProgress(500, 1000)).toBe(50);
      expect(service.calculateProgress(1000, 1000)).toBe(100);
    });

    it('should round progress to 2 decimal places', () => {
      expect(service.calculateProgress(333.33, 1000)).toBe(33.33);
      expect(service.calculateProgress(666.67, 1000)).toBe(66.67);
      expect(service.calculateProgress(123.456, 1000)).toBe(12.35);
    });

    it('should return 0 when target is 0', () => {
      expect(service.calculateProgress(100, 0)).toBe(0);
    });
  });

  describe('validateGoalOwnership', () => {
    it('should return true for valid owner', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goal = createTestSavingsGoal({ userId });
      repository.seed([goal]);

      const result = await service.validateGoalOwnership(userId, goal.id);

      expect(result).toBe(true);
    });

    it('should throw AuthorizationError for non-owner', async () => {
      const ownerId = '123e4567-e89b-12d3-a456-426614174000';
      const otherUserId = '123e4567-e89b-12d3-a456-426614174001';
      const goal = createTestSavingsGoal({ userId: ownerId });
      repository.seed([goal]);

      await expect(service.validateGoalOwnership(otherUserId, goal.id)).rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError for non-existent goal', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const goalId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(service.validateGoalOwnership(userId, goalId)).rejects.toThrow(NotFoundError);
    });
  });
});
