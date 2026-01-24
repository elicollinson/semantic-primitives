# SemanticVoid

## Overview

The `SemanticVoid` type wraps TypeScript's `void` with LLM-powered semantic understanding. It helps analyze functions that return void, understand side effects, and validate proper usage.

**Core Principle**: `void` represents absence of return value - semantic operations should understand what the function does instead of returning and validate side effects.

---

## Interface

```typescript
interface SemanticVoid {
  /**
   * Analyze a void-returning function for its side effects.
   *
   * @param fn - Function to analyze
   * @returns Side effect analysis
   *
   * @example
   * SemanticVoid.analyzeSideEffects(saveToDatabase)
   * // {
   * //   hasSideEffects: true,
   * //   effects: ["database write", "logging"],
   * //   pure: false
   * // }
   */
  static analyzeSideEffects(fn: (...args: any[]) => void): {
    hasSideEffects: boolean;
    effects: string[];
    pure: boolean;
  };

  /**
   * Check if a function should actually return a value.
   *
   * @param fn - Function to analyze
   * @param context - Context about the function's purpose
   * @returns Analysis with recommendation
   *
   * @example
   * SemanticVoid.shouldReturnValue(processData, "data processing function")
   * // {
   * //   shouldReturn: true,
   * //   reason: "Processing functions typically return the processed result",
   * //   suggestedType: "ProcessedData"
   * // }
   */
  static shouldReturnValue(
    fn: (...args: any[]) => void,
    context?: string
  ): {
    shouldReturn: boolean;
    reason: string;
    suggestedType?: string;
  };

  /**
   * Explain what a void function does.
   *
   * @param fn - Function to explain
   * @returns Human-readable explanation
   *
   * @example
   * SemanticVoid.explain(sendNotification)
   * // "Sends a notification to the user without returning a result. Side effects: network request, logging."
   */
  static explain(fn: (...args: any[]) => void): string;

  /**
   * Validate that a void function is used appropriately.
   *
   * @param fn - Function to validate
   * @param usage - How the function is being used
   * @returns Validation result
   *
   * @example
   * SemanticVoid.validateUsage(logError, "in array.map()")
   * // {
   * //   appropriate: false,
   * //   reason: "Void functions in map() lose return value, use forEach() instead"
   * // }
   */
  static validateUsage(
    fn: (...args: any[]) => void,
    usage: string
  ): {
    appropriate: boolean;
    reason: string;
    suggestion?: string;
  };

  /**
   * Detect if a void function is missing error handling.
   *
   * @param fn - Function to analyze
   * @returns Error handling assessment
   *
   * @example
   * SemanticVoid.checkErrorHandling(saveData)
   * // {
   * //   hasErrorHandling: false,
   * //   risks: ["Database errors will be silently ignored"],
   * //   recommendation: "Add try-catch or return Promise to propagate errors"
   * // }
   */
  static checkErrorHandling(fn: (...args: any[]) => void): {
    hasErrorHandling: boolean;
    risks: string[];
    recommendation: string;
  };

  /**
   * Suggest a better signature for a void function.
   *
   * @param fn - Function to analyze
   * @returns Suggested improvements
   *
   * @example
   * SemanticVoid.suggestSignature(updateUser)
   * // {
   * //   current: "(user: User) => void",
   * //   suggested: "(user: User) => Promise<void>",
   * //   reason: "Async operations should return Promise for error handling"
   * // }
   */
  static suggestSignature(fn: (...args: any[]) => void): {
    current: string;
    suggested: string;
    reason: string;
  };

  /**
   * List common patterns where void is appropriate.
   *
   * @returns List of appropriate void patterns
   *
   * @example
   * SemanticVoid.appropriatePatterns()
   * // ["event handlers", "cleanup functions", "logging", "side-effect-only callbacks"]
   */
  static appropriatePatterns(): string[];

  /**
   * Check if void is the correct return type for a function name.
   *
   * @param fnName - Function name to analyze
   * @returns Appropriateness assessment
   *
   * @example
   * SemanticVoid.isAppropriateFor("calculateTotal")
   * // { appropriate: false, reason: "Functions starting with 'calculate' should return a value" }
   *
   * SemanticVoid.isAppropriateFor("logMessage")
   * // { appropriate: true, reason: "Logging functions are typically void" }
   */
  static isAppropriateFor(fnName: string): {
    appropriate: boolean;
    reason: string;
  };
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `validateUsage()` | `{ appropriate: boolean; reason: string; suggestion?: string }` | `AppropriateResult` (extended) |
| `isAppropriateFor()` | `{ appropriate: boolean; reason: string }` | `AppropriateResult` |

Import shared types:
```typescript
import { AppropriateResult } from '../../shared/types.ts';
```
