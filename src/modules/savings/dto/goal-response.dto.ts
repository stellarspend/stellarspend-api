import { ApiProperty } from '@nestjs/swagger';

export class GoalResponseDto {
  @ApiProperty({ description: 'Savings goal ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Name of the savings goal' })
  name: string;

  @ApiProperty({ description: 'Target amount to save' })
  targetAmount: number;

  @ApiProperty({ description: 'Current saved amount' })
  currentAmount: number;

  @ApiProperty({ description: 'Progress toward the target as a percentage' })
  progress: number;

  @ApiProperty({ description: 'Whether the goal target has been reached' })
  isCompleted: boolean;

  @ApiProperty({ description: 'When the goal was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the goal was last updated' })
  updatedAt: Date;
}
