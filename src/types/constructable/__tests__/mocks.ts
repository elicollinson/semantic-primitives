/**
 * Mock utilities for SemanticConstructable testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTICALLY EQUALS
// =============================================================================

/** Mock response for equivalent constructors */
export const mockEquivalentConstructorsResponse = {
  equivalent: true,
  instanceDifferences: [],
  confidence: 0.95,
};

/** Mock response for non-equivalent constructors */
export const mockNotEquivalentConstructorsResponse = {
  equivalent: false,
  instanceDifferences: [
    'Different property names: firstName vs first_name',
    'Constructor2 has additional method: validate()',
  ],
  confidence: 0.88,
};

/** Mock response for partially equivalent constructors */
export const mockPartiallyEquivalentResponse = {
  equivalent: true,
  instanceDifferences: ['Different default values for optional parameters'],
  confidence: 0.82,
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

/** Mock response for type mismatch */
export const mockTypeMismatchResponse = {
  valid: false,
  issues: ['Expected string for parameter "name", got number'],
};

// =============================================================================
// MOCK RESPONSES FOR ANALYZE INSTANCE SHAPE
// =============================================================================

/** Mock response for User class instance shape */
export const mockUserInstanceShapeResponse = {
  properties: {
    name: 'string',
    age: 'number',
    email: 'string',
  },
  methods: ['greet', 'toJSON', 'validate'],
  instanceOf: ['User', 'Object'],
};

/** Mock response for simple class instance shape */
export const mockSimpleInstanceShapeResponse = {
  properties: {
    id: 'number',
    data: 'object',
  },
  methods: ['toString'],
  instanceOf: ['SimpleClass', 'Object'],
};

/** Mock response for complex class instance shape */
export const mockComplexInstanceShapeResponse = {
  properties: {
    config: 'Config',
    state: 'Map<string, any>',
    handlers: 'Function[]',
  },
  methods: ['initialize', 'start', 'stop', 'on', 'emit', 'getState'],
  instanceOf: ['ComplexService', 'EventEmitter', 'Object'],
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for User class explanation */
export const mockUserExplanationResponse = {
  explanation:
    'Creates User instances with name and age properties and a greet() method for displaying a greeting message',
};

/** Mock response for service class explanation */
export const mockServiceExplanationResponse = {
  explanation:
    'Creates a service instance that manages configuration and state, providing methods for lifecycle management (start/stop) and event handling',
};

/** Mock response for data class explanation */
export const mockDataClassExplanationResponse = {
  explanation:
    'Creates a data container object that holds an ID and associated data, with serialization support',
};

// =============================================================================
// MOCK RESPONSES FOR DETECT PATTERNS
// =============================================================================

/** Mock response for builder pattern */
export const mockBuilderPatternResponse = {
  patterns: ['builder'],
  confidence: 0.92,
};

/** Mock response for factory pattern */
export const mockFactoryPatternResponse = {
  patterns: ['factory-method'],
  confidence: 0.88,
};

/** Mock response for singleton pattern */
export const mockSingletonPatternResponse = {
  patterns: ['singleton'],
  confidence: 0.95,
};

/** Mock response for multiple patterns */
export const mockMultiplePatternsResponse = {
  patterns: ['builder', 'factory-method'],
  confidence: 0.85,
};

/** Mock response for no patterns */
export const mockNoPatternsResponse = {
  patterns: [],
  confidence: 0.90,
};

/** Mock response for observer pattern */
export const mockObserverPatternResponse = {
  patterns: ['observer'],
  confidence: 0.91,
};

// =============================================================================
// MOCK RESPONSES FOR GENERATE DOCS
// =============================================================================

/** Mock response for JSDoc format */
export const mockJSDocResponse = {
  documentation: `/**
 * Creates a new User instance
 * @param name - User's name
 * @param age - User's age in years
 * @returns User instance with greet() method
 * @example
 * const user = new User("John", 30);
 * user.greet(); // "Hello, I'm John"
 */`,
};

/** Mock response for Markdown format */
export const mockMarkdownDocsResponse = {
  documentation: `# User

Creates a new User instance.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | User's name |
| age | number | User's age in years |

## Methods

- \`greet()\` - Returns a greeting message

## Example

\`\`\`typescript
const user = new User("John", 30);
user.greet(); // "Hello, I'm John"
\`\`\``,
};

/** Mock response for plain format */
export const mockPlainDocsResponse = {
  documentation:
    'User: Creates a new User instance with name (string) and age (number) parameters. The instance has a greet() method that returns a greeting message.',
};

// =============================================================================
// MOCK RESPONSES FOR SUGGEST IMPROVEMENTS
// =============================================================================

/** Mock response for validation improvements */
export const mockValidationImprovementsResponse = {
  suggestions: [
    {
      suggestion: 'Add parameter validation',
      reason: 'No null/undefined checks for parameters',
    },
    {
      suggestion: 'Add type guards',
      reason: 'Parameters could be wrong types at runtime',
    },
  ],
};

/** Mock response for documentation improvements */
export const mockDocumentationImprovementsResponse = {
  suggestions: [
    {
      suggestion: 'Add JSDoc comments',
      reason: 'Constructor lacks documentation',
    },
    {
      suggestion: 'Add example usage',
      reason: 'Examples help developers understand usage',
    },
  ],
};

/** Mock response for no improvements needed */
export const mockNoImprovementsResponse = {
  suggestions: [],
};

/** Mock response for multiple improvements */
export const mockMultipleImprovementsResponse = {
  suggestions: [
    {
      suggestion: 'Add parameter validation',
      reason: 'No null checks exist',
    },
    {
      suggestion: 'Consider using TypeScript readonly',
      reason: 'Properties should not be modified after construction',
    },
    {
      suggestion: 'Add default parameter values',
      reason: 'Optional parameters lack defaults',
    },
  ],
};

// =============================================================================
// TEST CLASSES FOR MOCKING
// =============================================================================

/** Sample User class for testing */
export class MockUser {
  constructor(
    public name: string,
    public age: number
  ) {}

  greet(): string {
    return `Hello, I'm ${this.name}`;
  }

  toJSON(): object {
    return { name: this.name, age: this.age };
  }
}

/** Sample UserV2 class for comparison testing */
export class MockUserV2 {
  constructor(
    public firstName: string,
    public yearsOld: number
  ) {}

  greet(): string {
    return `Hello, I'm ${this.firstName}`;
  }

  toJSON(): object {
    return { firstName: this.firstName, yearsOld: this.yearsOld };
  }
}

/** Sample Product class for testing */
export class MockProduct {
  constructor(
    public id: string,
    public name: string,
    public price: number
  ) {}

  toString(): string {
    return `${this.name} ($${this.price})`;
  }
}

/** Sample Builder class for pattern detection */
export class MockBuilder {
  private data: Record<string, unknown> = {};

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setAge(age: number): this {
    this.data.age = age;
    return this;
  }

  build(): Record<string, unknown> {
    return { ...this.data };
  }
}

/** Sample Singleton class for pattern detection */
export class MockSingleton {
  private static instance: MockSingleton | null = null;

  private constructor(public config: Record<string, unknown>) {}

  static getInstance(config?: Record<string, unknown>): MockSingleton {
    if (!MockSingleton.instance) {
      MockSingleton.instance = new MockSingleton(config || {});
    }
    return MockSingleton.instance;
  }
}

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
