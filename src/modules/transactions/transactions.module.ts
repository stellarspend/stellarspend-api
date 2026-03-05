import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { User } from '../users/user.entity';
import { Transaction } from './transaction.entity';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Transaction]),
    NotificationsModule,
    QueueModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule { }
