/**
 * Mock utilities for SemanticRegExp testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR FROM DESCRIPTION
// =============================================================================

/** Mock response for email pattern */
export const mockEmailPatternResponse = {
  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  flags: 'i',
  confidence: 0.92,
};

/** Mock response for phone pattern */
export const mockPhonePatternResponse = {
  pattern: '\\d{3}-\\d{3}-\\d{4}',
  flags: '',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent regexes */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.90,
};

/** Mock response for non-equivalent regexes */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for explanation */
export const mockExplainResponse = {
  explanation: 'Matches a string starting with 3 digits, followed by a hyphen, and ending with 4 digits (e.g., phone number format like 555-1234)',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR TEST WITH EXPLANATION
// =============================================================================

/** Mock response for matching test */
export const mockMatchingTestResponse = {
  matches: true,
  reason: 'The input contains a valid email format with local part, @ symbol, and domain',
  matchedPart: 'test@example.com',
  confidence: 0.95,
};

/** Mock response for non-matching test */
export const mockNonMatchingTestResponse = {
  matches: false,
  reason: 'Missing @ symbol required for email format',
  matchedPart: null,
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST IMPROVEMENTS
// =============================================================================

/** Mock response for improvements */
export const mockImprovementsResponse = {
  suggestions: [
    { suggestion: 'Add start/end anchors', reason: 'Prevent partial matches', improved: '^\\d{3}-\\d{4}$' },
    { suggestion: 'Use named groups', reason: 'Improves readability', improved: '(?<area>\\d{3})-(?<number>\\d{4})' },
  ],
  confidence: 0.85,
};

/** Mock response for no improvements */
export const mockNoImprovementsResponse = {
  suggestions: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE TEST CASES
// =============================================================================

/** Mock response for test cases */
export const mockTestCasesResponse = {
  shouldMatch: ['test@example.com', 'user.name@domain.org', 'a@b.co'],
  shouldNotMatch: ['invalid', '@missing-local.com', 'no-at-sign.com'],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid regex */
export const mockValidRegexResponse = {
  valid: true,
  warnings: [],
  issues: [],
  confidence: 0.95,
};

/** Mock response for regex with issues */
export const mockRegexWithIssuesResponse = {
  valid: true,
  warnings: ['Regex may be slow due to nested quantifiers'],
  issues: [],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR TO READABLE
// =============================================================================

/** Mock response for readable format */
export const mockReadableResponse = {
  readable: 'email: [local-part]@[domain].[tld]',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST RELATED
// =============================================================================

/** Mock response for related patterns */
export const mockRelatedPatternsResponse = {
  suggestions: [
    { pattern: 'phone number', reason: 'Often collected with email', regex: '\\d{3}-\\d{3}-\\d{4}' },
    { pattern: 'URL', reason: 'Common contact information', regex: 'https?://[\\w.-]+' },
  ],
  confidence: 0.82,
};

// =============================================================================
// MOCK RESPONSES FOR INFER DATA TYPE
// =============================================================================

/** Mock response for email type */
export const mockEmailTypeResponse = {
  type: 'email',
  confidence: 0.95,
};

/** Mock response for phone type */
export const mockPhoneTypeResponse = {
  type: 'phone-number',
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR SIMPLIFY
// =============================================================================

/** Mock response for simplifiable regex */
export const mockSimplifyResponse = {
  canSimplify: true,
  simplified: '\\d{3}',
  explanation: 'Use quantifier instead of repetition',
  confidence: 0.90,
};

/** Mock response for non-simplifiable regex */
export const mockCannotSimplifyResponse = {
  canSimplify: false,
  simplified: null,
  explanation: 'Regex is already optimal',
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
