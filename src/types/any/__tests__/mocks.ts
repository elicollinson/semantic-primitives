/**
 * Mock utilities for SemanticAny testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// CLASSIFY INTENT MOCK RESPONSES
// =============================================================================

export const mockClassifyIntentEscapeHatch = {
  intent: 'escape-hatch',
  reason: 'Interfacing with untyped library',
  risk: 'medium',
};

export const mockClassifyIntentLazy = {
  intent: 'lazy',
  reason: 'Could be properly typed but was not',
  risk: 'low',
};

export const mockClassifyIntentNecessary = {
  intent: 'necessary',
  reason: 'Truly dynamic data from external source',
  risk: 'medium',
};

export const mockClassifyIntentMigration = {
  intent: 'migration',
  reason: 'Part of ongoing type migration',
  risk: 'low',
};

// =============================================================================
// SUGGEST TYPE MOCK RESPONSES
// =============================================================================

export const mockSuggestTypeObject = {
  type: '{ name: string; age: number }',
  interface: 'interface User { name: string; age: number; }',
  confidence: 0.95,
};

export const mockSuggestTypeArray = {
  type: 'string[]',
  interface: null,
  confidence: 0.98,
};

export const mockSuggestTypePrimitive = {
  type: 'number',
  interface: null,
  confidence: 1.0,
};

// =============================================================================
// ASSESS RISK MOCK RESPONSES
// =============================================================================

export const mockAssessRiskHigh = {
  level: 'high',
  reasons: ['Value is used in security-sensitive context', 'Contains user input'],
  recommendations: ['Define explicit type', 'Add runtime validation'],
};

export const mockAssessRiskMedium = {
  level: 'medium',
  reasons: ['Could cause runtime errors if shape changes'],
  recommendations: ['Add type guard before use'],
};

export const mockAssessRiskLow = {
  level: 'low',
  reasons: ['Value is simple and well-understood'],
  recommendations: ['Consider adding type annotation for clarity'],
};

// =============================================================================
// GENERATE MIGRATION MOCK RESPONSES
// =============================================================================

export const mockGenerateMigrationSimple = {
  typeDefinition: 'interface ApiResponse { data: string; status: number; }',
  typeGuard: null,
  usage: 'const response: ApiResponse = fetchData();',
};

export const mockGenerateMigrationStrict = {
  typeDefinition: 'interface User { name: string; age: number; }',
  typeGuard: 'function isUser(x: unknown): x is User { return typeof x === "object" && x !== null && "name" in x && "age" in x; }',
  usage: 'if (isUser(data)) { const user: User = data; }',
};

// =============================================================================
// VALIDATE MOCK RESPONSES
// =============================================================================

export const mockValidateValid = {
  valid: true,
  issues: [],
  inferredShape: '{ name: string; age: number }',
};

export const mockValidateInvalid = {
  valid: false,
  issues: ['Missing required field "id"', 'Field "age" is not a number'],
  inferredShape: '{ name: string; age: unknown }',
};

// =============================================================================
// IS SAFE FOR MOCK RESPONSES
// =============================================================================

export const mockIsSafeForSafe = {
  safe: true,
};

export const mockIsSafeForUnsafe = {
  safe: false,
  reason: 'Contains user input, potential XSS',
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

export const mockExplainResponse = {
  explanation: 'This any is used because the API response shape varies',
  alternatives: ['Use discriminated union', 'Use unknown with type guard'],
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
