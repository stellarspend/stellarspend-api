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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const cache_service_1 = require("../cache/cache.service");
const TREND_TTL_SECONDS = 300;
let AnalyticsService = class AnalyticsService {
    transactionsRepository;
    cacheService;
    constructor(transactionsRepository, cacheService) {
        this.transactionsRepository = transactionsRepository;
        this.cacheService = cacheService;
    }
    status() {
        return { module: 'analytics', status: 'ready' };
    }
    async getSpendingTrend(userId, asset, weeks) {
        const cacheKey = `analytics:trend:${userId}:${asset}:${weeks}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const rows = await this.transactionsRepository
            .createQueryBuilder('t')
            .select("date_trunc('week', t.createdAt)", 'week')
            .addSelect('SUM(t.amount)', 'total')
            .where('t.userId = :userId', { userId })
            .andWhere('t.asset = :asset', { asset })
            .andWhere(`t.createdAt >= NOW() - (:weeks || ' weeks')::interval`, { weeks })
            .groupBy('week')
            .orderBy('week', 'ASC')
            .getRawMany();
        await this.cacheService.set(cacheKey, rows, TREND_TTL_SECONDS);
        return rows;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.TransactionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cache_service_1.CacheService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map