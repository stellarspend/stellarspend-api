import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
import { SavingsGoalEntity } from './entities/savings-goal.entity';
import { NotificationModule } from '../notification/notification.module';

/** Registers the savings feature. */
@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsGoalEntity]),
    NotificationModule,
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
