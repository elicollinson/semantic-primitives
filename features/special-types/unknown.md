# SemanticUnknown

## Overview

The `SemanticUnknown` type wraps TypeScript's `unknown` with LLM-powered semantic understanding. It helps safely narrow unknown values to proper types through intelligent inference and validation.

**Core Principle**: `unknown` represents type-safe uncertainty - semantic operations should help infer types and generate proper type guards.

---

## Interface

```typescript
interface SemanticUnknown {
  /**
   * Wrap an unknown value with semantic capabilities.
   *
   * @param value - The unknown value
   * @param context - Optional context about the value's source
   * @returns SemanticUnknown wrapper
   *
   * @example
   * SemanticUnknown.from(JSON.parse(data), { source: "API response" })
   */
  static from(value: unknown, context?: { source?: string }): SemanticUnknown;

  /**
   * Infer the most likely type of this unknown value.
   *
   * @returns Type inference with confidence
   *
   * @example
   * SemanticUnknown.from({ id: 1, name: "test" }).inferType()
   * // {
   * //   type: "object",
   * //   shape: "{ id: number; name: string }",
   * //   confidence: 0.95
   * // }
   */
  inferType(): {
    type: "string" | "number" | "boolean" | "object" | "array" | "null" | "undefined" | "function";
    shape?: string;
    confidence: number;
  };

  /**
   * Suggest possible TypeScript types this value could be.
   *
   * @param limit - Maximum number of suggestions
   * @returns Type suggestions ranked by likelihood
   *
   * @example
   * unknownValue.suggestTypes(3)
   * // [
   * //   { type: "User", confidence: 0.9, reason: "Has typical user fields" },
   * //   { type: "{ name: string; email: string }", confidence: 0.85 }
   * // ]
   */
  suggestTypes(limit?: number): Array<{
    type: string;
    confidence: number;
    reason?: string;
  }>;

  /**
   * Validate the value has a specific shape.
   *
   * @param description - Natural language description of expected shape
   * @returns Validation result
   *
   * @example
   * unknownValue.validateShape("user object with name and email")
   * // { matches: true, missingFields: [], extraFields: ["age"] }
   */
  validateShape(description: string): {
    matches: boolean;
    missingFields: string[];
    extraFields: string[];
  };

  /**
   * Generate a type guard function for this value's inferred type.
   *
   * @returns Generated type guard code
   *
   * @example
   * unknownValue.generateTypeGuard()
   * // {
   * //   code: "function isUser(x: unknown): x is User { ... }",
   * //   typeName: "User"
   * // }
   */
  generateTypeGuard(): {
    code: string;
    typeName: string;
  };

  /**
   * Safely access a property with semantic understanding.
   *
   * @param path - Property path or semantic description
   * @returns Wrapped property value or undefined
   *
   * @example
   * unknownValue.safeAccess("user's email address")
   * // SemanticUnknown containing the email, or undefined
   */
  safeAccess(path: string): SemanticUnknown | undefined;

  /**
   * Check if the value matches a semantic description.
   *
   * @param description - Description of what the value should be
   * @returns Match result
   *
   * @example
   * unknownValue.matches("array of user objects")
   * // { matches: true, confidence: 0.92 }
   */
  matches(description: string): { matches: boolean; confidence: number };

  /**
   * Narrow the unknown to a specific type with validation.
   *
   * @param typeName - Name of the expected type
   * @param validator - Optional custom validation rules
   * @returns Narrowed value or error
   *
   * @example
   * unknownValue.narrowTo("User", ["must have email", "id must be positive"])
   */
  narrowTo<T>(
    typeName: string,
    validator?: string[]
  ): { success: true; value: T } | { success: false; errors: string[] };

  /**
   * Explain what this unknown value appears to be.
   *
   * @returns Human-readable explanation
   *
   * @example
   * unknownValue.explain()
   * // "This appears to be a user profile object with personal information..."
   */
  explain(): string;

  /**
   * Get the underlying unknown value.
   *
   * @returns The wrapped value
   */
  valueOf(): unknown;

  /**
   * Check if the value is "empty" (null, undefined, empty string/array/object).
   *
   * @returns Whether the value is semantically empty
   */
  isEmpty(): boolean;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `inferType()` | `{ type: string; shape?: string; confidence: number }` | `InferTypeResult` (extended) |
| `suggestTypes()` | `Array<{ type: string; confidence: number; reason?: string }>` | `ConfidenceResult[]` (extended) |
| `matches()` | `{ matches: boolean; confidence: number }` | `ConfidenceResult` (extended) |

Import shared types:
```typescript
import {
  InferTypeResult,
  ConfidenceResult
} from '../../shared/types.ts';
```
