/**
 * Tests for SemanticPromise
 */

import { describe, test, expect } from 'bun:test';
import { SemanticPromise } from '../promise.ts';
import {
  createMockLLMClient,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockApiCallOperationResponse,
  mockValidResultResponse,
  mockInvalidResultResponse,
  mockTransformResponse,
  mockShouldFallbackTrueResponse,
} from './mocks.ts';

describe('SemanticPromise', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('from()', () => {
    test('creates SemanticPromise from Promise', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'test operation',
        client
      );

      expect(promise).toBeInstanceOf(SemanticPromise);
      const value = await promise;
      expect(value).toBe(42);
    });

    test('creates with description', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'fetch user data',
        client
      );

      expect(promise.description).toBe('fetch user data');
    });
  });

  describe('resolve()', () => {
    test('creates resolved SemanticPromise', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.resolve('value', 'test', client);

      const value = await promise;
      expect(value).toBe('value');
    });
  });

  describe('reject()', () => {
    test('creates rejected SemanticPromise', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.reject(new Error('test error'), 'test', client);

      // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
      await expect(promise.valueOf()).rejects.toThrow('test error');
    });
  });

  // ===========================================================================
  // PROMISE INTERFACE TESTS
  // ===========================================================================

  describe('promise interface', () => {
    test('then chains correctly', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(10),
        'test',
        client
      );

      const result = await promise.then((x) => x * 2);
      expect(result).toBe(20);
    });

    test('catch handles errors', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.reject(new Error('test')),
        'test',
        client
      );

      const result = await promise.catch(() => 'caught');
      expect(result).toBe('caught');
    });

    test('finally executes', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      let finallyCalled = false;
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'test',
        client
      );

      await promise.finally(() => {
        finallyCalled = true;
      });

      expect(finallyCalled).toBe(true);
    });

    test('valueOf returns underlying Promise', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const originalPromise = Promise.resolve(42);
      const promise = SemanticPromise.from(originalPromise, 'test', client);

      expect(promise.valueOf()).toBeInstanceOf(Promise);
    });
  });

  // ===========================================================================
  // SEMANTIC EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent values', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise1 = SemanticPromise.from(
        Promise.resolve({ status: 'ok' }),
        'test1',
        client
      );
      const promise2 = Promise.resolve({ status: 'success' });

      const result = await promise1.semanticallyEquals(promise2);
      expect(result.equivalent).toBe(true);
    });

    test('returns false for non-equivalent values', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const promise1 = SemanticPromise.from(
        Promise.resolve({ name: 'John' }),
        'test1',
        client
      );
      const promise2 = Promise.resolve({ name: 'Jane' });

      const result = await promise1.semanticallyEquals(promise2);
      expect(result.equivalent).toBe(false);
    });
  });

  // ===========================================================================
  // TIMEOUT TESTS
  // ===========================================================================

  describe('timeout()', () => {
    test('resolves within timeout', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'quick operation',
        client
      );

      const result = await promise.timeout(1000);
      expect(result).toBe(42);
    });

    test('rejects on timeout', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500, 42));
      const promise = SemanticPromise.from(slowPromise, 'slow operation', client);

      // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
      await expect(promise.timeout(10).valueOf()).rejects.toThrow('timed out');
    });

    test('includes context in timeout error', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 500, 42));
      const promise = SemanticPromise.from(slowPromise, 'test', client);

      try {
        await promise.timeout(10, 'database connection');
      } catch (error) {
        expect((error as Error).message).toContain('database connection');
      }
    });
  });

  // ===========================================================================
  // EXPLAIN AND STATUS TESTS
  // ===========================================================================

  describe('explain()', () => {
    test('returns description', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'fetching user data',
        client
      );

      expect(promise.explain()).toBe('fetching user data');
    });
  });

  describe('status()', () => {
    test('returns pending status initially', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        'slow operation',
        client
      );

      const status = promise.status();
      expect(status.state).toBe('pending');
      expect(status.description).toContain('Waiting');
    });

    test('returns fulfilled status after resolve', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'quick operation',
        client
      );

      await promise;
      // Small delay to allow state to update
      await new Promise((r) => setTimeout(r, 10));

      const status = promise.status();
      expect(status.state).toBe('fulfilled');
      expect(status.elapsed).toBeDefined();
    });

    test('returns rejected status after reject', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.reject(new Error('test')),
        'failing operation',
        client
      );

      try {
        await promise;
      } catch {
        // Expected
      }
      // Small delay to allow state to update
      await new Promise((r) => setTimeout(r, 10));

      const status = promise.status();
      expect(status.state).toBe('rejected');
    });
  });

  // ===========================================================================
  // INFER OPERATION TESTS
  // ===========================================================================

  describe('inferOperation()', () => {
    test('infers API call operation', async () => {
      const client = createMockLLMClient(mockApiCallOperationResponse);
      const promise = SemanticPromise.from(
        Promise.resolve({ id: 1, name: 'John' }),
        'fetching user from /api/users/1',
        client
      );

      const result = await promise.inferOperation();
      expect(result.operation).toBe('api-call');
      expect(result.resource).toBe('user');
      expect(result.action).toBe('read');
    });
  });

  // ===========================================================================
  // VALIDATE RESULT TESTS
  // ===========================================================================

  describe('validateResult()', () => {
    test('passes for valid result', async () => {
      const client = createMockLLMClient(mockValidResultResponse);
      const promise = SemanticPromise.from(
        Promise.resolve({ id: 1, email: 'test@example.com' }),
        'fetch user',
        client
      );

      const validated = promise.validateResult([
        'should contain user data',
        'email must be valid',
      ]);

      expect(validated).toBeInstanceOf(SemanticPromise);
      // Await to ensure it completes successfully
      const result = await validated;
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    test('throws for invalid result', async () => {
      const client = createMockLLMClient(mockInvalidResultResponse);
      const promise = SemanticPromise.from(
        Promise.resolve({ id: 'invalid' }),
        'fetch user',
        client
      );

      const validated = promise.validateResult(['email field is required']);
      expect(validated).toBeInstanceOf(SemanticPromise);
      // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-confusing-void-expression
      await expect(validated.valueOf()).rejects.toThrow('Validation failed');
    });
  });

  // ===========================================================================
  // TRANSFORM TESTS
  // ===========================================================================

  describe('transform()', () => {
    test('transforms result', async () => {
      const client = createMockLLMClient(mockTransformResponse);
      const promise = SemanticPromise.from(
        Promise.resolve({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }),
        'fetch user',
        client
      );

      const transformed = await promise.transform('extract just name and email');
      const value = await transformed;

      expect(value).toHaveProperty('name');
      expect(value).toHaveProperty('email');
    });
  });

  // ===========================================================================
  // FALLBACK TESTS
  // ===========================================================================

  describe('fallback()', () => {
    test('returns original value on success', async () => {
      const client = createMockLLMClient(mockShouldFallbackTrueResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'test',
        client
      );

      const result = await promise.fallback(0);
      expect(result).toBe(42);
    });

    test('returns fallback value on error without condition', async () => {
      const client = createMockLLMClient(mockShouldFallbackTrueResponse);
      const promise = SemanticPromise.from(
        Promise.reject(new Error('test')),
        'test',
        client
      );

      const result = await promise.fallback(0);
      expect(result).toBe(0);
    });

    test('returns fallback function result on error', async () => {
      const client = createMockLLMClient(mockShouldFallbackTrueResponse);
      const promise = SemanticPromise.from(
        Promise.reject(new Error('test')),
        'test',
        client
      );

      const result = await promise.fallback(() => 'default');
      expect(result).toBe('default');
    });

    test('returns fallback when condition matches', async () => {
      const client = createMockLLMClient(mockShouldFallbackTrueResponse);
      const promise = SemanticPromise.from(
        Promise.reject(new Error('not found')),
        'test',
        client
      );

      const result = await promise.fallback('default', 'when not found');
      expect(result).toBe('default');
    });
  });

  // ===========================================================================
  // LOGGING TESTS
  // ===========================================================================

  describe('withLogging()', () => {
    test('logs start and completion', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const logs: string[] = [];
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'test operation',
        client
      );

      await promise.withLogging((msg) => logs.push(msg));

      expect(logs.some((log) => log.includes('Starting'))).toBe(true);
      expect(logs.some((log) => log.includes('Completed'))).toBe(true);
    });

    test('logs start and failure', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const logs: string[] = [];
      const promise = SemanticPromise.from(
        Promise.reject(new Error('test error')),
        'failing operation',
        client
      );

      try {
        await promise.withLogging((msg) => logs.push(msg));
      } catch {
        // Expected
      }

      expect(logs.some((log) => log.includes('Starting'))).toBe(true);
      expect(logs.some((log) => log.includes('Failed'))).toBe(true);
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('toString returns description', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'test operation',
        client
      );

      expect(promise.toString()).toBe('SemanticPromise(test operation)');
    });

    test('description getter returns description', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const promise = SemanticPromise.from(
        Promise.resolve(42),
        'my operation',
        client
      );

      expect(promise.description).toBe('my operation');
    });
  });
});
