import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AnalyticsService } from './analytics.service';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { CacheService } from '../cache/cache.service';
import { BudgetEntity } from '../budgets/entities/budget.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let cacheService: { get: jest.Mock; set: jest.Mock };
  let txRepo: any;
  let budgetRepo: any;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    cacheService = { get: jest.fn(), set: jest.fn() };

    txRepo = {
      createQueryBuilder: jest.fn(() => ({ ...mockQueryBuilder })),
    };
    budgetRepo = {
      createQueryBuilder: jest.fn(() => ({ ...mockQueryBuilder })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(TransactionEntity), useValue: txRepo },
        { provide: getRepositoryToken(BudgetEntity), useValue: budgetRepo },
        { provide: CacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('status', () => {
    it('returns ready status', () => {
      expect(service.status()).toEqual({ module: 'analytics', status: 'ready' });
    });
  });

  describe('getSpendingTrend', () => {
    it('returns weekly spending buckets for the given asset', async () => {
      const mockRows = [
        { week: '2026-08-18T00:00:00.000Z', total: '150.000000000000' },
        { week: '2026-08-11T00:00:00.000Z', total: '200.500000000000' },
      ];
      const qb = txRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue(mockRows);

      const result = await service.getSpendingTrend('user-1', 'USDC', 2);

      expect(result).toEqual(mockRows);
      expect(qb.where).toHaveBeenCalledWith('t."userId" = :userId', {
        userId: 'user-1',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('t."asset" = :asset', {
        asset: 'USDC',
      });
      expect(qb.limit).toHaveBeenCalledWith(2);
    });

    it('defaults to 8 weeks when weeks is not specified', async () => {
      const qb = txRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);

      await service.getSpendingTrend('user-1', 'USDC');

      expect(qb.limit).toHaveBeenCalledWith(8);
    });

    it('returns cached trend without querying the DB on a cache hit', async () => {
      cacheService.get.mockResolvedValue(
        [{ week: '2026-08-01', total: '100' }] as never,
      );

      const result = await service.getSpendingTrend('user1', 'XLM', 12);

      expect(result).toEqual([{ week: '2026-08-01', total: '100' }]);
      expect(txRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('runs the aggregation query and caches the result on a cache miss', async () => {
      cacheService.get.mockResolvedValue(null as never);
      const qb = txRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([{ week: '2026-08-01', total: '250' }]);

      const result = await service.getSpendingTrend('user1', 'XLM', 12);

      expect(qb.getRawMany).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        'analytics:trend:user1:XLM:12',
        [{ week: '2026-08-01', total: '250' }],
        300,
      );
      expect(result).toEqual([{ week: '2026-08-01', total: '250' }]);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('returns category totals with percentage computed in SQL', async () => {
      const mockRows = [
        { category: 'groceries', total: '150.00', percentage: '60.000000' },
        { category: 'entertainment', total: '100.00', percentage: '40.000000' },
      ];
      const qb = txRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue(mockRows);

      const result = await service.getCategoryBreakdown(
        'user-1',
        'USDC',
        new Date('2026-01-01'),
      );

      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(2);
    });

    it('uses the since date filter', async () => {
      const qb = txRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);

      const since = new Date('2026-06-01');
      await service.getCategoryBreakdown('user-1', 'XLM', since);

      expect(qb.andWhere).toHaveBeenCalledWith(
        't."createdAt" >= :since',
        { since },
      );
    });
  });

  describe('getBudgetVsActual', () => {
    it('joins budgets to transactions and computes variance', async () => {
      const mockRows = [
        { budgetName: 'Groceries', budgeted: '200.00', actual: '150.00', variance: '-50.00' },
        { budgetName: 'Rent', budgeted: '500.00', actual: '500.00', variance: '0.00' },
      ];
      const qb = budgetRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue(mockRows);

      const result = await service.getBudgetVsActual('user-1');

      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(2);
      expect(result[0].variance).toBe('-50.00');
    });

    it('returns empty array when user has no budgets', async () => {
      const qb = budgetRepo.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);

      const result = await service.getBudgetVsActual('user-no-budgets');

      expect(result).toEqual([]);
    });
  });
});