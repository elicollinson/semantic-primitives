# SemanticObject

## Overview

The `SemanticObject` type extends JavaScript objects with LLM-powered semantic understanding. It enables meaning-aware property access, intelligent schema inference, and semantic comparison of object structures.

**Core Principle**: Objects represent structured data with meaning - semantic operations should understand property purposes, value relationships, and structural patterns.

---

## Interface

```typescript
interface SemanticObject<T extends object = object> {
  /**
   * Get a property using semantic key matching.
   *
   * @param query - Property name or semantic query
   * @returns Property value with match info
   *
   * @example
   * user.semanticGet("email address")
   * // Matches "email", "emailAddress", "mail", "e_mail"
   */
  semanticGet(query: string): {
    value: unknown;
    matchedKey: string | undefined;
    confidence: number;
  };

  /**
   * Check if two objects are semantically equivalent.
   * Considers property name synonyms and value meaning.
   *
   * @param other - Object to compare with
   * @returns Equivalence result
   *
   * @example
   * obj1.semanticallyEquals(obj2)
   * // { equivalent: true, mappings: { "firstName": "first_name" }, confidence: 0.92 }
   */
  semanticallyEquals(other: object): {
    equivalent: boolean;
    mappings?: Record<string, string>;
    confidence: number;
  };

  /**
   * Validate the object against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result
   *
   * @example
   * user.validate([
   *   "email must be valid",
   *   "age must be reasonable for a human",
   *   "name should not be empty"
   * ])
   */
  validate(rules: string[]): {
    valid: boolean;
    issues: Array<{ field: string; problem: string }>;
  };

  /**
   * Infer the semantic schema of this object.
   *
   * @returns Inferred schema with field descriptions
   *
   * @example
   * data.inferSchema()
   * // {
   * //   type: "user-profile",
   * //   fields: {
   * //     id: { type: "number", purpose: "unique identifier" },
   * //     email: { type: "string", format: "email", purpose: "contact" }
   * //   }
   * // }
   */
  inferSchema(): {
    type: string;
    fields: Record<string, { type: string; purpose: string; format?: string }>;
    confidence: number;
  };

  /**
   * Transform property names to a different convention.
   *
   * @param convention - Target naming convention
   * @returns Transformed object
   *
   * @example
   * obj.transformKeys("camelCase")
   * obj.transformKeys("snake_case")
   */
  transformKeys(
    convention: "camelCase" | "snake_case" | "PascalCase" | "kebab-case"
  ): SemanticObject<T>;

  /**
   * Merge with another object, handling key synonyms.
   *
   * @param other - Object to merge
   * @param options - Merge options
   * @returns Merged object
   *
   * @example
   * obj1.semanticMerge(obj2)
   * // Merges "firstName" and "first_name" as the same field
   */
  semanticMerge(
    other: object,
    options?: { conflictResolution?: "prefer-this" | "prefer-other" | "combine" }
  ): SemanticObject<T>;

  /**
   * Extract specific fields using semantic matching.
   *
   * @param fields - Fields to extract (semantic descriptions)
   * @returns Extracted object
   *
   * @example
   * user.pick(["contact information", "identification"])
   * // { email: "...", phone: "...", id: "..." }
   */
  pick(fields: string[]): SemanticObject<Partial<T>>;

  /**
   * Suggest missing fields based on the object's purpose.
   *
   * @returns Suggested fields
   *
   * @example
   * user.suggestMissingFields()
   * // [{ field: "phoneNumber", reason: "Common in user profiles" }]
   */
  suggestMissingFields(): Array<{ field: string; reason: string }>;

  /**
   * Summarize the object contents.
   *
   * @returns Human-readable summary
   *
   * @example
   * order.summarize()
   * // "Order #1234 for John Doe: 3 items totaling $150, shipping to NYC"
   */
  summarize(): string;

  /**
   * Detect the semantic type/purpose of this object.
   *
   * @returns Inferred type
   *
   * @example
   * data.inferType()
   * // { type: "e-commerce-order", confidence: 0.89 }
   */
  inferType(): { type: string; confidence: number };

  /**
   * Check if a field contains sensitive data.
   *
   * @param field - Field name to check
   * @returns Sensitivity assessment
   *
   * @example
   * user.isSensitive("ssn")
   * // { sensitive: true, type: "PII", recommendation: "encrypt or mask" }
   */
  isSensitive(field: string): {
    sensitive: boolean;
    type?: string;
    recommendation?: string;
  };

  /**
   * Get the underlying plain object.
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
| `semanticGet()` | `{ value: unknown; matchedKey: string \| undefined; confidence: number }` | `SemanticGetResult` |
| `semanticallyEquals()` | `{ equivalent: boolean; mappings?: Record<string, string>; confidence: number }` | `SemanticEqualsResultWithMappings` |
| `inferSchema()` | `{ type: string; fields: Record<...>; confidence: number }` | `InferSchemaResult` |
| `suggestMissingFields()` | `Array<{ field: string; reason: string }>` | `MissingSuggestion[]` |
| `inferType()` | `{ type: string; confidence: number }` | `InferTypeResult` |
| `isSensitive()` | `{ sensitive: boolean; type?: string; recommendation?: string }` | `SensitiveResult` |

Import shared types:
```typescript
import {
  SemanticGetResult,
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  MissingSuggestion,
  InferTypeResult,
  SensitiveResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

The implementation follows the standard library structure:

```
src/types/object/
├── index.ts          # Re-exports public API
├── object.ts         # Main SemanticObject class (480+ lines)
├── prompts.ts        # LLM prompt templates (230+ lines)
└── __tests__/
    ├── object.test.ts  # Unit tests (61 test cases)
    └── mocks.ts        # Mock LLM responses
```

### Key Implementation Details

1. **Factory Pattern**: Uses a private constructor with static factory methods (`from()`, `empty()`) for consistent object creation.

2. **Exact Match Optimization**: `semanticGet()` first checks for exact key matches synchronously before invoking the LLM, improving performance for common cases.

3. **Empty Object Handling**: All methods handle empty objects gracefully, returning appropriate default values without LLM calls.

4. **Type Preservation**: The class preserves the generic type `T` throughout operations, though `transformKeys()` and `semanticMerge()` may produce objects with different runtime shapes.

5. **Shared Type Compatibility**: All return types align with shared interfaces from `src/shared/types.ts`, ensuring cross-module type compatibility.

6. **Chainable Operations**: Methods like `transformKeys()`, `semanticMerge()`, and `pick()` return new `SemanticObject` instances for method chaining.

### Prompt Design

- System prompt establishes JSON-only response format and semantic analysis guidelines
- Each operation has a dedicated prompt function with clear instructions
- Low temperature (0.1) for deterministic operations (validation, type inference)
- Higher temperature (0.3) for creative operations (summarize, suggestMissingFields)

### Testing Strategy

- 61 unit tests covering all public methods
- Mock LLM client for deterministic testing without API calls
- Tests for edge cases: empty objects, non-existent fields, exact matches
- Prompt structure tests to verify correct data embedding

### Utility Methods

Additional utility methods not in the spec but useful for practical use:
- `keys()`: Returns all property keys
- `values()`: Returns all property values
- `entries()`: Returns key-value pairs
- `has(key)`: Exact key existence check
- `get(key)`: Direct property access
- `toString()`: JSON string representation
- `toJSON()`: For JSON serialization support
