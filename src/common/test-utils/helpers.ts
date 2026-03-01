/**
 * Test helper utilities for common test operations
 * Provides utilities for mock setup, verification, async handling, and error assertions
 */

/**
 * Waits for all pending promises to resolve
 * Useful for testing async operations and ensuring all callbacks complete
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Waits for a specified amount of time
 * @param ms - Milliseconds to wait
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifies that a mock was called with specific arguments
 * @param mock - Jest mock function to verify
 * @param expectedArgs - Expected arguments
 * @param callIndex - Which call to check (default: 0 for first call)
 */
export function expectMockCalledWith(
  mock: jest.Mock,
  expectedArgs: any[],
  callIndex: number = 0
): void {
  expect(mock).toHaveBeenCalled();
  expect(mock.mock.calls[callIndex]).toEqual(expectedArgs);
}

/**
 * Verifies that a mock was called exactly once with specific arguments
 * @param mock - Jest mock function to verify
 * @param expectedArgs - Expected arguments
 */
export function expectMockCalledOnceWith(
  mock: jest.Mock,
  expectedArgs: any[]
): void {
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock).toHaveBeenCalledWith(...expectedArgs);
}

/**
 * Verifies that a mock was never called
 * @param mock - Jest mock function to verify
 */
export function expectMockNotCalled(mock: jest.Mock): void {
  expect(mock).not.toHaveBeenCalled();
}

/**
 * Verifies that multiple mocks were called in a specific order
 * @param mocks - Array of jest mock functions in expected call order
 */
export function expectMocksCalledInOrder(mocks: jest.Mock[]): void {
  for (let i = 0; i < mocks.length - 1; i++) {
    const currentMock = mocks[i];
    const nextMock = mocks[i + 1];
    
    expect(currentMock).toHaveBeenCalled();
    expect(nextMock).toHaveBeenCalled();
    
    const currentCallTime = currentMock.mock.invocationCallOrder[0];
    const nextCallTime = nextMock.mock.invocationCallOrder[0];
    
    expect(currentCallTime).toBeLessThan(nextCallTime);
  }
}

/**
 * Resets all mocks in an object
 * @param mockObject - Object containing jest mock functions
 */
export function resetAllMocks(mockObject: Record<string, jest.Mock>): void {
  Object.values(mockObject).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}

/**
 * Clears all mocks in an object
 * @param mockObject - Object containing jest mock functions
 */
export function clearAllMocks(mockObject: Record<string, jest.Mock>): void {
  Object.values(mockObject).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
}

/**
 * Asserts that an async function throws an error with a specific message
 * @param fn - Async function to test
 * @param expectedMessage - Expected error message (string or regex)
 */
export async function expectAsyncThrow(
  fn: () => Promise<any>,
  expectedMessage?: string | RegExp
): Promise<void> {
  await expect(fn()).rejects.toThrow(expectedMessage);
}

/**
 * Asserts that an async function throws a specific error type
 * @param fn - Async function to test
 * @param errorType - Expected error constructor
 */
export async function expectAsyncThrowError(
  fn: () => Promise<any>,
  errorType: new (...args: any[]) => Error
): Promise<void> {
  await expect(fn()).rejects.toThrow(errorType);
}

/**
 * Asserts that an async function does not throw
 * @param fn - Async function to test
 */
export async function expectAsyncNotThrow(fn: () => Promise<any>): Promise<void> {
  await expect(fn()).resolves.not.toThrow();
}

/**
 * Asserts that an error has specific properties
 * @param error - Error object to check
 * @param expectedProperties - Expected properties on the error
 */
export function expectErrorProperties(
  error: any,
  expectedProperties: Record<string, any>
): void {
  expect(error).toBeInstanceOf(Error);
  Object.entries(expectedProperties).forEach(([key, value]) => {
    expect(error[key]).toEqual(value);
  });
}

/**
 * Creates a mock implementation that resolves with different values on successive calls
 * @param values - Array of values to return on successive calls
 * @returns Jest mock function
 */
export function createSequentialMock<T>(...values: T[]): jest.Mock<Promise<T>> {
  const mock = jest.fn();
  values.forEach((value, index) => {
    mock.mockResolvedValueOnce(value);
  });
  return mock;
}

/**
 * Creates a mock implementation that rejects with different errors on successive calls
 * @param errors - Array of errors to throw on successive calls
 * @returns Jest mock function
 */
export function createSequentialErrorMock(...errors: Error[]): jest.Mock<Promise<never>> {
  const mock = jest.fn();
  errors.forEach((error) => {
    mock.mockRejectedValueOnce(error);
  });
  return mock;
}

/**
 * Spy on console methods and suppress output during tests
 * @param methods - Console methods to spy on (default: ['log', 'warn', 'error'])
 * @returns Object with restore function to restore original console methods
 */
export function suppressConsole(
  methods: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = ['log', 'warn', 'error']
): { restore: () => void } {
  const spies: jest.SpyInstance[] = [];
  
  methods.forEach((method) => {
    const spy = jest.spyOn(console, method).mockImplementation(() => {});
    spies.push(spy);
  });
  
  return {
    restore: () => spies.forEach((spy) => spy.mockRestore())
  };
}

/**
 * Captures console output during test execution
 * @param fn - Function to execute while capturing console output
 * @param methods - Console methods to capture (default: ['log', 'warn', 'error'])
 * @returns Object with captured output for each method
 */
export async function captureConsole(
  fn: () => Promise<void> | void,
  methods: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = ['log', 'warn', 'error']
): Promise<Record<string, string[]>> {
  const captured: Record<string, string[]> = {};
  const spies: jest.SpyInstance[] = [];
  
  methods.forEach((method) => {
    captured[method] = [];
    const spy = jest.spyOn(console, method).mockImplementation((...args) => {
      captured[method].push(args.join(' '));
    });
    spies.push(spy);
  });
  
  try {
    await fn();
  } finally {
    spies.forEach((spy) => spy.mockRestore());
  }
  
  return captured;
}

/**
 * Asserts that a value matches a partial object (useful for checking subset of properties)
 * @param actual - Actual value
 * @param expected - Expected partial object
 */
export function expectPartialMatch<T>(actual: T, expected: Partial<T>): void {
  expect(actual).toMatchObject(expected);
}

/**
 * Asserts that an array contains an item matching partial properties
 * @param array - Array to search
 * @param expected - Expected partial object
 */
export function expectArrayContainsMatch<T>(
  array: T[],
  expected: Partial<T>
): void {
  const match = array.some((item) => {
    try {
      expect(item).toMatchObject(expected);
      return true;
    } catch {
      return false;
    }
  });
  
  expect(match).toBe(true);
}

/**
 * Creates a deferred promise that can be resolved or rejected externally
 * Useful for testing race conditions and timing-dependent code
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Runs a test with a timeout, failing if it takes too long
 * @param fn - Async function to test
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Custom timeout error message
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
}
