import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  create(createTransactionDto: CreateTransactionDto) {
    this.notificationsGateway.emitBalanceUpdated({
      userId: createTransactionDto.userId,
      amount: createTransactionDto.amount,
      hash: createTransactionDto.hash,
      sourceAccount: createTransactionDto.sourceAccount,
      assetCode: createTransactionDto.assetCode,
      memo: createTransactionDto.memo,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Transaction recorded', data: createTransactionDto };
  }

  getStatus() {
    return { module: 'Transactions', status: 'Working' };
  }
}