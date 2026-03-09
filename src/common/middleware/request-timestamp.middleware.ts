import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestWithTimestamp extends Request {
  requestTimestamp?: string;
}

@Injectable()
export class RequestTimestampMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestTimestampMiddleware.name);

  use(req: RequestWithTimestamp, res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    req.requestTimestamp = timestamp;
    
    this.logger.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    next();
  }
}
