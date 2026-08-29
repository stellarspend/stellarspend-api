import { CacheService } from '../cache/cache.service';
export declare class HealthService {
    private readonly cacheService;
    constructor(cacheService: CacheService);
    check(): Promise<{
        status: string;
        redis: 'ok' | 'degraded';
    }>;
}
