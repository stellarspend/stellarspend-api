import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
/** Registers JWT authentication primitives. */
@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'development-only-stellarspend-secret-32', signOptions: { expiresIn: '15m' } })], controllers: [AuthController], providers: [AuthService], exports: [AuthService, JwtModule] })
export class AuthModule {}
