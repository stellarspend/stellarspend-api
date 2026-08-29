import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { CacheModule } from '../cache/cache.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

/** Registers the wallet feature. */
@Module({
  imports: [CacheModule, BlockchainModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}