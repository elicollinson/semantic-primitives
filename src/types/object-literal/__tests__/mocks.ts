/**
 * Mock utilities for SemanticObjectLiteral testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent objects with mappings */
export const mockEquivalentObjectsResponse = {
  equivalent: true,
  mappings: { firstName: 'first_name', lastName: 'last_name' },
  confidence: 0.92,
};

/** Mock response for non-equivalent objects */
export const mockNotEquivalentObjectsResponse = {
  equivalent: false,
  mappings: {},
  confidence: 0.85,
};

/** Mock response for identical objects */
export const mockIdenticalObjectsResponse = {
  equivalent: true,
  mappings: { name: 'name', email: 'email' },
  confidence: 1.0,
};

// =============================================================================
// MOCK RESPONSES FOR INFER SCHEMA
// =============================================================================

/** Mock response for user profile schema */
export const mockUserProfileSchemaResponse = {
  name: 'UserProfile',
  properties: {
    id: 'number',
    name: 'string',
    email: 'string',
    age: 'number',
  },
  required: ['id', 'name', 'email'],
  optional: ['age'],
  confidence: 0.94,
};

/** Mock response for order schema */
export const mockOrderSchemaResponse = {
  name: 'Order',
  properties: {
    orderId: 'string',
    items: 'array',
    total: 'number',
    status: 'string',
  },
  required: ['orderId', 'items', 'total'],
  optional: ['status'],
  confidence: 0.91,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE WITH RULES
// =============================================================================

/** Mock response for valid object */
export const mockValidObjectResponse = {
  valid: true,
  violations: [],
};

/** Mock response for invalid object with violations */
export const mockInvalidObjectResponse = {
  valid: false,
  violations: [
    { rule: 'email must be valid', field: 'email', reason: 'Invalid email format' },
    { rule: 'age must be reasonable for a human', field: 'age', reason: 'Age cannot be negative' },
  ],
};

/** Mock response for single violation */
export const mockSingleViolationResponse = {
  valid: false,
  violations: [
    { rule: 'price must be positive', field: 'price', reason: 'Price is zero or negative' },
  ],
};

// =============================================================================
// MOCK RESPONSES FOR DETECT DOMAIN
// =============================================================================

/** Mock response for user profile domain */
export const mockUserProfileDomainResponse = {
  domain: 'user-profile',
  confidence: 0.94,
  suggestedInterface: 'interface User {\n  name: string;\n  email: string;\n  age?: number;\n}',
};

/** Mock response for e-commerce order domain */
export const mockOrderDomainResponse = {
  domain: 'e-commerce-order',
  confidence: 0.89,
  suggestedInterface: null,
};

/** Mock response for config domain */
export const mockConfigDomainResponse = {
  domain: 'application-config',
  confidence: 0.85,
  suggestedInterface: null,
};

// =============================================================================
// MOCK RESPONSES FOR FIND PROPERTIES
// =============================================================================

/** Mock response for finding contact information */
export const mockFindContactInfoResponse = {
  matches: [
    { key: 'email', value: 'john@example.com', relevance: 0.95 },
    { key: 'phone', value: '555-1234', relevance: 0.90 },
  ],
};

/** Mock response for finding identification */
export const mockFindIdentificationResponse = {
  matches: [
    { key: 'id', value: 123, relevance: 0.98 },
    { key: 'name', value: 'John Doe', relevance: 0.85 },
  ],
};

/** Mock response for no matches */
export const mockNoMatchesResponse = {
  matches: [],
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING PROPERTIES
// =============================================================================

/** Mock response for user profile suggestions */
export const mockUserSuggestionsResponse = {
  suggestions: [
    { property: 'phoneNumber', type: 'string', reason: 'Common contact field in user profiles' },
    { property: 'address', type: 'Address', reason: 'Useful for shipping and verification' },
    { property: 'createdAt', type: 'Date', reason: 'Common timestamp for tracking record creation' },
  ],
};

/** Mock response for order suggestions */
export const mockOrderSuggestionsResponse = {
  suggestions: [
    { property: 'shippingAddress', type: 'Address', reason: 'Required for order fulfillment' },
    { property: 'paymentMethod', type: 'string', reason: 'Track how the order was paid' },
  ],
};

/** Mock response for no suggestions */
export const mockNoSuggestionsResponse = {
  suggestions: [],
};

// =============================================================================
// MOCK RESPONSES FOR IS SENSITIVE
// =============================================================================

/** Mock response for sensitive SSN field */
export const mockSensitiveSSNResponse = {
  sensitive: true,
  type: 'PII',
  recommendation: 'encrypt or mask',
};

/** Mock response for sensitive password field */
export const mockSensitivePasswordResponse = {
  sensitive: true,
  type: 'authentication',
  recommendation: 'never store in plain text, use hashing',
};

/** Mock response for sensitive credit card field */
export const mockSensitiveCreditCardResponse = {
  sensitive: true,
  type: 'financial',
  recommendation: 'use tokenization, only store last 4 digits',
};

/** Mock response for non-sensitive field */
export const mockNotSensitiveResponse = {
  sensitive: false,
  type: null,
  recommendation: null,
};

// =============================================================================
// MOCK RESPONSES FOR TRANSFORM KEYS
// =============================================================================

/** Mock response for camelCase transformation */
export const mockTransformToCamelCaseResponse = {
  transformed: { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
};

/** Mock response for snake_case transformation */
export const mockTransformToSnakeCaseResponse = {
  transformed: { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
};

/** Mock response for PascalCase transformation */
export const mockTransformToPascalCaseResponse = {
  transformed: { FirstName: 'John', LastName: 'Doe', EmailAddress: 'john@example.com' },
};

/** Mock response for kebab-case transformation */
export const mockTransformToKebabCaseResponse = {
  transformed: { 'first-name': 'John', 'last-name': 'Doe', 'email-address': 'john@example.com' },
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE INTERFACE
// =============================================================================

/** Mock response for User interface generation */
export const mockUserInterfaceResponse = {
  interface: `interface User {
  name: string;
  email: string;
  age?: number;
}`,
};

/** Mock response for Order interface generation */
export const mockOrderInterfaceResponse = {
  interface: `interface Order {
  orderId: string;
  items: OrderItem[];
  total: number;
  status?: string;
}`,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for user summary */
export const mockUserSummaryResponse = {
  summary: 'User profile for John Doe (ID: 123), contactable at john@example.com.',
};

/** Mock response for order summary */
export const mockOrderSummaryResponse = {
  summary: 'Order #1234 with 3 items totaling $150, currently pending.',
};

/** Mock response for config summary */
export const mockConfigSummaryResponse = {
  summary: 'Application configuration with database connection settings and debug mode enabled.',
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
