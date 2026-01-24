/**
 * Mock utilities for SemanticUndefined testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// SEMANTICALLY EQUALS MOCK RESPONSES
// =============================================================================

/** Mock response for semanticallyEquals - equivalent contexts */
export const mockEquivalentContextsResponse = {
  equivalent: true,
  confidence: 0.9,
};

/** Mock response for semanticallyEquals - not equivalent contexts */
export const mockNotEquivalentContextsResponse = {
  equivalent: false,
  confidence: 0.85,
};

/** Mock response for semanticallyEquals - similar contexts */
export const mockSimilarContextsResponse = {
  equivalent: true,
  confidence: 0.75,
};

// =============================================================================
// INFER REASON MOCK RESPONSES
// =============================================================================

/** Mock response for inferReason - not-initialized type */
export const mockInferReasonNotInitializedResponse = {
  reason: 'Variable declared but not assigned a value',
  type: 'not-initialized',
};

/** Mock response for inferReason - optional-unset type */
export const mockInferReasonOptionalUnsetResponse = {
  reason: 'Optional property not set',
  type: 'optional-unset',
};

/** Mock response for inferReason - property-missing type */
export const mockInferReasonPropertyMissingResponse = {
  reason: 'Property does not exist on the object',
  type: 'property-missing',
};

/** Mock response for inferReason - void-return type */
export const mockInferReasonVoidReturnResponse = {
  reason: 'Function does not return a value',
  type: 'void-return',
};

/** Mock response for inferReason - unknown type */
export const mockInferReasonUnknownResponse = {
  reason: 'Unable to determine why this value is undefined',
  type: 'unknown',
};

// =============================================================================
// SUGGEST INITIALIZATION MOCK RESPONSES
// =============================================================================

/** Mock response for suggestInitialization - empty array */
export const mockSuggestInitArrayResponse = {
  value: [],
  explanation: 'Arrays should be initialized empty, not undefined',
};

/** Mock response for suggestInitialization - empty object */
export const mockSuggestInitObjectResponse = {
  value: {},
  explanation: 'Objects should be initialized empty',
};

/** Mock response for suggestInitialization - zero number */
export const mockSuggestInitNumberResponse = {
  value: 0,
  explanation: 'Count should start at 0',
};

/** Mock response for suggestInitialization - empty string */
export const mockSuggestInitStringResponse = {
  value: '',
  explanation: 'Empty string is appropriate for optional text fields',
};

/** Mock response for suggestInitialization - boolean false */
export const mockSuggestInitBooleanResponse = {
  value: false,
  explanation: 'Default to false for safety',
};

/** Mock response for suggestInitialization - null (sensitive field) */
export const mockSuggestInitNullResponse = {
  value: null,
  explanation: 'Sensitive fields should not have a default; require explicit input',
};

// =============================================================================
// IS ACCEPTABLE MOCK RESPONSES
// =============================================================================

/** Mock response for isAcceptable - acceptable (optional) */
export const mockAcceptableOptionalResponse = {
  acceptable: true,
  reason: 'Undefined is acceptable for optional parameters',
};

/** Mock response for isAcceptable - not acceptable (return value) */
export const mockNotAcceptableReturnResponse = {
  acceptable: false,
  reason: 'Function should return null for not found, not undefined',
};

/** Mock response for isAcceptable - not acceptable (required) */
export const mockNotAcceptableRequiredResponse = {
  acceptable: false,
  reason: 'This field is required and should not be undefined',
};

/** Mock response for isAcceptable - acceptable (destructuring) */
export const mockAcceptableDestructuringResponse = {
  acceptable: true,
  reason: 'Undefined is expected when destructuring optional properties',
};

// =============================================================================
// COMPARE TO NULL MOCK RESPONSES
// =============================================================================

/** Mock response for compareToNull - recommend null */
export const mockCompareRecommendNullResponse = {
  recommendation: 'null',
  explanation: 'Use null for intentional absence (not deleted), undefined implies uninitialized',
};

/** Mock response for compareToNull - recommend undefined */
export const mockCompareRecommendUndefinedResponse = {
  recommendation: 'undefined',
  explanation: 'Optional parameters should use undefined when not provided',
};

/** Mock response for compareToNull - recommend null for database */
export const mockCompareRecommendNullDbResponse = {
  recommendation: 'null',
  explanation: 'Database fields should use null to represent no value',
};

// =============================================================================
// CLASSIFY MOCK RESPONSES
// =============================================================================

/** Mock response for classify - not-initialized type */
export const mockClassifyNotInitializedResponse = {
  type: 'not-initialized',
  canBeInitialized: true,
};

/** Mock response for classify - optional-unset type */
export const mockClassifyOptionalUnsetResponse = {
  type: 'optional-unset',
  canBeInitialized: true,
};

/** Mock response for classify - property-missing type */
export const mockClassifyPropertyMissingResponse = {
  type: 'property-missing',
  canBeInitialized: true,
};

/** Mock response for classify - void-return type */
export const mockClassifyVoidReturnResponse = {
  type: 'void-return',
  canBeInitialized: false,
};

/** Mock response for classify - unknown type */
export const mockClassifyUnknownResponse = {
  type: 'unknown',
  canBeInitialized: true,
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

/** Mock response for explain - with context */
export const mockExplainWithContextResponse = {
  explanation: 'The nickname property was not included in the API response',
};

/** Mock response for explain - without context */
export const mockExplainWithoutContextResponse = {
  explanation: 'This value has not been initialized',
};

/** Mock response for explain - optional property */
export const mockExplainOptionalResponse = {
  explanation: 'The avatar property is optional and has not been set by the user',
};

/** Mock response for explain - missing property */
export const mockExplainMissingPropertyResponse = {
  explanation: 'The property does not exist on this object',
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
