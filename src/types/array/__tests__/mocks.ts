/**
 * Mock utilities for SemanticArray testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent arrays */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.92,
  note: 'Arrays contain semantically equivalent elements',
};

/** Mock response for non-equivalent arrays */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
  note: 'Arrays contain different semantic content',
};

/** Mock response for color equivalence */
export const mockColorEquivalentResponse = {
  equivalent: true,
  confidence: 0.85,
  note: 'Same colors, different shades',
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC FILTER
// =============================================================================

/** Mock response for filtering products under $50 */
export const mockFilterUnder50Response = {
  matchingIndices: [0, 2],
  confidence: 0.95,
};

/** Mock response for filtering active users */
export const mockFilterActiveUsersResponse = {
  matchingIndices: [1, 3, 4],
  confidence: 0.90,
};

/** Mock response for empty filter result */
export const mockFilterEmptyResponse = {
  matchingIndices: [],
  confidence: 0.98,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GROUP
// =============================================================================

/** Mock response for grouping by category */
export const mockGroupByCategoryResponse = {
  groups: {
    electronics: [0, 3],
    clothing: [1, 4],
    food: [2],
  },
  confidence: 0.92,
};

/** Mock response for grouping by sentiment */
export const mockGroupBySentimentResponse = {
  groups: {
    positive: [0, 2],
    negative: [1],
    neutral: [3],
  },
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC SORT
// =============================================================================

/** Mock response for sorting by urgency */
export const mockSortByUrgencyResponse = {
  sortedIndices: [2, 0, 3, 1],
  confidence: 0.90,
};

/** Mock response for sorting by value */
export const mockSortByValueResponse = {
  sortedIndices: [3, 1, 0, 2],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC SEARCH
// =============================================================================

/** Mock response for search with results */
export const mockSearchResultsResponse = {
  results: [
    { index: 2, relevance: 0.95 },
    { index: 0, relevance: 0.78 },
    { index: 4, relevance: 0.62 },
  ],
  confidence: 0.92,
};

/** Mock response for search with no results */
export const mockSearchNoResultsResponse = {
  results: [],
  confidence: 0.98,
};

// =============================================================================
// MOCK RESPONSES FOR DETECT PATTERNS
// =============================================================================

/** Mock response for detected patterns */
export const mockPatternsResponse = {
  patterns: ['weekly cycle', 'increasing trend'],
  anomalies: [{ index: 5, reason: 'unusually high value' }],
  confidence: 0.87,
};

/** Mock response for no patterns */
export const mockNoPatternsResponse = {
  patterns: [],
  anomalies: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for transaction summary */
export const mockTransactionSummaryResponse = {
  summary: '150 transactions totaling $12,450. Mostly food & dining (45%). Peak on weekends.',
  confidence: 0.90,
};

/** Mock response for product summary */
export const mockProductSummaryResponse = {
  summary: '25 products across 5 categories. Average price $45.99. Most items in stock.',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC UNIQUE
// =============================================================================

/** Mock response for unique with duplicates */
export const mockUniqueWithDuplicatesResponse = {
  uniqueIndices: [0, 2, 4],
  duplicateGroups: [
    { keep: 0, remove: [1] },
    { keep: 2, remove: [3] },
  ],
  confidence: 0.92,
};

/** Mock response for all unique */
export const mockAllUniqueResponse = {
  uniqueIndices: [0, 1, 2, 3],
  duplicateGroups: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid array */
export const mockValidArrayResponse = {
  valid: true,
  issues: [],
  confidence: 0.98,
};

/** Mock response for invalid array */
export const mockInvalidArrayResponse = {
  valid: false,
  issues: [
    { index: 2, problems: ['contains unprofessional language'] },
    { index: 5, problems: ['spam-like subject', 'too many exclamation marks'] },
  ],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR ENRICH
// =============================================================================

/** Mock response for sentiment enrichment */
export const mockEnrichSentimentResponse = {
  enrichedValues: [
    { sentiment: 'positive', topics: 'customer service' },
    { sentiment: 'negative', topics: 'pricing' },
    { sentiment: 'neutral', topics: 'product info' },
  ],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR INFER ELEMENT TYPE
// =============================================================================

/** Mock response for user profile type */
export const mockInferUserProfileResponse = {
  type: 'user-profile',
  confidence: 0.92,
  fields: ['name', 'email', 'age'],
};

/** Mock response for product type */
export const mockInferProductResponse = {
  type: 'product',
  confidence: 0.88,
  fields: ['name', 'price', 'category'],
};

/** Mock response for primitive type */
export const mockInferStringArrayResponse = {
  type: 'string',
  confidence: 0.95,
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

/**
 * Create a mock LLM client that fails with an error
 */
export function createFailingMockLLMClient(error: Error): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.reject(error);
  });

  return {
    complete: mockComplete,
    chat: mock(() => Promise.reject(error)),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}
