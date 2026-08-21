import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsGoalEntity } from './entities/savings-goal.entity';
import { NotificationService } from '../notification/notification.service';

/** Provides the savings application capability. */
@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(SavingsGoalEntity)
    private readonly goalRepo: Repository<SavingsGoalEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  /** Returns a stable service health payload for this capability. */
  status(): { module: string; status: string } { 
    return { module: 'savings', status: 'ready' }; 
  }

  async createGoal(userId: string, dto: { name: string; targetAmount: string; asset: string }): Promise<SavingsGoalEntity> {
    const goal = this.goalRepo.create({
      userId,
      name: dto.name,
      targetAmount: dto.targetAmount,
      asset: dto.asset || 'XLM',
    });
    return this.goalRepo.save(goal);
  }

  async getGoals(userId: string): Promise<SavingsGoalEntity[]> {
    return this.goalRepo.find({ where: { userId } });
  }

  async getGoal(userId: string, goalId: string): Promise<SavingsGoalEntity> {
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException('Not owned by user');
    }
    return goal;
  }

  async contribute(userId: string, goalId: string, amount: string): Promise<{ goal: SavingsGoalEntity; milestoneReached: boolean }> {
    const goal = await this.getGoal(userId, goalId);

    const updateResult = await this.goalRepo
      .createQueryBuilder()
      .update(SavingsGoalEntity)
      .set({
        currentAmount: () => `"currentAmount" + :amount::numeric`
      })
      .where("id = :id", { id: goalId })
      .setParameter('amount', amount)
      .returning('*')
      .execute();

    let updatedGoal = updateResult.raw[0] as SavingsGoalEntity;
    // Map db columns to entity fields if needed (e.g. current_amount -> currentAmount)
    // TypeORM returning('*') raw results are snake_case if we mapped them, but let's re-fetch to be safe and clean.
    updatedGoal = await this.goalRepo.findOne({ where: { id: goalId } }) as SavingsGoalEntity;

    let milestoneReached = false;

    if (!updatedGoal.isCompleted && parseFloat(updatedGoal.currentAmount) >= parseFloat(updatedGoal.targetAmount)) {
      milestoneReached = true;
      updatedGoal.isCompleted = true;
      await this.goalRepo.update({ id: goalId }, { isCompleted: true });
      await this.notificationService.send(userId, 'GOAL_COMPLETE', updatedGoal.name);
    }

    return { goal: updatedGoal, milestoneReached };
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const goal = await this.getGoal(userId, goalId);
    await this.goalRepo.remove(goal);
  }
}
