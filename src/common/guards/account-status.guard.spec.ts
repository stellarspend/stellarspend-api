import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountStatusGuard } from './account-status.guard';
import { User } from '../../modules/users/user.entity';

describe('AccountStatusGuard', () => {
  let guard: AccountStatusGuard;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const createExecutionContext = (requestUser?: { userId?: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: requestUser }),
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountStatusGuard,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    guard = module.get<AccountStatusGuard>(AccountStatusGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow an active account through', async () => {
    userRepository.findOne.mockResolvedValue({
      id: userId,
      isSuspended: false,
      suspensionReason: null,
    } as User);

    const result = await guard.canActivate(createExecutionContext({ userId }));

    expect(result).toBe(true);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: userId },
      select: ['id', 'isSuspended', 'suspensionReason'],
    });
  });

  it('should return 403 for a suspended account', async () => {
    userRepository.findOne.mockResolvedValue({
      id: userId,
      isSuspended: true,
      suspensionReason: 'Terms violation',
    } as User);

    const error = await guard
      .canActivate(createExecutionContext({ userId }))
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getStatus()).toBe(403);
  });

  it('should return 401 for a missing account', async () => {
    userRepository.findOne.mockResolvedValue(null);

    const error = await guard
      .canActivate(createExecutionContext({ userId }))
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getStatus()).toBe(401);
  });
});
