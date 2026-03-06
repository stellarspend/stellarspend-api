/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService, ValidationError } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { createTestBudget } from '../../common/test-utils/fixtures';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let mockBudgetsService: jest.Mocked<BudgetsService>;

  beforeEach(() => {
    mockBudgetsService = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCategory: jest.fn(),
      findByPeriod: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    controller = new BudgetsController(mockBudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('success scenarios', () => {
      it('should create budget with valid data and return 200', async () => {
        // Arrange
        const createBudgetDto: CreateBudgetDto = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          assetCode: 'USDC'
        };

        const mockBudget = createTestBudget({
          userId: createBudgetDto.userId,
          category: createBudgetDto.category,
          limit: createBudgetDto.limit,
          period: createBudgetDto.period as 'monthly',
          assetCode: 'USDC'
        });

        mockBudgetsService.create.mockResolvedValue(mockBudget);

        // Act
        const result = await controller.create(createBudgetDto);

        // Assert
        expect(result).toEqual(mockBudget);
        expect(mockBudgetsService.create).toHaveBeenCalledTimes(1);
        expect(mockBudgetsService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: createBudgetDto.userId,
            category: createBudgetDto.category,
            limit: createBudgetDto.limit,
            period: createBudgetDto.period,
            assetCode: createBudgetDto.assetCode
          })
        );
      });

      it('should create budget with optional assetCode', async () => {
        // Arrange
        const createBudgetDto: CreateBudgetDto = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'entertainment',
          limit: 200.00,
          period: 'weekly',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-07T23:59:59Z'
        };

        const mockBudget = createTestBudget({
          userId: createBudgetDto.userId,
          category: createBudgetDto.category,
          limit: createBudgetDto.limit,
          period: createBudgetDto.period as 'weekly'
        });

        mockBudgetsService.create.mockResolvedValue(mockBudget);

        // Act
        const result = await controller.create(createBudgetDto);

        // Assert
        expect(result).toEqual(mockBudget);
        expect(mockBudgetsService.create).toHaveBeenCalled();
      });

      it('should create budget with valid asset codes (XLM, USDC, EURC)', async () => {
        const assetCodes = ['XLM', 'USDC', 'EURC'];

        for (const assetCode of assetCodes) {
          // Arrange
          const createBudgetDto: CreateBudgetDto = {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            category: 'groceries',
            limit: 500.00,
            period: 'monthly',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-31T23:59:59Z',
            assetCode
          };

          const mockBudget = createTestBudget({ assetCode });
          mockBudgetsService.create.mockResolvedValue(mockBudget);

          // Act
          const result = await controller.create(createBudgetDto);

          // Assert
          expect(result).toEqual(mockBudget);
          expect(mockBudgetsService.create).toHaveBeenCalledWith(
            expect.objectContaining({ assetCode })
          );
        }
      });
    });

    describe('failure scenarios', () => {
      it('should throw BadRequestException when service throws ValidationError', async () => {
        // Arrange
        const createBudgetDto: CreateBudgetDto = {
          userId: '',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z'
        };

        mockBudgetsService.create.mockRejectedValue(
          new ValidationError('User ID is required')
        );

        // Act & Assert
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          BadRequestException
        );
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          'User ID is required'
        );
      });

      it('should throw BadRequestException when limit is invalid', async () => {
        // Arrange
        const createBudgetDto: CreateBudgetDto = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'groceries',
          limit: 0,
          period: 'monthly',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z'
        };

        mockBudgetsService.create.mockRejectedValue(
          new ValidationError('Limit must be greater than zero')
        );

        // Act & Assert
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          BadRequestException
        );
      });

      it('should throw BadRequestException when asset is invalid', async () => {
        // Arrange
        const createBudgetDto: CreateBudgetDto = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          assetCode: 'invalid-asset-code-with-special!'
        };

        mockBudgetsService.create.mockRejectedValue(
          new ValidationError('Asset code must be alphanumeric')
        );

        // Act & Assert
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          BadRequestException
        );
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          'Asset code must be alphanumeric'
        );
      });

      it('should throw BadRequestException for generic errors', async () => {
        // Arrange
        const createBudgetDto: CreateBudgetDto = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          category: 'groceries',
          limit: 500.00,
          period: 'monthly',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z'
        };

        mockBudgetsService.create.mockRejectedValue(
          new Error('Database connection failed')
        );

        // Act & Assert
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          BadRequestException
        );
        await expect(controller.create(createBudgetDto)).rejects.toThrow(
          'An error occurred while creating the budget'
        );
      });
    });
  });

  describe('findByUser', () => {
    describe('success scenarios', () => {
      it('should return all budgets for a valid user ID', async () => {
        // Arrange
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        const mockBudgets = [
          createTestBudget({ userId, category: 'groceries', assetCode: 'XLM' }),
          createTestBudget({ userId, category: 'entertainment', assetCode: 'USDC' })
        ];

        mockBudgetsService.findByUserId.mockResolvedValue(mockBudgets);

        // Act
        const result = await controller.findByUser(userId);

        // Assert
        expect(result).toEqual(mockBudgets);
        expect(mockBudgetsService.findByUserId).toHaveBeenCalledWith(userId);
      });

      it('should return empty array when user has no budgets', async () => {
        // Arrange
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        mockBudgetsService.findByUserId.mockResolvedValue([]);

        // Act
        const result = await controller.findByUser(userId);

        // Assert
        expect(result).toEqual([]);
        expect(mockBudgetsService.findByUserId).toHaveBeenCalledWith(userId);
      });
    });

    describe('failure scenarios', () => {
      it('should throw BadRequestException when user ID is invalid', async () => {
        // Arrange
        const userId = 'invalid-id';
        mockBudgetsService.findByUserId.mockRejectedValue(
          new ValidationError('User ID must be a valid UUID')
        );

        // Act & Assert
        await expect(controller.findByUser(userId)).rejects.toThrow(
          BadRequestException
        );
        await expect(controller.findByUser(userId)).rejects.toThrow(
          'User ID must be a valid UUID'
        );
      });

      it('should throw BadRequestException for generic errors', async () => {
        // Arrange
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        mockBudgetsService.findByUserId.mockRejectedValue(
          new Error('Database connection failed')
        );

        // Act & Assert
        await expect(controller.findByUser(userId)).rejects.toThrow(
          BadRequestException
        );
        await expect(controller.findByUser(userId)).rejects.toThrow(
          'An error occurred while fetching budgets'
        );
      });
    });
  });
});
