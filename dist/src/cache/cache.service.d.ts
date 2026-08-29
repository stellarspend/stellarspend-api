import { OnModuleDestroy } from '@nestjs/common';
export declare class CacheService implements OnModuleDestroy {
    private readonly redis;
    constructor();
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
    del(key: string): Promise<void>;
    delByPattern(pattern: string): Promise<void>;
    isHealthy(): Promise<boolean>;
    onModuleDestroy(): Promise<void>;
    status(): {
        module: string;
        status: string;
    };
}
