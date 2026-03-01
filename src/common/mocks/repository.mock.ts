/**
 * Generic mock repository factory for testing
 * Provides mock implementations of common repository methods
 */

export interface MockRepository<T> {
  find: jest.Mock<Promise<T[]>>;
  findOne: jest.Mock<Promise<T | null>>;
  findByUserId: jest.Mock<Promise<T[]>>;
  findByDateRange: jest.Mock<Promise<T[]>>;
  findByCategory: jest.Mock<Promise<T[]>>;
  findByPeriod: jest.Mock<Promise<T[]>>;
  create: jest.Mock<Promise<T>>;
  update: jest.Mock<Promise<T>>;
  delete: jest.Mock<Promise<boolean>>;
}

/**
 * Creates a mock repository with all standard CRUD methods
 * @returns MockRepository with jest mock functions
 */
export function createMockRepository<T>(): MockRepository<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    findByDateRange: jest.fn(),
    findByCategory: jest.fn(),
    findByPeriod: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}
