export class GoalResponseDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
