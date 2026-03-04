/**
 * AnalyticsProcessor
 *
 * BullMQ worker that processes background jobs from the analytics-recalculation queue.
 * Handles two job types:
 *   - recalculate-analytics : re-aggregates spending analytics for a user (or globally)
 *   - bulk-sync             : triggers a Stellar transaction bulk-sync for a user
 *
 * Retry policy (defined in QueueModule):
 *   3 attempts with exponential backoff starting at 1 s.
 */

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';
import {
  ANALYTICS_RECALCULATION_QUEUE,
  JOB_RECALCULATE_ANALYTICS,
  JOB_BULK_SYNC,
} from '../../queue/queue.constants';

/** Payload shape for recalculate-analytics jobs. */
export interface RecalculateAnalyticsJobData {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/** Payload shape for bulk-sync jobs. */
export interface BulkSyncJobData {
  userId?: string;
  /** ISO date string; only sync transactions created after this timestamp. */
  since?: string;
}

@Processor(ANALYTICS_RECALCULATION_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  /**
   * Entry point for all jobs in the analytics-recalculation queue.
   * BullMQ calls this method for every dequeued job and will retry on failure
   * according to the backoff settings configured in QueueModule.
   */
  async process(job: Job): Promise<unknown> {
    this.logger.log(
      `Processing job [${job.name}] id=${job.id} attempt=${job.attemptsMade + 1}/${job.opts.attempts ?? 1}`,
    );

    switch (job.name) {
      case JOB_RECALCULATE_ANALYTICS: {
        const { userId, startDate, endDate } =
          job.data as RecalculateAnalyticsJobData;

        const result = await this.analyticsService.getSummary({
          userId,
          startDate,
          endDate,
        });

        this.logger.log(
          `[${JOB_RECALCULATE_ANALYTICS}] done — userId=${userId ?? 'all'} ` +
            `totalTransactions=${result.totalTransactions} totalAmount=${result.totalAmount}`,
        );
        return result;
      }

      case JOB_BULK_SYNC: {
        const { userId, since } = job.data as BulkSyncJobData;
        this.logger.log(
          `[${JOB_BULK_SYNC}] syncing — userId=${userId ?? 'all'} since=${since ?? 'beginning'}`,
        );
        // TODO: replace with real Stellar horizon / Soroban sync logic
        return { synced: true, userId, since };
      }

      default:
        this.logger.warn(`Unknown job name "${job.name}" — skipping`);
        return null;
    }
  }

  /** Fires after BullMQ marks a job as completed. */
  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job [${job.name}] id=${job.id} completed successfully`);
  }

  /** Fires each time a job attempt fails. */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job [${job.name}] id=${job.id} FAILED ` +
        `(attempt ${job.attemptsMade}/${job.opts.attempts ?? 1}): ${error.message}`,
      error.stack,
    );
  }

  /** Fires when BullMQ detects a stalled job (worker crashed mid-processing). */
  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job id=${jobId} stalled — will be retried automatically`);
  }
}
