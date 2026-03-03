/**
 * Budgets Service Test Suite
 * Comprehensive tests for BudgetsService with success and failure scenarios
 */

import { BudgetsService, ValidationError, NotFoundError, BudgetRepository } from './budgets.service';
import { createMockRepository, MockRepository } from '../../common/mocks/repository.mock';
import { createTestBudget, createTestBudgetList, Budget } from '../../common/test-utils/fixtures';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let mockRepository: MockRepository<Budget>;

  beforeEach(() => {
    // Initialize mock repository with fresh mocks for each test
    mockRepository = createMockRepository<Budget>();
    service = new BudgetsService(mockRepository as unknown as BudgetRepository);
  });

  afterEach(() => {
    // Clear all mocks to ensure test isolation
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('success scenarios', () => {
      it('should return all budgets when budgets exist', async () => {
        // Arrange
        const expectedBudgets = createTestBudgetList(3);
        mockRepository.find.mockResolvedValue(expectedBudgets);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual(expectedBudgets);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
        expect(mockRepository.find).toHaveBeenCalledWith();
      });

      it('should return empty array when no budgets exist', async () => {
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
      it('should throw error when database operation fails', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        mockRepository.find.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findAll()).rejects.toThrow('Database connection failed');
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('findById', () => {
    describe('success scenarios', () => {
      it('should return budget when valid ID is provided', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        const expectedBudget = createTestBudget({ id: validId });
        mockRepository.findOne.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.findById(validId);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });

      it('should return null when budget is not found', async () => {
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
        await expect(service.findById('')).rejects.toThrow('Budget ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is not a string', async () => {
        // Act & Assert
        await expect(service.findById(null as any)).rejects.toThrow(ValidationError);
        await expect(service.findById(null as any)).rejects.toThrow('Budget ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is not a valid UUID', async () => {
        // Act & Assert
        await expect(service.findById('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.findById('invalid-id')).rejects.toThrow('Budget ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is whitespace only', async () => {
        // Act & Assert
        await expect(service.findById('   ')).rejects.toThrow(ValidationError);
        await expect(service.findById('   ')).rejects.toThrow('Budget ID cannot be empty');
      });

      it('should throw error when database operation fails', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        const dbError = new Error('Database connection failed');
        mockRepository.findOne.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findById(validId)).rejects.toThrow('Database connection failed');
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });
    });
  });

  describe('findByUserId', () => {
    describe('success scenarios', () => {
      it('should return all budgets for a valid user ID', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const expectedBudgets = createTestBudgetList(3, { userId });
        mockRepository.findByUserId.mockResolvedValue(expectedBudgets);

        // Act
        const result = await service.findByUserId(userId);

        // Assert
        expect(result).toEqual(expectedBudgets);
        expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      });

      it('should return empty array when user has no budgets', async () => {
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

      it('should throw error when database operation fails', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const dbError = new Error('Database connection failed');
        mockRepository.findByUserId.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findByUserId(userId)).rejects.toThrow('Database connection failed');
        expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      });
    });
  });

  describe('findByCategory', () => {
    describe('success scenarios', () => {
      it('should return all budgets for a valid category', async () => {
        // Arrange
        const category = 'groceries';
        const expectedBudgets = createTestBudgetList(3, { category });
        mockRepository.findByCategory.mockResolvedValue(expectedBudgets);

        // Act
        const result = await service.findByCategory(category);

        // Assert
        expect(result).toEqual(expectedBudgets);
        expect(mockRepository.findByCategory).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByCategory).toHaveBeenCalledWith(category);
      });

      it('should return empty array when no budgets exist for category', async () => {
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

      it('should throw error when database operation fails', async () => {
        // Arrange
        const category = 'groceries';
        const dbError = new Error('Database connection failed');
        mockRepository.findByCategory.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findByCategory(category)).rejects.toThrow('Database connection failed');
        expect(mockRepository.findByCategory).toHaveBeenCalledWith(category);
      });
    });
  });

  describe('findByPeriod', () => {
    describe('success scenarios', () => {
      it('should return all budgets for monthly period', async () => {
        // Arrange
        const period = 'monthly';
        const expectedBudgets = createTestBudgetList(3, { period });
        mockRepository.findByPeriod.mockResolvedValue(expectedBudgets);

        // Act
        const result = await service.findByPeriod(period);

        // Assert
        expect(result).toEqual(expectedBudgets);
        expect(mockRepository.findByPeriod).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByPeriod).toHaveBeenCalledWith(period);
      });

      it('should return all budgets for weekly period', async () => {
        // Arrange
        const period = 'weekly';
        const expectedBudgets = createTestBudgetList(2, { period });
        mockRepository.findByPeriod.mockResolvedValue(expectedBudgets);

        // Act
        const result = await service.findByPeriod(period);

        // Assert
        expect(result).toEqual(expectedBudgets);
        expect(mockRepository.findByPeriod).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByPeriod).toHaveBeenCalledWith(period);
      });

      it('should return all budgets for yearly period', async () => {
        // Arrange
        const period = 'yearly';
        const expectedBudgets = createTestBudgetList(1, { period });
        mockRepository.findByPeriod.mockResolvedValue(expectedBudgets);

        // Act
        const result = await service.findByPeriod(period);

        // Assert
        expect(result).toEqual(expectedBudgets);
        expect(mockRepository.findByPeriod).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByPeriod).toHaveBeenCalledWith(period);
      });

      it('should return empty array when no budgets exist for period', async () => {
        // Arrange
        const period = 'monthly';
        mockRepository.findByPeriod.mockResolvedValue([]);

        // Act
        const result = await service.findByPeriod(period);

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.findByPeriod).toHaveBeenCalledWith(period);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when period is empty string', async () => {
        // Act & Assert
        await expect(service.findByPeriod('' as any)).rejects.toThrow(ValidationError);
        await expect(service.findByPeriod('' as any)).rejects.toThrow('Period is required and must be a string');
        expect(mockRepository.findByPeriod).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is invalid', async () => {
        // Act & Assert
        await expect(service.findByPeriod('daily' as any)).rejects.toThrow(ValidationError);
        await expect(service.findByPeriod('daily' as any)).rejects.toThrow('Period must be one of: monthly, weekly, yearly');
        expect(mockRepository.findByPeriod).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is not a string', async () => {
        // Act & Assert
        await expect(service.findByPeriod(null as any)).rejects.toThrow(ValidationError);
        await expect(service.findByPeriod(null as any)).rejects.toThrow('Period is required and must be a string');
        expect(mockRepository.findByPeriod).not.toHaveBeenCalled();
      });

      it('should throw error when database operation fails', async () => {
        // Arrange
        const period = 'monthly';
        const dbError = new Error('Database connection failed');
        mockRepository.findByPeriod.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.findByPeriod(period)).rejects.toThrow('Database connection failed');
        expect(mockRepository.findByPeriod).toHaveBeenCalledWith(period);
      });
    });
  });

  describe('create', () => {
    describe('success scenarios', () => {
      it('should create budget with valid data', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: budgetData.userId,
            category: budgetData.category,
            limit: budgetData.limit,
            period: budgetData.period,
            startDate: budgetData.startDate,
            endDate: budgetData.endDate,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should add timestamps when creating budget', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        await service.create(budgetData);

        // Assert
        const callArgs = mockRepository.create.mock.calls[0][0];
        expect(callArgs.createdAt).toBeInstanceOf(Date);
        expect(callArgs.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when budget data is not an object', async () => {
        // Act & Assert
        await expect(service.create(null as any)).rejects.toThrow(ValidationError);
        await expect(service.create(null as any)).rejects.toThrow('Budget data is required and must be an object');
      });

      it('should throw ValidationError when userId is missing', async () => {
        // Arrange
        const budgetData = {
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('User ID is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is empty string', async () => {
        // Arrange
        const budgetData = {
          userId: '',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('User ID is required and cannot be empty');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is not a valid UUID', async () => {
        // Arrange
        const budgetData = {
          userId: 'invalid-uuid',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is missing', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Category is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is empty string', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: '',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Category is required and cannot be empty');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is too short', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'A',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Category must be at least 2 characters long');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is missing', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is not a number', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: '500' as any,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit must be a number');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is negative', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: -100,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit must be greater than zero');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is zero', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 0,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit must be greater than zero');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is not finite', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: Infinity,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit must be a finite number');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit has more than 2 decimal places', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.123,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit cannot have more than 2 decimal places');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is missing', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Period is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is not a string', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 123 as any,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Period must be a string');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is invalid', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'daily' as any,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Period must be one of: monthly, weekly, yearly');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is missing', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Start date is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is not a Date object', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: '2024-01-01' as any,
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Start date must be a valid Date object');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is invalid', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('invalid'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Start date must be a valid date');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when endDate is missing', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('End date is required');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when endDate is not a Date object', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: '2024-01-31' as any
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('End date must be a valid Date object');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when endDate is invalid', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('invalid')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('End date must be a valid date');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is after endDate', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-31T23:59:59Z'),
          endDate: new Date('2024-01-01T00:00:00Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Start date must be before or equal to end date');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error when database operation fails', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const dbError = new Error('Database connection failed');
        mockRepository.create.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow('Database connection failed');
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('update', () => {
    describe('success scenarios', () => {
      it('should update budget with valid data', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const existingBudget = createTestBudget({ id: budgetId });
        const updateData = {
          limit: 750.00,
          category: 'entertainment'
        };
        const updatedBudget = createTestBudget({ ...existingBudget, ...updateData });
        
        mockRepository.findOne.mockResolvedValue(existingBudget);
        mockRepository.update.mockResolvedValue(updatedBudget);

        // Act
        const result = await service.update(budgetId, updateData);

        // Assert
        expect(result).toEqual(updatedBudget);
        expect(mockRepository.findOne).toHaveBeenCalledWith(budgetId);
        expect(mockRepository.update).toHaveBeenCalledWith(
          budgetId,
          expect.objectContaining({
            limit: updateData.limit,
            category: updateData.category,
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should add updatedAt timestamp when updating', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const existingBudget = createTestBudget({ id: budgetId });
        const updateData = { limit: 750.00 };
        
        mockRepository.findOne.mockResolvedValue(existingBudget);
        mockRepository.update.mockResolvedValue(createTestBudget());

        // Act
        await service.update(budgetId, updateData);

        // Assert
        const callArgs = mockRepository.update.mock.calls[0][1];
        expect(callArgs.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when budget does not exist', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: 750.00 };
        mockRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(NotFoundError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow(`Budget with ID ${budgetId} not found`);
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is invalid', async () => {
        // Arrange
        const updateData = { limit: 750.00 };

        // Act & Assert
        await expect(service.update('invalid-id', updateData)).rejects.toThrow(ValidationError);
        await expect(service.update('invalid-id', updateData)).rejects.toThrow('Budget ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is empty', async () => {
        // Arrange
        const updateData = { limit: 750.00 };

        // Act & Assert
        await expect(service.update('', updateData)).rejects.toThrow(ValidationError);
        await expect(service.update('', updateData)).rejects.toThrow('Budget ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when update data is not an object', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';

        // Act & Assert
        await expect(service.update(budgetId, null as any)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, null as any)).rejects.toThrow('Budget data is required and must be an object');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when userId is invalid in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { userId: 'invalid-uuid' };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is empty in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { category: '' };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Category is required and cannot be empty');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when category is too short in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { category: 'A' };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Category must be at least 2 characters long');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is negative in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: -100 };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Limit must be greater than zero');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is zero in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: 0 };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Limit must be greater than zero');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is not a number in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: '750' as any };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Limit must be a number');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit is not finite in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: Infinity };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Limit must be a finite number');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when limit has more than 2 decimal places in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: 750.123 };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Limit cannot have more than 2 decimal places');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is invalid in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { period: 'daily' as any };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Period must be one of: monthly, weekly, yearly');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when period is not a string in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { period: 123 as any };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Period must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is not a Date object in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { startDate: '2024-01-01' as any };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Start date must be a valid Date object');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is invalid in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { startDate: new Date('invalid') };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Start date must be a valid date');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when endDate is not a Date object in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { endDate: '2024-01-31' as any };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('End date must be a valid Date object');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when endDate is invalid in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { endDate: new Date('invalid') };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('End date must be a valid date');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when startDate is after endDate in update', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = {
          startDate: new Date('2024-01-31T23:59:59Z'),
          endDate: new Date('2024-01-01T00:00:00Z')
        };

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Start date must be before or equal to end date');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw error when database findOne fails', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { limit: 750.00 };
        const dbError = new Error('Database connection failed');
        mockRepository.findOne.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Database connection failed');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw error when database update fails', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const existingBudget = createTestBudget({ id: budgetId });
        const updateData = { limit: 750.00 };
        const dbError = new Error('Database update failed');
        mockRepository.findOne.mockResolvedValue(existingBudget);
        mockRepository.update.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.update(budgetId, updateData)).rejects.toThrow('Database update failed');
        expect(mockRepository.findOne).toHaveBeenCalledWith(budgetId);
        expect(mockRepository.update).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('edge case tests', () => {
    /**
     * Edge Case Tests for Budgets
     * Validates: Requirements 4.5
     */
    describe('zero and minimal budget limits', () => {
      it('should reject budget with exactly zero limit', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 0,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };

        // Act & Assert
        await expect(service.create(budgetData)).rejects.toThrow(ValidationError);
        await expect(service.create(budgetData)).rejects.toThrow('Limit must be greater than zero');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should accept budget with minimal positive limit (0.01)', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 0.01,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 0.01 })
        );
      });

      it('should accept budget with very large limit', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 999999999.99,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 999999999.99 })
        );
      });
    });

    describe('overlapping budget periods', () => {
      it('should allow creating budgets with same dates for different categories', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T00:00:00Z');
        const endDate = new Date('2024-01-31T23:59:59Z');
        
        const budget1Data = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate,
          endDate
        };
        
        const budget2Data = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'entertainment',
          limit: 300.00,
          period: 'monthly' as const,
          startDate,
          endDate
        };

        const expectedBudget1 = createTestBudget(budget1Data);
        const expectedBudget2 = createTestBudget(budget2Data);
        
        mockRepository.create.mockResolvedValueOnce(expectedBudget1);
        mockRepository.create.mockResolvedValueOnce(expectedBudget2);

        // Act
        const result1 = await service.create(budget1Data);
        const result2 = await service.create(budget2Data);

        // Assert
        expect(result1).toEqual(expectedBudget1);
        expect(result2).toEqual(expectedBudget2);
        expect(mockRepository.create).toHaveBeenCalledTimes(2);
      });

      it('should allow creating budgets with same dates for different users', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T00:00:00Z');
        const endDate = new Date('2024-01-31T23:59:59Z');
        
        const budget1Data = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate,
          endDate
        };
        
        const budget2Data = {
          userId: '223e4567-e89b-42d3-a456-426614174001',
          category: 'groceries',
          limit: 600.00,
          period: 'monthly' as const,
          startDate,
          endDate
        };

        const expectedBudget1 = createTestBudget(budget1Data);
        const expectedBudget2 = createTestBudget(budget2Data);
        
        mockRepository.create.mockResolvedValueOnce(expectedBudget1);
        mockRepository.create.mockResolvedValueOnce(expectedBudget2);

        // Act
        const result1 = await service.create(budget1Data);
        const result2 = await service.create(budget2Data);

        // Assert
        expect(result1).toEqual(expectedBudget1);
        expect(result2).toEqual(expectedBudget2);
        expect(mockRepository.create).toHaveBeenCalledTimes(2);
      });

      it('should allow creating budgets with partially overlapping periods', async () => {
        // Arrange
        const budget1Data = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        
        const budget2Data = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 600.00,
          period: 'monthly' as const,
          startDate: new Date('2024-01-15T00:00:00Z'),
          endDate: new Date('2024-02-15T23:59:59Z')
        };

        const expectedBudget1 = createTestBudget(budget1Data);
        const expectedBudget2 = createTestBudget(budget2Data);
        
        mockRepository.create.mockResolvedValueOnce(expectedBudget1);
        mockRepository.create.mockResolvedValueOnce(expectedBudget2);

        // Act
        const result1 = await service.create(budget1Data);
        const result2 = await service.create(budget2Data);

        // Assert
        expect(result1).toEqual(expectedBudget1);
        expect(result2).toEqual(expectedBudget2);
        expect(mockRepository.create).toHaveBeenCalledTimes(2);
      });
    });

    describe('budget calculations at boundaries', () => {
      it('should handle budget with start and end date at exact same moment', async () => {
        // Arrange
        const sameDate = new Date('2024-01-01T00:00:00Z');
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 100.00,
          period: 'monthly' as const,
          startDate: sameDate,
          endDate: sameDate
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: sameDate,
            endDate: sameDate
          })
        );
      });

      it('should handle budget spanning exactly one year', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 12000.00,
          period: 'yearly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-12-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            period: 'yearly',
            startDate: budgetData.startDate,
            endDate: budgetData.endDate
          })
        );
      });

      it('should handle budget with dates at millisecond precision', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T00:00:00.001Z');
        const endDate = new Date('2024-01-31T23:59:59.999Z');
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate,
          endDate
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate,
            endDate
          })
        );
      });

      it('should handle budget with limit at maximum precision (2 decimals)', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 123.45,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 123.45 })
        );
      });

      it('should handle budget with whole number limit (no decimals)', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500,
          period: 'monthly' as const,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 500 })
        );
      });

      it('should handle budget spanning leap year date', async () => {
        // Arrange
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly' as const,
          startDate: new Date('2024-02-01T00:00:00Z'),
          endDate: new Date('2024-02-29T23:59:59Z')
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: budgetData.startDate,
            endDate: budgetData.endDate
          })
        );
      });

      it('should handle budget with very short duration (1 second)', async () => {
        // Arrange
        const startDate = new Date('2024-01-01T12:00:00Z');
        const endDate = new Date('2024-01-01T12:00:01Z');
        const budgetData = {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          category: 'groceries',
          limit: 10.00,
          period: 'weekly' as const,
          startDate,
          endDate
        };
        const expectedBudget = createTestBudget(budgetData);
        mockRepository.create.mockResolvedValue(expectedBudget);

        // Act
        const result = await service.create(budgetData);

        // Assert
        expect(result).toEqual(expectedBudget);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate,
            endDate
          })
        );
      });
    });
  });

  describe('delete', () => {
    describe('success scenarios', () => {
      it('should delete budget when budget exists', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const existingBudget = createTestBudget({ id: budgetId });
        mockRepository.findOne.mockResolvedValue(existingBudget);
        mockRepository.delete.mockResolvedValue(true);

        // Act
        const result = await service.delete(budgetId);

        // Assert
        expect(result).toBe(true);
        expect(mockRepository.findOne).toHaveBeenCalledWith(budgetId);
        expect(mockRepository.delete).toHaveBeenCalledWith(budgetId);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when budget does not exist', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete(budgetId)).rejects.toThrow(NotFoundError);
        await expect(service.delete(budgetId)).rejects.toThrow(`Budget with ID ${budgetId} not found`);
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is invalid', async () => {
        // Act & Assert
        await expect(service.delete('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.delete('invalid-id')).rejects.toThrow('Budget ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is empty', async () => {
        // Act & Assert
        await expect(service.delete('')).rejects.toThrow(ValidationError);
        await expect(service.delete('')).rejects.toThrow('Budget ID is required and must be a string');
      });

      it('should throw ValidationError when ID is null', async () => {
        // Act & Assert
        await expect(service.delete(null as any)).rejects.toThrow(ValidationError);
        await expect(service.delete(null as any)).rejects.toThrow('Budget ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is undefined', async () => {
        // Act & Assert
        await expect(service.delete(undefined as any)).rejects.toThrow(ValidationError);
        await expect(service.delete(undefined as any)).rejects.toThrow('Budget ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is whitespace only', async () => {
        // Act & Assert
        await expect(service.delete('   ')).rejects.toThrow(ValidationError);
        await expect(service.delete('   ')).rejects.toThrow('Budget ID cannot be empty');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw error when database findOne fails', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const dbError = new Error('Database connection failed');
        mockRepository.findOne.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.delete(budgetId)).rejects.toThrow('Database connection failed');
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });

      it('should throw error when database delete fails', async () => {
        // Arrange
        const budgetId = '123e4567-e89b-42d3-a456-426614174000';
        const existingBudget = createTestBudget({ id: budgetId });
        const dbError = new Error('Database delete failed');
        mockRepository.findOne.mockResolvedValue(existingBudget);
        mockRepository.delete.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.delete(budgetId)).rejects.toThrow('Database delete failed');
        expect(mockRepository.findOne).toHaveBeenCalledWith(budgetId);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
