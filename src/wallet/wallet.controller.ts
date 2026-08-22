import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/** DTO for linking a wallet. */
export class LinkWalletDto {
  /** User identifier from JWT token. */
  @IsUUID()
  userId!: string;

  /** Stellar public key to link. */
  @IsString()
  publicKey!: string;
}

/** DTO for setting spending limit. */
export class SetSpendingLimitDto {
  /** User identifier from JWT token. */
  @IsUUID()
  userId!: string;

  /** Asset code (XLM, USDC, or EURC). */
  @IsString()
  asset!: 'XLM' | 'USDC' | 'EURC';

  /** Spending limit as decimal string. */
  @IsString()
  limit!: string;
}

/** Exposes the wallet API surface. */
@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  /** Reports module availability for operations and smoke tests. */
  @Get('status')
  status(): { module: string; status: string } {
    return this.service.status();
  }

  /** Links a Stellar public key to the authenticated user. */
  @Post('link')
  @UseGuards(JwtAuthGuard)
  async linkWallet(@Body() dto: LinkWalletDto) {
    return await this.service.linkWallet(dto.userId, dto.publicKey);
  }

  /** Returns live Stellar balances for the linked wallet. */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalances(@Query('userId') userId: string) {
    return await this.service.getBalances(userId);
  }

  /** Sets the weekly spending limit for a specific asset. */
  @Put('spending-limit')
  @UseGuards(JwtAuthGuard)
  async setSpendingLimit(@Body() dto: SetSpendingLimitDto) {
    return await this.service.setSpendingLimit(dto.userId, dto.asset, dto.limit);
  }

  /** Checks if a spending amount is allowed based on current week's transactions. */
  @Get('spending-limit/check')
  @UseGuards(JwtAuthGuard)
  async checkSpendingLimit(
    @Query('userId') userId: string,
    @Query('asset') asset: string,
    @Query('amount') amount: string,
  ) {
    return await this.service.checkSpendingLimit(userId, asset, amount);
  }
}
