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

---

## Implementation Notes

### Location
- Implementation: `src/primitives/void/`
- Main class: `src/primitives/void/void.ts`
- Prompts: `src/primitives/void/prompts.ts`
- Tests: `src/primitives/void/__tests__/`

### Design Decisions

1. **Static-only class**: `SemanticVoid` uses only static methods since void cannot be instantiated as a value. This mirrors patterns like `Math` or `JSON` in JavaScript. An ESLint disable comment is used for the `@typescript-eslint/no-extraneous-class` rule.

2. **Function type**: The `VoidFunction` type alias uses `(...args: any[]) => void` to allow flexible function signatures to be passed for analysis. This is necessary because `unknown[]` is too restrictive for contravariant function parameters.

3. **Function source analysis**: All methods that analyze functions use `fn.toString()` to extract the function's source code for LLM analysis. This works for most JavaScript functions but may not work correctly for native/built-in functions.

4. **appropriatePatterns()**: This is the only synchronous method as it returns a static list of common void patterns without requiring LLM analysis.

5. **Shared types**: Uses `AppropriateResult` from shared types for `isAppropriateFor()`. The `ValidateUsageResult` extends the pattern with an optional `suggestion` field.

### Exported Types
- `SemanticVoid` - Main class with static methods
- `VoidFunction` - Type alias for void-returning functions
- `AnalyzeSideEffectsResult` - Result of side effect analysis
- `ShouldReturnValueResult` - Result of return value recommendation
- `ValidateUsageResult` - Result of usage validation
- `CheckErrorHandlingResult` - Result of error handling check
- `SuggestSignatureResult` - Result of signature suggestions
- `AppropriateResult` - Re-exported from shared types

### Test Coverage
- 37 unit tests covering all 8 methods
- Tests use mocked LLM clients for deterministic results
- Includes tests for prompts to verify they contain expected content
