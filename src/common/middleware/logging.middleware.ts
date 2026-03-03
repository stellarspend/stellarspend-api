import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const timestamp = new Date().toISOString();
    const { method, url } = req;
    
    this.logger.log(`[${timestamp}] ${method} ${url}`);
    
    next();
  }
}
