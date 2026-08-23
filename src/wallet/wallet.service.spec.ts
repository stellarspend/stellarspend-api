import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WalletService } from './wallet.service';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { BlockchainService } from '../blockchain/blockchain.service';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepository: jest.Mocked<Repository<WalletEntity>>;
  let transactionRepository: jest.Mocked<Repository<TransactionEntity>>;
  let blockchainService: jest.Mocked<BlockchainService>;

  beforeEach(() => {
    walletRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<WalletEntity>>;

    transactionRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<TransactionEntity>>;

    blockchainService = {
      getBalances: jest.fn(),
      validatePositiveAmount: jest.fn(),
    } as unknown as jest.Mocked<BlockchainService>;

    service = new WalletService(walletRepository, transactionRepository, blockchainService);
  });

  describe('status', () => {
    it('returns module status', () => {
      expect(service.status()).toEqual({ module: 'wallet', status: 'ready' });
    });
  });

  describe('linkWallet', () => {
    const validPublicKey = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const userId = 'user-123';

    it('links a valid public key to a user', async () => {
      walletRepository.findOne.mockResolvedValue(null);
      const mockWallet = { id: 'wallet-1', userId, publicKey: validPublicKey, spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.create.mockReturnValue(mockWallet);
      walletRepository.save.mockResolvedValue(mockWallet);

      const result = await service.linkWallet(userId, validPublicKey);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findOne).toHaveBeenCalledWith({ where: { publicKey: validPublicKey } });
      expect(walletRepository.create).toHaveBeenCalledWith({ userId, publicKey: validPublicKey });
    });

    it('throws BadRequestException for invalid public key format', async () => {
      await expect(service.linkWallet(userId, 'invalid-key')).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when public key already linked to another user', async () => {
      const existingWallet = { id: 'wallet-1', userId: 'other-user', publicKey: validPublicKey, spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(existingWallet);

      await expect(service.linkWallet(userId, validPublicKey)).rejects.toThrow(ConflictException);
    });

    it('returns existing wallet when user links same key again', async () => {
      const existingWallet = { id: 'wallet-1', userId, publicKey: validPublicKey, spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(null);
      walletRepository.create.mockReturnValue(existingWallet);
      walletRepository.save.mockResolvedValue(existingWallet);

      const result = await service.linkWallet(userId, validPublicKey);
      expect(result).toEqual(existingWallet);
    });

    it('throws ConflictException when user already has a wallet', async () => {
      const existingWallet = { id: 'wallet-1', userId, publicKey: validPublicKey, spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(existingWallet);

      await expect(service.linkWallet(userId, validPublicKey)).rejects.toThrow(ConflictException);
    });
  });

  describe('getBalances', () => {
    it('returns balances for linked wallet', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      const mockBalances = [{ asset: 'XLM', balance: '100' }];
      blockchainService.getBalances.mockResolvedValue(mockBalances);

      const result = await service.getBalances(userId);

      expect(result).toEqual(mockBalances);
      expect(blockchainService.getBalances).toHaveBeenCalledWith(wallet.publicKey);
    });

    it('throws NotFoundException when user has no linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      await expect(service.getBalances('user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setSpendingLimit', () => {
    it('sets XLM spending limit', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockReturnValue('100');
      const updatedWallet = { ...wallet, spendingLimitXlm: '100' };
      walletRepository.save.mockResolvedValue(updatedWallet);

      const result = await service.setSpendingLimit(userId, 'XLM', '100');

      expect(result.spendingLimitXlm).toBe('100');
      expect(blockchainService.validatePositiveAmount).toHaveBeenCalledWith('100');
    });

    it('sets USDC spending limit', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockReturnValue('50');
      const updatedWallet = { ...wallet, spendingLimitUsdc: '50' };
      walletRepository.save.mockResolvedValue(updatedWallet);

      const result = await service.setSpendingLimit(userId, 'USDC', '50');

      expect(result.spendingLimitUsdc).toBe('50');
    });

    it('sets EURC spending limit (uses USDC column)', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockReturnValue('75');
      const updatedWallet = { ...wallet, spendingLimitUsdc: '75' };
      walletRepository.save.mockResolvedValue(updatedWallet);

      const result = await service.setSpendingLimit(userId, 'EURC', '75');

      expect(result.spendingLimitUsdc).toBe('75');
    });

    it('throws NotFoundException when user has no linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      await expect(service.setSpendingLimit('user-123', 'XLM', '100')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for invalid amount', async () => {
      const wallet = { id: 'wallet-1', userId: 'user-123', publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockImplementation(() => {
        throw new BadRequestException('Invalid amount');
      });

      await expect(service.setSpendingLimit('user-123', 'XLM', 'invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkSpendingLimit', () => {
    it('allows transaction when under limit', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: '100', spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockReturnValue('50');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '25' }),
      };
      transactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.checkSpendingLimit(userId, 'XLM', '50');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe('75');
    });

    it('denies transaction when over limit', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: '100', spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockReturnValue('50');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '75' }),
      };
      transactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.checkSpendingLimit(userId, 'XLM', '50');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe('0');
    });

    it('allows unlimited when no limit is set', async () => {
      const userId = 'user-123';
      const wallet = { id: 'wallet-1', userId, publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockReturnValue('50');

      const result = await service.checkSpendingLimit(userId, 'XLM', '50');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe('unlimited');
    });

    it('throws NotFoundException when user has no linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      await expect(service.checkSpendingLimit('user-123', 'XLM', '50')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for unsupported asset', async () => {
      const wallet = { id: 'wallet-1', userId: 'user-123', publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);

      await expect(service.checkSpendingLimit('user-123', 'BTC', '50')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid amount', async () => {
      const wallet = { id: 'wallet-1', userId: 'user-123', publicKey: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', spendingLimitXlm: '100', spendingLimitUsdc: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(wallet);
      blockchainService.validatePositiveAmount.mockImplementation(() => {
        throw new BadRequestException('Invalid amount');
      });

      await expect(service.checkSpendingLimit('user-123', 'XLM', 'invalid')).rejects.toThrow(BadRequestException);
    });
  });
});
