/**
 * Mock utilities for SemanticObject testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC GET
// =============================================================================

/** Mock response for exact key match */
export const mockSemanticGetEmailResponse = {
  matchedKey: 'email',
  value: 'john@example.com',
  confidence: 1.0,
};

/** Mock response for semantic key match (emailAddress -> email) */
export const mockSemanticGetEmailAddressResponse = {
  matchedKey: 'emailAddress',
  value: 'john@example.com',
  confidence: 0.95,
};

/** Mock response for semantic key match (name -> firstName) */
export const mockSemanticGetNameResponse = {
  matchedKey: 'firstName',
  value: 'John',
  confidence: 0.88,
};

/** Mock response for no match */
export const mockSemanticGetNoMatchResponse = {
  matchedKey: null,
  value: null,
  confidence: 0.1,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent objects */
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
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid object */
export const mockValidObjectResponse = {
  valid: true,
  issues: [],
  confidence: 0.98,
};

/** Mock response for invalid object */
export const mockInvalidObjectResponse = {
  valid: false,
  issues: [
    { field: 'email', problem: 'Invalid email format' },
    { field: 'age', problem: 'Age must be a positive number' },
  ],
  confidence: 0.92,
};

/** Mock response for object with warnings */
export const mockObjectWithIssuesResponse = {
  valid: false,
  issues: [{ field: 'password', problem: 'Password is too weak' }],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR INFER SCHEMA
// =============================================================================

/** Mock response for user profile schema */
export const mockUserProfileSchemaResponse = {
  type: 'user-profile',
  fields: {
    id: { type: 'number', purpose: 'unique identifier' },
    name: { type: 'string', purpose: 'user display name' },
    email: { type: 'string', purpose: 'contact email', format: 'email' },
    age: { type: 'number', purpose: 'user age in years' },
  },
  confidence: 0.94,
};

/** Mock response for product schema */
export const mockProductSchemaResponse = {
  type: 'product',
  fields: {
    id: { type: 'string', purpose: 'product identifier' },
    name: { type: 'string', purpose: 'product name' },
    price: { type: 'number', purpose: 'price in dollars' },
    category: { type: 'string', purpose: 'product category' },
  },
  confidence: 0.91,
};

// =============================================================================
// MOCK RESPONSES FOR TRANSFORM KEYS
// =============================================================================

/** Mock response for camelCase transformation */
export const mockTransformToCamelCaseResponse = {
  transformed: { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' },
  keyMappings: { first_name: 'firstName', last_name: 'lastName', email_address: 'emailAddress' },
  confidence: 0.98,
};

/** Mock response for snake_case transformation */
export const mockTransformToSnakeCaseResponse = {
  transformed: { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
  keyMappings: { firstName: 'first_name', lastName: 'last_name', emailAddress: 'email_address' },
  confidence: 0.98,
};

/** Mock response for PascalCase transformation */
export const mockTransformToPascalCaseResponse = {
  transformed: { FirstName: 'John', LastName: 'Doe', EmailAddress: 'john@example.com' },
  keyMappings: { firstName: 'FirstName', lastName: 'LastName', emailAddress: 'EmailAddress' },
  confidence: 0.98,
};

/** Mock response for kebab-case transformation */
export const mockTransformToKebabCaseResponse = {
  transformed: { 'first-name': 'John', 'last-name': 'Doe', 'email-address': 'john@example.com' },
  keyMappings: { firstName: 'first-name', lastName: 'last-name', emailAddress: 'email-address' },
  confidence: 0.98,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC MERGE
// =============================================================================

/** Mock response for successful merge */
export const mockMergeSuccessResponse = {
  merged: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-1234' },
  keyMappings: { first_name: 'firstName' },
  conflicts: [],
  confidence: 0.95,
};

/** Mock response for merge with conflicts */
export const mockMergeWithConflictsResponse = {
  merged: { name: 'Jane Doe', email: 'jane@example.com', age: 25 },
  keyMappings: {},
  conflicts: ['name', 'email'],
  confidence: 0.88,
};

/** Mock response for merge prefer-this */
export const mockMergePreferThisResponse = {
  merged: { name: 'John', email: 'john@example.com', phone: '555-0000' },
  keyMappings: {},
  conflicts: ['name'],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR PICK
// =============================================================================

/** Mock response for picking contact information */
export const mockPickContactInfoResponse = {
  picked: { email: 'john@example.com', phone: '555-1234' },
  matchedFields: { 'contact information': ['email', 'phone'] },
  confidence: 0.93,
};

/** Mock response for picking identification */
export const mockPickIdentificationResponse = {
  picked: { id: 123, name: 'John Doe' },
  matchedFields: { identification: ['id', 'name'] },
  confidence: 0.90,
};

/** Mock response for picking multiple categories */
export const mockPickMultipleResponse = {
  picked: { id: 123, email: 'john@example.com', phone: '555-1234' },
  matchedFields: { 'contact information': ['email', 'phone'], identification: ['id'] },
  confidence: 0.91,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING FIELDS
// =============================================================================

/** Mock response for user profile suggestions */
export const mockSuggestMissingUserFieldsResponse = {
  suggestions: [
    { field: 'phoneNumber', reason: 'Common contact field in user profiles' },
    { field: 'address', reason: 'Useful for shipping and verification' },
    { field: 'dateOfBirth', reason: 'Often required for age verification' },
  ],
  objectType: 'user-profile',
  confidence: 0.88,
};

/** Mock response for product suggestions */
export const mockSuggestMissingProductFieldsResponse = {
  suggestions: [
    { field: 'sku', reason: 'Standard product identifier' },
    { field: 'inventory', reason: 'Track stock levels' },
  ],
  objectType: 'product',
  confidence: 0.85,
};

/** Mock response for no suggestions */
export const mockNoSuggestionsResponse = {
  suggestions: [],
  objectType: 'complete-profile',
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for user summary */
export const mockUserSummaryResponse = {
  summary: 'User profile for John Doe (ID: 123), age 30, contactable at john@example.com',
  confidence: 0.92,
};

/** Mock response for order summary */
export const mockOrderSummaryResponse = {
  summary: 'Order #1234 for Jane Smith: 3 items totaling $150, shipping to NYC',
  confidence: 0.90,
};

/** Mock response for product summary */
export const mockProductSummaryResponse = {
  summary: 'Laptop computer priced at $999 in electronics category, currently in stock',
  confidence: 0.91,
};

// =============================================================================
// MOCK RESPONSES FOR INFER TYPE
// =============================================================================

/** Mock response for user profile type */
export const mockInferUserProfileTypeResponse = {
  type: 'user-profile',
  confidence: 0.94,
};

/** Mock response for e-commerce order type */
export const mockInferOrderTypeResponse = {
  type: 'e-commerce-order',
  confidence: 0.89,
};

/** Mock response for config type */
export const mockInferConfigTypeResponse = {
  type: 'application-config',
  confidence: 0.85,
};

/** Mock response for log entry type */
export const mockInferLogEntryTypeResponse = {
  type: 'log-entry',
  confidence: 0.91,
};

// =============================================================================
// MOCK RESPONSES FOR IS SENSITIVE
// =============================================================================

/** Mock response for sensitive SSN field */
export const mockSensitiveSSNResponse = {
  sensitive: true,
  type: 'PII',
  recommendation: 'encrypt or mask',
  confidence: 0.99,
};

/** Mock response for sensitive password field */
export const mockSensitivePasswordResponse = {
  sensitive: true,
  type: 'authentication',
  recommendation: 'never store in plain text, use hashing',
  confidence: 0.99,
};

/** Mock response for sensitive credit card field */
export const mockSensitiveCreditCardResponse = {
  sensitive: true,
  type: 'financial',
  recommendation: 'use tokenization, only store last 4 digits',
  confidence: 0.98,
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
