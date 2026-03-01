# Test Utilities

This directory contains reusable test utilities for the StellarSpend API test suite.

## Files

- **fixtures.ts**: Test data fixtures and factory functions for creating test entities
- **helpers.ts**: Helper functions for mock setup, verification, async handling, and error assertions
- **index.ts**: Exports all test utilities for easy importing

## Usage

### Importing Test Utilities

```typescript
// Import all utilities
import { 
  createTestUser, 
  expectMockCalledOnceWith,
  expectAsyncThrow 
} from '@/common/test-utils';

// Or import from specific files
import { createTestUser } from '@/common/test-utils/fixtures';
import { expectMockCalledOnceWith } from '@/common/test-utils/helpers';
```

## Fixtures

### Factory Functions

Create test entities with optional property overrides:

```typescript
import { createTestUser, createTestTransaction, createTestBudget } from '@/common/test-utils';

// Create with defaults
const user = createTestUser();

// Create with overrides
const customUser = createTestUser({ 
  email: 'custom@example.com',
  name: 'Custom User' 
});

// Create lists
const users = createTestUserList(5);
const transactions = createTestTransactionList(3, userId);
```

### Invalid Fixtures

Create invalid entities for testing validation:

```typescript
import { createInvalidUser, createInvalidTransaction } from '@/common/test-utils';

const invalidUser = createInvalidUser(); // Has invalid email and empty name
const invalidTransaction = createInvalidTransaction(); // Has negative amount
```

### Centralized Fixtures

Access pre-configured fixtures:

```typescript
import { fixtures } from '@/common/test-utils';

const validUser = fixtures.users.valid;
const invalidUser = fixtures.users.invalid;
const userList = fixtures.users.list;
```

## Helper Functions

### Mock Verification

```typescript
import { 
  expectMockCalledWith,
  expectMockCalledOnceWith,
  expectMockNotCalled,
  expectMocksCalledInOrder 
} from '@/common/test-utils';

// Verify mock was called with specific arguments
expectMockCalledWith(mockFn, ['arg1', 'arg2']);

// Verify mock was called exactly once
expectMockCalledOnceWith(mockFn, ['arg1', 'arg2']);

// Verify mock was never called
expectMockNotCalled(mockFn);

// Verify call order
expectMocksCalledInOrder([mock1, mock2, mock3]);
```

### Mock Management

```typescript
import { resetAllMocks, clearAllMocks } from '@/common/test-utils';

const mocks = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
};

// Reset all mocks (clears calls and implementations)
resetAllMocks(mocks);

// Clear all mocks (clears calls only)
clearAllMocks(mocks);
```

### Sequential Mocks

```typescript
import { createSequentialMock, createSequentialErrorMock } from '@/common/test-utils';

// Return different values on successive calls
const mock = createSequentialMock('first', 'second', 'third');
await mock(); // 'first'
await mock(); // 'second'
await mock(); // 'third'

// Throw different errors on successive calls
const errorMock = createSequentialErrorMock(
  new Error('First error'),
  new Error('Second error')
);
```

### Async Test Helpers

```typescript
import { 
  flushPromises,
  wait,
  expectAsyncThrow,
  expectAsyncThrowError,
  expectAsyncNotThrow 
} from '@/common/test-utils';

// Wait for all pending promises
await flushPromises();

// Wait for specific time
await wait(100);

// Assert async function throws
await expectAsyncThrow(async () => {
  throw new Error('Test error');
}, 'Test error');

// Assert async function throws specific error type
await expectAsyncThrowError(async () => {
  throw new ValidationError('Invalid');
}, ValidationError);

// Assert async function doesn't throw
await expectAsyncNotThrow(async () => {
  return 'success';
});
```

### Error Assertions

```typescript
import { expectErrorProperties } from '@/common/test-utils';

try {
  await service.create(invalidData);
} catch (error) {
  expectErrorProperties(error, {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    status: 400
  });
}
```

### Console Utilities

```typescript
import { suppressConsole, captureConsole } from '@/common/test-utils';

// Suppress console output during test
const suppressor = suppressConsole(['log', 'warn', 'error']);
// ... test code that logs ...
suppressor.restore();

// Capture console output
const captured = await captureConsole(async () => {
  console.log('Test message');
  console.error('Error message');
}, ['log', 'error']);

expect(captured.log).toContain('Test message');
expect(captured.error).toContain('Error message');
```

### Partial Matching

```typescript
import { expectPartialMatch, expectArrayContainsMatch } from '@/common/test-utils';

// Verify object matches partial properties
const user = await service.findById('123');
expectPartialMatch(user, { 
  id: '123', 
  email: 'test@example.com' 
});

// Verify array contains matching item
const users = await service.findAll();
expectArrayContainsMatch(users, { 
  email: 'test@example.com' 
});
```

### Advanced Async Patterns

```typescript
import { createDeferred, withTimeout } from '@/common/test-utils';

// Create externally controllable promise
const deferred = createDeferred<string>();
setTimeout(() => deferred.resolve('success'), 100);
const result = await deferred.promise;

// Run with timeout
const result = await withTimeout(
  async () => await slowOperation(),
  5000,
  'Operation took too long'
);
```

## Example Test

```typescript
import { 
  createTestUser, 
  createMockRepository,
  expectMockCalledOnceWith,
  expectAsyncThrow 
} from '@/common/test-utils';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockRepository<User>;
  
  beforeEach(() => {
    mockRepository = createMockRepository<User>();
    service = new UserService(mockRepository);
  });
  
  describe('findById', () => {
    it('should return user when found', async () => {
      const user = createTestUser();
      mockRepository.findOne.mockResolvedValue(user);
      
      const result = await service.findById(user.id);
      
      expect(result).toEqual(user);
      expectMockCalledOnceWith(mockRepository.findOne, [user.id]);
    });
    
    it('should throw when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      await expectAsyncThrow(
        () => service.findById('invalid-id'),
        'User not found'
      );
    });
  });
});
```

## Best Practices

1. **Use factory functions**: Always use `createTestUser()` instead of manually creating test objects
2. **Override only what you need**: Use the overrides parameter to customize specific properties
3. **Verify mock calls**: Always verify that mocks are called with correct arguments
4. **Test async properly**: Use `async/await` and the async helper functions
5. **Clean up**: Use `beforeEach` and `afterEach` to reset mocks between tests
6. **Descriptive assertions**: Use helper functions that provide clear error messages

## Requirements Validation

These utilities support the following requirements:

- **Requirement 2.5**: Mock reset functionality ensures test isolation
- **Requirement 6.4**: Helper functions support common test setup patterns
- **Requirement 6.5**: Fixtures provide reusable test data separate from test logic
- **Requirement 8.1-8.3**: Mock verification helpers ensure proper mock call validation
