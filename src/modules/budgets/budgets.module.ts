import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { Transaction } from '../transactions/transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Budgets Module
 * Provides budget management functionality
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    NotificationsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
