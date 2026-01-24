/**
 * Mock utilities for SemanticError testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

/** Mock response for semanticallyEquals - equivalent errors */
export const mockEquivalentResponse = {
  equivalent: true,
  reason: 'Both errors are network timeout errors with similar root causes',
  confidence: 0.92,
};

/** Mock response for semanticallyEquals - not equivalent errors */
export const mockNotEquivalentResponse = {
  equivalent: false,
  reason: 'The errors have different root causes: one is network-related, the other is authentication-related',
  confidence: 0.88,
};

/** Mock response for classify - network error */
export const mockClassifyNetworkResponse = {
  category: 'network',
  subcategory: 'timeout',
  severity: 'recoverable',
  retryable: true,
};

/** Mock response for classify - database error */
export const mockClassifyDatabaseResponse = {
  category: 'database',
  subcategory: 'connection',
  severity: 'critical',
  retryable: false,
};

/** Mock response for classify - validation error */
export const mockClassifyValidationResponse = {
  category: 'validation',
  subcategory: 'format',
  severity: 'warning',
  retryable: false,
};

/** Mock response for explain - end-user */
export const mockExplainEndUserResponse =
  "We're having trouble connecting to the server. Please check your internet connection and try again in a few moments.";

/** Mock response for explain - developer */
export const mockExplainDeveloperResponse =
  'ECONNREFUSED on port 5432: The PostgreSQL server is not accepting connections. Check if the database service is running and the connection string is correct.';

/** Mock response for explain - support */
export const mockExplainSupportResponse =
  'Database connection error (ECONNREFUSED). The application cannot reach the PostgreSQL server. Verify the database service status and network configuration.';

/** Mock response for suggestFixes */
export const mockSuggestFixesResponse = {
  fixes: [
    {
      fix: 'Check if the database service is running',
      confidence: 0.95,
      code: 'sudo systemctl status postgresql',
    },
    {
      fix: 'Verify the connection string in your configuration',
      confidence: 0.88,
      code: null,
    },
    {
      fix: 'Ensure the database host is reachable',
      confidence: 0.82,
      code: 'ping localhost',
    },
  ],
};

/** Mock response for inferRootCause */
export const mockInferRootCauseResponse = {
  cause: 'The PostgreSQL database service is not running or not accepting connections on the configured port',
  confidence: 0.87,
};

/** Mock response for matches - true */
export const mockMatchesTrueResponse = {
  matches: true,
};

/** Mock response for matches - false */
export const mockMatchesFalseResponse = {
  matches: false,
};

/** Mock response for getResources */
export const mockGetResourcesResponse = {
  resources: [
    {
      title: 'PostgreSQL Connection Troubleshooting',
      type: 'docs',
    },
    {
      title: 'Database Connection Errors FAQ',
      type: 'troubleshooting',
    },
  ],
};

/** Mock response for shouldReport - should report */
export const mockShouldReportTrueResponse = {
  report: true,
  reason: 'This is an unexpected database connection failure that may indicate a system issue',
  priority: 'high',
};

/** Mock response for shouldReport - should not report */
export const mockShouldReportFalseResponse = {
  report: false,
  reason: 'This is a user input validation error that is expected in normal operation',
  priority: null,
};

/** Mock response for recoveryStrategy - retry */
export const mockRecoveryStrategyRetryResponse = {
  strategy: 'retry',
  maxAttempts: 3,
  backoff: 'exponential',
};

/** Mock response for recoveryStrategy - fallback */
export const mockRecoveryStrategyFallbackResponse = {
  strategy: 'fallback',
  maxAttempts: null,
  backoff: null,
};

/** Mock response for recoveryStrategy - abort */
export const mockRecoveryStrategyAbortResponse = {
  strategy: 'abort',
  maxAttempts: null,
  backoff: null,
};

/** Mock response for getSeverity - critical */
export const mockGetSeverityCriticalResponse = {
  severity: 'critical',
};

/** Mock response for getSeverity - error */
export const mockGetSeverityErrorResponse = {
  severity: 'error',
};

/** Mock response for getSeverity - warning */
export const mockGetSeverityWarningResponse = {
  severity: 'warning',
};

/** Mock response for getSeverity - info */
export const mockGetSeverityInfoResponse = {
  severity: 'info',
};

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object | string): LLMClient {
  const content = typeof responseContent === 'string'
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
      const content = typeof response === 'string'
        ? response
        : JSON.stringify(response);
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
