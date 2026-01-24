# SemanticAny

## Overview

The `SemanticAny` type wraps TypeScript's `any` with LLM-powered semantic understanding. It helps reason about untyped values, suggest proper types, and manage the transition from `any` to properly typed code.

**Core Principle**: `any` represents intentional type escape - semantic operations should understand why `any` is used and help migrate to proper types.

---

## Interface

```typescript
interface SemanticAny {
  /**
   * Wrap an `any` value with semantic capabilities.
   *
   * @param value - The any-typed value
   * @param context - Context about where this any came from
   * @returns SemanticAny wrapper
   *
   * @example
   * SemanticAny.from(unknownData, { source: "legacy API response" })
   */
  static from(value: any, context?: { source?: string; reason?: string }): SemanticAny;

  /**
   * Classify the intent behind using `any` here.
   *
   * @returns Intent classification
   *
   * @example
   * anyValue.classifyIntent()
   * // {
   * //   intent: "escape-hatch",
   * //   reason: "Interfacing with untyped library",
   * //   risk: "medium"
   * // }
   */
  classifyIntent(): {
    intent: "escape-hatch" | "lazy" | "necessary" | "migration" | "unknown";
    reason: string;
    risk: "low" | "medium" | "high";
  };

  /**
   * Suggest a proper TypeScript type for this value.
   *
   * @returns Type suggestion with confidence
   *
   * @example
   * SemanticAny.from({ name: "John", age: 30 }).suggestType()
   * // {
   * //   type: "{ name: string; age: number }",
   * //   interface: "interface User { name: string; age: number; }",
   * //   confidence: 0.95
   * // }
   */
  suggestType(): {
    type: string;
    interface?: string;
    confidence: number;
  };

  /**
   * Assess the risk of using `any` for this value.
   *
   * @returns Risk assessment
   *
   * @example
   * anyValue.assessRisk()
   * // {
   * //   level: "high",
   * //   reasons: ["Value is used in security-sensitive context"],
   * //   recommendations: ["Define explicit type", "Add runtime validation"]
   * // }
   */
  assessRisk(): {
    level: "low" | "medium" | "high";
    reasons: string[];
    recommendations: string[];
  };

  /**
   * Generate migration code to replace `any` with proper types.
   *
   * @param options - Migration options
   * @returns Migration suggestions
   *
   * @example
   * anyValue.generateMigration()
   * // {
   * //   typeDefinition: "interface ApiResponse { ... }",
   * //   typeGuard: "function isApiResponse(x: unknown): x is ApiResponse { ... }",
   * //   usage: "const data: ApiResponse = response as ApiResponse;"
   * // }
   */
  generateMigration(options?: { strict?: boolean }): {
    typeDefinition: string;
    typeGuard?: string;
    usage: string;
  };

  /**
   * Validate the value at runtime with inferred rules.
   *
   * @returns Validation result
   *
   * @example
   * anyValue.validate()
   * // { valid: true, inferredShape: "{ name: string, ... }" }
   */
  validate(): {
    valid: boolean;
    issues?: string[];
    inferredShape: string;
  };

  /**
   * Check if the value is safe to use in a specific context.
   *
   * @param context - Usage context
   * @returns Safety assessment
   *
   * @example
   * anyValue.isSafeFor("DOM manipulation")
   * // { safe: false, reason: "Contains user input, potential XSS" }
   */
  isSafeFor(context: string): { safe: boolean; reason?: string };

  /**
   * Explain why `any` might be used here and alternatives.
   *
   * @returns Explanation with alternatives
   *
   * @example
   * anyValue.explain()
   * // {
   * //   explanation: "This any is used because the API response shape varies",
   * //   alternatives: ["Use discriminated union", "Use unknown with type guard"]
   * // }
   */
  explain(): {
    explanation: string;
    alternatives: string[];
  };

  /**
   * Get the underlying value.
   *
   * @returns The wrapped value
   */
  valueOf(): any;

  /**
   * Narrow to a specific type with runtime checking.
   *
   * @param guard - Type guard function
   * @returns Narrowed value or null
   *
   * @example
   * anyValue.narrowTo((x): x is User => typeof x.name === "string")
   */
  narrowTo<T>(guard: (x: unknown) => x is T): T | null;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `classifyIntent()` | `{ intent: ...; reason: string; risk: "low" \| "medium" \| "high" }` | Uses `SeverityLevel` for risk |
| `suggestType()` | `{ type: string; interface?: string; confidence: number }` | `ConfidenceResult` (extended) |
| `isSafeFor()` | `{ safe: boolean; reason?: string }` | `SafetyResult` |
| `explain()` | `{ explanation: string; alternatives: string[] }` | `ExplanationResult` |

Import shared types:
```typescript
import {
  SeverityLevel,
  ConfidenceResult,
  SafetyResult,
  ExplanationResult
} from '../../shared/types.ts';
```
