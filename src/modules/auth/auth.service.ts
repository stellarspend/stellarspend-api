import { Injectable, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { publicKey, signature, message } = loginDto;

    // Verify the signature
    const isValid = await this.verifySignature(publicKey, signature, message);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Find or create wallet
    const wallet = await this.walletRepository.findOne({ where: { publicKey } });
    
    if (!wallet) {
      throw new UnauthorizedException('Wallet not found');
    }

    // Generate JWT token
    const payload = { publicKey: wallet.publicKey, sub: wallet.userId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      publicKey: wallet.publicKey,
      userId: wallet.userId,
    };
  }

  private async verifySignature(
    publicKey: string,
    signature: string,
    message: string,
  ): Promise<boolean> {
    try {
      // Create a Keypair from the public key
      const keypair = Keypair.fromPublicKey(publicKey);
      
      // Convert message to buffer
      const messageBuffer = Buffer.from(message, 'utf8');
      
      // Convert signature from base64 to buffer
      const signatureBuffer = Buffer.from(signature, 'base64');
      
      // Verify the signature
      return keypair.verify(messageBuffer, signatureBuffer);
    } catch {
      // Signature verification failed - return false without logging
      return false;
    }
  }

  getStatus() {
    return { module: 'Auth', status: 'Working' };
  }
}