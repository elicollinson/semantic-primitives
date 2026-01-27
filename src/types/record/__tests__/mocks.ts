/**
 * Mock utilities for SemanticRecord testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GET
// =============================================================================

/** Mock response for semantic get finding USD */
export const mockSemanticGetUsdResponse = {
  matchedKeyIndex: 0,
  confidence: 0.95,
};

/** Mock response for semantic get finding GBP (British Pound) */
export const mockSemanticGetGbpResponse = {
  matchedKeyIndex: 2,
  confidence: 0.92,
};

/** Mock response for semantic get with no match */
export const mockSemanticGetNoMatchResponse = {
  matchedKeyIndex: null,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent records */
export const mockEquivalentRecordsResponse = {
  equivalent: true,
  keyMappings: {
    'US_DOLLAR': 'USD',
    'EURO': 'EUR',
  },
  confidence: 0.92,
};

/** Mock response for non-equivalent records */
export const mockNotEquivalentRecordsResponse = {
  equivalent: false,
  keyMappings: {},
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE KEYS
// =============================================================================

/** Mock response for valid keys */
export const mockValidKeysResponse = {
  valid: true,
  invalidKeys: [],
  reasons: [],
  confidence: 0.95,
};

/** Mock response for invalid keys */
export const mockInvalidKeysResponse = {
  valid: false,
  invalidKeys: ['myKey', 'anotherKey'],
  reasons: ['not SCREAMING_SNAKE_CASE', 'not SCREAMING_SNAKE_CASE'],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE VALUES
// =============================================================================

/** Mock response for valid values */
export const mockValidValuesResponse = {
  valid: true,
  invalidEntries: [],
  confidence: 0.95,
};

/** Mock response for invalid values */
export const mockInvalidValuesResponse = {
  valid: false,
  invalidEntries: [
    { key: 'JPY', value: -5.0, reason: 'negative value is not a valid rate' },
  ],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR INFER PURPOSE
// =============================================================================

/** Mock response for exchange rates purpose */
export const mockInferExchangeRatesPurposeResponse = {
  purpose: 'currency-exchange-rates',
  keyType: 'currency-code',
  valueType: 'exchange-rate',
  confidence: 0.95,
};

/** Mock response for config purpose */
export const mockInferConfigPurposeResponse = {
  purpose: 'configuration',
  keyType: 'setting-name',
  valueType: 'setting-value',
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC FILTER
// =============================================================================

/** Mock response for filtering security-related settings */
export const mockFilterSecurityResponse = {
  matchingIndices: [0, 2],
  confidence: 0.90,
};

/** Mock response for filtering with no matches */
export const mockFilterNoMatchResponse = {
  matchingIndices: [],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING KEYS
// =============================================================================

/** Mock response with suggestions for exchange rates */
export const mockSuggestMissingKeysResponse = {
  suggestions: [
    { key: 'GBP', reason: 'Common major currency missing' },
    { key: 'JPY', reason: 'Major Asian currency typically included' },
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

/** Mock response for grouping currencies by region */
export const mockGroupByRegionResponse = {
  groups: {
    'north-america': [0],
    'europe': [1, 2],
    'asia': [3],
  },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for exchange rates summary */
export const mockExchangeRatesSummaryResponse = {
  summary: '4 currency exchange rates against USD. Strongest: GBP (0.73), Weakest: JPY (149.5). Includes major currencies from Europe and Asia.',
  confidence: 0.90,
};

/** Mock response for config summary */
export const mockConfigSummaryResponse = {
  summary: '5 configuration entries across 3 categories: database (2), authentication (2), and logging (1). All values are properly formatted.',
  confidence: 0.88,
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
