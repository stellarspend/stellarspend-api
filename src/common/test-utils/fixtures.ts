/**
 * Test fixture utilities for creating reusable test data
 * Provides factory functions for common entities with override support
 */

/**
 * User entity interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction entity interface
 */
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Budget entity interface
 */
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a test user with optional overrides
 * @param overrides - Partial user properties to override defaults
 * @returns User object with test data
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Creates a test transaction with optional overrides
 * @param overrides - Partial transaction properties to override defaults
 * @returns Transaction object with test data
 */
export function createTestTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    amount: 50.00,
    category: 'groceries',
    date: new Date('2024-01-15T10:30:00Z'),
    description: 'Weekly shopping',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    ...overrides
  };
}

/**
 * Creates a test budget with optional overrides
 * @param overrides - Partial budget properties to override defaults
 * @returns Budget object with test data
 */
export function createTestBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: '123e4567-e89b-12d3-a456-426614174002',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    category: 'groceries',
    limit: 500.00,
    period: 'monthly',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-31T23:59:59Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Creates a list of test users
 * @param count - Number of users to create
 * @returns Array of User objects
 */
export function createTestUserList(count: number = 3): User[] {
  return Array.from({ length: count }, (_, index) => 
    createTestUser({
      id: `123e4567-e89b-12d3-a456-42661417400${index}`,
      email: `user${index}@example.com`,
      name: `Test User ${index}`
    })
  );
}

/**
 * Creates a list of test transactions
 * @param count - Number of transactions to create
 * @param overrides - Optional overrides to apply to all transactions
 * @returns Array of Transaction objects
 */
export function createTestTransactionList(count: number = 3, overrides: Partial<Transaction> = {}): Transaction[] {
  return Array.from({ length: count }, (_, index) => 
    createTestTransaction({
      id: `123e4567-e89b-12d3-a456-42661417400${index + 1}`,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 50.00 + (index * 10),
      category: index % 2 === 0 ? 'groceries' : 'entertainment',
      description: `Transaction ${index}`,
      date: new Date(`2024-01-${15 + index}T10:30:00Z`),
      ...overrides
    })
  );
}

/**
 * Creates a list of test budgets
 * @param count - Number of budgets to create
 * @param overrides - Optional overrides to apply to all budgets
 * @returns Array of Budget objects
 */
export function createTestBudgetList(count: number = 3, overrides: Partial<Budget> = {}): Budget[] {
  const categories = ['groceries', 'entertainment', 'transportation'];
  const periods: Array<'monthly' | 'weekly' | 'yearly'> = ['monthly', 'weekly', 'yearly'];
  
  return Array.from({ length: count }, (_, index) => 
    createTestBudget({
      id: `123e4567-e89b-12d3-a456-42661417400${index + 2}`,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      category: categories[index % categories.length],
      limit: 500.00 + (index * 100),
      period: periods[index % periods.length],
      ...overrides
    })
  );
}

/**
 * Creates an invalid user for testing validation
 * @returns Partial user with invalid data
 */
export function createInvalidUser(): Partial<User> {
  return {
    email: 'invalid-email',
    name: ''
  };
}

/**
 * Creates an invalid transaction for testing validation
 * @returns Partial transaction with invalid data
 */
export function createInvalidTransaction(): Partial<Transaction> {
  return {
    userId: '',
    amount: -50.00,
    category: '',
    date: new Date('invalid-date'),
    description: ''
  };
}

/**
 * Creates an invalid budget for testing validation
 * @returns Partial budget with invalid data
 */
export function createInvalidBudget(): Partial<Budget> {
  return {
    userId: '',
    category: '',
    limit: -100.00,
    period: 'invalid' as any,
    startDate: new Date('invalid-date'),
    endDate: new Date('invalid-date')
  };
}

/**
 * Centralized test fixtures object for easy access
 */
export const fixtures = {
  users: {
    valid: createTestUser(),
    invalid: createInvalidUser(),
    list: createTestUserList()
  },
  transactions: {
    valid: createTestTransaction(),
    invalid: createInvalidTransaction(),
    list: createTestTransactionList()
  },
  budgets: {
    valid: createTestBudget(),
    invalid: createInvalidBudget(),
    list: createTestBudgetList()
  }
};
