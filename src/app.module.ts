import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration } from './common/config/configuration';
import { configurationValidationSchema } from './common/config/validation';
import { TypedConfigService } from './common/config/typed-config.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { BudgetAllocationModule } from './budget-allocation/budget-allocation.module';
import { SavingsModule } from './savings/savings.module';
import { CurrencyConversionModule } from './currency-conversion/currency-conversion.module';
import { NotificationModule } from './notification/notification.module';
import { MailModule } from './mail/mail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { SecurityModule } from './security/security.module';
import { CacheModule } from './cache/cache.module';
import { LoggingModule } from './logging/logging.module';
import { HealthModule } from './health/health.module';
import { TranslationModule } from './translation/translation.module';
import { AccessibilityModule } from './accessibility/accessibility.module';
import { ProtectedModule } from './protected/protected.module';
import { AppConfigModule } from './common/config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema: configurationValidationSchema }),
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.getNumber('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'stellarspend'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    AuthModule, UsersModule, WalletModule, BlockchainModule, TransactionsModule, BudgetsModule, BudgetAllocationModule, SavingsModule, CurrencyConversionModule, NotificationModule, MailModule, AnalyticsModule, AnalyticsSystemModule, AdminModule, SettingsModule, AuditModule, SecurityModule, CacheModule, LoggingModule, HealthModule, TranslationModule, AccessibilityModule, ProtectedModule,
  ],
})
export class AppModule {}