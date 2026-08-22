import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';

/** Supported assets for spending-limit enforcement. */
export type SpendingLimitAsset = 'XLM' | 'USDC' | 'EURC';

/** Shape returned by checkSpendingLimit. */
export interface SpendingLimitCheck {
  allowed: boolean;
  remaining: string;
}

/** Maps a SpendingLimitAsset to the corresponding WalletEntity column. */
const LIMIT_COLUMN: Record<SpendingLimitAsset, keyof WalletEntity> = {
  XLM: 'spendingLimitXlm',
  USDC: 'spendingLimitUsdc',
  EURC: 'spendingLimitEurc',
};

/** Provides real wallet operations: link, balance lookup, and spending-limit management. */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    private readonly blockchain: BlockchainService,
    private readonly dataSource: DataSource,
  ) {}

  // ── Link ──────────────────────────────────────────────────────────────────

  /**
   * Links a Stellar public key to the authenticated user.
   * Throws BadRequestException for an invalid key format.
   * Throws ConflictException if the key is already linked to any user.
   */
  async linkWallet(userId: string, publicKey: string): Promise<WalletEntity> {
    if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
      throw new BadRequestException('Invalid Stellar public key');
    }

    // Check whether the key is already claimed by another user
    const existing = await this.walletRepo.findOne({ where: { publicKey } });
    if (existing) {
      if (existing.userId === userId) {
        // Idempotent — return the existing record
        return existing;
      }
      throw new ConflictException('Public key is already linked to another account');
    }

    const wallet = this.walletRepo.create({ userId, publicKey });
    return this.walletRepo.save(wallet);
  }

  // ── Balances ──────────────────────────────────────────────────────────────

  /**
   * Returns live Stellar balances for the user's linked public key.
   * Throws NotFoundException when no wallet is linked.
   */
  async getBalances(userId: string): Promise<unknown[]> {
    const wallet = await this.requireWallet(userId);
    return this.blockchain.getBalances(wallet.publicKey);
  }

  // ── Spending limits ───────────────────────────────────────────────────────

  /**
   * Stores a per-asset weekly spending limit for the user.
   * Throws BadRequestException for non-positive amounts.
   */
  async setSpendingLimit(
    userId: string,
    asset: SpendingLimitAsset,
    limit: string,
  ): Promise<WalletEntity> {
    if (!/^\d+(\.\d+)?$/.test(limit) || Number(limit) <= 0) {
      throw new BadRequestException('Limit must be a positive number');
    }

    const wallet = await this.requireWallet(userId);
    const column = LIMIT_COLUMN[asset];
    (wallet as unknown as Record<string, unknown>)[column] = limit;
    return this.walletRepo.save(wallet);
  }

  /**
   * Checks whether a proposed outgoing payment fits within the current-week
   * spending limit for the given asset.
   *
   * Returns { allowed: true/false, remaining: "<headroom>" }.
   * If no limit is configured for the asset, allowed is always true and
   * remaining is "unlimited".
   */
  async checkSpendingLimit(
    userId: string,
    asset: string,
    amount: string,
  ): Promise<SpendingLimitCheck> {
    const normalised = asset.toUpperCase() as SpendingLimitAsset;
    if (!LIMIT_COLUMN[normalised]) {
      throw new BadRequestException(`Unsupported asset: ${asset}`);
    }
    if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const wallet = await this.requireWallet(userId);
    const limitRaw = wallet[LIMIT_COLUMN[normalised]] as string | null;

    if (limitRaw === null || limitRaw === undefined) {
      return { allowed: true, remaining: 'unlimited' };
    }

    // Sum outgoing transactions for the current calendar week (Mon 00:00 UTC)
    const weekStart = this.currentWeekStart();
    const { sum } = (await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'sum')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.asset = :asset', { asset: normalised })
      .andWhere('tx.createdAt >= :weekStart', { weekStart })
      .getRawOne()) as { sum: string };

    const spent = Number(sum ?? '0');
    const limit = Number(limitRaw);
    const proposed = Number(amount);
    const remaining = Math.max(0, limit - spent);
    const allowed = spent + proposed <= limit;

    return {
      allowed,
      remaining: remaining.toFixed(12),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Fetches the wallet for a user or throws NotFoundException. */
  private async requireWallet(userId: string): Promise<WalletEntity> {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('No wallet linked for this user');
    return wallet;
  }

  /** Returns the start of the current ISO week (Monday 00:00 UTC). */
  private currentWeekStart(): Date {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sun … 6 = Sat
    const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  }
}
