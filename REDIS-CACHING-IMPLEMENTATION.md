# Redis Caching Implementation

## Overview
Added Redis caching for wallet balances and analytics to improve API performance.

## Changes Made

### 1. Dependencies
- Installed `@nestjs/cache-manager` and `cache-manager`

### 2. App Module (src/app.module.ts)
- Integrated `CacheModule` with global scope
- Set TTL to 60 seconds (60000ms)

### 3. Wallet Service (src/modules/wallet/wallet.service.ts)
Added caching for:
- `findByUserId()` - Caches user's wallets
- `findByPublicKey()` - Caches wallet by public key
- `getWalletBalance()` - NEW: Caches wallet balance
- `getWalletAnalytics()` - NEW: Caches user analytics

Cache invalidation:
- `createWallet()` now invalidates user-specific caches
- Private method `invalidateUserCache()` handles cache cleanup

### 4. Wallet Controller (src/modules/wallet/wallet.controller.ts)
Added new cached endpoints:
- `GET /wallet/balance/:publicKey` - Get wallet balance (cached)
- `GET /wallet/analytics/:userId` - Get user analytics (cached)
- `GET /wallet/user/:userId` - Get user wallets (cached)

## Cache Keys
- `wallets:user:{userId}` - User's wallets
- `wallet:publicKey:{publicKey}` - Wallet by public key
- `wallet:balance:{publicKey}` - Wallet balance
- `wallet:analytics:{userId}` - User analytics

## Testing
Test the cached endpoints:
```bash
# Get wallet balance (first call hits DB, subsequent calls use cache)
curl http://localhost:3000/wallet/balance/GXXX...

# Get user analytics (cached for 60 seconds)
curl http://localhost:3000/wallet/analytics/user123

# Get user wallets (cached for 60 seconds)
curl http://localhost:3000/wallet/user/user123
```

## Cache Behavior
- First request: Fetches from database and stores in cache
- Subsequent requests (within 60s): Returns from cache
- After 60s: Cache expires, next request fetches from database
- On wallet creation: Invalidates related user caches
