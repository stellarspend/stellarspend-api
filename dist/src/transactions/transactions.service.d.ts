import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { CacheService } from '../cache/cache.service';
export interface SyncResult {
    synced: number;
}
export interface PaginatedHistory {
    data: TransactionEntity[];
    total: number;
}
export interface SpendingByCategoryRow {
    category: string;
    total: string;
}
/** Provides the transactions application capability. */
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly cacheService;
    private readonly horizon;
    constructor(transactionsRepository: Repository<TransactionEntity>, cacheService: CacheService);
    /** Returns a stable service health payload for this capability. */
    status(): {
        module: string;
        status: string;
    };
    /**
     * Fetches the last 200 operations for `publicKey` from Horizon, normalizes
     * payment-type operations into TransactionEntity rows, and inserts them
     * with ON CONFLICT (hash) DO NOTHING. Returns the count of rows actually
     * inserted (duplicates are silently skipped, not counted).
     */
    syncTransactions(userId: string, publicKey: string): Promise<SyncResult>;
    /**
     * Paginated transaction history for a user, with optional category/asset
     * filters, ordered newest-first.
     */
    getHistory(userId: string, options: {
        page: number;
        limit: number;
        category?: string;
        asset?: string;
    }): Promise<PaginatedHistory>;
    /**
     * Updates the category on a single transaction. Throws NotFoundException
     * if the row doesn't exist, ForbiddenException if it belongs to a
     * different user.
     */
    categorize(userId: string, transactionId: string, category: string): Promise<TransactionEntity>;
    /**
     * Aggregates total spend per category for a user, filtered by asset and
     * a minimum created_at date.
     */
    getSpendingByCategory(userId: string, asset: string, since: Date): Promise<SpendingByCategoryRow[]>;
}
