/**
 * Transactions Service Test Suite
 * Comprehensive tests for TransactionsService with success and failure scenarios
 */

import { TransactionsService, ValidationError, NotFoundError, TransactionRepository } from './transactions.service';
import { createMockRepository, MockRepository } from '../../common/mocks/repository.mock';
import { createTestTransaction, createTestTransactionList, Transaction } from '../../common/test-utils/fixtures';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockRepository: MockRepository<Transaction>;

  beforeEach(() => {
    // Initialize mock repository with fresh mocks for each test
    mockRepository = createMockRepository<Transaction>();
    service = new TransactionsService(mockRepository as unknown as TransactionRepository);
  });

  afterEach(() => {
    // Clear all mocks to ensure test isolation
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('success scenarios', () => {
      it('should return all transactions when transactions exist', async () => {
        // Arrange
        const expectedTransactions = createTestTransactionList(3);
        mockRepository.find.mockResolvedValue(expectedTransactions);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual(expectedTransactions);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
        expect(mockRepository.find).toHaveBeenCalledWith();
      });

      it('should return empty array when no transactions exist', async () => {
        // Arrange
        mockRepository.find.mockResolvedValue([]);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
      });
    });

    describe('failure scenarios', () => {
      it('should handle database errors during retrieval', async () => {
        // Arrange
        const dbError = new Error('Database connection timeout');
        mockRepository.find.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findAll()).rejects.toThrow('Database connection timeout');
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('findById', () => {
    describe('success scenarios', () => {
      it('should return transaction when valid ID is provided', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        const expectedTransaction = createTestTransaction({ id: validId });
        mockRepository.findOne.mockResolvedValue(expectedTransaction);

        // Act
        const result = await service.findById(validId);

        // Assert
        expect(result).toEqual(expectedTransaction);
        expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });

      it('should return null when transaction is not found', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);

        // Act
        const result = await service.findById(validId);

        // Assert
        expect(result).toBeNull();
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when ID is empty string', async () => {
        // Act & Assert
        await expect(service.findById('')).rejects.toThrow(ValidationError);
        await expect(service.findById('')).rejects.toThrow('Transaction ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is not a string', async () => {
        // Act & Assert
        await expect(service.findById(null as any)).rejects.toThrow(ValidationError);
        await expect(service.findById(null as any)).rejects.toThrow('Transaction ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is not a valid UUID', async () => {
        // Act & Assert
        await expect(service.findById('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.findById('invalid-id')).rejects.toThrow('Transaction ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is whitespace only', async () => {
        // Act & Assert
        await expect(service.findById('   ')).rejects.toThrow(ValidationError);
        await expect(service.findById('   ')).rejects.toThrow('Transaction ID cannot be empty');
      });

      it('should handle database errors during retrieval', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        const dbError = new Error('Database query failed');
        mockRepository.findOne.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findById(validId)).rejects.toThrow('Database query failed');
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });
    });
  });

  describe('findByUserId', () => {
    describe('success scenarios', () => {
      it('should return all transactions for a valid user ID', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const expectedTransactions = createTestTransactionList(3, { userId });
        mockRepository.findByUserId.mockResolvedValue(expectedTransactions);

        // Act
        const result = await service.findByUserId(userId);

        // Assert
        expect(result).toEqual(expectedTransactions);
        expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      });

      it('should return empty array when user has no transactions', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findByUserId.mockResolvedValue([]);

        // Act
        const result = await service.findByUserId(userId);

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when userId is empty string', async () => {
        // Act & Assert
        await expect(service.findByUserId('')).rejects.toThrow(ValidationError);
        await expect(service.findByUserId('')).rejects.toThrow('User ID is required and must be a string');
        expect(mockRepository.findByUserId).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is not a valid UUID', async () => {
        // Act & Assert
        await expect(service.findByUserId('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.findByUserId('invalid-id')).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.findByUserId).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is whitespace only', async () => {
        // Act & Assert
        await expect(service.findByUserId('   ')).rejects.toThrow(ValidationError);
        await expect(service.findByUserId('   ')).rejects.toThrow('User ID cannot be empty');
      });

      it('should handle database errors during retrieval', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const dbError = new Error('Database connection lost');
        mockRepository.findByUserId.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findByUserId(userId)).rejects.toThrow('Database connection lost');
        expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      });
    });
  });

  describe('findByDateRange', () => {
    describe('success scenarios', () => {
      it('should return transactions within the specified date range', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T00:00:00Z');
        const endDate = new Date('2024-01-31T23:59:59Z');
        const expectedTransactions = createTestTransactionList(3);
        mockRepository.findByDateRange.mockResolvedValue(expectedTransactions);

        // Act
        const result = await service.findByDateRange(startDate, endDate);

        // Assert
        expect(result).toEqual(expectedTransactions);
        expect(mockRepository.findByDateRange).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      });

      it('should return empty array when no transactions exist in date range', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T00:00:00Z');
        const endDate = new Date('2024-01-31T23:59:59Z');
        mockRepository.findByDateRange.mockResolvedValue([]);

        // Act
        const result = await service.findByDateRange(startDate, endDate);

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      });

      it('should handle same start and end date', async () => {
        // Arrange
        const sameDate = new Date('2024-01-15T00:00:00Z');
        const expectedTransactions = createTestTransactionList(1);
        mockRepository.findByDateRange.mockResolvedValue(expectedTransactions);

        // Act
        const result = await service.findByDateRange(sameDate, sameDate);

        // Assert
        expect(result).toEqual(expectedTransactions);
        expect(mockRepository.findByDateRange).toHaveBeenCalledWith(sameDate, sameDate);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when start date is invalid', async () => {
        // Arrange
        const invalidDate = new Date('invalid-date');
        const validDate = new Date('2024-01-31T23:59:59Z');

        // Act & Assert
        await expect(service.findByDateRange(invalidDate, validDate)).rejects.toThrow(ValidationError);
        await expect(service.findByDateRange(invalidDate, validDate)).rejects.toThrow('Start date must be a valid Date object');
        expect(mockRepository.findByDateRange).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when end date is invalid', async () => {
        // Arrange
        const validDate = new Date('2024-01-01T00:00:00Z');
        const invalidDate = new Date('invalid-date');

        // Act & Assert
        await expect(service.findByDateRange(validDate, invalidDate)).rejects.toThrow(ValidationError);
        await expect(service.findByDateRange(validDate, invalidDate)).rejects.toThrow('End date must be a valid Date object');
        expect(mockRepository.findByDateRange).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when start date is after end date', async () => {
        // Arrange
        const startDate = new Date('2024-01-31T23:59:59Z');
        const endDate = new Date('2024-01-01T00:00:00Z');

        // Act & Assert
        await expect(service.findByDateRange(startDate, endDate)).rejects.toThrow(ValidationError);
        await expect(service.findByDateRange(startDate, endDate)).rejects.toThrow('Start date must be before or equal to end date');
        expect(mockRepository.findByDateRange).not.toHaveBeenCalled();
      });

      it('should handle database errors during retrieval', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T00:00:00Z');
        const endDate = new Date('2024-01-31T23:59:59Z');
        const dbError = new Error('Database index error');
        mockRepository.findByDateRange.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findByDateRange(startDate, endDate)).rejects.toThrow('Database index error');
        expect(mockRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      });
    });
  });

  describe('findByCategory', () => {
    describe('success scenarios', () => {
      it('should return all transactions for a valid category', async () => {
        // Arrange
        const category = 'groceries';
        const expectedTransactions = createTestTransactionList(3, { category });
        mockRepository.findByCategory.mockResolvedValue(expectedTransactions);

        // Act
        const result = await service.findByCategory(category);

        // Assert
        expect(result).toEqual(expectedTransactions);
        expect(mockRepository.findByCategory).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByCategory).toHaveBeenCalledWith(category);
      });

      it('should return empty array when no transactions exist for category', async () => {
        // Arrange
        const category = 'entertainment';
        mockRepository.findByCategory.mockResolvedValue([]);

        // Act
        const result = await service.findByCategory(category);

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.findByCategory).toHaveBeenCalledWith(category);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when category is empty string', async () => {
        // Act & Assert
        await expect(service.findByCategory('')).rejects.toThrow(ValidationError);
        await expect(service.findByCategory('')).rejects.toThrow('Category is required and must be a string');
        expect(mockRepository.findByCategory).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is too short', async () => {
        // Act & Assert
        await expect(service.findByCategory('A')).rejects.toThrow(ValidationError);
        await expect(service.findByCategory('A')).rejects.toThrow('Category must be at least 2 characters long');
        expect(mockRepository.findByCategory).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is whitespace only', async () => {
        // Act & Assert
        await expect(service.findByCategory('   ')).rejects.toThrow(ValidationError);
        await expect(service.findByCategory('   ')).rejects.toThrow('Category cannot be empty');
      });

      it('should handle database errors during retrieval', async () => {
        // Arrange
        const category = 'groceries';
        const dbError = new Error('Database table locked');
        mockRepository.findByCategory.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findByCategory(category)).rejects.toThrow('Database table locked');
        expect(mockRepository.findByCategory).toHaveBeenCalledWith(category);
      });
    });
  });

  describe('create', () => {
    describe('success scenarios', () => {
      it('should create transaction with valid data', async () => {
        // Arrange
        const transactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z'),
          description: 'Weekly shopping'
        };
        const expectedTransaction = createTestTransaction(transactionData);
        mockRepository.create.mockResolvedValue(expectedTransaction);

        // Act
        const result = await service.create(transactionData);

        // Assert
        expect(result).toEqual(expectedTransaction);
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: transactionData.userId,
            amount: transactionData.amount,
            category: transactionData.category,
            date: transactionData.date,
            description: transactionData.description,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should add timestamps when creating transaction', async () => {
        // Arrange
        const transactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z'),
          description: 'Weekly shopping'
        };
        const expectedTransaction = createTestTransaction(transactionData);
        mockRepository.create.mockResolvedValue(expectedTransaction);

        // Act
        await service.create(transactionData);

        // Assert
        const callArgs = mockRepository.create.mock.calls[0][0];
        expect(callArgs.createdAt).toBeInstanceOf(Date);
        expect(callArgs.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when userId is missing', async () => {
        // Arrange
        const invalidTransactionData = {
          amount: 50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('User ID is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is empty', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '',
          amount: 50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('User ID is required and cannot be empty');
      });

      it('should throw ValidationError when userId is not a valid UUID', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: 'invalid-uuid',
          amount: 50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('User ID must be a valid UUID');
      });

      it('should throw ValidationError when amount is missing', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Amount is required');
      });

      it('should throw ValidationError when amount is not a number', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 'not-a-number' as any,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Amount must be a number');
      });

      it('should throw ValidationError when amount is negative', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: -50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Amount cannot be negative');
      });

      it('should throw ValidationError when amount has more than 2 decimal places', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.123,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Amount cannot have more than 2 decimal places');
      });

      it('should throw ValidationError when category is missing', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Category is required');
      });

      it('should throw ValidationError when category is empty', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: '',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Category is required and cannot be empty');
      });

      it('should throw ValidationError when category is too short', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'A',
          date: new Date('2024-01-15T10:30:00Z')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Category must be at least 2 characters long');
      });

      it('should throw ValidationError when date is missing', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'groceries'
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Date is required');
      });

      it('should throw ValidationError when date is not a Date object', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'groceries',
          date: 'not-a-date' as any
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Date must be a valid Date object');
      });

      it('should throw ValidationError when date is invalid', async () => {
        // Arrange
        const invalidTransactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'groceries',
          date: new Date('invalid-date')
        };

        // Act & Assert
        await expect(service.create(invalidTransactionData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidTransactionData)).rejects.toThrow('Date must be a valid date');
      });

      it('should throw ValidationError when transaction data is not an object', async () => {
        // Act & Assert
        await expect(service.create(null as any)).rejects.toThrow(ValidationError);
        await expect(service.create(null as any)).rejects.toThrow('Transaction data is required and must be an object');
      });

      it('should handle database errors during creation', async () => {
        // Arrange
        const transactionData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          amount: 50.00,
          category: 'groceries',
          date: new Date('2024-01-15T10:30:00Z')
        };
        const dbError = new Error('Database connection failed');
        mockRepository.create.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.create(transactionData)).rejects.toThrow('Database connection failed');
      });
    });
  });

  describe('update', () => {
    describe('success scenarios', () => {
      it('should update transaction with valid data', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = {
          amount: 75.00,
          category: 'entertainment'
        };
        const updatedTransaction = createTestTransaction({ ...existingTransaction, ...updateData });
        
        mockRepository.findOne.mockResolvedValue(existingTransaction);
        mockRepository.update.mockResolvedValue(updatedTransaction);

        // Act
        const result = await service.update(transactionId, updateData);

        // Assert
        expect(result).toEqual(updatedTransaction);
        expect(mockRepository.findOne).toHaveBeenCalledWith(transactionId);
        expect(mockRepository.update).toHaveBeenCalledWith(
          transactionId,
          expect.objectContaining({
            amount: updateData.amount,
            category: updateData.category,
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should add updatedAt timestamp when updating', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { amount: 75.00 };
        
        mockRepository.findOne.mockResolvedValue(existingTransaction);
        mockRepository.update.mockResolvedValue(createTestTransaction());

        // Act
        await service.update(transactionId, updateData);

        // Assert
        const callArgs = mockRepository.update.mock.calls[0][1];
        expect(callArgs.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when transaction does not exist', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { amount: 75.00 };
        mockRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(NotFoundError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow(`Transaction with ID ${transactionId} not found`);
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is invalid', async () => {
        // Arrange
        const updateData = { amount: 75.00 };

        // Act & Assert
        await expect(service.update('invalid-id', updateData)).rejects.toThrow(ValidationError);
        await expect(service.update('invalid-id', updateData)).rejects.toThrow('Transaction ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when amount is negative', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { amount: -50.00 };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Amount cannot be negative');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is too short', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { category: 'A' };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Category must be at least 2 characters long');
      });

      it('should throw ValidationError when amount has more than 2 decimal places', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { amount: 75.123 };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Amount cannot have more than 2 decimal places');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when date is invalid', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { date: new Date('invalid-date') };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Date must be a valid date');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when amount is not a number', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { amount: 'not-a-number' as any };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Amount must be a number');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when amount is Infinity', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { amount: Infinity };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Amount must be a finite number');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is empty string', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { category: '' };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Category is required and cannot be empty');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is invalid UUID', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { userId: 'invalid-uuid' };
        mockRepository.findOne.mockResolvedValue(existingTransaction);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(transactionId, updateData)).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should handle database errors during update', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const updateData = { amount: 75.00 };
        const dbError = new Error('Database write failed');
        mockRepository.findOne.mockResolvedValue(existingTransaction);
        mockRepository.update.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Database write failed');
        expect(mockRepository.update).toHaveBeenCalledWith(
          transactionId,
          expect.objectContaining({
            amount: updateData.amount,
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should handle database errors during existence check', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { amount: 75.00 };
        const dbError = new Error('Database read failed');
        mockRepository.findOne.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.update(transactionId, updateData)).rejects.toThrow('Database read failed');
        expect(mockRepository.findOne).toHaveBeenCalledWith(transactionId);
        expect(mockRepository.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('delete', () => {
    describe('success scenarios', () => {
      it('should delete transaction when transaction exists', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        mockRepository.findOne.mockResolvedValue(existingTransaction);
        mockRepository.delete.mockResolvedValue(true);

        // Act
        const result = await service.delete(transactionId);

        // Assert
        expect(result).toBe(true);
        expect(mockRepository.findOne).toHaveBeenCalledWith(transactionId);
        expect(mockRepository.delete).toHaveBeenCalledWith(transactionId);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when transaction does not exist', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete(transactionId)).rejects.toThrow(NotFoundError);
        await expect(service.delete(transactionId)).rejects.toThrow(`Transaction with ID ${transactionId} not found`);
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is invalid', async () => {
        // Act & Assert
        await expect(service.delete('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.delete('invalid-id')).rejects.toThrow('Transaction ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is empty', async () => {
        // Act & Assert
        await expect(service.delete('')).rejects.toThrow(ValidationError);
        await expect(service.delete('')).rejects.toThrow('Transaction ID is required and must be a string');
      });

      it('should handle database errors during deletion', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const existingTransaction = createTestTransaction({ id: transactionId });
        const dbError = new Error('Database delete operation failed');
        mockRepository.findOne.mockResolvedValue(existingTransaction);
        mockRepository.delete.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.delete(transactionId)).rejects.toThrow('Database delete operation failed');
        expect(mockRepository.delete).toHaveBeenCalledWith(transactionId);
      });

      it('should handle database errors during existence check', async () => {
        // Arrange
        const transactionId = '123e4567-e89b-42d3-a456-426614174000';
        const dbError = new Error('Database connection error');
        mockRepository.findOne.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.delete(transactionId)).rejects.toThrow('Database connection error');
        expect(mockRepository.findOne).toHaveBeenCalledWith(transactionId);
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null input for create', async () => {
      // Act & Assert
      await expect(service.create(null as any)).rejects.toThrow(ValidationError);
      await expect(service.create(null as any)).rejects.toThrow('Transaction data is required and must be an object');
    });

    it('should handle undefined input for create', async () => {
      // Act & Assert
      await expect(service.create(undefined as any)).rejects.toThrow(ValidationError);
      await expect(service.create(undefined as any)).rejects.toThrow('Transaction data is required and must be an object');
    });

    it('should handle whitespace-only userId', async () => {
      // Arrange
      const transactionData = {
        userId: '   ',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z')
      };

      // Act & Assert
      await expect(service.create(transactionData)).rejects.toThrow(ValidationError);
      await expect(service.create(transactionData)).rejects.toThrow('User ID is required and cannot be empty');
    });

    it('should handle whitespace-only category', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: '   ',
        date: new Date('2024-01-15T10:30:00Z')
      };

      // Act & Assert
      await expect(service.create(transactionData)).rejects.toThrow(ValidationError);
      await expect(service.create(transactionData)).rejects.toThrow('Category is required and cannot be empty');
    });

    it('should handle Infinity as amount', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: Infinity,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z')
      };

      // Act & Assert
      await expect(service.create(transactionData)).rejects.toThrow(ValidationError);
      await expect(service.create(transactionData)).rejects.toThrow('Amount must be a finite number');
    });

    it('should handle NaN as amount', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: NaN,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z')
      };

      // Act & Assert
      await expect(service.create(transactionData)).rejects.toThrow(ValidationError);
      await expect(service.create(transactionData)).rejects.toThrow('Amount must be a finite number');
    });

    it('should handle UUID with wrong version', async () => {
      // Arrange - UUID v1 instead of v4
      const invalidUuid = '123e4567-e89b-12d3-a456-426614174000';

      // Act & Assert
      await expect(service.findById(invalidUuid)).rejects.toThrow(ValidationError);
      await expect(service.findById(invalidUuid)).rejects.toThrow('Transaction ID must be a valid UUID');
    });

    it('should allow partial updates without requiring all fields', async () => {
      // Arrange
      const transactionId = '123e4567-e89b-42d3-a456-426614174000';
      const existingTransaction = createTestTransaction({ id: transactionId });
      const updateData = { amount: 75.00 };
      const updatedTransaction = createTestTransaction({ ...existingTransaction, ...updateData });
      
      mockRepository.findOne.mockResolvedValue(existingTransaction);
      mockRepository.update.mockResolvedValue(updatedTransaction);

      // Act
      const result = await service.update(transactionId, updateData);

      // Assert
      expect(result).toEqual(updatedTransaction);
      expect(mockRepository.update).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          amount: updateData.amount,
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should handle description as optional field', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z')
        // description is optional
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError when description is not a string', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z'),
        description: 123 as any
      };

      // Act & Assert
      await expect(service.create(transactionData)).rejects.toThrow(ValidationError);
      await expect(service.create(transactionData)).rejects.toThrow('Description must be a string');
    });

    // Task 5.5: Edge case tests for transactions
    // Validates: Requirements 4.5

    it('should handle zero amount transaction', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 0,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z'),
        description: 'Zero amount transaction'
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.amount).toBe(0);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 0
        })
      );
    });

    it('should handle future date transaction', async () => {
      // Arrange
      const futureDate = new Date('2099-12-31T23:59:59Z');
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 100.00,
        category: 'groceries',
        date: futureDate,
        description: 'Future transaction'
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.date).toEqual(futureDate);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          date: futureDate
        })
      );
    });

    it('should handle very large amount transaction', async () => {
      // Arrange
      const largeAmount = 999999999.99;
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: largeAmount,
        category: 'investment',
        date: new Date('2024-01-15T10:30:00Z'),
        description: 'Large transaction'
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.amount).toBe(largeAmount);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: largeAmount
        })
      );
    });

    it('should handle special characters in description', async () => {
      // Arrange
      const specialDescription = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z'),
        description: specialDescription
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.description).toBe(specialDescription);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: specialDescription
        })
      );
    });

    it('should handle unicode characters in description', async () => {
      // Arrange
      const unicodeDescription = '🎉 Café ñoño 中文 العربية';
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z'),
        description: unicodeDescription
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.description).toBe(unicodeDescription);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: unicodeDescription
        })
      );
    });

    it('should handle very long description', async () => {
      // Arrange
      const longDescription = 'A'.repeat(1000);
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z'),
        description: longDescription
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.description).toBe(longDescription);
      expect(result.description?.length).toBe(1000);
    });

    it('should handle empty string description', async () => {
      // Arrange
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: 50.00,
        category: 'groceries',
        date: new Date('2024-01-15T10:30:00Z'),
        description: ''
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.description).toBe('');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: ''
        })
      );
    });

    it('should handle maximum safe integer amount', async () => {
      // Arrange
      const maxAmount = 9007199254740.99; // Close to Number.MAX_SAFE_INTEGER with 2 decimals
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        amount: maxAmount,
        category: 'investment',
        date: new Date('2024-01-15T10:30:00Z'),
        description: 'Maximum amount'
      };
      const expectedTransaction = createTestTransaction(transactionData);
      mockRepository.create.mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.create(transactionData);

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(result.amount).toBe(maxAmount);
    });
  });
});
