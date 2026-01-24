/**
 * Mock utilities for SemanticPromise testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTIC EQUALS RESPONSES
// =============================================================================

/** Mock response for semanticallyEquals - equivalent values */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.92,
};

/** Mock response for semanticallyEquals - not equivalent values */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
};

// =============================================================================
// TIMEOUT RESPONSES
// =============================================================================

/** Mock response for timeout error message */
export const mockTimeoutErrorResponse = {
  message: 'Database connection timed out after 5 seconds. Please check network connectivity.',
};

/** Mock response for API timeout */
export const mockApiTimeoutResponse = {
  message: 'API request timed out after 3 seconds. The server may be under heavy load.',
};

// =============================================================================
// CATCH SEMANTIC RESPONSES
// =============================================================================

/** Mock response for catch semantic - network error */
export const mockCatchSemanticNetworkResponse = {
  explanation: 'Unable to connect to the server. This could be due to network issues.',
  rootCause: 'Network connectivity failure or server unavailability',
  suggestedFixes: [
    'Check your internet connection',
    'Verify the server is running',
    'Try again in a few moments',
  ],
  isRetryable: true,
};

/** Mock response for catch semantic - validation error */
export const mockCatchSemanticValidationResponse = {
  explanation: 'The input data did not meet the required format.',
  rootCause: 'Invalid input format',
  suggestedFixes: [
    'Check the input format',
    'Ensure all required fields are present',
  ],
  isRetryable: false,
};

// =============================================================================
// RETRY RESPONSES
// =============================================================================

/** Mock response for should retry - yes */
export const mockShouldRetryTrueResponse = {
  shouldRetry: true,
  reason: 'This is a transient network error that may resolve on retry',
};

/** Mock response for should retry - no */
export const mockShouldRetryFalseResponse = {
  shouldRetry: false,
  reason: 'This is a validation error that will not be resolved by retrying',
};

// =============================================================================
// TRANSFORM RESPONSES
// =============================================================================

/** Mock response for transform - success */
export const mockTransformSuccessResponse = {
  result: { name: 'John', email: 'john@example.com' },
  success: true,
};

/** Mock response for transform - array extraction */
export const mockTransformArrayResponse = {
  result: ['apple', 'banana', 'cherry'],
  success: true,
};

/** Mock response for transform - failure */
export const mockTransformFailureResponse = {
  result: null,
  success: false,
  explanation: 'Cannot extract email from non-object value',
};

// =============================================================================
// VALIDATION RESPONSES
// =============================================================================

/** Mock response for validate result - valid */
export const mockValidateValidResponse = {
  valid: true,
  violations: [],
  confidence: 0.95,
};

/** Mock response for validate result - invalid */
export const mockValidateInvalidResponse = {
  valid: false,
  violations: ['Missing required field: email', 'Name must not be empty'],
  confidence: 0.88,
};

// =============================================================================
// FALLBACK RESPONSES
// =============================================================================

/** Mock response for should use fallback - yes */
export const mockUseFallbackTrueResponse = {
  useFallback: true,
  reason: 'User not found matches the fallback condition',
};

/** Mock response for should use fallback - no */
export const mockUseFallbackFalseResponse = {
  useFallback: false,
  reason: 'Error does not match the fallback condition',
};

// =============================================================================
// INFER OPERATION RESPONSES
// =============================================================================

/** Mock response for infer operation - API call */
export const mockInferOperationApiResponse = {
  operation: 'api-call',
  resource: 'user',
  action: 'read',
};

/** Mock response for infer operation - database query */
export const mockInferOperationDbResponse = {
  operation: 'database-query',
  resource: 'order',
  action: 'create',
};

/** Mock response for infer operation - unknown */
export const mockInferOperationUnknownResponse = {
  operation: 'unknown',
  resource: null,
  action: null,
};

// =============================================================================
// LOGGING RESPONSES
// =============================================================================

/** Mock response for logging - start */
export const mockLoggingStartResponse = {
  message: 'Starting: fetching user data from API',
};

/** Mock response for logging - complete */
export const mockLoggingCompleteResponse = {
  message: 'Completed: fetched user data successfully (245ms)',
};

/** Mock response for logging - error */
export const mockLoggingErrorResponse = {
  message: 'Error: failed to fetch user data - Connection refused',
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
