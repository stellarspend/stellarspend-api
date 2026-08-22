import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { WalletController } from './wallet.controller';
import { WalletEntity } from './entities/wallet.entity';
import { WalletService } from './wallet.service';

/** Registers the wallet feature. */
@Module({
  imports: [BlockchainModule, TypeOrmModule.forFeature([WalletEntity, TransactionEntity])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
