"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const globals_1 = require("@jest/globals");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("./transactions.service");
// ASSUMPTION: confirm actual entity file path/name.
const transaction_entity_1 = require("./entities/transaction.entity");
const cache_service_1 = require("../cache/cache.service");
(0, globals_1.describe)('TransactionsService', () => {
    let service;
    let repo;
    let cacheService;
    const mockQueryBuilder = {
        insert: globals_1.jest.fn().mockReturnThis(),
        into: globals_1.jest.fn().mockReturnThis(),
        values: globals_1.jest.fn().mockReturnThis(),
        orIgnore: globals_1.jest.fn().mockReturnThis(),
        returning: globals_1.jest.fn().mockReturnThis(),
        execute: globals_1.jest.fn(),
        where: globals_1.jest.fn().mockReturnThis(),
        andWhere: globals_1.jest.fn().mockReturnThis(),
        orderBy: globals_1.jest.fn().mockReturnThis(),
        skip: globals_1.jest.fn().mockReturnThis(),
        take: globals_1.jest.fn().mockReturnThis(),
        getManyAndCount: globals_1.jest.fn(),
        select: globals_1.jest.fn().mockReturnThis(),
        addSelect: globals_1.jest.fn().mockReturnThis(),
        groupBy: globals_1.jest.fn().mockReturnThis(),
        getRawMany: globals_1.jest.fn(),
    };
    (0, globals_1.beforeEach)(async () => {
        repo = {
            createQueryBuilder: globals_1.jest.fn(() => mockQueryBuilder),
            findOne: globals_1.jest.fn(),
            save: globals_1.jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transactions_service_1.TransactionsService,
                { provide: (0, typeorm_1.getRepositoryToken)(transaction_entity_1.TransactionEntity), useValue: repo },
                {
                    provide: cache_service_1.CacheService,
                    useValue: {
                        get: globals_1.jest.fn(),
                        set: globals_1.jest.fn(),
                        del: globals_1.jest.fn(),
                        delByPattern: globals_1.jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();
        service = module.get(transactions_service_1.TransactionsService);
        cacheService = module.get(cache_service_1.CacheService);
        // Stub the Horizon client the service constructs internally so tests
        // never make real network calls. Overridden per-test below.
        service.horizon = {
            operations: () => ({
                forAccount: () => ({
                    order: () => ({
                        limit: () => ({
                            call: globals_1.jest
                                .fn()
                                .mockResolvedValue({ records: [] }),
                        }),
                    }),
                }),
            }),
        };
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('syncTransactions', () => {
        (0, globals_1.it)('inserts only new rows and returns the count actually inserted (dedup via ON CONFLICT)', async () => {
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
            service.horizon.operations = () => ({
                forAccount: () => ({
                    order: () => ({
                        limit: () => ({
                            call: globals_1.jest
                                .fn()
                                .mockResolvedValue(mockPage),
                        }),
                    }),
                }),
            });
            // RETURNING only reports the row that was actually inserted; the
            // duplicate hash never appears here.
            mockQueryBuilder.execute.mockResolvedValue({ raw: [{ id: 'uuid-1' }] });
            const result = await service.syncTransactions('user-1', 'GPUBLICKEY');
            (0, globals_1.expect)(result).toEqual({ synced: 1 });
            (0, globals_1.expect)(mockQueryBuilder.orIgnore).toHaveBeenCalled();
            (0, globals_1.expect)(mockQueryBuilder.values).toHaveBeenCalledWith(globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({ hash: 'hash1', asset: 'XLM' }),
                globals_1.expect.objectContaining({ hash: 'hash2', asset: 'USDC' }),
            ]));
        });
        (0, globals_1.it)('returns { synced: 0 } and does not touch the repository when there are no payment operations', async () => {
            const result = await service.syncTransactions('user-1', 'GPUBLICKEY');
            (0, globals_1.expect)(result).toEqual({ synced: 0 });
            (0, globals_1.expect)(repo.createQueryBuilder).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('calling sync twice with the same Horizon data does not increase synced count on the second call', async () => {
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
            service.horizon.operations = () => ({
                forAccount: () => ({
                    order: () => ({
                        limit: () => ({
                            call: globals_1.jest
                                .fn()
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
            (0, globals_1.expect)(first).toEqual({ synced: 1 });
            // Second call: same hash already exists, ON CONFLICT DO NOTHING → no rows returned.
            mockQueryBuilder.execute.mockResolvedValueOnce({ raw: [] });
            const second = await service.syncTransactions('user-1', 'GPUBLICKEY');
            (0, globals_1.expect)(second).toEqual({ synced: 0 });
        });
    });
    (0, globals_1.describe)('getHistory', () => {
        (0, globals_1.it)('returns paginated results filtered by category', async () => {
            const rows = [{ id: '1', category: 'groceries' }];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([rows, 1]);
            const result = await service.getHistory('user-1', {
                page: 1,
                limit: 20,
                category: 'groceries',
            });
            (0, globals_1.expect)(result).toEqual({ data: rows, total: 1 });
            (0, globals_1.expect)(mockQueryBuilder.andWhere).toHaveBeenCalledWith('t.category = :category', { category: 'groceries' });
        });
        (0, globals_1.it)('applies correct skip/take for pagination', async () => {
            mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
            await service.getHistory('user-1', { page: 3, limit: 5 });
            (0, globals_1.expect)(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
            (0, globals_1.expect)(mockQueryBuilder.take).toHaveBeenCalledWith(5);
        });
    });
    (0, globals_1.describe)('categorize', () => {
        (0, globals_1.it)('updates category when the transaction belongs to the user', async () => {
            const tx = { id: 'tx-1', userId: 'user-1', category: null };
            repo.findOne.mockResolvedValue(tx);
            repo.save.mockImplementation((t) => Promise.resolve(t));
            const result = await service.categorize('user-1', 'tx-1', 'groceries');
            (0, globals_1.expect)(result.category).toBe('groceries');
        });
        (0, globals_1.it)('throws ForbiddenException when the transaction belongs to another user', async () => {
            repo.findOne.mockResolvedValue({ id: 'tx-1', userId: 'someone-else' });
            await (0, globals_1.expect)(service.categorize('user-1', 'tx-1', 'groceries')).rejects.toThrow(common_1.ForbiddenException);
        });
        (0, globals_1.it)('throws NotFoundException when the transaction does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await (0, globals_1.expect)(service.categorize('user-1', 'missing', 'groceries')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    (0, globals_1.describe)('getSpendingByCategory', () => {
        (0, globals_1.it)('returns aggregated totals per category', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { category: 'groceries', total: '15.0000000' },
            ]);
            const result = await service.getSpendingByCategory('user-1', 'USDC', new Date('2026-01-01'));
            (0, globals_1.expect)(result).toEqual([{ category: 'groceries', total: '15.0000000' }]);
        });
    });
});
//# sourceMappingURL=transactions.service.spec.js.map