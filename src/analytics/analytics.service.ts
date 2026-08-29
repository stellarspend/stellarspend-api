import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { CacheService } from '../cache/cache.service';
import { BudgetEntity } from '../budgets/entities/budget.entity';

const TREND_TTL_SECONDS = 300;

export interface SpendingTrendRow {
  week: string;
  total: string;
}

export interface CategoryBreakdownRow {
  category: string;
  total: string;
  percentage: string;
}

export interface BudgetVsActualRow {
  budgetName: string;
  budgeted: string;
  actual: string;
  variance: string;
}

/** Provides real analytics queries against the transactions and budgets tables. */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    @InjectRepository(BudgetEntity)
    private readonly budgetsRepository: Repository<BudgetEntity>,
    private readonly cacheService: CacheService,
  ) {}

  /** Reports module availability for operations and smoke tests. */
  status(): { module: string; status: string } {
    return { module: 'analytics', status: 'ready' };
  }

  /**
   * Groups spending into weekly buckets using PostgreSQL date_trunc('week').
   * Returns the most recent `weeks` weeks with aggregated totals.
   * Cached for TREND_TTL_SECONDS to avoid re-running the aggregation on repeat calls.
   */
  async getSpendingTrend(
    userId: string,
    asset: string,
    weeks: number = 8,
  ): Promise<SpendingTrendRow[]> {
    const cacheKey = `analytics:trend:${userId}:${asset}:${weeks}`;

    const cached = await this.cacheService.get<SpendingTrendRow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await this.transactionsRepository
      .createQueryBuilder('t')
      .select("date_trunc('week', t.\"createdAt\")", 'week')
      .addSelect('SUM(t.amount)', 'total')
      .where('t."userId" = :userId', { userId })
      .andWhere('t."asset" = :asset', { asset })
      .groupBy("date_trunc('week', t.\"createdAt\")")
      .orderBy('week', 'DESC')
      .limit(weeks)
      .getRawMany<SpendingTrendRow>();

    await this.cacheService.set(cacheKey, rows, TREND_TTL_SECONDS);
    return rows;
  }

  /**
   * Sums spending by category and computes each category's percentage of the
   * grand total in SQL for accuracy.
   */
  async getCategoryBreakdown(
    userId: string,
    asset: string,
    since: Date,
  ): Promise<CategoryBreakdownRow[]> {
    return this.transactionsRepository
      .createQueryBuilder('t')
      .select('t."category"', 'category')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect(
        `ROUND(SUM(t.amount) * 100 / NULLIF(SUM(SUM(t.amount)) OVER (), 0), 6)::text`,
        'percentage',
      )
      .where('t."userId" = :userId', { userId })
      .andWhere('t."asset" = :asset', { asset })
      .andWhere('t."createdAt" >= :since', { since })
      .groupBy('t."category"')
      .orderBy('total', 'DESC')
      .getRawMany<CategoryBreakdownRow>();
  }

  /**
   * Joins budgets to transactions on category and asset, computing variance
   * for each budget: variance = actual_spend - budgeted_amount.
   * Negative variance means underspend; positive means overspend.
   */
  async getBudgetVsActual(userId: string): Promise<BudgetVsActualRow[]> {
    return this.budgetsRepository
      .createQueryBuilder('b')
      .select('b."name"', 'budgetName')
      .addSelect('b.amount', 'budgeted')
      .addSelect('COALESCE(SUM(t.amount), 0)::text', 'actual')
      .addSelect(
        '(COALESCE(SUM(t.amount), 0) - b.amount)::text',
        'variance',
      )
      .leftJoin(
        TransactionEntity,
        't',
        't."userId" = b."userId" AND t."category" = b."category" AND t."asset" = b."asset"',
      )
      .where('b."userId" = :userId', { userId })
      .groupBy('b.id')
      .addGroupBy('b."name"')
      .addGroupBy('b.amount')
      .orderBy('b."name"', 'ASC')
      .getRawMany<BudgetVsActualRow>();
  }
}