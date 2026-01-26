/**
 * Unit tests for SemanticNever
 */

import { describe, test, expect } from 'bun:test';
import { SemanticNever } from '../never.ts';
import {
  createMockLLMClient,
  mockExhaustiveAllCasesResponse,
  mockNotExhaustiveMissingCasesResponse,
  mockNotExhaustiveOneMissingResponse,
  mockExhaustiveDirectionResponse,
  mockUnreachabilityAfterThrowResponse,
  mockUnreachabilityTypeNarrowingResponse,
  mockUnreachabilityExhaustiveCheckResponse,
  mockUnreachabilityImpossibleStateResponse,
  mockDeadCodeAfterReturnResponse,
  mockNotDeadCodeResponse,
  mockDeadCodeUnsafeResponse,
  mockDeadCodeAfterLoopResponse,
  mockSuggestHandlerStatusResponse,
  mockSuggestHandlerActionResponse,
  mockValidExhaustivenessResponse,
  mockInvalidExhaustivenessMissingResponse,
  mockInvalidExhaustivenessNoDefaultResponse,
  mockShouldReturnNeverThrowsResponse,
  mockShouldNotReturnNeverResponse,
  mockShouldReturnNeverLoopResponse,
  mockShouldNotReturnNeverConditionalResponse,
  mockExplainGeneralResponse,
  mockExplainFunctionReturnResponse,
  mockExplainTypeNarrowingResponse,
  mockIntersectionNeverPrimitivesResponse,
  mockIntersectionNotNeverObjectsResponse,
  mockIntersectionNeverStringBooleanResponse,
  mockIntersectionNotNeverSameTypeResponse,
} from './mocks.ts';

describe('SemanticNever', () => {
  describe('constructor', () => {
    test('cannot be instantiated', () => {
      // SemanticNever has a private constructor, so we can't directly test
      // instantiation. Instead, we verify all methods are static.
      expect(typeof SemanticNever.isExhaustive).toBe('function');
      expect(typeof SemanticNever.explainUnreachability).toBe('function');
      expect(typeof SemanticNever.isDeadCode).toBe('function');
      expect(typeof SemanticNever.suggestExhaustiveHandler).toBe('function');
      expect(typeof SemanticNever.validateExhaustivenessCheck).toBe('function');
      expect(typeof SemanticNever.shouldReturnNever).toBe('function');
      expect(typeof SemanticNever.explain).toBe('function');
      expect(typeof SemanticNever.analyzeIntersection).toBe('function');
      expect(typeof SemanticNever.appropriatePatterns).toBe('function');
    });
  });

  describe('isExhaustive', () => {
    test('returns exhaustive when all cases are handled', async () => {
      const client = createMockLLMClient(mockExhaustiveAllCasesResponse);
      const result = await SemanticNever.isExhaustive(
        'Status',
        ['pending', 'active', 'completed'],
        client
      );

      expect(result.exhaustive).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('returns not exhaustive with missing cases', async () => {
      const client = createMockLLMClient(mockNotExhaustiveMissingCasesResponse);
      const result = await SemanticNever.isExhaustive(
        'Status',
        ['pending', 'active'],
        client
      );

      expect(result.exhaustive).toBe(false);
      expect(result.missing).toEqual(['completed', 'failed']);
    });

    test('returns not exhaustive with one missing case', async () => {
      const client = createMockLLMClient(mockNotExhaustiveOneMissingResponse);
      const result = await SemanticNever.isExhaustive(
        'OrderStatus',
        ['pending', 'processing', 'shipped', 'delivered'],
        client
      );

      expect(result.exhaustive).toBe(false);
      expect(result.missing).toEqual(['cancelled']);
    });

    test('handles direction type exhaustively', async () => {
      const client = createMockLLMClient(mockExhaustiveDirectionResponse);
      const result = await SemanticNever.isExhaustive(
        'Direction',
        ['up', 'down', 'left', 'right'],
        client
      );

      expect(result.exhaustive).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe('explainUnreachability', () => {
    test('explains unreachability after throw statement', async () => {
      const client = createMockLLMClient(mockUnreachabilityAfterThrowResponse);
      const result = await SemanticNever.explainUnreachability(
        'code after throw statement',
        client
      );

      expect(result.type).toBe('control-flow');
      expect(result.reason).toContain('throw');
      expect(result.suggestion).toBeDefined();
    });

    test('explains unreachability due to type narrowing', async () => {
      const client = createMockLLMClient(mockUnreachabilityTypeNarrowingResponse);
      const result = await SemanticNever.explainUnreachability(
        'after all type guards have been applied',
        client
      );

      expect(result.type).toBe('type-narrowing');
      expect(result.reason).toContain('narrowed');
      expect(result.suggestion).toContain('assertNever');
    });

    test('explains unreachability in exhaustive check', async () => {
      const client = createMockLLMClient(mockUnreachabilityExhaustiveCheckResponse);
      const result = await SemanticNever.explainUnreachability(
        'default case in switch with all cases handled',
        client
      );

      expect(result.type).toBe('exhaustive-check');
      expect(result.reason).toContain('exhaustive');
    });

    test('explains unreachability due to impossible state', async () => {
      const client = createMockLLMClient(mockUnreachabilityImpossibleStateResponse);
      const result = await SemanticNever.explainUnreachability(
        'branch handling user with negative ID',
        client
      );

      expect(result.type).toBe('impossible-state');
      expect(result.reason).toContain('cannot occur');
    });
  });

  describe('isDeadCode', () => {
    test('identifies dead code after return', async () => {
      const client = createMockLLMClient(mockDeadCodeAfterReturnResponse);
      const result = await SemanticNever.isDeadCode(
        'console.log("this will never run")',
        'after return statement',
        client
      );

      expect(result.isDead).toBe(true);
      expect(result.safeToRemove).toBe(true);
      expect(result.reason).toContain('return');
    });

    test('identifies non-dead code', async () => {
      const client = createMockLLMClient(mockNotDeadCodeResponse);
      const result = await SemanticNever.isDeadCode(
        'console.log("conditional")',
        'inside if block',
        client
      );

      expect(result.isDead).toBe(false);
      expect(result.safeToRemove).toBe(false);
    });

    test('identifies dead code that is unsafe to remove', async () => {
      const client = createMockLLMClient(mockDeadCodeUnsafeResponse);
      const result = await SemanticNever.isDeadCode(
        'cleanup()',
        'after process.exit()',
        client
      );

      expect(result.isDead).toBe(true);
      expect(result.safeToRemove).toBe(false);
    });

    test('identifies dead code after infinite loop', async () => {
      const client = createMockLLMClient(mockDeadCodeAfterLoopResponse);
      const result = await SemanticNever.isDeadCode(
        'return result',
        'after while(true) without break',
        client
      );

      expect(result.isDead).toBe(true);
      expect(result.safeToRemove).toBe(true);
    });

    test('works without context', async () => {
      const client = createMockLLMClient(mockDeadCodeAfterReturnResponse);
      const result = await SemanticNever.isDeadCode(
        'unreachable code',
        undefined,
        client
      );

      expect(result.isDead).toBe(true);
    });
  });

  describe('suggestExhaustiveHandler', () => {
    test('suggests handler for Status type', async () => {
      const client = createMockLLMClient(mockSuggestHandlerStatusResponse);
      const result = await SemanticNever.suggestExhaustiveHandler(
        'Status',
        client
      );

      expect(result.code).toContain('assertNever');
      expect(result.code).toContain('never');
      expect(result.usage).toContain('status');
    });

    test('suggests handler for Action type', async () => {
      const client = createMockLLMClient(mockSuggestHandlerActionResponse);
      const result = await SemanticNever.suggestExhaustiveHandler(
        'Action',
        client
      );

      expect(result.code).toContain('assertNever');
      expect(result.usage).toContain('action');
    });
  });

  describe('validateExhaustivenessCheck', () => {
    test('validates correct exhaustive switch', async () => {
      const client = createMockLLMClient(mockValidExhaustivenessResponse);
      const fnCode = `
        function handleStatus(status: Status) {
          switch (status) {
            case "pending": return "Waiting";
            case "active": return "Running";
            case "completed": return "Done";
            default: return assertNever(status);
          }
        }
      `;
      const result = await SemanticNever.validateExhaustivenessCheck(
        fnCode,
        client
      );

      expect(result.valid).toBe(true);
      expect(result.covers).toEqual(['pending', 'active', 'completed']);
      expect(result.missing).toBeUndefined();
    });

    test('identifies missing case', async () => {
      const client = createMockLLMClient(mockInvalidExhaustivenessMissingResponse);
      const fnCode = `
        function handleStatus(status: Status) {
          switch (status) {
            case "pending": return "Waiting";
            case "active": return "Running";
            default: return assertNever(status);
          }
        }
      `;
      const result = await SemanticNever.validateExhaustivenessCheck(
        fnCode,
        client
      );

      expect(result.valid).toBe(false);
      expect(result.covers).toEqual(['pending', 'active']);
      expect(result.missing).toEqual(['completed']);
      expect(result.suggestion).toBeDefined();
    });

    test('identifies missing default case', async () => {
      const client = createMockLLMClient(mockInvalidExhaustivenessNoDefaultResponse);
      const fnCode = `
        function handleStatus(status: Status) {
          switch (status) {
            case "pending": return "Waiting";
            case "active": return "Running";
            case "completed": return "Done";
          }
        }
      `;
      const result = await SemanticNever.validateExhaustivenessCheck(
        fnCode,
        client
      );

      expect(result.valid).toBe(false);
      expect(result.suggestion).toContain('default');
    });
  });

  describe('shouldReturnNever', () => {
    test('identifies function that always throws', async () => {
      const client = createMockLLMClient(mockShouldReturnNeverThrowsResponse);
      const result = await SemanticNever.shouldReturnNever(
        'throwError',
        'always throws an exception',
        client
      );

      expect(result.shouldReturn).toBe(true);
      expect(result.reason).toContain('throws');
    });

    test('identifies function that may return', async () => {
      const client = createMockLLMClient(mockShouldNotReturnNeverResponse);
      const result = await SemanticNever.shouldReturnNever(
        'getValue',
        'returns a value or undefined',
        client
      );

      expect(result.shouldReturn).toBe(false);
    });

    test('identifies function with infinite loop', async () => {
      const client = createMockLLMClient(mockShouldReturnNeverLoopResponse);
      const result = await SemanticNever.shouldReturnNever(
        'runForever',
        'contains an infinite loop that never breaks',
        client
      );

      expect(result.shouldReturn).toBe(true);
      expect(result.reason).toContain('loop');
    });

    test('identifies conditional throw', async () => {
      const client = createMockLLMClient(mockShouldNotReturnNeverConditionalResponse);
      const result = await SemanticNever.shouldReturnNever(
        'validate',
        'throws on invalid input, returns on valid input',
        client
      );

      expect(result.shouldReturn).toBe(false);
      expect(result.reason).toContain('returns normally');
    });
  });

  describe('explain', () => {
    test('provides general explanation without context', async () => {
      const client = createMockLLMClient(mockExplainGeneralResponse);
      const result = await SemanticNever.explain(undefined, client);

      expect(result).toContain('never');
      expect(result).toContain('type');
    });

    test('provides explanation for function return type context', async () => {
      const client = createMockLLMClient(mockExplainFunctionReturnResponse);
      const result = await SemanticNever.explain(
        'in function return type',
        client
      );

      expect(result).toContain('function');
      expect(result).toContain('never');
    });

    test('provides explanation for type narrowing context', async () => {
      const client = createMockLLMClient(mockExplainTypeNarrowingResponse);
      const result = await SemanticNever.explain(
        'in type narrowing',
        client
      );

      expect(result).toContain('narrowing');
    });
  });

  describe('analyzeIntersection', () => {
    test('detects never from incompatible primitives', async () => {
      const client = createMockLLMClient(mockIntersectionNeverPrimitivesResponse);
      const result = await SemanticNever.analyzeIntersection(
        ['string', 'number'],
        client
      );

      expect(result.resultsInNever).toBe(true);
      expect(result.reason).toContain('string');
      expect(result.reason).toContain('number');
    });

    test('allows compatible object intersection', async () => {
      const client = createMockLLMClient(mockIntersectionNotNeverObjectsResponse);
      const result = await SemanticNever.analyzeIntersection(
        ['{ name: string }', '{ age: number }'],
        client
      );

      expect(result.resultsInNever).toBe(false);
    });

    test('detects never from string & boolean', async () => {
      const client = createMockLLMClient(mockIntersectionNeverStringBooleanResponse);
      const result = await SemanticNever.analyzeIntersection(
        ['string', 'boolean'],
        client
      );

      expect(result.resultsInNever).toBe(true);
    });

    test('allows same type intersection', async () => {
      const client = createMockLLMClient(mockIntersectionNotNeverSameTypeResponse);
      const result = await SemanticNever.analyzeIntersection(
        ['string', 'string'],
        client
      );

      expect(result.resultsInNever).toBe(false);
    });
  });

  describe('appropriatePatterns', () => {
    test('returns array of patterns', () => {
      const patterns = SemanticNever.appropriatePatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    test('each pattern has required fields', () => {
      const patterns = SemanticNever.appropriatePatterns();

      for (const pattern of patterns) {
        expect(pattern.pattern).toBeDefined();
        expect(typeof pattern.pattern).toBe('string');
        expect(pattern.description).toBeDefined();
        expect(typeof pattern.description).toBe('string');
        expect(pattern.example).toBeDefined();
        expect(typeof pattern.example).toBe('string');
      }
    });

    test('includes exhaustive switch handler pattern', () => {
      const patterns = SemanticNever.appropriatePatterns();
      const hasExhaustive = patterns.some(
        (p) =>
          p.pattern.toLowerCase().includes('exhaustive') ||
          p.description.toLowerCase().includes('exhaustive')
      );

      expect(hasExhaustive).toBe(true);
    });

    test('includes functions that never return pattern', () => {
      const patterns = SemanticNever.appropriatePatterns();
      const hasNeverReturn = patterns.some(
        (p) =>
          p.pattern.toLowerCase().includes('never return') ||
          p.description.toLowerCase().includes('always throw')
      );

      expect(hasNeverReturn).toBe(true);
    });
  });
});

describe('SemanticNever prompts', () => {
  test('createIsExhaustivePrompt includes type and cases', async () => {
    const { createIsExhaustivePrompt } = await import('../prompts.ts');
    const prompt = createIsExhaustivePrompt('Status', ['pending', 'active']);

    expect(prompt).toContain('Status');
    expect(prompt).toContain('pending');
    expect(prompt).toContain('active');
  });

  test('createExplainUnreachabilityPrompt includes context', async () => {
    const { createExplainUnreachabilityPrompt } = await import('../prompts.ts');
    const prompt = createExplainUnreachabilityPrompt('after throw statement');

    expect(prompt).toContain('after throw statement');
  });

  test('createIsDeadCodePrompt includes code and optional context', async () => {
    const { createIsDeadCodePrompt } = await import('../prompts.ts');

    const promptWithoutContext = createIsDeadCodePrompt('return x');
    expect(promptWithoutContext).toContain('return x');

    const promptWithContext = createIsDeadCodePrompt('return x', 'in function');
    expect(promptWithContext).toContain('return x');
    expect(promptWithContext).toContain('in function');
  });

  test('createSuggestExhaustiveHandlerPrompt includes type name', async () => {
    const { createSuggestExhaustiveHandlerPrompt } = await import('../prompts.ts');
    const prompt = createSuggestExhaustiveHandlerPrompt('Action');

    expect(prompt).toContain('Action');
    expect(prompt).toContain('never');
  });

  test('createValidateExhaustivenessCheckPrompt includes function code', async () => {
    const { createValidateExhaustivenessCheckPrompt } = await import('../prompts.ts');
    const fnCode = 'function test() { return 1; }';
    const prompt = createValidateExhaustivenessCheckPrompt(fnCode);

    expect(prompt).toContain(fnCode);
  });

  test('createShouldReturnNeverPrompt includes function name and behavior', async () => {
    const { createShouldReturnNeverPrompt } = await import('../prompts.ts');
    const prompt = createShouldReturnNeverPrompt('fail', 'always throws');

    expect(prompt).toContain('fail');
    expect(prompt).toContain('always throws');
  });

  test('createExplainPrompt handles context', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');

    const promptWithoutContext = createExplainPrompt();
    expect(promptWithoutContext).toContain('never');

    const promptWithContext = createExplainPrompt('in generics');
    expect(promptWithContext).toContain('in generics');
  });

  test('createAnalyzeIntersectionPrompt includes types', async () => {
    const { createAnalyzeIntersectionPrompt } = await import('../prompts.ts');
    const prompt = createAnalyzeIntersectionPrompt(['string', 'number']);

    expect(prompt).toContain('string');
    expect(prompt).toContain('number');
  });

  test('getAppropriatePatterns returns static list', async () => {
    const { getAppropriatePatterns } = await import('../prompts.ts');
    const patterns = getAppropriatePatterns();

    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBeGreaterThan(0);
  });
});
