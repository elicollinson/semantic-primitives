/**
 * Mock utilities for SemanticNull testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTICALLY EQUALS MOCK RESPONSES
// =============================================================================

/** Mock response for semanticallyEquals - equivalent reasons */
export const mockEquivalentReasonsResponse = {
  equivalent: true,
  confidence: 0.85,
};

/** Mock response for semanticallyEquals - not equivalent reasons */
export const mockNotEquivalentReasonsResponse = {
  equivalent: false,
  confidence: 0.9,
};

/** Mock response for semanticallyEquals - similar reasons */
export const mockSimilarReasonsResponse = {
  equivalent: true,
  confidence: 0.75,
};

// =============================================================================
// INFER REASON MOCK RESPONSES
// =============================================================================

/** Mock response for inferReason - not-set type */
export const mockInferReasonNotSetResponse = {
  reason: 'User has not provided this value yet',
  type: 'not-set',
};

/** Mock response for inferReason - not-applicable type */
export const mockInferReasonNotApplicableResponse = {
  reason: 'Record has not been deleted',
  type: 'not-applicable',
};

/** Mock response for inferReason - unknown type */
export const mockInferReasonUnknownResponse = {
  reason: 'Unable to determine why this field is null',
  type: 'unknown',
};

// =============================================================================
// SUGGEST DEFAULT MOCK RESPONSES
// =============================================================================

/** Mock response for suggestDefault - null default (sensitive field) */
export const mockSuggestDefaultNullResponse = {
  default: null,
  explanation: 'Phone numbers should not have a default; require user input',
};

/** Mock response for suggestDefault - numeric default */
export const mockSuggestDefaultNumberResponse = {
  default: 0,
  explanation: 'Retry count should start at 0',
};

/** Mock response for suggestDefault - string default */
export const mockSuggestDefaultStringResponse = {
  default: '',
  explanation: 'Empty string is appropriate for optional text fields',
};

/** Mock response for suggestDefault - boolean default */
export const mockSuggestDefaultBooleanResponse = {
  default: false,
  explanation: 'Disabled by default for security',
};

// =============================================================================
// IS APPROPRIATE MOCK RESPONSES
// =============================================================================

/** Mock response for isAppropriate - not appropriate (required field) */
export const mockNotAppropriateRequiredResponse = {
  appropriate: false,
  reason: 'Email is a required field',
};

/** Mock response for isAppropriate - appropriate (optional field) */
export const mockAppropriateOptionalResponse = {
  appropriate: true,
  reason: 'Middle name is optional and can be null',
};

/** Mock response for isAppropriate - appropriate (contextual) */
export const mockAppropriateContextualResponse = {
  appropriate: true,
  reason: 'This field only applies when status is active',
};

// =============================================================================
// CLASSIFY MOCK RESPONSES
// =============================================================================

/** Mock response for classify - not-set type */
export const mockClassifyNotSetResponse = {
  type: 'not-set',
  canBeProvided: true,
};

/** Mock response for classify - not-applicable type */
export const mockClassifyNotApplicableResponse = {
  type: 'not-applicable',
  canBeProvided: false,
};

/** Mock response for classify - unknown type */
export const mockClassifyUnknownResponse = {
  type: 'unknown',
  canBeProvided: true,
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

/** Mock response for explain - with reason */
export const mockExplainWithReasonResponse = {
  explanation: 'Middle name was not provided by the user',
};

/** Mock response for explain - without reason */
export const mockExplainWithoutReasonResponse = {
  explanation: 'The phone number field has not been set',
};

/** Mock response for explain - not applicable */
export const mockExplainNotApplicableResponse = {
  explanation: 'Spouse name does not apply to single individuals',
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(
  responseContent: object
): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.resolve({
      content: JSON.stringify(responseContent),
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
  });

  return {
    complete: mockComplete,
    chat: mock(() => Promise.resolve({
      content: '',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    })),
    withProvider: mock(function(this: LLMClient) { return this; }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(
  responses: object[]
): LLMClient {
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
    chat: mock(() => Promise.resolve({
      content: '',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    })),
    withProvider: mock(function(this: LLMClient) { return this; }),
  } as unknown as LLMClient;
}
