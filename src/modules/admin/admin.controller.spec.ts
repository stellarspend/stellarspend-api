/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole, User as UserEntity } from '../users/user.entity';

const createAdminTestUser = (
  overrides: Partial<UserEntity> = {},
): UserEntity =>
  ({
    id: '123e4567-e89b-42d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    isSuspended: false,
    suspensionReason: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }) as UserEntity;

describe('AdminController', () => {
  let controller: AdminController;
  let mockUsersService: jest.Mocked<Pick<UsersService, 'findAllPaginated' | 'suspend' | 'unsuspend'>>;

  beforeEach(() => {
    mockUsersService = {
      findAllPaginated: jest.fn(),
      suspend: jest.fn(),
      unsuspend: jest.fn(),
    };

    controller = new AdminController(mockUsersService as unknown as UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users with metadata', async () => {
      const users = [
        createAdminTestUser({
          id: '123e4567-e89b-42d3-a456-426614174000',
          role: UserRole.ADMIN,
        }),
        createAdminTestUser({
          id: '123e4567-e89b-42d3-a456-426614174001',
          email: 'user@example.com',
          name: 'Regular User',
          role: UserRole.USER,
        }),
      ];
      const paginatedResult = {
        data: users,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockUsersService.findAllPaginated.mockResolvedValue(paginatedResult as never);

      const result = await controller.listUsers({ page: 1, limit: 10 });

      expect(mockUsersService.findAllPaginated).toHaveBeenCalledWith(1, 10);
      expect(result.success).toBe(true);
      expect(result.meta).toEqual(paginatedResult.meta);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        role: UserRole.ADMIN,
        isSuspended: false,
        suspensionReason: null,
        createdAt: users[0].createdAt,
        updatedAt: users[0].updatedAt,
      });
    });

    it('should use default pagination values from query dto', async () => {
      mockUsersService.findAllPaginated.mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      await controller.listUsers({ page: 1, limit: 10 });

      expect(mockUsersService.findAllPaginated).toHaveBeenCalledWith(1, 10);
    });
  });
});

describe('RolesGuard (admin access)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (role?: UserRole): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  it('should allow admin users', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createMockContext(UserRole.ADMIN))).toBe(true);
  });

  it('should deny non-admin users with 403 behavior', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createMockContext(UserRole.USER))).toBe(false);
  });

  it('should deny unauthenticated requests', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createMockContext())).toBe(false);
  });

  it('should read required roles from route metadata', () => {
    const getAllAndOverrideSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(UserRole.ADMIN);

    guard.canActivate(context);

    expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.arrayContaining([expect.any(Function), expect.any(Function)]),
    );
  });
});
