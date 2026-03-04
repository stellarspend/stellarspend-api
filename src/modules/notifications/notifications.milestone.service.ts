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

  getMilestones(): SavingsMilestone[] {
    return this.milestones;
  }

  getNextMilestone(currentSavings: number): SavingsMilestone | null {
    return this.milestones.find(m => m.threshold > currentSavings) || null;
  }
}
