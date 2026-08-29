import { Repository } from 'typeorm';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { CacheService } from '../cache/cache.service';
export interface SpendingTrendPoint {
    week: string;
    total: string;
}
export declare class AnalyticsService {
    private readonly transactionsRepository;
    private readonly cacheService;
    constructor(transactionsRepository: Repository<TransactionEntity>, cacheService: CacheService);
    status(): {
        module: string;
        status: string;
    };
    getSpendingTrend(userId: string, asset: string, weeks: number): Promise<SpendingTrendPoint[]>;
}
