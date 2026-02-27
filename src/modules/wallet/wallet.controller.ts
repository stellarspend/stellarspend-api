import { Controller, Get, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  status() {
    return this.walletService.getStatus();
  }

  @Get('balance/:publicKey')
  async getBalance(@Param('publicKey') publicKey: string) {
    return this.walletService.getWalletBalance(publicKey);
  }

  @Get('analytics/:userId')
  async getAnalytics(@Param('userId') userId: string) {
    return this.walletService.getWalletAnalytics(userId);
  }

  @Get('user/:userId')
  async getUserWallets(@Param('userId') userId: string) {
    return this.walletService.findByUserId(userId);
  }
}