# SemanticPromise

## Overview

The `SemanticPromise<T>` type extends the native JavaScript Promise with LLM-powered semantic understanding. It enables intelligent error handling, meaningful timeout messages, and operation descriptions.

**Core Principle**: Promises represent async operations with outcomes - semantic operations should understand what's happening, why it might fail, and how to handle results.

---

## Interface

```typescript
interface SemanticPromise<T> extends Promise<T> {
  /**
   * Create a SemanticPromise from a regular Promise.
   *
   * @param promise - Promise to wrap
   * @param description - Description of what the promise does
   * @returns SemanticPromise instance
   *
   * @example
   * SemanticPromise.from(fetch(url), "fetching user data")
   */
  static from<T>(promise: Promise<T>, description?: string): SemanticPromise<T>;

  /**
   * Check if two promises resolve to semantically equivalent values.
   *
   * @param other - Promise to compare
   * @returns Equivalence result (after both resolve)
   *
   * @example
   * promise1.semanticallyEquals(promise2)
   * // { equivalent: true, confidence: 0.9 }
   */
  semanticallyEquals(other: Promise<unknown>): Promise<{
    equivalent: boolean;
    confidence: number;
  }>;

  /**
   * Add timeout with meaningful error message.
   *
   * @param ms - Timeout in milliseconds
   * @param context - Context for error message
   * @returns Promise that rejects with semantic error on timeout
   *
   * @example
   * apiCall.timeout(5000, "database connection")
   * // Throws SemanticError: "Database connection timed out after 5 seconds"
   */
  timeout(ms: number, context?: string): SemanticPromise<T>;

  /**
   * Handle errors with semantic understanding.
   *
   * @param handler - Error handler with semantic error
   * @returns Promise with error handling
   *
   * @example
   * promise.catchSemantic((error) => {
   *   console.log(error.explain("end-user"));
   *   return error.suggestFixes();
   * })
   */
  catchSemantic<U>(
    handler: (error: SemanticError) => U | Promise<U>
  ): SemanticPromise<T | U>;

  /**
   * Explain what operation this promise represents.
   *
   * @returns Operation description
   *
   * @example
   * promise.explain()
   * // "Fetching user profile from /api/users/123"
   */
  explain(): string;

  /**
   * Get the current status with semantic description.
   *
   * @returns Status information
   *
   * @example
   * promise.status()
   * // { state: "pending", description: "Waiting for API response", elapsed: "2.3s" }
   */
  status(): {
    state: "pending" | "fulfilled" | "rejected";
    description: string;
    elapsed?: string;
  };

  /**
   * Add semantic retry logic.
   *
   * @param options - Retry options
   * @returns Promise with retry behavior
   *
   * @example
   * apiCall.retry({
   *   maxAttempts: 3,
   *   when: "network error or timeout",
   *   backoff: "exponential"
   * })
   */
  retry(options: {
    maxAttempts: number;
    when?: string;
    backoff?: "linear" | "exponential" | "fixed";
  }): SemanticPromise<T>;

  /**
   * Transform the result with semantic understanding.
   *
   * @param instruction - Natural language transformation
   * @returns Transformed promise
   *
   * @example
   * userPromise.transform("extract just the name and email")
   */
  transform<U>(instruction: string): SemanticPromise<U>;

  /**
   * Validate the result against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Promise that rejects if validation fails
   *
   * @example
   * response.validateResult(["should contain user data", "email must be valid"])
   */
  validateResult(rules: string[]): SemanticPromise<T>;

  /**
   * Provide a fallback with semantic matching.
   *
   * @param fallback - Fallback value or function
   * @param when - When to use fallback
   * @returns Promise with fallback
   *
   * @example
   * userPromise.fallback(defaultUser, "when user not found")
   */
  fallback<U>(fallback: U | (() => U), when?: string): SemanticPromise<T | U>;

  /**
   * Log progress with semantic descriptions.
   *
   * @param logger - Logger function
   * @returns Same promise with logging
   *
   * @example
   * promise.withLogging(console.log)
   * // Logs: "Starting: fetch user data"
   * // Logs: "Completed: fetch user data (245ms)"
   */
  withLogging(logger: (message: string) => void): SemanticPromise<T>;

  /**
   * Infer what this promise is likely doing.
   *
   * @returns Inferred operation type
   *
   * @example
   * promise.inferOperation()
   * // { operation: "api-call", resource: "user", action: "read" }
   */
  inferOperation(): { operation: string; resource?: string; action?: string };
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `Promise<{ equivalent: boolean; confidence: number }>` | `Promise<SemanticEqualsResult>` |

Import shared types:
```typescript
import { SemanticEqualsResult } from '../../shared/types.ts';
```

---

## Implementation Notes

### Architecture

The `SemanticPromise<T>` class is implemented in `src/types/promise/promise.ts` and follows the same patterns as other semantic types in the library. Key design decisions:

1. **PromiseLike Implementation**: Implements `PromiseLike<T>` interface with `then()`, `catch()`, and `finally()` methods that return `SemanticPromise<T>` for chainability.

2. **Symbol.toStringTag**: Includes `[Symbol.toStringTag] = 'SemanticPromise'` for proper Promise compatibility with type checking.

3. **State Tracking**: Maintains internal state (`_state`, `_resolvedValue`) to support `status()` method without additional async operations.

4. **LLM Client Injection**: Accepts optional `LLMClient` for dependency injection, defaulting to the global client for ease of use.

### Implementation Details

| Method | Implementation Approach |
|--------|------------------------|
| `from()` | Static factory method, returns existing instance if already SemanticPromise |
| `semanticallyEquals()` | Waits for both promises, then uses LLM to compare resolved values |
| `timeout()` | Uses `Promise.race()` with a timeout promise that generates semantic error messages |
| `catchSemantic()` | Wraps errors with `SemanticError` and provides `SemanticErrorAnalysis` |
| `retry()` | Iterates with configurable backoff, uses LLM to determine if error matches retry condition |
| `transform()` | Chains `.then()` with LLM-powered transformation of resolved value |
| `validateResult()` | Chains validation check, throws `ValidationError` if rules not satisfied |
| `fallback()` | Uses LLM to determine if error matches fallback condition |
| `withLogging()` | Injects logging at start, completion, and error phases |
| `inferOperation()` | Synchronous description-based inference; `inferOperationAsync()` for LLM-powered inference |

### Additional Methods

Beyond the spec, the implementation includes:
- `resolve()` and `reject()` static methods for creating pre-resolved/rejected SemanticPromises
- `toPromise()` to get the underlying native Promise
- `getDescription()` to retrieve the description
- `inferOperationAsync()` for LLM-powered operation inference (async version)

### Testing

Tests are located in `src/types/promise/__tests__/promise.test.ts` with mock LLM clients in `mocks.ts`. All LLM calls are mocked to avoid actual API calls during unit testing. Tests cover:
- All public methods and static factories
- Error handling paths
- Promise chaining behavior
- State tracking
- Prompt generation

### File Structure

```
src/types/promise/
├── promise.ts          # Main SemanticPromise class
├── prompts.ts          # LLM prompt templates
├── index.ts            # Module exports
└── __tests__/
    ├── promise.test.ts # Unit tests
    └── mocks.ts        # Mock LLM clients and responses
```
