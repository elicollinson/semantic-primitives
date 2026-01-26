/**
 * Mock utilities for SemanticRecord testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent records (currency codes) */
export const mockEquivalentRecordsResponse = {
  equivalent: true,
  keyMappings: {
    US_DOLLAR: 'USD',
    EURO: 'EUR',
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
  reasons: ['not SCREAMING_SNAKE_CASE', 'contains invalid characters'],
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
    { key: 'price1', value: -10, reason: 'Price must be positive' },
    { key: 'price2', value: 999999, reason: 'Price exceeds reasonable limit' },
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
  confidence: 0.92,
};

/** Mock response for translations purpose */
export const mockInferTranslationsPurposeResponse = {
  purpose: 'translations',
  keyType: 'locale-code',
  valueType: 'translated-string',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GET
// =============================================================================

/** Mock response for semantic get finding British Pound */
export const mockSemanticGetGBPResponse = {
  matchedKeyIndex: 2,
  confidence: 0.95,
};

/** Mock response for semantic get finding database setting */
export const mockSemanticGetDbSettingResponse = {
  matchedKeyIndex: 0,
  confidence: 0.92,
};

/** Mock response for semantic get with no match */
export const mockSemanticGetNoMatchResponse = {
  matchedKeyIndex: null,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC FILTER
// =============================================================================

/** Mock response for filtering security settings */
export const mockSemanticFilterSecurityResponse = {
  matchingIndices: [0, 3],
  confidence: 0.90,
};

/** Mock response for filtering with no matches */
export const mockSemanticFilterNoMatchResponse = {
  matchingIndices: [],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING KEYS
// =============================================================================

/** Mock response with currency suggestions */
export const mockSuggestMissingCurrenciesResponse = {
  suggestions: [
    { key: 'GBP', reason: 'Common major currency (British Pound)' },
    { key: 'JPY', reason: 'Major Asian currency (Japanese Yen)' },
  ],
  confidence: 0.85,
};

/** Mock response with config suggestions */
export const mockSuggestMissingConfigResponse = {
  suggestions: [
    { key: 'LOG_LEVEL', reason: 'Common config alongside existing logging keys' },
    { key: 'RETRY_COUNT', reason: 'Typically paired with timeout settings' },
  ],
  confidence: 0.82,
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
    europe: [1, 2],
    asia: [3, 4],
  },
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for exchange rates summary */
export const mockExchangeRatesSummaryResponse = {
  summary:
    '5 currency exchange rates against USD. Includes major currencies: EUR (0.85), GBP (0.73), JPY (149.5). Rates appear current as of recent trading.',
  confidence: 0.90,
};

/** Mock response for config summary */
export const mockConfigSummaryResponse = {
  summary:
    '12 configuration entries across 3 categories. Database: 4 settings including connection pooling. Auth: 3 OAuth-related settings. Logging: 5 verbosity and format settings.',
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
