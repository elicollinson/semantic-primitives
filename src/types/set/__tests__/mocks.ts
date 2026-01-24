/**
 * Mock utilities for SemanticSet testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC HAS
// =============================================================================

/** Mock response for semantic has (true) */
export const mockSemanticHasTrueResponse = {
  has: true,
  matchedValue: 'red',
  confidence: 0.92,
};

/** Mock response for semantic has (false) */
export const mockSemanticHasFalseResponse = {
  has: false,
  matchedValue: null,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC ADD
// =============================================================================

/** Mock response for should add (true) */
export const mockShouldAddResponse = {
  shouldAdd: true,
  existingEquivalent: null,
  confidence: 0.90,
};

/** Mock response for should not add (false) */
export const mockShouldNotAddResponse = {
  shouldAdd: false,
  existingEquivalent: 'machine learning',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent sets */
export const mockEquivalentResponse = {
  equivalent: true,
  mappings: [['red', 'crimson'], ['blue', 'azure']],
  confidence: 0.90,
};

/** Mock response for non-equivalent sets */
export const mockNotEquivalentResponse = {
  equivalent: false,
  mappings: [],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC INTERSECTION
// =============================================================================

/** Mock response for intersection */
export const mockIntersectionResponse = {
  intersection: ['JavaScript', 'Python'],
  mappings: [['JavaScript', 'JS'], ['Python', 'Python']],
  confidence: 0.90,
};

/** Mock response for empty intersection */
export const mockEmptyIntersectionResponse = {
  intersection: [],
  mappings: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC UNION
// =============================================================================

/** Mock response for union */
export const mockUnionResponse = {
  union: ['JavaScript', 'Python', 'TypeScript', 'Ruby'],
  duplicates: [['JavaScript', 'JS']],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC DIFFERENCE
// =============================================================================

/** Mock response for difference */
export const mockDifferenceResponse = {
  difference: ['TypeScript', 'Ruby'],
  removed: ['JavaScript'],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC FILTER
// =============================================================================

/** Mock response for filter */
export const mockFilterResponse = {
  matchingValues: ['Node.js', 'PostgreSQL', 'Redis'],
  confidence: 0.90,
};

/** Mock response for empty filter */
export const mockEmptyFilterResponse = {
  matchingValues: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR GROUP BY
// =============================================================================

/** Mock response for group by */
export const mockGroupByResponse = {
  groups: {
    frontend: ['React', 'Vue', 'Angular'],
    backend: ['Node.js', 'Python', 'Go'],
  },
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for summary */
export const mockSummaryResponse = {
  summary: '15 programming skills: 8 backend, 5 frontend, 2 database technologies.',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST RELATED
// =============================================================================

/** Mock response for related suggestions */
export const mockSuggestRelatedResponse = {
  suggestions: [
    { value: 'TypeScript', reason: 'Commonly paired with JavaScript' },
    { value: 'Docker', reason: 'Popular with Node.js developers' },
  ],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid set */
export const mockValidSetResponse = {
  valid: true,
  issues: [],
  confidence: 0.95,
};

/** Mock response for invalid set */
export const mockInvalidSetResponse = {
  valid: false,
  issues: [
    { value: 'ABC', problems: ['should be lowercase'] },
    { value: 'test!', problems: ['no special characters allowed'] },
  ],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR INFER THEME
// =============================================================================

/** Mock response for programming theme */
export const mockProgrammingThemeResponse = {
  theme: 'programming languages',
  confidence: 0.92,
};

/** Mock response for colors theme */
export const mockColorsThemeResponse = {
  theme: 'colors',
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
