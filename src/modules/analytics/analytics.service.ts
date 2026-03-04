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
}
