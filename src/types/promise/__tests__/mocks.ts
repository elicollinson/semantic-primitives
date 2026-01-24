/**
 * Mock utilities for SemanticPromise testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for explanation */
export const mockExplainResponse = {
  explanation: 'Fetches user data from the API and returns profile information',
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent values */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.92,
};

/** Mock response for non-equivalent values */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR INFER OPERATION
// =============================================================================

/** Mock response for API call operation */
export const mockApiCallOperationResponse = {
  operation: 'api-call',
  resource: 'user',
  action: 'read',
  confidence: 0.90,
};

/** Mock response for database operation */
export const mockDbOperationResponse = {
  operation: 'database-query',
  resource: 'users',
  action: 'select',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE RESULT
// =============================================================================

/** Mock response for valid result */
export const mockValidResultResponse = {
  valid: true,
  issues: [],
  confidence: 0.95,
};

/** Mock response for invalid result */
export const mockInvalidResultResponse = {
  valid: false,
  issues: ['email field is missing', 'id should be a number'],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR TRANSFORM
// =============================================================================

/** Mock response for transformation */
export const mockTransformResponse = {
  transformed: { name: 'John', email: 'john@example.com' },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR RETRY
// =============================================================================

/** Mock response for should retry (true) */
export const mockShouldRetryTrueResponse = {
  shouldRetry: true,
  reason: 'Network error is typically transient',
  confidence: 0.85,
};

/** Mock response for should retry (false) */
export const mockShouldRetryFalseResponse = {
  shouldRetry: false,
  reason: 'Authentication error is not retryable',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR FALLBACK
// =============================================================================

/** Mock response for should fallback (true) */
export const mockShouldFallbackTrueResponse = {
  shouldFallback: true,
  reason: 'Not found error matches fallback condition',
  confidence: 0.90,
};

/** Mock response for should fallback (false) */
export const mockShouldFallbackFalseResponse = {
  shouldFallback: false,
  reason: 'Error does not match fallback condition',
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
