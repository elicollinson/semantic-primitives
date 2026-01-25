/**
 * Mock utilities for SemanticRegExp testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR FROM (CREATE FROM NATURAL LANGUAGE)
// =============================================================================

/** Mock response for creating email regex */
export const mockFromEmailResponse = {
  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  flags: 'i',
  confidence: 0.92,
  notes: 'Standard email validation pattern',
};

/** Mock response for creating phone regex */
export const mockFromPhoneResponse = {
  pattern: '\\d{3}-\\d{3}-\\d{4}',
  flags: '',
  confidence: 0.88,
  notes: 'US phone number format (XXX-XXX-XXXX)',
};

/** Mock response for creating URL regex */
export const mockFromUrlResponse = {
  pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)?',
  flags: 'i',
  confidence: 0.85,
  notes: 'Basic URL pattern',
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent regexes */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
  differences: [],
  note: 'Both patterns match the same set of strings',
};

/** Mock response for non-equivalent regexes */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
  differences: ['Pattern 1 allows uppercase, Pattern 2 does not'],
  note: 'Patterns have different case sensitivity',
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for explaining email regex */
export const mockExplainEmailResponse = {
  explanation:
    'Matches email addresses with a local part, @ symbol, domain name, and top-level domain (e.g., user@example.com)',
  examples: ['test@example.com', 'user.name@domain.org', 'info@company.co.uk'],
  components: [
    { part: '[a-zA-Z0-9._%+-]+', meaning: 'Local part (username)' },
    { part: '@', meaning: 'At symbol separator' },
    { part: '[a-zA-Z0-9.-]+', meaning: 'Domain name' },
    { part: '\\.[a-zA-Z]{2,}', meaning: 'Top-level domain' },
  ],
};

/** Mock response for explaining digit regex */
export const mockExplainDigitsResponse = {
  explanation: 'Matches exactly 3 digits followed by a hyphen and 4 digits',
  examples: ['123-4567', '999-0000', '555-1234'],
  components: [
    { part: '\\d{3}', meaning: 'Three digits' },
    { part: '-', meaning: 'Hyphen separator' },
    { part: '\\d{4}', meaning: 'Four digits' },
  ],
};

// =============================================================================
// MOCK RESPONSES FOR TEST WITH EXPLANATION
// =============================================================================

/** Mock response for matching test */
export const mockTestMatchesResponse = {
  matches: true,
  reason: 'The input contains all required components in the correct format',
  matchedPart: 'test@example.com',
};

/** Mock response for non-matching test */
export const mockTestNotMatchesResponse = {
  matches: false,
  reason: 'Missing @ symbol required for email format',
};

/** Mock response for partial match */
export const mockTestPartialMatchResponse = {
  matches: true,
  reason: 'The pattern found a match within the input string',
  matchedPart: '123-4567',
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST IMPROVEMENTS
// =============================================================================

/** Mock response for improvements */
export const mockImprovementsResponse = {
  suggestions: [
    {
      suggestion: 'Add start/end anchors',
      reason: 'Prevent partial matches within larger strings',
      improved: '^\\d{3}-\\d{4}$',
    },
    {
      suggestion: 'Use non-capturing group',
      reason: 'Slight performance improvement',
      improved: '(?:\\d{3})-(?:\\d{4})',
    },
  ],
  confidence: 0.87,
};

/** Mock response for no improvements needed */
export const mockNoImprovementsResponse = {
  suggestions: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE TEST CASES
// =============================================================================

/** Mock response for email test cases */
export const mockTestCasesEmailResponse = {
  shouldMatch: ['test@example.com', 'user.name@domain.org', 'info+tag@company.co'],
  shouldNotMatch: ['invalid', '@missing-local.com', 'no-at-sign.com', 'spaces in@email.com'],
  confidence: 0.92,
};

/** Mock response for phone test cases */
export const mockTestCasesPhoneResponse = {
  shouldMatch: ['123-456-7890', '555-123-4567', '000-000-0000'],
  shouldNotMatch: ['1234567890', '12-3456-7890', 'abc-def-ghij', '123-45-6789'],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid regex */
export const mockValidResponse = {
  valid: true,
  issues: [],
  warnings: [],
  confidence: 0.98,
};

/** Mock response for regex with warnings */
export const mockValidWithWarningsResponse = {
  valid: true,
  issues: [],
  warnings: ['Regex may be slow due to nested quantifiers', 'Consider adding anchors'],
  confidence: 0.85,
};

/** Mock response for invalid regex */
export const mockInvalidResponse = {
  valid: false,
  issues: ['Unbalanced parentheses', 'Invalid escape sequence'],
  warnings: [],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR TO READABLE
// =============================================================================

/** Mock response for readable email format */
export const mockReadableEmailResponse = {
  readable: 'email: [local-part]@[domain].[tld]',
  breakdown: [
    'Start with letters, numbers, or special chars (._%+-)',
    'Followed by @ symbol',
    'Domain name with letters, numbers, dots, or hyphens',
    'Ends with a dot and 2+ letter TLD',
  ],
  confidence: 0.90,
};

/** Mock response for readable phone format */
export const mockReadablePhoneResponse = {
  readable: 'phone: XXX-XXX-XXXX',
  breakdown: [
    'Three digits for area code',
    'Hyphen separator',
    'Three digits for exchange',
    'Hyphen separator',
    'Four digits for subscriber number',
  ],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST RELATED
// =============================================================================

/** Mock response for email related patterns */
export const mockRelatedEmailResponse = {
  related: [
    {
      pattern: 'phone number',
      reason: 'Often collected with email for contact information',
      regex: '\\d{3}-\\d{3}-\\d{4}',
    },
    {
      pattern: 'name',
      reason: 'Commonly paired with email for user registration',
    },
  ],
  confidence: 0.85,
};

/** Mock response for no related patterns */
export const mockNoRelatedResponse = {
  related: [],
  confidence: 0.70,
};

// =============================================================================
// MOCK RESPONSES FOR INFER DATA TYPE
// =============================================================================

/** Mock response for email data type */
export const mockInferEmailTypeResponse = {
  type: 'email',
  confidence: 0.95,
  category: 'contact-information',
};

/** Mock response for phone data type */
export const mockInferPhoneTypeResponse = {
  type: 'phone-us',
  confidence: 0.92,
  category: 'contact-information',
};

/** Mock response for UUID data type */
export const mockInferUuidTypeResponse = {
  type: 'uuid',
  confidence: 0.98,
  category: 'identifier',
};

/** Mock response for custom/unknown data type */
export const mockInferCustomTypeResponse = {
  type: 'custom-identifier',
  confidence: 0.65,
  category: 'identifier',
};

// =============================================================================
// MOCK RESPONSES FOR SIMPLIFY
// =============================================================================

/** Mock response for simplifiable regex */
export const mockSimplifyResponse = {
  canSimplify: true,
  simplified: '\\d{3}',
  simplifiedFlags: '',
  explanation: 'Use quantifier instead of repetition',
  confidence: 0.95,
};

/** Mock response for already simple regex */
export const mockCannotSimplifyResponse = {
  canSimplify: false,
  explanation: 'The regex is already in its simplest form',
  confidence: 0.90,
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
