# SemanticFunction

## Overview

The `SemanticFunction` type wraps JavaScript functions with LLM-powered semantic understanding. It enables function description, parameter validation, and intelligent behavior analysis.

**Core Principle**: Functions represent callable behavior with intent - semantic operations should understand what functions do, validate inputs meaningfully, and explain behavior.

---

## Interface

```typescript
interface SemanticFunction<T extends (...args: any[]) => any> {
  /**
   * Wrap a function with semantic capabilities.
   *
   * @param fn - Function to wrap
   * @param description - Optional description of what the function does
   * @returns SemanticFunction wrapper
   *
   * @example
   * const add = SemanticFunction.from((a: number, b: number) => a + b, "Adds two numbers")
   */
  static from<T extends (...args: any[]) => any>(
    fn: T,
    description?: string
  ): SemanticFunction<T>;

  /**
   * Check if two functions are semantically equivalent.
   * Same behavior despite different implementations.
   *
   * @param other - Function to compare
   * @param testInputs - Inputs to test with
   * @returns Equivalence result
   *
   * @example
   * fn1.semanticallyEquals(fn2, [[1, 2], [5, 10], [0, 0]])
   * // { equivalent: true, confidence: 0.95 }
   */
  semanticallyEquals(
    other: Function,
    testInputs?: unknown[][]
  ): { equivalent: boolean; confidence: number };

  /**
   * Explain what the function does in plain language.
   *
   * @returns Function explanation
   *
   * @example
   * fn.explain()
   * // "Takes two numbers and returns their sum. Handles edge cases like NaN."
   */
  explain(): string;

  /**
   * Validate arguments against semantic rules.
   *
   * @param args - Arguments to validate
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * sendEmail.validateArgs([email, subject, body], [
   *   "first argument must be a valid email",
   *   "subject should not be empty"
   * ])
   */
  validateArgs(
    args: unknown[],
    rules?: string[]
  ): { valid: boolean; issues: string[] };

  /**
   * Infer the purpose/category of this function.
   *
   * @returns Inferred purpose
   *
   * @example
   * fn.inferPurpose()
   * // { purpose: "data-transformation", category: "array-manipulation" }
   */
  inferPurpose(): { purpose: string; category: string; confidence: number };

  /**
   * Generate documentation for the function.
   *
   * @param format - Documentation format
   * @returns Generated documentation
   *
   * @example
   * fn.generateDocs("jsdoc")
   * // "/**\n * Adds two numbers together\n * @param a - First number\n * ..."
   */
  generateDocs(format?: "jsdoc" | "markdown" | "plain"): string;

  /**
   * Suggest improvements for the function.
   *
   * @returns Suggested improvements
   *
   * @example
   * fn.suggestImprovements()
   * // [{ suggestion: "Add input validation", reason: "Function may throw on invalid input" }]
   */
  suggestImprovements(): Array<{ suggestion: string; reason: string }>;

  /**
   * Detect potential issues with the function.
   *
   * @returns Detected issues
   *
   * @example
   * fn.detectIssues()
   * // [{ issue: "No error handling", severity: "warning" }]
   */
  detectIssues(): Array<{ issue: string; severity: string }>;

  /**
   * Generate test cases for the function.
   *
   * @returns Generated test cases
   *
   * @example
   * fn.generateTests()
   * // [
   * //   { input: [1, 2], expectedOutput: 3, description: "basic addition" },
   * //   { input: [0, 0], expectedOutput: 0, description: "zero case" }
   * // ]
   */
  generateTests(): Array<{
    input: unknown[];
    expectedOutput: unknown;
    description: string;
  }>;

  /**
   * Check if the function is safe to call with given arguments.
   *
   * @param args - Arguments to check
   * @returns Safety assessment
   *
   * @example
   * fn.isSafeToCall([userInput])
   * // { safe: false, reason: "Input contains potential injection" }
   */
  isSafeToCall(args: unknown[]): { safe: boolean; reason?: string };

  /**
   * Call the underlying function.
   *
   * @param args - Arguments to pass
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
