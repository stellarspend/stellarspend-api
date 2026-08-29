"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const cache_service_1 = require("../cache/cache.service");
const BALANCES_TTL_SECONDS = 30;
let WalletService = class WalletService {
    blockchainService;
    cacheService;
    constructor(blockchainService, cacheService) {
        this.blockchainService = blockchainService;
        this.cacheService = cacheService;
    }
    status() {
        return { module: 'wallet', status: 'ready' };
    }
    async getBalances(publicKey) {
        const cacheKey = `wallet:balances:${publicKey}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const balances = await this.blockchainService.getBalances(publicKey);
        await this.cacheService.set(cacheKey, balances, BALANCES_TTL_SECONDS);
        return balances;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService,
        cache_service_1.CacheService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map