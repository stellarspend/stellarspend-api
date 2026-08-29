import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CacheService } from './cache.service';

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
    })),
  };
});

describe('CacheService', () => {
  let service: CacheService;
  let redis: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redis = (service as any).redis;
  });

  describe('get', () => {
    it('returns the parsed value when the key exists', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));
      expect(await service.get('key')).toEqual({ foo: 'bar' });
    });

    it('returns null when the key does not exist', async () => {
      redis.get.mockResolvedValue(null);
      expect(await service.get('missing')).toBeNull();
    });
  });

  describe('set', () => {
    it('stringifies the value and sets it with EX ttl', async () => {
      redis.set.mockResolvedValue('OK');
      await service.set('key', { a: 1 }, 60);
      expect(redis.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ a: 1 }),
        'EX',
        60,
      );
    });
  });

  describe('del', () => {
    it('deletes a single key', async () => {
      redis.del.mockResolvedValue(1);
      await service.del('key');
      expect(redis.del).toHaveBeenCalledWith('key');
    });
  });

  describe('delByPattern', () => {
    it('scans and deletes all matching keys across a single-pass cursor', async () => {
      redis.scan.mockResolvedValueOnce(['0', ['transactions:u1:1', 'transactions:u1:2']]);
      redis.del.mockResolvedValue(2);

      await service.delByPattern('transactions:u1:*');

      expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'transactions:u1:*', 'COUNT', 100);
      expect(redis.del).toHaveBeenCalledWith('transactions:u1:1', 'transactions:u1:2');
    });

    it('follows a non-zero cursor across multiple scan iterations', async () => {
      redis.scan
        .mockResolvedValueOnce(['5', ['key:1']])
        .mockResolvedValueOnce(['0', ['key:2']]);
      redis.del.mockResolvedValue(1);

      await service.delByPattern('key:*');

      expect(redis.scan).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenNthCalledWith(1, 'key:1');
      expect(redis.del).toHaveBeenNthCalledWith(2, 'key:2');
    });

    it('does not call del when no keys match', async () => {
      redis.scan.mockResolvedValueOnce(['0', []]);
      await service.delByPattern('nomatch:*');
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('isHealthy', () => {
    it('returns true on PONG', async () => {
      redis.ping.mockResolvedValue('PONG');
      expect(await service.isHealthy()).toBe(true);
    });

    it('returns false when ping throws', async () => {
      redis.ping.mockRejectedValue(new Error('down'));
      expect(await service.isHealthy()).toBe(false);
    });
  });
});