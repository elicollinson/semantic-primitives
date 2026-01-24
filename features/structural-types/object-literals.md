# SemanticObjectLiteral

## Overview

The `SemanticObjectLiteral` type wraps TypeScript object literals with LLM-powered semantic understanding. It enables shape analysis, schema inference, and intelligent property operations for ad-hoc object structures.

**Core Principle**: Object literals represent flexible data shapes - semantic operations should understand property purposes, detect schemas, and validate structural patterns.

---

## Interface

```typescript
interface SemanticObjectLiteral<T extends object> {
  /**
   * Create a SemanticObjectLiteral from a plain object.
   *
   * @param obj - Object literal
   * @param context - Optional context about the object's purpose
   * @returns SemanticObjectLiteral instance
   *
   * @example
   * SemanticObjectLiteral.from({ name: "John", age: 30 }, "user data")
   */
  static from<T extends object>(
    obj: T,
    context?: string
  ): SemanticObjectLiteral<T>;

  /**
   * Check if two object literals are semantically equivalent.
   * Handles property name synonyms and structural variations.
   *
   * @param other - Object to compare
   * @returns Equivalence result
   *
   * @example
   * obj1.semanticallyEquals({ firstName: "John" })
   * // { equivalent: true, mappings: { "name": "firstName" } }
   */
  semanticallyEquals(other: object): {
    equivalent: boolean;
    mappings?: Record<string, string>;
    confidence: number;
  };

  /**
   * Infer the schema/type of this object.
   *
   * @returns Inferred schema
   *
   * @example
   * obj.inferSchema()
   * // {
   * //   name: "User",
   * //   properties: { name: "string", age: "number" },
   * //   required: ["name"],
   * //   optional: ["age"]
   * // }
   */
  inferSchema(): {
    name: string;
    properties: Record<string, string>;
    required: string[];
    optional: string[];
    confidence: number;
  };

  /**
   * Validate the object against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result
   *
   * @example
   * user.validateWithRules([
   *   "email must be valid",
   *   "age must be reasonable for a human"
   * ])
   */
  validateWithRules(rules: string[]): {
    valid: boolean;
    violations: Array<{ rule: string; field?: string; reason: string }>;
  };

  /**
   * Detect what domain/entity this object represents.
   *
   * @returns Domain detection result
   *
   * @example
   * obj.detectDomain()
   * // { domain: "user-profile", confidence: 0.92 }
   */
  detectDomain(): {
    domain: string;
    confidence: number;
    suggestedInterface?: string;
  };

  /**
   * Find properties matching a semantic description.
   *
   * @param description - What to look for
   * @returns Matching properties
   *
   * @example
   * obj.findProperties("contact information")
   * // [{ key: "email", value: "...", relevance: 0.95 }]
   */
  findProperties(description: string): Array<{
    key: string;
    value: unknown;
    relevance: number;
  }>;

  /**
   * Suggest missing properties based on the object's apparent purpose.
   *
   * @returns Suggested properties
   *
   * @example
   * user.suggestMissingProperties()
   * // [{ property: "createdAt", type: "Date", reason: "Common in user records" }]
   */
  suggestMissingProperties(): Array<{
    property: string;
    type: string;
    reason: string;
  }>;

  /**
   * Check if a property contains sensitive data.
   *
   * @param propertyPath - Property to check
   * @returns Sensitivity assessment
   *
   * @example
   * obj.isSensitive("ssn")
   * // { sensitive: true, type: "PII", recommendation: "encrypt" }
   */
  isSensitive(propertyPath: string): {
    sensitive: boolean;
    type?: string;
    recommendation?: string;
  };

  /**
   * Transform property names to a naming convention.
   *
   * @param convention - Target convention
   * @returns Transformed object
   *
   * @example
   * obj.transformKeys("snake_case")
   */
  transformKeys(
    convention: "camelCase" | "snake_case" | "PascalCase" | "kebab-case"
  ): SemanticObjectLiteral<object>;

  /**
   * Generate a TypeScript interface for this object.
   *
   * @param name - Interface name
   * @returns TypeScript interface code
   *
   * @example
   * obj.generateInterface("User")
   * // "interface User { name: string; age?: number; }"
   */
  generateInterface(name: string): string;

  /**
   * Summarize the object contents.
   *
   * @returns Human-readable summary
   */
  summarize(): string;

  /**
   * Get the underlying object.
   *
   * @returns Plain object
   */
  valueOf(): T;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; mappings?: Record<string, string>; confidence: number }` | `SemanticEqualsResultWithMappings` |
| `inferSchema()` | `{ name: string; properties: Record<...>; required: string[]; optional: string[]; confidence: number }` | `InferSchemaResult` |
| `findProperties()` | `Array<{ key: string; value: unknown; relevance: number }>` | `SearchResult[]` (extended) |
| `isSensitive()` | `{ sensitive: boolean; type?: string; recommendation?: string }` | `SensitiveResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  SearchResult,
  SensitiveResult
} from '../../shared/types.ts';
```
