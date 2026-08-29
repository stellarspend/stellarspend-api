"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationValidationSchema = void 0;
const Joi = __importStar(require("joi"));
/** Validates startup configuration and rejects malformed deployments. */
exports.configurationValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().port().default(3001),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
    DB_HOST: Joi.string().default('localhost'), DB_PORT: Joi.number().default(5432),
    DB_USERNAME: Joi.string().default('postgres'), DB_PASSWORD: Joi.string().default('postgres'), DB_NAME: Joi.string().default('stellarspend'),
    JWT_SECRET: Joi.string().min(32).default('development-only-stellarspend-secret-32'),
    JWT_ACCESS_TTL: Joi.string().default('15m'), JWT_REFRESH_TTL: Joi.string().default('7d'),
    REDIS_URL: Joi.string().uri().required(),
    STELLAR_NETWORK: Joi.string().valid('PUBLIC', 'TESTNET').default('TESTNET'),
    HORIZON_URL: Joi.string().uri().default('https://horizon-testnet.stellar.org'),
    SOROBAN_RPC_URL: Joi.string().uri().default('https://soroban-testnet.stellar.org'),
    SMTP_HOST: Joi.string().allow('').default(''), SMTP_PORT: Joi.number().default(587), SMTP_USER: Joi.string().allow('').default(''), SMTP_PASSWORD: Joi.string().allow('').default(''),
});
//# sourceMappingURL=validation.js.map