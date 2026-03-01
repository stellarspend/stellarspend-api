/**
 * Database connection mocks for testing
 * Provides mock implementations for database connections and query builders
 */

export interface MockDatabaseConnection {
  connect: jest.Mock<Promise<void>>;
  disconnect: jest.Mock<Promise<void>>;
  query: jest.Mock<Promise<any>>;
  transaction: jest.Mock<Promise<any>>;
}

/**
 * Creates a mock database connection
 * @returns MockDatabaseConnection with jest mock functions
 */
export function createMockDatabaseConnection(): MockDatabaseConnection {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
    transaction: jest.fn()
  };
}

export interface MockQueryBuilder {
  select: jest.Mock;
  where: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  execute: jest.Mock<Promise<any>>;
}

/**
 * Creates a mock query builder for chainable query construction
 * @returns MockQueryBuilder with jest mock functions that return this for chaining
 */
export function createMockQueryBuilder(): MockQueryBuilder {
  const builder: any = {
    select: jest.fn(),
    where: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn()
  };

  // Enable method chaining
  builder.select.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);

  return builder;
}
