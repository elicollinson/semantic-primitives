/**
 * Mock utilities for SemanticURL testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR FROM INPUT
// =============================================================================

/** Mock response for URL parsing */
export const mockParseResponse = {
  url: 'https://example.com',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent URLs */
export const mockEquivalentResponse = {
  equivalent: true,
  differences: ['www prefix', 'trailing slash'],
  confidence: 0.90,
};

/** Mock response for non-equivalent URLs */
export const mockNotEquivalentResponse = {
  equivalent: false,
  differences: ['different hostnames', 'different paths'],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR CLASSIFY
// =============================================================================

/** Mock response for API endpoint classification */
export const mockApiClassifyResponse = {
  type: 'api-endpoint',
  category: 'rest-api',
  resource: 'users',
  action: 'list',
  confidence: 0.90,
};

/** Mock response for webpage classification */
export const mockWebpageClassifyResponse = {
  type: 'webpage',
  category: 'blog-post',
  resource: null,
  action: null,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE FOR
// =============================================================================

/** Mock response for valid URL */
export const mockValidForResponse = {
  valid: true,
  reason: null,
  warnings: [],
  confidence: 0.95,
};

/** Mock response for invalid URL */
export const mockInvalidForResponse = {
  valid: false,
  reason: 'Missing API path prefix',
  warnings: ['Uses HTTP instead of HTTPS'],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for explanation */
export const mockExplainResponse = {
  explanation: 'GitHub API endpoint to fetch the user profile for "octocat"',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR EXTRACT INFO
// =============================================================================

/** Mock response for extracted info */
export const mockExtractInfoResponse = {
  info: {
    service: 'GitHub',
    resourceType: 'user-profile',
    identifier: 'octocat',
  },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR IS SAFE
// =============================================================================

/** Mock response for safe URL */
export const mockSafeResponse = {
  safe: true,
  reason: null,
  severity: null,
  confidence: 0.95,
};

/** Mock response for unsafe URL */
export const mockUnsafeResponse = {
  safe: false,
  reason: 'Known phishing domain',
  severity: 'high',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR CANONICAL
// =============================================================================

/** Mock response for canonical URL */
export const mockCanonicalResponse = {
  canonical: 'https://example.com/path',
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR VARIATIONS
// =============================================================================

/** Mock response for URL variations */
export const mockVariationsResponse = {
  variations: [
    'https://example.com',
    'https://www.example.com',
    'http://example.com',
  ],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR PARSE QUERY
// =============================================================================

/** Mock response for parsed query */
export const mockParseQueryResponse = {
  parameters: {
    q: { value: 'test', meaning: 'search query' },
    limit: { value: '10', meaning: 'results limit' },
  },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST RELATED
// =============================================================================

/** Mock response for related URLs */
export const mockSuggestRelatedResponse = {
  suggestions: [
    { url: '/users/octocat/repos', reason: "User's repositories" },
    { url: '/users/octocat/followers', reason: "User's followers" },
  ],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR MATCHES
// =============================================================================

/** Mock response for matches (true) */
export const mockMatchesTrueResponse = {
  matches: true,
  confidence: 0.92,
};

/** Mock response for matches (false) */
export const mockMatchesFalseResponse = {
  matches: false,
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
