import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsUUID,
  IsDate,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Owner user ID', format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Stellar transaction hash', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  hash: string;

  @ApiProperty({ description: 'Source Stellar account public key', maxLength: 56 })
  @IsString()
  @MaxLength(56)
  sourceAccount: string;

  @ApiPropertyOptional({ description: 'Destination Stellar account public key', maxLength: 56 })
  @IsOptional()
  @IsString()
  @MaxLength(56)
  destinationAccount?: string;

  @ApiProperty({ description: 'Transaction amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Asset code (e.g. XLM, USDC)', maxLength: 12 })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  assetCode?: string;

  @ApiPropertyOptional({ description: 'Asset issuer public key', maxLength: 56 })
  @IsOptional()
  @IsString()
  @MaxLength(56)
  assetIssuer?: string;

  @ApiProperty({ description: 'Transaction type (e.g. payment, create_account)', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  transactionType: string;

  @ApiPropertyOptional({ description: 'Transaction memo', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;

  @ApiPropertyOptional({ description: 'Memo type', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  memoType?: string;

  @ApiPropertyOptional({
    description: 'Processing status',
    enum: ['pending', 'completed', 'failed'],
  })
  @IsOptional()
  @IsIn(['pending', 'completed', 'failed'])
  status?: 'pending' | 'completed' | 'failed';

  @ApiPropertyOptional({ description: 'Stellar ledger sequence number' })
  @IsOptional()
  ledgerSequence?: number;

  @ApiProperty({ description: 'When the transaction was created on the Stellar network' })
  @IsDate()
  @Type(() => Date)
  stellarCreatedAt: Date;

  @ApiPropertyOptional({ description: 'Spending category', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Human-readable description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
