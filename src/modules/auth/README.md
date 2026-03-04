# Wallet-Based Authentication

This module implements wallet-based authentication using JWT tokens for the StellarSpend API.

## Overview

Users authenticate by signing a message with their Stellar wallet's private key and submitting the signature along with their public key. The server verifies the signature and issues a JWT token upon successful verification.

## Installation

Install the required dependencies:

```bash
npm install
```

## Environment Variables

Add the following to your `.env` file:

```
JWT_SECRET=your-secret-key-change-in-production
```

## Authentication Flow

1. Client signs a message with their wallet's private key
2. Client sends POST request to `/auth/login` with:
   - `publicKey`: Stellar public key (G...)
   - `signature`: Base64-encoded signature
   - `message`: The original message that was signed
3. Server verifies the signature using Stellar SDK
4. If valid, server issues a JWT token
5. Client uses the JWT token in subsequent requests via `Authorization: Bearer <token>` header

## API Endpoints

### POST /auth/login

Authenticate with wallet signature and receive JWT token.

**Request Body:**
```json
{
  "publicKey": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "signature": "base64-encoded-signature",
  "message": "Sign this message to authenticate"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "publicKey": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "userId": "uuid"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid signature"
}
```

## Using the JWT Token

To access protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Protecting Routes

Use the `JwtAuthGuard` to protect your routes:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

## Token Expiration

JWT tokens expire after 24 hours by default. This can be configured in `auth.module.ts`.
