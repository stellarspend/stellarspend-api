import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notifications.entity';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const updateResult = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
    return updateResult.affected || 0;
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async createSavingsMilestoneNotification(
    userId: string,
    milestone: string,
    amount: number
  ): Promise<Notification> {
    return await this.create({
      userId,
      title: 'Savings Milestone Achieved! 🎉',
      message: `Congratulations! You've reached your ${milestone} savings goal of $${amount.toFixed(2)}. Keep up the great work!`,
      type: 'success',
      category: 'savings-milestone',
    });
  }

  async findOneByCategory(userId: string, category: string): Promise<Notification | null> {
    return await this.notificationRepository.findOne({
      where: { userId, category },
    });
  }

  async createBudgetAlertNotification(
    userId: string,
    budgetId: string,
    categoryName: string,
    limit: number,
    usagePercent: 80 | 100
  ): Promise<Notification> {
    const title = usagePercent === 100 ? 'Budget Limit Exceeded! ⚠️' : 'Budget Limit Approaching! ⚠️';
    const message = usagePercent === 100
      ? `You have spent 100% or more of your budget limit ($${limit.toFixed(2)}) for category "${categoryName}".`
      : `You have reached 80% or more of your budget limit ($${limit.toFixed(2)}) for category "${categoryName}".`;
    
    return await this.create({
      userId,
      title,
      message,
      type: usagePercent === 100 ? 'error' : 'warning',
      category: `budget-alert-${usagePercent}-${budgetId}`,
    });
  }

  getStatus() {
    return { module: 'Notifications', status: 'Working' };
  }
}