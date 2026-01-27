/**
 * Mock utilities for SemanticConstructable testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent constructors */
export const mockEquivalentConstructorsResponse = {
  equivalent: true,
  instanceDifferences: [],
  confidence: 0.92,
};

/** Mock response for non-equivalent constructors */
export const mockNotEquivalentConstructorsResponse = {
  equivalent: false,
  instanceDifferences: [
    'Different property names: name vs username',
    'Different method signatures for greet()',
  ],
  confidence: 0.88,
};

/** Mock response for similar constructors with minor differences */
export const mockSimilarConstructorsResponse = {
  equivalent: true,
  instanceDifferences: ['Property order differs but semantically equivalent'],
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE ARGS
// =============================================================================

/** Mock response for valid arguments */
export const mockValidArgsResponse = {
  valid: true,
  issues: [],
};

/** Mock response for invalid arguments */
export const mockInvalidArgsResponse = {
  valid: false,
  issues: ['name must not be empty', 'age must be a positive number'],
};

/** Mock response for partially valid arguments */
export const mockPartiallyValidArgsResponse = {
  valid: false,
  issues: ['email format is invalid'],
};

// =============================================================================
// MOCK RESPONSES FOR ANALYZE INSTANCE SHAPE
// =============================================================================

/** Mock response for user class shape */
export const mockUserShapeResponse = {
  properties: {
    name: 'string',
    age: 'number',
    email: 'string',
  },
  methods: ['greet', 'toJSON', 'validate'],
  instanceOf: ['User', 'Object'],
};

/** Mock response for simple class shape */
export const mockSimpleShapeResponse = {
  properties: {
    value: 'any',
  },
  methods: ['getValue', 'setValue'],
  instanceOf: ['SimpleClass', 'Object'],
};

/** Mock response for complex class shape */
export const mockComplexShapeResponse = {
  properties: {
    id: 'string',
    data: 'object',
    createdAt: 'Date',
    updatedAt: 'Date',
  },
  methods: ['save', 'delete', 'update', 'toJSON'],
  instanceOf: ['Entity', 'BaseModel', 'Object'],
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for user class explanation */
export const mockUserExplanationResponse = {
  explanation:
    'Creates User instances with name, age, and email properties. Instances can greet others and serialize to JSON format. Used for representing user data in the application.',
};

/** Mock response for simple class explanation */
export const mockSimpleExplanationResponse = {
  explanation:
    'Creates a simple wrapper around a single value. Provides getter and setter methods for accessing and modifying the wrapped value.',
};

/** Mock response for service class explanation */
export const mockServiceExplanationResponse = {
  explanation:
    'Creates a service instance that handles API communication. Manages HTTP requests, authentication, and response parsing. Implements retry logic and error handling.',
};

// =============================================================================
// MOCK RESPONSES FOR DETECT PATTERNS
// =============================================================================

/** Mock response for builder pattern */
export const mockBuilderPatternResponse = {
  patterns: ['builder'],
  confidence: 0.91,
};

/** Mock response for factory pattern */
export const mockFactoryPatternResponse = {
  patterns: ['factory-method'],
  confidence: 0.87,
};

/** Mock response for multiple patterns */
export const mockMultiplePatternsResponse = {
  patterns: ['singleton', 'factory-method'],
  confidence: 0.85,
};

/** Mock response for no patterns */
export const mockNoPatternsResponse = {
  patterns: [],
  confidence: 0.95,
};

/** Mock response for value object pattern */
export const mockValueObjectPatternResponse = {
  patterns: ['value-object'],
  confidence: 0.89,
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE DOCS
// =============================================================================

/** Mock response for JSDoc documentation */
export const mockJSDocResponse = {
  documentation: `/**
 * Creates a new User instance.
 *
 * @param name - The user's display name
 * @param age - The user's age in years
 * @param email - The user's email address
 * @returns A new User instance
 *
 * @example
 * const user = new User("John", 30, "john@example.com");
 * user.greet(); // "Hello, I'm John"
 */`,
};

/** Mock response for Markdown documentation */
export const mockMarkdownDocsResponse = {
  documentation: `# User

Creates a new User instance with the specified properties.

## Parameters

- \`name\` (string): The user's display name
- \`age\` (number): The user's age in years
- \`email\` (string): The user's email address

## Methods

- \`greet()\`: Returns a greeting message
- \`toJSON()\`: Serializes the user to JSON

## Example

\`\`\`typescript
const user = new User("John", 30, "john@example.com");
console.log(user.greet());
\`\`\``,
};

/** Mock response for plain text documentation */
export const mockPlainDocsResponse = {
  documentation: `User Constructor

Creates a new User instance with name, age, and email properties.

Parameters:
  - name: The user's display name (string)
  - age: The user's age in years (number)
  - email: The user's email address (string)

Methods:
  - greet(): Returns a greeting message
  - toJSON(): Serializes the user to JSON

Example:
  const user = new User("John", 30, "john@example.com");`,
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST IMPROVEMENTS
// =============================================================================

/** Mock response with improvements */
export const mockImprovementsResponse = {
  suggestions: [
    {
      suggestion: 'Add parameter validation',
      reason: 'No null/undefined checks for constructor parameters',
    },
    {
      suggestion: 'Use readonly properties',
      reason: 'Properties can be modified after construction',
    },
  ],
};

/** Mock response with no improvements */
export const mockNoImprovementsResponse = {
  suggestions: [],
};

/** Mock response with multiple improvements */
export const mockMultipleImprovementsResponse = {
  suggestions: [
    {
      suggestion: 'Add parameter validation',
      reason: 'No null/undefined checks for constructor parameters',
    },
    {
      suggestion: 'Use readonly properties',
      reason: 'Properties can be modified after construction',
    },
    {
      suggestion: 'Implement toString method',
      reason: 'No string representation defined',
    },
    {
      suggestion: 'Add error handling',
      reason: 'Constructor may throw on invalid input',
    },
  ],
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
