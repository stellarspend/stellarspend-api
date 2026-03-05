/**
 * Savings Service
 * Handles business logic for savings goals management with progress tracking
 */

import { SavingsGoal } from '../../common/test-utils/fixtures';

export interface SavingsGoalRepository {
  find(): Promise<SavingsGoal[]>;
  findOne(id: string): Promise<SavingsGoal | null>;
  findByUserId(userId: string): Promise<SavingsGoal[]>;
  create(goal: Partial<SavingsGoal>): Promise<SavingsGoal>;
  update(id: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal>;
  delete(id: string): Promise<boolean>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class SavingsService {
  constructor(private readonly repository: SavingsGoalRepository) {}

  /**
   * Creates a new savings goal
   * @param userId - User ID to associate with the goal
   * @param name - Name of the savings goal
   * @param targetAmount - Target amount to save
   * @returns Promise resolving to created goal
   * @throws ValidationError if data is invalid
   */
  async createGoal(userId: string, name: string, targetAmount: number): Promise<SavingsGoal> {
    this.validateUserId(userId);
    this.validateName(name);
    this.validateTargetAmount(targetAmount);

    const goal: Partial<SavingsGoal> = {
      userId,
      name,
      targetAmount,
      currentAmount: 0,
      progress: 0,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.repository.create(goal);
  }

  /**
   * Finds all goals for a specific user
   * @param userId - User ID to search for
   * @returns Promise resolving to array of goals for the user
   * @throws ValidationError if userId is invalid
   */
  async findGoalsByUser(userId: string): Promise<SavingsGoal[]> {
    this.validateUserId(userId);
    return this.repository.findByUserId(userId);
  }

  /**
   * Adds a contribution to a savings goal
   * @param userId - User ID making the contribution
   * @param goalId - Goal ID to add contribution to
   * @param amount - Contribution amount
   * @returns Promise resolving to updated goal
   * @throws ValidationError if data is invalid
   * @throws AuthorizationError if user doesn't own the goal
   * @throws NotFoundError if goal doesn't exist
   */
  async addContribution(userId: string, goalId: string, amount: number): Promise<SavingsGoal> {
    this.validateUserId(userId);
    this.validateId(goalId);
    this.validateContributionAmount(amount);

    const goal = await this.repository.findOne(goalId);
    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this goal');
    }

    const newCurrentAmount = goal.currentAmount + amount;
    if (newCurrentAmount > goal.targetAmount) {
      throw new ValidationError('Contribution would exceed target amount');
    }

    const progress = this.calculateProgress(newCurrentAmount, goal.targetAmount);
    const isCompleted = newCurrentAmount === goal.targetAmount;

    const updatedGoal: Partial<SavingsGoal> = {
      currentAmount: newCurrentAmount,
      progress,
      isCompleted,
      updatedAt: new Date()
    };

    return this.repository.update(goalId, updatedGoal);
  }

  /**
   * Calculates progress percentage
   * @param currentAmount - Current saved amount
   * @param targetAmount - Target amount
   * @returns Progress percentage rounded to 2 decimal places
   */
  calculateProgress(currentAmount: number, targetAmount: number): number {
    if (targetAmount === 0) {
      return 0;
    }
    const progress = (currentAmount / targetAmount) * 100;
    return Math.round(progress * 100) / 100;
  }

  /**
   * Validates goal ownership
   * @param userId - User ID to check
   * @param goalId - Goal ID to check
   * @returns Promise resolving to true if user owns the goal
   * @throws AuthorizationError if user doesn't own the goal
   * @throws NotFoundError if goal doesn't exist
   */
  async validateGoalOwnership(userId: string, goalId: string): Promise<boolean> {
    this.validateUserId(userId);
    this.validateId(goalId);

    const goal = await this.repository.findOne(goalId);
    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this goal');
    }

    return true;
  }

  /**
   * Validates goal ID format
   * @param id - ID to validate
   * @throws ValidationError if ID is invalid
   */
  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Goal ID is required and must be a string');
    }

    if (id.trim().length === 0) {
      throw new ValidationError('Goal ID cannot be empty');
    }

    // UUID format validation (accepts any UUID version)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Goal ID must be a valid UUID');
    }
  }

  /**
   * Validates user ID format
   * @param userId - User ID to validate
   * @throws ValidationError if userId is invalid
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required and must be a string');
    }

    if (userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty');
    }

    // UUID format validation (accepts any UUID version)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  /**
   * Validates goal name
   * @param name - Name to validate
   * @throws ValidationError if name is invalid
   */
  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Name is required and must be a string');
    }

    if (name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }

    if (name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }
  }

  /**
   * Validates target amount
   * @param targetAmount - Target amount to validate
   * @throws ValidationError if target amount is invalid
   */
  private validateTargetAmount(targetAmount: number): void {
    if (typeof targetAmount !== 'number') {
      throw new ValidationError('Target amount must be a number');
    }

    if (targetAmount <= 0) {
      throw new ValidationError('Target amount must be greater than 0');
    }

    if (!isFinite(targetAmount)) {
      throw new ValidationError('Target amount must be a finite number');
    }

    // Check for reasonable decimal precision (2 decimal places for currency)
    const decimalPlaces = (targetAmount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new ValidationError('Target amount cannot have more than 2 decimal places');
    }
  }

  /**
   * Validates contribution amount
   * @param amount - Contribution amount to validate
   * @throws ValidationError if amount is invalid
   */
  private validateContributionAmount(amount: number): void {
    if (typeof amount !== 'number') {
      throw new ValidationError('Contribution amount must be a number');
    }

    if (amount <= 0) {
      throw new ValidationError('Contribution amount must be greater than 0');
    }

    if (!isFinite(amount)) {
      throw new ValidationError('Contribution amount must be a finite number');
    }

    // Check for reasonable decimal precision (2 decimal places for currency)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new ValidationError('Contribution amount cannot have more than 2 decimal places');
    }
  }
}
