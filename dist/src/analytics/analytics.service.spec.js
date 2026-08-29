"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const globals_1 = require("@jest/globals");
const analytics_service_1 = require("./analytics.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const cache_service_1 = require("../cache/cache.service");
(0, globals_1.describe)('AnalyticsService', () => {
    let service;
    let cacheService;
    let repo;
    let qb;
    (0, globals_1.beforeEach)(async () => {
        qb = {
            select: globals_1.jest.fn().mockReturnThis(),
            addSelect: globals_1.jest.fn().mockReturnThis(),
            where: globals_1.jest.fn().mockReturnThis(),
            andWhere: globals_1.jest.fn().mockReturnThis(),
            groupBy: globals_1.jest.fn().mockReturnThis(),
            orderBy: globals_1.jest.fn().mockReturnThis(),
            getRawMany: globals_1.jest.fn(),
        };
        cacheService = { get: globals_1.jest.fn(), set: globals_1.jest.fn() };
        repo = { createQueryBuilder: globals_1.jest.fn(() => qb) };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                analytics_service_1.AnalyticsService,
                { provide: (0, typeorm_1.getRepositoryToken)(transaction_entity_1.TransactionEntity), useValue: repo },
                { provide: cache_service_1.CacheService, useValue: cacheService },
            ],
        }).compile();
        service = module.get(analytics_service_1.AnalyticsService);
    });
    (0, globals_1.it)('returns cached trend without querying the DB on a cache hit', async () => {
        cacheService.get.mockResolvedValue([{ week: '2026-08-01', total: '100' }]);
        const result = await service.getSpendingTrend('user1', 'XLM', 12);
        (0, globals_1.expect)(result).toEqual([{ week: '2026-08-01', total: '100' }]);
        (0, globals_1.expect)(repo.createQueryBuilder).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('runs the aggregation query and caches the result on a cache miss', async () => {
        cacheService.get.mockResolvedValue(null);
        qb.getRawMany.mockResolvedValue([{ week: '2026-08-01', total: '250' }]);
        const result = await service.getSpendingTrend('user1', 'XLM', 12);
        (0, globals_1.expect)(qb.getRawMany).toHaveBeenCalled();
        (0, globals_1.expect)(cacheService.set).toHaveBeenCalledWith('analytics:trend:user1:XLM:12', [{ week: '2026-08-01', total: '250' }], 300);
        (0, globals_1.expect)(result).toEqual([{ week: '2026-08-01', total: '250' }]);
    });
});
//# sourceMappingURL=analytics.service.spec.js.map