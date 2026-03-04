/**
 * Transactions Service Test Suite
 * Comprehensive tests for TransactionsService with TypeORM integration
 */

import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockRepository: jest.Mocked<Repository<Transaction>>;

  const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: '123e4567-e89b-42d3-a456-426614174001',
    userId: '123e4567-e89b-42d3-a456-426614174000',
    hash: 'a'.repeat(64),
    sourceAccount: 'G'.repeat(56),
    destinationAccount: undefined,
    amount: 100.5,
    assetCode: 'XLM',
    assetIssuer: undefined,
    transactionType: 'payment',
    memo: undefined,
    memoType: undefined,
    status: 'completed',
    ledgerSequence: 12345,
    stellarCreatedAt: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    category: 'groceries',
    description: 'Test transaction',
    ...overrides,
  });

  const createTestTransactionList = (count: number = 3): Transaction[] => {
    return Array.from({ length: count }, (_, index) =>
      createTestTransaction({
        id: `123e4567-e89b-42d3-a456-42661417400${index + 1}`,
        hash: 'a'.repeat(64 - index.toString().length) + index,
        amount: 50 + index * 10,
      }),
    );
  };

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Transaction>>;

    service = new TransactionsService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPaginated', () => {
    it('should return paginated transactions', async () => {
      const transactions = createTestTransactionList(3);
      mockRepository.findAndCount.mockResolvedValue([transactions, 3]);

      const result = await service.findAllPaginated(1, 20, 'desc');

      expect(result.data).toEqual(transactions);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should apply filters correctly', async () => {
      const transactions = createTestTransactionList(2);
      mockRepository.findAndCount.mockResolvedValue([transactions, 2]);

      await service.findAllPaginated(1, 20, 'desc', {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        category: 'groceries',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: '123e4567-e89b-42d3-a456-426614174000',
            category: 'groceries',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      const transactions = createTestTransactionList(3);
      mockRepository.find.mockResolvedValue(transactions);

      const result = await service.findAll();

      expect(result).toEqual(transactions);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { stellarCreatedAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return transaction by ID', async () => {
      const transaction = createTestTransaction();
      mockRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findById('123e4567-e89b-42d3-a456-426614174001');

      expect(result).toEqual(transaction);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-42d3-a456-426614174001' },
      });
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByHash', () => {
    it('should return transaction by hash', async () => {
      const transaction = createTestTransaction();
      mockRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findByHash('a'.repeat(64));

      expect(result).toEqual(transaction);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { hash: 'a'.repeat(64) },
      });
    });
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        userId: '123e4567-e89b-42d3-a456-426614174000',
        hash: 'a'.repeat(64),
        sourceAccount: 'G'.repeat(56),
        amount: 100.5,
        transactionType: 'payment',
        stellarCreatedAt: new Date('2024-01-15T10:30:00Z'),
      };
      const savedTransaction = createTestTransaction(transactionData);

      mockRepository.create.mockReturnValue(savedTransaction);
      mockRepository.save.mockResolvedValue(savedTransaction);

      const result = await service.create(transactionData);

      expect(result).toEqual(savedTransaction);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.create).toHaveBeenCalledWith(transactionData);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.save).toHaveBeenCalledWith(savedTransaction);
    });

    it('should throw BadRequestException for invalid data', async () => {
      await expect(service.create({} as Partial<Transaction>)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBulk', () => {
    it('should create multiple transactions', async () => {
      const transactionsData = [
        {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          hash: 'a'.repeat(64),
          sourceAccount: 'G'.repeat(56),
          amount: 100.5,
          transactionType: 'payment',
          stellarCreatedAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          hash: 'b'.repeat(64),
          sourceAccount: 'G'.repeat(56),
          amount: 200.5,
          transactionType: 'payment',
          stellarCreatedAt: new Date('2024-01-16T10:30:00Z'),
        },
      ];
      const savedTransactions = createTestTransactionList(2);

      mockRepository.create.mockReturnValue(savedTransactions[0] as any);
      mockRepository.save.mockResolvedValue(savedTransactions as any);

      const result = await service.createBulk(transactionsData);

      expect(result).toEqual(savedTransactions);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const existingTransaction = createTestTransaction();
      const updateData = { amount: 200 };
      const updatedTransaction = { ...existingTransaction, ...updateData };

      mockRepository.findOne.mockResolvedValue(existingTransaction);
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedTransaction);

      const result = await service.update('123e4567-e89b-42d3-a456-426614174001', updateData);

      expect(result.amount).toBe(200);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('123e4567-e89b-42d3-a456-426614174001', { amount: 200 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      const transaction = createTestTransaction();
      mockRepository.findOne.mockResolvedValue(transaction);
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete('123e4567-e89b-42d3-a456-426614174001');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('123e4567-e89b-42d3-a456-426614174001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('syncFromStellar', () => {
    it('should sync transactions from Stellar', async () => {
      const stellarTransactions = [
        {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          hash: 'a'.repeat(64),
          sourceAccount: 'G'.repeat(56),
          amount: 100.5,
          transactionType: 'payment',
          stellarCreatedAt: new Date('2024-01-15T10:30:00Z'),
        },
      ];
      const savedTransaction = createTestTransaction(stellarTransactions[0]);

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(savedTransaction);
      mockRepository.save.mockResolvedValue(savedTransaction);

      const result = await service.syncFromStellar(stellarTransactions);

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip existing transactions', async () => {
      const stellarTransactions = [
        {
          userId: '123e4567-e89b-42d3-a456-426614174000',
          hash: 'a'.repeat(64),
          sourceAccount: 'G'.repeat(56),
          amount: 100.5,
          transactionType: 'payment',
          stellarCreatedAt: new Date('2024-01-15T10:30:00Z'),
        },
      ];
      const existingTransaction = createTestTransaction(stellarTransactions[0]);

      mockRepository.findOne.mockResolvedValue(existingTransaction);

      const result = await service.syncFromStellar(stellarTransactions);

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });
});
