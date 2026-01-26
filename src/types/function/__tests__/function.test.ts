/**
 * Unit tests for SemanticFunction
 */

import { describe, test, expect } from 'bun:test';
import { SemanticFunction } from '../function.ts';
import {
  createMockLLMClient,
  mockEquivalentFunctions,
  mockNotEquivalentFunctions,
  mockExplainAdd,
  mockValidateArgsValid,
  mockValidateArgsInvalid,
  mockInferPurposeTransform,
  mockGenerateDocsJsdoc,
  mockSuggestImprovements,
  mockDetectIssues,
  mockGenerateTests,
  mockIsSafeToCallSafe,
  mockIsSafeToCallUnsafe,
} from './mocks.ts';

describe('SemanticFunction', () => {
  describe('from', () => {
    test('creates SemanticFunction with function', () => {
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn);
      expect(sf.valueOf()).toBe(fn);
    });

    test('creates SemanticFunction with description', () => {
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn, 'Adds two numbers');
      expect(sf.getDescription()).toBe('Adds two numbers');
    });

    test('captures function name', () => {
      function add(a: number, b: number) {
        return a + b;
      }
      const sf = SemanticFunction.from(add);
      expect(sf.getName()).toBe('add');
    });
  });

  describe('semanticallyEquals', () => {
    test('identifies equivalent functions', async () => {
      const client = createMockLLMClient(mockEquivalentFunctions);
      const fn1 = (a: number, b: number) => a + b;
      const fn2 = (x: number, y: number) => x + y;
      const sf = SemanticFunction.from(fn1, 'Adds two numbers', client);
      const result = await sf.semanticallyEquals(fn2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    test('identifies non-equivalent functions', async () => {
      const client = createMockLLMClient(mockNotEquivalentFunctions);
      const fn1 = (a: number, b: number) => a + b;
      const fn2 = (a: number, b: number) => a * b;
      const sf = SemanticFunction.from(fn1, undefined, client);
      const result = await sf.semanticallyEquals(fn2);

      expect(result.equivalent).toBe(false);
    });
  });

  describe('explain', () => {
    test('explains function behavior', async () => {
      const client = createMockLLMClient(mockExplainAdd);
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.explain();

      expect(result).toContain('two numbers');
      expect(result).toContain('sum');
    });
  });

  describe('validateArgs', () => {
    test('validates correct arguments', async () => {
      const client = createMockLLMClient(mockValidateArgsValid);
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.validateArgs([1, 2]);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    test('identifies invalid arguments', async () => {
      const client = createMockLLMClient(mockValidateArgsInvalid);
      const fn = (_email: string, _subject: string, _body: string) => {};
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.validateArgs(['not-an-email', '', 'body'], [
        'first argument must be a valid email',
        'subject should not be empty',
      ]);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('inferPurpose', () => {
    test('infers function purpose', async () => {
      const client = createMockLLMClient(mockInferPurposeTransform);
      const fn = <T>(arr: T[]) => arr.map((x) => x);
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.inferPurpose();

      expect(result.purpose).toBe('data-transformation');
      expect(result.category).toBe('array-manipulation');
    });
  });

  describe('generateDocs', () => {
    test('generates JSDoc documentation', async () => {
      const client = createMockLLMClient(mockGenerateDocsJsdoc);
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.generateDocs('jsdoc');

      expect(result).toContain('@param');
      expect(result).toContain('@returns');
    });
  });

  describe('suggestImprovements', () => {
    test('suggests improvements', async () => {
      const client = createMockLLMClient(mockSuggestImprovements);
      const fn = (data: unknown) => data;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.suggestImprovements();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('suggestion');
      expect(result[0]).toHaveProperty('reason');
    });
  });

  describe('detectIssues', () => {
    test('detects potential issues', async () => {
      const client = createMockLLMClient(mockDetectIssues);
      const fn = (data: unknown) => data;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.detectIssues();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('issue');
      expect(result[0]).toHaveProperty('severity');
    });
  });

  describe('generateTests', () => {
    test('generates test cases', async () => {
      const client = createMockLLMClient(mockGenerateTests);
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.generateTests();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('input');
      expect(result[0]).toHaveProperty('expectedOutput');
      expect(result[0]).toHaveProperty('description');
    });
  });

  describe('isSafeToCall', () => {
    test('confirms safe arguments', async () => {
      const client = createMockLLMClient(mockIsSafeToCallSafe);
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.isSafeToCall([1, 2]);

      expect(result.safe).toBe(true);
    });

    test('identifies unsafe arguments', async () => {
      const client = createMockLLMClient(mockIsSafeToCallUnsafe);
      const fn = (query: string) => query;
      const sf = SemanticFunction.from(fn, undefined, client);
      const result = await sf.isSafeToCall(['DROP TABLE users;']);

      expect(result.safe).toBe(false);
      expect(result.reason).toContain('injection');
    });
  });

  describe('call', () => {
    test('calls the underlying function', () => {
      const fn = (a: number, b: number) => a + b;
      const sf = SemanticFunction.from(fn);
      const result = sf.call(1, 2);

      expect(result).toBe(3);
    });

    test('preserves function behavior', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
      const sf = SemanticFunction.from(fn);

      expect(sf.call([1, 2, 3, 4])).toBe(10);
    });
  });

  describe('valueOf', () => {
    test('returns the original function', () => {
      const fn = () => 42;
      const sf = SemanticFunction.from(fn);
      expect(sf.valueOf()).toBe(fn);
    });
  });

  describe('toString', () => {
    test('includes function name and description', () => {
      function myFunction() {
        return 1;
      }
      const sf = SemanticFunction.from(myFunction, 'Does something');
      expect(sf.toString()).toBe('SemanticFunction(myFunction): Does something');
    });

    test('works without description', () => {
      function myFunction() {
        return 1;
      }
      const sf = SemanticFunction.from(myFunction);
      expect(sf.toString()).toBe('SemanticFunction(myFunction)');
    });
  });
});

describe('SemanticFunction prompts', () => {
  test('createExplainPrompt includes function description', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('function add(a, b) { return a + b; }');

    expect(prompt).toContain('add');
    expect(prompt).toContain('return a + b');
  });

  test('createValidateArgsPrompt includes rules', async () => {
    const { createValidateArgsPrompt } = await import('../prompts.ts');
    const prompt = createValidateArgsPrompt('sendEmail', ['test@example.com', 'Hi'], [
      'must be valid email',
    ]);

    expect(prompt).toContain('test@example.com');
    expect(prompt).toContain('must be valid email');
  });

  test('createGenerateTestsPrompt includes function', async () => {
    const { createGenerateTestsPrompt } = await import('../prompts.ts');
    const prompt = createGenerateTestsPrompt('function add(a, b)');

    expect(prompt).toContain('add');
    expect(prompt).toContain('test cases');
  });
});
