import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsMilestoneService } from './notifications.milestone.service';
import { Notification } from './notifications.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsMilestoneService],
  exports: [NotificationsService, NotificationsMilestoneService],
})
export class NotificationsModule {}
