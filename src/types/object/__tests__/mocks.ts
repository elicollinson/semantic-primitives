/**
 * Mock utilities for SemanticObject testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GET
// =============================================================================

/** Mock response for matching key */
export const mockSemanticGetMatchResponse = {
  matchedKey: 'emailAddress',
  confidence: 0.92,
};

/** Mock response for no match */
export const mockSemanticGetNoMatchResponse = {
  matchedKey: null,
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent objects */
export const mockEquivalentResponse = {
  equivalent: true,
  mappings: { firstName: 'first_name', lastName: 'last_name' },
  confidence: 0.90,
};

/** Mock response for non-equivalent objects */
export const mockNotEquivalentResponse = {
  equivalent: false,
  mappings: {},
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid object */
export const mockValidObjectResponse = {
  valid: true,
  issues: [],
  confidence: 0.95,
};

/** Mock response for invalid object */
export const mockInvalidObjectResponse = {
  valid: false,
  issues: [
    { field: 'email', problem: 'invalid email format' },
    { field: 'age', problem: 'unreasonable value for human age' },
  ],
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR INFER SCHEMA
// =============================================================================

/** Mock response for user profile schema */
export const mockUserSchemaResponse = {
  type: 'user-profile',
  fields: {
    id: { type: 'number', purpose: 'unique identifier', format: null },
    email: { type: 'string', purpose: 'contact email', format: 'email' },
    name: { type: 'string', purpose: 'display name', format: null },
  },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR TRANSFORM KEYS
// =============================================================================

/** Mock response for camelCase transformation */
export const mockCamelCaseResponse = {
  transformed: { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
  confidence: 0.95,
};

/** Mock response for snake_case transformation */
export const mockSnakeCaseResponse = {
  transformed: { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC MERGE
// =============================================================================

/** Mock response for merge */
export const mockMergeResponse = {
  merged: { id: 1, name: 'John', email: 'john@example.com', age: 30 },
  mappings: { userName: 'name' },
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR PICK
// =============================================================================

/** Mock response for pick */
export const mockPickResponse = {
  picked: { email: 'john@example.com', phone: '555-1234' },
  mappings: { 'contact information': 'email' },
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING FIELDS
// =============================================================================

/** Mock response for missing fields */
export const mockMissingFieldsResponse = {
  suggestions: [
    { field: 'phoneNumber', reason: 'Common in user profiles' },
    { field: 'address', reason: 'Often needed for contact information' },
  ],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for summary */
export const mockSummaryResponse = {
  summary: 'User profile for John Doe (john@example.com), age 30. Account created recently.',
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR INFER TYPE
// =============================================================================

/** Mock response for user profile type */
export const mockUserTypeResponse = {
  type: 'user-profile',
  confidence: 0.92,
};

/** Mock response for order type */
export const mockOrderTypeResponse = {
  type: 'e-commerce-order',
  confidence: 0.89,
};

// =============================================================================
// MOCK RESPONSES FOR IS SENSITIVE
// =============================================================================

/** Mock response for sensitive field */
export const mockSensitiveResponse = {
  sensitive: true,
  type: 'PII',
  recommendation: 'encrypt or mask',
  confidence: 0.92,
};

/** Mock response for non-sensitive field */
export const mockNotSensitiveResponse = {
  sensitive: false,
  type: null,
  recommendation: null,
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
