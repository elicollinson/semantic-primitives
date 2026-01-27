/**
 * Unit tests for SemanticCallable
 */

import { describe, test, expect } from 'bun:test';
import { SemanticCallable } from '../callable.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockExplainAddResponse,
  mockExplainDivideResponse,
  mockInferSignatureNumericResponse,
  mockInferSignatureMixedResponse,
  mockGenerateTypeDefinitionAddResponse,
  mockValidateArgsValidResponse,
  mockValidateArgsDivisionByZeroResponse,
  mockValidateArgsCustomRulesResponse,
  mockGenerateTestsAddResponse,
  mockGenerateTestsDivideResponse,
  mockSuggestWrapperDivideResponse,
  mockDetectIssuesCleanResponse,
  mockDetectIssuesDivideResponse,
  mockIsSafeToCallSafeResponse,
  mockIsSafeToCallDivisionByZeroResponse,
  mockIsSafeToCallTypeMismatchResponse,
} from './mocks.ts';

// Test functions
const add = (a: number, b: number): number => a + b;
const multiply = (a: number, b: number): number => a * b;
const divide = (a: number, b: number): number => a / b;
const concat = (a: string, b: string): string => a + b;
function namedAdd(a: number, b: number): number {
  return a + b;
}

describe('SemanticCallable', () => {
  describe('from', () => {
    test('creates SemanticCallable from function', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'adds two numbers', client);

      expect(callable).toBeInstanceOf(SemanticCallable);
    });

    test('creates SemanticCallable with description', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'adds two numbers', client);

      expect(callable.getDescription()).toBe('adds two numbers');
    });

    test('returns same SemanticCallable if already wrapped', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const original = SemanticCallable.from(add, 'test', client);
      const wrapped = SemanticCallable.from(original as unknown as typeof add);

      expect(wrapped).toBe(original);
    });

    test('handles anonymous functions', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from((x: number) => x * 2, undefined, client);

      expect(callable.getName()).toBe('anonymous');
    });
  });

  describe('call', () => {
    test('calls the underlying function with arguments', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'adds two numbers', client);

      expect(callable.call(2, 3)).toBe(5);
    });

    test('preserves function behavior for various inputs', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      expect(callable.call(10, 2)).toBe(5);
      expect(callable.call(7, 2)).toBe(3.5);
      expect(callable.call(0, 5)).toBe(0);
    });

    test('works with string functions', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(concat, 'concatenates strings', client);

      expect(callable.call('hello', 'world')).toBe('helloworld');
    });
  });

  describe('valueOf', () => {
    test('returns the original function', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'test', client);

      expect(callable.valueOf()).toBe(add);
    });

    test('returned function works correctly', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'test', client);
      const fn = callable.valueOf();

      expect(fn(5, 3)).toBe(8);
    });
  });

  describe('getName', () => {
    test('returns function name for named functions', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(namedAdd, 'test', client);

      expect(callable.getName()).toBe('namedAdd');
    });

    test('returns anonymous for anonymous functions', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from((x: number) => x, 'test', client);

      expect(callable.getName()).toBe('anonymous');
    });
  });

  describe('getArity', () => {
    test('returns correct arity for two-parameter function', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'test', client);

      expect(callable.getArity()).toBe(2);
    });

    test('returns correct arity for single-parameter function', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from((x: number) => x * 2, 'test', client);

      expect(callable.getArity()).toBe(1);
    });

    test('returns correct arity for no-parameter function', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(() => 42, 'test', client);

      expect(callable.getArity()).toBe(0);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for same-behavior functions', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable1 = SemanticCallable.from(add, 'adds numbers', client);
      const add2 = (x: number, y: number): number => x + y;

      const result = await callable1.semanticallyEquals(add2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    test('returns not equivalent for different functions', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const callable1 = SemanticCallable.from(add, 'adds numbers', client);

      const result = await callable1.semanticallyEquals(multiply);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.88);
    });

    test('compares with another SemanticCallable', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable1 = SemanticCallable.from(add, 'adds', client);
      const callable2 = SemanticCallable.from(
        (a: number, b: number) => a + b,
        'sums',
        client
      );

      const result = await callable1.semanticallyEquals(callable2);

      expect(result.equivalent).toBe(true);
    });

    test('accepts test cases for comparison', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable1 = SemanticCallable.from(add, 'adds', client);

      const result = await callable1.semanticallyEquals(
        (a: number, b: number) => a + b,
        [[1, 2], [3, 4], [0, 0]]
      );

      expect(result.equivalent).toBe(true);
    });
  });

  describe('explain', () => {
    test('explains add function', async () => {
      const client = createMockLLMClient(mockExplainAddResponse);
      const callable = SemanticCallable.from(add, 'adds two numbers', client);

      const explanation = await callable.explain();

      expect(explanation).toContain('two numbers');
      expect(explanation).toContain('sum');
    });

    test('explains divide function', async () => {
      const client = createMockLLMClient(mockExplainDivideResponse);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      const explanation = await callable.explain();

      expect(explanation).toContain('Divides');
      expect(explanation).toContain('division by zero');
    });
  });

  describe('inferSignature', () => {
    test('infers numeric signature from number inputs', async () => {
      const client = createMockLLMClient(mockInferSignatureNumericResponse);
      const callable = SemanticCallable.from(add, 'adds', client);

      const signature = await callable.inferSignature([[1, 2], [3, 4], [5, 6]]);

      expect(signature.params).toEqual(['number', 'number']);
      expect(signature.return).toBe('number');
      expect(signature.confidence).toBeGreaterThan(0.9);
    });

    test('infers mixed types from varied inputs', async () => {
      const client = createMockLLMClient(mockInferSignatureMixedResponse);
      const genericFn = (a: number | string, b: number | string) => `${a}${b}`;
      const callable = SemanticCallable.from(genericFn, 'generic', client);

      const signature = await callable.inferSignature([
        [1, 2],
        ['a', 'b'],
      ]);

      expect(signature.params[0]).toContain('|');
      expect(signature.confidence).toBeLessThan(0.9);
    });
  });

  describe('generateTypeDefinition', () => {
    test('generates type definition for add function', async () => {
      const client = createMockLLMClient(mockGenerateTypeDefinitionAddResponse);
      const callable = SemanticCallable.from(add, 'adds two numbers', client);

      const typeDef = await callable.generateTypeDefinition();

      expect(typeDef).toContain('type');
      expect(typeDef).toContain('number');
      expect(typeDef).toContain('=>');
    });
  });

  describe('validateArgs', () => {
    test('validates correct arguments', async () => {
      const client = createMockLLMClient(mockValidateArgsValidResponse);
      const callable = SemanticCallable.from(add, 'adds numbers', client);

      const result = await callable.validateArgs([5, 3]);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('detects division by zero', async () => {
      const client = createMockLLMClient(mockValidateArgsDivisionByZeroResponse);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      const result = await callable.validateArgs([10, 0]);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('zero');
    });

    test('validates with custom rules', async () => {
      const client = createMockLLMClient(mockValidateArgsCustomRulesResponse);
      const callable = SemanticCallable.from(add, 'adds positive numbers', client);

      const result = await callable.validateArgs([-5, 3], ['Value must be positive']);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('positive');
    });
  });

  describe('generateTests', () => {
    test('generates test cases for add function', async () => {
      const client = createMockLLMClient(mockGenerateTestsAddResponse);
      const callable = SemanticCallable.from(add, 'adds numbers', client);

      const tests = await callable.generateTests();

      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0]).toHaveProperty('inputs');
      expect(tests[0]).toHaveProperty('expectedOutput');
      expect(tests[0]).toHaveProperty('description');
    });

    test('generates diverse test cases for divide function', async () => {
      const client = createMockLLMClient(mockGenerateTestsDivideResponse);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      const tests = await callable.generateTests();

      expect(tests.length).toBeGreaterThanOrEqual(3);
      // Check that tests cover different scenarios
      const descriptions = tests.map(t => t.description.toLowerCase());
      expect(descriptions.some(d => d.includes('normal') || d.includes('division'))).toBe(true);
    });
  });

  describe('suggestWrapper', () => {
    test('suggests safe wrapper for divide function', async () => {
      const client = createSequentialMockLLMClient([
        mockDetectIssuesDivideResponse,
        mockSuggestWrapperDivideResponse,
      ]);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      const wrapper = await callable.suggestWrapper();

      expect(wrapper.code).toContain('function');
      expect(wrapper.code).toContain('null');
      expect(wrapper.reason).toBeTruthy();
    });
  });

  describe('detectIssues', () => {
    test('returns no issues for clean function', async () => {
      const client = createMockLLMClient(mockDetectIssuesCleanResponse);
      const callable = SemanticCallable.from(add, 'adds numbers', client);

      const issues = await callable.detectIssues();

      expect(issues).toHaveLength(0);
    });

    test('detects issues in divide function', async () => {
      const client = createMockLLMClient(mockDetectIssuesDivideResponse);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      const issues = await callable.detectIssues();

      expect(issues.length).toBeGreaterThan(0);
      const firstIssue = issues[0];
      if (firstIssue) {
        expect(firstIssue).toHaveProperty('issue');
        expect(firstIssue).toHaveProperty('severity');
        expect(['info', 'warning', 'error']).toContain(firstIssue.severity);
      }
    });
  });

  describe('isSafeToCall', () => {
    test('returns safe for valid arguments', async () => {
      const client = createMockLLMClient(mockIsSafeToCallSafeResponse);
      const callable = SemanticCallable.from(add, 'adds numbers', client);

      const result = await callable.isSafeToCall([5, 3]);

      expect(result.safe).toBe(true);
    });

    test('returns unsafe for division by zero', async () => {
      const client = createMockLLMClient(mockIsSafeToCallDivisionByZeroResponse);
      const callable = SemanticCallable.from(divide, 'divides numbers', client);

      const result = await callable.isSafeToCall([10, 0]);

      expect(result.safe).toBe(false);
      expect(result.reason).toContain('zero');
    });

    test('returns unsafe for type mismatch', async () => {
      const client = createMockLLMClient(mockIsSafeToCallTypeMismatchResponse);
      const callable = SemanticCallable.from(add, 'adds numbers', client);

      // @ts-expect-error - intentionally passing wrong type for testing
      const result = await callable.isSafeToCall(['not', 'numbers']);

      expect(result.safe).toBe(false);
      expect(result.reason).toBeTruthy();
    });
  });

  describe('Symbol.toStringTag', () => {
    test('returns SemanticCallable', () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const callable = SemanticCallable.from(add, 'test', client);

      expect(Object.prototype.toString.call(callable)).toBe('[object SemanticCallable]');
    });
  });
});

describe('SemanticCallable prompts', () => {
  test('createSemanticallyEqualsPrompt includes both functions', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      'function add(a, b) { return a + b; }',
      'function sum(x, y) { return x + y; }',
      'addition',
      'summation'
    );

    expect(prompt).toContain('Function 1:');
    expect(prompt).toContain('Function 2:');
    expect(prompt).toContain('addition');
    expect(prompt).toContain('summation');
  });

  test('createSemanticallyEqualsPrompt includes test cases', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      'fn1',
      'fn2',
      undefined,
      undefined,
      [[1, 2], [3, 4]]
    );

    expect(prompt).toContain('Test Cases');
    expect(prompt).toContain('[1,2]');
    expect(prompt).toContain('[3,4]');
  });

  test('createExplainPrompt includes function source', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt(
      'function divide(a, b) { return a / b; }',
      'divides two numbers'
    );

    expect(prompt).toContain('function divide');
    expect(prompt).toContain('divides two numbers');
  });

  test('createInferSignaturePrompt includes sample calls', async () => {
    const { createInferSignaturePrompt } = await import('../prompts.ts');
    const prompt = createInferSignaturePrompt(
      'const add = (a, b) => a + b',
      [[1, 2], [3, 4]]
    );

    expect(prompt).toContain('Sample Calls');
    expect(prompt).toContain('[1,2]');
  });

  test('createValidateArgsPrompt includes rules when provided', async () => {
    const { createValidateArgsPrompt } = await import('../prompts.ts');
    const prompt = createValidateArgsPrompt(
      'fn',
      [10, 0],
      ['divisor must not be zero', 'values must be positive']
    );

    expect(prompt).toContain('Validation Rules');
    expect(prompt).toContain('divisor must not be zero');
    expect(prompt).toContain('values must be positive');
  });

  test('createGenerateTestsPrompt includes function and description', async () => {
    const { createGenerateTestsPrompt } = await import('../prompts.ts');
    const prompt = createGenerateTestsPrompt(
      'function multiply(a, b) { return a * b; }',
      'multiplies two numbers'
    );

    expect(prompt).toContain('function multiply');
    expect(prompt).toContain('multiplies two numbers');
    expect(prompt).toContain('Edge cases');
  });

  test('createDetectIssuesPrompt asks for severity levels', async () => {
    const { createDetectIssuesPrompt } = await import('../prompts.ts');
    const prompt = createDetectIssuesPrompt(
      'function unsafeFn(x) { return x.prop; }'
    );

    expect(prompt).toContain('info');
    expect(prompt).toContain('warning');
    expect(prompt).toContain('error');
  });

  test('createIsSafeToCallPrompt includes arguments', async () => {
    const { createIsSafeToCallPrompt } = await import('../prompts.ts');
    const prompt = createIsSafeToCallPrompt(
      'function divide(a, b) { return a / b; }',
      [10, 0],
      'division function'
    );

    expect(prompt).toContain('Arguments');
    expect(prompt).toContain('10');
    expect(prompt).toContain('0');
    expect(prompt).toContain('division function');
  });
});
