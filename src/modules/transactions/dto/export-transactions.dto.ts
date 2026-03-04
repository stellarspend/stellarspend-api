import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class ExportTransactionsDto {
  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Start date for filtering transactions (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'End date for filtering transactions (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
