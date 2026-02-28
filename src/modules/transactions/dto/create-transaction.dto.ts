import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @MaxLength(64)
  userId: string;

  @IsString()
  @MaxLength(64)
  hash: string;

  @IsString()
  @MaxLength(56)
  sourceAccount: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  assetCode?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}
