import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateContributionDto {
  @ApiProperty({ description: 'Amount to add to the savings goal', minimum: 0.01 })
  @IsNumber()
  @Min(0.01, { message: 'Contribution amount must be greater than 0' })
  amount: number;
}
