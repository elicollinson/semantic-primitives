# SemanticFetch (Request / Response / Headers)

## Overview

The `SemanticRequest`, `SemanticResponse`, and `SemanticHeaders` types wrap web fetch API primitives with LLM-powered semantic understanding. They enable intelligent HTTP operations, request analysis, and response validation.

**Core Principle**: HTTP primitives represent web communication - semantic operations should understand request intent, validate responses, and explain HTTP interactions.

---

## Interface

```typescript
interface SemanticRequest extends Request {
  /**
   * Create a SemanticRequest from URL or request options.
   *
   * @param input - URL or Request
   * @param init - Request options
   * @returns SemanticRequest instance
   *
   * @example
   * SemanticRequest.from("/api/users?role=admin", { method: "GET" })
   */
  static from(input: string | Request, init?: RequestInit): SemanticRequest;

  /**
   * Check if two requests are semantically equivalent.
   *
   * @param other - Request to compare
   * @returns Equivalence result
   *
   * @example
   * req1.semanticallyEquals(req2)
   * // { equivalent: true, note: "Same params, different order" }
   */
  semanticallyEquals(other: Request): {
    equivalent: boolean;
    note?: string;
    confidence: number;
  };

  /**
   * Analyze the intent of this request.
   *
   * @returns Request intent analysis
   *
   * @example
   * request.analyzeIntent()
   * // {
   * //   intent: "fetch paginated users",
   * //   operation: "READ",
   * //   resource: "users",
   * //   filters: [{ field: "role", value: "admin" }]
   * // }
   */
  analyzeIntent(): {
    intent: string;
    operation: "CREATE" | "READ" | "UPDATE" | "DELETE";
    resource: string;
    filters?: Array<{ field: string; value: unknown }>;
  };

  /**
   * Validate the request against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * request.validate(["must include authentication", "body must be valid JSON"])
   */
  validate(rules?: string[]): {
    valid: boolean;
    issues: string[];
  };

  /**
   * Explain what this request does.
   *
   * @param audience - Target audience
   * @returns Human-readable explanation
   *
   * @example
   * request.explain("non-technical")
   * // "Fetching the list of admin users"
   */
  explain(audience?: "technical" | "non-technical"): string;

  /**
   * Check if the request is safe (no security issues).
   *
   * @returns Security assessment
   *
   * @example
   * request.validateSecurity()
   * // { safe: true, warnings: ["Consider using HTTPS"] }
   */
  validateSecurity(): {
    safe: boolean;
    issues: string[];
    warnings: string[];
  };
}

interface SemanticResponse extends Response {
  /**
   * Wrap a Response with semantic capabilities.
   *
   * @param response - Response to wrap
   * @returns SemanticResponse instance
   */
  static from(response: Response): SemanticResponse;

  /**
   * Check if two responses are semantically equivalent.
   *
   * @param other - Response to compare
   * @returns Equivalence result
   */
  semanticallyEquals(other: Response): Promise<{
    equivalent: boolean;
    confidence: number;
  }>;

  /**
   * Analyze the response content.
   *
   * @returns Response analysis
   *
   * @example
   * response.analyze()
   * // {
   * //   dataType: "collection",
   * //   entityType: "User",
   * //   count: 25,
   * //   pagination: { hasMore: true }
   * // }
   */
  analyze(): Promise<{
    dataType: string;
    entityType?: string;
    count?: number;
    pagination?: { hasMore: boolean };
  }>;

  /**
   * Summarize the response body.
   *
   * @returns Human-readable summary
   */
  summarize(): Promise<string>;

  /**
   * Validate response against expected contract.
   *
   * @param contract - Expected response shape
   * @returns Validation result
   */
  validateContract(contract: {
    status?: number[];
    schema?: string;
    requiredHeaders?: string[];
  }): Promise<{ valid: boolean; issues: string[] }>;

  /**
   * Interpret error responses with context.
   *
   * @returns Error interpretation
   */
  interpretError(): Promise<{
    category: string;
    message: string;
    suggestedAction: string;
    retryable: boolean;
  }>;
}

interface SemanticHeaders extends Headers {
  /**
   * Create SemanticHeaders from header object.
   *
   * @param init - Headers init
   * @returns SemanticHeaders instance
   */
  static from(init: HeadersInit): SemanticHeaders;

  /**
   * Check if two header sets are semantically equivalent.
   *
   * @param other - Headers to compare
   * @returns Equivalence result
   */
  semanticallyEquals(other: Headers): {
    equivalent: boolean;
    differences: string[];
  };

  /**
   * Validate headers for common issues.
   *
   * @returns Validation result
   */
  validate(): {
    valid: boolean;
    issues: Array<{ header: string; issue: string }>;
  };

  /**
   * Suggest missing headers for the context.
   *
   * @param context - Request context
   * @returns Suggested headers
   */
  suggest(context?: string): Array<{
    header: string;
    value: string;
    reason: string;
  }>;

  /**
   * Explain what these headers do.
   *
   * @returns Human-readable explanation
   */
  explain(): string;
}
```

---

## Implementation Notes

### Directory Structure

```
src/types/fetch/
├── index.ts           # Re-exports all public APIs
├── request.ts         # SemanticRequest class implementation
├── response.ts        # SemanticResponse class implementation
├── headers.ts         # SemanticHeaders class implementation
├── prompts.ts         # LLM prompt templates for all semantic operations
└── __tests__/
    ├── fetch.test.ts  # Comprehensive test suite (75 tests)
    └── mocks.ts       # Mock LLM client and response factories
```

### Design Decisions

1. **Composition over Inheritance**: Classes wrap the native `Request`, `Response`, and `Headers` types rather than extending them, providing better encapsulation and testability.

2. **Body Caching**: Both `SemanticRequest` and `SemanticResponse` cache the body text internally to allow multiple LLM operations without consuming the body stream.

3. **Dependency Injection**: All classes accept an optional LLM client interface for easy testing and mock injection.

4. **Type Assertions**: Used type assertions (`as Request`, `as Response`) for clone operations to handle type incompatibilities between Bun and Node.js type definitions.

5. **Async vs Sync Methods**:
   - `SemanticRequest.explain()`, `analyzeIntent()`, `validate()`, `validateSecurity()` are async
   - `SemanticResponse.semanticallyEquals()`, `analyze()`, `summarize()`, `validateContract()`, `interpretError()` are async
   - `SemanticHeaders.semanticallyEquals()`, `validate()`, `suggest()`, `explain()` are async
   - All native property accessors remain synchronous

### Prompt Architecture

Each semantic operation has a corresponding system prompt and user prompt template:
- System prompts define the LLM's role and context
- User prompts format the specific request/response/header data for analysis
- All prompts request JSON responses for structured parsing

### Testing Strategy

- 75 tests covering all three classes
- Mock LLM client factories for deterministic testing
- Tests verify both semantic methods and native API compatibility
- Integration tests verify cross-class workflows

### Type Compatibility

The implementation handles differences between Bun's Fetch API types and Node.js/undici types:
- `HeadersIterator` replaced with standard `IterableIterator`
- Request/Response-specific enums (`RequestCache`, `ResponseType`, etc.) simplified to `string` types
- Type assertions used where clone operations return incompatible types

### Usage Examples

```typescript
import { SemanticRequest, SemanticResponse, SemanticHeaders } from 'semantic-primitives';

// Create and analyze a request
const request = SemanticRequest.from('/api/users?role=admin', {
  method: 'GET',
  headers: { Authorization: 'Bearer token123' }
});

const intent = await request.analyzeIntent();
// { intent: "fetch admin users", operation: "READ", resource: "users", filters: [...] }

const security = await request.validateSecurity();
// { safe: true, issues: [], warnings: [] }

// Analyze a response
const response = await fetch('/api/users');
const semanticResponse = SemanticResponse.from(response);

const analysis = await semanticResponse.analyze();
// { dataType: "collection", entityType: "User", count: 25, pagination: { hasMore: true } }

// Work with headers
const headers = SemanticHeaders.from({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token'
});

const suggestions = await headers.suggest('API request');
// [{ header: 'Accept', value: 'application/json', reason: '...' }]
```
