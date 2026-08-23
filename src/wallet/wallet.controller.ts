import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
/** Exposes the wallet API surface. */
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly service: WalletService, private readonly jwt: JwtService) {}
  /** Reports module availability for operations and smoke tests. */
  @Get('status') status(): { module: string; status: string } { return this.service.status(); }
  /** Links a Stellar public key to the authenticated user. */
  @Post('link') async link(@Body() body: { publicKey: string }, @Req() req: { headers: { authorization?: string } }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token required');
    const decoded = this.jwt.decode(token) as { sub: string } | null;
    if (!decoded?.sub) throw new Error('Invalid token');
    return await this.service.linkWallet(decoded.sub, body.publicKey);
  }
  /** Fetches live Stellar balances for the authenticated user's wallet. */
  @Get('balance') async getBalance(@Req() req: { headers: { authorization?: string } }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token required');
    const decoded = this.jwt.decode(token) as { sub: string } | null;
    if (!decoded?.sub) throw new Error('Invalid token');
    return await this.service.getBalances(decoded.sub);
  }
  /** Sets the weekly spending limit for a specific asset. */
  @Put('spending-limit') async setSpendingLimit(@Body() body: { asset: 'XLM' | 'USDC' | 'EURC'; limit: string }, @Req() req: { headers: { authorization?: string } }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token required');
    const decoded = this.jwt.decode(token) as { sub: string } | null;
    if (!decoded?.sub) throw new Error('Invalid token');
    return await this.service.setSpendingLimit(decoded.sub, body.asset, body.limit);
  }
  /** Checks if a transaction amount is within the weekly spending limit. */
  @Get('spending-limit/check') async checkSpendingLimit(@Query('asset') asset: string, @Query('amount') amount: string, @Req() req: { headers: { authorization?: string } }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token required');
    const decoded = this.jwt.decode(token) as { sub: string } | null;
    if (!decoded?.sub) throw new Error('Invalid token');
    return await this.service.checkSpendingLimit(decoded.sub, asset, amount);
  }
}
