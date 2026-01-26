/**
 * Mock utilities for SemanticFunction testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTICALLY EQUALS MOCK RESPONSES
// =============================================================================

export const mockEquivalentFunctions = {
  equivalent: true,
  confidence: 0.95,
};

export const mockNotEquivalentFunctions = {
  equivalent: false,
  confidence: 0.9,
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

export const mockExplainAdd = {
  explanation: 'Takes two numbers and returns their sum. Handles edge cases like NaN.',
};

export const mockExplainTransform = {
  explanation: 'Transforms an array of objects by extracting and formatting specific fields.',
};

// =============================================================================
// VALIDATE ARGS MOCK RESPONSES
// =============================================================================

export const mockValidateArgsValid = {
  valid: true,
  issues: [],
};

export const mockValidateArgsInvalid = {
  valid: false,
  issues: ['first argument must be a valid email', 'subject should not be empty'],
};

// =============================================================================
// INFER PURPOSE MOCK RESPONSES
// =============================================================================

export const mockInferPurposeTransform = {
  purpose: 'data-transformation',
  category: 'array-manipulation',
  confidence: 0.88,
};

export const mockInferPurposeValidation = {
  purpose: 'Validates user input data',
  category: 'validation',
  confidence: 0.92,
};

// =============================================================================
// GENERATE DOCS MOCK RESPONSES
// =============================================================================

export const mockGenerateDocsJsdoc = {
  documentation: `/**
 * Adds two numbers together
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */`,
};

// =============================================================================
// SUGGEST IMPROVEMENTS MOCK RESPONSES
// =============================================================================

export const mockSuggestImprovements = {
  suggestions: [
    { suggestion: 'Add input validation', reason: 'Function may throw on invalid input' },
    { suggestion: 'Add type guards', reason: 'Ensure type safety at runtime' },
  ],
};

// =============================================================================
// DETECT ISSUES MOCK RESPONSES
// =============================================================================

export const mockDetectIssues = {
  issues: [
    { issue: 'No error handling', severity: 'warning' },
    { issue: 'Missing null check for optional param', severity: 'info' },
  ],
};

// =============================================================================
// GENERATE TESTS MOCK RESPONSES
// =============================================================================

export const mockGenerateTests = {
  tests: [
    { input: [1, 2], expectedOutput: 3, description: 'basic addition' },
    { input: [0, 0], expectedOutput: 0, description: 'zero case' },
    { input: [-1, 1], expectedOutput: 0, description: 'opposite numbers' },
  ],
};

// =============================================================================
// IS SAFE TO CALL MOCK RESPONSES
// =============================================================================

export const mockIsSafeToCallSafe = {
  safe: true,
  reason: null,
};

export const mockIsSafeToCallUnsafe = {
  safe: false,
  reason: 'Input contains potential injection',
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
