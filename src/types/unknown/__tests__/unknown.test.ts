/**
 * Unit tests for SemanticUnknown
 */

import { describe, test, expect } from 'bun:test';
import { SemanticUnknown } from '../unknown.ts';
import {
  createMockLLMClient,
  mockInferTypeObject,
  mockInferTypeArray,
  mockInferTypePrimitive,
  mockSuggestTypesUser,
  mockValidateShapeMatch,
  mockValidateShapePartial,
  mockGenerateTypeGuard,
  mockSafeAccessFound,
  mockSafeAccessNotFound,
  mockMatchesTrue,
  mockMatchesFalse,
  mockNarrowToSuccess,
  mockNarrowToFailure,
  mockExplainUser,
} from './mocks.ts';

describe('SemanticUnknown', () => {
  describe('from', () => {
    test('creates SemanticUnknown with value', () => {
      const su = SemanticUnknown.from({ id: 1, name: 'test' });
      expect(su.valueOf()).toEqual({ id: 1, name: 'test' });
    });

    test('creates SemanticUnknown with context', () => {
      const su = SemanticUnknown.from('test', { source: 'API response' });
      expect(su.getContext()).toEqual({ source: 'API response' });
    });

    test('accepts custom LLM client', () => {
      const client = createMockLLMClient({});
      const su = SemanticUnknown.from({}, undefined, client);
      expect(su.valueOf()).toEqual({});
    });
  });

  describe('inferType', () => {
    test('infers object type with shape', async () => {
      const client = createMockLLMClient(mockInferTypeObject);
      const su = SemanticUnknown.from({ id: 1, name: 'test' }, undefined, client);
      const result = await su.inferType();

      expect(result.type).toBe('object');
      expect(result.shape).toContain('id');
      expect(result.confidence).toBe(0.95);
    });

    test('infers array type', async () => {
      const client = createMockLLMClient(mockInferTypeArray);
      const su = SemanticUnknown.from(['a', 'b', 'c'], undefined, client);
      const result = await su.inferType();

      expect(result.type).toBe('array');
      expect(result.shape).toBe('string[]');
    });

    test('infers primitive type', async () => {
      const client = createMockLLMClient(mockInferTypePrimitive);
      const su = SemanticUnknown.from(42, undefined, client);
      const result = await su.inferType();

      expect(result.type).toBe('number');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('suggestTypes', () => {
    test('suggests multiple types', async () => {
      const client = createMockLLMClient(mockSuggestTypesUser);
      const su = SemanticUnknown.from({ name: 'John', email: 'john@example.com' }, undefined, client);
      const result = await su.suggestTypes(3);

      expect(result.length).toBe(2);
      expect(result[0]?.type).toBe('User');
      expect(result[0]?.confidence).toBe(0.9);
    });
  });

  describe('validateShape', () => {
    test('validates matching shape', async () => {
      const client = createMockLLMClient(mockValidateShapeMatch);
      const su = SemanticUnknown.from({ name: 'John', email: 'john@example.com' }, undefined, client);
      const result = await su.validateShape('user object with name and email');

      expect(result.matches).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    test('identifies partial match', async () => {
      const client = createMockLLMClient(mockValidateShapePartial);
      const su = SemanticUnknown.from({ name: 'John', age: 30 }, undefined, client);
      const result = await su.validateShape('user object with name and email');

      expect(result.matches).toBe(false);
      expect(result.missingFields).toContain('email');
      expect(result.extraFields).toContain('age');
    });
  });

  describe('generateTypeGuard', () => {
    test('generates type guard code', async () => {
      const client = createMockLLMClient(mockGenerateTypeGuard);
      const su = SemanticUnknown.from({ id: 1, name: 'test' }, undefined, client);
      const result = await su.generateTypeGuard();

      expect(result.typeName).toBe('User');
      expect(result.code).toContain('isUser');
      expect(result.code).toContain('x is User');
    });
  });

  describe('safeAccess', () => {
    test('accesses found property', async () => {
      const client = createMockLLMClient(mockSafeAccessFound);
      const su = SemanticUnknown.from({ email: 'test@example.com' }, undefined, client);
      const result = await su.safeAccess("user's email address");

      expect(result).toBeDefined();
      expect(result?.valueOf()).toBe('test@example.com');
    });

    test('returns undefined for missing property', async () => {
      const client = createMockLLMClient(mockSafeAccessNotFound);
      const su = SemanticUnknown.from({ name: 'John' }, undefined, client);
      const result = await su.safeAccess('phone number');

      expect(result).toBeUndefined();
    });
  });

  describe('matches', () => {
    test('matches semantic description', async () => {
      const client = createMockLLMClient(mockMatchesTrue);
      const su = SemanticUnknown.from([{ id: 1 }, { id: 2 }], undefined, client);
      const result = await su.matches('array of user objects');

      expect(result.matches).toBe(true);
      expect(result.confidence).toBe(0.92);
    });

    test('does not match incorrect description', async () => {
      const client = createMockLLMClient(mockMatchesFalse);
      const su = SemanticUnknown.from('hello', undefined, client);
      const result = await su.matches('array of numbers');

      expect(result.matches).toBe(false);
    });
  });

  describe('narrowTo', () => {
    test('successfully narrows to type', async () => {
      const client = createMockLLMClient(mockNarrowToSuccess);
      const su = SemanticUnknown.from({ id: 1, name: 'John', email: 'john@example.com' }, undefined, client);
      const result = await su.narrowTo<{ id: number; name: string; email: string }>('User');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe(1);
      }
    });

    test('fails with validation errors', async () => {
      const client = createMockLLMClient(mockNarrowToFailure);
      const su = SemanticUnknown.from({ id: -1, name: 'John' }, undefined, client);
      const result = await su.narrowTo('User', ['must have email', 'id must be positive']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Missing required field: email');
      }
    });
  });

  describe('explain', () => {
    test('explains the value', async () => {
      const client = createMockLLMClient(mockExplainUser);
      const su = SemanticUnknown.from({ name: 'John', email: 'john@example.com' }, undefined, client);
      const result = await su.explain();

      expect(result).toContain('user profile');
    });
  });

  describe('isEmpty', () => {
    test('returns true for null', () => {
      expect(SemanticUnknown.from(null).isEmpty()).toBe(true);
    });

    test('returns true for undefined', () => {
      expect(SemanticUnknown.from(undefined).isEmpty()).toBe(true);
    });

    test('returns true for empty string', () => {
      expect(SemanticUnknown.from('').isEmpty()).toBe(true);
    });

    test('returns true for empty array', () => {
      expect(SemanticUnknown.from([]).isEmpty()).toBe(true);
    });

    test('returns true for empty object', () => {
      expect(SemanticUnknown.from({}).isEmpty()).toBe(true);
    });

    test('returns false for non-empty values', () => {
      expect(SemanticUnknown.from('hello').isEmpty()).toBe(false);
      expect(SemanticUnknown.from([1]).isEmpty()).toBe(false);
      expect(SemanticUnknown.from({ a: 1 }).isEmpty()).toBe(false);
      expect(SemanticUnknown.from(0).isEmpty()).toBe(false);
    });
  });

  describe('valueOf', () => {
    test('returns the wrapped value', () => {
      expect(SemanticUnknown.from(42).valueOf()).toBe(42);
      expect(SemanticUnknown.from({ a: 1 }).valueOf()).toEqual({ a: 1 });
      expect(SemanticUnknown.from(null).valueOf()).toBeNull();
    });
  });

  describe('toString', () => {
    test('returns string representation', () => {
      expect(SemanticUnknown.from(123).toString()).toBe('unknown<123>');
      expect(SemanticUnknown.from({ a: 1 }).toString()).toBe('unknown<{"a":1}>');
    });
  });

  describe('toJSON', () => {
    test('returns JSON with value and context', () => {
      const su = SemanticUnknown.from({ test: true }, { source: 'API' });
      expect(su.toJSON()).toEqual({
        value: { test: true },
        context: { source: 'API' },
      });
    });

    test('returns JSON with only value when no context', () => {
      const su = SemanticUnknown.from('test');
      expect(su.toJSON()).toEqual({ value: 'test' });
    });
  });
});

describe('SemanticUnknown prompts', () => {
  test('createInferTypePrompt includes value info', async () => {
    const { createInferTypePrompt } = await import('../prompts.ts');
    const prompt = createInferTypePrompt({ id: 1 }, 'API');

    expect(prompt).toContain('"id": 1');
    expect(prompt).toContain('Source context: API');
  });

  test('createValidateShapePrompt includes description', async () => {
    const { createValidateShapePrompt } = await import('../prompts.ts');
    const prompt = createValidateShapePrompt({ name: 'test' }, 'user with name');

    expect(prompt).toContain('Expected shape: "user with name"');
  });

  test('createNarrowToPrompt includes validation rules', async () => {
    const { createNarrowToPrompt } = await import('../prompts.ts');
    const prompt = createNarrowToPrompt({}, 'User', ['must have email']);

    expect(prompt).toContain('Target type: "User"');
    expect(prompt).toContain('must have email');
  });
});
