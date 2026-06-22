import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { createMockRepository, MockRepository } from '../../common/mocks/repository.mock';
import { User } from '../users/user.entity';
import { Wallet } from '../wallet/wallet.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let mockWalletRepo: MockRepository<Wallet>;
  let mockUserRepo: MockRepository<User>;
  let jwtService: JwtService;

  beforeEach(() => {
    mockWalletRepo = createMockRepository<Wallet>();
    mockUserRepo = createMockRepository<User>();
    jwtService = { sign: jest.fn().mockReturnValue('mock-access-token') } as unknown as JwtService;

    authService = new AuthService(
      mockWalletRepo as unknown as any,
      mockUserRepo as unknown as any,
      jwtService,
    );
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../users/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthService - Account Lockout', () => {
  let service: AuthService;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPublicKey = 'GABCDEF1234567890';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  const mockWallet = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    publicKey: mockPublicKey,
    userId: mockUserId,
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn().mockResolvedValue(mockUser),
  };

  const mockWalletRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockWalletRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should login and issue access and refresh tokens', async () => {
    const testUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      isSuspended: false,
      suspensionReason: null,
      refreshToken: null,
      refreshTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    const testWallet: Wallet = {
      id: 'wallet-id',
      publicKey: 'GTESTPUBLICKEY',
      userId: testUser.id,
      createdAt: new Date(),
    } as Wallet;

    mockWalletRepo.findOne.mockResolvedValue(testWallet);
    mockUserRepo.findOne.mockResolvedValue(testUser);
    mockUserRepo.update.mockResolvedValue(testUser);

    const result = await authService.login({
      publicKey: testWallet.publicKey,
      signature: 'dummy-signature',
      message: 'dummy-message',
    });

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.publicKey).toBe(testWallet.publicKey);
    expect(result.userId).toBe(testUser.id);
    expect(mockUserRepo.update).toHaveBeenCalledWith(testUser.id, expect.objectContaining({
      refreshToken: expect.any(String),
      refreshTokenExpiry: expect.any(Date),
    }));
  });

  it('should refresh and rotate the refresh token', async () => {
    let currentRefreshToken = 'old-refresh-token';
    const testUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      isSuspended: false,
      suspensionReason: null,
      refreshToken: currentRefreshToken,
      refreshTokenExpiry: new Date(Date.now() + 10000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    const testWallet: Wallet = {
      id: 'wallet-id',
      publicKey: 'GTESTPUBLICKEY',
      userId: testUser.id,
      createdAt: new Date(),
    } as Wallet;

    mockUserRepo.findOne.mockImplementation(async (criteria: { where?: { refreshToken?: string } }) => {
      if (criteria.where?.refreshToken === currentRefreshToken) {
        return testUser;
      }
      return null;
    });

    mockWalletRepo.findOne.mockResolvedValue(testWallet);
    mockUserRepo.update.mockImplementation(async (_id: string, update: Partial<User>) => {
      const refreshToken = update.refreshToken as string;
      const refreshTokenExpiry = update.refreshTokenExpiry as Date;
      currentRefreshToken = refreshToken;
      testUser.refreshToken = refreshToken;
      testUser.refreshTokenExpiry = refreshTokenExpiry;
      return testUser;
    });

    const firstResult = await authService.refresh(currentRefreshToken);

    expect(firstResult.accessToken).toBe('mock-access-token');
    expect(firstResult.refreshToken).toBeDefined();
    expect(firstResult.refreshToken).not.toBe('old-refresh-token');
    expect(mockUserRepo.update).toHaveBeenCalledWith(testUser.id, expect.objectContaining({
      refreshToken: firstResult.refreshToken,
      refreshTokenExpiry: expect.any(Date),
    }));

    await expect(authService.refresh('old-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an invalid refresh token', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
  describe('Account Lockout', () => {
    it('should lock account after 5 failed attempts', async () => {
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      jest.spyOn(service as any, 'verifySignature').mockResolvedValue(false);

      for (let i = 0; i < 4; i++) {
        try {
          await service.login({
            publicKey: mockPublicKey,
            signature: 'invalid-signature',
            message: 'test-message',
          });
        } catch {
          // Expected to fail
        }
      }

      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4,
        lockedUntil: null,
      });

      try {
        await service.login({
          publicKey: mockPublicKey,
          signature: 'invalid-signature',
          message: 'test-message',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        if (error instanceof HttpException) {
          expect(error.getStatus()).toBe(HttpStatus.LOCKED);
        }
      }
    });

    it('should return 423 with unlock time when account is locked', async () => {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        lockedUntil: lockUntil,
        failedLoginAttempts: 5,
      });

      try {
        await service.login({
          publicKey: mockPublicKey,
          signature: 'invalid-signature',
          message: 'test-message',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        if (error instanceof HttpException) {
          expect(error.getStatus()).toBe(HttpStatus.LOCKED);
        }
      }
    });

    it('should reset failed attempts on successful login', async () => {
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);
      
      const userWithAttempts = {
        ...mockUser,
        failedLoginAttempts: 3,
        lockedUntil: null,
      };
      mockUserRepository.findOne.mockResolvedValue(userWithAttempts);
      
      jest.spyOn(service as any, 'verifySignature').mockResolvedValue(true);

      const result = await service.login({
        publicKey: mockPublicKey,
        signature: 'valid-signature',
        message: 'test-message',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('publicKey', mockPublicKey);
      expect(mockUserRepository.save).toHaveBeenCalled();
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.failedLoginAttempts).toBe(0);
      expect(savedUser.lockedUntil).toBeNull();
    });
  });
});
