import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'abc123...', description: 'Stellar transaction hash', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  hash: string;

  @ApiProperty({ example: 'GABC...', description: 'Stellar account public key', maxLength: 56 })
  @IsString()
  @MaxLength(56)
  sourceAccount: string;

  @ApiPropertyOptional({ example: 'XLM', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  assetCode?: string;

  @ApiProperty({ example: 100.5, description: 'Amount (non-negative)', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'Payment for services', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}
