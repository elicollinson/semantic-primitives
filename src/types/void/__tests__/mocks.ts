/**
 * Mock utilities for SemanticVoid testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// ANALYZE SIDE EFFECTS MOCK RESPONSES
// =============================================================================

export const mockSideEffectsWithEffects = {
  hasSideEffects: true,
  effects: ['database write', 'logging'],
  pure: false,
};

export const mockSideEffectsPure = {
  hasSideEffects: false,
  effects: [],
  pure: true,
};

// =============================================================================
// SHOULD RETURN VALUE MOCK RESPONSES
// =============================================================================

export const mockShouldReturnTrue = {
  shouldReturn: true,
  reason: 'Processing functions typically return the processed result',
  suggestedType: 'ProcessedData',
};

export const mockShouldReturnFalse = {
  shouldReturn: false,
  reason: 'Logging functions should not return a value',
  suggestedType: null,
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

export const mockExplainSendNotification = {
  explanation:
    'Sends a notification to the user without returning a result. Side effects: network request, logging.',
};

// =============================================================================
// VALIDATE USAGE MOCK RESPONSES
// =============================================================================

export const mockValidateUsageInappropriate = {
  appropriate: false,
  reason: "Void functions in map() lose return value, use forEach() instead",
  suggestion: 'Use array.forEach(logError) instead of array.map(logError)',
};

export const mockValidateUsageAppropriate = {
  appropriate: true,
  reason: 'Event handlers are appropriate to be void',
  suggestion: null,
};

// =============================================================================
// CHECK ERROR HANDLING MOCK RESPONSES
// =============================================================================

export const mockErrorHandlingMissing = {
  hasErrorHandling: false,
  risks: ['Database errors will be silently ignored'],
  recommendation: 'Add try-catch or return Promise to propagate errors',
};

export const mockErrorHandlingPresent = {
  hasErrorHandling: true,
  risks: [],
  recommendation: 'Error handling looks appropriate',
};

// =============================================================================
// SUGGEST SIGNATURE MOCK RESPONSES
// =============================================================================

export const mockSuggestSignatureAsync = {
  current: '(user: User) => void',
  suggested: '(user: User) => Promise<void>',
  reason: 'Async operations should return Promise for error handling',
};

// =============================================================================
// APPROPRIATE PATTERNS MOCK RESPONSES
// =============================================================================

export const mockAppropriatePatterns = {
  patterns: [
    'event handlers',
    'cleanup functions',
    'logging',
    'side-effect-only callbacks',
  ],
};

// =============================================================================
// IS APPROPRIATE FOR MOCK RESPONSES
// =============================================================================

export const mockIsAppropriateForVoid = {
  appropriate: true,
  reason: 'Logging functions are typically void',
};

export const mockIsNotAppropriateForVoid = {
  appropriate: false,
  reason: "Functions starting with 'calculate' should return a value",
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
