import { HealthService } from './health.service';
/** Provides liveness and readiness probes. */
export declare class HealthController {
    private readonly service;
    constructor(service: HealthService);
    /** Returns a liveness response without requiring a database. */
    live(): {
        status: string;
    };
    /** Returns readiness including Redis connectivity. */
    check(): Promise<{
        status: string;
        redis: "ok" | "degraded";
    }>;
}
