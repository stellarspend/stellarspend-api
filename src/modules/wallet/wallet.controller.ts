import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WalletService, AssetBalance } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get()
  @ApiOperation({ summary: 'Get wallet module status' })
  @ApiResponse({ status: 200, description: 'Module status' })
  status() {
    return this.walletService.getStatus();
  }

  @Get(':publicKey/balances')
  @ApiOperation({ summary: 'Get account balances for a Stellar public key' })
  @ApiParam({ name: 'publicKey', description: 'Stellar account public key' })
  @ApiResponse({ status: 200, description: 'Account balances (publicKey and balances array)' })
  async fetchAccountBalances(
    @Param('publicKey') publicKey: string,
  ): Promise<{ publicKey: string; balances: AssetBalance[] }> {
    const balances = await this.walletService.getAccountBalances(publicKey);
    return { publicKey, balances };
  }
}