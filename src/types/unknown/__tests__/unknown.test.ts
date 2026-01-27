/**
 * Unit tests for SemanticUnknown
 */

import { describe, test, expect } from 'bun:test';
import { SemanticUnknown } from '../unknown.ts';
import {
  createMockLLMClient,
  mockInferTypeObjectResponse,
  mockInferTypeArrayResponse,
  mockSuggestTypesUserResponse,
  mockSuggestTypesConfigResponse,
  mockSuggestTypesSingleResponse,
  mockValidateShapeMatchesResponse,
  mockValidateShapeExtraFieldsResponse,
  mockValidateShapeMissingFieldsResponse,
  mockValidateShapePartialResponse,
  mockGenerateTypeGuardUserResponse,
  mockGenerateTypeGuardConfigResponse,
  mockGenerateTypeGuardArrayResponse,
  mockSafeAccessFoundResponse,
  mockSafeAccessNotFoundResponse,
  mockMatchesTrueResponse,
  mockMatchesFalseResponse,
  mockMatchesUncertainResponse,
  mockNarrowToSuccessResponse,
  mockNarrowToFailureResponse,
  mockNarrowToValidationErrorResponse,
  mockExplainUserResponse,
  mockExplainConfigResponse,
  mockExplainArrayResponse,
} from './mocks.ts';

describe('SemanticUnknown', () => {
  describe('from', () => {
    test('creates SemanticUnknown from any value', () => {
      const su = SemanticUnknown.from({ id: 1, name: 'test' });
      expect(su.valueOf()).toEqual({ id: 1, name: 'test' });
    });

    test('accepts context about source', () => {
      const su = SemanticUnknown.from('data', { source: 'API response' });
      expect(su.getContext()).toEqual({ source: 'API response' });
    });

    test('accepts null value', () => {
      const su = SemanticUnknown.from(null);
      expect(su.valueOf()).toBe(null);
    });

    test('accepts undefined value', () => {
      const su = SemanticUnknown.from(undefined);
      expect(su.valueOf()).toBe(undefined);
    });

    test('accepts custom LLM client', () => {
      const client = createMockLLMClient({});
      const su = SemanticUnknown.from({ test: true }, undefined, client);
      expect(su.valueOf()).toEqual({ test: true });
    });
  });

  describe('inferType', () => {
    test('infers type for object values using LLM', async () => {
      const client = createMockLLMClient(mockInferTypeObjectResponse);
      const su = SemanticUnknown.from({ id: 1, name: 'test' }, undefined, client);
      const result = await su.inferType();

      expect(result.type).toBe('object');
      expect(result.shape).toBe('{ id: number; name: string }');
      expect(result.confidence).toBe(0.95);
    });

    test('infers type for array values using LLM', async () => {
      const client = createMockLLMClient(mockInferTypeArrayResponse);
      const su = SemanticUnknown.from([{ id: 1 }, { id: 2 }], undefined, client);
      const result = await su.inferType();

      expect(result.type).toBe('array');
      expect(result.shape).toContain('Array');
      expect(result.confidence).toBe(0.9);
    });

    test('returns string type for string values without LLM', async () => {
      const su = SemanticUnknown.from('hello');
      const result = await su.inferType();

      expect(result.type).toBe('string');
      expect(result.confidence).toBe(1.0);
    });

    test('returns number type for number values without LLM', async () => {
      const su = SemanticUnknown.from(42);
      const result = await su.inferType();

      expect(result.type).toBe('number');
      expect(result.confidence).toBe(1.0);
    });

    test('returns boolean type for boolean values without LLM', async () => {
      const su = SemanticUnknown.from(true);
      const result = await su.inferType();

      expect(result.type).toBe('boolean');
      expect(result.confidence).toBe(1.0);
    });

    test('returns null type for null values without LLM', async () => {
      const su = SemanticUnknown.from(null);
      const result = await su.inferType();

      expect(result.type).toBe('null');
      expect(result.confidence).toBe(1.0);
    });

    test('returns undefined type for undefined values without LLM', async () => {
      const su = SemanticUnknown.from(undefined);
      const result = await su.inferType();

      expect(result.type).toBe('undefined');
      expect(result.confidence).toBe(1.0);
    });

    test('returns function type for function values without LLM', async () => {
      const su = SemanticUnknown.from(() => {});
      const result = await su.inferType();

      expect(result.type).toBe('function');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('suggestTypes', () => {
    test('suggests types for user-like object', async () => {
      const client = createMockLLMClient(mockSuggestTypesUserResponse);
      const su = SemanticUnknown.from(
        { id: 1, name: 'John', email: 'john@example.com' },
        undefined,
        client
      );
      const result = await su.suggestTypes(3);

      expect(result.length).toBe(3);
      const first = result[0];
      expect(first).toBeDefined();
      expect(first?.type).toBe('User');
      expect(first?.confidence).toBe(0.9);
      expect(first?.reason).toContain('user fields');
    });

    test('suggests types for config object', async () => {
      const client = createMockLLMClient(mockSuggestTypesConfigResponse);
      const su = SemanticUnknown.from(
        { port: 3000, host: 'localhost' },
        undefined,
        client
      );
      const result = await su.suggestTypes(2);

      expect(result.length).toBe(2);
      expect(result[0]?.type).toBe('AppConfig');
    });

    test('respects limit parameter', async () => {
      const client = createMockLLMClient(mockSuggestTypesSingleResponse);
      const su = SemanticUnknown.from(['a', 'b', 'c'], undefined, client);
      const result = await su.suggestTypes(1);

      expect(result.length).toBe(1);
      expect(result[0]?.type).toBe('string[]');
    });
  });

  describe('validateShape', () => {
    test('validates matching shape', async () => {
      const client = createMockLLMClient(mockValidateShapeMatchesResponse);
      const su = SemanticUnknown.from(
        { name: 'John', email: 'john@example.com' },
        undefined,
        client
      );
      const result = await su.validateShape('user object with name and email');

      expect(result.matches).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.extraFields).toEqual([]);
    });

    test('reports extra fields', async () => {
      const client = createMockLLMClient(mockValidateShapeExtraFieldsResponse);
      const su = SemanticUnknown.from(
        { name: 'John', age: 30, createdAt: '2024-01-01' },
        undefined,
        client
      );
      const result = await su.validateShape('object with just name');

      expect(result.matches).toBe(true);
      expect(result.extraFields).toContain('age');
      expect(result.extraFields).toContain('createdAt');
    });

    test('reports missing fields', async () => {
      const client = createMockLLMClient(mockValidateShapeMissingFieldsResponse);
      const su = SemanticUnknown.from({ name: 'John' }, undefined, client);
      const result = await su.validateShape('user with name, email, and password');

      expect(result.matches).toBe(false);
      expect(result.missingFields).toContain('email');
      expect(result.missingFields).toContain('password');
    });

    test('handles partial match', async () => {
      const client = createMockLLMClient(mockValidateShapePartialResponse);
      const su = SemanticUnknown.from(
        { name: 'John', nickname: 'Johnny' },
        undefined,
        client
      );
      const result = await su.validateShape('user with name and role');

      expect(result.matches).toBe(false);
      expect(result.missingFields).toContain('role');
      expect(result.extraFields).toContain('nickname');
    });
  });

  describe('generateTypeGuard', () => {
    test('generates type guard for user object', async () => {
      const client = createMockLLMClient(mockGenerateTypeGuardUserResponse);
      const su = SemanticUnknown.from(
        { id: 1, name: 'John' },
        undefined,
        client
      );
      const result = await su.generateTypeGuard();

      expect(result.typeName).toBe('User');
      expect(result.code).toContain('function isUser');
      expect(result.code).toContain('x is User');
    });

    test('generates type guard for config object', async () => {
      const client = createMockLLMClient(mockGenerateTypeGuardConfigResponse);
      const su = SemanticUnknown.from(
        { port: 3000, host: 'localhost' },
        undefined,
        client
      );
      const result = await su.generateTypeGuard();

      expect(result.typeName).toBe('Config');
      expect(result.code).toContain('function isConfig');
    });

    test('generates type guard for array', async () => {
      const client = createMockLLMClient(mockGenerateTypeGuardArrayResponse);
      const su = SemanticUnknown.from(['a', 'b', 'c'], undefined, client);
      const result = await su.generateTypeGuard();

      expect(result.typeName).toBe('string[]');
      expect(result.code).toContain('Array.isArray');
    });
  });

  describe('safeAccess', () => {
    test('accesses direct property', async () => {
      const su = SemanticUnknown.from({ email: 'john@example.com' });
      const result = await su.safeAccess('email');

      expect(result).toBeDefined();
      expect(result?.valueOf()).toBe('john@example.com');
    });

    test('returns undefined for non-existent direct property', async () => {
      const client = createMockLLMClient(mockSafeAccessNotFoundResponse);
      const su = SemanticUnknown.from({ name: 'John' }, undefined, client);
      const result = await su.safeAccess('nonexistent');

      expect(result).toBeUndefined();
    });

    test('uses LLM for semantic property access', async () => {
      const client = createMockLLMClient(mockSafeAccessFoundResponse);
      const su = SemanticUnknown.from(
        { user: { email: 'john@example.com' } },
        undefined,
        client
      );
      const result = await su.safeAccess("user's email address");

      expect(result).toBeDefined();
      expect(result?.valueOf()).toBe('john@example.com');
    });

    test('returns undefined on non-object values', async () => {
      const client = createMockLLMClient(mockSafeAccessNotFoundResponse);
      const su = SemanticUnknown.from('string value', undefined, client);
      const result = await su.safeAccess('property');

      expect(result).toBeUndefined();
    });
  });

  describe('matches', () => {
    test('returns true for matching description', async () => {
      const client = createMockLLMClient(mockMatchesTrueResponse);
      const su = SemanticUnknown.from(
        [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }],
        undefined,
        client
      );
      const result = await su.matches('array of user objects');

      expect(result.matches).toBe(true);
      expect(result.confidence).toBe(0.92);
    });

    test('returns false for non-matching description', async () => {
      const client = createMockLLMClient(mockMatchesFalseResponse);
      const su = SemanticUnknown.from({ name: 'John' }, undefined, client);
      const result = await su.matches('array of numbers');

      expect(result.matches).toBe(false);
      expect(result.confidence).toBe(0.85);
    });

    test('handles uncertain matches', async () => {
      const client = createMockLLMClient(mockMatchesUncertainResponse);
      const su = SemanticUnknown.from({ data: {} }, undefined, client);
      const result = await su.matches('empty container');

      expect(result.matches).toBe(true);
      expect(result.confidence).toBe(0.6);
    });
  });

  describe('narrowTo', () => {
    test('successfully narrows to valid type', async () => {
      const client = createMockLLMClient(mockNarrowToSuccessResponse);
      const su = SemanticUnknown.from(
        { id: 1, name: 'John', email: 'john@example.com' },
        undefined,
        client
      );
      const result = await su.narrowTo<{ id: number; name: string; email: string }>('User');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe(1);
        expect(result.value.name).toBe('John');
      }
    });

    test('fails with errors for invalid type', async () => {
      const client = createMockLLMClient(mockNarrowToFailureResponse);
      const su = SemanticUnknown.from({ id: -1 }, undefined, client);
      const result = await su.narrowTo('User', ['must have email', 'id must be positive']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Missing required field: email');
        expect(result.errors).toContain('id must be a positive number');
      }
    });

    test('reports validation errors', async () => {
      const client = createMockLLMClient(mockNarrowToValidationErrorResponse);
      const su = SemanticUnknown.from({ name: 'John' }, undefined, client);
      const result = await su.narrowTo('User');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('explain', () => {
    test('explains user object', async () => {
      const client = createMockLLMClient(mockExplainUserResponse);
      const su = SemanticUnknown.from(
        { id: 1, name: 'John', email: 'john@example.com' },
        undefined,
        client
      );
      const result = await su.explain();

      expect(result).toContain('user profile');
      expect(result).toContain('personal information');
    });

    test('explains config object', async () => {
      const client = createMockLLMClient(mockExplainConfigResponse);
      const su = SemanticUnknown.from(
        { port: 3000, host: 'localhost' },
        undefined,
        client
      );
      const result = await su.explain();

      expect(result).toContain('configuration');
    });

    test('explains array', async () => {
      const client = createMockLLMClient(mockExplainArrayResponse);
      const su = SemanticUnknown.from([{ id: 1 }, { id: 2 }], undefined, client);
      const result = await su.explain();

      expect(result).toContain('array');
    });

    test('explains null without LLM', async () => {
      const su = SemanticUnknown.from(null);
      const result = await su.explain();

      expect(result).toContain('null');
      expect(result).toContain('absence');
    });

    test('explains undefined without LLM', async () => {
      const su = SemanticUnknown.from(undefined);
      const result = await su.explain();

      expect(result).toContain('undefined');
    });
  });

  describe('valueOf', () => {
    test('returns the wrapped value', () => {
      const value = { test: 'data' };
      const su = SemanticUnknown.from(value);
      expect(su.valueOf()).toBe(value);
    });

    test('returns null for null value', () => {
      const su = SemanticUnknown.from(null);
      expect(su.valueOf()).toBe(null);
    });

    test('returns undefined for undefined value', () => {
      const su = SemanticUnknown.from(undefined);
      expect(su.valueOf()).toBe(undefined);
    });
  });

  describe('isEmpty', () => {
    test('returns true for null', () => {
      const su = SemanticUnknown.from(null);
      expect(su.isEmpty()).toBe(true);
    });

    test('returns true for undefined', () => {
      const su = SemanticUnknown.from(undefined);
      expect(su.isEmpty()).toBe(true);
    });

    test('returns true for empty string', () => {
      const su = SemanticUnknown.from('');
      expect(su.isEmpty()).toBe(true);
    });

    test('returns true for empty array', () => {
      const su = SemanticUnknown.from([]);
      expect(su.isEmpty()).toBe(true);
    });

    test('returns true for empty object', () => {
      const su = SemanticUnknown.from({});
      expect(su.isEmpty()).toBe(true);
    });

    test('returns false for non-empty string', () => {
      const su = SemanticUnknown.from('hello');
      expect(su.isEmpty()).toBe(false);
    });

    test('returns false for non-empty array', () => {
      const su = SemanticUnknown.from([1, 2, 3]);
      expect(su.isEmpty()).toBe(false);
    });

    test('returns false for non-empty object', () => {
      const su = SemanticUnknown.from({ key: 'value' });
      expect(su.isEmpty()).toBe(false);
    });

    test('returns false for number zero', () => {
      const su = SemanticUnknown.from(0);
      expect(su.isEmpty()).toBe(false);
    });

    test('returns false for boolean false', () => {
      const su = SemanticUnknown.from(false);
      expect(su.isEmpty()).toBe(false);
    });
  });

  describe('getContext', () => {
    test('returns context when provided', () => {
      const su = SemanticUnknown.from('value', { source: 'API' });
      expect(su.getContext()).toEqual({ source: 'API' });
    });

    test('returns undefined when no context', () => {
      const su = SemanticUnknown.from('value');
      expect(su.getContext()).toBeUndefined();
    });
  });

  describe('toString', () => {
    test('returns string representation for object', () => {
      const su = SemanticUnknown.from({ key: 'value' });
      expect(su.toString()).toBe('SemanticUnknown(Object)');
    });

    test('returns string representation for array', () => {
      const su = SemanticUnknown.from([1, 2, 3]);
      expect(su.toString()).toBe('SemanticUnknown(Array[3])');
    });

    test('returns string representation for null', () => {
      const su = SemanticUnknown.from(null);
      expect(su.toString()).toBe('SemanticUnknown(null)');
    });

    test('returns string representation for primitive types', () => {
      expect(SemanticUnknown.from('hello').toString()).toBe('SemanticUnknown(string)');
      expect(SemanticUnknown.from(42).toString()).toBe('SemanticUnknown(number)');
      expect(SemanticUnknown.from(true).toString()).toBe('SemanticUnknown(boolean)');
    });
  });

  describe('toJSON', () => {
    test('returns JSON with value and context', () => {
      const su = SemanticUnknown.from({ id: 1 }, { source: 'test' });
      const json = su.toJSON();

      expect(json).toEqual({
        value: { id: 1 },
        context: { source: 'test' },
      });
    });

    test('returns JSON with only value when no context', () => {
      const su = SemanticUnknown.from({ id: 1 });
      const json = su.toJSON();

      expect(json).toEqual({
        value: { id: 1 },
      });
    });
  });
});

describe('SemanticUnknown prompts', () => {
  test('createInferTypePrompt includes value and context', async () => {
    const { createInferTypePrompt } = await import('../prompts.ts');
    const prompt = createInferTypePrompt({ id: 1 }, { source: 'API' });

    expect(prompt).toContain('"id": 1');
    expect(prompt).toContain('Source: "API"');
  });

  test('createSuggestTypesPrompt includes value and limit', async () => {
    const { createSuggestTypesPrompt } = await import('../prompts.ts');
    const prompt = createSuggestTypesPrompt({ name: 'test' }, 5);

    expect(prompt).toContain('"name": "test"');
    expect(prompt).toContain('up to 5');
  });

  test('createValidateShapePrompt includes value and description', async () => {
    const { createValidateShapePrompt } = await import('../prompts.ts');
    const prompt = createValidateShapePrompt({ name: 'test' }, 'user object');

    expect(prompt).toContain('"name": "test"');
    expect(prompt).toContain('Expected shape: "user object"');
  });

  test('createGenerateTypeGuardPrompt includes value', async () => {
    const { createGenerateTypeGuardPrompt } = await import('../prompts.ts');
    const prompt = createGenerateTypeGuardPrompt({ id: 1 });

    expect(prompt).toContain('"id": 1');
    expect(prompt).toContain('type guard function');
  });

  test('createSafeAccessPrompt includes value and path', async () => {
    const { createSafeAccessPrompt } = await import('../prompts.ts');
    const prompt = createSafeAccessPrompt({ user: { email: 'test' } }, "user's email");

    expect(prompt).toContain('"user"');
    expect(prompt).toContain('Path/Query: "user\'s email"');
  });

  test('createMatchesPrompt includes value and description', async () => {
    const { createMatchesPrompt } = await import('../prompts.ts');
    const prompt = createMatchesPrompt([1, 2, 3], 'array of numbers');

    expect(prompt).toContain('1');
    expect(prompt).toContain('2');
    expect(prompt).toContain('3');
    expect(prompt).toContain('Description: "array of numbers"');
  });

  test('createNarrowToPrompt includes value, type, and validator', async () => {
    const { createNarrowToPrompt } = await import('../prompts.ts');
    const prompt = createNarrowToPrompt({ id: 1 }, 'User', ['must have email']);

    expect(prompt).toContain('"id": 1');
    expect(prompt).toContain('Target type: "User"');
    expect(prompt).toContain('must have email');
  });

  test('createExplainPrompt includes value and context', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt({ data: 'test' }, { source: 'config' });

    expect(prompt).toContain('"data": "test"');
    expect(prompt).toContain('Source: "config"');
  });
});
