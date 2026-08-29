import * as Joi from 'joi';

/** Validates startup configuration and rejects malformed deployments. */
export const configurationValidationSchema = Joi.object({
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
