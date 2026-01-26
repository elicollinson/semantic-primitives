/**
 * Unit tests for SemanticAny
 */

import { describe, test, expect } from 'bun:test';
import { SemanticAny } from '../any.ts';
import {
  createMockLLMClient,
  mockClassifyIntentEscapeHatch,
  mockClassifyIntentLazy,
  mockClassifyIntentNecessary,
  mockSuggestTypeObject,
  mockSuggestTypeArray,
  mockSuggestTypePrimitive,
  mockAssessRiskHigh,
  mockAssessRiskMedium,
  mockAssessRiskLow,
  mockGenerateMigrationSimple,
  mockGenerateMigrationStrict,
  mockValidateValid,
  mockValidateInvalid,
  mockIsSafeForSafe,
  mockIsSafeForUnsafe,
  mockExplainResponse,
} from './mocks.ts';

describe('SemanticAny', () => {
  describe('from', () => {
    test('creates SemanticAny with value', () => {
      const sa = SemanticAny.from({ name: 'John', age: 30 });
      expect(sa.valueOf()).toEqual({ name: 'John', age: 30 });
    });

    test('creates SemanticAny with context', () => {
      const sa = SemanticAny.from('test', { source: 'legacy API response' });
      expect(sa.getContext()).toEqual({ source: 'legacy API response' });
    });

    test('accepts custom LLM client', () => {
      const client = createMockLLMClient({});
      const sa = SemanticAny.from('test', undefined, client);
      expect(sa.valueOf()).toBe('test');
    });
  });

  describe('classifyIntent', () => {
    test('classifies escape-hatch intent', async () => {
      const client = createMockLLMClient(mockClassifyIntentEscapeHatch);
      const sa = SemanticAny.from({ external: true }, { source: 'untyped library' }, client);
      const result = await sa.classifyIntent();

      expect(result.intent).toBe('escape-hatch');
      expect(result.reason).toBe('Interfacing with untyped library');
      expect(result.risk).toBe('medium');
    });

    test('classifies lazy intent', async () => {
      const client = createMockLLMClient(mockClassifyIntentLazy);
      const sa = SemanticAny.from({ name: 'test' }, undefined, client);
      const result = await sa.classifyIntent();

      expect(result.intent).toBe('lazy');
      expect(result.risk).toBe('low');
    });

    test('classifies necessary intent', async () => {
      const client = createMockLLMClient(mockClassifyIntentNecessary);
      const sa = SemanticAny.from({}, { reason: 'dynamic data' }, client);
      const result = await sa.classifyIntent();

      expect(result.intent).toBe('necessary');
    });
  });

  describe('suggestType', () => {
    test('suggests object type with interface', async () => {
      const client = createMockLLMClient(mockSuggestTypeObject);
      const sa = SemanticAny.from({ name: 'John', age: 30 }, undefined, client);
      const result = await sa.suggestType();

      expect(result.type).toBe('{ name: string; age: number }');
      expect(result.interface).toBe('interface User { name: string; age: number; }');
      expect(result.confidence).toBe(0.95);
    });

    test('suggests array type', async () => {
      const client = createMockLLMClient(mockSuggestTypeArray);
      const sa = SemanticAny.from(['a', 'b', 'c'], undefined, client);
      const result = await sa.suggestType();

      expect(result.type).toBe('string[]');
      expect(result.interface).toBeNull();
      expect(result.confidence).toBe(0.98);
    });

    test('suggests primitive type', async () => {
      const client = createMockLLMClient(mockSuggestTypePrimitive);
      const sa = SemanticAny.from(42, undefined, client);
      const result = await sa.suggestType();

      expect(result.type).toBe('number');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('assessRisk', () => {
    test('assesses high risk for security-sensitive context', async () => {
      const client = createMockLLMClient(mockAssessRiskHigh);
      const sa = SemanticAny.from('<script>alert("xss")</script>', { source: 'user input' }, client);
      const result = await sa.assessRisk();

      expect(result.level).toBe('high');
      expect(result.reasons).toContain('Value is used in security-sensitive context');
      expect(result.recommendations).toContain('Add runtime validation');
    });

    test('assesses medium risk', async () => {
      const client = createMockLLMClient(mockAssessRiskMedium);
      const sa = SemanticAny.from({ data: 'test' }, undefined, client);
      const result = await sa.assessRisk();

      expect(result.level).toBe('medium');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('assesses low risk for simple values', async () => {
      const client = createMockLLMClient(mockAssessRiskLow);
      const sa = SemanticAny.from(123, undefined, client);
      const result = await sa.assessRisk();

      expect(result.level).toBe('low');
    });
  });

  describe('generateMigration', () => {
    test('generates simple migration', async () => {
      const client = createMockLLMClient(mockGenerateMigrationSimple);
      const sa = SemanticAny.from({ data: 'test', status: 200 }, undefined, client);
      const result = await sa.generateMigration();

      expect(result.typeDefinition).toContain('interface');
      expect(result.usage).toBeDefined();
    });

    test('generates strict migration with type guard', async () => {
      const client = createMockLLMClient(mockGenerateMigrationStrict);
      const sa = SemanticAny.from({ name: 'John', age: 30 }, undefined, client);
      const result = await sa.generateMigration({ strict: true });

      expect(result.typeDefinition).toContain('interface User');
      expect(result.typeGuard).toContain('isUser');
      expect(result.usage).toContain('if (isUser');
    });
  });

  describe('validate', () => {
    test('validates valid value', async () => {
      const client = createMockLLMClient(mockValidateValid);
      const sa = SemanticAny.from({ name: 'John', age: 30 }, undefined, client);
      const result = await sa.validate();

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.inferredShape).toBe('{ name: string; age: number }');
    });

    test('identifies invalid value with issues', async () => {
      const client = createMockLLMClient(mockValidateInvalid);
      const sa = SemanticAny.from({ name: 'John', age: 'not a number' }, undefined, client);
      const result = await sa.validate();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Field "age" is not a number');
    });
  });

  describe('isSafeFor', () => {
    test('returns safe for appropriate context', async () => {
      const client = createMockLLMClient(mockIsSafeForSafe);
      const sa = SemanticAny.from({ id: 123 }, undefined, client);
      const result = await sa.isSafeFor('database query parameter');

      expect(result.safe).toBe(true);
    });

    test('returns unsafe with reason for dangerous context', async () => {
      const client = createMockLLMClient(mockIsSafeForUnsafe);
      const sa = SemanticAny.from('<script>alert("xss")</script>', undefined, client);
      const result = await sa.isSafeFor('DOM manipulation');

      expect(result.safe).toBe(false);
      expect(result.reason).toContain('XSS');
    });
  });

  describe('explain', () => {
    test('explains why any is used and suggests alternatives', async () => {
      const client = createMockLLMClient(mockExplainResponse);
      const sa = SemanticAny.from({}, { source: 'variable API response' }, client);
      const result = await sa.explain();

      expect(result.explanation).toBe('This any is used because the API response shape varies');
      expect(result.alternatives).toContain('Use discriminated union');
      expect(result.alternatives).toContain('Use unknown with type guard');
    });
  });

  describe('narrowTo', () => {
    test('narrows to type when guard passes', () => {
      const sa = SemanticAny.from('hello');
      const result = sa.narrowTo((x): x is string => typeof x === 'string');

      expect(result).toBe('hello');
    });

    test('returns null when guard fails', () => {
      const sa = SemanticAny.from('hello');
      const result = sa.narrowTo((x): x is number => typeof x === 'number');

      expect(result).toBeNull();
    });

    test('works with complex type guards', () => {
      interface User {
        name: string;
        age: number;
      }
      const isUser = (x: unknown): x is User =>
        typeof x === 'object' && x !== null && 'name' in x && 'age' in x;

      const sa = SemanticAny.from({ name: 'John', age: 30 });
      const result = sa.narrowTo(isUser);

      expect(result).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('valueOf', () => {
    test('returns the wrapped value', () => {
      const value = { name: 'test', data: [1, 2, 3] };
      const sa = SemanticAny.from(value);
      expect(sa.valueOf()).toEqual(value);
    });

    test('returns primitives correctly', () => {
      expect(SemanticAny.from(42).valueOf()).toBe(42);
      expect(SemanticAny.from('test').valueOf()).toBe('test');
      expect(SemanticAny.from(null).valueOf()).toBeNull();
    });
  });

  describe('getContext', () => {
    test('returns context when provided', () => {
      const sa = SemanticAny.from({}, { source: 'API', reason: 'dynamic' });
      expect(sa.getContext()).toEqual({ source: 'API', reason: 'dynamic' });
    });

    test('returns undefined when no context', () => {
      const sa = SemanticAny.from({});
      expect(sa.getContext()).toBeUndefined();
    });
  });

  describe('toString', () => {
    test('returns string representation with source', () => {
      const sa = SemanticAny.from({ test: true }, { source: 'API' });
      expect(sa.toString()).toBe('any<{"test":true}> (from: API)');
    });

    test('returns string representation without source', () => {
      const sa = SemanticAny.from(123);
      expect(sa.toString()).toBe('any<123>');
    });
  });

  describe('toJSON', () => {
    test('returns JSON with value and context', () => {
      const sa = SemanticAny.from({ name: 'test' }, { source: 'API' });
      expect(sa.toJSON()).toEqual({
        value: { name: 'test' },
        context: { source: 'API' },
      });
    });

    test('returns JSON with only value when no context', () => {
      const sa = SemanticAny.from('test');
      expect(sa.toJSON()).toEqual({ value: 'test' });
    });
  });
});

describe('SemanticAny prompts', () => {
  test('createClassifyIntentPrompt includes value and context', async () => {
    const { createClassifyIntentPrompt } = await import('../prompts.ts');
    const prompt = createClassifyIntentPrompt(
      { name: 'test' },
      { source: 'API', reason: 'dynamic data' }
    );

    expect(prompt).toContain('"name": "test"');
    expect(prompt).toContain('Source: API');
    expect(prompt).toContain('Stated reason: dynamic data');
  });

  test('createSuggestTypePrompt includes value info', async () => {
    const { createSuggestTypePrompt } = await import('../prompts.ts');
    const prompt = createSuggestTypePrompt(['a', 'b', 'c']);

    expect(prompt).toContain('"a"');
    expect(prompt).toContain('"b"');
    expect(prompt).toContain('isArray: true');
  });

  test('createAssessRiskPrompt includes context', async () => {
    const { createAssessRiskPrompt } = await import('../prompts.ts');
    const prompt = createAssessRiskPrompt('user input', { source: 'form' });

    expect(prompt).toContain('Source: form');
  });

  test('createGenerateMigrationPrompt respects strict option', async () => {
    const { createGenerateMigrationPrompt } = await import('../prompts.ts');
    const prompt = createGenerateMigrationPrompt({ id: 1 }, { strict: true });

    expect(prompt).toContain('Strict mode: true');
  });

  test('createIsSafeForPrompt includes context', async () => {
    const { createIsSafeForPrompt } = await import('../prompts.ts');
    const prompt = createIsSafeForPrompt('test', 'DOM manipulation');

    expect(prompt).toContain('Context: "DOM manipulation"');
  });
});
