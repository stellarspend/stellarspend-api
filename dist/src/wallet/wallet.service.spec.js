"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const globals_1 = require("@jest/globals");
const wallet_service_1 = require("./wallet.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const cache_service_1 = require("../cache/cache.service");
(0, globals_1.describe)('WalletService', () => {
    let service;
    let cacheService;
    let blockchainService;
    (0, globals_1.beforeEach)(async () => {
        cacheService = { get: globals_1.jest.fn(), set: globals_1.jest.fn() };
        blockchainService = { getBalances: globals_1.jest.fn() };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                wallet_service_1.WalletService,
                { provide: cache_service_1.CacheService, useValue: cacheService },
                { provide: blockchain_service_1.BlockchainService, useValue: blockchainService },
            ],
        }).compile();
        service = module.get(wallet_service_1.WalletService);
    });
    (0, globals_1.it)('returns cached balances without calling Horizon on a cache hit', async () => {
        cacheService.get.mockResolvedValue([{ asset_type: 'native', balance: '100' }]);
        const result = await service.getBalances('GABC...');
        (0, globals_1.expect)(result).toEqual([{ asset_type: 'native', balance: '100' }]);
        (0, globals_1.expect)(blockchainService.getBalances).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('calls Horizon and caches the result on a cache miss', async () => {
        cacheService.get.mockResolvedValue(null);
        blockchainService.getBalances.mockResolvedValue([{ asset_type: 'native', balance: '50' }]);
        const result = await service.getBalances('GABC...');
        (0, globals_1.expect)(blockchainService.getBalances).toHaveBeenCalledWith('GABC...');
        (0, globals_1.expect)(cacheService.set).toHaveBeenCalledWith('wallet:balances:GABC...', [{ asset_type: 'native', balance: '50' }], 30);
        (0, globals_1.expect)(result).toEqual([{ asset_type: 'native', balance: '50' }]);
    });
});
//# sourceMappingURL=wallet.service.spec.js.map