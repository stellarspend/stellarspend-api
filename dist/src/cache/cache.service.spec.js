"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const globals_1 = require("@jest/globals");
const cache_service_1 = require("./cache.service");
globals_1.jest.mock('ioredis', () => {
    return {
        __esModule: true,
        default: globals_1.jest.fn().mockImplementation(() => ({
            get: globals_1.jest.fn(),
            set: globals_1.jest.fn(),
            del: globals_1.jest.fn(),
            scan: globals_1.jest.fn(),
            ping: globals_1.jest.fn(),
            quit: globals_1.jest.fn(),
        })),
    };
});
(0, globals_1.describe)('CacheService', () => {
    let service;
    let redis;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [cache_service_1.CacheService],
        }).compile();
        service = module.get(cache_service_1.CacheService);
        redis = service.redis;
    });
    (0, globals_1.describe)('get', () => {
        (0, globals_1.it)('returns the parsed value when the key exists', async () => {
            redis.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));
            (0, globals_1.expect)(await service.get('key')).toEqual({ foo: 'bar' });
        });
        (0, globals_1.it)('returns null when the key does not exist', async () => {
            redis.get.mockResolvedValue(null);
            (0, globals_1.expect)(await service.get('missing')).toBeNull();
        });
    });
    (0, globals_1.describe)('set', () => {
        (0, globals_1.it)('stringifies the value and sets it with EX ttl', async () => {
            redis.set.mockResolvedValue('OK');
            await service.set('key', { a: 1 }, 60);
            (0, globals_1.expect)(redis.set).toHaveBeenCalledWith('key', JSON.stringify({ a: 1 }), 'EX', 60);
        });
    });
    (0, globals_1.describe)('del', () => {
        (0, globals_1.it)('deletes a single key', async () => {
            redis.del.mockResolvedValue(1);
            await service.del('key');
            (0, globals_1.expect)(redis.del).toHaveBeenCalledWith('key');
        });
    });
    (0, globals_1.describe)('delByPattern', () => {
        (0, globals_1.it)('scans and deletes all matching keys across a single-pass cursor', async () => {
            redis.scan.mockResolvedValueOnce(['0', ['transactions:u1:1', 'transactions:u1:2']]);
            redis.del.mockResolvedValue(2);
            await service.delByPattern('transactions:u1:*');
            (0, globals_1.expect)(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'transactions:u1:*', 'COUNT', 100);
            (0, globals_1.expect)(redis.del).toHaveBeenCalledWith('transactions:u1:1', 'transactions:u1:2');
        });
        (0, globals_1.it)('follows a non-zero cursor across multiple scan iterations', async () => {
            redis.scan
                .mockResolvedValueOnce(['5', ['key:1']])
                .mockResolvedValueOnce(['0', ['key:2']]);
            redis.del.mockResolvedValue(1);
            await service.delByPattern('key:*');
            (0, globals_1.expect)(redis.scan).toHaveBeenCalledTimes(2);
            (0, globals_1.expect)(redis.del).toHaveBeenNthCalledWith(1, 'key:1');
            (0, globals_1.expect)(redis.del).toHaveBeenNthCalledWith(2, 'key:2');
        });
        (0, globals_1.it)('does not call del when no keys match', async () => {
            redis.scan.mockResolvedValueOnce(['0', []]);
            await service.delByPattern('nomatch:*');
            (0, globals_1.expect)(redis.del).not.toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('isHealthy', () => {
        (0, globals_1.it)('returns true on PONG', async () => {
            redis.ping.mockResolvedValue('PONG');
            (0, globals_1.expect)(await service.isHealthy()).toBe(true);
        });
        (0, globals_1.it)('returns false when ping throws', async () => {
            redis.ping.mockRejectedValue(new Error('down'));
            (0, globals_1.expect)(await service.isHealthy()).toBe(false);
        });
    });
});
//# sourceMappingURL=cache.service.spec.js.map