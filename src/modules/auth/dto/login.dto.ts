import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Stellar account public key' })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({ description: 'Signature of the message from the wallet' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ description: 'Message that was signed' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
