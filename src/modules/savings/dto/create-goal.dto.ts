import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ description: 'Name of the savings goal', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1, { message: 'Goal name must not be empty' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Target amount to save', minimum: 0.01 })
  @IsNumber()
  @Min(0.01, { message: 'Target amount must be greater than 0' })
  targetAmount: number;
}
