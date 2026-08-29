import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

/** Provides liveness and readiness probes. */
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  /** Returns a liveness response without requiring a database. */
  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  /** Returns readiness including Redis connectivity. */
  @Get()
  check() {
    return this.service.check();
  }
}