import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class HealthService {
  constructor(private readonly cacheService: CacheService) {}

  async check(): Promise<{ status: string; redis: 'ok' | 'degraded' }> {
    const redisOk = await this.cacheService.isHealthy();
    return {
      status: redisOk ? 'ok' : 'degraded',
      redis: redisOk ? 'ok' : 'degraded',
    };
  }
}