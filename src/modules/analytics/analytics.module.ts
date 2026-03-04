import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
