import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Matches the import used in BlockchainService: the scoped `@stellar/stellar-sdk`
// package exports `Horizon.Server`, not a flat `Server` export.
import { Horizon } from '@stellar/stellar-sdk';
import { TransactionEntity } from './entities/transaction.entity';
import { CacheService } from '../cache/cache.service';


// Matches the fallback URL used in BlockchainService (process.env.HORIZON_URL ??
// this default). Kept as a local constant for now — see note below.
const HORIZON_URL = process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

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
@Injectable()
export class TransactionsService {
  private readonly horizon = new Horizon.Server(HORIZON_URL);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    private readonly cacheService: CacheService,
  ) {}

  /** Returns a stable service health payload for this capability. */
  status(): { module: string; status: string } {
    return { module: 'transactions', status: 'ready' };
  }

  /**
   * Fetches the last 200 operations for `publicKey` from Horizon, normalizes
   * payment-type operations into TransactionEntity rows, and inserts them
   * with ON CONFLICT (hash) DO NOTHING. Returns the count of rows actually
   * inserted (duplicates are silently skipped, not counted).
   */
  async syncTransactions(
    userId: string,
    publicKey: string,
  ): Promise<SyncResult> {
    const page = await this.horizon
      .operations()
      .forAccount(publicKey)
      .order('desc')
      .limit(200)
      .call();

    const paymentOps = page.records.filter((op: any) =>
      [
        'payment',
        'path_payment_strict_receive',
        'path_payment_strict_send',
      ].includes(op.type),
    );

    if (paymentOps.length === 0) {
      return { synced: 0 };
    }

    // `category` is intentionally omitted so Postgres applies the column's
    // own default ('uncategorized') — the column is NOT NULL with no
    // nullable: true, so passing category: null here would violate that
    // constraint instead of falling through to the default.
    const rows = paymentOps.map((op: any) => ({
      userId,
      hash: op.transaction_hash,
      asset:
        op.asset_type === 'native' ? 'XLM' : op.asset_code ?? 'UNKNOWN',
      amount: op.amount,
      createdAt: new Date(op.created_at),
    }));

    // Postgres RETURNING only reports rows that were actually inserted —
    // rows skipped by ON CONFLICT DO NOTHING never appear here, so
    // result.raw.length is the true "new rows" count, not attempted count.
    const result = await this.transactionsRepository
      .createQueryBuilder()
      .insert()
      .into(TransactionEntity)
      .values(rows)
      .orIgnore()
      .returning(['id'])
      .execute();

      if (result.raw.length > 0) {
    await this.cacheService.delByPattern(
    `transactions:${userId}:*`,
   );
   }
    return { synced: result.raw.length };
  }

  /**
   * Paginated transaction history for a user, with optional category/asset
   * filters, ordered newest-first.
   */
  async getHistory(
    userId: string,
    options: { page: number; limit: number; category?: string; asset?: string },
  ): Promise<PaginatedHistory> {
    const { page, limit, category, asset } = options;

    const cacheKey = `transactions:${userId}:${page}:${limit}:${category ?? ''}:${asset ?? ''}`;

   const cached = await this.cacheService.get<PaginatedHistory>(cacheKey);

    if (cached) {
    return cached;
  }

    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (category) {
      qb.andWhere('t.category = :category', { category });
    }

    if (asset) {
      qb.andWhere('t.asset = :asset', { asset });
    }

    const [data, total] = await qb.getManyAndCount();

    const result = { data, total };

    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Updates the category on a single transaction. Throws NotFoundException
   * if the row doesn't exist, ForbiddenException if it belongs to a
   * different user.
   */
  async categorize(
    userId: string,
    transactionId: string,
    category: string,
  ): Promise<TransactionEntity> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException(
        'Transaction does not belong to this user',
      );
    }

    transaction.category = category;
    return this.transactionsRepository.save(transaction);
  }

  /**
   * Aggregates total spend per category for a user, filtered by asset and
   * a minimum created_at date.
   */
  async getSpendingByCategory(
    userId: string,
    asset: string,
    since: Date,
  ): Promise<SpendingByCategoryRow[]> {
    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.category', 'category')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.asset = :asset', { asset })
      .andWhere('t.createdAt >= :since', { since })
      .groupBy('t.category')
      .getRawMany();

    return rows;
  }
}