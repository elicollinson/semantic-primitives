/**
 * Unit tests for SemanticNever
 */

import { describe, test, expect } from 'bun:test';
import { SemanticNever } from '../never.ts';
import {
  createMockLLMClient,
  mockExhaustiveComplete,
  mockExhaustiveIncomplete,
  mockExhaustiveManyMissing,
  mockUnreachabilityControlFlow,
  mockUnreachabilityTypeNarrowing,
  mockUnreachabilityExhaustive,
  mockDeadCodeTrue,
  mockDeadCodeFalse,
  mockDeadCodeUnsafe,
  mockExhaustiveHandler,
  mockValidateExhaustiveValid,
  mockValidateExhaustiveInvalid,
  mockShouldReturnNeverTrue,
  mockShouldReturnNeverFalse,
  mockExplainGeneral,
  mockExplainInSwitch,
  mockIntersectionNever,
  mockIntersectionValid,
  mockAppropriatePatterns,
} from './mocks.ts';

describe('SemanticNever', () => {
  describe('isExhaustive', () => {
    test('returns exhaustive for complete handling', async () => {
      const client = createMockLLMClient(mockExhaustiveComplete);
      const result = await SemanticNever.isExhaustive(
        'Status',
        ['pending', 'active', 'completed'],
        client
      );

      expect(result.exhaustive).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('returns not exhaustive with missing case', async () => {
      const client = createMockLLMClient(mockExhaustiveIncomplete);
      const result = await SemanticNever.isExhaustive(
        'Status',
        ['pending', 'active'],
        client
      );

      expect(result.exhaustive).toBe(false);
      expect(result.missing).toContain('completed');
    });

    test('identifies multiple missing cases', async () => {
      const client = createMockLLMClient(mockExhaustiveManyMissing);
      const result = await SemanticNever.isExhaustive('OrderStatus', ['shipped'], client);

      expect(result.exhaustive).toBe(false);
      expect(result.missing).toHaveLength(3);
    });
  });

  describe('explainUnreachability', () => {
    test('explains control flow unreachability', async () => {
      const client = createMockLLMClient(mockUnreachabilityControlFlow);
      const result = await SemanticNever.explainUnreachability(
        'after throw statement',
        client
      );

      expect(result.type).toBe('control-flow');
      expect(result.reason).toContain('throw');
      expect(result.suggestion).toBeDefined();
    });

    test('explains type narrowing unreachability', async () => {
      const client = createMockLLMClient(mockUnreachabilityTypeNarrowing);
      const result = await SemanticNever.explainUnreachability(
        'after checking all type cases',
        client
      );

      expect(result.type).toBe('type-narrowing');
    });

    test('explains exhaustive check unreachability', async () => {
      const client = createMockLLMClient(mockUnreachabilityExhaustive);
      const result = await SemanticNever.explainUnreachability(
        'default case in switch',
        client
      );

      expect(result.type).toBe('exhaustive-check');
    });
  });

  describe('isDeadCode', () => {
    test('identifies dead code', async () => {
      const client = createMockLLMClient(mockDeadCodeTrue);
      const result = await SemanticNever.isDeadCode(
        'return statement after return',
        'function with multiple returns',
        client
      );

      expect(result.isDead).toBe(true);
      expect(result.safeToRemove).toBe(true);
    });

    test('identifies live code', async () => {
      const client = createMockLLMClient(mockDeadCodeFalse);
      const result = await SemanticNever.isDeadCode(
        'code after conditional',
        undefined,
        client
      );

      expect(result.isDead).toBe(false);
    });

    test('identifies dead code unsafe to remove', async () => {
      const client = createMockLLMClient(mockDeadCodeUnsafe);
      const result = await SemanticNever.isDeadCode('default case handler', undefined, client);

      expect(result.isDead).toBe(true);
      expect(result.safeToRemove).toBe(false);
    });
  });

  describe('suggestExhaustiveHandler', () => {
    test('suggests assertNever function', async () => {
      const client = createMockLLMClient(mockExhaustiveHandler);
      const result = await SemanticNever.suggestExhaustiveHandler('Status', client);

      expect(result.code).toContain('assertNever');
      expect(result.code).toContain('never');
      expect(result.usage).toContain('default:');
    });
  });

  describe('validateExhaustivenessCheck', () => {
    test('validates complete exhaustiveness check', async () => {
      const client = createMockLLMClient(mockValidateExhaustiveValid);
      const result = await SemanticNever.validateExhaustivenessCheck(
        'switch with all Status cases',
        client
      );

      expect(result.valid).toBe(true);
      expect(result.covers).toContain('pending');
      expect(result.covers).toContain('active');
      expect(result.covers).toContain('completed');
    });

    test('identifies incomplete exhaustiveness check', async () => {
      const client = createMockLLMClient(mockValidateExhaustiveInvalid);
      const result = await SemanticNever.validateExhaustivenessCheck(
        'switch missing completed case',
        client
      );

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('completed');
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('shouldReturnNever', () => {
    test('identifies function that should return never', async () => {
      const client = createMockLLMClient(mockShouldReturnNeverTrue);
      const result = await SemanticNever.shouldReturnNever(
        'throwError',
        'throws an error',
        client
      );

      expect(result.shouldReturn).toBe(true);
      expect(result.reason).toContain('throws');
    });

    test('identifies function that should not return never', async () => {
      const client = createMockLLMClient(mockShouldReturnNeverFalse);
      const result = await SemanticNever.shouldReturnNever(
        'maybeThrow',
        'throws if invalid, returns value if valid',
        client
      );

      expect(result.shouldReturn).toBe(false);
    });
  });

  describe('explain', () => {
    test('explains never type in general', async () => {
      const client = createMockLLMClient(mockExplainGeneral);
      const result = await SemanticNever.explain(undefined, client);

      expect(result).toContain('never');
    });

    test('explains never type in specific context', async () => {
      const client = createMockLLMClient(mockExplainInSwitch);
      const result = await SemanticNever.explain('in function return type', client);

      expect(result).toBeDefined();
    });
  });

  describe('analyzeIntersection', () => {
    test('identifies intersection resulting in never', async () => {
      const client = createMockLLMClient(mockIntersectionNever);
      const result = await SemanticNever.analyzeIntersection(['string', 'number'], client);

      expect(result.resultsInNever).toBe(true);
      expect(result.reason).toContain('cannot be both');
    });

    test('identifies valid intersection', async () => {
      const client = createMockLLMClient(mockIntersectionValid);
      const result = await SemanticNever.analyzeIntersection(
        ['{ a: string }', '{ b: number }'],
        client
      );

      expect(result.resultsInNever).toBe(false);
    });
  });

  describe('appropriatePatterns', () => {
    test('returns list of patterns', async () => {
      const client = createMockLLMClient(mockAppropriatePatterns);
      const result = await SemanticNever.appropriatePatterns(client);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('pattern');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('example');
    });
  });

  describe('assertNever', () => {
    test('throws error with value', () => {
      expect(() => {
        // Force a value through to test runtime behavior
        SemanticNever.assertNever('unexpected' as never);
      }).toThrow('Unexpected value: "unexpected"');
    });

    test('throws with object value', () => {
      expect(() => {
        SemanticNever.assertNever({ type: 'unknown' } as never);
      }).toThrow('Unexpected value: {"type":"unknown"}');
    });
  });
});

describe('SemanticNever prompts', () => {
  test('createIsExhaustivePrompt includes type and cases', async () => {
    const { createIsExhaustivePrompt } = await import('../prompts.ts');
    const prompt = createIsExhaustivePrompt('Status', ['pending', 'active']);

    expect(prompt).toContain('Type name: "Status"');
    expect(prompt).toContain('pending');
    expect(prompt).toContain('active');
  });

  test('createExplainUnreachabilityPrompt includes context', async () => {
    const { createExplainUnreachabilityPrompt } = await import('../prompts.ts');
    const prompt = createExplainUnreachabilityPrompt('after throw statement');

    expect(prompt).toContain('after throw statement');
  });

  test('createIsDeadCodePrompt includes code and context', async () => {
    const { createIsDeadCodePrompt } = await import('../prompts.ts');
    const prompt = createIsDeadCodePrompt('return x;', 'after another return');

    expect(prompt).toContain('Code: "return x;"');
    expect(prompt).toContain('Surrounding context: "after another return"');
  });

  test('createShouldReturnNeverPrompt includes function info', async () => {
    const { createShouldReturnNeverPrompt } = await import('../prompts.ts');
    const prompt = createShouldReturnNeverPrompt('fail', 'always throws');

    expect(prompt).toContain('Function behavior: "always throws"');
  });

  test('createAnalyzeIntersectionPrompt includes types', async () => {
    const { createAnalyzeIntersectionPrompt } = await import('../prompts.ts');
    const prompt = createAnalyzeIntersectionPrompt(['string', 'number']);

    expect(prompt).toContain('string');
    expect(prompt).toContain('number');
  });
});
