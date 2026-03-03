import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Transaction } from './transaction.entity';

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
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  
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

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    this.validateTransactionData(transactionData);

    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

 
  async createBulk(transactionsData: Partial<Transaction>[]): Promise<Transaction[]> {
    if (!Array.isArray(transactionsData) || transactionsData.length === 0) {
      throw new BadRequestException('Transactions data must be a non-empty array');
    }

    // Validate each transaction
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
        // Check if transaction already exists by hash
        if (!txData.hash) {
          result.errors.push('Transaction hash is missing');
          continue;
        }
        const existing = await this.findByHash(txData.hash);
        if (existing) {
          result.skipped++;
          continue;
        }

        await this.create(txData);
        result.created++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to sync transaction ${txData.hash || 'unknown'}: ${errorMessage}`);
      }
    }

    return result;
  }

 
  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Transaction ID is required and must be a string');
    }

    if (id.trim().length === 0) {
      throw new BadRequestException('Transaction ID cannot be empty');
    }

    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Transaction ID must be a valid UUID');
    }
  }


  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('User ID is required and must be a string');
    }

    if (userId.trim().length === 0) {
      throw new BadRequestException('User ID cannot be empty');
    }

    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('User ID must be a valid UUID');
    }
  }


  private validateDateRange(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new BadRequestException('Start date must be a valid Date object');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new BadRequestException('End date must be a valid Date object');
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }
  }

 
  private validateCategory(category: string): void {
    if (!category || typeof category !== 'string') {
      throw new BadRequestException('Category is required and must be a string');
    }

    if (category.trim().length === 0) {
      throw new BadRequestException('Category cannot be empty');
    }

    if (category.trim().length < 2) {
      throw new BadRequestException('Category must be at least 2 characters long');
    }
  }


  private validateTransactionData(transactionData: Partial<Transaction>, isUpdate: boolean = false): void {
    if (!transactionData || typeof transactionData !== 'object') {
      throw new BadRequestException('Transaction data is required and must be an object');
    }

    // User ID validation
    if (transactionData.userId !== undefined) {
      if (typeof transactionData.userId !== 'string' || transactionData.userId.trim().length === 0) {
        throw new BadRequestException('User ID is required and cannot be empty');
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(transactionData.userId)) {
        throw new BadRequestException('User ID must be a valid UUID');
      }
    } else if (!isUpdate) {
      throw new BadRequestException('User ID is required');
    }

    // Amount validation
    if (transactionData.amount !== undefined) {
      if (typeof transactionData.amount !== 'number') {
        throw new BadRequestException('Amount must be a number');
      }

      if (transactionData.amount < 0) {
        throw new BadRequestException('Amount cannot be negative');
      }

      if (!isFinite(transactionData.amount)) {
        throw new BadRequestException('Amount must be a finite number');
      }

      // Check for reasonable decimal precision (7 decimal places for Stellar)
      const decimalPlaces = (transactionData.amount.toString().split('.')[1] || '').length;
      if (decimalPlaces > 7) {
        throw new BadRequestException('Amount cannot have more than 7 decimal places');
      }
    } else if (!isUpdate) {
      throw new BadRequestException('Amount is required');
    }

    // Hash validation (required for Stellar transactions)
    if (transactionData.hash !== undefined) {
      if (typeof transactionData.hash !== 'string' || transactionData.hash.trim().length === 0) {
        throw new BadRequestException('Hash is required and cannot be empty');
      }

      if (transactionData.hash.length !== 64) {
        throw new BadRequestException('Hash must be a valid 64-character Stellar transaction hash');
      }
    } else if (!isUpdate) {
      throw new BadRequestException('Hash is required');
    }

    // Source account validation
    if (transactionData.sourceAccount !== undefined) {
      if (typeof transactionData.sourceAccount !== 'string' || transactionData.sourceAccount.trim().length === 0) {
        throw new BadRequestException('Source account is required and cannot be empty');
      }
    } else if (!isUpdate) {
      throw new BadRequestException('Source account is required');
    }

    // Transaction type validation
    if (transactionData.transactionType !== undefined) {
      if (typeof transactionData.transactionType !== 'string' || transactionData.transactionType.trim().length === 0) {
        throw new BadRequestException('Transaction type is required and cannot be empty');
      }
    } else if (!isUpdate) {
      throw new BadRequestException('Transaction type is required');
    }

    // Stellar created at validation
    if (transactionData.stellarCreatedAt !== undefined) {
      if (!(transactionData.stellarCreatedAt instanceof Date)) {
        throw new BadRequestException('Stellar created at must be a valid Date object');
      }

      if (isNaN(transactionData.stellarCreatedAt.getTime())) {
        throw new BadRequestException('Stellar created at must be a valid date');
      }
    } else if (!isUpdate) {
      throw new BadRequestException('Stellar created at is required');
    }

    // Category validation (optional field)
    if (transactionData.category !== undefined) {
      if (typeof transactionData.category !== 'string') {
        throw new BadRequestException('Category must be a string');
      }
    }

    // Description validation (optional field)
    if (transactionData.description !== undefined) {
      if (typeof transactionData.description !== 'string') {
        throw new BadRequestException('Description must be a string');
      }
    }
  }
}
