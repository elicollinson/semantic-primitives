/**
 * Unit tests for SemanticCallable
 */

import { describe, test, expect } from 'bun:test';
import { SemanticCallable } from '../callable.ts';
import {
  createMockLLMClient,
  mockEquivalentCallables,
  mockNotEquivalentCallables,
  mockExplainAdd,
  mockInferSignatureAdd,
  mockInferSignatureMap,
  mockGenerateTypeDefinitionAdd,
  mockValidateArgsValid,
  mockValidateArgsInvalid,
  mockGenerateTestsAdd,
  mockSuggestWrapperAdd,
  mockDetectIssuesMultiple,
  mockDetectIssuesNone,
  mockIsSafeToCallSafe,
  mockIsSafeToCallUnsafe,
} from './mocks.ts';

describe('SemanticCallable', () => {
  describe('from', () => {
    test('creates SemanticCallable with callable', () => {
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn);
      expect(sc.valueOf()).toBe(fn);
    });

    test('creates SemanticCallable with description', () => {
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, 'Adds two numbers');
      expect(sc.getDescription()).toBe('Adds two numbers');
    });

    test('captures callable name', () => {
      function add(a: number, b: number) {
        return a + b;
      }
      const sc = SemanticCallable.from(add);
      expect(sc.getName()).toBe('add');
    });

    test('handles anonymous callables', () => {
      const sc = SemanticCallable.from((x: number) => x * 2);
      expect(sc.getName()).toBe('anonymous');
    });
  });

  describe('semanticallyEquals', () => {
    test('identifies equivalent callables', async () => {
      const client = createMockLLMClient(mockEquivalentCallables);
      const fn1 = (a: number, b: number) => a + b;
      const fn2 = (x: number, y: number) => x + y;
      const sc = SemanticCallable.from(fn1, 'Adds two numbers', client);
      const result = await sc.semanticallyEquals(fn2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    test('identifies non-equivalent callables', async () => {
      const client = createMockLLMClient(mockNotEquivalentCallables);
      const fn1 = (a: number, b: number) => a + b;
      const fn2 = (a: number, b: number) => a * b;
      const sc = SemanticCallable.from(fn1, undefined, client);
      const result = await sc.semanticallyEquals(fn2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.9);
    });

    test('accepts test inputs for comparison', async () => {
      const client = createMockLLMClient(mockEquivalentCallables);
      const fn1 = (a: number, b: number) => a + b;
      const fn2 = (x: number, y: number) => x + y;
      const sc = SemanticCallable.from(fn1, undefined, client);
      const result = await sc.semanticallyEquals(fn2, [[1, 2], [3, 4], [0, 0]]);

      expect(result.equivalent).toBe(true);
    });
  });

  describe('explain', () => {
    test('explains callable behavior', async () => {
      const client = createMockLLMClient(mockExplainAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.explain();

      expect(result).toContain('two numbers');
      expect(result).toContain('sum');
    });
  });

  describe('inferSignature', () => {
    test('infers signature from sample calls', async () => {
      const client = createMockLLMClient(mockInferSignatureAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.inferSignature([
        { args: [1, 2], result: 3 },
        { args: [5, 10], result: 15 },
      ]);

      expect(result.parameters).toHaveLength(2);
      expect(result.parameters[0]?.name).toBe('a');
      expect(result.parameters[0]?.type).toBe('number');
      expect(result.returnType).toBe('number');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('infers generic signature', async () => {
      const client = createMockLLMClient(mockInferSignatureMap);
      const fn = <T, U>(items: T[], transform: (item: T) => U) => items.map(transform);
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.inferSignature([
        { args: [[1, 2, 3], (x: number) => x * 2], result: [2, 4, 6] },
      ]);

      expect(result.generics).toContain('T');
      expect(result.generics).toContain('U');
      expect(result.returnType).toBe('U[]');
    });
  });

  describe('generateTypeDefinition', () => {
    test('generates TypeScript type definition', async () => {
      const client = createMockLLMClient(mockGenerateTypeDefinitionAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.generateTypeDefinition();

      expect(result.typeDefinition).toContain('number');
      expect(result.typeDefinition).toContain('@param');
      expect(result.interfaceName).toBe('AddFunction');
    });

    test('accepts preferred name', async () => {
      const client = createMockLLMClient(mockGenerateTypeDefinitionAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.generateTypeDefinition('AddFunction');

      expect(result.interfaceName).toBe('AddFunction');
    });
  });

  describe('validateArgs', () => {
    test('validates correct arguments', async () => {
      const client = createMockLLMClient(mockValidateArgsValid);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.validateArgs([1, 2]);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    test('identifies invalid arguments', async () => {
      const client = createMockLLMClient(mockValidateArgsInvalid);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.validateArgs(['not-a-number', NaN]);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('validates against custom rules', async () => {
      const client = createMockLLMClient(mockValidateArgsInvalid);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.validateArgs([1, 2], [
        'both arguments must be positive',
        'sum must not exceed 100',
      ]);

      expect(result.valid).toBe(false);
    });
  });

  describe('generateTests', () => {
    test('generates test cases', async () => {
      const client = createMockLLMClient(mockGenerateTestsAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.generateTests();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('input');
      expect(result[0]).toHaveProperty('expectedOutput');
      expect(result[0]).toHaveProperty('description');
    });

    test('includes edge cases', async () => {
      const client = createMockLLMClient(mockGenerateTestsAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.generateTests();

      const zeroCase = result.find(t => t.description.includes('zero'));
      expect(zeroCase).toBeDefined();
    });
  });

  describe('suggestWrapper', () => {
    test('suggests type-safe wrapper', async () => {
      const client = createMockLLMClient(mockSuggestWrapperAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.suggestWrapper();

      expect(result.wrapper).toContain('function');
      expect(result.benefits.length).toBeGreaterThan(0);
      expect(result.validations.length).toBeGreaterThan(0);
    });

    test('includes type checking in wrapper', async () => {
      const client = createMockLLMClient(mockSuggestWrapperAdd);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.suggestWrapper();

      expect(result.wrapper).toContain('typeof');
      expect(result.benefits.some(b => b.toLowerCase().includes('type'))).toBe(true);
    });
  });

  describe('detectIssues', () => {
    test('detects potential issues', async () => {
      const client = createMockLLMClient(mockDetectIssuesMultiple);
      const fn = (data: unknown) => data;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.detectIssues();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('issue');
      expect(result[0]).toHaveProperty('severity');
    });

    test('returns empty array when no issues', async () => {
      const client = createMockLLMClient(mockDetectIssuesNone);
      const fn = (a: number, b: number): number => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.detectIssues();

      expect(result).toEqual([]);
    });

    test('categorizes issues by severity', async () => {
      const client = createMockLLMClient(mockDetectIssuesMultiple);
      const fn = (data: unknown) => data;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.detectIssues();

      const severities = result.map(i => i.severity);
      expect(severities).toContain('warning');
      expect(severities).toContain('info');
      expect(severities).toContain('error');
    });
  });

  describe('isSafeToCall', () => {
    test('confirms safe arguments', async () => {
      const client = createMockLLMClient(mockIsSafeToCallSafe);
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.isSafeToCall([1, 2]);

      expect(result.safe).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('identifies unsafe arguments', async () => {
      const client = createMockLLMClient(mockIsSafeToCallUnsafe);
      const fn = (query: string) => query;
      const sc = SemanticCallable.from(fn, undefined, client);
      const result = await sc.isSafeToCall(['DROP TABLE users;']);

      expect(result.safe).toBe(false);
      expect(result.reason).toContain('injection');
      expect(result.severity).toBe('high');
    });
  });

  describe('call', () => {
    test('calls the underlying callable', () => {
      const fn = (a: number, b: number) => a + b;
      const sc = SemanticCallable.from(fn);
      const result = sc.call(1, 2);

      expect(result).toBe(3);
    });

    test('preserves callable behavior', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
      const sc = SemanticCallable.from(fn);

      expect(sc.call([1, 2, 3, 4])).toBe(10);
    });

    test('passes through errors', () => {
      const fn = () => {
        throw new Error('Test error');
      };
      const sc = SemanticCallable.from(fn);

      expect(() => sc.call()).toThrow('Test error');
    });

    test('handles async callables', async () => {
      const fn = (x: number) => Promise.resolve(x * 2);
      const sc = SemanticCallable.from(fn);
      const result = await sc.call(5);

      expect(result).toBe(10);
    });
  });

  describe('valueOf', () => {
    test('returns the original callable', () => {
      const fn = () => 42;
      const sc = SemanticCallable.from(fn);
      expect(sc.valueOf()).toBe(fn);
    });
  });

  describe('toString', () => {
    test('includes callable name and description', () => {
      function myCallable() {
        return 1;
      }
      const sc = SemanticCallable.from(myCallable, 'Does something');
      expect(sc.toString()).toBe('SemanticCallable(myCallable): Does something');
    });

    test('works without description', () => {
      function myCallable() {
        return 1;
      }
      const sc = SemanticCallable.from(myCallable);
      expect(sc.toString()).toBe('SemanticCallable(myCallable)');
    });

    test('handles anonymous callables', () => {
      const sc = SemanticCallable.from(() => 1);
      expect(sc.toString()).toBe('SemanticCallable(anonymous)');
    });
  });
});

describe('SemanticCallable prompts', () => {
  test('createExplainPrompt includes callable description', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('function add(a, b) { return a + b; }');

    expect(prompt).toContain('add');
    expect(prompt).toContain('return a + b');
  });

  test('createValidateArgsPrompt includes rules', async () => {
    const { createValidateArgsPrompt } = await import('../prompts.ts');
    const prompt = createValidateArgsPrompt('add', [1, 2], ['must be positive']);

    expect(prompt).toContain('1');
    expect(prompt).toContain('2');
    expect(prompt).toContain('must be positive');
  });

  test('createInferSignaturePrompt includes sample calls', async () => {
    const { createInferSignaturePrompt } = await import('../prompts.ts');
    const prompt = createInferSignaturePrompt('add', [
      { args: [1, 2], result: 3 },
      { args: [5, 10], result: 15 },
    ]);

    expect(prompt).toContain('args=[1,2]');
    expect(prompt).toContain('result=3');
  });

  test('createGenerateTestsPrompt includes callable', async () => {
    const { createGenerateTestsPrompt } = await import('../prompts.ts');
    const prompt = createGenerateTestsPrompt('function add(a, b)');

    expect(prompt).toContain('add');
    expect(prompt).toContain('test cases');
  });

  test('createSuggestWrapperPrompt mentions validation', async () => {
    const { createSuggestWrapperPrompt } = await import('../prompts.ts');
    const prompt = createSuggestWrapperPrompt('function divide(a, b)');

    expect(prompt).toContain('validation');
    expect(prompt).toContain('error');
  });

  test('createDetectIssuesPrompt mentions security', async () => {
    const { createDetectIssuesPrompt } = await import('../prompts.ts');
    const prompt = createDetectIssuesPrompt('function query(sql)');

    expect(prompt.toLowerCase()).toContain('security');
    expect(prompt.toLowerCase()).toContain('error handling');
  });

  test('createIsSafeToCallPrompt mentions injection', async () => {
    const { createIsSafeToCallPrompt } = await import('../prompts.ts');
    const prompt = createIsSafeToCallPrompt('function query(sql)', ['SELECT * FROM users']);

    expect(prompt).toContain('injection');
    expect(prompt).toContain('SELECT');
  });
});
