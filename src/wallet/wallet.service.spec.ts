import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WalletService } from './wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CacheService } from '../cache/cache.service';

describe('WalletService', () => {
  let service: WalletService;
  let cacheService: { get: jest.Mock<any>; set: jest.Mock<any> };
  let blockchainService: { getBalances: jest.Mock<any> };

  beforeEach(async () => {
    cacheService = { get: jest.fn(), set: jest.fn() };
    blockchainService = { getBalances: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: CacheService, useValue: cacheService },
        { provide: BlockchainService, useValue: blockchainService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('returns cached balances without calling Horizon on a cache hit', async () => {
    cacheService.get.mockResolvedValue([{ asset_type: 'native', balance: '100' }]);

    const result = await service.getBalances('GABC...');

    expect(result).toEqual([{ asset_type: 'native', balance: '100' }]);
    expect(blockchainService.getBalances).not.toHaveBeenCalled();
  });

  it('calls Horizon and caches the result on a cache miss', async () => {
    cacheService.get.mockResolvedValue(null);
    blockchainService.getBalances.mockResolvedValue([{ asset_type: 'native', balance: '50' }]);

    const result = await service.getBalances('GABC...');

    expect(blockchainService.getBalances).toHaveBeenCalledWith('GABC...');
    expect(cacheService.set).toHaveBeenCalledWith(
      'wallet:balances:GABC...',
      [{ asset_type: 'native', balance: '50' }],
      30,
    );
    expect(result).toEqual([{ asset_type: 'native', balance: '50' }]);
  });
});