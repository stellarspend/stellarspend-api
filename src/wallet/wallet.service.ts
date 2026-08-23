import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { WalletEntity } from './entities/wallet.entity';
/** Provides wallet management and balance fetching with spending limit enforcement. */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity) private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity) private readonly transactionRepo: Repository<TransactionEntity>,
    private readonly blockchain: BlockchainService,
  ) {}
  /** Returns a stable service health payload for this capability. */
  status(): { module: string; status: string } { return { module: 'wallet', status: 'ready' }; }
  /** Links a Stellar public key to a user account. */
  async linkWallet(userId: string, publicKey: string): Promise<WalletEntity> {
    if (!/^G[A-Z2-7]{55}$/.test(publicKey)) throw new BadRequestException('Invalid Stellar public key');
    const existingKey = await this.walletRepo.findOne({ where: { publicKey } });
    if (existingKey) throw new ConflictException('Public key already linked to another user');
    const wallet = this.walletRepo.create({ userId, publicKey });
    return await this.walletRepo.save(wallet);
  }
  /** Fetches live Stellar balances for the user's linked wallet. */
  async getBalances(userId: string): Promise<unknown[]> {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('No wallet linked to this user');
    return await this.blockchain.getBalances(wallet.publicKey);
  }
  /** Sets the weekly spending limit for a specific asset. */
  async setSpendingLimit(userId: string, asset: 'XLM' | 'USDC' | 'EURC', limit: string): Promise<WalletEntity> {
    const validatedLimit = this.blockchain.validatePositiveAmount(limit);
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('No wallet linked to this user');
    if (asset === 'XLM') wallet.spendingLimitXlm = validatedLimit;
    else if (asset === 'USDC' || asset === 'EURC') wallet.spendingLimitUsdc = validatedLimit;
    else throw new BadRequestException('Unsupported asset for spending limit');
    return await this.walletRepo.save(wallet);
  }
  /** Checks if a transaction amount is within the weekly spending limit. */
  async checkSpendingLimit(userId: string, asset: string, amount: string): Promise<{ allowed: boolean; remaining: string }> {
    const validatedAmount = this.blockchain.validatePositiveAmount(amount);
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('No wallet linked to this user');
    let limit: string | null;
    if (asset === 'XLM') limit = wallet.spendingLimitXlm;
    else if (asset === 'USDC' || asset === 'EURC') limit = wallet.spendingLimitUsdc;
    else throw new BadRequestException('Unsupported asset for spending limit');
    if (!limit) return { allowed: true, remaining: 'unlimited' };
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    const weeklySpendResult = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.asset = :asset', { asset })
      .andWhere('transaction.createdAt >= :weekStart', { weekStart })
      .getRawOne();
    const weeklySpend = weeklySpendResult?.total || '0';
    const remaining = (Number(limit) - Number(weeklySpend)).toString();
    const allowed = Number(remaining) >= Number(validatedAmount);
    return { allowed, remaining: allowed ? remaining : '0' };
  }
}
