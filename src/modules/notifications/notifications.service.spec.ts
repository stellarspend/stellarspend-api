import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { Notification } from './notifications.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<Notification>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a notification', async () => {
      const createNotificationDto: CreateNotificationDto = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'info',
        category: 'test',
      };

      const mockNotification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId: createNotificationDto.userId,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        type: createNotificationDto.type || 'info',
        isRead: false,
        category: createNotificationDto.category || 'test',
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createNotificationDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createNotificationDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('findByUserId', () => {
    it('should return notifications for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockNotifications: Notification[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          userId,
          title: 'Notification 1',
          message: 'Message 1',
          type: 'info' as const,
          isRead: false,
          category: 'test',
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('findUnreadByUserId', () => {
    it('should return unread notifications for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockNotifications: Notification[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          userId,
          title: 'Unread Notification',
          message: 'Message',
          type: 'info' as const,
          isRead: false,
          category: 'test',
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.findUnreadByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockNotification: Notification = {
        id: notificationId,
        userId,
        title: 'Test',
        message: 'Message',
        type: 'info' as const,
        isRead: false,
        category: 'test',
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockNotification);
      mockRepository.save.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await service.markAsRead(notificationId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw error if notification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent', 'userId')).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { userId, isRead: false },
        { isRead: true }
      );
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174001';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockNotification: Notification = {
        id: notificationId,
        userId,
        title: 'Test',
        message: 'Message',
        type: 'info' as const,
        isRead: false,
        category: 'test',
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockNotification);
      mockRepository.remove.mockResolvedValue(mockNotification);

      await service.delete(notificationId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw error if notification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent', 'userId')).rejects.toThrow('Notification not found');
    });
  });

  describe('createSavingsMilestoneNotification', () => {
    it('should create a savings milestone notification', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const milestone = '$1,000 Achievement';
      const amount = 1000;

      const mockNotification: Notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
        title: 'Savings Milestone Achieved! 🎉',
        message: `Congratulations! You've reached your ${milestone} savings goal of $${amount.toFixed(2)}. Keep up the great work!`,
        type: 'success',
        isRead: false,
        category: 'savings-milestone',
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createSavingsMilestoneNotification(userId, milestone, amount);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        title: 'Savings Milestone Achieved! 🎉',
        message: `Congratulations! You've reached your ${milestone} savings goal of $${amount.toFixed(2)}. Keep up the great work!`,
        type: 'success',
        category: 'savings-milestone',
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getStatus', () => {
    it('should return module status', () => {
      const result = service.getStatus();
      expect(result).toEqual({ module: 'Notifications', status: 'Working' });
    });
  });
});
