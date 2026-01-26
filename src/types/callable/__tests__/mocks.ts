/**
 * Mock utilities for SemanticCallable testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTICALLY EQUALS MOCK RESPONSES
// =============================================================================

export const mockEquivalentCallables = {
  equivalent: true,
  confidence: 0.95,
};

export const mockNotEquivalentCallables = {
  equivalent: false,
  confidence: 0.9,
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

export const mockExplainAdd = {
  explanation: 'Takes two numbers and returns their sum. Handles edge cases like NaN and Infinity.',
};

export const mockExplainTransform = {
  explanation: 'Transforms an array of objects by extracting and formatting specific fields.',
};

export const mockExplainAsync = {
  explanation: 'Fetches data asynchronously from a remote source and processes the response.',
};

// =============================================================================
// INFER SIGNATURE MOCK RESPONSES
// =============================================================================

export const mockInferSignatureAdd = {
  parameters: [
    { name: 'a', type: 'number', optional: false },
    { name: 'b', type: 'number', optional: false },
  ],
  returnType: 'number',
  generics: [],
  confidence: 0.95,
};

export const mockInferSignatureMap = {
  parameters: [
    { name: 'items', type: 'T[]', optional: false },
    { name: 'fn', type: '(item: T) => U', optional: false },
  ],
  returnType: 'U[]',
  generics: ['T', 'U'],
  confidence: 0.88,
};

export const mockInferSignatureOptional = {
  parameters: [
    { name: 'name', type: 'string', optional: false },
    { name: 'options', type: 'Options', optional: true },
  ],
  returnType: 'void',
  generics: [],
  confidence: 0.85,
};

// =============================================================================
// GENERATE TYPE DEFINITION MOCK RESPONSES
// =============================================================================

export const mockGenerateTypeDefinitionAdd = {
  typeDefinition: `/**
 * Adds two numbers together
 * @param a - First number to add
 * @param b - Second number to add
 * @returns The sum of a and b
 */
type AddFunction = (a: number, b: number) => number;`,
  interfaceName: 'AddFunction',
};

export const mockGenerateTypeDefinitionMap = {
  typeDefinition: `/**
 * Maps an array of items using a transformation function
 * @template T - Input item type
 * @template U - Output item type
 * @param items - Array of items to transform
 * @param fn - Transformation function
 * @returns Array of transformed items
 */
type MapFunction<T, U> = (items: T[], fn: (item: T) => U) => U[];`,
  interfaceName: 'MapFunction',
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
  issues: ['first argument must be a number', 'second argument cannot be NaN'],
};

export const mockValidateArgsWithRules = {
  valid: false,
  issues: ['first argument must be a valid email', 'subject should not be empty'],
};

// =============================================================================
// GENERATE TESTS MOCK RESPONSES
// =============================================================================

export const mockGenerateTestsAdd = {
  tests: [
    { input: [1, 2], expectedOutput: 3, description: 'basic addition', shouldThrow: false },
    { input: [0, 0], expectedOutput: 0, description: 'zero case', shouldThrow: false },
    { input: [-1, 1], expectedOutput: 0, description: 'opposite numbers', shouldThrow: false },
    { input: [Number.MAX_SAFE_INTEGER, 1], expectedOutput: Number.MAX_SAFE_INTEGER + 1, description: 'large numbers', shouldThrow: false },
  ],
};

export const mockGenerateTestsDivide = {
  tests: [
    { input: [10, 2], expectedOutput: 5, description: 'basic division', shouldThrow: false },
    { input: [10, 0], expectedOutput: null, description: 'division by zero', shouldThrow: true },
    { input: [0, 5], expectedOutput: 0, description: 'zero numerator', shouldThrow: false },
  ],
};

// =============================================================================
// SUGGEST WRAPPER MOCK RESPONSES
// =============================================================================

export const mockSuggestWrapperAdd = {
  wrapper: `function safeAdd(a: unknown, b: unknown): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers');
  }
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new TypeError('Arguments cannot be NaN');
  }
  return a + b;
}`,
  benefits: [
    'Runtime type checking for both arguments',
    'Clear error messages for invalid inputs',
    'Handles NaN edge case explicitly',
  ],
  validations: [
    'typeof check for number type',
    'NaN check to prevent NaN propagation',
  ],
};

export const mockSuggestWrapperAsync = {
  wrapper: `async function safeFetch(url: unknown): Promise<Response> {
  if (typeof url !== 'string') {
    throw new TypeError('URL must be a string');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('URL must use http or https protocol');
  }
  try {
    return await fetch(url);
  } catch (error) {
    throw new Error(\`Failed to fetch: \${error.message}\`);
  }
}`,
  benefits: [
    'URL validation before fetch',
    'Protocol verification for security',
    'Error wrapping with context',
  ],
  validations: [
    'typeof check for string type',
    'Protocol prefix check',
  ],
};

// =============================================================================
// DETECT ISSUES MOCK RESPONSES
// =============================================================================

export const mockDetectIssuesNone = {
  issues: [],
};

export const mockDetectIssuesMultiple = {
  issues: [
    { issue: 'No error handling for edge cases', severity: 'warning' },
    { issue: 'Missing null check for optional parameter', severity: 'info' },
    { issue: 'Potential type coercion issue with string concatenation', severity: 'error' },
  ],
};

export const mockDetectIssuesSecurity = {
  issues: [
    { issue: 'SQL injection vulnerability with unsanitized input', severity: 'error' },
    { issue: 'No input validation before database query', severity: 'warning' },
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
  reason: 'Input contains potential SQL injection',
  severity: 'high',
};

export const mockIsSafeToCallPathTraversal = {
  safe: false,
  reason: 'File path contains directory traversal attempt (../)',
  severity: 'high',
};

export const mockIsSafeToCallMediumRisk = {
  safe: false,
  reason: 'Input may cause resource exhaustion with very large array',
  severity: 'medium',
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
 * Create a mock LLM client that returns different responses based on call index
 */
export function createSequencedMockLLMClient(responses: object[]): LLMClient {
  let callIndex = 0;

  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    const response = responses[callIndex % responses.length];
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
