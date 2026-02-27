import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Wallet } from './wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async createWallet(publicKey: string, userId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({ publicKey, userId });
    const savedWallet = await this.walletRepository.save(wallet);
    
    // Invalidate cache for this user
    await this.invalidateUserCache(userId);
    
    return savedWallet;
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    const cacheKey = `wallets:user:${userId}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<Wallet[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // If not in cache, fetch from database
    const wallets = await this.walletRepository.find({ where: { userId } });
    
    // Store in cache
    await this.cacheManager.set(cacheKey, wallets);
    
    return wallets;
  }

  async findByPublicKey(publicKey: string): Promise<Wallet | null> {
    const cacheKey = `wallet:publicKey:${publicKey}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<Wallet>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // If not in cache, fetch from database
    const wallet = await this.walletRepository.findOne({ where: { publicKey } });
    
    // Store in cache if found
    if (wallet) {
      await this.cacheManager.set(cacheKey, wallet);
    }
    
    return wallet;
  }

  async getWalletBalance(publicKey: string): Promise<{ balance: number; publicKey: string }> {
    const cacheKey = `wallet:balance:${publicKey}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<{ balance: number; publicKey: string }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Simulate balance calculation (in real app, this would query blockchain)
    const wallet = await this.findByPublicKey(publicKey);
    const balance = wallet ? Math.random() * 1000 : 0;
    
    const result = { balance, publicKey };
    
    // Store in cache
    await this.cacheManager.set(cacheKey, result);
    
    return result;
  }

  async getWalletAnalytics(userId: string): Promise<{ totalWallets: number; userId: string }> {
    const cacheKey = `wallet:analytics:${userId}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<{ totalWallets: number; userId: string }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Calculate analytics
    const wallets = await this.findByUserId(userId);
    const result = { totalWallets: wallets.length, userId };
    
    // Store in cache
    await this.cacheManager.set(cacheKey, result);
    
    return result;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    // Invalidate user-specific caches
    await this.cacheManager.del(`wallets:user:${userId}`);
    await this.cacheManager.del(`wallet:analytics:${userId}`);
  }

  getStatus() {
    return { module: 'Wallet', status: 'Working', caching: 'Enabled' };
  }
}