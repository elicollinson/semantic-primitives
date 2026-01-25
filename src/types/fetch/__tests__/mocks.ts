/**
 * Mock responses and utilities for testing SemanticFetch classes
 */

import { mock } from 'bun:test';
import type { Message, LLMConfig } from '../../../llm/types.ts';
import type { RequestLLMClientInterface } from '../request.ts';
import type { ResponseLLMClientInterface } from '../response.ts';
import type { HeadersLLMClientInterface } from '../headers.ts';

// =============================================================================
// MOCK RESPONSE DATA
// =============================================================================

// Request mock responses
export const mockRequestEquivalentResponse = {
  equivalent: true,
  note: 'Requests are semantically identical',
  confidence: 0.95,
};

export const mockRequestNotEquivalentResponse = {
  equivalent: false,
  note: 'Different HTTP methods',
  confidence: 0.98,
};

export const mockAnalyzeIntentReadResponse = {
  intent: 'fetch list of users',
  operation: 'READ',
  resource: 'users',
  filters: [{ field: 'role', value: 'admin' }],
};

export const mockAnalyzeIntentCreateResponse = {
  intent: 'create new user',
  operation: 'CREATE',
  resource: 'users',
};

export const mockRequestValidResponse = {
  valid: true,
  issues: [],
};

export const mockRequestInvalidResponse = {
  valid: false,
  issues: ['Missing Content-Type header for JSON body'],
};

export const mockRequestExplainTechnicalResponse = {
  explanation: 'GET request to /api/users with query parameter role=admin to filter admin users',
};

export const mockRequestExplainNonTechnicalResponse = {
  explanation: 'Fetching the list of admin users',
};

export const mockRequestSecuritySafeResponse = {
  safe: true,
  issues: [],
  warnings: [],
};

export const mockRequestSecurityUnsafeResponse = {
  safe: false,
  issues: ['Sensitive token exposed in URL query string'],
  warnings: ['Consider using HTTPS'],
};

// Response mock responses
export const mockResponseEquivalentResponse = {
  equivalent: true,
  confidence: 0.92,
};

export const mockResponseNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
};

export const mockAnalyzeCollectionResponse = {
  dataType: 'collection',
  entityType: 'User',
  count: 25,
  pagination: { hasMore: true },
};

export const mockAnalyzeSingleResponse = {
  dataType: 'single',
  entityType: 'User',
};

export const mockAnalyzeErrorResponse = {
  dataType: 'error',
};

export const mockSummarizeSuccessResponse = {
  summary: 'Successfully retrieved 25 user records with pagination available',
};

export const mockSummarizeErrorResponse = {
  summary: 'Error: User not found with the provided ID',
};

export const mockContractValidResponse = {
  valid: true,
  issues: [],
};

export const mockContractInvalidResponse = {
  valid: false,
  issues: ['Missing required header: X-Request-ID', 'Status code 201 not in allowed list [200]'],
};

export const mockInterpretAuthErrorResponse = {
  category: 'authentication',
  message: 'Invalid or expired authentication token',
  suggestedAction: 'Refresh your authentication token and retry the request',
  retryable: true,
};

export const mockInterpretNotFoundErrorResponse = {
  category: 'not_found',
  message: 'The requested resource does not exist',
  suggestedAction: 'Verify the resource ID and ensure it exists',
  retryable: false,
};

export const mockInterpretServerErrorResponse = {
  category: 'server_error',
  message: 'Internal server error occurred',
  suggestedAction: 'Wait a moment and retry the request',
  retryable: true,
};

// Headers mock responses
export const mockHeadersEquivalentResponse = {
  equivalent: true,
  differences: [],
};

export const mockHeadersNotEquivalentResponse = {
  equivalent: false,
  differences: ['Different Content-Type values', 'Missing Authorization header in second set'],
};

export const mockHeadersValidResponse = {
  valid: true,
  issues: [],
};

export const mockHeadersInvalidResponse = {
  valid: false,
  issues: [
    { header: 'Content-Type', issue: 'Invalid MIME type format' },
    { header: 'Cache-Control', issue: 'Conflicting directives' },
  ],
};

export const mockHeadersSuggestApiResponse = {
  suggestions: [
    { header: 'Authorization', value: 'Bearer <token>', reason: 'API requests typically require authentication' },
    { header: 'Accept', value: 'application/json', reason: 'Specify expected response format' },
  ],
};

export const mockHeadersSuggestSecurityResponse = {
  suggestions: [
    { header: 'X-Content-Type-Options', value: 'nosniff', reason: 'Prevent MIME type sniffing' },
    { header: 'X-Frame-Options', value: 'DENY', reason: 'Prevent clickjacking attacks' },
  ],
};

export const mockHeadersExplainResponse = {
  explanation: 'These headers indicate a JSON API request with bearer token authentication and caching disabled',
};

// =============================================================================
// MOCK LLM CLIENT FACTORIES
// =============================================================================

type LLMClientInterface = RequestLLMClientInterface | ResponseLLMClientInterface | HeadersLLMClientInterface;

/**
 * Create a mock LLM client that returns a specific response
 */
export function createMockLLMClient(
  response: object | string
): LLMClientInterface {
  const content = typeof response === 'string' ? response : JSON.stringify(response);

  return {
    chat: mock(
      (_options: { messages: Message[]; systemPrompt?: string } & LLMConfig) => {
        return Promise.resolve({ content });
      }
    ),
  };
}

/**
 * Create a mock LLM client that returns responses based on keywords in the prompt
 */
export function createKeywordMockLLMClient(
  responses: Record<string, object | string>
): LLMClientInterface {
  return {
    chat: mock(
      ({ messages, systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
        // Find matching response based on keywords
        for (const [keyword, response] of Object.entries(responses)) {
          const userMessage = messages.find((m) => m.role === 'user')?.content || '';
          if (
            systemPrompt?.toLowerCase().includes(keyword.toLowerCase()) ||
            userMessage.toLowerCase().includes(keyword.toLowerCase())
          ) {
            const content = typeof response === 'string' ? response : JSON.stringify(response);
            return Promise.resolve({ content });
          }
        }
        // Default response
        return Promise.resolve({ content: '{"error": "No mock response found"}' });
      }
    ),
  };
}

/**
 * Create a mock LLM client that returns sequential responses
 */
export function createSequentialMockLLMClient(
  responses: (object | string)[]
): LLMClientInterface {
  let callIndex = 0;

  return {
    chat: mock(
      (_options: { messages: Message[]; systemPrompt?: string } & LLMConfig) => {
        const response = responses[callIndex] ?? responses[responses.length - 1];
        callIndex++;
        const content = typeof response === 'string' ? response : JSON.stringify(response);
        return Promise.resolve({ content });
      }
    ),
  };
}

/**
 * Create a mock LLM client that throws an error
 */
export function createErrorMockLLMClient(error: Error): LLMClientInterface {
  return {
    chat: mock(
      (_options: { messages: Message[]; systemPrompt?: string } & LLMConfig) => {
        return Promise.reject(error);
      }
    ),
  };
}
