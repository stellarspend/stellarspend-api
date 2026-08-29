import { BlockchainService } from '../blockchain/blockchain.service';
import { CacheService } from '../cache/cache.service';
export declare class WalletService {
    private readonly blockchainService;
    private readonly cacheService;
    constructor(blockchainService: BlockchainService, cacheService: CacheService);
    status(): {
        module: string;
        status: string;
    };
    getBalances(publicKey: string): Promise<unknown[]>;
}
