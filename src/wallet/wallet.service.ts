import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { WalletEntity } from './entities/wallet.entity';

/** Provides the wallet application capability. */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    private readonly blockchainService: BlockchainService,
  ) {}

  /** Returns a stable service health payload for this capability. */
  status(): { module: string; status: string } {
    return { module: 'wallet', status: 'ready' };
  }

  /**
   * Links a Stellar public key to a user account.
   * @param userId - The user's unique identifier
   * @param publicKey - The Stellar public key to link (56 characters, starts with G)
   * @returns The created wallet record
   * @throws BadRequestException if the public key format is invalid
   * @throws ConflictException if the key is already linked to another user
   */
  async linkWallet(userId: string, publicKey: string): Promise<WalletEntity> {
    // Validate public key format (reuse BlockchainService pattern)
    if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
      throw new BadRequestException('Invalid Stellar public key');
    }

    // Check if public key is already linked to another user
    const existingWallet = await this.walletRepository.findOne({ where: { publicKey } });
    if (existingWallet) {
      if (existingWallet.userId === userId) {
        return existingWallet;
      }
      throw new ConflictException('Public key is already linked to another user');
    }

    // Check if user already has a wallet linked
    const userWallet = await this.walletRepository.findOne({ where: { userId } });
    if (userWallet) {
      throw new ConflictException('User already has a wallet linked');
    }

    // Create new wallet
    const wallet = this.walletRepository.create({ userId, publicKey });
    return await this.walletRepository.save(wallet);
  }

  /**
   * Fetches live Stellar balances for the user's linked wallet.
   * @param userId - The user's unique identifier
   * @returns Array of balance objects from Horizon
   * @throws NotFoundException if the user has no linked wallet
   */
  async getBalances(userId: string): Promise<unknown[]> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('No wallet linked to this user');
    }

    return await this.blockchainService.getBalances(wallet.publicKey);
  }

  /**
   * Sets the weekly spending limit for a specific asset.
   * @param userId - The user's unique identifier
   * @param asset - The asset code (XLM, USDC, or EURC)
   * @param limit - The spending limit as a decimal string
   * @returns The updated wallet record
   * @throws BadRequestException if the amount format is invalid
   * @throws NotFoundException if the user has no linked wallet
   */
  async setSpendingLimit(userId: string, asset: 'XLM' | 'USDC' | 'EURC', limit: string): Promise<WalletEntity> {
    // Validate amount format (reuse BlockchainService pattern)
    const validatedLimit = this.blockchainService.validatePositiveAmount(limit);

    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('No wallet linked to this user');
    }

    // Update the appropriate spending limit column
    switch (asset) {
      case 'XLM':
        wallet.spendingLimitXlm = validatedLimit;
        break;
      case 'USDC':
        wallet.spendingLimitUsdc = validatedLimit;
        break;
      case 'EURC':
        // EURC uses the same limit as USDC for now (can be extended later)
        wallet.spendingLimitUsdc = validatedLimit;
        break;
      default:
        throw new BadRequestException('Unsupported asset');
    }

    return await this.walletRepository.save(wallet);
  }

  /**
   * Checks if a spending amount is allowed based on the current week's transactions.
   * @param userId - The user's unique identifier
   * @param asset - The asset code to check
   * @param amount - The amount to check as a decimal string
   * @returns Object with allowed flag and remaining headroom
   * @throws BadRequestException if the amount format is invalid
   * @throws NotFoundException if the user has no linked wallet
   */
  async checkSpendingLimit(
    userId: string,
    asset: string,
    amount: string,
  ): Promise<{ allowed: boolean; remaining: string }> {
    // Validate amount format
    const validatedAmount = this.blockchainService.validatePositiveAmount(amount);

    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('No wallet linked to this user');
    }

    // Get the spending limit for the asset
    let limit: string | null = null;
    if (asset === 'XLM') {
      limit = wallet.spendingLimitXlm;
    } else if (asset === 'USDC' || asset === 'EURC') {
      limit = wallet.spendingLimitUsdc;
    } else {
      throw new BadRequestException('Unsupported asset');
    }

    // If no limit is set, allow the transaction
    if (!limit) {
      return { allowed: true, remaining: 'unlimited' };
    }

    // Calculate the start of the current calendar week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Sum all transactions for this user and asset in the current week
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.asset = :asset', { asset })
      .andWhere('transaction.createdAt >= :weekStart', { weekStart })
      .getRawOne();

    const spent = result.total ? result.total : '0';
    const spentNum = parseFloat(spent);
    const limitNum = parseFloat(limit);
    const amountNum = parseFloat(validatedAmount);

    const remaining = Math.max(0, limitNum - spentNum - amountNum).toFixed(12);
    const allowed = spentNum + amountNum <= limitNum;

    return { allowed, remaining };
  }
}
