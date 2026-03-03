/**
 * Tests for test utilities index exports
 * Verifies that all utilities can be imported from the index
 */

import * as testUtils from './index';

describe('Test Utils Index', () => {
  it('should export fixture functions', () => {
    expect(testUtils.createTestUser).toBeDefined();
    expect(testUtils.createTestTransaction).toBeDefined();
    expect(testUtils.createTestBudget).toBeDefined();
    expect(testUtils.createTestUserList).toBeDefined();
    expect(testUtils.createTestTransactionList).toBeDefined();
    expect(testUtils.createTestBudgetList).toBeDefined();
    expect(testUtils.createInvalidUser).toBeDefined();
    expect(testUtils.createInvalidTransaction).toBeDefined();
    expect(testUtils.createInvalidBudget).toBeDefined();
    expect(testUtils.fixtures).toBeDefined();
  });

  it('should export helper functions', () => {
    expect(testUtils.flushPromises).toBeDefined();
    expect(testUtils.wait).toBeDefined();
    expect(testUtils.expectMockCalledWith).toBeDefined();
    expect(testUtils.expectMockCalledOnceWith).toBeDefined();
    expect(testUtils.expectMockNotCalled).toBeDefined();
    expect(testUtils.expectMocksCalledInOrder).toBeDefined();
    expect(testUtils.resetAllMocks).toBeDefined();
    expect(testUtils.clearAllMocks).toBeDefined();
    expect(testUtils.expectAsyncThrow).toBeDefined();
    expect(testUtils.expectAsyncThrowError).toBeDefined();
    expect(testUtils.expectAsyncNotThrow).toBeDefined();
    expect(testUtils.expectErrorProperties).toBeDefined();
    expect(testUtils.createSequentialMock).toBeDefined();
    expect(testUtils.createSequentialErrorMock).toBeDefined();
    expect(testUtils.suppressConsole).toBeDefined();
    expect(testUtils.captureConsole).toBeDefined();
    expect(testUtils.expectPartialMatch).toBeDefined();
    expect(testUtils.expectArrayContainsMatch).toBeDefined();
    expect(testUtils.createDeferred).toBeDefined();
    expect(testUtils.withTimeout).toBeDefined();
  });

  it('should export type interfaces', () => {
    // Verify types can be used
    const user: testUtils.User = testUtils.createTestUser();
    const transaction: testUtils.Transaction = testUtils.createTestTransaction();
    const budget: testUtils.Budget = testUtils.createTestBudget();
    
    expect(user).toBeDefined();
    expect(transaction).toBeDefined();
    expect(budget).toBeDefined();
  });
});
