import { Injectable, Module, ExecutionContext } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { QueueModule } from './queue/queue.module';
import { databaseConfig } from './config/database.config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Injectable()
class AuthAndWalletThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<import('express').Request & { path?: string }>();
    const path: string = req.path ?? req.url ?? '';
    if (path.startsWith('/wallet') || path.startsWith('/auth')) {
      return super.canActivate(context);
    }
    return true;
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 10,
        },
      ],
      setHeaders: true,
    }),
    QueueModule,
    UsersModule,
    TransactionsModule,
    WalletModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthAndWalletThrottlerGuard,
    },
  ],
})
export class AppModule { }
