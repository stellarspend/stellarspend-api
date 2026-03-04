import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsMilestoneService } from './notifications.milestone.service';
import { Notification } from './notifications.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService, NotificationsMilestoneService],
  exports: [NotificationsGateway, NotificationsService, NotificationsMilestoneService],
})
export class NotificationsModule {}
