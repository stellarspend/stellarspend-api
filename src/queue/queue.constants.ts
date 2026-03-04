/**
 * Queue and job name constants shared across queue producers and processors.
 */

/** BullMQ queue that handles analytics and bulk sync background work. */
export const ANALYTICS_RECALCULATION_QUEUE = 'analytics-recalculation';

/** Job: recalculate aggregated analytics for a user or globally. */
export const JOB_RECALCULATE_ANALYTICS = 'recalculate-analytics';

/** Job: bulk-sync Stellar transactions for a user or globally. */
export const JOB_BULK_SYNC = 'bulk-sync';
