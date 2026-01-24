# SemanticError

## Overview

The `SemanticError` type extends the native JavaScript Error with LLM-powered semantic understanding. It enables intelligent error classification, suggests fixes, and provides human-readable explanations.

**Core Principle**: Errors represent failure states with meaning - semantic operations should understand root causes, suggest fixes, and explain errors clearly.

---

## Interface

```typescript
interface SemanticError extends Error {
  /**
   * Create a SemanticError from any error-like value.
   *
   * @param error - Error object, string, or unknown value
   * @param context - Additional context
   * @returns SemanticError instance
   *
   * @example
   * SemanticError.from(caughtError)
   * SemanticError.from("Connection failed", { service: "database" })
   */
  static from(error: unknown, context?: Record<string, unknown>): SemanticError;

  /**
   * Check if two errors are semantically equivalent.
   * Same root cause despite different messages.
   *
   * @param other - Error to compare
   * @returns Equivalence result
   *
   * @example
   * error1.semanticallyEquals(error2)
   * // { equivalent: true, reason: "Both are network timeout errors" }
   */
  semanticallyEquals(other: Error): {
    equivalent: boolean;
    reason: string;
    confidence: number;
  };

  /**
   * Classify the error into a category.
   *
   * @returns Error classification
   *
   * @example
   * error.classify()
   * // {
   * //   category: "network",
   * //   subcategory: "timeout",
   * //   severity: "recoverable",
   * //   retryable: true
   * // }
   */
  classify(): {
    category: string;
    subcategory?: string;
    severity: "critical" | "recoverable" | "warning";
    retryable: boolean;
  };

  /**
   * Explain the error in plain language.
   *
   * @param audience - Target audience
   * @returns Human-readable explanation
   *
   * @example
   * error.explain("end-user")
   * // "We couldn't connect to the server. Please check your internet connection."
   *
   * error.explain("developer")
   * // "ECONNREFUSED on port 5432. The PostgreSQL server may not be running."
   */
  explain(audience?: "end-user" | "developer" | "support"): string;

  /**
   * Suggest fixes for the error.
   *
   * @returns Suggested fixes
   *
   * @example
   * error.suggestFixes()
   * // [
   * //   { fix: "Check database connection string", confidence: 0.9 },
   * //   { fix: "Ensure PostgreSQL service is running", confidence: 0.85 }
   * // ]
   */
  suggestFixes(): Array<{ fix: string; confidence: number; code?: string }>;

  /**
   * Infer the root cause of the error.
   *
   * @returns Root cause analysis
   *
   * @example
   * error.inferRootCause()
   * // { cause: "Database connection pool exhausted", confidence: 0.87 }
   */
  inferRootCause(): { cause: string; confidence: number };

  /**
   * Check if this error matches a known pattern.
   *
   * @param pattern - Error pattern to check
   * @returns Match result
   *
   * @example
   * error.matches("network-related")
   * error.matches("authentication-failure")
   */
  matches(pattern: string): boolean;

  /**
   * Get related documentation or resources.
   *
   * @returns Related resources
   *
   * @example
   * error.getResources()
   * // [{ title: "Troubleshooting Connection Issues", type: "docs" }]
   */
  getResources(): Array<{ title: string; type: string; url?: string }>;

  /**
   * Determine if this error should be reported/logged.
   *
   * @returns Reporting recommendation
   *
   * @example
   * error.shouldReport()
   * // { report: true, reason: "Unexpected server error", priority: "high" }
   */
  shouldReport(): { report: boolean; reason: string; priority?: string };

  /**
   * Get a recovery strategy for this error.
   *
   * @returns Recovery strategy
   *
   * @example
   * error.recoveryStrategy()
   * // { strategy: "retry", maxAttempts: 3, backoff: "exponential" }
   */
  recoveryStrategy(): {
    strategy: "retry" | "fallback" | "abort" | "ignore";
    maxAttempts?: number;
    backoff?: string;
  };

  /**
   * Get the semantic severity level.
   *
   * @returns Severity assessment
   */
  getSeverity(): "critical" | "error" | "warning" | "info";
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; reason: string; confidence: number }` | `SemanticEqualsResultWithReason` |
| `classify()` | `{ category: string; subcategory?: string; ... }` | `ClassifyResult` (extended) |
| `suggestFixes()` | `Array<{ fix: string; confidence: number; code?: string }>` | `SuggestedFix[]` |
| `inferRootCause()` | `{ cause: string; confidence: number }` | `RootCauseResult` |
| `recoveryStrategy()` | `{ strategy: "retry" \| "fallback" \| ...; ... }` | `RecoveryStrategy` |
| `getSeverity()` | `"critical" \| "error" \| "warning" \| "info"` | `ErrorSeverityLevel` |

Import shared types:
```typescript
import {
  SemanticEqualsResultWithReason,
  ClassifyResult,
  SuggestedFix,
  RootCauseResult,
  RecoveryStrategy,
  ErrorSeverityLevel
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

```
src/types/error/
├── index.ts          # Re-exports public API
├── error.ts          # Main SemanticError class implementation
├── prompts.ts        # LLM prompt templates
└── __tests__/
    ├── error.test.ts # Comprehensive unit tests
    └── mocks.ts      # Mock LLM client utilities
```

### Key Implementation Decisions

1. **Async Methods**: All LLM-powered methods (`classify()`, `explain()`, `suggestFixes()`, `inferRootCause()`, `matches()`, `getResources()`, `shouldReport()`, `recoveryStrategy()`, `getSeverity()`) are implemented as async methods that return Promises, since they require LLM API calls.

2. **Classification Caching**: The `classify()` result is cached on the instance to avoid redundant LLM calls, since classification is often used by other methods like `recoveryStrategy()`.

3. **Error Inheritance**: `SemanticError` extends the native `Error` class, preserving full compatibility with JavaScript error handling including stack traces.

4. **Context Propagation**: The optional `context` parameter in `from()` is stored and passed to LLM prompts to provide additional information for better analysis.

5. **Immutable Context**: The `getContext()` method returns a copy of the context object to prevent external mutation.

6. **Interface Updates**: The `SemanticErrorType` interface in `src/shared/interfaces.ts` was updated to support async return types for LLM-powered methods.

### Prompt Design

The prompts follow best practices:
- Clear system prompt establishing the AI role as an error analyst
- Structured JSON output format specified in each prompt
- Audience-specific guidelines for the `explain()` method
- Pattern matching guidance with common error categories

### Testing

- 45 unit tests covering all public methods
- Mock LLM client utilities for deterministic testing without actual API calls
- Tests for edge cases including unknown error types and empty contexts
