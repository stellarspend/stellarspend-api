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
    mockUserRepo.update.mockResolvedValue(testUser as any);

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

    mockUserRepo.findOne.mockImplementation(async ({ where }) => {
      if (where?.refreshToken === currentRefreshToken) {
        return testUser;
      }
      return null;
    });

    mockWalletRepo.findOne.mockResolvedValue(testWallet);
    mockUserRepo.update.mockImplementation(async (_id, update) => {
      currentRefreshToken = update.refreshToken as string;
      testUser.refreshToken = update.refreshToken as string;
      testUser.refreshTokenExpiry = update.refreshTokenExpiry as Date;
      return testUser as any;
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
  });
});
