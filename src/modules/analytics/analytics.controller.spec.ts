/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(() => {
    mockAnalyticsService = {
      getSummary: jest.fn(),
      getSpendingSummary: jest.fn(),
    } as any;

    controller = new AnalyticsController(mockAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return analytics summary', async () => {
      // Arrange
      const mockSummary = {
        totalAmount: 1000,
        totalTransactions: 5,
        monthly: [],
      };
      mockAnalyticsService.getSummary.mockResolvedValue(mockSummary);

      // Act
      const result = await controller.getSummary();

      // Assert
      expect(result).toEqual(mockSummary);
      expect(mockAnalyticsService.getSummary).toHaveBeenCalledWith({
        userId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should pass userId filter to service', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSummary = {
        totalAmount: 500,
        totalTransactions: 3,
        monthly: [],
      };
      mockAnalyticsService.getSummary.mockResolvedValue(mockSummary);

      // Act
      await controller.getSummary(userId);

      // Assert
      expect(mockAnalyticsService.getSummary).toHaveBeenCalledWith({
        userId,
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe('getSpendingSummary', () => {
    const mockSpendingSummary = {
      period: 'monthly',
      currentPeriod: {
        totalSpent: 2000,
        transactionCount: 10,
        byCategory: [
          {
            category: 'groceries',
            amount: 800,
            percentageOfTotal: 40,
            transactionCount: 5,
          },
          {
            category: 'entertainment',
            amount: 600,
            percentageOfTotal: 30,
            transactionCount: 3,
          },
          {
            category: 'utilities',
            amount: 400,
            percentageOfTotal: 20,
            transactionCount: 2,
          },
          {
            category: 'uncategorized',
            amount: 200,
            percentageOfTotal: 10,
            transactionCount: 1,
          },
        ],
      },
      previousPeriod: {
        totalSpent: 1500,
        transactionCount: 8,
      },
      trend: {
        percentageChange: 33.33,
        absoluteChange: 500,
      },
    };

    describe('period validation', () => {
      it('should throw BadRequestException when period is invalid', async () => {
        // Act & Assert
        await expect(
          controller.getSpendingSummary('invalid'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when period is missing', async () => {
        // Act & Assert
        await expect(
          controller.getSpendingSummary(undefined),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('daily period', () => {
      it('should return spending summary for daily period', async () => {
        // Arrange
        mockAnalyticsService.getSpendingSummary.mockResolvedValue({
          ...mockSpendingSummary,
          period: 'daily',
        });

        // Act
        const result = await controller.getSpendingSummary('daily');

        // Assert
        expect(result).toEqual({
          ...mockSpendingSummary,
          period: 'daily',
        });
        expect(mockAnalyticsService.getSpendingSummary).toHaveBeenCalledWith('daily', undefined);
      });

      it('should pass userId filter for daily period', async () => {
        // Arrange
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        mockAnalyticsService.getSpendingSummary.mockResolvedValue({
          ...mockSpendingSummary,
          period: 'daily',
        });

        // Act
        await controller.getSpendingSummary('daily', userId);

        // Assert
        expect(mockAnalyticsService.getSpendingSummary).toHaveBeenCalledWith('daily', userId);
      });
    });

    describe('weekly period', () => {
      it('should return spending summary for weekly period', async () => {
        // Arrange
        mockAnalyticsService.getSpendingSummary.mockResolvedValue({
          ...mockSpendingSummary,
          period: 'weekly',
        });

        // Act
        const result = await controller.getSpendingSummary('weekly');

        // Assert
        expect(result).toEqual({
          ...mockSpendingSummary,
          period: 'weekly',
        });
        expect(mockAnalyticsService.getSpendingSummary).toHaveBeenCalledWith('weekly', undefined);
      });
    });

    describe('monthly period', () => {
      it('should return spending summary for monthly period', async () => {
        // Arrange
        mockAnalyticsService.getSpendingSummary.mockResolvedValue(mockSpendingSummary);

        // Act
        const result = await controller.getSpendingSummary('monthly');

        // Assert
        expect(result).toEqual(mockSpendingSummary);
        expect(mockAnalyticsService.getSpendingSummary).toHaveBeenCalledWith('monthly', undefined);
      });

      it('should include category breakdown in response', async () => {
        // Arrange
        mockAnalyticsService.getSpendingSummary.mockResolvedValue(mockSpendingSummary);

        // Act
        const result = await controller.getSpendingSummary('monthly');

        // Assert
        expect(result.currentPeriod.byCategory).toHaveLength(4);
        expect(result.currentPeriod.byCategory[0].category).toBe('groceries');
      });

      it('should include trend analysis in response', async () => {
        // Arrange
        mockAnalyticsService.getSpendingSummary.mockResolvedValue(mockSpendingSummary);

        // Act
        const result = await controller.getSpendingSummary('monthly');

        // Assert
        expect(result.trend).toBeDefined();
        expect(result.trend.percentageChange).toBe(33.33);
        expect(result.trend.absoluteChange).toBe(500);
      });

      it('should include previous period data', async () => {
        // Arrange
        mockAnalyticsService.getSpendingSummary.mockResolvedValue(mockSpendingSummary);

        // Act
        const result = await controller.getSpendingSummary('monthly');

        // Assert
        expect(result.previousPeriod).toBeDefined();
        expect(result.previousPeriod.totalSpent).toBe(1500);
        expect(result.previousPeriod.transactionCount).toBe(8);
      });
    });
  });
});
