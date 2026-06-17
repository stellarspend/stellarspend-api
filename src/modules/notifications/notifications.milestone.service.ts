import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

export interface SavingsMilestone {
  threshold: number;
  name: string;
  message: string;
}

@Injectable()
export class NotificationsMilestoneService {
  private readonly milestones: SavingsMilestone[] = [
    { threshold: 100, name: 'First $100', message: 'You\'ve saved your first $100! Great start!' },
    { threshold: 500, name: '$500 Milestone', message: 'Halfway to $1,000! Keep saving!' },
    { threshold: 1000, name: '$1,000 Achievement', message: 'You\'ve reached $1,000 in savings! Amazing work!' },
    { threshold: 2500, name: '$2,500 Milestone', message: 'Your savings have reached $2,500! Outstanding!' },
    { threshold: 5000, name: '$5,000 Milestone', message: 'You\'ve saved $5,000! You\'re a saving superstar!' },
    { threshold: 10000, name: '$10,000 Achievement', message: 'Incredible! You\'ve reached $10,000 in savings!' },
  ];

  constructor(private readonly notificationsService: NotificationsService) {}

  async checkAndTriggerMilestones(
    userId: string, 
    currentSavings: number, 
    previousSavings: number = 0
  ): Promise<void> {
    for (const milestone of this.milestones) {
      if (currentSavings >= milestone.threshold && previousSavings < milestone.threshold) {
        await this.notificationsService.createSavingsMilestoneNotification(
          userId,
          milestone.name,
          milestone.threshold
        );
      }
    }
  }

  async checkAndTriggerSavingsGoalMilestones(
    userId: string,
    goalName: string,
    currentAmount: number,
    targetAmount: number,
    previousAmount: number = 0
  ): Promise<void> {
    if (targetAmount <= 0) {
      return;
    }

    const previousProgress = (previousAmount / targetAmount) * 100;
    const currentProgress = (currentAmount / targetAmount) * 100;

    if (previousProgress < 50 && currentProgress >= 50) {
      await this.notificationsService.create({
        userId,
        title: 'Savings Goal Progress! 🎯',
        message: `You're halfway there! Your "${goalName}" goal is 50% complete. Keep saving!`,
        type: 'info',
        category: 'savings-goal-progress',
      });
    }

    if (previousAmount < targetAmount && currentAmount >= targetAmount) {
      await this.notificationsService.create({
        userId,
        title: 'Savings Goal Completed! 🎉',
        message: `Congratulations! You've reached your "${goalName}" savings goal of $${targetAmount.toFixed(2)}!`,
        type: 'success',
        category: 'savings-goal-completion',
      });
    }
  }

  async checkAndTriggerBudgetWarning(
    userId: string,
    category: string,
    currentSpent: number,
    budgetLimit: number,
    previousSpent: number = 0
  ): Promise<void> {
    if (budgetLimit <= 0) {
      return;
    }

    const previousPercent = (previousSpent / budgetLimit) * 100;
    const currentPercent = (currentSpent / budgetLimit) * 100;

    if (previousPercent < 80 && currentPercent >= 80) {
      await this.notificationsService.create({
        userId,
        title: 'Budget Warning ⚠️',
        message: `You've used ${Math.round(currentPercent)}% of your ${category} budget. Consider slowing down your spending.`,
        type: 'warning',
        category: 'budget-warning',
      });
    }
  }

  getMilestones(): SavingsMilestone[] {
    return this.milestones;
  }

  getNextMilestone(currentSavings: number): SavingsMilestone | null {
    return this.milestones.find(m => m.threshold > currentSavings) || null;
  }
}
