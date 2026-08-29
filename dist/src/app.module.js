"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const configuration_1 = require("./common/config/configuration");
const validation_1 = require("./common/config/validation");
const typed_config_service_1 = require("./common/config/typed-config.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const wallet_module_1 = require("./wallet/wallet.module");
const blockchain_module_1 = require("./blockchain/blockchain.module");
const transactions_module_1 = require("./transactions/transactions.module");
const budgets_module_1 = require("./budgets/budgets.module");
const budget_allocation_module_1 = require("./budget-allocation/budget-allocation.module");
const savings_module_1 = require("./savings/savings.module");
const currency_conversion_module_1 = require("./currency-conversion/currency-conversion.module");
const notification_module_1 = require("./notification/notification.module");
const mail_module_1 = require("./mail/mail.module");
const analytics_module_1 = require("./analytics/analytics.module");
const analytics_system_module_1 = require("./analytics-system/analytics-system.module");
const admin_module_1 = require("./admin/admin.module");
const settings_module_1 = require("./settings/settings.module");
const audit_module_1 = require("./audit/audit.module");
const security_module_1 = require("./security/security.module");
const cache_module_1 = require("./cache/cache.module");
const logging_module_1 = require("./logging/logging.module");
const health_module_1 = require("./health/health.module");
const translation_module_1 = require("./translation/translation.module");
const accessibility_module_1 = require("./accessibility/accessibility.module");
const protected_module_1 = require("./protected/protected.module");
const config_module_1 = require("./common/config/config.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.configuration], validationSchema: validation_1.configurationValidationSchema }),
            config_module_1.AppConfigModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_module_1.AppConfigModule],
                inject: [typed_config_service_1.TypedConfigService],
                useFactory: (config) => ({
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
            auth_module_1.AuthModule, users_module_1.UsersModule, wallet_module_1.WalletModule, blockchain_module_1.BlockchainModule, transactions_module_1.TransactionsModule, budgets_module_1.BudgetsModule, budget_allocation_module_1.BudgetAllocationModule, savings_module_1.SavingsModule, currency_conversion_module_1.CurrencyConversionModule, notification_module_1.NotificationModule, mail_module_1.MailModule, analytics_module_1.AnalyticsModule, analytics_system_module_1.AnalyticsSystemModule, admin_module_1.AdminModule, settings_module_1.SettingsModule, audit_module_1.AuditModule, security_module_1.SecurityModule, cache_module_1.CacheModule, logging_module_1.LoggingModule, health_module_1.HealthModule, translation_module_1.TranslationModule, accessibility_module_1.AccessibilityModule, protected_module_1.ProtectedModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map