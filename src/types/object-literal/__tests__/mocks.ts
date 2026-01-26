/**
 * Mock utilities for SemanticObjectLiteral testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent objects with synonym keys */
export const mockEquivalentWithMappingsResponse = {
  equivalent: true,
  mappings: { firstName: 'first_name', lastName: 'last_name', emailAddress: 'email' },
  confidence: 0.92,
};

/** Mock response for non-equivalent objects */
export const mockNotEquivalentResponse = {
  equivalent: false,
  mappings: {},
  confidence: 0.88,
};

/** Mock response for identical objects */
export const mockIdenticalObjectsResponse = {
  equivalent: true,
  mappings: { name: 'name', age: 'age', email: 'email' },
  confidence: 1.0,
};

// =============================================================================
// MOCK RESPONSES FOR INFER SCHEMA
// =============================================================================

/** Mock response for user schema */
export const mockUserSchemaResponse = {
  name: 'User',
  properties: {
    id: 'number',
    name: 'string',
    email: 'string',
    age: 'number',
    isActive: 'boolean',
  },
  required: ['id', 'name', 'email'],
  optional: ['age', 'isActive'],
  confidence: 0.94,
};

/** Mock response for product schema */
export const mockProductSchemaResponse = {
  name: 'Product',
  properties: {
    sku: 'string',
    name: 'string',
    price: 'number',
    category: 'string',
    inStock: 'boolean',
  },
  required: ['sku', 'name', 'price'],
  optional: ['category', 'inStock'],
  confidence: 0.91,
};

/** Mock response for address schema */
export const mockAddressSchemaResponse = {
  name: 'Address',
  properties: {
    street: 'string',
    city: 'string',
    state: 'string',
    zipCode: 'string',
    country: 'string',
  },
  required: ['street', 'city', 'zipCode'],
  optional: ['state', 'country'],
  confidence: 0.89,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE WITH RULES
// =============================================================================

/** Mock response for valid object */
export const mockValidResponse = {
  valid: true,
  violations: [],
};

/** Mock response for invalid object */
export const mockInvalidResponse = {
  valid: false,
  violations: [
    { rule: 'email must be valid', field: 'email', reason: 'Email format is invalid' },
    { rule: 'age must be a positive number', field: 'age', reason: 'Age is negative' },
  ],
};

/** Mock response for object with one violation */
export const mockSingleViolationResponse = {
  valid: false,
  violations: [
    { rule: 'password must be at least 8 characters', field: 'password', reason: 'Password is only 5 characters' },
  ],
};

// =============================================================================
// MOCK RESPONSES FOR DETECT DOMAIN
// =============================================================================

/** Mock response for user profile domain */
export const mockUserProfileDomainResponse = {
  domain: 'user-profile',
  confidence: 0.94,
  suggestedInterface: 'UserProfile',
};

/** Mock response for e-commerce product domain */
export const mockProductDomainResponse = {
  domain: 'e-commerce-product',
  confidence: 0.89,
  suggestedInterface: 'Product',
};

/** Mock response for API config domain */
export const mockConfigDomainResponse = {
  domain: 'api-configuration',
  confidence: 0.85,
  suggestedInterface: 'APIConfig',
};

/** Mock response for order domain */
export const mockOrderDomainResponse = {
  domain: 'e-commerce-order',
  confidence: 0.91,
  suggestedInterface: 'Order',
};

// =============================================================================
// MOCK RESPONSES FOR FIND PROPERTIES
// =============================================================================

/** Mock response for finding contact information */
export const mockFindContactInfoResponse = {
  matches: [
    { key: 'email', value: 'john@example.com', relevance: 0.98 },
    { key: 'phone', value: '555-1234', relevance: 0.95 },
    { key: 'address', value: '123 Main St', relevance: 0.82 },
  ],
};

/** Mock response for finding identification fields */
export const mockFindIdentificationResponse = {
  matches: [
    { key: 'id', value: 123, relevance: 0.99 },
    { key: 'name', value: 'John Doe', relevance: 0.88 },
    { key: 'ssn', value: '123-45-6789', relevance: 0.75 },
  ],
};

/** Mock response for finding pricing info */
export const mockFindPricingResponse = {
  matches: [
    { key: 'price', value: 99.99, relevance: 0.99 },
    { key: 'discount', value: 10, relevance: 0.85 },
    { key: 'tax', value: 8.5, relevance: 0.80 },
  ],
};

/** Mock response for no matches */
export const mockNoMatchesResponse = {
  matches: [],
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST MISSING PROPERTIES
// =============================================================================

/** Mock response for user missing properties */
export const mockUserMissingSuggestionsResponse = {
  suggestions: [
    { property: 'createdAt', type: 'Date', reason: 'Common timestamp for user creation' },
    { property: 'updatedAt', type: 'Date', reason: 'Track when user was last modified' },
    { property: 'phoneNumber', type: 'string', reason: 'Common contact field in user profiles' },
  ],
};

/** Mock response for product missing properties */
export const mockProductMissingSuggestionsResponse = {
  suggestions: [
    { property: 'sku', type: 'string', reason: 'Standard product identifier' },
    { property: 'inventory', type: 'number', reason: 'Track available stock' },
    { property: 'images', type: 'string[]', reason: 'Product images for display' },
  ],
};

/** Mock response for no suggestions */
export const mockNoSuggestionsResponse = {
  suggestions: [],
};

// =============================================================================
// MOCK RESPONSES FOR IS SENSITIVE
// =============================================================================

/** Mock response for sensitive SSN */
export const mockSensitiveSSNResponse = {
  sensitive: true,
  type: 'PII',
  recommendation: 'encrypt or mask',
};

/** Mock response for sensitive password */
export const mockSensitivePasswordResponse = {
  sensitive: true,
  type: 'authentication',
  recommendation: 'hash, never store in plain text',
};

/** Mock response for sensitive credit card */
export const mockSensitiveCreditCardResponse = {
  sensitive: true,
  type: 'financial',
  recommendation: 'tokenize, only store last 4 digits',
};

/** Mock response for sensitive API key */
export const mockSensitiveApiKeyResponse = {
  sensitive: true,
  type: 'authentication',
  recommendation: 'store in secure vault, never log',
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
  keyMappings: { first_name: 'firstName', last_name: 'lastName', email_address: 'emailAddress' },
};

/** Mock response for snake_case transformation */
export const mockTransformToSnakeCaseResponse = {
  transformed: { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
  keyMappings: { firstName: 'first_name', lastName: 'last_name', emailAddress: 'email_address' },
};

/** Mock response for PascalCase transformation */
export const mockTransformToPascalCaseResponse = {
  transformed: { FirstName: 'John', LastName: 'Doe', EmailAddress: 'john@example.com' },
  keyMappings: { firstName: 'FirstName', lastName: 'LastName', emailAddress: 'EmailAddress' },
};

/** Mock response for kebab-case transformation */
export const mockTransformToKebabCaseResponse = {
  transformed: { 'first-name': 'John', 'last-name': 'Doe', 'email-address': 'john@example.com' },
  keyMappings: { firstName: 'first-name', lastName: 'last-name', emailAddress: 'email-address' },
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE INTERFACE
// =============================================================================

/** Mock response for user interface */
export const mockUserInterfaceResponse = {
  interface: `interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  isActive?: boolean;
}`,
  notes: ['age and isActive marked optional based on common patterns'],
};

/** Mock response for product interface */
export const mockProductInterfaceResponse = {
  interface: `interface Product {
  sku: string;
  name: string;
  price: number;
  category?: string;
  inStock: boolean;
}`,
  notes: ['category is optional as not all products may have one'],
};

/** Mock response for nested interface */
export const mockNestedInterfaceResponse = {
  interface: `interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}`,
  notes: ['Nested customer and items structures included'],
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for user summary */
export const mockUserSummaryResponse = {
  summary: 'User profile for John Doe (ID: 123), age 30, contactable at john@example.com',
};

/** Mock response for order summary */
export const mockOrderSummaryResponse = {
  summary: 'Order #ORD-456 containing 3 items totaling $150.00, pending shipment',
};

/** Mock response for product summary */
export const mockProductSummaryResponse = {
  summary: 'Laptop computer (SKU: TECH-001) priced at $999.99, currently in stock',
};

/** Mock response for config summary */
export const mockConfigSummaryResponse = {
  summary: 'API configuration for production environment with rate limiting enabled',
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
