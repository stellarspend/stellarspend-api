import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { LoggingModule } from '../logging/logging.module';

/** Registers the notification feature. */
@Module({
  imports: [LoggingModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
