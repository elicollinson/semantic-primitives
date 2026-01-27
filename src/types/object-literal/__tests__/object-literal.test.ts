/**
 * Unit tests for SemanticObjectLiteral
 */

import { describe, test, expect } from 'bun:test';
import { SemanticObjectLiteral } from '../object-literal.ts';
import {
  createMockLLMClient,
  mockEquivalentObjectsResponse,
  mockNotEquivalentObjectsResponse,
  mockIdenticalObjectsResponse,
  mockUserProfileSchemaResponse,
  mockOrderSchemaResponse,
  mockValidObjectResponse,
  mockInvalidObjectResponse,
  mockSingleViolationResponse,
  mockUserProfileDomainResponse,
  mockOrderDomainResponse,
  mockFindContactInfoResponse,
  mockFindIdentificationResponse,
  mockNoMatchesResponse,
  mockUserSuggestionsResponse,
  mockNoSuggestionsResponse,
  mockSensitiveSSNResponse,
  mockSensitivePasswordResponse,
  mockNotSensitiveResponse,
  mockTransformToCamelCaseResponse,
  mockTransformToSnakeCaseResponse,
  mockTransformToPascalCaseResponse,
  mockTransformToKebabCaseResponse,
  mockUserInterfaceResponse,
  mockOrderInterfaceResponse,
  mockUserSummaryResponse,
  mockOrderSummaryResponse,
} from './mocks.ts';

describe('SemanticObjectLiteral', () => {
  describe('static factory method', () => {
    test('from() creates instance from plain object', () => {
      const obj = SemanticObjectLiteral.from({ name: 'John', age: 30 });
      expect(obj.valueOf()).toEqual({ name: 'John', age: 30 });
    });

    test('from() accepts optional context', () => {
      const obj = SemanticObjectLiteral.from({ name: 'John' }, 'user data');
      expect(obj.getContext()).toBe('user data');
    });

    test('from() creates a copy of the input object', () => {
      const original = { name: 'John' };
      const obj = SemanticObjectLiteral.from(original);
      original.name = 'Jane';
      expect(obj.valueOf()).toEqual({ name: 'John' });
    });
  });

  describe('valueOf', () => {
    test('returns object data', () => {
      const obj = SemanticObjectLiteral.from({ a: 1, b: 2 });
      expect(obj.valueOf()).toEqual({ a: 1, b: 2 });
    });

    test('returns a copy, not the internal object', () => {
      const obj = SemanticObjectLiteral.from({ name: 'John' });
      const value = obj.valueOf();
      (value as Record<string, string>).name = 'Jane';
      expect(obj.valueOf()).toEqual({ name: 'John' });
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for objects with synonym keys', async () => {
      const client = createMockLLMClient(mockEquivalentObjectsResponse);
      const obj1 = SemanticObjectLiteral.from(
        { firstName: 'John', lastName: 'Doe' },
        undefined,
        client
      );
      const obj2 = { first_name: 'John', last_name: 'Doe' };

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(true);
      expect(result.mappings).toEqual({ firstName: 'first_name', lastName: 'last_name' });
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different objects', async () => {
      const client = createMockLLMClient(mockNotEquivalentObjectsResponse);
      const obj1 = SemanticObjectLiteral.from({ name: 'John' }, undefined, client);
      const obj2 = { color: 'blue' };

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(false);
    });

    test('accepts SemanticObjectLiteral as parameter', async () => {
      const client = createMockLLMClient(mockIdenticalObjectsResponse);
      const obj1 = SemanticObjectLiteral.from(
        { name: 'John', email: 'john@example.com' },
        undefined,
        client
      );
      const obj2 = SemanticObjectLiteral.from({ name: 'John', email: 'john@example.com' });

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(true);
    });

    test('returns equivalent for two empty objects', async () => {
      const obj1 = SemanticObjectLiteral.from({});
      const obj2 = SemanticObjectLiteral.from({});

      const result = await obj1.semanticallyEquals(obj2);

      expect(result.equivalent).toBe(true);
      expect(result.mappings).toEqual({});
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('inferSchema', () => {
    test('returns schema with name, properties, and required/optional', async () => {
      const client = createMockLLMClient(mockUserProfileSchemaResponse);
      const user = SemanticObjectLiteral.from(
        { id: 123, name: 'John', email: 'john@example.com', age: 30 },
        undefined,
        client
      );

      const result = await user.inferSchema();

      expect(result.name).toBe('UserProfile');
      expect(result.properties).toBeDefined();
      expect(result.properties.id).toBe('number');
      expect(result.properties.email).toBe('string');
      expect(result.required).toContain('id');
      expect(result.required).toContain('name');
      expect(result.optional).toContain('age');
    });

    test('infers order schema', async () => {
      const client = createMockLLMClient(mockOrderSchemaResponse);
      const order = SemanticObjectLiteral.from(
        { orderId: 'ORD-123', items: [], total: 150, status: 'pending' },
        undefined,
        client
      );

      const result = await order.inferSchema();

      expect(result.name).toBe('Order');
      expect(result.properties.orderId).toBe('string');
    });

    test('returns empty schema for empty object', async () => {
      const obj = SemanticObjectLiteral.from({});

      const result = await obj.inferSchema();

      expect(result.name).toBe('Empty');
      expect(result.properties).toEqual({});
      expect(result.required).toEqual([]);
      expect(result.optional).toEqual([]);
    });
  });

  describe('validateWithRules', () => {
    test('returns valid for compliant object', async () => {
      const client = createMockLLMClient(mockValidObjectResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', email: 'john@example.com', age: 30 },
        undefined,
        client
      );

      const result = await user.validateWithRules([
        'email must be valid',
        'age must be positive',
      ]);

      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('returns violations for non-compliant object', async () => {
      const client = createMockLLMClient(mockInvalidObjectResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', email: 'invalid', age: -5 },
        undefined,
        client
      );

      const result = await user.validateWithRules([
        'email must be valid',
        'age must be reasonable for a human',
      ]);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBe(2);
      expect(result.violations[0]?.field).toBe('email');
      expect(result.violations[1]?.field).toBe('age');
    });

    test('returns single violation', async () => {
      const client = createMockLLMClient(mockSingleViolationResponse);
      const product = SemanticObjectLiteral.from(
        { name: 'Widget', price: 0 },
        undefined,
        client
      );

      const result = await product.validateWithRules(['price must be positive']);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBe(1);
      expect(result.violations[0]?.rule).toBe('price must be positive');
    });

    test('returns valid for empty rules', async () => {
      const obj = SemanticObjectLiteral.from({ anything: 'value' });

      const result = await obj.validateWithRules([]);

      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });

  describe('detectDomain', () => {
    test('detects user profile domain with interface suggestion', async () => {
      const client = createMockLLMClient(mockUserProfileDomainResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', email: 'john@example.com', age: 30 },
        undefined,
        client
      );

      const result = await user.detectDomain();

      expect(result.domain).toBe('user-profile');
      expect(result.confidence).toBe(0.94);
      expect(result.suggestedInterface).toContain('interface User');
    });

    test('detects e-commerce order domain', async () => {
      const client = createMockLLMClient(mockOrderDomainResponse);
      const order = SemanticObjectLiteral.from(
        { orderId: '123', items: [], total: 150 },
        undefined,
        client
      );

      const result = await order.detectDomain();

      expect(result.domain).toBe('e-commerce-order');
      expect(result.suggestedInterface).toBeUndefined();
    });

    test('returns empty domain for empty object', async () => {
      const obj = SemanticObjectLiteral.from({});

      const result = await obj.detectDomain();

      expect(result.domain).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('findProperties', () => {
    test('finds contact information properties', async () => {
      const client = createMockLLMClient(mockFindContactInfoResponse);
      const user = SemanticObjectLiteral.from(
        { id: 123, name: 'John', email: 'john@example.com', phone: '555-1234', age: 30 },
        undefined,
        client
      );

      const results = await user.findProperties('contact information');

      expect(results.length).toBe(2);
      expect(results[0]?.key).toBe('email');
      expect(results[0]?.relevance).toBe(0.95);
      expect(results[1]?.key).toBe('phone');
    });

    test('finds identification properties', async () => {
      const client = createMockLLMClient(mockFindIdentificationResponse);
      const user = SemanticObjectLiteral.from(
        { id: 123, name: 'John Doe', email: 'john@example.com' },
        undefined,
        client
      );

      const results = await user.findProperties('identification');

      expect(results.length).toBe(2);
      expect(results[0]?.key).toBe('id');
      expect(results[0]?.value).toBe(123);
    });

    test('returns empty array when no matches', async () => {
      const client = createMockLLMClient(mockNoMatchesResponse);
      const obj = SemanticObjectLiteral.from({ foo: 'bar' }, undefined, client);

      const results = await obj.findProperties('medical history');

      expect(results).toEqual([]);
    });

    test('returns empty array for empty object', async () => {
      const obj = SemanticObjectLiteral.from({});

      const results = await obj.findProperties('anything');

      expect(results).toEqual([]);
    });
  });

  describe('suggestMissingProperties', () => {
    test('suggests properties for user profile', async () => {
      const client = createMockLLMClient(mockUserSuggestionsResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', email: 'john@example.com' },
        undefined,
        client
      );

      const suggestions = await user.suggestMissingProperties();

      expect(suggestions.length).toBe(3);
      expect(suggestions[0]?.property).toBe('phoneNumber');
      expect(suggestions[0]?.type).toBe('string');
      expect(suggestions[0]?.reason).toContain('contact');
    });

    test('returns empty array when no suggestions', async () => {
      const client = createMockLLMClient(mockNoSuggestionsResponse);
      const obj = SemanticObjectLiteral.from({ complete: true }, undefined, client);

      const suggestions = await obj.suggestMissingProperties();

      expect(suggestions.length).toBe(0);
    });

    test('returns empty array for empty object', async () => {
      const obj = SemanticObjectLiteral.from({});

      const suggestions = await obj.suggestMissingProperties();

      expect(suggestions).toEqual([]);
    });
  });

  describe('isSensitive', () => {
    test('detects SSN as sensitive PII', async () => {
      const client = createMockLLMClient(mockSensitiveSSNResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', ssn: '123-45-6789' },
        undefined,
        client
      );

      const result = await user.isSensitive('ssn');

      expect(result.sensitive).toBe(true);
      expect(result.type).toBe('PII');
      expect(result.recommendation).toContain('encrypt');
    });

    test('detects password as sensitive', async () => {
      const client = createMockLLMClient(mockSensitivePasswordResponse);
      const user = SemanticObjectLiteral.from(
        { username: 'john', password: 'secret123' },
        undefined,
        client
      );

      const result = await user.isSensitive('password');

      expect(result.sensitive).toBe(true);
      expect(result.type).toBe('authentication');
    });

    test('returns not sensitive for normal fields', async () => {
      const client = createMockLLMClient(mockNotSensitiveResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', favoriteColor: 'blue' },
        undefined,
        client
      );

      const result = await user.isSensitive('favoriteColor');

      expect(result.sensitive).toBe(false);
    });

    test('returns not sensitive for non-existent field', async () => {
      const obj = SemanticObjectLiteral.from({ name: 'John' });

      const result = await obj.isSensitive('nonexistent');

      expect(result.sensitive).toBe(false);
    });

    test('handles nested property paths', async () => {
      const client = createMockLLMClient(mockSensitiveSSNResponse);
      const user = SemanticObjectLiteral.from(
        { personal: { ssn: '123-45-6789' } },
        undefined,
        client
      );

      const result = await user.isSensitive('personal.ssn');

      expect(result.sensitive).toBe(true);
    });
  });

  describe('transformKeys', () => {
    test('transforms to camelCase', async () => {
      const client = createMockLLMClient(mockTransformToCamelCaseResponse);
      const obj = SemanticObjectLiteral.from(
        { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
        undefined,
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
      const obj = SemanticObjectLiteral.from(
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
        undefined,
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
      const obj = SemanticObjectLiteral.from(
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
        undefined,
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
      const obj = SemanticObjectLiteral.from(
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
        undefined,
        client
      );

      const result = await obj.transformKeys('kebab-case');
      const value = result.valueOf() as Record<string, string>;

      expect(value['first-name']).toBe('John');
      expect(value['last-name']).toBe('Doe');
      expect(value['email-address']).toBe('john@example.com');
    });

    test('returns empty object for empty input', async () => {
      const obj = SemanticObjectLiteral.from({});

      const result = await obj.transformKeys('camelCase');

      expect(result.valueOf()).toEqual({});
    });
  });

  describe('generateInterface', () => {
    test('generates User interface', async () => {
      const client = createMockLLMClient(mockUserInterfaceResponse);
      const user = SemanticObjectLiteral.from(
        { name: 'John', email: 'john@example.com', age: 30 },
        undefined,
        client
      );

      const interfaceCode = await user.generateInterface('User');

      expect(interfaceCode).toContain('interface User');
      expect(interfaceCode).toContain('name: string');
      expect(interfaceCode).toContain('email: string');
    });

    test('generates Order interface', async () => {
      const client = createMockLLMClient(mockOrderInterfaceResponse);
      const order = SemanticObjectLiteral.from(
        { orderId: '123', items: [], total: 150 },
        undefined,
        client
      );

      const interfaceCode = await order.generateInterface('Order');

      expect(interfaceCode).toContain('interface Order');
      expect(interfaceCode).toContain('orderId: string');
    });

    test('returns empty interface for empty object', async () => {
      const obj = SemanticObjectLiteral.from({});

      const interfaceCode = await obj.generateInterface('Empty');

      expect(interfaceCode).toBe('interface Empty {}');
    });
  });

  describe('summarize', () => {
    test('returns human-readable summary for user', async () => {
      const client = createMockLLMClient(mockUserSummaryResponse);
      const user = SemanticObjectLiteral.from(
        { id: 123, name: 'John Doe', email: 'john@example.com' },
        undefined,
        client
      );

      const summary = await user.summarize();

      expect(summary).toContain('John Doe');
      expect(summary).toContain('123');
    });

    test('returns human-readable summary for order', async () => {
      const client = createMockLLMClient(mockOrderSummaryResponse);
      const order = SemanticObjectLiteral.from(
        { orderId: '1234', items: 3, total: 150, status: 'pending' },
        undefined,
        client
      );

      const summary = await order.summarize();

      expect(summary).toContain('Order');
      expect(summary).toContain('1234');
    });

    test('returns message for empty object', async () => {
      const obj = SemanticObjectLiteral.from({});

      const summary = await obj.summarize();

      expect(summary).toBe('Empty object with no properties.');
    });
  });

  describe('utility methods', () => {
    describe('keys', () => {
      test('returns all keys', () => {
        const obj = SemanticObjectLiteral.from({ a: 1, b: 2, c: 3 });
        expect(obj.keys()).toEqual(['a', 'b', 'c']);
      });

      test('returns empty array for empty object', () => {
        const obj = SemanticObjectLiteral.from({});
        expect(obj.keys()).toEqual([]);
      });
    });

    describe('values', () => {
      test('returns all values', () => {
        const obj = SemanticObjectLiteral.from({ a: 1, b: 2, c: 3 });
        expect(obj.values()).toEqual([1, 2, 3]);
      });

      test('returns empty array for empty object', () => {
        const obj = SemanticObjectLiteral.from({});
        expect(obj.values()).toEqual([]);
      });
    });

    describe('entries', () => {
      test('returns all entries', () => {
        const obj = SemanticObjectLiteral.from({ a: 1, b: 2 });
        expect(obj.entries()).toEqual([
          ['a', 1],
          ['b', 2],
        ]);
      });
    });

    describe('has', () => {
      test('returns true for existing key', () => {
        const obj = SemanticObjectLiteral.from({ name: 'John' });
        expect(obj.has('name')).toBe(true);
      });

      test('returns false for non-existing key', () => {
        const obj = SemanticObjectLiteral.from({ name: 'John' });
        expect(obj.has('age')).toBe(false);
      });
    });

    describe('get', () => {
      test('returns value for existing key', () => {
        const obj = SemanticObjectLiteral.from({ name: 'John', age: 30 });
        expect(obj.get('name')).toBe('John');
        expect(obj.get('age')).toBe(30);
      });
    });

    describe('getContext', () => {
      test('returns context when provided', () => {
        const obj = SemanticObjectLiteral.from({ name: 'John' }, 'user data');
        expect(obj.getContext()).toBe('user data');
      });

      test('returns undefined when no context', () => {
        const obj = SemanticObjectLiteral.from({ name: 'John' });
        expect(obj.getContext()).toBeUndefined();
      });
    });
  });

  describe('toString', () => {
    test('returns JSON string representation', () => {
      const obj = SemanticObjectLiteral.from({ name: 'John', age: 30 });
      expect(obj.toString()).toBe('{"name":"John","age":30}');
    });
  });

  describe('toJSON', () => {
    test('returns object for JSON serialization', () => {
      const obj = SemanticObjectLiteral.from({ a: 1, b: 2 });
      expect(obj.toJSON()).toEqual({ a: 1, b: 2 });
    });

    test('works with JSON.stringify', () => {
      const obj = SemanticObjectLiteral.from({ name: 'John' });
      expect(JSON.stringify(obj)).toBe('{"name":"John"}');
    });
  });
});

describe('SemanticObjectLiteral prompts', () => {
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

  test('createInferSchemaPrompt includes object', async () => {
    const { createInferSchemaPrompt } = await import('../prompts.ts');
    const prompt = createInferSchemaPrompt({ id: 123, name: 'John' });

    expect(prompt).toContain('id');
    expect(prompt).toContain('name');
    expect(prompt).toContain('123');
  });

  test('createValidateWithRulesPrompt includes rules', async () => {
    const { createValidateWithRulesPrompt } = await import('../prompts.ts');
    const prompt = createValidateWithRulesPrompt({ age: -5 }, ['age must be positive']);

    expect(prompt).toContain('age must be positive');
    expect(prompt).toContain('-5');
  });

  test('createDetectDomainPrompt includes object', async () => {
    const { createDetectDomainPrompt } = await import('../prompts.ts');
    const prompt = createDetectDomainPrompt({ email: 'test@example.com', name: 'John' });

    expect(prompt).toContain('email');
    expect(prompt).toContain('name');
  });

  test('createFindPropertiesPrompt includes description', async () => {
    const { createFindPropertiesPrompt } = await import('../prompts.ts');
    const prompt = createFindPropertiesPrompt(
      { email: 'test@example.com', phone: '555-1234' },
      'contact information'
    );

    expect(prompt).toContain('contact information');
    expect(prompt).toContain('email');
  });

  test('createSuggestMissingPropertiesPrompt includes object', async () => {
    const { createSuggestMissingPropertiesPrompt } = await import('../prompts.ts');
    const prompt = createSuggestMissingPropertiesPrompt({ name: 'John', email: 'john@test.com' });

    expect(prompt).toContain('name');
    expect(prompt).toContain('email');
  });

  test('createIsSensitivePrompt includes field name', async () => {
    const { createIsSensitivePrompt } = await import('../prompts.ts');
    const prompt = createIsSensitivePrompt({ ssn: '123-45-6789' }, 'ssn');

    expect(prompt).toContain('ssn');
    expect(prompt).toContain('PII');
  });

  test('createTransformKeysPrompt includes convention', async () => {
    const { createTransformKeysPrompt } = await import('../prompts.ts');
    const prompt = createTransformKeysPrompt({ first_name: 'John' }, 'camelCase');

    expect(prompt).toContain('camelCase');
    expect(prompt).toContain('first_name');
  });

  test('createGenerateInterfacePrompt includes name', async () => {
    const { createGenerateInterfacePrompt } = await import('../prompts.ts');
    const prompt = createGenerateInterfacePrompt({ name: 'John', age: 30 }, 'User');

    expect(prompt).toContain('User');
    expect(prompt).toContain('name');
  });

  test('createSummarizePrompt includes object', async () => {
    const { createSummarizePrompt } = await import('../prompts.ts');
    const prompt = createSummarizePrompt({ id: 123, name: 'John Doe' });

    expect(prompt).toContain('123');
    expect(prompt).toContain('John Doe');
  });
});
