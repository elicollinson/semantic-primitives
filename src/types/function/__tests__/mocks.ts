/**
 * Mock utilities for SemanticFunction testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for function explanation */
export const mockExplainResponse = {
  explanation: 'This function takes two numbers as arguments and returns their sum. It handles basic addition of numeric values.',
  confidence: 0.92,
};

/** Mock response for complex function explanation */
export const mockComplexExplainResponse = {
  explanation: 'This function filters an array of items based on a predicate function, returning a new array containing only elements that pass the test.',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent functions */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.90,
  reason: 'Both functions produce the same outputs for the same inputs',
};

/** Mock response for non-equivalent functions */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.85,
  reason: 'Functions produce different outputs for some inputs',
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE ARGS
// =============================================================================

/** Mock response for valid arguments */
export const mockValidArgsResponse = {
  valid: true,
  issues: [],
  confidence: 0.95,
};

/** Mock response for invalid arguments */
export const mockInvalidArgsResponse = {
  valid: false,
  issues: ['First argument must be a number', 'Second argument cannot be negative'],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR INFER PURPOSE
// =============================================================================

/** Mock response for math function purpose */
export const mockMathPurposeResponse = {
  purpose: 'calculation',
  category: 'math',
  confidence: 0.92,
};

/** Mock response for data transformation purpose */
export const mockTransformPurposeResponse = {
  purpose: 'data-transformation',
  category: 'array-manipulation',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE DOCS
// =============================================================================

/** Mock response for JSDoc documentation */
export const mockJSDocResponse = {
  documentation: `/**
 * Adds two numbers together
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} The sum of a and b
 * @example
 * add(1, 2) // returns 3
 */`,
  confidence: 0.90,
};

/** Mock response for Markdown documentation */
export const mockMarkdownDocResponse = {
  documentation: `## add(a, b)

Adds two numbers together.

### Parameters
- \`a\` (number): The first number
- \`b\` (number): The second number

### Returns
- (number): The sum of a and b

### Example
\`\`\`javascript
add(1, 2) // returns 3
\`\`\``,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST IMPROVEMENTS
// =============================================================================

/** Mock response for improvement suggestions */
export const mockImprovementsResponse = {
  suggestions: [
    { suggestion: 'Add input validation', reason: 'Function may throw on invalid input types' },
    { suggestion: 'Add JSDoc comments', reason: 'Documentation improves code maintainability' },
  ],
  confidence: 0.85,
};

/** Mock response for no improvements needed */
export const mockNoImprovementsResponse = {
  suggestions: [],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR DETECT ISSUES
// =============================================================================

/** Mock response for detected issues */
export const mockIssuesResponse = {
  issues: [
    { issue: 'No error handling for edge cases', severity: 'warning' },
    { issue: 'Potential division by zero', severity: 'error' },
  ],
  confidence: 0.88,
};

/** Mock response for no issues */
export const mockNoIssuesResponse = {
  issues: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE TESTS
// =============================================================================

/** Mock response for generated test cases */
export const mockTestCasesResponse = {
  testCases: [
    { input: [1, 2], expectedOutput: 3, description: 'basic addition' },
    { input: [0, 0], expectedOutput: 0, description: 'adding zeros' },
    { input: [-1, 1], expectedOutput: 0, description: 'negative and positive' },
  ],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR IS SAFE TO CALL
// =============================================================================

/** Mock response for safe to call */
export const mockSafeResponse = {
  safe: true,
  confidence: 0.95,
};

/** Mock response for not safe to call */
export const mockNotSafeResponse = {
  safe: false,
  reason: 'Input contains potential injection patterns',
  confidence: 0.88,
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

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(responses: object[]): LLMClient {
  let callIndex = 0;

  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      content: JSON.stringify(response),
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
