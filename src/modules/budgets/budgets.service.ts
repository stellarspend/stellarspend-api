/**
 * Budgets Service
 * Handles business logic for budget management with CRUD operations
 */

import { Budget } from '../../common/test-utils/fixtures';

export interface BudgetRepository {
  find(): Promise<Budget[]>;
  findOne(id: string): Promise<Budget | null>;
  findByUserId(userId: string): Promise<Budget[]>;
  findByCategory(category: string): Promise<Budget[]>;
  findByPeriod(period: 'monthly' | 'weekly' | 'yearly'): Promise<Budget[]>;
  create(budget: Partial<Budget>): Promise<Budget>;
  update(id: string, budget: Partial<Budget>): Promise<Budget>;
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

export class BudgetsService {
  constructor(private readonly repository: BudgetRepository) {}

  /**
   * Retrieves all budgets
   * @returns Promise resolving to array of budgets
   */
  async findAll(): Promise<Budget[]> {
    return this.repository.find();
  }

  /**
   * Finds a budget by ID
   * @param id - Budget ID to search for
   * @returns Promise resolving to budget or null if not found
   * @throws ValidationError if ID is invalid
   */
  async findById(id: string): Promise<Budget | null> {
    this.validateId(id);
    return this.repository.findOne(id);
  }

  /**
   * Finds all budgets for a specific user
   * @param userId - User ID to search for
   * @returns Promise resolving to array of budgets for the user
   * @throws ValidationError if userId is invalid
   */
  async findByUserId(userId: string): Promise<Budget[]> {
    this.validateUserId(userId);
    return this.repository.findByUserId(userId);
  }

  /**
   * Finds budgets by category
   * @param category - Category to search for
   * @returns Promise resolving to array of budgets in the category
   * @throws ValidationError if category is invalid
   */
  async findByCategory(category: string): Promise<Budget[]> {
    this.validateCategory(category);
    return this.repository.findByCategory(category);
  }

  /**
   * Finds budgets by period
   * @param period - Period to search for (monthly, weekly, yearly)
   * @returns Promise resolving to array of budgets with the specified period
   * @throws ValidationError if period is invalid
   */
  async findByPeriod(period: 'monthly' | 'weekly' | 'yearly'): Promise<Budget[]> {
    this.validatePeriod(period);
    return this.repository.findByPeriod(period);
  }

  /**
   * Creates a new budget
   * @param budgetData - Partial budget data for creation
   * @returns Promise resolving to created budget with generated ID
   * @throws ValidationError if budget data is invalid
   */
  async create(budgetData: Partial<Budget>): Promise<Budget> {
    this.validateBudgetData(budgetData);
    
    const budget: Partial<Budget> = {
      ...budgetData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return this.repository.create(budget);
  }

  /**
   * Updates an existing budget
   * @param id - Budget ID to update
   * @param budgetData - Partial budget data for update
   * @returns Promise resolving to updated budget
   * @throws ValidationError if ID or data is invalid
   * @throws NotFoundError if budget doesn't exist
   */
  async update(id: string, budgetData: Partial<Budget>): Promise<Budget> {
    this.validateId(id);
    this.validateBudgetData(budgetData, true);
    
    const existingBudget = await this.repository.findOne(id);
    if (!existingBudget) {
      throw new NotFoundError(`Budget with ID ${id} not found`);
    }
    
    const updatedBudget: Partial<Budget> = {
      ...budgetData,
      updatedAt: new Date()
    };
    
    return this.repository.update(id, updatedBudget);
  }

  /**
   * Deletes a budget by ID
   * @param id - Budget ID to delete
   * @returns Promise resolving to true if deleted successfully
   * @throws ValidationError if ID is invalid
   * @throws NotFoundError if budget doesn't exist
   */
  async delete(id: string): Promise<boolean> {
    this.validateId(id);
    
    const existingBudget = await this.repository.findOne(id);
    if (!existingBudget) {
      throw new NotFoundError(`Budget with ID ${id} not found`);
    }
    
    return this.repository.delete(id);
  }

  /**
   * Validates budget ID format
   * @param id - ID to validate
   * @throws ValidationError if ID is invalid
   */
  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Budget ID is required and must be a string');
    }
    
    if (id.trim().length === 0) {
      throw new ValidationError('Budget ID cannot be empty');
    }
    
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Budget ID must be a valid UUID');
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
    
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  /**
   * Validates category
   * @param category - Category to validate
   * @throws ValidationError if category is invalid
   */
  private validateCategory(category: string): void {
    if (!category || typeof category !== 'string') {
      throw new ValidationError('Category is required and must be a string');
    }
    
    if (category.trim().length === 0) {
      throw new ValidationError('Category cannot be empty');
    }
    
    if (category.trim().length < 2) {
      throw new ValidationError('Category must be at least 2 characters long');
    }
  }

  /**
   * Validates budget period
   * @param period - Period to validate
   * @throws ValidationError if period is invalid
   */
  private validatePeriod(period: string): void {
    const validPeriods = ['monthly', 'weekly', 'yearly'];
    
    if (!period || typeof period !== 'string') {
      throw new ValidationError('Period is required and must be a string');
    }
    
    if (!validPeriods.includes(period)) {
      throw new ValidationError('Period must be one of: monthly, weekly, yearly');
    }
  }

  /**
   * Validates date range
   * @param startDate - Start date to validate
   * @param endDate - End date to validate
   * @throws ValidationError if dates are invalid
   */
  private validateDateRange(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new ValidationError('Start date must be a valid Date object');
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new ValidationError('End date must be a valid Date object');
    }
    
    if (startDate > endDate) {
      throw new ValidationError('Start date must be before or equal to end date');
    }
  }

  /**
   * Validates budget data
   * @param budgetData - Budget data to validate
   * @param isUpdate - Whether this is an update operation (allows partial data)
   * @throws ValidationError if data is invalid
   */
  private validateBudgetData(budgetData: Partial<Budget>, isUpdate: boolean = false): void {
    if (!budgetData || typeof budgetData !== 'object') {
      throw new ValidationError('Budget data is required and must be an object');
    }

    // User ID validation
    if (budgetData.userId !== undefined) {
      if (typeof budgetData.userId !== 'string' || budgetData.userId.trim().length === 0) {
        throw new ValidationError('User ID is required and cannot be empty');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(budgetData.userId)) {
        throw new ValidationError('User ID must be a valid UUID');
      }
    } else if (!isUpdate) {
      throw new ValidationError('User ID is required');
    }

    // Category validation
    if (budgetData.category !== undefined) {
      if (typeof budgetData.category !== 'string' || budgetData.category.trim().length === 0) {
        throw new ValidationError('Category is required and cannot be empty');
      }
      
      if (budgetData.category.trim().length < 2) {
        throw new ValidationError('Category must be at least 2 characters long');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Category is required');
    }

    // Limit validation
    if (budgetData.limit !== undefined) {
      if (typeof budgetData.limit !== 'number') {
        throw new ValidationError('Limit must be a number');
      }
      
      if (budgetData.limit <= 0) {
        throw new ValidationError('Limit must be greater than zero');
      }
      
      if (!isFinite(budgetData.limit)) {
        throw new ValidationError('Limit must be a finite number');
      }
      
      // Check for reasonable decimal precision (2 decimal places for currency)
      const decimalPlaces = (budgetData.limit.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new ValidationError('Limit cannot have more than 2 decimal places');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Limit is required');
    }

    // Period validation
    if (budgetData.period !== undefined) {
      const validPeriods = ['monthly', 'weekly', 'yearly'];
      
      if (typeof budgetData.period !== 'string') {
        throw new ValidationError('Period must be a string');
      }
      
      if (!validPeriods.includes(budgetData.period)) {
        throw new ValidationError('Period must be one of: monthly, weekly, yearly');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Period is required');
    }

    // Start date validation
    if (budgetData.startDate !== undefined) {
      if (!(budgetData.startDate instanceof Date)) {
        throw new ValidationError('Start date must be a valid Date object');
      }
      
      if (isNaN(budgetData.startDate.getTime())) {
        throw new ValidationError('Start date must be a valid date');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Start date is required');
    }

    // End date validation
    if (budgetData.endDate !== undefined) {
      if (!(budgetData.endDate instanceof Date)) {
        throw new ValidationError('End date must be a valid Date object');
      }
      
      if (isNaN(budgetData.endDate.getTime())) {
        throw new ValidationError('End date must be a valid date');
      }
    } else if (!isUpdate) {
      throw new ValidationError('End date is required');
    }

    // Date range validation (if both dates are provided)
    if (budgetData.startDate !== undefined && budgetData.endDate !== undefined) {
      this.validateDateRange(budgetData.startDate, budgetData.endDate);
    }
  }
}
