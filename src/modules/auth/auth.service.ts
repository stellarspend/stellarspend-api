import { Injectable, UnauthorizedException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../users/user.entity';
import { Keypair } from '@stellar/stellar-sdk';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  userId: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { publicKey, signature, message } = loginDto;

    this.logger.debug(`Login attempt for public key: ${publicKey}`);

    // Find wallet
    const wallet = await this.walletRepository.findOne({
      where: { publicKey },
    });

    if (!wallet) {
      this.logger.warn(`Wallet not found for public key: ${publicKey}`);
      throw new UnauthorizedException('Wallet not found');
    }

    // Find user by userId from wallet
    const user = await this.userRepository.findOne({
      where: { id: wallet.userId },
    });

    if (!user) {
      this.logger.warn(`User not found for wallet: ${publicKey}`);
      throw new UnauthorizedException('User not found');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingSeconds = Math.floor((user.lockedUntil.getTime() - Date.now()) / 1000);
      const unlockTime = user.lockedUntil.toISOString();
      
      this.logger.warn(
        `Locked account login attempt: ${publicKey}, remaining: ${remainingSeconds}s`,
      );
      
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          message: 'Account is temporarily locked due to multiple failed login attempts.',
          unlockTime,
          remainingSeconds,
        },
        HttpStatus.LOCKED,
      );
    }

    // Verify the signature
    const isValid = await this.verifySignature(publicKey, signature, message);
    
    if (!isValid) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      let wasLocked = false;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);
        user.lockedUntil = lockUntil;
        wasLocked = true;
      }
      
      await this.userRepository.save(user);
      
      this.logger.warn(
        `Failed login attempt for ${publicKey}, attempts: ${user.failedLoginAttempts}`,
      );

      if (wasLocked) {
        const unlockTime = user.lockedUntil!.toISOString();
        throw new HttpException(
          {
            statusCode: HttpStatus.LOCKED,
            message: 'Account locked due to multiple failed login attempts.',
            unlockTime,
            remainingSeconds: LOCK_DURATION_MINUTES * 60,
          },
          HttpStatus.LOCKED,
        );
      }

      throw new UnauthorizedException('Invalid signature');
    }

    // Successful login - reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);

    this.logger.log(`Successful login for user: ${user.id}`);

    const user = await this.userRepository.findOne({ where: { id: wallet.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { publicKey: wallet.publicKey, sub: wallet.userId };
    const accessToken = this.generateAccessToken(payload);
    const { token: refreshToken, expiry: refreshTokenExpiry } = this.createRefreshToken();

    await this.userRepository.update(user.id, {
      refreshToken,
      refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      publicKey: wallet.publicKey,
      userId: wallet.userId,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const user = await this.userRepository.findOne({ where: { refreshToken } });
    if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const wallet = await this.walletRepository.findOne({ where: { userId: user.id } });
    if (!wallet) {
      throw new UnauthorizedException('Wallet not found');
    }

    const payload = { publicKey: wallet.publicKey, sub: user.id };
    const accessToken = this.generateAccessToken(payload);
    const { token: newRefreshToken, expiry: refreshTokenExpiry } = this.createRefreshToken();

    await this.userRepository.update(user.id, {
      refreshToken: newRefreshToken,
      refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      publicKey: wallet.publicKey,
      userId: user.id,
    };
  }

  private generateAccessToken(payload: { publicKey: string; sub: string }): string {
    return this.jwtService.sign(payload);
  }

  private createRefreshToken(): { token: string; expiry: Date } {
    const token = randomBytes(48).toString('hex');
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { token, expiry };
  }

  private async verifySignature(
    publicKey: string,
    signature: string,
    message: string,
  ): Promise<boolean> {
    try {
      const keypair = Keypair.fromPublicKey(publicKey);
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');
      return keypair.verify(messageBuffer, signatureBuffer);
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error}`);
      return false;
    }
  }

  getStatus() {
    return { module: 'Auth', status: 'Working' };
  }
}
