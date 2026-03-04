/**
 * QueueModule
 *
 * Configures BullMQ with Redis and registers shared queues.
 * Import this module in any feature module that needs to produce or consume jobs.
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ANALYTICS_RECALCULATION_QUEUE } from './queue.constants';

@Module({
  imports: [
    /**
     * Root BullMQ configuration — reads Redis connection from environment variables.
     * Falls back to localhost:6379 for local development.
     */
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
      }),
    }),

    /**
     * Register the analytics/bulk-sync queue with default retry behaviour.
     * - 3 attempts with exponential backoff (1s, 2s, 4s)
     * - Completed jobs are removed from Redis to keep memory low
     * - Failed jobs are retained for inspection / manual replay
     */
    BullModule.registerQueue({
      name: ANALYTICS_RECALCULATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
