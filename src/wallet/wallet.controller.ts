import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WalletService, SpendingLimitAsset, SpendingLimitCheck } from './wallet.service';
import { WalletEntity } from './entities/wallet.entity';

/** Request body for POST /wallet/link */
class LinkWalletDto {
  publicKey!: string;
}

/** Request body for PUT /wallet/spending-limit/:asset */
class SetSpendingLimitDto {
  limit!: string;
}

/** Exposes the wallet API surface. */
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly service: WalletService) {}

  /**
   * POST /wallet/link
   * Links a Stellar public key to the authenticated user.
   * Returns 409 Conflict if the key is already held by another account.
   */
  @Post('link')
  linkWallet(
    @CurrentUser() userId: string,
    @Body() body: LinkWalletDto,
  ): Promise<WalletEntity> {
    return this.service.linkWallet(userId, body.publicKey);
  }

  /**
   * GET /wallet/balance
   * Returns live Stellar balances for the user's linked public key via Horizon.
   */
  @Get('balance')
  getBalances(@CurrentUser() userId: string): Promise<unknown[]> {
    return this.service.getBalances(userId);
  }

  /**
   * PUT /wallet/spending-limit/:asset
   * Stores or updates the weekly spending limit for the given asset (XLM, USDC, EURC).
   */
  @Put('spending-limit/:asset')
  setSpendingLimit(
    @CurrentUser() userId: string,
    @Param('asset') asset: string,
    @Body() body: SetSpendingLimitDto,
  ): Promise<WalletEntity> {
    return this.service.setSpendingLimit(userId, asset.toUpperCase() as SpendingLimitAsset, body.limit);
  }

  /**
   * GET /wallet/spending-limit/check?asset=USDC&amount=150
   * Returns { allowed: boolean, remaining: string } based on current-week spend.
   */
  @Get('spending-limit/check')
  checkSpendingLimit(
    @CurrentUser() userId: string,
    @Query('asset') asset: string,
    @Query('amount') amount: string,
  ): Promise<SpendingLimitCheck> {
    return this.service.checkSpendingLimit(userId, asset, amount);
  }
}
