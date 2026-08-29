import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CacheService } from '../cache/cache.service';

const BALANCES_TTL_SECONDS = 30;

@Injectable()
export class WalletService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly cacheService: CacheService,
  ) {}

  status(): { module: string; status: string } {
    return { module: 'wallet', status: 'ready' };
  }

  async getBalances(publicKey: string): Promise<unknown[]> {
    const cacheKey = `wallet:balances:${publicKey}`;

    const cached = await this.cacheService.get<unknown[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const balances = await this.blockchainService.getBalances(publicKey);
    await this.cacheService.set(cacheKey, balances, BALANCES_TTL_SECONDS);
    return balances;
  }
}