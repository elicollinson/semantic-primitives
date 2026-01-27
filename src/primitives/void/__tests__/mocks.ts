/**
 * Mock utilities for SemanticVoid testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// ANALYZE SIDE EFFECTS MOCK RESPONSES
// =============================================================================

/** Mock response for analyzeSideEffects - has side effects */
export const mockHasSideEffectsResponse = {
  hasSideEffects: true,
  effects: ['database write', 'logging'],
  pure: false,
};

/** Mock response for analyzeSideEffects - pure function */
export const mockPureFunctionResponse = {
  hasSideEffects: false,
  effects: [],
  pure: true,
};

/** Mock response for analyzeSideEffects - console logging */
export const mockConsoleLoggingResponse = {
  hasSideEffects: true,
  effects: ['console output'],
  pure: false,
};

/** Mock response for analyzeSideEffects - DOM manipulation */
export const mockDomManipulationResponse = {
  hasSideEffects: true,
  effects: ['DOM manipulation', 'element attribute change'],
  pure: false,
};

// =============================================================================
// SHOULD RETURN VALUE MOCK RESPONSES
// =============================================================================

/** Mock response for shouldReturnValue - should return */
export const mockShouldReturnResponse = {
  shouldReturn: true,
  reason: 'Processing functions typically return the processed result',
  suggestedType: 'ProcessedData',
};

/** Mock response for shouldReturnValue - should not return */
export const mockShouldNotReturnResponse = {
  shouldReturn: false,
  reason: 'This function is a pure side-effect handler with no computed value',
};

/** Mock response for shouldReturnValue - should return for status */
export const mockShouldReturnStatusResponse = {
  shouldReturn: true,
  reason: 'Returning a status would enable callers to verify the operation succeeded',
  suggestedType: 'boolean',
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

/** Mock response for explain - side effect function */
export const mockExplainSideEffectResponse = {
  explanation:
    'Sends a notification to the user without returning a result. Side effects: network request, logging.',
};

/** Mock response for explain - event handler */
export const mockExplainEventHandlerResponse = {
  explanation:
    'Handles click events on the button element. Updates internal state and triggers UI refresh.',
};

/** Mock response for explain - logging function */
export const mockExplainLoggingResponse = {
  explanation:
    'Logs a message to the console for debugging purposes. No value is returned.',
};

// =============================================================================
// VALIDATE USAGE MOCK RESPONSES
// =============================================================================

/** Mock response for validateUsage - inappropriate in map */
export const mockInappropriateMapUsageResponse = {
  appropriate: false,
  reason: 'Void functions in map() lose return value, use forEach() instead',
  suggestion: 'Use array.forEach(logError) instead of array.map(logError)',
};

/** Mock response for validateUsage - appropriate in forEach */
export const mockAppropriateForEachUsageResponse = {
  appropriate: true,
  reason: 'forEach is designed for side-effect-only callbacks',
};

/** Mock response for validateUsage - appropriate as event handler */
export const mockAppropriateEventHandlerUsageResponse = {
  appropriate: true,
  reason: 'Event handlers are typically void functions',
};

/** Mock response for validateUsage - inappropriate as promise callback */
export const mockInappropriatePromiseUsageResponse = {
  appropriate: false,
  reason: 'Using void functions in Promise.then() can mask errors',
  suggestion: 'Return the result or use async/await with try-catch',
};

// =============================================================================
// CHECK ERROR HANDLING MOCK RESPONSES
// =============================================================================

/** Mock response for checkErrorHandling - no error handling */
export const mockNoErrorHandlingResponse = {
  hasErrorHandling: false,
  risks: ['Database errors will be silently ignored', 'Network failures unhandled'],
  recommendation: 'Add try-catch or return Promise to propagate errors',
};

/** Mock response for checkErrorHandling - has error handling */
export const mockHasErrorHandlingResponse = {
  hasErrorHandling: true,
  risks: [],
  recommendation: 'Error handling looks adequate for this function',
};

/** Mock response for checkErrorHandling - partial error handling */
export const mockPartialErrorHandlingResponse = {
  hasErrorHandling: true,
  risks: ['Some async operations may still fail silently'],
  recommendation: 'Consider adding error logging for unhandled promise rejections',
};

// =============================================================================
// SUGGEST SIGNATURE MOCK RESPONSES
// =============================================================================

/** Mock response for suggestSignature - add Promise */
export const mockSuggestPromiseSignatureResponse = {
  current: '(user: User) => void',
  suggested: '(user: User) => Promise<void>',
  reason: 'Async operations should return Promise for error handling',
};

/** Mock response for suggestSignature - no change needed */
export const mockSuggestNoChangeResponse = {
  current: '(message: string) => void',
  suggested: '(message: string) => void',
  reason: 'Signature is appropriate for a logging function',
};

/** Mock response for suggestSignature - add return type */
export const mockSuggestReturnTypeResponse = {
  current: '(data: Data) => void',
  suggested: '(data: Data) => boolean',
  reason: 'Returning success status enables callers to handle failures',
};

// =============================================================================
// IS APPROPRIATE FOR MOCK RESPONSES
// =============================================================================

/** Mock response for isAppropriateFor - not appropriate (calculate) */
export const mockNotAppropriateCalculateResponse = {
  appropriate: false,
  reason: "Functions starting with 'calculate' should return a value",
};

/** Mock response for isAppropriateFor - appropriate (log) */
export const mockAppropriateLogResponse = {
  appropriate: true,
  reason: 'Logging functions are typically void',
};

/** Mock response for isAppropriateFor - appropriate (handle) */
export const mockAppropriateHandleResponse = {
  appropriate: true,
  reason: 'Event handlers are typically void functions',
};

/** Mock response for isAppropriateFor - not appropriate (get) */
export const mockNotAppropriateGetResponse = {
  appropriate: false,
  reason: "Functions starting with 'get' should return the requested value",
};

/** Mock response for isAppropriateFor - appropriate (set) */
export const mockAppropriateSetResponse = {
  appropriate: true,
  reason: 'Setter functions typically return void after mutating state',
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
