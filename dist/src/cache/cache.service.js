"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let CacheService = class CacheService {
    redis;
    constructor() {
        this.redis = new ioredis_1.default(process.env.REDIS_URL ?? 'redis://localhost:6379');
    }
    async get(key) {
        const value = await this.redis.get(key);
        if (value === null) {
            return null;
        }
        return JSON.parse(value);
    }
    async set(key, value, ttlSeconds) {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
    async del(key) {
        await this.redis.del(key);
    }
    async delByPattern(pattern) {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
    async isHealthy() {
        try {
            return (await this.redis.ping()) === 'PONG';
        }
        catch {
            return false;
        }
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
    status() {
        return {
            module: 'cache',
            status: 'ready',
        };
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CacheService);
//# sourceMappingURL=cache.service.js.map