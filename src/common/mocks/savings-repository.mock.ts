/**
 * Mock implementation of SavingsGoalRepository for testing
 * Provides in-memory storage with full CRUD operations
 */

import { SavingsGoal } from '../test-utils/fixtures';
import { SavingsGoalRepository } from '../../modules/savings/savings.service';

export class MockSavingsGoalRepository implements SavingsGoalRepository {
  private goals: Map<string, SavingsGoal> = new Map();

  /**
   * Retrieves all savings goals
   * @returns Promise resolving to array of all goals
   */
  async find(): Promise<SavingsGoal[]> {
    return Array.from(this.goals.values());
  }

  /**
   * Finds a savings goal by ID
   * @param id - Goal ID to search for
   * @returns Promise resolving to goal or null if not found
   */
  async findOne(id: string): Promise<SavingsGoal | null> {
    return this.goals.get(id) || null;
  }

  /**
   * Finds all goals for a specific user
   * @param userId - User ID to search for
   * @returns Promise resolving to array of goals for the user
   */
  async findByUserId(userId: string): Promise<SavingsGoal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  /**
   * Creates a new savings goal
   * @param goal - Partial goal data for creation
   * @returns Promise resolving to created goal with generated ID
   */
  async create(goal: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const id = this.generateId();
    const newGoal: SavingsGoal = {
      id,
      userId: goal.userId!,
      name: goal.name!,
      targetAmount: goal.targetAmount!,
      currentAmount: goal.currentAmount ?? 0,
      progress: goal.progress ?? 0,
      isCompleted: goal.isCompleted ?? false,
      createdAt: goal.createdAt || new Date(),
      updatedAt: goal.updatedAt || new Date()
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  /**
   * Updates an existing savings goal
   * @param id - Goal ID to update
   * @param goal - Partial goal data for update
   * @returns Promise resolving to updated goal
   */
  async update(id: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) {
      throw new Error(`Goal with ID ${id} not found`);
    }

    const updatedGoal: SavingsGoal = {
      ...existingGoal,
      ...goal,
      id: existingGoal.id,
      updatedAt: new Date()
    };

    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  /**
   * Deletes a savings goal by ID
   * @param id - Goal ID to delete
   * @returns Promise resolving to true if deleted successfully
   */
  async delete(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  /**
   * Clears all goals from the mock repository
   * Useful for test cleanup
   */
  clear(): void {
    this.goals.clear();
  }

  /**
   * Seeds the repository with test data
   * @param goals - Array of goals to seed
   */
  seed(goals: SavingsGoal[]): void {
    goals.forEach(goal => {
      this.goals.set(goal.id, goal);
    });
  }

  /**
   * Generates a UUID v4 for new goals
   * @returns UUID string
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
