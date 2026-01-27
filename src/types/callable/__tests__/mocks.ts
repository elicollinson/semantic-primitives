/**
 * Mock utilities for SemanticCallable testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTIC EQUALS RESPONSES
// =============================================================================

/** Mock response for semanticallyEquals - equivalent functions */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
};

/** Mock response for semanticallyEquals - not equivalent functions */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
};

// =============================================================================
// EXPLAIN RESPONSES
// =============================================================================

/** Mock response for explain - add function */
export const mockExplainAddResponse = {
  explanation: 'Takes two numbers and returns their sum. Both parameters are required numbers.',
};

/** Mock response for explain - divide function */
export const mockExplainDivideResponse = {
  explanation: 'Divides the first number by the second. Returns the quotient. Does not handle division by zero.',
};

/** Mock response for explain - filter function */
export const mockExplainFilterResponse = {
  explanation: 'Filters an array based on a predicate function, returning only elements that pass the test.',
};

// =============================================================================
// INFER SIGNATURE RESPONSES
// =============================================================================

/** Mock response for inferSignature - numeric function */
export const mockInferSignatureNumericResponse = {
  params: ['number', 'number'],
  return: 'number',
  confidence: 0.92,
};

/** Mock response for inferSignature - string function */
export const mockInferSignatureStringResponse = {
  params: ['string', 'string'],
  return: 'string',
  confidence: 0.88,
};

/** Mock response for inferSignature - mixed types */
export const mockInferSignatureMixedResponse = {
  params: ['number | string', 'number | string'],
  return: 'number | string',
  confidence: 0.75,
};

/** Mock response for inferSignature - array function */
export const mockInferSignatureArrayResponse = {
  params: ['Array<unknown>', '(item: unknown) => boolean'],
  return: 'Array<unknown>',
  confidence: 0.85,
};

// =============================================================================
// GENERATE TYPE DEFINITION RESPONSES
// =============================================================================

/** Mock response for generateTypeDefinition - add function */
export const mockGenerateTypeDefinitionAddResponse = {
  typeDefinition: 'type Add = (a: number, b: number) => number;',
};

/** Mock response for generateTypeDefinition - filter function */
export const mockGenerateTypeDefinitionFilterResponse = {
  typeDefinition: 'type Filter<T> = (array: T[], predicate: (item: T) => boolean) => T[];',
};

/** Mock response for generateTypeDefinition - complex function */
export const mockGenerateTypeDefinitionComplexResponse = {
  typeDefinition: 'type ProcessData = (data: unknown, options?: { validate?: boolean; transform?: boolean }) => Promise<Result>;',
};

// =============================================================================
// VALIDATE ARGS RESPONSES
// =============================================================================

/** Mock response for validateArgs - valid args */
export const mockValidateArgsValidResponse = {
  valid: true,
  issues: [],
};

/** Mock response for validateArgs - invalid args (division by zero) */
export const mockValidateArgsDivisionByZeroResponse = {
  valid: false,
  issues: ['Second argument (divisor) is zero, which would cause division by zero'],
};

/** Mock response for validateArgs - invalid args (type mismatch) */
export const mockValidateArgsTypeMismatchResponse = {
  valid: false,
  issues: ['First argument should be a number but received string', 'Second argument should be a number but received null'],
};

/** Mock response for validateArgs - invalid with custom rules */
export const mockValidateArgsCustomRulesResponse = {
  valid: false,
  issues: ['Value must be positive, but received -5'],
};

// =============================================================================
// GENERATE TESTS RESPONSES
// =============================================================================

/** Mock response for generateTests - add function */
export const mockGenerateTestsAddResponse = {
  tests: [
    { inputs: [0, 0], expectedOutput: 0, description: 'Adding two zeros' },
    { inputs: [1, 2], expectedOutput: 3, description: 'Adding positive numbers' },
    { inputs: [-1, 1], expectedOutput: 0, description: 'Adding opposite numbers' },
    { inputs: [1.5, 2.5], expectedOutput: 4, description: 'Adding decimal numbers' },
  ],
};

/** Mock response for generateTests - divide function */
export const mockGenerateTestsDivideResponse = {
  tests: [
    { inputs: [10, 2], expectedOutput: 5, description: 'Normal division' },
    { inputs: [0, 5], expectedOutput: 0, description: 'Zero divided by non-zero' },
    { inputs: [7, 2], expectedOutput: 3.5, description: 'Division with remainder' },
    { inputs: [-10, 2], expectedOutput: -5, description: 'Negative number division' },
  ],
};

/** Mock response for generateTests - string function */
export const mockGenerateTestsStringResponse = {
  tests: [
    { inputs: ['hello', 'world'], expectedOutput: 'helloworld', description: 'Concatenating two strings' },
    { inputs: ['', 'test'], expectedOutput: 'test', description: 'Concatenating with empty string' },
    { inputs: ['a', ''], expectedOutput: 'a', description: 'Concatenating empty string' },
  ],
};

// =============================================================================
// SUGGEST WRAPPER RESPONSES
// =============================================================================

/** Mock response for suggestWrapper - divide function */
export const mockSuggestWrapperDivideResponse = {
  code: `function safeDivide(a: number, b: number): number | null {
  if (b === 0) {
    return null;
  }
  return a / b;
}`,
  reason: 'Wraps the divide function to handle division by zero by returning null instead of Infinity or NaN.',
};

/** Mock response for suggestWrapper - array access */
export const mockSuggestWrapperArrayResponse = {
  code: `function safeGet<T>(arr: T[], index: number): T | undefined {
  if (index < 0 || index >= arr.length) {
    return undefined;
  }
  return arr[index];
}`,
  reason: 'Adds bounds checking to prevent accessing invalid array indices.',
};

// =============================================================================
// DETECT ISSUES RESPONSES
// =============================================================================

/** Mock response for detectIssues - clean function */
export const mockDetectIssuesCleanResponse = {
  issues: [],
};

/** Mock response for detectIssues - divide function */
export const mockDetectIssuesDivideResponse = {
  issues: [
    { issue: 'No check for division by zero', severity: 'warning' as const },
    { issue: 'No type checking for numeric inputs', severity: 'info' as const },
  ],
};

/** Mock response for detectIssues - complex issues */
export const mockDetectIssuesComplexResponse = {
  issues: [
    { issue: 'Potential null pointer exception when accessing nested properties', severity: 'error' as const },
    { issue: 'Missing error handling for async operation', severity: 'warning' as const },
    { issue: 'Could benefit from input validation', severity: 'info' as const },
  ],
};

// =============================================================================
// IS SAFE TO CALL RESPONSES
// =============================================================================

/** Mock response for isSafeToCall - safe */
export const mockIsSafeToCallSafeResponse = {
  safe: true,
};

/** Mock response for isSafeToCall - unsafe (division by zero) */
export const mockIsSafeToCallDivisionByZeroResponse = {
  safe: false,
  reason: 'Division by zero would result in Infinity or NaN',
};

/** Mock response for isSafeToCall - unsafe (null access) */
export const mockIsSafeToCallNullAccessResponse = {
  safe: false,
  reason: 'Calling with null would cause a TypeError when accessing properties',
};

/** Mock response for isSafeToCall - unsafe (type mismatch) */
export const mockIsSafeToCallTypeMismatchResponse = {
  safe: false,
  reason: 'String argument passed to function expecting number, may produce unexpected results',
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object | string): LLMClient {
  const content =
    typeof responseContent === 'string'
      ? responseContent
      : JSON.stringify(responseContent);

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.resolve({
        content,
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
export function createSequentialMockLLMClient(
  responses: (object | string)[]
): LLMClient {
  let callIndex = 0;

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      const content =
        typeof response === 'string' ? response : JSON.stringify(response);
      return Promise.resolve({
        content,
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
 * Create a mock LLM client that throws an error
 */
export function createErrorMockLLMClient(error: Error): LLMClient {
  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.reject(error);
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() => Promise.reject(error)),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}
