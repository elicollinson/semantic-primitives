/**
 * Mock utilities for SemanticMap testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GET
// =============================================================================

/** Mock response for matching key */
export const mockSemanticGetMatchResponse = {
  matchedKey: 'userId',
  confidence: 0.92,
};

/** Mock response for no matching key */
export const mockSemanticGetNoMatchResponse = {
  matchedKey: null,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC HAS
// =============================================================================

/** Mock response for has (true) */
export const mockSemanticHasTrueResponse = {
  has: true,
  matchedKey: 'email',
  confidence: 0.90,
};

/** Mock response for has (false) */
export const mockSemanticHasFalseResponse = {
  has: false,
  matchedKey: null,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent maps */
export const mockEquivalentResponse = {
  equivalent: true,
  keyMappings: [['userId', 'user_id'], ['firstName', 'first_name']],
  confidence: 0.90,
};

/** Mock response for non-equivalent maps */
export const mockNotEquivalentResponse = {
  equivalent: false,
  keyMappings: [],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR FIND KEYS
// =============================================================================

/** Mock response for finding security keys */
export const mockFindSecurityKeysResponse = {
  matches: [
    { key: 'API_KEY', relevance: 0.95 },
    { key: 'AUTH_TOKEN', relevance: 0.90 },
  ],
  confidence: 0.88,
};

/** Mock response for no matching keys */
export const mockFindNoKeysResponse = {
  matches: [],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR FIND VALUES
// =============================================================================

/** Mock response for finding expensive items */
export const mockFindExpensiveResponse = {
  matches: [
    { key: 'laptop', relevance: 0.95 },
    { key: 'phone', relevance: 0.88 },
  ],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC MERGE
// =============================================================================

/** Mock response for merge */
export const mockMergeResponse = {
  mergedEntries: [
    ['userId', 123],
    ['email', 'user@example.com'],
    ['firstName', 'John'],
    ['age', 30],
  ],
  keyMappings: [['userId', 'user_id']],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid map */
export const mockValidMapResponse = {
  valid: true,
  issues: [],
  confidence: 0.95,
};

/** Mock response for invalid map */
export const mockInvalidMapResponse = {
  valid: false,
  issues: ['Key "api_key" should be in SCREAMING_SNAKE_CASE', 'Value contains sensitive data'],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING KEYS
// =============================================================================

/** Mock response for missing key suggestions */
export const mockMissingKeysResponse = {
  suggestions: [
    { key: 'LOG_LEVEL', reason: 'Common config alongside existing logging keys' },
    { key: 'TIMEOUT', reason: 'Typically paired with connection settings' },
  ],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR GROUP BY
// =============================================================================

/** Mock response for grouping by category */
export const mockGroupByResponse = {
  groups: {
    database: ['DB_HOST', 'DB_PORT', 'DB_NAME'],
    auth: ['API_KEY', 'AUTH_TOKEN'],
  },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for summary */
export const mockSummaryResponse = {
  summary: '12 configuration settings across 3 categories. Theme: dark, Notifications: enabled, Language: en-US.',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR INFER PURPOSE
// =============================================================================

/** Mock response for config purpose */
export const mockConfigPurposeResponse = {
  purpose: 'configuration',
  subcategory: 'database-settings',
  confidence: 0.92,
};

/** Mock response for user data purpose */
export const mockUserDataPurposeResponse = {
  purpose: 'user-data',
  subcategory: 'profile-information',
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
