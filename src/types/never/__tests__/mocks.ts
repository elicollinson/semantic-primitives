/**
 * Mock utilities for SemanticNever testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// IS EXHAUSTIVE MOCK RESPONSES
// =============================================================================

export const mockExhaustiveComplete = {
  exhaustive: true,
  missing: [],
};

export const mockExhaustiveIncomplete = {
  exhaustive: false,
  missing: ['completed'],
};

export const mockExhaustiveManyMissing = {
  exhaustive: false,
  missing: ['pending', 'cancelled', 'error'],
};

// =============================================================================
// EXPLAIN UNREACHABILITY MOCK RESPONSES
// =============================================================================

export const mockUnreachabilityControlFlow = {
  reason: 'Code after a throw statement cannot execute',
  type: 'control-flow',
  suggestion: 'Remove dead code after throw',
};

export const mockUnreachabilityTypeNarrowing = {
  reason: 'Type has been narrowed to never by previous checks',
  type: 'type-narrowing',
  suggestion: 'This code path is impossible, consider removing',
};

export const mockUnreachabilityExhaustive = {
  reason: 'All cases of the union type have been handled',
  type: 'exhaustive-check',
  suggestion: 'Add assertNever for compile-time exhaustiveness checking',
};

// =============================================================================
// IS DEAD CODE MOCK RESPONSES
// =============================================================================

export const mockDeadCodeTrue = {
  isDead: true,
  reason: 'First return already exits the function',
  safeToRemove: true,
};

export const mockDeadCodeFalse = {
  isDead: false,
  reason: 'Code is reachable under certain conditions',
  safeToRemove: false,
};

export const mockDeadCodeUnsafe = {
  isDead: true,
  reason: 'Code is unreachable but may be needed for future cases',
  safeToRemove: false,
};

// =============================================================================
// SUGGEST EXHAUSTIVE HANDLER MOCK RESPONSES
// =============================================================================

export const mockExhaustiveHandler = {
  code: 'function assertNever(x: never): never { throw new Error(`Unexpected value: ${x}`); }',
  usage: 'default: return assertNever(status);',
};

// =============================================================================
// VALIDATE EXHAUSTIVENESS CHECK MOCK RESPONSES
// =============================================================================

export const mockValidateExhaustiveValid = {
  valid: true,
  covers: ['pending', 'active', 'completed'],
  missing: [],
  suggestion: null,
};

export const mockValidateExhaustiveInvalid = {
  valid: false,
  covers: ['pending', 'active'],
  missing: ['completed'],
  suggestion: 'Add case for "completed" status',
};

// =============================================================================
// SHOULD RETURN NEVER MOCK RESPONSES
// =============================================================================

export const mockShouldReturnNeverTrue = {
  shouldReturn: true,
  reason: 'Function always throws, never returns normally',
};

export const mockShouldReturnNeverFalse = {
  shouldReturn: false,
  reason: 'Function can return normally in some cases',
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

export const mockExplainGeneral = {
  explanation:
    "The 'never' type represents values that never occur. A function returning 'never' will never complete normally - it either throws an error or runs forever.",
};

export const mockExplainInSwitch = {
  explanation:
    "In a switch statement, the default case can use 'never' to ensure all cases are handled. If a new case is added to the union type, TypeScript will error because the value can't be assigned to 'never'.",
};

// =============================================================================
// ANALYZE INTERSECTION MOCK RESPONSES
// =============================================================================

export const mockIntersectionNever = {
  resultsInNever: true,
  reason: 'A value cannot be both string and number',
};

export const mockIntersectionValid = {
  resultsInNever: false,
  reason: 'The types are compatible and can be intersected',
};

// =============================================================================
// APPROPRIATE PATTERNS MOCK RESPONSES
// =============================================================================

export const mockAppropriatePatterns = {
  patterns: [
    {
      pattern: 'Exhaustive Check',
      description: 'Use assertNever in switch default to ensure all cases are handled',
      example: 'default: return assertNever(value);',
    },
    {
      pattern: 'Error Throwing Function',
      description: 'Functions that always throw should return never',
      example: 'function fail(msg: string): never { throw new Error(msg); }',
    },
    {
      pattern: 'Infinite Loop',
      description: 'Functions with infinite loops that never return',
      example: 'function forever(): never { while (true) {} }',
    },
  ],
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.resolve({
      content: JSON.stringify(responseContent),
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
  });

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}
