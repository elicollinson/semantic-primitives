/**
 * Mock utilities for SemanticSymbol testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTICALLY EQUALS MOCK RESPONSES
// =============================================================================

/** Mock response for semanticallyEquals - equivalent symbols */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
  note: 'Same concept, different naming convention',
};

/** Mock response for semanticallyEquals - not equivalent symbols */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.9,
  note: 'Different concepts',
};

/** Mock response for semanticallyEquals - same purpose different style */
export const mockSamePurposeResponse = {
  equivalent: true,
  confidence: 0.92,
  note: 'Same semantic purpose: user identifier',
};

// =============================================================================
// SUGGEST BETTER NAME MOCK RESPONSES
// =============================================================================

/** Mock response for suggestBetterName - has suggestion */
export const mockSuggestBetterNameResponse = {
  suggestion: 'userId',
  reason: 'Use camelCase and avoid abbreviations for clarity',
};

/** Mock response for suggestBetterName - no suggestion needed */
export const mockNoSuggestionNeededResponse = {
  suggestion: null,
  reason: 'The name is already clear and follows conventions',
};

/** Mock response for suggestBetterName - single character */
export const mockSingleCharSuggestionResponse = {
  suggestion: null,
  reason: 'Cannot suggest a better name without more context about the symbol\'s purpose',
};

// =============================================================================
// CLASSIFY MOCK RESPONSES
// =============================================================================

/** Mock response for classify - event */
export const mockClassifyEventResponse = {
  category: 'event',
  subcategory: 'lifecycle',
};

/** Mock response for classify - configuration */
export const mockClassifyConfigResponse = {
  category: 'configuration',
  subcategory: 'secrets',
};

/** Mock response for classify - identifier */
export const mockClassifyIdentifierResponse = {
  category: 'identifier',
  subcategory: 'user',
};

/** Mock response for classify - lifecycle */
export const mockClassifyLifecycleResponse = {
  category: 'lifecycle',
  subcategory: 'initialization',
};

/** Mock response for classify - internal */
export const mockClassifyInternalResponse = {
  category: 'internal',
  subcategory: null,
};

/** Mock response for classify - unknown */
export const mockClassifyUnknownResponse = {
  category: 'unknown',
  subcategory: null,
};

// =============================================================================
// VALIDATE MOCK RESPONSES
// =============================================================================

/** Mock response for validate - valid */
export const mockValidResponse = {
  valid: true,
  warnings: [],
};

/** Mock response for validate - valid with warnings */
export const mockValidWithWarningsResponse = {
  valid: true,
  warnings: ['Underscore prefix suggests private; consider using # for true privacy'],
};

/** Mock response for validate - invalid */
export const mockInvalidResponse = {
  valid: false,
  warnings: ['Name is too short', 'Avoid single character names'],
};

/** Mock response for validate - abbreviation warning */
export const mockAbbreviationWarningResponse = {
  valid: true,
  warnings: ['Avoid abbreviations like "usr" - use "user" instead'],
};

// =============================================================================
// DESCRIBE PURPOSE MOCK RESPONSES
// =============================================================================

/** Mock response for describePurpose - cache key */
export const mockDescribePurposeCacheKeyResponse = {
  purpose: 'Unique identifier for cache entries, used to store and retrieve cached data',
};

/** Mock response for describePurpose - auth token */
export const mockDescribePurposeAuthTokenResponse = {
  purpose: 'Authentication token for verifying user identity in secure operations',
};

/** Mock response for describePurpose - event handler */
export const mockDescribePurposeEventResponse = {
  purpose: 'Event handler triggered when a user logs into the application',
};

// =============================================================================
// IS APPROPRIATE FOR MOCK RESPONSES
// =============================================================================

/** Mock response for isAppropriateFor - appropriate */
export const mockAppropriateResponse = {
  appropriate: true,
  reason: 'The symbol is well-suited for this use case',
};

/** Mock response for isAppropriateFor - not appropriate */
export const mockNotAppropriateResponse = {
  appropriate: false,
  reason: 'Temporary identifiers should not be used as permanent database keys',
};

/** Mock response for isAppropriateFor - config use case */
export const mockAppropriateForConfigResponse = {
  appropriate: true,
  reason: 'API keys are appropriate for configuration secrets',
};

// =============================================================================
// MOCK CLIENT CREATORS
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
