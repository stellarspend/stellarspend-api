import {
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @MinLength(1, { message: 'Goal name must not be empty' })
  @MaxLength(255)
  name: string;

  @IsNumber()
  @Min(0.01, { message: 'Target amount must be greater than 0' })
  targetAmount: number;
}
