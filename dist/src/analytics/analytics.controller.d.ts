import { AnalyticsService } from './analytics.service';
/** Exposes the analytics API surface. */
export declare class AnalyticsController {
    private readonly service;
    constructor(service: AnalyticsService);
    status(): {
        module: string;
        status: string;
    };
    getTrend(userId: string, asset: string, weeks?: string): Promise<import("./analytics.service").SpendingTrendPoint[]>;
}
