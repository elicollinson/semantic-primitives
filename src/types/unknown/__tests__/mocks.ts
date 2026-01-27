/**
 * Mock utilities for SemanticUnknown testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// INFER TYPE MOCK RESPONSES
// =============================================================================

/** Mock response for inferType - object with shape */
export const mockInferTypeObjectResponse = {
  type: 'object',
  shape: '{ id: number; name: string }',
  confidence: 0.95,
};

/** Mock response for inferType - array with element type */
export const mockInferTypeArrayResponse = {
  type: 'array',
  shape: 'Array<{ id: number; name: string }>',
  confidence: 0.9,
};

/** Mock response for inferType - nested object */
export const mockInferTypeNestedObjectResponse = {
  type: 'object',
  shape: '{ user: { name: string; email: string }; metadata: { created: string } }',
  confidence: 0.85,
};

// =============================================================================
// SUGGEST TYPES MOCK RESPONSES
// =============================================================================

/** Mock response for suggestTypes - user object */
export const mockSuggestTypesUserResponse = {
  suggestions: [
    { type: 'User', confidence: 0.9, reason: 'Has typical user fields (id, name, email)' },
    { type: '{ id: number; name: string; email: string }', confidence: 0.85, reason: 'Matches inline object literal' },
    { type: 'Record<string, unknown>', confidence: 0.7, reason: 'Generic object fallback' },
  ],
};

/** Mock response for suggestTypes - config object */
export const mockSuggestTypesConfigResponse = {
  suggestions: [
    { type: 'AppConfig', confidence: 0.85, reason: 'Contains configuration settings' },
    { type: '{ port: number; host: string }', confidence: 0.8, reason: 'Matches server config pattern' },
  ],
};

/** Mock response for suggestTypes - single suggestion */
export const mockSuggestTypesSingleResponse = {
  suggestions: [
    { type: 'string[]', confidence: 0.95, reason: 'Array of strings' },
  ],
};

// =============================================================================
// VALIDATE SHAPE MOCK RESPONSES
// =============================================================================

/** Mock response for validateShape - matches */
export const mockValidateShapeMatchesResponse = {
  matches: true,
  missingFields: [],
  extraFields: [],
};

/** Mock response for validateShape - matches with extra fields */
export const mockValidateShapeExtraFieldsResponse = {
  matches: true,
  missingFields: [],
  extraFields: ['age', 'createdAt'],
};

/** Mock response for validateShape - does not match */
export const mockValidateShapeMissingFieldsResponse = {
  matches: false,
  missingFields: ['email', 'password'],
  extraFields: [],
};

/** Mock response for validateShape - partial match */
export const mockValidateShapePartialResponse = {
  matches: false,
  missingFields: ['role'],
  extraFields: ['nickname'],
};

// =============================================================================
// GENERATE TYPE GUARD MOCK RESPONSES
// =============================================================================

/** Mock response for generateTypeGuard - user type */
export const mockGenerateTypeGuardUserResponse = {
  code: `function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null &&
    'id' in x && typeof (x as any).id === 'number' &&
    'name' in x && typeof (x as any).name === 'string';
}`,
  typeName: 'User',
};

/** Mock response for generateTypeGuard - config type */
export const mockGenerateTypeGuardConfigResponse = {
  code: `function isConfig(x: unknown): x is Config {
  return typeof x === 'object' && x !== null &&
    'port' in x && typeof (x as any).port === 'number' &&
    'host' in x && typeof (x as any).host === 'string';
}`,
  typeName: 'Config',
};

/** Mock response for generateTypeGuard - array type */
export const mockGenerateTypeGuardArrayResponse = {
  code: `function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(item => typeof item === 'string');
}`,
  typeName: 'string[]',
};

// =============================================================================
// SAFE ACCESS MOCK RESPONSES
// =============================================================================

/** Mock response for safeAccess - found */
export const mockSafeAccessFoundResponse = {
  propertyPath: 'user.email',
  value: 'john@example.com',
  confidence: 0.95,
};

/** Mock response for safeAccess - not found */
export const mockSafeAccessNotFoundResponse = {
  propertyPath: null,
  value: null,
  confidence: 0.1,
};

/** Mock response for safeAccess - nested */
export const mockSafeAccessNestedResponse = {
  propertyPath: 'data.users.0.profile.avatar',
  value: 'https://example.com/avatar.png',
  confidence: 0.9,
};

// =============================================================================
// MATCHES MOCK RESPONSES
// =============================================================================

/** Mock response for matches - true with high confidence */
export const mockMatchesTrueResponse = {
  matches: true,
  confidence: 0.92,
};

/** Mock response for matches - false */
export const mockMatchesFalseResponse = {
  matches: false,
  confidence: 0.85,
};

/** Mock response for matches - uncertain */
export const mockMatchesUncertainResponse = {
  matches: true,
  confidence: 0.6,
};

// =============================================================================
// NARROW TO MOCK RESPONSES
// =============================================================================

/** Mock response for narrowTo - success */
export const mockNarrowToSuccessResponse = {
  success: true,
  errors: [],
};

/** Mock response for narrowTo - failure */
export const mockNarrowToFailureResponse = {
  success: false,
  errors: ['Missing required field: email', 'id must be a positive number'],
};

/** Mock response for narrowTo - validation error */
export const mockNarrowToValidationErrorResponse = {
  success: false,
  errors: ['Value does not match User type: expected email field'],
};

// =============================================================================
// EXPLAIN MOCK RESPONSES
// =============================================================================

/** Mock response for explain - user object */
export const mockExplainUserResponse = {
  explanation: 'This appears to be a user profile object containing personal information including an identifier, name, and email address.',
};

/** Mock response for explain - config */
export const mockExplainConfigResponse = {
  explanation: 'This appears to be a server configuration object specifying network settings like port and hostname.',
};

/** Mock response for explain - array */
export const mockExplainArrayResponse = {
  explanation: 'This is an array of objects, likely representing a collection of data items with consistent structure.',
};

/** Mock response for explain - primitive */
export const mockExplainPrimitiveResponse = {
  explanation: 'This is a simple string value.',
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
