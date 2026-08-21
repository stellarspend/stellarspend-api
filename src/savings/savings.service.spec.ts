import { Test, TestingModule } from '@nestjs/testing';
import { SavingsService } from './savings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SavingsGoalEntity } from './entities/savings-goal.entity';
import { NotificationService } from '../notification/notification.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SavingsService', () => {
  let service: SavingsService;
  let notificationService: NotificationService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockNotification = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingsService,
        { provide: getRepositoryToken(SavingsGoalEntity), useValue: mockRepo },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get<SavingsService>(SavingsService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a goal', async () => {
    const dto = { name: 'Trip', targetAmount: '1000', asset: 'XLM' };
    const goal = { id: '1', userId: 'user-1', ...dto, currentAmount: '0', isCompleted: false };
    mockRepo.create.mockReturnValue(goal);
    mockRepo.save.mockResolvedValue(goal);

    const result = await service.createGoal('user-1', dto);
    expect(result).toEqual(goal);
    expect(mockRepo.create).toHaveBeenCalledWith({ userId: 'user-1', name: 'Trip', targetAmount: '1000', asset: 'XLM' });
    expect(mockRepo.save).toHaveBeenCalledWith(goal);
  });

  it('should contribute to a goal and trigger milestone', async () => {
    const goal = { id: '1', userId: 'user-1', name: 'Trip', targetAmount: '100', currentAmount: '50', isCompleted: false };
    mockRepo.findOne
      .mockResolvedValueOnce(goal) // getGoal
      .mockResolvedValueOnce({ ...goal, currentAmount: '100', isCompleted: true }); // post update fetch
    
    mockRepo.createQueryBuilder.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: [{ id: '1', currentAmount: '100' }] }),
    } as any);

    const result = await service.contribute('user-1', '1', '50');
    expect(result.milestoneReached).toBe(true);
    expect(notificationService.send).toHaveBeenCalledWith('user-1', 'GOAL_COMPLETE', 'Trip');
  });

  it('should throw 403 when contributing to someone elses goal', async () => {
    const goal = { id: '1', userId: 'user-2', name: 'Trip' };
    mockRepo.findOne.mockResolvedValue(goal);
    await expect(service.contribute('user-1', '1', '50')).rejects.toThrow(ForbiddenException);
  });
});
