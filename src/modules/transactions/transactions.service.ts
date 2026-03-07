/**
 * Transactions Service
 * Handles business logic for transaction management with CRUD operations.
 * Heavy side-effects (analytics recalculation, bulk sync) are offloaded to
 * BullMQ background jobs so the request-response cycle stays fast.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Transaction } from './transaction.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  ANALYTICS_RECALCULATION_QUEUE,
  JOB_RECALCULATE_ANALYTICS,
  JOB_BULK_SYNC,
} from '../../queue/queue.constants';

/**
 * Exported for backward-compatibility with existing unit tests.
 * Extends BadRequestException so NestJS HTTP error handling still works
 * while `instanceof ValidationError` checks in tests remain valid.
 */
export class ValidationError extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Exported for backward-compatibility with existing unit tests.
 * Extends NotFoundException so NestJS HTTP error handling still works
 * while `instanceof NotFoundError` checks in tests remain valid.
 */
export class NotFoundError extends NotFoundException {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export interface PaginatedTransactionsResult {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TransactionFilterOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  assetCode?: string;
  transactionType?: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    @Optional()
    @InjectQueue(ANALYTICS_RECALCULATION_QUEUE)
    private readonly analyticsQueue?: Queue,
    @Optional()
    private readonly notificationsGateway?: NotificationsGateway,
  ) { }

  /**
   * Periodic cron job that runs every 5 minutes to sync new transactions.
   * It triggers a bulk sync job for all users.
   */
  @Cron('0 */5 * * * *')
  async handlePeriodicSync() {
    this.logger.log('Starting periodic transaction sync cron job...');
    try {
      await this.triggerBulkSync();
      this.logger.log('Periodic sync job successfully enqueued');
    } catch (error) {
      this.logger.error(
        `Failed to enqueue periodic sync job: ${(error as Error).message}`,
      );
    }
  }


  async findAllPaginated(
    page: number = 1,
    limit: number = 20,
    sortOrder: 'asc' | 'desc' = 'desc',
    filters?: TransactionFilterOptions,
  ): Promise<PaginatedTransactionsResult> {
    const where: FindOptionsWhere<Transaction> = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.assetCode) {
      where.assetCode = filters.assetCode;
    }

    if (filters?.transactionType) {
      where.transactionType = filters.transactionType;
    }

    if (filters?.startDate && filters?.endDate) {
      where.stellarCreatedAt = Between(filters.startDate, filters.endDate);
    } else if (filters?.startDate) {
      where.stellarCreatedAt = Between(filters.startDate, new Date());
    } else if (filters?.endDate) {
      where.stellarCreatedAt = Between(new Date(0), filters.endDate);
    }

    const [data, total] = await this.repository.findAndCount({
      where,
      order: { stellarCreatedAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAll(): Promise<Transaction[]> {
    return this.repository.find({
      order: { stellarCreatedAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    this.validateId(id);
    return this.repository.findOne({ where: { id } });
  }

  async findByHash(hash: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { hash } });
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedTransactionsResult> {
    this.validateUserId(userId);
    return this.findAllPaginated(page, limit, 'desc', { userId });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedTransactionsResult> {
    this.validateDateRange(startDate, endDate);
    return this.findAllPaginated(page, limit, 'desc', { startDate, endDate });
  }

  async findByCategory(
    category: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedTransactionsResult> {
    this.validateCategory(category);
    return this.findAllPaginated(page, limit, 'desc', { category });
  }

  /**
   * Creates a new transaction and enqueues an analytics recalculation job.
   * The queue enqueue is fire-and-forget — a queue failure will NOT fail the create.
   */
  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    this.validateTransactionData(transactionData);

    const transaction = this.repository.create(transactionData);
    const created = await this.repository.save(transaction);

    // Offload analytics recalculation to the background queue so the API
    // responds immediately without waiting for aggregation to finish.
    if (this.analyticsQueue) {
      try {
        await this.analyticsQueue.add(JOB_RECALCULATE_ANALYTICS, {
          userId: transactionData.userId,
        });
        this.logger.log(
          `Enqueued ${JOB_RECALCULATE_ANALYTICS} job for userId=${transactionData.userId}`,
        );
      } catch (err) {
        // Queue errors must never fail the primary create operation.
        this.logger.error(
          `Failed to enqueue ${JOB_RECALCULATE_ANALYTICS} job: ${(err as Error).message}`,
        );
      }
    }

    // Emit real-time notification to connected clients
    this.emitTransactionNotifications(created);

    return created;
  }

  /**
   * Triggers an asynchronous bulk-sync of Stellar transactions for a user.
   * The actual sync logic runs inside AnalyticsProcessor (JOB_BULK_SYNC handler).
   *
   * @param userId  - Optional user UUID; omit to sync all users
   * @param since   - Optional ISO date string; only sync transactions after this date
   * @returns jobId assigned by BullMQ
   * @throws Error if the queue is not available (QueueModule not imported)
   */
  async triggerBulkSync(
    userId?: string,
    since?: string,
  ): Promise<{ jobId: string | undefined }> {
    if (!this.analyticsQueue) {
      throw new Error(
        'Queue not available — ensure QueueModule is imported in TransactionsModule',
      );
    }

    const job = await this.analyticsQueue.add(JOB_BULK_SYNC, { userId, since });
    this.logger.log(
      `Enqueued ${JOB_BULK_SYNC} job id=${job.id} for userId=${userId ?? 'all'}`,
    );
    return { jobId: job.id };
  }

  async createBulk(transactionsData: Partial<Transaction>[]): Promise<Transaction[]> {
    if (!Array.isArray(transactionsData) || transactionsData.length === 0) {
      throw new BadRequestException('Transactions data must be a non-empty array');
    }

    transactionsData.forEach((data, index) => {
      try {
        this.validateTransactionData(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(`Invalid transaction at index ${index}: ${errorMessage}`);
      }
    });

    const transactions = this.repository.create(transactionsData);
    return this.repository.save(transactions);
  }

  async update(id: string, transactionData: Partial<Transaction>): Promise<Transaction> {
    this.validateId(id);

    const existingTransaction = await this.repository.findOne({ where: { id } });
    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (Object.keys(transactionData).length > 0) {
      this.validateTransactionData(transactionData, true);
    }

    await this.repository.update(id, transactionData);
    return this.repository.findOne({ where: { id } }) as Promise<Transaction>;
  }

  async delete(id: string): Promise<boolean> {
    this.validateId(id);

    const existingTransaction = await this.repository.findOne({ where: { id } });
    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async syncFromStellar(
    stellarTransactions: Partial<Transaction>[],
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    const result = { created: 0, skipped: 0, errors: [] as string[] };

    for (const txData of stellarTransactions) {
      try {
        if (!txData.hash) {
          result.errors.push('Transaction hash is missing');
          continue;
        }
        const existing = await this.findByHash(txData.hash);
        if (existing) {
          result.skipped++;
          continue;
        }

        const created = await this.create(txData);
        result.created++;

        // Emit real-time notifications for synced transactions
        this.emitTransactionNotifications(created);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(
          `Failed to sync transaction ${txData.hash || 'unknown'}: ${errorMessage}`,
        );
      }
    }

    return result;
  }

  /**
   * Emits real-time notifications to connected WebSocket clients.
   * Events are scoped to the authenticated user only.
   */
  private emitTransactionNotifications(transaction: Transaction): void {
    if (!this.notificationsGateway) {
      return;
    }

    try {
      // Emit transaction created event
      this.notificationsGateway.emitTransactionCreated({
        userId: transaction.userId,
        transactionId: transaction.id,
        hash: transaction.hash,
        amount: transaction.amount,
        assetCode: transaction.assetCode,
        transactionType: transaction.transactionType,
        sourceAccount: transaction.sourceAccount,
        destinationAccount: transaction.destinationAccount,
        status: transaction.status,
        timestamp: transaction.stellarCreatedAt.toISOString(),
      });

      // Emit balance updated event
      this.notificationsGateway.emitBalanceUpdated({
        userId: transaction.userId,
        amount: transaction.amount,
        hash: transaction.hash,
        sourceAccount: transaction.sourceAccount,
        assetCode: transaction.assetCode,
        memo: transaction.memo,
        timestamp: transaction.stellarCreatedAt.toISOString(),
      });

      this.logger.debug(
        `Emitted real-time notifications for transaction ${transaction.id} to user ${transaction.userId}`,
      );
    } catch (error) {
      // Never let WebSocket errors fail the primary operation
      this.logger.error(
        `Failed to emit WebSocket notifications: ${(error as Error).message}`,
      );
    }
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Transaction ID is required and must be a string');
    }

    if (id.trim().length === 0) {
      throw new ValidationError('Transaction ID cannot be empty');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Transaction ID must be a valid UUID');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required and must be a string');
    }

    if (userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new ValidationError('Start date must be a valid Date object');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new ValidationError('End date must be a valid Date object');
    }

    if (startDate > endDate) {
      throw new ValidationError('Start date must be before or equal to end date');
    }
  }

  private validateCategory(category: string): void {
    if (!category || typeof category !== 'string') {
      throw new ValidationError('Category is required and must be a string');
    }

    if (category.trim().length === 0) {
      throw new ValidationError('Category cannot be empty');
    }

    if (category.trim().length < 2) {
      throw new ValidationError('Category must be at least 2 characters long');
    }
  }

  private validateTransactionData(
    transactionData: Partial<Transaction>,
    isUpdate: boolean = false,
  ): void {
    if (!transactionData || typeof transactionData !== 'object') {
      throw new ValidationError('Transaction data is required and must be an object');
    }

    // User ID validation
    if (transactionData.userId !== undefined) {
      if (
        typeof transactionData.userId !== 'string' ||
        transactionData.userId.trim().length === 0
      ) {
        throw new ValidationError('User ID is required and cannot be empty');
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(transactionData.userId)) {
        throw new ValidationError('User ID must be a valid UUID');
      }
    } else if (!isUpdate) {
      throw new ValidationError('User ID is required');
    }

    // Amount validation
    if (transactionData.amount !== undefined) {
      if (typeof transactionData.amount !== 'number') {
        throw new ValidationError('Amount must be a number');
      }

      if (transactionData.amount < 0) {
        throw new ValidationError('Amount cannot be negative');
      }

      if (!isFinite(transactionData.amount)) {
        throw new ValidationError('Amount must be a finite number');
      }

      // 7 decimal places for Stellar precision
      const decimalPlaces = (transactionData.amount.toString().split('.')[1] || '').length;
      if (decimalPlaces > 7) {
        throw new ValidationError('Amount cannot have more than 7 decimal places');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Amount is required');
    }

    // Hash validation (required for Stellar transactions)
    if (transactionData.hash !== undefined) {
      if (
        typeof transactionData.hash !== 'string' ||
        transactionData.hash.trim().length === 0
      ) {
        throw new ValidationError('Hash is required and cannot be empty');
      }

      if (transactionData.hash.length !== 64) {
        throw new ValidationError(
          'Hash must be a valid 64-character Stellar transaction hash',
        );
      }
    } else if (!isUpdate) {
      throw new ValidationError('Hash is required');
    }

    // Source account validation
    if (transactionData.sourceAccount !== undefined) {
      if (
        typeof transactionData.sourceAccount !== 'string' ||
        transactionData.sourceAccount.trim().length === 0
      ) {
        throw new ValidationError('Source account is required and cannot be empty');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Source account is required');
    }

    // Transaction type validation
    if (transactionData.transactionType !== undefined) {
      if (
        typeof transactionData.transactionType !== 'string' ||
        transactionData.transactionType.trim().length === 0
      ) {
        throw new ValidationError('Transaction type is required and cannot be empty');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Transaction type is required');
    }

    // Stellar created at validation
    if (transactionData.stellarCreatedAt !== undefined) {
      if (!(transactionData.stellarCreatedAt instanceof Date)) {
        throw new ValidationError('Stellar created at must be a valid Date object');
      }

      if (isNaN(transactionData.stellarCreatedAt.getTime())) {
        throw new ValidationError('Stellar created at must be a valid date');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Stellar created at is required');
    }

    // Category validation (optional field)
    if (transactionData.category !== undefined) {
      if (typeof transactionData.category !== 'string') {
        throw new ValidationError('Category must be a string');
      }
    }

    // Description validation (optional field)
    if (transactionData.description !== undefined) {
      if (typeof transactionData.description !== 'string') {
        throw new ValidationError('Description must be a string');
      }
    }
  }
}