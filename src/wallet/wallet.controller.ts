import { Controller, Get, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';

/** Exposes the wallet API surface. */
@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get('status')
  status(): { module: string; status: string } {
    return this.service.status();
  }

  @Get('balance')
  getBalance(@Query('publicKey') publicKey: string) {
    return this.service.getBalances(publicKey);
  }
}