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
      walletRepository.findOne.mockResolvedValue(existingWallet);

      const result = await service.linkWallet(userId, validPublicKey);

      expect(result).toEqual(existingWallet);
    });

    it('throws ConflictException when user already has a wallet', async () => {
      walletRepository.findOne
        .mockResolvedValueOnce(null) // no existing public key
        .mockResolvedValueOnce({ id: 'wallet-2', userId, publicKey: 'GDIFFERENT...', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() }); // user has wallet

      await expect(service.linkWallet(userId, validPublicKey)).rejects.toThrow(ConflictException);
    });
  });

  describe('getBalances', () => {
    const userId = 'user-123';
    const mockWallet = { id: 'wallet-1', userId, publicKey: 'GABC123...', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };
    const mockBalances = [{ asset: 'XLM', balance: '100' }];

    it('returns balances for linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.getBalances.mockResolvedValue(mockBalances);

      const result = await service.getBalances(userId);

      expect(result).toEqual(mockBalances);
      expect(blockchainService.getBalances).toHaveBeenCalledWith(mockWallet.publicKey);
    });

    it('throws NotFoundException when user has no linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      await expect(service.getBalances(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setSpendingLimit', () => {
    const userId = 'user-123';
    const mockWallet = { id: 'wallet-1', userId, publicKey: 'GABC123...', spendingLimitXlm: null, spendingLimitUsdc: null, createdAt: new Date() };

    it('sets XLM spending limit', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockReturnValue('200');
      walletRepository.save.mockResolvedValue({ ...mockWallet, spendingLimitXlm: '200', createdAt: new Date() });

      const result = await service.setSpendingLimit(userId, 'XLM', '200');

      expect(result.spendingLimitXlm).toBe('200');
      expect(blockchainService.validatePositiveAmount).toHaveBeenCalledWith('200');
    });

    it('sets USDC spending limit', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockReturnValue('500');
      walletRepository.save.mockResolvedValue({ ...mockWallet, spendingLimitUsdc: '500', createdAt: new Date() });

      const result = await service.setSpendingLimit(userId, 'USDC', '500');

      expect(result.spendingLimitUsdc).toBe('500');
    });

    it('sets EURC spending limit (uses USDC column)', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockReturnValue('300');
      walletRepository.save.mockResolvedValue({ ...mockWallet, spendingLimitUsdc: '300', createdAt: new Date() });

      const result = await service.setSpendingLimit(userId, 'EURC', '300');

      expect(result.spendingLimitUsdc).toBe('300');
    });

    it('throws NotFoundException when user has no linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      await expect(service.setSpendingLimit(userId, 'XLM', '200')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for invalid amount', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockImplementation(() => {
        throw new BadRequestException('Invalid amount');
      });

      await expect(service.setSpendingLimit(userId, 'XLM', 'invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkSpendingLimit', () => {
    const userId = 'user-123';
    const mockWallet = { id: 'wallet-1', userId, publicKey: 'GABC123...', spendingLimitXlm: '1000', spendingLimitUsdc: '500', createdAt: new Date() };

    it('allows transaction when under limit', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockReturnValue('50');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '200' }),
      };
      transactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.checkSpendingLimit(userId, 'XLM', '50');

      expect(result.allowed).toBe(true);
      expect(parseFloat(result.remaining)).toBeGreaterThan(0);
    });

    it('denies transaction when over limit', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockReturnValue('900');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '200' }),
      };
      transactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.checkSpendingLimit(userId, 'XLM', '900');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe('0.000000000000');
    });

    it('allows unlimited when no limit is set', async () => {
      const noLimitWallet = { ...mockWallet, spendingLimitXlm: null, createdAt: new Date() };
      walletRepository.findOne.mockResolvedValue(noLimitWallet);
      blockchainService.validatePositiveAmount.mockReturnValue('1000');

      const result = await service.checkSpendingLimit(userId, 'XLM', '1000');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe('unlimited');
    });

    it('throws NotFoundException when user has no linked wallet', async () => {
      walletRepository.findOne.mockResolvedValue(null);

      await expect(service.checkSpendingLimit(userId, 'XLM', '50')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for unsupported asset', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);

      await expect(service.checkSpendingLimit(userId, 'BTC', '50')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid amount', async () => {
      walletRepository.findOne.mockResolvedValue(mockWallet);
      blockchainService.validatePositiveAmount.mockImplementation(() => {
        throw new BadRequestException('Invalid amount');
      });

      await expect(service.checkSpendingLimit(userId, 'XLM', 'invalid')).rejects.toThrow(BadRequestException);
    });
  });
});
