import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from '../transactions/entities/transaction.entity';

/** Registers the wallet feature: link, balance, and spending-limit management. */
@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, TransactionEntity]),
    BlockchainModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'development-only-stellarspend-secret-32',
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
