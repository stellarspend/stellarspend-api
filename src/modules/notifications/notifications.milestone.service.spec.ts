import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsMilestoneService } from './notifications.milestone.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsMilestoneService', () => {
  let service: NotificationsMilestoneService;

  const mockNotificationsService = {
    createSavingsMilestoneNotification: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsMilestoneService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<NotificationsMilestoneService>(NotificationsMilestoneService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMilestones', () => {
    it('should return all milestones', () => {
      const milestones = service.getMilestones();

      expect(milestones).toBeDefined();
      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBe(6);
      expect(milestones[0]).toEqual({
        threshold: 100,
        name: 'First $100',
        message: "You've saved your first $100! Great start!",
      });
      expect(milestones[5]).toEqual({
        threshold: 10000,
        name: '$10,000 Achievement',
        message: 'Incredible! You\'ve reached $10,000 in savings!',
      });
    });
  });

  describe('getNextMilestone', () => {
    it('should return the next milestone when current savings is below first threshold', () => {
      const nextMilestone = service.getNextMilestone(50);

      expect(nextMilestone).toEqual({
        threshold: 100,
        name: 'First $100',
        message: "You've saved your first $100! Great start!",
      });
    });

    it('should return the next milestone when current savings is between thresholds', () => {
      const nextMilestone = service.getNextMilestone(500);

      expect(nextMilestone).toEqual({
        threshold: 1000,
        name: '$1,000 Achievement',
        message: "You've reached $1,000 in savings! Amazing work!",
      });
    });

    it('should return null when all milestones are achieved', () => {
      const nextMilestone = service.getNextMilestone(15000);

      expect(nextMilestone).toBeNull();
    });
  });

  describe('checkAndTriggerMilestones', () => {
    it('should trigger milestone notification when crossing first threshold', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockNotificationsService.createSavingsMilestoneNotification.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerMilestones(userId, 100, 0);

      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        'First $100',
        100
      );
    });

    it('should trigger multiple milestone notifications when crossing multiple thresholds', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockNotificationsService.createSavingsMilestoneNotification.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerMilestones(userId, 5000, 0);

      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledTimes(5);
      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        'First $100',
        100
      );
      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        '$500 Milestone',
        500
      );
      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        '$1,000 Achievement',
        1000
      );
      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        '$2,500 Milestone',
        2500
      );
      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        '$5,000 Milestone',
        5000
      );
    });

    it('should not trigger notification when already past threshold', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await service.checkAndTriggerMilestones(userId, 200, 150);

      expect(mockNotificationsService.createSavingsMilestoneNotification).not.toHaveBeenCalled();
    });

    it('should not trigger notification when savings decreased', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await service.checkAndTriggerMilestones(userId, 50, 200);

      expect(mockNotificationsService.createSavingsMilestoneNotification).not.toHaveBeenCalled();
    });

    it('should trigger notification when crossing from previous savings', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockNotificationsService.createSavingsMilestoneNotification.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerMilestones(userId, 1500, 800);

      expect(mockNotificationsService.createSavingsMilestoneNotification).toHaveBeenCalledWith(
        userId,
        '$1,000 Achievement',
        1000
      );
    });

    it('should not trigger any notifications when savings is 0', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await service.checkAndTriggerMilestones(userId, 0, 0);

      expect(mockNotificationsService.createSavingsMilestoneNotification).not.toHaveBeenCalled();
    });
  });

  describe('checkAndTriggerSavingsGoalMilestones', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const goalName = 'Emergency Fund';

    it('should trigger 50% milestone notification when crossing halfway point', async () => {
      mockNotificationsService.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerSavingsGoalMilestones(userId, goalName, 500, 1000, 400);

      expect(mockNotificationsService.create).toHaveBeenCalledWith({
        userId,
        title: 'Savings Goal Progress! 🎯',
        message: `You're halfway there! Your "${goalName}" goal is 50% complete. Keep saving!`,
        type: 'info',
        category: 'savings-goal-progress',
      });
      expect(mockNotificationsService.create).toHaveBeenCalledTimes(1);
    });

    it('should trigger 100% completion notification when goal is fully funded', async () => {
      mockNotificationsService.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174002',
        userId,
      });

      await service.checkAndTriggerSavingsGoalMilestones(userId, goalName, 1000, 1000, 900);

      expect(mockNotificationsService.create).toHaveBeenCalledWith({
        userId,
        title: 'Savings Goal Completed! 🎉',
        message: `Congratulations! You've reached your "${goalName}" savings goal of $1000.00!`,
        type: 'success',
        category: 'savings-goal-completion',
      });
      expect(mockNotificationsService.create).toHaveBeenCalledTimes(1);
    });

    it('should trigger both 50% and 100% notifications when jumping from below halfway to completion', async () => {
      mockNotificationsService.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerSavingsGoalMilestones(userId, goalName, 1000, 1000, 200);

      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationsService.create).toHaveBeenNthCalledWith(1, {
        userId,
        title: 'Savings Goal Progress! 🎯',
        message: `You're halfway there! Your "${goalName}" goal is 50% complete. Keep saving!`,
        type: 'info',
        category: 'savings-goal-progress',
      });
      expect(mockNotificationsService.create).toHaveBeenNthCalledWith(2, {
        userId,
        title: 'Savings Goal Completed! 🎉',
        message: `Congratulations! You've reached your "${goalName}" savings goal of $1000.00!`,
        type: 'success',
        category: 'savings-goal-completion',
      });
    });

    it('should not duplicate notifications when already past milestone thresholds', async () => {
      await service.checkAndTriggerSavingsGoalMilestones(userId, goalName, 600, 1000, 550);

      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });

    it('should not duplicate notifications on repeated checks with no progress change', async () => {
      mockNotificationsService.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerSavingsGoalMilestones(userId, goalName, 500, 1000, 400);
      await service.checkAndTriggerSavingsGoalMilestones(userId, goalName, 500, 1000, 500);

      expect(mockNotificationsService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkAndTriggerBudgetWarning', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const category = 'Groceries';

    it('should trigger 80% budget warning notification when crossing threshold', async () => {
      mockNotificationsService.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerBudgetWarning(userId, category, 800, 1000, 700);

      expect(mockNotificationsService.create).toHaveBeenCalledWith({
        userId,
        title: 'Budget Warning ⚠️',
        message: `You've used 80% of your ${category} budget. Consider slowing down your spending.`,
        type: 'warning',
        category: 'budget-warning',
      });
    });

    it('should not duplicate budget warning when already past 80%', async () => {
      await service.checkAndTriggerBudgetWarning(userId, category, 900, 1000, 850);

      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });

    it('should not duplicate budget warning on repeated checks with no spending change', async () => {
      mockNotificationsService.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
      });

      await service.checkAndTriggerBudgetWarning(userId, category, 800, 1000, 700);
      await service.checkAndTriggerBudgetWarning(userId, category, 800, 1000, 800);

      expect(mockNotificationsService.create).toHaveBeenCalledTimes(1);
    });
  });
});
