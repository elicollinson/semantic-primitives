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
