/**
 * Transactions Service
 * Handles business logic for transaction management with CRUD operations
 */

import { Transaction } from '../../common/test-utils/fixtures';

export interface TransactionRepository {
  find(): Promise<Transaction[]>;
  findOne(id: string): Promise<Transaction | null>;
  findByUserId(userId: string): Promise<Transaction[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  findByCategory(category: string): Promise<Transaction[]>;
  create(transaction: Partial<Transaction>): Promise<Transaction>;
  update(id: string, transaction: Partial<Transaction>): Promise<Transaction>;
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

export class TransactionsService {
  constructor(private readonly repository: TransactionRepository) {}

  /**
   * Retrieves all transactions
   * @returns Promise resolving to array of transactions
   */
  async findAll(): Promise<Transaction[]> {
    return this.repository.find();
  }

  /**
   * Finds a transaction by ID
   * @param id - Transaction ID to search for
   * @returns Promise resolving to transaction or null if not found
   * @throws ValidationError if ID is invalid
   */
  async findById(id: string): Promise<Transaction | null> {
    this.validateId(id);
    return this.repository.findOne(id);
  }

  /**
   * Finds all transactions for a specific user
   * @param userId - User ID to search for
   * @returns Promise resolving to array of transactions for the user
   * @throws ValidationError if userId is invalid
   */
  async findByUserId(userId: string): Promise<Transaction[]> {
    this.validateUserId(userId);
    return this.repository.findByUserId(userId);
  }

  /**
   * Finds transactions within a date range
   * @param startDate - Start date of the range
   * @param endDate - End date of the range
   * @returns Promise resolving to array of transactions within the date range
   * @throws ValidationError if dates are invalid
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    this.validateDateRange(startDate, endDate);
    return this.repository.findByDateRange(startDate, endDate);
  }

  /**
   * Finds transactions by category
   * @param category - Category to search for
   * @returns Promise resolving to array of transactions in the category
   * @throws ValidationError if category is invalid
   */
  async findByCategory(category: string): Promise<Transaction[]> {
    this.validateCategory(category);
    return this.repository.findByCategory(category);
  }

  /**
   * Creates a new transaction
   * @param transactionData - Partial transaction data for creation
   * @returns Promise resolving to created transaction with generated ID
   * @throws ValidationError if transaction data is invalid
   */
  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    this.validateTransactionData(transactionData);
    
    const transaction: Partial<Transaction> = {
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return this.repository.create(transaction);
  }

  /**
   * Updates an existing transaction
   * @param id - Transaction ID to update
   * @param transactionData - Partial transaction data for update
   * @returns Promise resolving to updated transaction
   * @throws ValidationError if ID or data is invalid
   * @throws NotFoundError if transaction doesn't exist
   */
  async update(id: string, transactionData: Partial<Transaction>): Promise<Transaction> {
    this.validateId(id);
    this.validateTransactionData(transactionData, true);
    
    const existingTransaction = await this.repository.findOne(id);
    if (!existingTransaction) {
      throw new NotFoundError(`Transaction with ID ${id} not found`);
    }
    
    const updatedTransaction: Partial<Transaction> = {
      ...transactionData,
      updatedAt: new Date()
    };
    
    return this.repository.update(id, updatedTransaction);
  }

  /**
   * Deletes a transaction by ID
   * @param id - Transaction ID to delete
   * @returns Promise resolving to true if deleted successfully
   * @throws ValidationError if ID is invalid
   * @throws NotFoundError if transaction doesn't exist
   */
  async delete(id: string): Promise<boolean> {
    this.validateId(id);
    
    const existingTransaction = await this.repository.findOne(id);
    if (!existingTransaction) {
      throw new NotFoundError(`Transaction with ID ${id} not found`);
    }
    
    return this.repository.delete(id);
  }

  /**
   * Validates transaction ID format
   * @param id - ID to validate
   * @throws ValidationError if ID is invalid
   */
  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Transaction ID is required and must be a string');
    }
    
    if (id.trim().length === 0) {
      throw new ValidationError('Transaction ID cannot be empty');
    }
    
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Transaction ID must be a valid UUID');
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
   * Validates transaction data
   * @param transactionData - Transaction data to validate
   * @param isUpdate - Whether this is an update operation (allows partial data)
   * @throws ValidationError if data is invalid
   */
  private validateTransactionData(transactionData: Partial<Transaction>, isUpdate: boolean = false): void {
    if (!transactionData || typeof transactionData !== 'object') {
      throw new ValidationError('Transaction data is required and must be an object');
    }

    // User ID validation
    if (transactionData.userId !== undefined) {
      if (typeof transactionData.userId !== 'string' || transactionData.userId.trim().length === 0) {
        throw new ValidationError('User ID is required and cannot be empty');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(transactionData.userId)) {
        throw new ValidationError('User ID must be a valid UUID');
      }
    } else if (!isUpdate) {
      throw new ValidationError('User ID is required');
    }

    // Amount validation
    if (transactionData.amount !== undefined) {
      if (typeof transactionData.amount !== 'number') {
        throw new ValidationError('Amount must be a number');
      }
      
      if (transactionData.amount < 0) {
        throw new ValidationError('Amount cannot be negative');
      }
      
      if (!isFinite(transactionData.amount)) {
        throw new ValidationError('Amount must be a finite number');
      }
      
      // Check for reasonable decimal precision (2 decimal places for currency)
      const decimalPlaces = (transactionData.amount.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new ValidationError('Amount cannot have more than 2 decimal places');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Amount is required');
    }

    // Category validation
    if (transactionData.category !== undefined) {
      if (typeof transactionData.category !== 'string' || transactionData.category.trim().length === 0) {
        throw new ValidationError('Category is required and cannot be empty');
      }
      
      if (transactionData.category.trim().length < 2) {
        throw new ValidationError('Category must be at least 2 characters long');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Category is required');
    }

    // Date validation
    if (transactionData.date !== undefined) {
      if (!(transactionData.date instanceof Date)) {
        throw new ValidationError('Date must be a valid Date object');
      }
      
      if (isNaN(transactionData.date.getTime())) {
        throw new ValidationError('Date must be a valid date');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Date is required');
    }

    // Description validation (optional field)
    if (transactionData.description !== undefined) {
      if (typeof transactionData.description !== 'string') {
        throw new ValidationError('Description must be a string');
      }
    }
  }
}
