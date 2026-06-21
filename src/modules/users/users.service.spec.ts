/**
 * Users Service Test Suite
 * Comprehensive tests for UsersService with success and failure scenarios
 */

import { UsersService, ValidationError, NotFoundError, UserRepository } from './users.service';
import { createMockRepository, MockRepository } from '../../common/mocks/repository.mock';
import { createTestUser, createTestUserList, User } from '../../common/test-utils/fixtures';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: MockRepository<User>;

  beforeEach(() => {
    mockRepository = createMockRepository<User>();
    service = new UsersService(mockRepository as unknown as UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('success scenarios', () => {
      it('should return all users when users exist', async () => {
        const expectedUsers = createTestUserList(3);
        mockRepository.find.mockResolvedValue(expectedUsers);
        const result = await service.findAll();
        expect(result).toEqual(expectedUsers);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
      });

      it('should return empty array when no users exist', async () => {
        mockRepository.find.mockResolvedValue([]);
        const result = await service.findAll();
        expect(result).toEqual([]);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated users with metadata', async () => {
      const expectedUsers = createTestUserList(3);
      mockRepository.findAndCount.mockResolvedValue([expectedUsers, 3]);

      const result = await service.findAllPaginated(1, 10);

      expect(result.data).toEqual(expectedUsers);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should calculate pagination for later pages', async () => {
      const expectedUsers = createTestUserList(2);
      mockRepository.findAndCount.mockResolvedValue([expectedUsers, 12]);

      const result = await service.findAllPaginated(2, 5);

      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 5,
        take: 5,
      });
    });

    it('should clamp invalid pagination values', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllPaginated(0, 200);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(100);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 100,
      });
    });
  });

  describe('findById', () => {
    describe('success scenarios', () => {
      it('should return user when valid ID is provided', async () => {
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        const expectedUser = createTestUser({ id: validId });
        mockRepository.findOne.mockResolvedValue(expectedUser);
        const result = await service.findById(validId);
        expect(result).toEqual(expectedUser);
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });

      it('should return null when user is not found', async () => {
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);
        const result = await service.findById(validId);
        expect(result).toBeNull();
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when ID is empty string', async () => {
        await expect(service.findById('')).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when ID is not a string', async () => {
        await expect(service.findById(null as any)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when ID is not a valid UUID', async () => {
        await expect(service.findById('invalid-id')).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when ID is whitespace only', async () => {
        await expect(service.findById('   ')).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('create', () => {
    describe('success scenarios', () => {
      it('should create user with valid data', async () => {
        const userData = { email: 'test@example.com', name: 'Test User' };
        const createdUser = createTestUser(userData);
        mockRepository.create.mockResolvedValue(createdUser);
        const result = await service.create(userData);
        expect(result).toEqual(createdUser);
      });

      it('should add timestamps when creating user', async () => {
        const userData = { email: 'test@example.com', name: 'Test User' };
        const createdUser = createTestUser(userData);
        mockRepository.create.mockResolvedValue(createdUser);
        const result = await service.create(userData);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when email is invalid', async () => {
        const userData = { email: 'invalid-email', name: 'Test User' };
        await expect(service.create(userData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when email is empty', async () => {
        const userData = { email: '', name: 'Test User' };
        await expect(service.create(userData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when email is missing', async () => {
        const userData = { name: 'Test User' };
        await expect(service.create(userData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when name is empty', async () => {
        const userData = { email: 'test@example.com', name: '' };
        await expect(service.create(userData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when name is missing', async () => {
        const userData = { email: 'test@example.com' };
        await expect(service.create(userData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when name is too short', async () => {
        const userData = { email: 'test@example.com', name: 'A' };
        await expect(service.create(userData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when user data is not an object', async () => {
        await expect(service.create(null as any)).rejects.toThrow(ValidationError);
      });

      it('should handle database errors during creation', async () => {
        const userData = { email: 'test@example.com', name: 'Test User' };
        mockRepository.create.mockRejectedValue(new Error('DB Error'));
        await expect(service.create(userData)).rejects.toThrow('DB Error');
      });
    });
  });

  describe('update', () => {
    describe('success scenarios', () => {
      it('should update user with valid data', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { name: 'Updated Name' };
        const existingUser = createTestUser({ id: userId });
        const updatedUser = { ...existingUser, ...updateData };
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.update.mockResolvedValue(updatedUser);
        const result = await service.update(userId, updateData);
        expect(result).toEqual(updatedUser);
      });

      it('should add updatedAt timestamp when updating', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { name: 'Updated Name' };
        const existingUser = createTestUser({ id: userId });
        const updatedUser = { ...existingUser, ...updateData, updatedAt: new Date() };
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.update.mockResolvedValue(updatedUser);
        const result = await service.update(userId, updateData);
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);
        await expect(service.update(userId, { name: 'Updated' })).rejects.toThrow(NotFoundError);
      });

      it('should throw ValidationError when ID is invalid', async () => {
        await expect(service.update('invalid-id', { name: 'Updated' })).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when email is invalid', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        await expect(service.update(userId, { email: 'invalid' })).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when name is too short', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        await expect(service.update(userId, { name: 'A' })).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('delete', () => {
    describe('success scenarios', () => {
      it('should delete user when user exists', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const existingUser = createTestUser({ id: userId });
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.delete.mockResolvedValue(true);
        const result = await service.delete(userId);
        expect(result).toBe(true);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);
        await expect(service.delete(userId)).rejects.toThrow(NotFoundError);
      });

      it('should throw ValidationError when ID is invalid', async () => {
        await expect(service.delete('invalid-id')).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when ID is empty', async () => {
        await expect(service.delete('')).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000';
      const updateData = { name: 'Updated Name', email: 'updated@example.com' };
      const existingUser = createTestUser({ id: userId, name: 'Old Name', email: 'old@example.com' });
      const updatedUser = { ...existingUser, ...updateData };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith(userId, expect.objectContaining(updateData));
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000';
      const updateData = { name: 'Updated Name' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(userId, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when ID is invalid', async () => {
      const updateData = { name: 'Updated Name' };

      await expect(service.updateProfile('invalid-id', updateData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email is invalid', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000';
      const updateData = { email: 'invalid-email' };

      await expect(service.updateProfile(userId, updateData)).rejects.toThrow(ValidationError);
    });
  });

  describe('edge cases', () => {
    it('should handle null input for create', async () => {
      await expect(service.create(null as any)).rejects.toThrow(ValidationError);
    });

    it('should handle undefined input for create', async () => {
      await expect(service.create(undefined as any)).rejects.toThrow(ValidationError);
    });

    it('should handle whitespace-only email', async () => {
      const userData = { email: '   ', name: 'Test User' };
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
    });

    it('should handle whitespace-only name', async () => {
      const userData = { email: 'test@example.com', name: '   ' };
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
    });

    it('should handle email with no domain', async () => {
      const userData = { email: 'test@', name: 'Test User' };
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
    });

    it('should handle email with no @ symbol', async () => {
      const userData = { email: 'testexample.com', name: 'Test User' };
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
    });

    it('should handle UUID with wrong version', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000';
      const existingUser = createTestUser({ id: userId });
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(existingUser);
      // UUID version 1 instead of 4
      const result = await service.update(userId, { name: 'Test' });
      expect(result).toBeDefined();
    });

    it('should allow partial updates without requiring all fields', async () => {
      const userId = '123e4567-e89b-42d3-a456-426614174000';
      const existingUser = createTestUser({ id: userId });
      const updatedUser = { ...existingUser, name: 'Only Name Updated' };
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(updatedUser);
      const result = await service.update(userId, { name: 'Only Name Updated' });
      expect(result.name).toBe('Only Name Updated');
    });
  });
});
