/**
 * Mock utilities for SemanticSet testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC HAS
// =============================================================================

/** Mock response when a semantic match exists */
export const mockSemanticHasExistsResponse = {
  exists: true,
  matchedValue: 'red',
  confidence: 0.92,
};

/** Mock response when no semantic match exists */
export const mockSemanticHasNotExistsResponse = {
  exists: false,
  matchedValue: null,
  confidence: 0.95,
};

/** Mock response for abbreviation match */
export const mockSemanticHasAbbreviationResponse = {
  exists: true,
  matchedValue: 'machine learning',
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC ADD
// =============================================================================

/** Mock response when value should be added */
export const mockSemanticAddShouldAddResponse = {
  shouldAdd: true,
  existingEquivalent: null,
  confidence: 0.95,
};

/** Mock response when value should not be added (duplicate) */
export const mockSemanticAddDuplicateResponse = {
  shouldAdd: false,
  existingEquivalent: 'machine learning',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent sets */
export const mockSetsEquivalentResponse = {
  equivalent: true,
  mappings: [
    ['red', 'crimson'],
    ['blue', 'navy'],
  ],
  confidence: 0.90,
};

/** Mock response for non-equivalent sets */
export const mockSetsNotEquivalentResponse = {
  equivalent: false,
  mappings: [],
  confidence: 0.88,
};

/** Mock response for exact match sets */
export const mockSetsExactMatchResponse = {
  equivalent: true,
  mappings: [
    ['JavaScript', 'JavaScript'],
    ['Python', 'Python'],
  ],
  confidence: 0.98,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC INTERSECTION
// =============================================================================

/** Mock response for intersection with matches */
export const mockIntersectionWithMatchesResponse = {
  intersectionIndices: [0, 2],
  mappings: [
    ['JavaScript', 'JS'],
    ['Python', 'Python'],
  ],
  confidence: 0.92,
};

/** Mock response for empty intersection */
export const mockIntersectionEmptyResponse = {
  intersectionIndices: [],
  mappings: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC UNION
// =============================================================================

/** Mock response for union with deduplication */
export const mockUnionWithDeduplicationResponse = {
  unionIndicesSet1: [0, 1, 2],
  unionIndicesSet2: [1],
  duplicateMappings: [['ML', 'machine learning']],
  confidence: 0.91,
};

/** Mock response for union without overlap */
export const mockUnionNoOverlapResponse = {
  unionIndicesSet1: [0, 1],
  unionIndicesSet2: [0, 1],
  duplicateMappings: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC DIFFERENCE
// =============================================================================

/** Mock response for difference with excluded items */
export const mockDifferenceWithExcludedResponse = {
  differenceIndices: [0, 2],
  excludedMappings: [['JS', 'JavaScript']],
  confidence: 0.90,
};

/** Mock response for difference with all items kept */
export const mockDifferenceAllKeptResponse = {
  differenceIndices: [0, 1, 2],
  excludedMappings: [],
  confidence: 0.94,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC FILTER
// =============================================================================

/** Mock response for filtering backend technologies */
export const mockFilterBackendResponse = {
  matchingIndices: [1, 2, 4],
  confidence: 0.93,
};

/** Mock response for empty filter result */
export const mockFilterEmptyResponse = {
  matchingIndices: [],
  confidence: 0.96,
};

/** Mock response for filtering colors */
export const mockFilterColorsResponse = {
  matchingIndices: [0, 1, 2],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR GROUP BY
// =============================================================================

/** Mock response for grouping by technology area */
export const mockGroupByTechAreaResponse = {
  groups: {
    frontend: [0, 3],
    backend: [1, 4],
    database: [2],
  },
  confidence: 0.90,
};

/** Mock response for grouping by color type */
export const mockGroupByColorTypeResponse = {
  groups: {
    primary: [0, 1, 2],
    secondary: [3, 4],
  },
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for skills summary */
export const mockSkillsSummaryResponse = {
  summary: '8 technical skills: 4 programming languages, 2 frameworks, 2 databases. Focus on full-stack development.',
  confidence: 0.89,
};

/** Mock response for colors summary */
export const mockColorsSummaryResponse = {
  summary: '5 colors: 3 primary colors (red, blue, yellow), 2 secondary colors (green, orange).',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST RELATED
// =============================================================================

/** Mock response for suggesting related frameworks */
export const mockSuggestRelatedFrameworksResponse = {
  suggestions: [
    { value: 'Svelte', reason: 'Popular alternative frontend framework' },
    { value: 'SolidJS', reason: 'Rising reactive framework similar to React' },
    { value: 'Preact', reason: 'Lightweight React alternative' },
  ],
  confidence: 0.87,
};

/** Mock response for suggesting related languages */
export const mockSuggestRelatedLanguagesResponse = {
  suggestions: [
    { value: 'TypeScript', reason: 'Commonly paired with JavaScript' },
    { value: 'Go', reason: 'Popular for backend services like Python' },
  ],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid set */
export const mockValidateValidResponse = {
  valid: true,
  issues: [],
  confidence: 0.97,
};

/** Mock response for invalid set */
export const mockValidateInvalidResponse = {
  valid: false,
  issues: [
    { value: 'HelloWorld', problems: ['not lowercase'] },
    { value: 'test@123', problems: ['contains special characters'] },
  ],
  confidence: 0.93,
};

// =============================================================================
// MOCK RESPONSES FOR INFER THEME
// =============================================================================

/** Mock response for programming languages theme */
export const mockInferThemeProgrammingResponse = {
  theme: 'programming languages',
  confidence: 0.94,
};

/** Mock response for colors theme */
export const mockInferThemeColorsResponse = {
  theme: 'colors',
  confidence: 0.96,
};

/** Mock response for days theme */
export const mockInferThemeDaysResponse = {
  theme: 'days of the week',
  confidence: 0.98,
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
