import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { LoggingService } from '../logging/logging.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let loggingService: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: LoggingService,
          useValue: {
            info: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return status', () => {
    expect(service.status()).toEqual({ module: 'notification', status: 'ready' });
  });

  it('should log when send is called', async () => {
    await service.send('user-1', 'GOAL_COMPLETE', 'My Goal');
    expect(loggingService.info).toHaveBeenCalledWith(
      'Notification sent to user-1: [GOAL_COMPLETE] My Goal',
      'NotificationService',
    );
  });
});
