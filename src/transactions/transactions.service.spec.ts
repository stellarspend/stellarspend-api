import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
// ASSUMPTION: confirm actual entity file path/name.
import { TransactionEntity } from './entities/transaction.entity';
import { CacheService } from '../cache/cache.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: any;
  

  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn<
      () => Promise<{ raw: Array<{ id: string }> }>
    >(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn<() => Promise<[any[], number]>>(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn<
      () => Promise<Array<{ category: string; total: string }>>
    >(),
  };

  beforeEach(async () => {
    repo = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
  providers: [
    TransactionsService,
    { provide: getRepositoryToken(TransactionEntity), useValue: repo },
    {
      provide: CacheService,
      useValue: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        delByPattern: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  
      },
    },
   ],
  }).compile();

    service = module.get<TransactionsService>(TransactionsService);
   

    // Stub the Horizon client the service constructs internally so tests
    // never make real network calls. Overridden per-test below.
    (service as any).horizon = {
      operations: () => ({
        forAccount: () => ({
          order: () => ({
            limit: () => ({
              call: jest
                .fn<() => Promise<{ records: unknown[] }>>()
                .mockResolvedValue({ records: [] }),
            }),
          }),
        }),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncTransactions', () => {
    it('inserts only new rows and returns the count actually inserted (dedup via ON CONFLICT)', async () => {
      const mockPage = {
        records: [
          {
            type: 'payment',
            transaction_hash: 'hash1',
            asset_type: 'native',
            amount: '10.0000000',
            created_at: '2026-01-01T00:00:00Z',
          },
          {
            type: 'payment',
            transaction_hash: 'hash2', // simulated as already existing → skipped by ON CONFLICT
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            amount: '5.0000000',
            created_at: '2026-01-02T00:00:00Z',
          },
        ],
      };

      (service as any).horizon.operations = () => ({
        forAccount: () => ({
          order: () => ({
            limit: () => ({
              call: jest
                .fn<() => Promise<{ records: unknown[] }>>()
                .mockResolvedValue(mockPage),
            }),
          }),
        }),
      });

      // RETURNING only reports the row that was actually inserted; the
      // duplicate hash never appears here.
      mockQueryBuilder.execute.mockResolvedValue({ raw: [{ id: 'uuid-1' }] });

      const result = await service.syncTransactions('user-1', 'GPUBLICKEY');

      expect(result).toEqual({ synced: 1 });
      expect(mockQueryBuilder.orIgnore).toHaveBeenCalled();
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ hash: 'hash1', asset: 'XLM' }),
          expect.objectContaining({ hash: 'hash2', asset: 'USDC' }),
        ]),
      );
    });

    it('returns { synced: 0 } and does not touch the repository when there are no payment operations', async () => {
      const result = await service.syncTransactions('user-1', 'GPUBLICKEY');

      expect(result).toEqual({ synced: 0 });
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('calling sync twice with the same Horizon data does not increase synced count on the second call', async () => {
      const mockPage = {
        records: [
          {
            type: 'payment',
            transaction_hash: 'hash1',
            asset_type: 'native',
            amount: '10.0000000',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      };

      (service as any).horizon.operations = () => ({
        forAccount: () => ({
          order: () => ({
            limit: () => ({
              call: jest
                .fn<() => Promise<{ records: unknown[] }>>()
                .mockResolvedValue(mockPage),
            }),
          }),
        }),
      });

      // First call: row is new.
      mockQueryBuilder.execute.mockResolvedValueOnce({
        raw: [{ id: 'uuid-1' }],
      });
      const first = await service.syncTransactions('user-1', 'GPUBLICKEY');
      expect(first).toEqual({ synced: 1 });

      // Second call: same hash already exists, ON CONFLICT DO NOTHING → no rows returned.
      mockQueryBuilder.execute.mockResolvedValueOnce({ raw: [] });
      const second = await service.syncTransactions('user-1', 'GPUBLICKEY');
      expect(second).toEqual({ synced: 0 });
    });
  });

  describe('getHistory', () => {
    it('returns paginated results filtered by category', async () => {
      const rows = [{ id: '1', category: 'groceries' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([rows, 1]);

      const result = await service.getHistory('user-1', {
        page: 1,
        limit: 20,
        category: 'groceries',
      });

      expect(result).toEqual({ data: rows, total: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        't.category = :category',
        { category: 'groceries' },
      );
    });

    it('applies correct skip/take for pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getHistory('user-1', { page: 3, limit: 5 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('categorize', () => {
    it('updates category when the transaction belongs to the user', async () => {
      const tx = { id: 'tx-1', userId: 'user-1', category: null };
      repo.findOne.mockResolvedValue(tx);
      repo.save.mockImplementation((t: any) => Promise.resolve(t));

      const result = await service.categorize('user-1', 'tx-1', 'groceries');

      expect(result.category).toBe('groceries');
    });

    it('throws ForbiddenException when the transaction belongs to another user', async () => {
      repo.findOne.mockResolvedValue({ id: 'tx-1', userId: 'someone-else' });

      await expect(
        service.categorize('user-1', 'tx-1', 'groceries'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the transaction does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.categorize('user-1', 'missing', 'groceries'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSpendingByCategory', () => {
    it('returns aggregated totals per category', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { category: 'groceries', total: '15.0000000' },
      ]);

      const result = await service.getSpendingByCategory(
        'user-1',
        'USDC',
        new Date('2026-01-01'),
      );

      expect(result).toEqual([{ category: 'groceries', total: '15.0000000' }]);
    });
  });
});