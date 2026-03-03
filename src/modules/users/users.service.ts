/**
 * Users Service
 * Handles business logic for user management with CRUD operations
 */

import { User } from '../../common/test-utils/fixtures';

export interface UserRepository {
  find(): Promise<User[]>;
  findOne(id: string): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UsersService {
  constructor(private readonly repository: UserRepository) {}

  /**
   * Retrieves all users
   * @returns Promise resolving to array of users
   */
  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  /**
   * Finds a user by ID
   * @param id - User ID to search for
   * @returns Promise resolving to user or null if not found
   * @throws ValidationError if ID is invalid
   */
  async findById(id: string): Promise<User | null> {
    this.validateId(id);
    return this.repository.findOne(id);
  }

  /**
   * Creates a new user
   * @param userData - Partial user data for creation
   * @returns Promise resolving to created user with generated ID
   * @throws ValidationError if user data is invalid
   */
  async create(userData: Partial<User>): Promise<User> {
    this.validateUserData(userData);
    
    const user: Partial<User> = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return this.repository.create(user);
  }

  /**
   * Updates an existing user
   * @param id - User ID to update
   * @param userData - Partial user data for update
   * @returns Promise resolving to updated user
   * @throws ValidationError if ID or data is invalid
   * @throws NotFoundError if user doesn't exist
   */
  async update(id: string, userData: Partial<User>): Promise<User> {
    this.validateId(id);
    this.validateUserData(userData, true);
    
    const existingUser = await this.repository.findOne(id);
    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    
    const updatedUser: Partial<User> = {
      ...userData,
      updatedAt: new Date()
    };
    
    return this.repository.update(id, updatedUser);
  }

  /**
   * Deletes a user by ID
   * @param id - User ID to delete
   * @returns Promise resolving to true if deleted successfully
   * @throws ValidationError if ID is invalid
   * @throws NotFoundError if user doesn't exist
   */
  async delete(id: string): Promise<boolean> {
    this.validateId(id);
    
    const existingUser = await this.repository.findOne(id);
    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    
    return this.repository.delete(id);
  }

  /**
   * Validates user ID format
   * @param id - ID to validate
   * @throws ValidationError if ID is invalid
   */
  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('User ID is required and must be a string');
    }
    
    if (id.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty');
    }
    
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  /**
   * Validates user data
   * @param userData - User data to validate
   * @param isUpdate - Whether this is an update operation (allows partial data)
   * @throws ValidationError if data is invalid
   */
  private validateUserData(userData: Partial<User>, isUpdate: boolean = false): void {
    if (!userData || typeof userData !== 'object') {
      throw new ValidationError('User data is required and must be an object');
    }

    // Email validation
    if (userData.email !== undefined) {
      if (typeof userData.email !== 'string' || userData.email.trim().length === 0) {
        throw new ValidationError('Email is required and cannot be empty');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new ValidationError('Email must be a valid email address');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Email is required');
    }

    // Name validation
    if (userData.name !== undefined) {
      if (typeof userData.name !== 'string' || userData.name.trim().length === 0) {
        throw new ValidationError('Name is required and cannot be empty');
      }
      
      if (userData.name.trim().length < 2) {
        throw new ValidationError('Name must be at least 2 characters long');
      }
    } else if (!isUpdate) {
      throw new ValidationError('Name is required');
    }
  }
}
