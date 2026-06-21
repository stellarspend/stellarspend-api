import { DataSource } from 'typeorm';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    } as any;

    service = new AnalyticsService(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return analytics summary', async () => {
      // Arrange
      const mockData: any[] = [];
      mockDataSource.query.mockResolvedValue(mockData);

      // Act
      const result = await service.getSummary({});

      // Assert
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('totalTransactions');
      expect(result).toHaveProperty('monthly');
    });
  });

  describe('getSpendingSummary', () => {
    describe('monthly period', () => {
      it('should return spending summary for monthly period', async () => {
        // Arrange
        const currentRows = [
          { category: 'groceries', total_amount: '800', transaction_count: '5' },
          { category: 'entertainment', total_amount: '600', transaction_count: '3' },
        ];
        const previousRows = [{ total_amount: '1500', transaction_count: '8' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.period).toBe('monthly');
        expect(result.currentPeriod.totalSpent).toBe(1400);
        expect(result.currentPeriod.transactionCount).toBe(8);
        expect(result.currentPeriod.byCategory).toHaveLength(2);
        expect(result.previousPeriod.totalSpent).toBe(1500);
      });

      it('should calculate percentage of total correctly', async () => {
        // Arrange
        const currentRows = [
          { category: 'groceries', total_amount: '800', transaction_count: '5' },
          { category: 'entertainment', total_amount: '600', transaction_count: '3' },
          { category: 'utilities', total_amount: '200', transaction_count: '1' },
        ];
        const previousRows = [{ total_amount: '1500', transaction_count: '8' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.currentPeriod.byCategory[0].percentageOfTotal).toBe(
          (800 / 1600) * 100,
        );
        expect(result.currentPeriod.byCategory[1].percentageOfTotal).toBe(
          (600 / 1600) * 100,
        );
        expect(result.currentPeriod.byCategory[2].percentageOfTotal).toBe(
          (200 / 1600) * 100,
        );
      });

      it('should calculate trend correctly when current > previous', async () => {
        // Arrange
        const currentRows: any[] = [
          { category: 'groceries', total_amount: '2000', transaction_count: '10' },
        ];
        const previousRows: any[] = [{ total_amount: '1500', transaction_count: '8' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.trend.absoluteChange).toBe(500);
        expect(result.trend.percentageChange).toBeCloseTo(33.33, 1);
      });

      it('should calculate trend correctly when current < previous', async () => {
        // Arrange
        const currentRows: any[] = [
          { category: 'groceries', total_amount: '1000', transaction_count: '5' },
        ];
        const previousRows: any[] = [{ total_amount: '2000', transaction_count: '10' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.trend.absoluteChange).toBe(-1000);
        expect(result.trend.percentageChange).toBe(-50);
      });

      it('should handle no previous period data', async () => {
        // Arrange
        const currentRows: any[] = [
          { category: 'groceries', total_amount: '1000', transaction_count: '5' },
        ];
        const previousRows: any[] = [];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.trend.percentageChange).toBe(0);
        expect(result.trend.absoluteChange).toBe(1000);
        expect(result.previousPeriod.totalSpent).toBe(0);
      });

      it('should pass userId filter to queries', async () => {
        // Arrange
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        mockDataSource.query
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);

        // Act
        await service.getSpendingSummary('monthly', userId);

        // Assert
        expect(mockDataSource.query).toHaveBeenCalledTimes(2);
        expect(mockDataSource.query).toHaveBeenNthCalledWith(
          1,
          expect.any(String),
          expect.arrayContaining([userId]),
        );
        expect(mockDataSource.query).toHaveBeenNthCalledWith(
          2,
          expect.any(String),
          expect.arrayContaining([userId]),
        );
      });

      it('should include uncategorized transactions', async () => {
        // Arrange
        const currentRows: any[] = [
          { category: 'groceries', total_amount: '800', transaction_count: '5' },
          { category: 'uncategorized', total_amount: '200', transaction_count: '2' },
        ];
        const previousRows: any[] = [{ total_amount: '1000', transaction_count: '7' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.currentPeriod.byCategory).toHaveLength(2);
        expect(result.currentPeriod.byCategory[1].category).toBe('uncategorized');
      });
    });

    describe('daily period', () => {
      it('should return spending summary for daily period', async () => {
        // Arrange
        const currentRows = [
          { category: 'groceries', total_amount: '100', transaction_count: '2' },
        ];
        const previousRows = [{ total_amount: '80', transaction_count: '1' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('daily');

        // Assert
        expect(result.period).toBe('daily');
        expect(result.currentPeriod.totalSpent).toBe(100);
        expect(result.previousPeriod.totalSpent).toBe(80);
      });

      it('should handle zero spending for daily period', async () => {
        // Arrange
        const currentRows = [];
        const previousRows = [];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('daily');

        // Assert
        expect(result.currentPeriod.totalSpent).toBe(0);
        expect(result.currentPeriod.transactionCount).toBe(0);
        expect(result.currentPeriod.byCategory).toHaveLength(0);
        expect(result.trend.percentageChange).toBe(0);
      });
    });

    describe('weekly period', () => {
      it('should return spending summary for weekly period', async () => {
        // Arrange
        const currentRows = [
          { category: 'groceries', total_amount: '500', transaction_count: '5' },
          { category: 'entertainment', total_amount: '300', transaction_count: '3' },
        ];
        const previousRows = [{ total_amount: '600', transaction_count: '6' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('weekly');

        // Assert
        expect(result.period).toBe('weekly');
        expect(result.currentPeriod.totalSpent).toBe(800);
        expect(result.previousPeriod.totalSpent).toBe(600);
        expect(result.trend.percentageChange).toBeCloseTo(33.33, 1);
      });
    });

    describe('category breakdown', () => {
      it('should order categories by amount descending', async () => {
        // Arrange
        const currentRows = [
          { category: 'groceries', total_amount: '800', transaction_count: '5' },
          { category: 'entertainment', total_amount: '600', transaction_count: '3' },
          { category: 'utilities', total_amount: '400', transaction_count: '2' },
        ];
        const previousRows = [{ total_amount: '1500', transaction_count: '8' }];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.currentPeriod.byCategory[0].category).toBe('groceries');
        expect(result.currentPeriod.byCategory[1].category).toBe('entertainment');
        expect(result.currentPeriod.byCategory[2].category).toBe('utilities');
      });

      it('should calculate percentage when total is zero', async () => {
        // Arrange
        const currentRows = [];
        const previousRows = [];

        mockDataSource.query
          .mockResolvedValueOnce(currentRows)
          .mockResolvedValueOnce(previousRows);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result.currentPeriod.byCategory).toHaveLength(0);
      });
    });

    describe('response structure', () => {
      it('should include all required fields in response', async () => {
        // Arrange
        mockDataSource.query
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);

        // Act
        const result = await service.getSpendingSummary('monthly');

        // Assert
        expect(result).toHaveProperty('period');
        expect(result).toHaveProperty('currentPeriod');
        expect(result).toHaveProperty('previousPeriod');
        expect(result).toHaveProperty('trend');
        expect(result.currentPeriod).toHaveProperty('totalSpent');
        expect(result.currentPeriod).toHaveProperty('transactionCount');
        expect(result.currentPeriod).toHaveProperty('byCategory');
        expect(result.previousPeriod).toHaveProperty('totalSpent');
        expect(result.previousPeriod).toHaveProperty('transactionCount');
        expect(result.trend).toHaveProperty('percentageChange');
        expect(result.trend).toHaveProperty('absoluteChange');
      });
    });
  });
});
