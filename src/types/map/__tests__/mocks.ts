/**
 * Mock utilities for SemanticMap testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GET
// =============================================================================

/** Mock response for semantic get finding a match */
export const mockSemanticGetMatchResponse = {
  matchedKeyIndex: 0,
  confidence: 0.92,
};

/** Mock response for semantic get finding DB_CONNECTION_URL */
export const mockSemanticGetDbConnectionResponse = {
  matchedKeyIndex: 2,
  confidence: 0.95,
};

/** Mock response for semantic get with no match */
export const mockSemanticGetNoMatchResponse = {
  matchedKeyIndex: null,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC HAS
// =============================================================================

/** Mock response for semantic has with match */
export const mockSemanticHasMatchResponse = {
  hasMatch: true,
  matchedKeyIndex: 1,
  confidence: 0.90,
};

/** Mock response for semantic has with no match */
export const mockSemanticHasNoMatchResponse = {
  hasMatch: false,
  matchedKeyIndex: null,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent maps */
export const mockEquivalentMapsResponse = {
  equivalent: true,
  keyMappings: [
    ['userId', 'user_id'],
    ['userName', 'user_name'],
  ],
  confidence: 0.92,
};

/** Mock response for non-equivalent maps */
export const mockNotEquivalentMapsResponse = {
  equivalent: false,
  keyMappings: [],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR FIND KEYS
// =============================================================================

/** Mock response for finding security-related keys */
export const mockFindSecurityKeysResponse = {
  matches: [
    { keyIndex: 0, relevance: 0.95 },
    { keyIndex: 2, relevance: 0.88 },
  ],
  confidence: 0.90,
};

/** Mock response for finding no matching keys */
export const mockFindNoKeysResponse = {
  matches: [],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR FIND VALUES
// =============================================================================

/** Mock response for finding expensive items */
export const mockFindExpensiveValuesResponse = {
  matches: [
    { entryIndex: 1, relevance: 0.95 },
    { entryIndex: 3, relevance: 0.82 },
  ],
  confidence: 0.90,
};

/** Mock response for finding no matching values */
export const mockFindNoValuesResponse = {
  matches: [],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC MERGE
// =============================================================================

/** Mock response for merge with prefer-other */
export const mockMergePreferOtherResponse = {
  mergedEntries: [
    { key: 'userId', value: 'user-456', source: 'other' },
    { key: 'userName', value: 'John', source: 'this' },
    { key: 'email', value: 'new@example.com', source: 'other' },
  ],
  keyMappings: [['userId', 'user_id']],
  confidence: 0.88,
};

/** Mock response for merge with prefer-this */
export const mockMergePreferThisResponse = {
  mergedEntries: [
    { key: 'userId', value: 'user-123', source: 'this' },
    { key: 'userName', value: 'John', source: 'this' },
    { key: 'email', value: 'old@example.com', source: 'this' },
  ],
  keyMappings: [],
  confidence: 0.90,
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
  issues: [
    'Key "api_key" does not follow SCREAMING_SNAKE_CASE convention',
    'Value for "password" contains sensitive data',
  ],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING KEYS
// =============================================================================

/** Mock response with suggestions */
export const mockSuggestMissingKeysResponse = {
  suggestions: [
    { key: 'LOG_LEVEL', reason: 'Common config alongside existing logging keys' },
    { key: 'RETRY_COUNT', reason: 'Typically paired with timeout settings' },
  ],
  confidence: 0.85,
};

/** Mock response with no suggestions */
export const mockNoSuggestionsResponse = {
  suggestions: [],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR GROUP BY
// =============================================================================

/** Mock response for grouping by category */
export const mockGroupByCategoryResponse = {
  groups: {
    database: [0, 1],
    authentication: [2, 3],
    logging: [4],
  },
  confidence: 0.88,
};

/** Mock response for grouping by type */
export const mockGroupByTypeResponse = {
  groups: {
    strings: [0, 2, 4],
    numbers: [1, 3],
  },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for config summary */
export const mockConfigSummaryResponse = {
  summary:
    '12 configuration entries across 3 categories. Database: 4 settings including connection pooling. Auth: 3 OAuth-related settings. Logging: 5 verbosity and format settings.',
  confidence: 0.88,
};

/** Mock response for preferences summary */
export const mockPreferencesSummaryResponse = {
  summary:
    '8 user preferences. Theme: dark mode enabled. Notifications: email and push enabled, SMS disabled. Language: English (US).',
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR INFER PURPOSE
// =============================================================================

/** Mock response for config purpose */
export const mockInferConfigPurposeResponse = {
  purpose: 'configuration',
  subcategory: 'database-settings',
  confidence: 0.92,
};

/** Mock response for user preferences purpose */
export const mockInferPreferencesPurposeResponse = {
  purpose: 'user-preferences',
  subcategory: 'ui-settings',
  confidence: 0.88,
};

/** Mock response for translations purpose */
export const mockInferTranslationsPurposeResponse = {
  purpose: 'translations',
  subcategory: 'ui-strings',
  confidence: 0.95,
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object): LLMClient {
  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.resolve({
        content: JSON.stringify(responseContent),
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
export function createSequentialMockLLMClient(responses: object[]): LLMClient {
  let callIndex = 0;

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      return Promise.resolve({
        content: JSON.stringify(response),
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
 * Create a mock LLM client that fails with an error
 */
export function createFailingMockLLMClient(error: Error): LLMClient {
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
