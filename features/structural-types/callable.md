# SemanticCallable

## Overview

The `SemanticCallable` type wraps TypeScript callable signatures with LLM-powered semantic understanding. It enables behavioral analysis, signature inference, and intelligent function type validation.

**Core Principle**: Callable types represent function contracts - semantic operations should understand what functions do, validate signatures, and explain behavior.

---

## Interface

```typescript
interface SemanticCallable<T extends (...args: any[]) => any> {
  /**
   * Wrap a function with semantic callable capabilities.
   *
   * @param fn - Function to wrap
   * @param description - Optional description
   * @returns SemanticCallable wrapper
   *
   * @example
   * SemanticCallable.from(calculateTotal, "calculates order total")
   */
  static from<T extends (...args: any[]) => any>(
    fn: T,
    description?: string
  ): SemanticCallable<T>;

  /**
   * Check if two callables are behaviorally equivalent.
   * Same outputs for same inputs, regardless of implementation.
   *
   * @param other - Callable to compare
   * @param testCases - Inputs to test with
   * @returns Equivalence result
   *
   * @example
   * fn1.semanticallyEquals(fn2, [[1, 2], [3, 4]])
   * // { equivalent: true, confidence: 0.95 }
   */
  semanticallyEquals(
    other: (...args: Parameters<T>) => ReturnType<T>,
    testCases?: Parameters<T>[]
  ): { equivalent: boolean; confidence: number };

  /**
   * Explain what this callable does.
   *
   * @returns Human-readable explanation
   *
   * @example
   * fn.explain()
   * // "Takes two numbers and returns their sum, handling NaN edge cases"
   */
  explain(): string;

  /**
   * Infer parameter types from usage patterns.
   *
   * @param sampleCalls - Sample inputs
   * @returns Inferred signature
   *
   * @example
   * fn.inferSignature([[1, 2], ["a", "b"], [true, false]])
   * // { params: ["number | string | boolean", "number | string | boolean"], return: "..." }
   */
  inferSignature(sampleCalls: Parameters<T>[]): {
    params: string[];
    return: string;
    confidence: number;
  };

  /**
   * Generate TypeScript type definition for this callable.
   *
   * @returns Type definition string
   *
   * @example
   * fn.generateTypeDefinition()
   * // "type Calculator = (a: number, b: number) => number;"
   */
  generateTypeDefinition(): string;

  /**
   * Validate inputs against semantic rules.
   *
   * @param args - Arguments to validate
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * divide.validateArgs([10, 0], ["divisor must not be zero"])
   * // { valid: false, issues: ["divisor is zero"] }
   */
  validateArgs(
    args: Parameters<T>,
    rules?: string[]
  ): { valid: boolean; issues: string[] };

  /**
   * Generate test cases for this callable.
   *
   * @returns Generated test cases
   *
   * @example
   * fn.generateTests()
   * // [
   * //   { inputs: [0, 0], expectedOutput: 0, description: "zero case" },
   * //   { inputs: [1, -1], expectedOutput: 0, description: "opposite numbers" }
   * // ]
   */
  generateTests(): Array<{
    inputs: Parameters<T>;
    expectedOutput: ReturnType<T>;
    description: string;
  }>;

  /**
   * Suggest type-safe wrapper or decorator.
   *
   * @returns Suggested wrapper code
   *
   * @example
   * fn.suggestWrapper()
   * // { code: "function safeDivide(a: number, b: number): number | null { ... }" }
   */
  suggestWrapper(): {
    code: string;
    reason: string;
  };

  /**
   * Detect potential issues with the callable.
   *
   * @returns Detected issues
   *
   * @example
   * fn.detectIssues()
   * // [{ issue: "No null check for optional param", severity: "warning" }]
   */
  detectIssues(): Array<{
    issue: string;
    severity: "info" | "warning" | "error";
  }>;

  /**
   * Check if the callable is safe to call with given arguments.
   *
   * @param args - Arguments to check
   * @returns Safety assessment
   */
  isSafeToCall(args: Parameters<T>): {
    safe: boolean;
    reason?: string;
  };

  /**
   * Call the underlying function.
   *
   * @param args - Arguments
   * @returns Function result
   */
  call(...args: Parameters<T>): ReturnType<T>;

  /**
   * Get the underlying function.
   *
   * @returns Original function
   */
  valueOf(): T;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number }` | `SemanticEqualsResult` |
| `validateArgs()` | `{ valid: boolean; issues: string[] }` | `ValidateResult` |
| `generateTests()` | `Array<{ inputs: ...; expectedOutput: ...; description: string }>` | `GeneratedTestCase[]` |
| `detectIssues()` | `Array<{ issue: string; severity: "info" \| "warning" \| "error" }>` | `DetectedIssue[]` |
| `isSafeToCall()` | `{ safe: boolean; reason?: string }` | `SafetyResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  ValidateResult,
  GeneratedTestCase,
  DetectedIssue,
  SafetyResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

The implementation follows the library's established directory organization:

```
src/types/callable/
├── index.ts          # Re-exports public API
├── callable.ts       # Main SemanticCallable class
├── prompts.ts        # LLM prompt templates
└── __tests__/
    ├── callable.test.ts  # Unit tests (43 tests)
    └── mocks.ts          # Mock utilities for testing
```

### Key Implementation Details

1. **Function Source Analysis**: Uses `Function.prototype.toString()` to get the function source code for LLM analysis. The source is cached after first access for performance.

2. **Type Safety**: The class uses TypeScript generics (`SemanticCallable<T extends (...args: never[]) => unknown>`) to preserve type information for parameters and return values.

3. **All LLM Methods Are Async**: Unlike the spec which shows synchronous signatures, all LLM-powered methods (`semanticallyEquals`, `explain`, `inferSignature`, etc.) are implemented as async methods returning Promises. This is consistent with other semantic types in the library.

4. **Additional Utility Methods**: The implementation includes helper methods not in the spec:
   - `getDescription()`: Returns the optional description provided at creation
   - `getName()`: Returns the function's name (or 'anonymous' for unnamed functions)
   - `getArity()`: Returns the number of expected parameters

5. **Custom Types**: The implementation defines additional types:
   - `InferredSignature`: Result type for `inferSignature()`
   - `WrapperSuggestion`: Result type for `suggestWrapper()`
   - `CallableTestCase<TInput, TOutput>`: Typed test case for `generateTests()`

6. **suggestWrapper() Integration**: The `suggestWrapper()` method first calls `detectIssues()` internally to provide context for the wrapper suggestion.

7. **Re-wrapping Prevention**: If `SemanticCallable.from()` is called with an existing SemanticCallable, it returns the same instance.

### Shared Types Usage

The implementation uses the following shared types from `src/shared/types.ts`:
- `SemanticEqualsResult` for `semanticallyEquals()`
- `ValidateResult` for `validateArgs()`
- `DetectedIssue` for `detectIssues()`
- `SafetyResult` for `isSafeToCall()`

Note: `GeneratedTestCase` was not used as a custom `CallableTestCase` type was defined to provide better TypeScript inference.

### Export Configuration

The module is exported from:
- `src/types/callable/index.ts` (module level)
- `src/types/index.ts` (types collection)
- `src/index.ts` (library root)

### Test Coverage

43 unit tests covering:
- Factory method (`from`)
- Core methods (`call`, `valueOf`, `getName`, `getArity`, `getDescription`)
- Semantic comparison (`semanticallyEquals`)
- LLM operations (`explain`, `inferSignature`, `generateTypeDefinition`)
- Validation (`validateArgs`, `isSafeToCall`)
- Code generation (`generateTests`, `suggestWrapper`)
- Issue detection (`detectIssues`)
- Prompt template tests
