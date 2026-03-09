import {
  Injectable,
  Module,
  ExecutionContext,
  MiddlewareConsumer,
  NestModule,
} from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RequestTimestampMiddleware } from "./common/middleware/request-timestamp.middleware";
import { UsersModule } from "./modules/users/users.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { QueueModule } from "./queue/queue.module";
import { databaseConfig } from "./config/database.config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";

@Injectable()
class AuthAndWalletThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<import("express").Request & { path?: string }>();
    const path: string = req.path ?? req.url ?? "";
    if (path.startsWith("/wallet") || path.startsWith("/auth")) {
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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
          ttl: 60,
        }),
      }),
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
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthAndWalletThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTimestampMiddleware).forRoutes("*");
  }
}
