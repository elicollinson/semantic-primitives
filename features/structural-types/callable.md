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
