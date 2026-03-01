# Design Document: Unit Tests for Core Modules

## Overview

This design document outlines the implementation strategy for comprehensive unit testing of the StellarSpend API core modules. The testing infrastructure will leverage Jest with TypeScript support (ts-jest) to provide fast, isolated, and reliable unit tests. The design emphasizes proper mocking of database interactions, comprehensive coverage of both success and failure scenarios, and achieving 90% code coverage across all service modules.

The testing approach follows industry best practices including the Arrange-Act-Assert (AAA) pattern, dependency injection for testability, and clear separation between unit tests and integration tests. All tests will be co-located with their source files using the `.spec.ts` naming convention for easy discovery and maintenance.

## Architecture

### Testing Layer Structure

```
src/
├── modules/
│   ├── users/
│   │   ├── users.service.ts
│   │   ├── users.service.spec.ts
│   │   ├── users.controller.ts
│   │   └── users.controller.spec.ts
│   ├── transactions/
│   │   ├── transactions.service.ts
│   │   ├── transactions.service.spec.ts
│   │   ├── transactions.controller.ts
│   │   └── transactions.controller.spec.ts
│   └── budgets/
│       ├── budgets.service.ts
│       ├── budgets.service.spec.ts
│       ├── budgets.controller.ts
│       └── budgets.controller.spec.ts
├── common/
│   ├── mocks/
│   │   ├── database.mock.ts
│   │   ├── repository.mock.ts
│   │   └── index.ts
│   └── test-utils/
│       ├── fixtures.ts
│       └── helpers.ts
└── jest.config.js
```

### Test Execution Flow

1. **Test Discovery**: Jest scans for `**/*.spec.ts` files
2. **Setup Phase**: `beforeEach` hooks initialize mocks and test data
3. **Test Execution**: Individual test cases run in isolation
4. **Assertion Phase**: Verify expected outcomes and mock interactions
5. **Cleanup Phase**: `afterEach` hooks reset mocks and clear state
6. **Coverage Report**: Jest generates coverage metrics and reports

### Mocking Strategy

The design uses a layered mocking approach:

- **Database Layer Mocks**: Mock database connections and query builders
- **Repository Layer Mocks**: Mock repository methods that interact with the database
- **External Service Mocks**: Mock any external API calls or third-party services
- **Utility Mocks**: Mock date/time functions, random generators, etc. for deterministic tests

## Components and Interfaces

### Jest Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/modules/**/*.controller.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.mock.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageDirectory: 'coverage',
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Mock Factory Interface

```typescript
// src/common/mocks/repository.mock.ts
interface MockRepository<T> {
  find: jest.Mock<Promise<T[]>>;
  findOne: jest.Mock<Promise<T | null>>;
  create: jest.Mock<Promise<T>>;
  update: jest.Mock<Promise<T>>;
  delete: jest.Mock<Promise<boolean>>;
}

function createMockRepository<T>(): MockRepository<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}
```

### Test Fixture Interface

```typescript
// src/common/test-utils/fixtures.ts
interface TestFixtures {
  users: {
    validUser: User;
    invalidUser: Partial<User>;
    userList: User[];
  };
  transactions: {
    validTransaction: Transaction;
    invalidTransaction: Partial<Transaction>;
    transactionList: Transaction[];
  };
  budgets: {
    validBudget: Budget;
    invalidBudget: Partial<Budget>;
    budgetList: Budget[];
  };
}
```

### Test Structure Pattern

Each test file follows this structure:

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockRepository: MockRepository<Entity>;
  
  beforeEach(() => {
    mockRepository = createMockRepository<Entity>();
    service = new ServiceName(mockRepository);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('methodName', () => {
    describe('success scenarios', () => {
      it('should return expected result when given valid input', async () => {
        // Arrange
        const input = fixtures.validInput;
        const expected = fixtures.expectedOutput;
        mockRepository.method.mockResolvedValue(expected);
        
        // Act
        const result = await service.methodName(input);
        
        // Assert
        expect(result).toEqual(expected);
        expect(mockRepository.method).toHaveBeenCalledWith(input);
        expect(mockRepository.method).toHaveBeenCalledTimes(1);
      });
    });
    
    describe('failure scenarios', () => {
      it('should throw error when given invalid input', async () => {
        // Arrange
        const invalidInput = fixtures.invalidInput;
        
        // Act & Assert
        await expect(service.methodName(invalidInput))
          .rejects
          .toThrow('Expected error message');
      });
    });
  });
});
```

## Data Models

### Test Data Fixtures

Test fixtures provide consistent, reusable test data:

```typescript
// Example User fixtures
const validUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
};

const invalidUser = {
  email: 'invalid-email',
  name: ''
};

// Example Transaction fixtures
const validTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  amount: 50.00,
  category: 'groceries',
  date: new Date('2024-01-15T10:30:00Z'),
  description: 'Weekly shopping'
};
```

### Mock Response Patterns

Common mock response patterns for different scenarios:

```typescript
// Success response
mockRepository.findOne.mockResolvedValue(validUser);

// Not found response
mockRepository.findOne.mockResolvedValue(null);

// Database error
mockRepository.create.mockRejectedValue(new Error('Database connection failed'));

// Validation error
mockRepository.update.mockRejectedValue(new ValidationError('Invalid email format'));

// Multiple results
mockRepository.find.mockResolvedValue([user1, user2, user3]);

// Empty results
mockRepository.find.mockResolvedValue([]);
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Test Isolation Through Mock Reset

*For any* sequence of test cases, when tests complete execution, all mocks should be reset to their initial state so that subsequent tests start with clean mock state and no test can affect another test's mock behavior.

**Validates: Requirements 2.5**

### Property 2: Mock Data Schema Validity

*For any* mock response configured in the test suite, the data structure returned by the mock should match the schema of the actual entity it represents, ensuring tests use realistic data that matches production data structures.

**Validates: Requirements 2.3**

### Property 3: No Real Database Connections in Tests

*For any* service module test execution, no actual database connections should be established, ensuring all database interactions use mocks and tests remain fast and isolated.

**Validates: Requirements 2.1**

### Property 4: Success Test Coverage Completeness

*For all* public methods in service modules, at least one test case should exist that validates the success scenario with valid inputs, ensuring every method has basic happy-path coverage.

**Validates: Requirements 3.1**

### Property 5: Success Tests Verify Return Values and Mock Interactions

*For any* success scenario test, the test should include assertions that verify both the correct return value and that mocked dependencies were called with the expected parameters, ensuring comprehensive validation of method behavior.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 6: Failure Test Coverage Completeness

*For all* service module methods that can throw errors or return error states, at least one test case should exist that validates the failure scenario, ensuring error handling is tested.

**Validates: Requirements 4.1**

### Property 7: Failure Tests Verify Error Details

*For any* failure scenario test, the test should verify that appropriate error messages or error objects are returned with sufficient detail to understand what went wrong, ensuring error handling provides useful information.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 8: Test File Naming Convention

*For any* service or controller module file, a corresponding test file with the `.spec.ts` extension should exist in the same directory, ensuring tests are co-located with source code for easy discovery.

**Validates: Requirements 6.1**

### Property 9: Test Structure Organization

*For any* test file, tests should be organized using `describe` blocks that group related tests by method or feature, and when multiple tests share setup logic, `beforeEach` hooks should be used, ensuring consistent and maintainable test structure.

**Validates: Requirements 6.2, 6.4**

### Property 10: Test Fixture Separation

*For any* test file, test data fixtures should be defined separately from test logic (either in a fixtures file or at the top of the test file), enabling reusability and making tests easier to understand.

**Validates: Requirements 6.5**

### Property 11: Mock Call Verification

*For any* test that uses mocked dependencies, the test should verify that mocks are called the expected number of times with the correct arguments, and when call order matters, the order should be verified, ensuring proper integration between components.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 12: Clear Test Failure Messages

*For any* test that fails, the test output should include clear error messages that explain what was expected versus what was received, making it easy to diagnose and fix issues.

**Validates: Requirements 7.3**

## Error Handling

### Test Execution Errors

**Database Mock Configuration Errors**:
- If a mock is not properly configured before a test runs, the test should fail with a clear message indicating which mock needs configuration
- Example: "Mock repository.findOne was called but no return value was configured"

**Assertion Failures**:
- When assertions fail, Jest provides detailed diff output showing expected vs actual values
- Custom error messages should be added to assertions to provide context
- Example: `expect(result).toEqual(expected, 'User creation should return user with generated ID')`

**Async Test Errors**:
- All async tests must use `async/await` or return promises to ensure proper error handling
- Unhandled promise rejections should cause test failures
- Timeout errors should indicate which test exceeded the time limit

### Coverage Threshold Violations

**Below 90% Coverage**:
- When coverage falls below the 90% threshold, Jest will fail the test run
- The coverage report will highlight which files and lines are not covered
- Developers should add tests to cover the missing lines/branches

**Excluded Files**:
- Test files (`.spec.ts`), mock files (`.mock.ts`), and configuration files are excluded from coverage
- Only service and controller files are included in coverage calculations

### Mock Verification Failures

**Unexpected Mock Calls**:
- If a mock is called when it shouldn't be, the test fails with details about the unexpected call
- Example: "Expected repository.delete to not be called, but it was called 1 time"

**Missing Mock Calls**:
- If an expected mock call doesn't occur, the test fails with details about what was expected
- Example: "Expected repository.create to be called with {...}, but it was not called"

**Incorrect Mock Arguments**:
- If a mock is called with wrong arguments, the test fails with a diff showing expected vs actual
- Example: "Expected repository.update to be called with {id: '123', name: 'John'}, but was called with {id: '123', name: 'Jane'}"

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based testing concepts to ensure comprehensive coverage:

**Unit Tests**:
- Verify specific examples and concrete scenarios
- Test edge cases (null, undefined, empty strings, boundary values)
- Test error conditions and exception handling
- Test integration points between components
- Fast execution (milliseconds per test)
- Deterministic outcomes

**Property-Based Testing Concepts**:
- While we won't use a dedicated property-based testing library, we apply property-based thinking
- Tests should verify general rules that hold across many inputs
- Use parameterized tests (test.each) to test multiple input combinations
- Focus on invariants that should always hold
- Example: "For any valid user input, creation should return a user with an ID"

### Test Organization

**Test File Structure**:
```typescript
describe('ServiceName', () => {
  // Setup and teardown
  beforeEach(() => { /* initialize mocks */ });
  afterEach(() => { /* cleanup */ });
  
  describe('methodName', () => {
    describe('success scenarios', () => {
      it('should handle valid input', () => { /* test */ });
      it('should handle edge case X', () => { /* test */ });
    });
    
    describe('failure scenarios', () => {
      it('should reject invalid input', () => { /* test */ });
      it('should handle database errors', () => { /* test */ });
    });
  });
});
```

### Coverage Configuration

**Minimum Coverage Thresholds**:
- Line Coverage: 90%
- Branch Coverage: 90%
- Function Coverage: 90%
- Statement Coverage: 90%

**Coverage Scope**:
- Include: All service files (`src/modules/**/*.service.ts`)
- Include: All controller files (`src/modules/**/*.controller.ts`)
- Exclude: Test files (`**/*.spec.ts`)
- Exclude: Mock files (`**/*.mock.ts`)
- Exclude: Configuration files

### Test Execution Strategy

**Development Workflow**:
1. Write test first (TDD approach recommended)
2. Run tests in watch mode: `npm test -- --watch`
3. Implement feature until tests pass
4. Check coverage: `npm test -- --coverage`
5. Add tests for uncovered branches
6. Commit when all tests pass and coverage meets threshold

**CI/CD Integration**:
- All tests must pass before merging
- Coverage must meet 90% threshold
- Test execution time should remain under 30 seconds
- Failed tests block deployment

### Mock Strategy

**Mock Creation**:
- Use factory functions to create reusable mocks
- Configure mocks in `beforeEach` for test isolation
- Reset mocks in `afterEach` to prevent interference

**Mock Verification**:
- Always verify mock calls in tests
- Check call count: `expect(mock).toHaveBeenCalledTimes(1)`
- Check arguments: `expect(mock).toHaveBeenCalledWith(expectedArgs)`
- Check call order when relevant: `expect(mock1).toHaveBeenCalledBefore(mock2)`

**Mock Response Patterns**:
- Success: `mockRepo.method.mockResolvedValue(data)`
- Failure: `mockRepo.method.mockRejectedValue(error)`
- Conditional: Use `mockImplementation` for complex logic

### Edge Case Testing

**Common Edge Cases to Test**:
- Null and undefined values
- Empty strings and empty arrays
- Boundary values (min/max numbers, date ranges)
- Special characters in strings
- Very large inputs
- Concurrent operations
- Race conditions

### Test Data Management

**Fixture Organization**:
- Create centralized fixture files for common test data
- Use factory functions to generate test data with variations
- Keep fixtures realistic but minimal
- Version fixtures alongside schema changes

**Example Fixture Pattern**:
```typescript
const createUser = (overrides = {}) => ({
  id: 'default-id',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

// Usage
const user1 = createUser({ email: 'user1@example.com' });
const user2 = createUser({ name: 'Different Name' });
```
