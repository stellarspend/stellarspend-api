import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

/** Provides the notification application capability. */
@Injectable()
export class NotificationService {
  constructor(private readonly loggingService: LoggingService) {}

  /** Returns a stable service health payload for this capability. */
  status(): { module: string; status: string } { 
    return { module: 'notification', status: 'ready' }; 
  }

  async send(userId: string, type: string, payload: string): Promise<void> {
    this.loggingService.info(`Notification sent to ${userId}: [${type}] ${payload}`, 'NotificationService');
  }
}
