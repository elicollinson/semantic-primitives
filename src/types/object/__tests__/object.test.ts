/**
 * Tests for SemanticObject
 */

import { describe, test, expect } from 'bun:test';
import { SemanticObject } from '../object.ts';
import {
  createMockLLMClient,
  mockSemanticGetMatchResponse,
  mockSemanticGetNoMatchResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockValidObjectResponse,
  mockInvalidObjectResponse,
  mockUserSchemaResponse,
  mockCamelCaseResponse,
  mockSnakeCaseResponse,
  mockMergeResponse,
  mockPickResponse,
  mockMissingFieldsResponse,
  mockSummaryResponse,
  mockUserTypeResponse,
  mockSensitiveResponse,
  mockNotSensitiveResponse,
} from './mocks.ts';

describe('SemanticObject', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('from()', () => {
    test('creates SemanticObject from plain object', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ name: 'John', age: 30 }, client);

      expect(obj).toBeInstanceOf(SemanticObject);
    });

    test('creates empty SemanticObject', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.empty(client);

      expect(obj.keys()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // STANDARD OBJECT OPERATIONS TESTS
  // ===========================================================================

  describe('standard operations', () => {
    test('get returns property value', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ name: 'John', age: 30 }, client);

      expect(obj.get('name')).toBe('John');
      expect(obj.get('age')).toBe(30);
    });

    test('set updates property', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ name: 'John' }, client);

      obj.set('name', 'Jane');
      expect(obj.get('name')).toBe('Jane');
    });

    test('has checks property existence', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ name: 'John' }, client);

      expect(obj.has('name')).toBe(true);
      expect(obj.has('age' as keyof { name: string })).toBe(false);
    });

    test('delete removes property', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ name: 'John', age: 30 }, client);

      expect(obj.delete('age')).toBe(true);
      expect(obj.has('age')).toBe(false);
    });

    test('keys returns all keys', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1, b: 2 }, client);

      expect(obj.keys()).toContain('a');
      expect(obj.keys()).toContain('b');
    });

    test('values returns all values', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1, b: 2 }, client);

      expect(obj.values()).toContain(1);
      expect(obj.values()).toContain(2);
    });

    test('entries returns all entries', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1, b: 2 }, client);

      const entries = obj.entries();
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
    });
  });

  // ===========================================================================
  // SEMANTIC GET TESTS
  // ===========================================================================

  describe('semanticGet()', () => {
    test('finds matching key', async () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ emailAddress: 'test@example.com' }, client);

      const result = await obj.semanticGet('email');
      expect(result.matchedKey).toBe('emailAddress');
      expect(result.value).toBe('test@example.com');
    });

    test('returns undefined for no match', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const obj = SemanticObject.from({ name: 'John' }, client);

      const result = await obj.semanticGet('completely unrelated');
      expect(result.matchedKey).toBeUndefined();
      expect(result.value).toBeUndefined();
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const obj = SemanticObject.empty(client);

      const result = await obj.semanticGet('anything');
      expect(result.value).toBeUndefined();
      expect(result.confidence).toBe(1.0);
    });
  });

  // ===========================================================================
  // SEMANTICALLY EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent objects', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const obj1 = SemanticObject.from({ firstName: 'John', lastName: 'Doe' }, client);
      const obj2 = { first_name: 'John', last_name: 'Doe' };

      const result = await obj1.semanticallyEquals(obj2);
      expect(result.equivalent).toBe(true);
      expect(result.mappings).toBeDefined();
    });

    test('returns false for different objects', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const obj1 = SemanticObject.from({ name: 'John' }, client);
      const obj2 = { email: 'john@example.com' };

      const result = await obj1.semanticallyEquals(obj2);
      expect(result.equivalent).toBe(false);
    });

    test('compares with SemanticObject', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const obj1 = SemanticObject.from({ firstName: 'John' }, client);
      const obj2 = SemanticObject.from({ first_name: 'John' }, client);

      const result = await obj1.semanticallyEquals(obj2);
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // VALIDATE TESTS
  // ===========================================================================

  describe('validate()', () => {
    test('returns valid for valid object', async () => {
      const client = createMockLLMClient(mockValidObjectResponse);
      const obj = SemanticObject.from({ email: 'test@example.com', name: 'John' }, client);

      const result = await obj.validate(['email must be valid', 'name should not be empty']);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('returns issues for invalid object', async () => {
      const client = createMockLLMClient(mockInvalidObjectResponse);
      const obj = SemanticObject.from({ email: 'invalid', age: 999 }, client);

      const result = await obj.validate(['email must be valid', 'age must be reasonable']);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockValidObjectResponse);
      const obj = SemanticObject.empty(client);

      const result = await obj.validate(['any rule']);
      expect(result.valid).toBe(true);
    });
  });

  // ===========================================================================
  // INFER SCHEMA TESTS
  // ===========================================================================

  describe('inferSchema()', () => {
    test('infers schema for object', async () => {
      const client = createMockLLMClient(mockUserSchemaResponse);
      const obj = SemanticObject.from(
        { id: 1, email: 'test@example.com', name: 'John' },
        client
      );

      const schema = await obj.inferSchema();
      expect(schema.type).toBe('user-profile');
      expect(schema.fields).toBeDefined();
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockUserSchemaResponse);
      const obj = SemanticObject.empty(client);

      const schema = await obj.inferSchema();
      expect(schema.confidence).toBe(1.0);
    });
  });

  // ===========================================================================
  // TRANSFORM KEYS TESTS
  // ===========================================================================

  describe('transformKeys()', () => {
    test('transforms to camelCase', async () => {
      const client = createMockLLMClient(mockCamelCaseResponse);
      const obj = SemanticObject.from({ first_name: 'John', last_name: 'Doe' }, client);

      const transformed = await obj.transformKeys('camelCase');
      expect(transformed).toBeInstanceOf(SemanticObject);
    });

    test('transforms to snake_case', async () => {
      const client = createMockLLMClient(mockSnakeCaseResponse);
      const obj = SemanticObject.from({ firstName: 'John', lastName: 'Doe' }, client);

      const transformed = await obj.transformKeys('snake_case');
      expect(transformed).toBeInstanceOf(SemanticObject);
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockCamelCaseResponse);
      const obj = SemanticObject.empty(client);

      const transformed = await obj.transformKeys('camelCase');
      expect(transformed.keys()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // SEMANTIC MERGE TESTS
  // ===========================================================================

  describe('semanticMerge()', () => {
    test('merges objects with semantic matching', async () => {
      const client = createMockLLMClient(mockMergeResponse);
      const obj1 = SemanticObject.from({ id: 1, name: 'John' }, client);
      const obj2 = { email: 'john@example.com', age: 30 };

      const merged = await obj1.semanticMerge(obj2);
      expect(merged).toBeInstanceOf(SemanticObject);
    });

    test('accepts conflict resolution option', async () => {
      const client = createMockLLMClient(mockMergeResponse);
      const obj1 = SemanticObject.from({ name: 'John' }, client);
      const obj2 = { name: 'Jane' };

      const merged = await obj1.semanticMerge(obj2, { conflictResolution: 'prefer-other' });
      expect(merged).toBeInstanceOf(SemanticObject);
    });
  });

  // ===========================================================================
  // PICK TESTS
  // ===========================================================================

  describe('pick()', () => {
    test('picks fields by semantic matching', async () => {
      const client = createMockLLMClient(mockPickResponse);
      const obj = SemanticObject.from(
        { email: 'john@example.com', phone: '555-1234', name: 'John' },
        client
      );

      const picked = await obj.pick(['contact information']);
      expect(picked).toBeInstanceOf(SemanticObject);
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockPickResponse);
      const obj = SemanticObject.empty(client);

      const picked = await obj.pick(['any field']);
      expect(picked.keys()).toHaveLength(0);
    });

    test('handles empty fields array', async () => {
      const client = createMockLLMClient(mockPickResponse);
      const obj = SemanticObject.from({ name: 'John' }, client);

      const picked = await obj.pick([]);
      expect(picked.keys()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // SUGGEST MISSING FIELDS TESTS
  // ===========================================================================

  describe('suggestMissingFields()', () => {
    test('suggests missing fields', async () => {
      const client = createMockLLMClient(mockMissingFieldsResponse);
      const obj = SemanticObject.from({ name: 'John', email: 'john@example.com' }, client);

      const suggestions = await obj.suggestMissingFields();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('field');
      expect(suggestions[0]).toHaveProperty('reason');
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockMissingFieldsResponse);
      const obj = SemanticObject.empty(client);

      const suggestions = await obj.suggestMissingFields();
      expect(suggestions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // SUMMARIZE TESTS
  // ===========================================================================

  describe('summarize()', () => {
    test('returns summary', async () => {
      const client = createMockLLMClient(mockSummaryResponse);
      const obj = SemanticObject.from({ name: 'John', email: 'john@example.com', age: 30 }, client);

      const summary = await obj.summarize();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockSummaryResponse);
      const obj = SemanticObject.empty(client);

      const summary = await obj.summarize();
      expect(summary).toContain('Empty');
    });
  });

  // ===========================================================================
  // INFER TYPE TESTS
  // ===========================================================================

  describe('inferType()', () => {
    test('infers user profile type', async () => {
      const client = createMockLLMClient(mockUserTypeResponse);
      const obj = SemanticObject.from({ name: 'John', email: 'john@example.com' }, client);

      const result = await obj.inferType();
      expect(result.type).toBe('user-profile');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('handles empty object', async () => {
      const client = createMockLLMClient(mockUserTypeResponse);
      const obj = SemanticObject.empty(client);

      const result = await obj.inferType();
      expect(result.type).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  // ===========================================================================
  // IS SENSITIVE TESTS
  // ===========================================================================

  describe('isSensitive()', () => {
    test('detects sensitive field', async () => {
      const client = createMockLLMClient(mockSensitiveResponse);
      const obj = SemanticObject.from({ ssn: '123-45-6789' }, client);

      const result = await obj.isSensitive('ssn');
      expect(result.sensitive).toBe(true);
      expect(result.type).toBe('PII');
      expect(result.recommendation).toBeDefined();
    });

    test('detects non-sensitive field', async () => {
      const client = createMockLLMClient(mockNotSensitiveResponse);
      const obj = SemanticObject.from({ name: 'John' }, client);

      const result = await obj.isSensitive('name');
      expect(result.sensitive).toBe(false);
    });

    test('returns not sensitive for non-existent field', async () => {
      const client = createMockLLMClient(mockNotSensitiveResponse);
      const obj = SemanticObject.from({ name: 'John' }, client);

      const result = await obj.isSensitive('nonexistent');
      expect(result.sensitive).toBe(false);
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('valueOf returns plain object', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1, b: 2 }, client);

      const plain = obj.valueOf();
      expect(plain).toEqual({ a: 1, b: 2 });
    });

    test('toObject returns plain object', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1, b: 2 }, client);

      expect(obj.toObject()).toEqual({ a: 1, b: 2 });
    });

    test('toJSON returns plain object', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1, b: 2 }, client);

      expect(obj.toJSON()).toEqual({ a: 1, b: 2 });
    });

    test('toString returns JSON string', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const obj = SemanticObject.from({ a: 1 }, client);

      expect(obj.toString()).toBe('{"a":1}');
    });
  });
});
