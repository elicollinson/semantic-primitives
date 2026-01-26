/**
 * Mock utilities for SemanticUnknown testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// INFER TYPE MOCK RESPONSES
// =============================================================================

export const mockInferTypeObject = {
  type: 'object',
  shape: '{ id: number; name: string }',
  confidence: 0.95,
};

export const mockInferTypeArray = {
  type: 'array',
  shape: 'string[]',
  confidence: 0.98,
};

export const mockInferTypePrimitive = {
  type: 'number',
  shape: null,
  confidence: 1.0,
};

// =============================================================================
// SUGGEST TYPES MOCK RESPONSES
// =============================================================================

export const mockSuggestTypesUser = {
  suggestions: [
    { type: 'User', confidence: 0.9, reason: 'Has typical user fields' },
    { type: '{ name: string; email: string }', confidence: 0.85, reason: 'Object shape match' },
  ],
};

export const mockSuggestTypesArray = {
  suggestions: [
    { type: 'number[]', confidence: 0.95, reason: 'Array of numbers' },
    { type: 'Array<number>', confidence: 0.95, reason: 'Same as number[]' },
  ],
};

// =============================================================================
// VALIDATE SHAPE MOCK RESPONSES
// =============================================================================

export const mockValidateShapeMatch = {
  matches: true,
  missingFields: [],
  extraFields: [],
};

export const mockValidateShapePartial = {
  matches: false,
  missingFields: ['email'],
  extraFields: ['age'],
};

export const mockValidateShapeNoMatch = {
  matches: false,
  missingFields: ['id', 'name', 'email'],
  extraFields: [],
};

// =============================================================================
// GENERATE TYPE GUARD MOCK RESPONSES
// =============================================================================

export const mockGenerateTypeGuard = {
  code: `interface User {
  id: number;
  name: string;
}

function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'id' in x && 'name' in x;
}`,
  typeName: 'User',
};

// =============================================================================
// SAFE ACCESS MOCK RESPONSES
// =============================================================================

export const mockSafeAccessFound = {
  found: true,
  path: 'email',
  value: 'test@example.com',
};

export const mockSafeAccessNested = {
  found: true,
  path: 'contact.email',
  value: 'test@example.com',
};

export const mockSafeAccessNotFound = {
  found: false,
  path: null,
  value: null,
};

// =============================================================================
// MATCHES MOCK RESPONSES
// =============================================================================

export const mockMatchesTrue = {
  matches: true,
  confidence: 0.92,
};

export const mockMatchesFalse = {
  matches: false,
  confidence: 0.85,
};

// =============================================================================
// NARROW TO MOCK RESPONSES
// =============================================================================

export const mockNarrowToSuccess = {
  success: true,
  errors: [],
};

export const mockNarrowToFailure = {
  success: false,
  errors: ['Missing required field: email', 'id must be positive'],
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

export const mockExplainUser = {
  explanation:
    'This appears to be a user profile object with personal information including a name and contact details.',
};

export const mockExplainArray = {
  explanation: 'This is an array of numeric values, possibly representing a series of measurements or IDs.',
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
