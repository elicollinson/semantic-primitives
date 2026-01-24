/**
 * Mock utilities for SemanticBoolean testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

/** Mock response for "from" method - affirmative */
export const mockFromAffirmativeResponse = {
  value: true,
  confidence: 0.95,
  category: 'affirmative',
  conditions: [],
};

/** Mock response for "from" method - negative */
export const mockFromNegativeResponse = {
  value: false,
  confidence: 0.92,
  category: 'negative',
  conditions: [],
};

/** Mock response for "from" method - uncertain */
export const mockFromUncertainResponse = {
  value: true,
  confidence: 0.55,
  category: 'uncertain',
  conditions: [],
};

/** Mock response for "from" method - conditional */
export const mockFromConditionalResponse = {
  value: true,
  confidence: 0.88,
  category: 'conditional',
  conditions: ['deliver by Friday'],
};

/** Mock response for "from" method - conditional without pre-parsed conditions */
export const mockFromConditionalNoParsedConditionsResponse = {
  value: true,
  confidence: 0.88,
  category: 'conditional',
  conditions: [],
};

/** Mock response for "fromImplication" method - positive */
export const mockImplicationPositiveResponse = {
  value: true,
  confidence: 0.9,
};

/** Mock response for "fromImplication" method - negative */
export const mockImplicationNegativeResponse = {
  value: false,
  confidence: 0.85,
};

/** Mock response for "semanticallyEquals" method - equivalent */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
};

/** Mock response for "semanticallyEquals" method - not equivalent */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
};

/** Mock response for "compareStrength" method */
export const mockCompareStrengthWeakerResponse = {
  strengthDifference: -0.6,
};

export const mockCompareStrengthStrongerResponse = {
  strengthDifference: 0.7,
};

export const mockCompareStrengthEqualResponse = {
  strengthDifference: 0,
};

/** Mock response for "extractConditions" method */
export const mockExtractConditionsResponse = {
  isConditional: true,
  conditions: ['deliver by Friday', 'price is reasonable'],
};

export const mockNoConditionsResponse = {
  isConditional: false,
  conditions: [],
};

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
 * Create a mock LLM client that returns different responses based on prompt content
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
