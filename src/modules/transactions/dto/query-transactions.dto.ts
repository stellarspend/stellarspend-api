import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsUUID,
  IsDate,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Sort direction by creation date',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  @IsIn(['asc', 'desc'], { message: 'Sort order must be either "asc" or "desc"' })
  sortOrder: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    format: 'uuid',
    example: '123e4567-e89b-42d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('all', { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by spending category',
    example: 'groceries',
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by asset code',
    example: 'XLM',
    enum: ['XLM', 'USDC', 'EURC'],
  })
  @IsOptional()
  @IsString({ message: 'Asset code must be a string' })
  assetCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    example: 'payment',
    enum: ['payment', 'deposit', 'withdrawal', 'swap', 'rewards'],
  })
  @IsOptional()
  @IsString({ message: 'Transaction type must be a string' })
  transactionType?: string;

  @ApiPropertyOptional({
    description: 'Filter transactions on or after this date (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter transactions on or before this date (ISO format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  endDate?: Date;
}
