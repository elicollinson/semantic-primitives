# SemanticNever

## Overview

The `SemanticNever` type wraps TypeScript's `never` with LLM-powered semantic understanding. It helps analyze unreachable code, validate exhaustive switches, and explain why code paths are impossible.

**Core Principle**: `never` represents impossible values - semantic operations should explain unreachability and validate exhaustiveness.

---

## Interface

```typescript
interface SemanticNever {
  /**
   * Check if a switch statement or conditional is exhaustive.
   *
   * @param type - The union type being checked
   * @param handledCases - Cases that are handled
   * @returns Exhaustiveness check result
   *
   * @example
   * SemanticNever.isExhaustive(
   *   "Status", // type Status = "pending" | "active" | "completed"
   *   ["pending", "active"]
   * )
   * // { exhaustive: false, missing: ["completed"] }
   */
  static isExhaustive(
    type: string,
    handledCases: string[]
  ): {
    exhaustive: boolean;
    missing: string[];
  };

  /**
   * Explain why a code path is unreachable (never).
   *
   * @param context - The code context
   * @returns Explanation of unreachability
   *
   * @example
   * SemanticNever.explainUnreachability("after throw statement")
   * // {
   * //   reason: "Code after a throw statement cannot execute",
   * //   type: "control-flow",
   * //   suggestion: "Remove dead code after throw"
   * // }
   */
  static explainUnreachability(context: string): {
    reason: string;
    type: "control-flow" | "type-narrowing" | "exhaustive-check" | "impossible-state";
    suggestion: string;
  };

  /**
   * Check if a code path is actually dead code.
   *
   * @param code - Code snippet or description
   * @param context - Surrounding context
   * @returns Dead code analysis
   *
   * @example
   * SemanticNever.isDeadCode("return statement after return", context)
   * // { isDead: true, reason: "First return already exits the function" }
   */
  static isDeadCode(
    code: string,
    context?: string
  ): {
    isDead: boolean;
    reason: string;
    safeToRemove: boolean;
  };

  /**
   * Suggest an exhaustive switch handler.
   *
   * @param typeName - The discriminated union type
   * @returns Suggested code
   *
   * @example
   * SemanticNever.suggestExhaustiveHandler("Status")
   * // {
   * //   code: "function assertNever(x: never): never { throw new Error(`Unexpected value: ${x}`); }",
   * //   usage: "default: return assertNever(status);"
   * // }
   */
  static suggestExhaustiveHandler(typeName: string): {
    code: string;
    usage: string;
  };

  /**
   * Validate that a function properly uses never for exhaustiveness.
   *
   * @param fnCode - Function code or description
   * @returns Validation result
   *
   * @example
   * SemanticNever.validateExhaustivenessCheck(switchFunction)
   * // { valid: true, covers: ["pending", "active", "completed"] }
   */
  static validateExhaustivenessCheck(fnCode: string): {
    valid: boolean;
    covers: string[];
    missing?: string[];
    suggestion?: string;
  };

  /**
   * Identify functions that should return never.
   *
   * @param fnName - Function name
   * @param behavior - Function behavior description
   * @returns Analysis
   *
   * @example
   * SemanticNever.shouldReturnNever("throwError", "throws an error")
   * // { shouldReturn: true, reason: "Function always throws, never returns normally" }
   */
  static shouldReturnNever(
    fnName: string,
    behavior: string
  ): {
    shouldReturn: boolean;
    reason: string;
  };

  /**
   * Explain the never type to developers.
   *
   * @param context - Usage context
   * @returns Educational explanation
   *
   * @example
   * SemanticNever.explain("in function return type")
   * // "A function returning 'never' will never complete normally..."
   */
  static explain(context?: string): string;

  /**
   * Detect impossible type intersections that result in never.
   *
   * @param types - Types being intersected
   * @returns Analysis of the intersection
   *
   * @example
   * SemanticNever.analyzeIntersection(["string", "number"])
   * // { resultsInNever: true, reason: "A value cannot be both string and number" }
   */
  static analyzeIntersection(types: string[]): {
    resultsInNever: boolean;
    reason: string;
  };

  /**
   * Common patterns where never is appropriate.
   *
   * @returns List of appropriate never patterns
   */
  static appropriatePatterns(): Array<{
    pattern: string;
    description: string;
    example: string;
  }>;
}
```

---

## Shared Types

The `SemanticNever` interface uses unique result types specific to exhaustiveness checking and dead code analysis. These are not yet available as shared types since they are specific to the `never` type semantics.

---

## Implementation Notes

### Design Decisions

1. **Static-only class**: Since `never` represents values that never occur (the bottom type), `SemanticNever` has no instances and all methods are static. The class uses a private constructor that throws if called. An eslint disable comment is used to acknowledge this intentional design pattern (`@typescript-eslint/no-extraneous-class`).

2. **All methods are async**: Every LLM-powered method is async and returns a Promise. The only exception is `appropriatePatterns()` which returns a static list of common never patterns without LLM involvement.

3. **Optional LLM client injection**: All methods accept an optional `LLMClient` parameter for dependency injection, enabling proper unit testing with mocks.

### File Structure

```
src/types/never/
├── index.ts         # Re-exports public API
├── never.ts         # Main class implementation with all static methods
├── prompts.ts       # LLM prompt templates for each operation
└── __tests__/
    ├── mocks.ts     # Mock utilities and predefined mock responses
    └── never.test.ts # Unit tests (43 tests, 127 expect calls)
```

### Exported Types

- `SemanticNever` - Main class with static methods
- `UnreachabilityType` - Union type for unreachability classification
- `ExhaustiveResult` - Result of exhaustiveness checking
- `UnreachabilityResult` - Result of unreachability explanation
- `DeadCodeResult` - Result of dead code analysis
- `ExhaustiveHandlerResult` - Suggested assertNever handler code
- `ValidateExhaustivenessResult` - Result of exhaustiveness validation
- `ShouldReturnNeverResult` - Result of should-return-never analysis
- `IntersectionAnalysisResult` - Result of type intersection analysis
- `NeverPattern` - Structure for appropriate never patterns

### Differences from Spec

1. All methods in the implementation are `async` and return `Promise<T>` whereas the spec shows synchronous signatures. This reflects the actual LLM-powered implementation.

2. The `appropriatePatterns()` method returns a static array and doesn't require LLM invocation, making it synchronous.

3. The `explain()` method returns `Promise<string>` (via LLM) rather than a plain `string`.

### Testing

- 43 unit tests covering all methods and prompts
- Uses mock LLM clients with predefined responses
- No actual LLM invocations in tests
- Tests verify both happy paths and edge cases
