import { IsNumber, Min } from 'class-validator';

export class UpdateContributionDto {
  @IsNumber()
  @Min(0.01, { message: 'Contribution amount must be greater than 0' })
  amount: number;
}
