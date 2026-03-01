/**
 * Tests for test helper utilities
 * Validates that helper functions work correctly
 */

import {
  flushPromises,
  wait,
  expectMockCalledWith,
  expectMockCalledOnceWith,
  expectMockNotCalled,
  expectMocksCalledInOrder,
  resetAllMocks,
  clearAllMocks,
  expectAsyncThrow,
  expectAsyncThrowError,
  expectAsyncNotThrow,
  expectErrorProperties,
  createSequentialMock,
  createSequentialErrorMock,
  suppressConsole,
  captureConsole,
  expectPartialMatch,
  expectArrayContainsMatch,
  createDeferred,
  withTimeout
} from './helpers';

describe('Test Helper Utilities', () => {
  describe('flushPromises', () => {
    it('should wait for pending promises to resolve', async () => {
      let resolved = false;
      Promise.resolve().then(() => { resolved = true; });
      
      await flushPromises();
      
      expect(resolved).toBe(true);
    });
  });

  describe('wait', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await wait(50);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('expectMockCalledWith', () => {
    it('should verify mock was called with expected arguments', () => {
      const mock = jest.fn();
      mock('arg1', 'arg2');
      
      expectMockCalledWith(mock, ['arg1', 'arg2']);
    });

    it('should verify specific call index', () => {
      const mock = jest.fn();
      mock('first');
      mock('second');
      
      expectMockCalledWith(mock, ['second'], 1);
    });
  });

  describe('expectMockCalledOnceWith', () => {
    it('should verify mock was called exactly once with arguments', () => {
      const mock = jest.fn();
      mock('arg1', 'arg2');
      
      expectMockCalledOnceWith(mock, ['arg1', 'arg2']);
    });
  });

  describe('expectMockNotCalled', () => {
    it('should verify mock was never called', () => {
      const mock = jest.fn();
      
      expectMockNotCalled(mock);
    });
  });

  describe('expectMocksCalledInOrder', () => {
    it('should verify mocks were called in correct order', () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();
      const mock3 = jest.fn();
      
      mock1();
      mock2();
      mock3();
      
      expectMocksCalledInOrder([mock1, mock2, mock3]);
    });
  });

  describe('resetAllMocks', () => {
    it('should reset all mocks in an object', () => {
      const mocks = {
        mock1: jest.fn(),
        mock2: jest.fn()
      };
      
      mocks.mock1();
      mocks.mock2();
      
      resetAllMocks(mocks);
      
      expect(mocks.mock1).not.toHaveBeenCalled();
      expect(mocks.mock2).not.toHaveBeenCalled();
    });
  });

  describe('clearAllMocks', () => {
    it('should clear all mocks in an object', () => {
      const mocks = {
        mock1: jest.fn(),
        mock2: jest.fn()
      };
      
      mocks.mock1();
      mocks.mock2();
      
      clearAllMocks(mocks);
      
      expect(mocks.mock1).not.toHaveBeenCalled();
      expect(mocks.mock2).not.toHaveBeenCalled();
    });
  });

  describe('expectAsyncThrow', () => {
    it('should verify async function throws error', async () => {
      const fn = async () => {
        throw new Error('Test error');
      };
      
      await expectAsyncThrow(fn, 'Test error');
    });
  });

  describe('expectAsyncThrowError', () => {
    it('should verify async function throws specific error type', async () => {
      class CustomError extends Error {}
      
      const fn = async () => {
        throw new CustomError('Test error');
      };
      
      await expectAsyncThrowError(fn, CustomError);
    });
  });

  describe('expectAsyncNotThrow', () => {
    it('should verify async function does not throw', async () => {
      const fn = async () => {
        return 'success';
      };
      
      await expectAsyncNotThrow(fn);
    });
  });

  describe('expectErrorProperties', () => {
    it('should verify error has expected properties', () => {
      const error = new Error('Test error');
      (error as any).code = 'TEST_CODE';
      (error as any).status = 400;
      
      expectErrorProperties(error, {
        message: 'Test error',
        code: 'TEST_CODE',
        status: 400
      });
    });
  });

  describe('createSequentialMock', () => {
    it('should return different values on successive calls', async () => {
      const mock = createSequentialMock('first', 'second', 'third');
      
      expect(await mock()).toBe('first');
      expect(await mock()).toBe('second');
      expect(await mock()).toBe('third');
    });
  });

  describe('createSequentialErrorMock', () => {
    it('should throw different errors on successive calls', async () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');
      const mock = createSequentialErrorMock(error1, error2);
      
      await expect(mock()).rejects.toThrow('First error');
      await expect(mock()).rejects.toThrow('Second error');
    });
  });

  describe('suppressConsole', () => {
    it('should suppress console output', () => {
      const originalLog = console.log;
      const suppressor = suppressConsole(['log']);
      
      console.log('This should not appear');
      
      suppressor.restore();
      
      // Verify console.log was restored to original
      expect(console.log).toBe(originalLog);
    });
  });

  describe('captureConsole', () => {
    it('should capture console output', async () => {
      const captured = await captureConsole(() => {
        console.log('Test log');
        console.error('Test error');
      }, ['log', 'error']);
      
      expect(captured.log).toEqual(['Test log']);
      expect(captured.error).toEqual(['Test error']);
    });
  });

  describe('expectPartialMatch', () => {
    it('should verify object matches partial properties', () => {
      const obj = { id: '123', name: 'Test', email: 'test@example.com' };
      
      expectPartialMatch(obj, { id: '123', name: 'Test' });
    });
  });

  describe('expectArrayContainsMatch', () => {
    it('should verify array contains item matching partial properties', () => {
      const array = [
        { id: '1', name: 'First' },
        { id: '2', name: 'Second' },
        { id: '3', name: 'Third' }
      ];
      
      expectArrayContainsMatch(array, { id: '2', name: 'Second' });
    });
  });

  describe('createDeferred', () => {
    it('should create a promise that can be resolved externally', async () => {
      const deferred = createDeferred<string>();
      
      setTimeout(() => deferred.resolve('success'), 10);
      
      const result = await deferred.promise;
      expect(result).toBe('success');
    });

    it('should create a promise that can be rejected externally', async () => {
      const deferred = createDeferred<string>();
      
      setTimeout(() => deferred.reject(new Error('failed')), 10);
      
      await expect(deferred.promise).rejects.toThrow('failed');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if function completes within timeout', async () => {
      const fn = async () => {
        await wait(10);
        return 'success';
      };
      
      const result = await withTimeout(fn, 100);
      expect(result).toBe('success');
    });

    it('should reject if function exceeds timeout', async () => {
      const fn = async () => {
        await wait(200);
        return 'success';
      };
      
      await expect(withTimeout(fn, 50)).rejects.toThrow('Operation timed out');
    });
  });
});
