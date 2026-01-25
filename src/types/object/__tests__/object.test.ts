/**
 * Unit tests for SemanticObject
 */

import { describe, test, expect } from 'bun:test';
import { SemanticObject } from '../object.ts';
import {
  createMockLLMClient,
  mockSemanticGetNameResponse,
  mockSemanticGetNoMatchResponse,
  mockEquivalentObjectsResponse,
  mockNotEquivalentObjectsResponse,
  mockIdenticalObjectsResponse,
  mockValidObjectResponse,
  mockInvalidObjectResponse,
  mockUserProfileSchemaResponse,
  mockTransformToCamelCaseResponse,
  mockTransformToSnakeCaseResponse,
  mockTransformToPascalCaseResponse,
  mockTransformToKebabCaseResponse,
  mockMergeSuccessResponse,
  mockMergeWithConflictsResponse,
  mockMergePreferThisResponse,
  mockPickContactInfoResponse,
  mockPickIdentificationResponse,
  mockSuggestMissingUserFieldsResponse,
  mockNoSuggestionsResponse,
  mockUserSummaryResponse,
  mockOrderSummaryResponse,
  mockInferUserProfileTypeResponse,
  mockInferOrderTypeResponse,
  mockSensitiveSSNResponse,
  mockSensitivePasswordResponse,
  mockNotSensitiveResponse,
} from './mocks.ts';

describe('SemanticObject', () => {
  describe('static factory methods', () => {
    test('from() creates object from existing object', () => {
      const obj = SemanticObject.from({ name: 'John', age: 30 });
      expect(obj.valueOf()).toEqual({ name: 'John', age: 30 });
    });

    test('empty() creates empty object', () => {
      const obj = SemanticObject.empty();
      expect(obj.valueOf()).toEqual({});
    });

    test('from() creates a copy of the input object', () => {
      const original = { name: 'John' };
      const obj = SemanticObject.from(original);
      original.name = 'Jane';
      expect(obj.valueOf()).toEqual({ name: 'John' });
    });
  });

  describe('valueOf', () => {
    test('returns object data', () => {
      const obj = SemanticObject.from({ a: 1, b: 2 });
      expect(obj.valueOf()).toEqual({ a: 1, b: 2 });
    });

    test('returns a copy, not the internal object', () => {
      const obj = SemanticObject.from({ name: 'John' });
      const value = obj.valueOf();
      (value as Record<string, string>).name = 'Jane';
      expect(obj.valueOf()).toEqual({ name: 'John' });
    });
  });

  describe('semanticGet', () => {
    test('returns exact match with high confidence', async () => {
      const obj = SemanticObject.from({ email: 'john@example.com', name: 'John' });
      const result = await obj.semanticGet('email');

      expect(result.matchedKey).toBe('email');
      expect(result.value).toBe('john@example.com');
      expect(result.confidence).toBe(1.0);
    });

    test('uses LLM for semantic match', async () => {
      const client = createMockLLMClient(mockSemanticGetNameResponse);
      const obj = SemanticObject.from({ firstName: 'John', lastName: 'Doe' }, client);

      const result = await obj.semanticGet('name');

      expect(result.matchedKey).toBe('firstName');
      expect(result.value).toBe('John');
      expect(result.confidence).toBe(0.88);
    });

    test('returns undefined when no match found', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const obj = SemanticObject.from({ foo: 'bar' }, client);

      const result = await obj.semanticGet('nonexistent');

      expect(result.matchedKey).toBeUndefined();
      expect(result.value).toBeUndefined();
    });

    test('returns undefined for empty object', async () => {
      const obj = SemanticObject.empty();

      const result = await obj.semanticGet('anything');

      expect(result.matchedKey).toBeUndefined();
      expect(result.value).toBeUndefined();
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for objects with synonym keys', async () => {
      const client = createMockLLMClient(mockEquivalentObjectsResponse);
      const obj1 = SemanticObject.from({ firstName: 'John', lastName: 'Doe' }, client);
      const obj2 = { first_name: 'John', last_name: 'Doe' };

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(true);
      expect(result.mappings).toEqual({ firstName: 'first_name', lastName: 'last_name' });
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different objects', async () => {
      const client = createMockLLMClient(mockNotEquivalentObjectsResponse);
      const obj1 = SemanticObject.from({ name: 'John' }, client);
      const obj2 = { color: 'blue' };

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(false);
    });

    test('accepts SemanticObject as parameter', async () => {
      const client = createMockLLMClient(mockIdenticalObjectsResponse);
      const obj1 = SemanticObject.from({ name: 'John', email: 'john@example.com' }, client);
      const obj2 = SemanticObject.from({ name: 'John', email: 'john@example.com' });

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(true);
    });

    test('returns equivalent for two empty objects', async () => {
      const obj1 = SemanticObject.empty();
      const obj2 = SemanticObject.empty();

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(true);
      expect(result.mappings).toEqual({});
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('validate', () => {
    test('returns valid for compliant object', async () => {
      const client = createMockLLMClient(mockValidObjectResponse);
      const user = SemanticObject.from(
        { name: 'John', email: 'john@example.com', age: 30 },
        client
      );

      const result = await user.validate(['email must be valid', 'age must be positive']);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('returns issues for non-compliant object', async () => {
      const client = createMockLLMClient(mockInvalidObjectResponse);
      const user = SemanticObject.from({ name: 'John', email: 'invalid', age: -5 }, client);

      const result = await user.validate(['email must be valid', 'age must be positive']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
      expect(result.issues[0]?.field).toBe('email');
      expect(result.issues[1]?.field).toBe('age');
    });

    test('returns valid for empty rules', async () => {
      const obj = SemanticObject.from({ anything: 'value' });

      const result = await obj.validate([]);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('inferSchema', () => {
    test('returns schema with field descriptions', async () => {
      const client = createMockLLMClient(mockUserProfileSchemaResponse);
      const user = SemanticObject.from(
        { id: 123, name: 'John', email: 'john@example.com', age: 30 },
        client
      );

      const result = await user.inferSchema();

      expect(result.type).toBe('user-profile');
      expect(result.fields).toBeDefined();
      expect(result.fields?.id).toEqual({ type: 'number', purpose: 'unique identifier' });
      const emailField = result.fields?.email;
      expect(emailField).toBeDefined();
      expect((emailField as { format?: string }).format).toBe('email');
    });

    test('returns empty schema for empty object', async () => {
      const obj = SemanticObject.empty();

      const result = await obj.inferSchema();

      expect(result.type).toBe('empty');
      expect(result.fields).toEqual({});
    });
  });

  describe('transformKeys', () => {
    test('transforms to camelCase', async () => {
      const client = createMockLLMClient(mockTransformToCamelCaseResponse);
      const obj = SemanticObject.from(
        { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
        client
      );

      const result = await obj.transformKeys('camelCase');
      const value = result.valueOf() as Record<string, string>;

      expect(value.firstName).toBe('John');
      expect(value.lastName).toBe('Doe');
      expect(value.emailAddress).toBe('john@example.com');
    });

    test('transforms to snake_case', async () => {
      const client = createMockLLMClient(mockTransformToSnakeCaseResponse);
      const obj = SemanticObject.from(
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
        client
      );

      const result = await obj.transformKeys('snake_case');
      const value = result.valueOf() as Record<string, string>;

      expect(value.first_name).toBe('John');
      expect(value.last_name).toBe('Doe');
      expect(value.email_address).toBe('john@example.com');
    });

    test('transforms to PascalCase', async () => {
      const client = createMockLLMClient(mockTransformToPascalCaseResponse);
      const obj = SemanticObject.from(
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
        client
      );

      const result = await obj.transformKeys('PascalCase');
      const value = result.valueOf() as Record<string, string>;

      expect(value.FirstName).toBe('John');
      expect(value.LastName).toBe('Doe');
      expect(value.EmailAddress).toBe('john@example.com');
    });

    test('transforms to kebab-case', async () => {
      const client = createMockLLMClient(mockTransformToKebabCaseResponse);
      const obj = SemanticObject.from(
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
        client
      );

      const result = await obj.transformKeys('kebab-case');
      const value = result.valueOf() as Record<string, string>;

      expect(value['first-name']).toBe('John');
      expect(value['last-name']).toBe('Doe');
      expect(value['email-address']).toBe('john@example.com');
    });

    test('returns empty object for empty input', async () => {
      const obj = SemanticObject.empty();

      const result = await obj.transformKeys('camelCase');

      expect(result.valueOf()).toEqual({});
    });
  });

  describe('semanticMerge', () => {
    test('merges objects with synonym key handling', async () => {
      const client = createMockLLMClient(mockMergeSuccessResponse);
      const obj1 = SemanticObject.from({ firstName: 'John', lastName: 'Doe' }, client);
      const obj2 = { first_name: 'John', email: 'john@example.com', phone: '555-1234' };

      const result = await obj1.semanticMerge(obj2);

      const merged = result.valueOf();
      expect(merged).toHaveProperty('firstName');
      expect(merged).toHaveProperty('email');
      expect(merged).toHaveProperty('phone');
    });

    test('handles conflicts with prefer-other', async () => {
      const client = createMockLLMClient(mockMergeWithConflictsResponse);
      const obj1 = SemanticObject.from({ name: 'John', email: 'john@example.com' }, client);
      const obj2 = { name: 'Jane', email: 'jane@example.com', age: 25 };

      const result = await obj1.semanticMerge(obj2, { conflictResolution: 'prefer-other' });

      const merged = result.valueOf();
      expect(merged).toHaveProperty('name');
      expect(merged).toHaveProperty('age');
    });

    test('handles conflicts with prefer-this', async () => {
      const client = createMockLLMClient(mockMergePreferThisResponse);
      const obj1 = SemanticObject.from({ name: 'John', email: 'john@example.com' }, client);
      const obj2 = { name: 'Jane', phone: '555-0000' };

      const result = await obj1.semanticMerge(obj2, { conflictResolution: 'prefer-this' });

      const merged = result.valueOf();
      expect(merged).toHaveProperty('phone');
    });

    test('returns original object when merging with empty', async () => {
      const obj = SemanticObject.from({ name: 'John' });

      const result = await obj.semanticMerge({});

      expect(result.valueOf()).toEqual({ name: 'John' });
    });

    test('returns other object when this is empty', async () => {
      const obj = SemanticObject.empty();

      const result = await obj.semanticMerge({ name: 'John' });

      expect(result.valueOf()).toEqual({ name: 'John' });
    });
  });

  describe('pick', () => {
    test('extracts fields by semantic description', async () => {
      const client = createMockLLMClient(mockPickContactInfoResponse);
      const user = SemanticObject.from(
        { id: 123, name: 'John', email: 'john@example.com', phone: '555-1234', age: 30 },
        client
      );

      const result = await user.pick(['contact information']);

      const picked = result.valueOf();
      expect(picked).toHaveProperty('email');
      expect(picked).toHaveProperty('phone');
    });

    test('extracts identification fields', async () => {
      const client = createMockLLMClient(mockPickIdentificationResponse);
      const user = SemanticObject.from(
        { id: 123, name: 'John Doe', email: 'john@example.com' },
        client
      );

      const result = await user.pick(['identification']);

      const picked = result.valueOf();
      expect(picked).toHaveProperty('id');
      expect(picked).toHaveProperty('name');
    });

    test('returns empty object for empty fields array', async () => {
      const obj = SemanticObject.from({ name: 'John' });

      const result = await obj.pick([]);

      expect(result.valueOf()).toEqual({});
    });

    test('returns empty object for empty input object', async () => {
      const obj = SemanticObject.empty();

      const result = await obj.pick(['anything']);

      expect(result.valueOf()).toEqual({});
    });
  });

  describe('suggestMissingFields', () => {
    test('suggests fields for user profile', async () => {
      const client = createMockLLMClient(mockSuggestMissingUserFieldsResponse);
      const user = SemanticObject.from({ name: 'John', email: 'john@example.com' }, client);

      const suggestions = await user.suggestMissingFields();

      expect(suggestions.length).toBe(3);
      expect(suggestions[0]?.field).toBe('phoneNumber');
      expect(suggestions[0]?.reason).toContain('contact');
    });

    test('returns empty array when object is complete', async () => {
      const client = createMockLLMClient(mockNoSuggestionsResponse);
      const obj = SemanticObject.from({ complete: true }, client);

      const suggestions = await obj.suggestMissingFields();

      expect(suggestions.length).toBe(0);
    });
  });

  describe('summarize', () => {
    test('returns human-readable summary for user', async () => {
      const client = createMockLLMClient(mockUserSummaryResponse);
      const user = SemanticObject.from(
        { id: 123, name: 'John Doe', age: 30, email: 'john@example.com' },
        client
      );

      const summary = await user.summarize();

      expect(summary).toContain('John Doe');
      expect(summary).toContain('123');
    });

    test('returns human-readable summary for order', async () => {
      const client = createMockLLMClient(mockOrderSummaryResponse);
      const order = SemanticObject.from(
        { orderId: 1234, customer: 'Jane Smith', items: 3, total: 150 },
        client
      );

      const summary = await order.summarize();

      expect(summary).toContain('Order');
      expect(summary).toContain('1234');
    });

    test('returns message for empty object', async () => {
      const obj = SemanticObject.empty();

      const summary = await obj.summarize();

      expect(summary).toBe('Empty object with no properties.');
    });
  });

  describe('inferType', () => {
    test('infers user profile type', async () => {
      const client = createMockLLMClient(mockInferUserProfileTypeResponse);
      const user = SemanticObject.from(
        { name: 'John', email: 'john@example.com', age: 30 },
        client
      );

      const result = await user.inferType();

      expect(result.type).toBe('user-profile');
      expect(result.confidence).toBe(0.94);
    });

    test('infers e-commerce order type', async () => {
      const client = createMockLLMClient(mockInferOrderTypeResponse);
      const order = SemanticObject.from(
        { orderId: 1234, items: [], total: 150, status: 'pending' },
        client
      );

      const result = await order.inferType();

      expect(result.type).toBe('e-commerce-order');
    });

    test('returns empty type for empty object', async () => {
      const obj = SemanticObject.empty();

      const result = await obj.inferType();

      expect(result.type).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('isSensitive', () => {
    test('detects SSN as sensitive PII', async () => {
      const client = createMockLLMClient(mockSensitiveSSNResponse);
      const user = SemanticObject.from(
        { name: 'John', ssn: '123-45-6789' },
        client
      );

      const result = await user.isSensitive('ssn');

      expect(result.sensitive).toBe(true);
      expect(result.type).toBe('PII');
      expect(result.recommendation).toContain('encrypt');
    });

    test('detects password as sensitive', async () => {
      const client = createMockLLMClient(mockSensitivePasswordResponse);
      const user = SemanticObject.from(
        { username: 'john', password: 'secret123' },
        client
      );

      const result = await user.isSensitive('password');

      expect(result.sensitive).toBe(true);
      expect(result.type).toBe('authentication');
    });

    test('returns not sensitive for normal fields', async () => {
      const client = createMockLLMClient(mockNotSensitiveResponse);
      const user = SemanticObject.from(
        { name: 'John', favoriteColor: 'blue' },
        client
      );

      const result = await user.isSensitive('favoriteColor');

      expect(result.sensitive).toBe(false);
    });

    test('returns not sensitive for non-existent field', async () => {
      const obj = SemanticObject.from({ name: 'John' });

      const result = await obj.isSensitive('nonexistent');

      expect(result.sensitive).toBe(false);
    });
  });

  describe('utility methods', () => {
    describe('keys', () => {
      test('returns all keys', () => {
        const obj = SemanticObject.from({ a: 1, b: 2, c: 3 });
        expect(obj.keys()).toEqual(['a', 'b', 'c']);
      });

      test('returns empty array for empty object', () => {
        const obj = SemanticObject.empty();
        expect(obj.keys()).toEqual([]);
      });
    });

    describe('values', () => {
      test('returns all values', () => {
        const obj = SemanticObject.from({ a: 1, b: 2, c: 3 });
        expect(obj.values()).toEqual([1, 2, 3]);
      });

      test('returns empty array for empty object', () => {
        const obj = SemanticObject.empty();
        expect(obj.values()).toEqual([]);
      });
    });

    describe('entries', () => {
      test('returns all entries', () => {
        const obj = SemanticObject.from({ a: 1, b: 2 });
        expect(obj.entries()).toEqual([
          ['a', 1],
          ['b', 2],
        ]);
      });
    });

    describe('has', () => {
      test('returns true for existing key', () => {
        const obj = SemanticObject.from({ name: 'John' });
        expect(obj.has('name')).toBe(true);
      });

      test('returns false for non-existing key', () => {
        const obj = SemanticObject.from({ name: 'John' });
        expect(obj.has('age')).toBe(false);
      });
    });

    describe('get', () => {
      test('returns value for existing key', () => {
        const obj = SemanticObject.from({ name: 'John', age: 30 });
        expect(obj.get('name')).toBe('John');
        expect(obj.get('age')).toBe(30);
      });
    });
  });

  describe('toString', () => {
    test('returns JSON string representation', () => {
      const obj = SemanticObject.from({ name: 'John', age: 30 });
      expect(obj.toString()).toBe('{"name":"John","age":30}');
    });
  });

  describe('toJSON', () => {
    test('returns object for JSON serialization', () => {
      const obj = SemanticObject.from({ a: 1, b: 2 });
      expect(obj.toJSON()).toEqual({ a: 1, b: 2 });
    });

    test('works with JSON.stringify', () => {
      const obj = SemanticObject.from({ name: 'John' });
      expect(JSON.stringify(obj)).toBe('{"name":"John"}');
    });
  });
});

describe('SemanticObject prompts', () => {
  test('createSemanticGetPrompt includes object and query', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt({ email: 'test@example.com' }, 'mail');

    expect(prompt).toContain('email');
    expect(prompt).toContain('mail');
  });

  test('createSemanticallyEqualsPrompt includes both objects', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      { firstName: 'John' },
      { first_name: 'John' }
    );

    expect(prompt).toContain('Object 1:');
    expect(prompt).toContain('Object 2:');
    expect(prompt).toContain('firstName');
    expect(prompt).toContain('first_name');
  });

  test('createValidatePrompt includes rules', async () => {
    const { createValidatePrompt } = await import('../prompts.ts');
    const prompt = createValidatePrompt({ age: -5 }, ['age must be positive']);

    expect(prompt).toContain('age must be positive');
  });

  test('createTransformKeysPrompt includes convention', async () => {
    const { createTransformKeysPrompt } = await import('../prompts.ts');
    const prompt = createTransformKeysPrompt({ first_name: 'John' }, 'camelCase');

    expect(prompt).toContain('camelCase');
  });

  test('createSemanticMergePrompt includes conflict resolution', async () => {
    const { createSemanticMergePrompt } = await import('../prompts.ts');
    const prompt = createSemanticMergePrompt(
      { a: 1 },
      { b: 2 },
      { conflictResolution: 'prefer-this' }
    );

    expect(prompt).toContain('prefer-this');
  });

  test('createIsSensitivePrompt includes field name', async () => {
    const { createIsSensitivePrompt } = await import('../prompts.ts');
    const prompt = createIsSensitivePrompt({ ssn: '123-45-6789' }, 'ssn');

    expect(prompt).toContain('ssn');
    expect(prompt).toContain('PII');
  });
});
