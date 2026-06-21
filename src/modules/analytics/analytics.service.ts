import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type SummaryRow = {
  month: string;
  category: string;
  total_amount: string;
  transaction_count: string;
};

type CategorySummary = {
  category: string;
  totalAmount: number;
  transactionCount: number;
};

type MonthlySummary = {
  month: string;
  totalAmount: number;
  transactionCount: number;
  categories: CategorySummary[];
};

type SpendingSummaryRow = {
  category: string;
  total_amount: string;
  transaction_count: string;
};

type CategoryBreakdown = {
  category: string;
  amount: number;
  percentageOfTotal: number;
  transactionCount: number;
};

type SpendingSummaryResponse = {
  period: string;
  currentPeriod: {
    totalSpent: number;
    transactionCount: number;
    byCategory: CategoryBreakdown[];
  };
  previousPeriod: {
    totalSpent: number;
    transactionCount: number;
  };
  trend: {
    percentageChange: number;
    absoluteChange: number;
  };
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(params: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalAmount: number;
    totalTransactions: number;
    monthly: MonthlySummary[];
  }> {
    const rows: SummaryRow[] = await this.dataSource.query(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('month', t."createdAt"), 'YYYY-MM') AS month,
        COALESCE(NULLIF(t.category, ''), 'uncategorized') AS category,
        SUM(t.amount)::numeric::text AS total_amount,
        COUNT(*)::int::text AS transaction_count
      FROM transactions t
      WHERE ($1::uuid IS NULL OR t."userId" = $1)
        AND ($2::date IS NULL OR t."createdAt" >= $2)
        AND ($3::date IS NULL OR t."createdAt" < ($3::date + INTERVAL '1 day'))
      GROUP BY DATE_TRUNC('month', t."createdAt"), category
      ORDER BY DATE_TRUNC('month', t."createdAt") DESC, category ASC
      `,
      [params.userId ?? null, params.startDate ?? null, params.endDate ?? null],
    );

    const monthlyMap = new Map<string, MonthlySummary>();

    for (const row of rows) {
      const categorySummary: CategorySummary = {
        category: row.category,
        totalAmount: Number(row.total_amount),
        transactionCount: Number(row.transaction_count),
      };

      const current = monthlyMap.get(row.month);
      if (!current) {
        monthlyMap.set(row.month, {
          month: row.month,
          totalAmount: categorySummary.totalAmount,
          transactionCount: categorySummary.transactionCount,
          categories: [categorySummary],
        });
        continue;
      }

      current.categories.push(categorySummary);
      current.totalAmount += categorySummary.totalAmount;
      current.transactionCount += categorySummary.transactionCount;
    }

    const monthly = Array.from(monthlyMap.values());
    const totalAmount = monthly.reduce((sum, m) => sum + m.totalAmount, 0);
    const totalTransactions = monthly.reduce(
      (sum, m) => sum + m.transactionCount,
      0,
    );

    return {
      totalAmount,
      totalTransactions,
      monthly,
    };
  }

  async getSpendingSummary(
    period: 'daily' | 'weekly' | 'monthly',
    userId?: string,
  ): Promise<SpendingSummaryResponse> {
    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    if (period === 'daily') {
      // Current day
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      // Previous day
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      // Current week (Monday to Sunday)
      const currentDay = now.getDay();
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), diff);
      currentPeriodEnd = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth(), currentPeriodStart.getDate() + 7);
      // Previous week
      previousPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth(), currentPeriodStart.getDate() - 7);
      previousPeriodEnd = currentPeriodStart;
    } else {
      // Current month
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      // Previous month
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousPeriodEnd = currentPeriodStart;
    }

    // Fetch current period spending
    const currentRows: SpendingSummaryRow[] = await this.dataSource.query(
      `
      SELECT
        COALESCE(NULLIF(t.category, ''), 'uncategorized') AS category,
        SUM(t.amount)::numeric::text AS total_amount,
        COUNT(*)::int::text AS transaction_count
      FROM transactions t
      WHERE ($1::uuid IS NULL OR t."userId" = $1)
        AND t."createdAt" >= $2
        AND t."createdAt" < $3
      GROUP BY COALESCE(NULLIF(t.category, ''), 'uncategorized')
      ORDER BY SUM(t.amount) DESC
      `,
      [userId ?? null, currentPeriodStart, currentPeriodEnd],
    );

    // Fetch previous period spending
    const previousRows: SpendingSummaryRow[] = await this.dataSource.query(
      `
      SELECT
        SUM(t.amount)::numeric::text AS total_amount
      FROM transactions t
      WHERE ($1::uuid IS NULL OR t."userId" = $1)
        AND t."createdAt" >= $2
        AND t."createdAt" < $3
      `,
      [userId ?? null, previousPeriodStart, previousPeriodEnd],
    );

    // Calculate current period totals
    const currentTotalSpent = currentRows.reduce((sum, row) => sum + Number(row.total_amount), 0);
    const currentTransactionCount = currentRows.reduce((sum, row) => sum + Number(row.transaction_count), 0);

    // Calculate previous period total
    const previousTotalSpent = previousRows.length > 0 ? Number(previousRows[0].total_amount) : 0;
    const previousTransactionCount = previousRows.length > 0 ? Number(previousRows[0].transaction_count) : 0;

    // Calculate category breakdown with percentages
    const byCategory: CategoryBreakdown[] = currentRows.map((row) => ({
      category: row.category,
      amount: Number(row.total_amount),
      percentageOfTotal: currentTotalSpent > 0 ? (Number(row.total_amount) / currentTotalSpent) * 100 : 0,
      transactionCount: Number(row.transaction_count),
    }));

    // Calculate trend
    const percentageChange = previousTotalSpent > 0 ? ((currentTotalSpent - previousTotalSpent) / previousTotalSpent) * 100 : 0;
    const absoluteChange = currentTotalSpent - previousTotalSpent;

    return {
      period,
      currentPeriod: {
        totalSpent: currentTotalSpent,
        transactionCount: currentTransactionCount,
        byCategory,
      },
      previousPeriod: {
        totalSpent: previousTotalSpent,
        transactionCount: previousTransactionCount,
      },
      trend: {
        percentageChange,
        absoluteChange,
      },
    };
  }
}
