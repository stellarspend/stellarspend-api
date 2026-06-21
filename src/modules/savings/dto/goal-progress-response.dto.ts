export class SavingsGoalProgressResponseDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  isCompleted: boolean;
}