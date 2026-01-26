/**
 * Mock utilities for SemanticNever testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// IS EXHAUSTIVE MOCK RESPONSES
// =============================================================================

/** Mock response for isExhaustive - exhaustive (all cases handled) */
export const mockExhaustiveAllCasesResponse = {
  exhaustive: true,
  missing: [],
};

/** Mock response for isExhaustive - not exhaustive (missing cases) */
export const mockNotExhaustiveMissingCasesResponse = {
  exhaustive: false,
  missing: ['completed', 'failed'],
};

/** Mock response for isExhaustive - not exhaustive (one missing) */
export const mockNotExhaustiveOneMissingResponse = {
  exhaustive: false,
  missing: ['cancelled'],
};

/** Mock response for isExhaustive - direction type exhaustive */
export const mockExhaustiveDirectionResponse = {
  exhaustive: true,
  missing: [],
};

// =============================================================================
// EXPLAIN UNREACHABILITY MOCK RESPONSES
// =============================================================================

/** Mock response for explainUnreachability - after throw */
export const mockUnreachabilityAfterThrowResponse = {
  reason: 'Code after a throw statement cannot execute because control flow exits the function',
  type: 'control-flow',
  suggestion: 'Remove the unreachable code after the throw statement',
};

/** Mock response for explainUnreachability - type narrowing */
export const mockUnreachabilityTypeNarrowingResponse = {
  reason: 'Type has been narrowed to never through exhaustive type guards',
  type: 'type-narrowing',
  suggestion: 'Use assertNever to catch any future additions to the union type',
};

/** Mock response for explainUnreachability - exhaustive check */
export const mockUnreachabilityExhaustiveCheckResponse = {
  reason: 'Default case in exhaustive switch should never be reached if all cases are handled',
  type: 'exhaustive-check',
  suggestion: 'This is correct - the assertNever pattern ensures compile-time safety',
};

/** Mock response for explainUnreachability - impossible state */
export const mockUnreachabilityImpossibleStateResponse = {
  reason: 'This state cannot occur due to business logic constraints',
  type: 'impossible-state',
  suggestion: 'Document the invariant and consider adding runtime assertions for safety',
};

// =============================================================================
// IS DEAD CODE MOCK RESPONSES
// =============================================================================

/** Mock response for isDeadCode - dead code after return */
export const mockDeadCodeAfterReturnResponse = {
  isDead: true,
  reason: 'Code after a return statement cannot be executed',
  safeToRemove: true,
};

/** Mock response for isDeadCode - not dead code */
export const mockNotDeadCodeResponse = {
  isDead: false,
  reason: 'This code can be reached under certain conditions',
  safeToRemove: false,
};

/** Mock response for isDeadCode - dead but unsafe to remove */
export const mockDeadCodeUnsafeResponse = {
  isDead: true,
  reason: 'Code is unreachable but removing it might cause issues',
  safeToRemove: false,
};

/** Mock response for isDeadCode - after infinite loop */
export const mockDeadCodeAfterLoopResponse = {
  isDead: true,
  reason: 'Code after an infinite loop without break can never execute',
  safeToRemove: true,
};

// =============================================================================
// SUGGEST EXHAUSTIVE HANDLER MOCK RESPONSES
// =============================================================================

/** Mock response for suggestExhaustiveHandler - Status type */
export const mockSuggestHandlerStatusResponse = {
  code: 'function assertNever(x: never): never { throw new Error(`Unexpected value: ${x}`); }',
  usage: 'default: return assertNever(status);',
};

/** Mock response for suggestExhaustiveHandler - Action type */
export const mockSuggestHandlerActionResponse = {
  code: 'function assertNever(x: never): never { throw new Error(`Unexpected value: ${x}`); }',
  usage: 'default: return assertNever(action);',
};

// =============================================================================
// VALIDATE EXHAUSTIVENESS CHECK MOCK RESPONSES
// =============================================================================

/** Mock response for validateExhaustivenessCheck - valid */
export const mockValidExhaustivenessResponse = {
  valid: true,
  covers: ['pending', 'active', 'completed'],
};

/** Mock response for validateExhaustivenessCheck - invalid (missing case) */
export const mockInvalidExhaustivenessMissingResponse = {
  valid: false,
  covers: ['pending', 'active'],
  missing: ['completed'],
  suggestion: 'Add a case for "completed" to handle all possibilities',
};

/** Mock response for validateExhaustivenessCheck - invalid (no default) */
export const mockInvalidExhaustivenessNoDefaultResponse = {
  valid: false,
  covers: ['pending', 'active', 'completed'],
  missing: [],
  suggestion: 'Add a default case with assertNever to ensure compile-time exhaustiveness checking',
};

// =============================================================================
// SHOULD RETURN NEVER MOCK RESPONSES
// =============================================================================

/** Mock response for shouldReturnNever - should return never (throws) */
export const mockShouldReturnNeverThrowsResponse = {
  shouldReturn: true,
  reason: 'Function always throws an exception and never returns normally',
};

/** Mock response for shouldReturnNever - should not return never */
export const mockShouldNotReturnNeverResponse = {
  shouldReturn: false,
  reason: 'Function may return normally under certain conditions',
};

/** Mock response for shouldReturnNever - should return never (infinite loop) */
export const mockShouldReturnNeverLoopResponse = {
  shouldReturn: true,
  reason: 'Function contains an infinite loop and never completes',
};

/** Mock response for shouldReturnNever - conditional throw */
export const mockShouldNotReturnNeverConditionalResponse = {
  shouldReturn: false,
  reason: 'Function only throws on error conditions; it returns normally when input is valid',
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

/** Mock response for explain - general */
export const mockExplainGeneralResponse = {
  explanation:
    "The 'never' type in TypeScript represents values that never occur. It is the bottom type of the type system, meaning it is a subtype of all other types. A function returning 'never' will never successfully return - it either throws an exception or runs forever.",
};

/** Mock response for explain - in function return type */
export const mockExplainFunctionReturnResponse = {
  explanation:
    "A function with return type 'never' indicates that the function will never return normally. This typically means the function always throws an exception, calls process.exit(), or contains an infinite loop. This type annotation helps TypeScript understand control flow and catch unreachable code.",
};

/** Mock response for explain - in type narrowing */
export const mockExplainTypeNarrowingResponse = {
  explanation:
    "When type narrowing eliminates all possibilities from a union type, the remaining type becomes 'never'. This is useful in exhaustive checks: after handling all known cases of a discriminated union, the variable's type in the default branch should be 'never', indicating that branch should be unreachable.",
};

// =============================================================================
// ANALYZE INTERSECTION MOCK RESPONSES
// =============================================================================

/** Mock response for analyzeIntersection - results in never (incompatible primitives) */
export const mockIntersectionNeverPrimitivesResponse = {
  resultsInNever: true,
  reason: 'A value cannot simultaneously be both a string and a number - these primitive types are mutually exclusive',
};

/** Mock response for analyzeIntersection - does not result in never (compatible objects) */
export const mockIntersectionNotNeverObjectsResponse = {
  resultsInNever: false,
  reason: 'Object types can be intersected as long as their properties are compatible - the result would be an object with all properties from both types',
};

/** Mock response for analyzeIntersection - results in never (string & boolean) */
export const mockIntersectionNeverStringBooleanResponse = {
  resultsInNever: true,
  reason: 'String and boolean are incompatible primitive types - no value can satisfy both',
};

/** Mock response for analyzeIntersection - does not result in never (same type) */
export const mockIntersectionNotNeverSameTypeResponse = {
  resultsInNever: false,
  reason: 'Intersecting a type with itself results in the same type, not never',
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object): LLMClient {
  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.resolve({
        content: JSON.stringify(responseContent),
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

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

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(responses: object[]): LLMClient {
  let callIndex = 0;

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      return Promise.resolve({
        content: JSON.stringify(response),
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

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
