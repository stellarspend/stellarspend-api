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
    // Initialize mock repository with fresh mocks for each test
    mockRepository = createMockRepository<User>();
    service = new UsersService(mockRepository as unknown as UserRepository);
  });

  afterEach(() => {
    // Clear all mocks to ensure test isolation
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('success scenarios', () => {
      it('should return all users when users exist', async () => {
        // Arrange
        const expectedUsers = createTestUserList(3);
        mockRepository.find.mockResolvedValue(expectedUsers);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual(expectedUsers);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
        expect(mockRepository.find).toHaveBeenCalledWith();
      });

      it('should return empty array when no users exist', async () => {
        // Arrange
        mockRepository.find.mockResolvedValue([]);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('findById', () => {
    describe('success scenarios', () => {
      it('should return user when valid ID is provided', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        const expectedUser = createTestUser({ id: validId });
        mockRepository.findOne.mockResolvedValue(expectedUser);

        // Act
        const result = await service.findById(validId);

        // Assert
        expect(result).toEqual(expectedUser);
        expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });

      it('should return null when user is not found', async () => {
        // Arrange
        const validId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);

        // Act
        const result = await service.findById(validId);

        // Assert
        expect(result).toBeNull();
        expect(mockRepository.findOne).toHaveBeenCalledWith(validId);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when ID is empty string', async () => {
        // Act & Assert
        await expect(service.findById('')).rejects.toThrow(ValidationError);
        await expect(service.findById('')).rejects.toThrow('User ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is not a string', async () => {
        // Act & Assert
        await expect(service.findById(null as any)).rejects.toThrow(ValidationError);
        await expect(service.findById(null as any)).rejects.toThrow('User ID is required and must be a string');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is not a valid UUID', async () => {
        // Act & Assert
        await expect(service.findById('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.findById('invalid-id')).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is whitespace only', async () => {
        // Act & Assert
        await expect(service.findById('   ')).rejects.toThrow(ValidationError);
        await expect(service.findById('   ')).rejects.toThrow('User ID cannot be empty');
      });
    });
  });

  describe('create', () => {
    describe('success scenarios', () => {
      it('should create user with valid data', async () => {
        // Arrange
        const userData = {
          email: 'newuser@example.com',
          name: 'New User'
        };
        const expectedUser = createTestUser(userData);
        mockRepository.create.mockResolvedValue(expectedUser);

        // Act
        const result = await service.create(userData);

        // Assert
        expect(result).toEqual(expectedUser);
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: userData.email,
            name: userData.name,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should add timestamps when creating user', async () => {
        // Arrange
        const userData = {
          email: 'test@example.com',
          name: 'Test User'
        };
        const expectedUser = createTestUser(userData);
        mockRepository.create.mockResolvedValue(expectedUser);

        // Act
        await service.create(userData);

        // Assert
        const callArgs = mockRepository.create.mock.calls[0][0];
        expect(callArgs.createdAt).toBeInstanceOf(Date);
        expect(callArgs.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('failure scenarios', () => {
      it('should throw ValidationError when email is invalid', async () => {
        // Arrange
        const invalidUserData = {
          email: 'invalid-email',
          name: 'Test User'
        };

        // Act & Assert
        await expect(service.create(invalidUserData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidUserData)).rejects.toThrow('Email must be a valid email address');
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when email is empty', async () => {
        // Arrange
        const invalidUserData = {
          email: '',
          name: 'Test User'
        };

        // Act & Assert
        await expect(service.create(invalidUserData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidUserData)).rejects.toThrow('Email is required and cannot be empty');
      });

      it('should throw ValidationError when email is missing', async () => {
        // Arrange
        const invalidUserData = {
          name: 'Test User'
        };

        // Act & Assert
        await expect(service.create(invalidUserData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidUserData)).rejects.toThrow('Email is required');
      });

      it('should throw ValidationError when name is empty', async () => {
        // Arrange
        const invalidUserData = {
          email: 'test@example.com',
          name: ''
        };

        // Act & Assert
        await expect(service.create(invalidUserData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidUserData)).rejects.toThrow('Name is required and cannot be empty');
      });

      it('should throw ValidationError when name is missing', async () => {
        // Arrange
        const invalidUserData = {
          email: 'test@example.com'
        };

        // Act & Assert
        await expect(service.create(invalidUserData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidUserData)).rejects.toThrow('Name is required');
      });

      it('should throw ValidationError when name is too short', async () => {
        // Arrange
        const invalidUserData = {
          email: 'test@example.com',
          name: 'A'
        };

        // Act & Assert
        await expect(service.create(invalidUserData)).rejects.toThrow(ValidationError);
        await expect(service.create(invalidUserData)).rejects.toThrow('Name must be at least 2 characters long');
      });

      it('should throw ValidationError when user data is not an object', async () => {
        // Act & Assert
        await expect(service.create(null as any)).rejects.toThrow(ValidationError);
        await expect(service.create(null as any)).rejects.toThrow('User data is required and must be an object');
      });

      it('should handle database errors during creation', async () => {
        // Arrange
        const userData = {
          email: 'test@example.com',
          name: 'Test User'
        };
        const dbError = new Error('Database connection failed');
        mockRepository.create.mockRejectedValue(dbError);

        // Act & Assert
        await expect(service.create(userData)).rejects.toThrow('Database connection failed');
      });
    });
  });

  describe('update', () => {
    describe('success scenarios', () => {
      it('should update user with valid data', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const existingUser = createTestUser({ id: userId });
        const updateData = {
          name: 'Updated Name'
        };
        const updatedUser = createTestUser({ ...existingUser, ...updateData });
        
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.update.mockResolvedValue(updatedUser);

        // Act
        const result = await service.update(userId, updateData);

        // Assert
        expect(result).toEqual(updatedUser);
        expect(mockRepository.findOne).toHaveBeenCalledWith(userId);
        expect(mockRepository.update).toHaveBeenCalledWith(
          userId,
          expect.objectContaining({
            name: updateData.name,
            updatedAt: expect.any(Date)
          })
        );
      });

      it('should add updatedAt timestamp when updating', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const existingUser = createTestUser({ id: userId });
        const updateData = { name: 'Updated Name' };
        
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.update.mockResolvedValue(createTestUser());

        // Act
        await service.update(userId, updateData);

        // Assert
        const callArgs = mockRepository.update.mock.calls[0][1];
        expect(callArgs.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const updateData = { name: 'Updated Name' };
        mockRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.update(userId, updateData)).rejects.toThrow(NotFoundError);
        await expect(service.update(userId, updateData)).rejects.toThrow(`User with ID ${userId} not found`);
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is invalid', async () => {
        // Arrange
        const updateData = { name: 'Updated Name' };

        // Act & Assert
        await expect(service.update('invalid-id', updateData)).rejects.toThrow(ValidationError);
        await expect(service.update('invalid-id', updateData)).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when email is invalid', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const existingUser = createTestUser({ id: userId });
        const updateData = { email: 'invalid-email' };
        mockRepository.findOne.mockResolvedValue(existingUser);

        // Act & Assert
        await expect(service.update(userId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(userId, updateData)).rejects.toThrow('Email must be a valid email address');
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when name is too short', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const existingUser = createTestUser({ id: userId });
        const updateData = { name: 'A' };
        mockRepository.findOne.mockResolvedValue(existingUser);

        // Act & Assert
        await expect(service.update(userId, updateData)).rejects.toThrow(ValidationError);
        await expect(service.update(userId, updateData)).rejects.toThrow('Name must be at least 2 characters long');
      });
    });
  });

  describe('delete', () => {
    describe('success scenarios', () => {
      it('should delete user when user exists', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        const existingUser = createTestUser({ id: userId });
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.delete.mockResolvedValue(true);

        // Act
        const result = await service.delete(userId);

        // Assert
        expect(result).toBe(true);
        expect(mockRepository.findOne).toHaveBeenCalledWith(userId);
        expect(mockRepository.delete).toHaveBeenCalledWith(userId);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('failure scenarios', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        // Arrange
        const userId = '123e4567-e89b-42d3-a456-426614174000';
        mockRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete(userId)).rejects.toThrow(NotFoundError);
        await expect(service.delete(userId)).rejects.toThrow(`User with ID ${userId} not found`);
        expect(mockRepository.delete).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is invalid', async () => {
        // Act & Assert
        await expect(service.delete('invalid-id')).rejects.toThrow(ValidationError);
        await expect(service.delete('invalid-id')).rejects.toThrow('User ID must be a valid UUID');
        expect(mockRepository.findOne).not.toHaveBeenCalled();
      });

      it('should throw ValidationError when ID is empty', async () => {
        // Act & Assert
        await expect(service.delete('')).rejects.toThrow(ValidationError);
        await expect(service.delete('')).rejects.toThrow('User ID is required and must be a string');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null input for create', async () => {
      // Act & Assert
      await expect(service.create(null as any)).rejects.toThrow(ValidationError);
      await expect(service.create(null as any)).rejects.toThrow('User data is required and must be an object');
    });

    it('should handle undefined input for create', async () => {
      // Act & Assert
      await expect(service.create(undefined as any)).rejects.toThrow(ValidationError);
      await expect(service.create(undefined as any)).rejects.toThrow('User data is required and must be an object');
    });

    it('should handle whitespace-only email', async () => {
      // Arrange
      const userData = {
        email: '   ',
        name: 'Test User'
      };

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
      await expect(service.create(userData)).rejects.toThrow('Email is required and cannot be empty');
    });

    it('should handle whitespace-only name', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: '   '
      };

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
      await expect(service.create(userData)).rejects.toThrow('Name is required and cannot be empty');
    });

    it('should handle email with no domain', async () => {
      // Arrange
      const userData = {
        email: 'test@',
        name: 'Test User'
      };

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
      await expect(service.create(userData)).rejects.toThrow('Email must be a valid email address');
    });

    it('should handle email with no @ symbol', async () => {
      // Arrange
      const userData = {
        email: 'testexample.com',
        name: 'Test User'
      };

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(ValidationError);
      await expect(service.create(userData)).rejects.toThrow('Email must be a valid email address');
    });

    it('should handle UUID with wrong version', async () => {
      // Arrange - UUID v1 instead of v4
      const invalidUuid = '123e4567-e89b-12d3-a456-426614174000';

      // Act & Assert
      await expect(service.findById(invalidUuid)).rejects.toThrow(ValidationError);
      await expect(service.findById(invalidUuid)).rejects.toThrow('User ID must be a valid UUID');
    });

    it('should allow partial updates without requiring all fields', async () => {
      // Arrange
      const userId = '123e4567-e89b-42d3-a456-426614174000';
      const existingUser = createTestUser({ id: userId });
      const updateData = { name: 'Only Name Updated' };
      const updatedUser = createTestUser({ ...existingUser, ...updateData });
      
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(userId, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: updateData.name,
          updatedAt: expect.any(Date)
        })
      );
    });
  });
});
