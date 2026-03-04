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
  @IsUUID()
  userId: string;

  @IsString()
  @MaxLength(64)
  hash: string;

  @IsString()
  @MaxLength(56)
  sourceAccount: string;

  @IsOptional()
  @IsString()
  @MaxLength(56)
  destinationAccount?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  assetCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(56)
  assetIssuer?: string;

  @IsString()
  @MaxLength(50)
  transactionType: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  memoType?: string;

  @IsOptional()
  @IsIn(['pending', 'completed', 'failed'])
  status?: 'pending' | 'completed' | 'failed';

  @IsOptional()
  ledgerSequence?: number;

  @IsDate()
  @Type(() => Date)
  stellarCreatedAt: Date;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
