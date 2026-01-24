# SemanticUndefined

## Overview

The `SemanticUndefined` type wraps JavaScript's `undefined` with LLM-powered semantic understanding. It helps reason about uninitialized values, missing properties, and suggests appropriate initializations.

**Core Principle**: Undefined represents uninitialized or missing values - semantic operations should understand why something is undefined and suggest proper initialization.

---

## Interface

```typescript
interface SemanticUndefined {
  /**
   * Create a SemanticUndefined with context about why the value is undefined.
   *
   * @param context - Context explaining the undefined state
   * @returns SemanticUndefined instance
   *
   * @example
   * SemanticUndefined.because("property not yet initialized")
   * SemanticUndefined.because("optional parameter not provided")
   */
  static because(context: string): SemanticUndefined;

  /**
   * Check if two undefined values are semantically equivalent.
   *
   * @param other - Another SemanticUndefined to compare
   * @returns Equivalence result
   *
   * @example
   * SemanticUndefined.because("not initialized").semanticallyEquals(
   *   SemanticUndefined.because("unset")
   * )
   * // { equivalent: true, confidence: 0.9 }
   */
  semanticallyEquals(other: SemanticUndefined): { equivalent: boolean; confidence: number };

  /**
   * Infer why a value is undefined based on context.
   *
   * @param propertyPath - The property path that is undefined
   * @param context - Surrounding context
   * @returns Inferred reason
   *
   * @example
   * SemanticUndefined.inferReason("user.profile.avatar", { user: { profile: {} } })
   * // { reason: "Optional property not set", type: "optional-unset" }
   */
  static inferReason(
    propertyPath: string,
    context?: unknown
  ): { reason: string; type: string };

  /**
   * Suggest an appropriate initialization value.
   *
   * @param propertyName - Name of the property
   * @param typeHint - Optional type information
   * @returns Suggested initialization with explanation
   *
   * @example
   * SemanticUndefined.suggestInitialization("items", { type: "array" })
   * // { value: [], explanation: "Arrays should be initialized empty, not undefined" }
   *
   * SemanticUndefined.suggestInitialization("config", { type: "object" })
   * // { value: {}, explanation: "Objects should be initialized empty" }
   */
  static suggestInitialization(
    propertyName: string,
    typeHint?: { type: string; schema?: unknown }
  ): { value: unknown; explanation: string };

  /**
   * Determine if undefined is acceptable here or indicates a bug.
   *
   * @param context - Context about where this undefined occurred
   * @returns Assessment result
   *
   * @example
   * SemanticUndefined.isAcceptable("return value", { functionName: "getUserById" })
   * // { acceptable: false, reason: "Function should return null for not found, not undefined" }
   */
  static isAcceptable(
    context: string,
    details?: Record<string, unknown>
  ): { acceptable: boolean; reason: string };

  /**
   * Check if this undefined differs semantically from null.
   * Explains when null vs undefined should be used.
   *
   * @param context - Context for the comparison
   * @returns Explanation of which is more appropriate
   *
   * @example
   * SemanticUndefined.compareToNull("user.deletedAt")
   * // {
   * //   recommendation: "null",
   * //   explanation: "Use null for intentional absence (not deleted), undefined implies uninitialized"
   * // }
   */
  static compareToNull(context: string): { recommendation: "null" | "undefined"; explanation: string };

  /**
   * Generate a human-readable explanation of this undefined value.
   *
   * @param propertyPath - The property path
   * @returns Human-readable explanation
   *
   * @example
   * SemanticUndefined.because("not in response").explain("user.nickname")
   * // "The nickname property was not included in the API response"
   */
  explain(propertyPath: string): string;

  /**
   * Get the context/reason for this undefined.
   *
   * @returns The context string or undefined
   */
  getContext(): string | undefined;

  /**
   * Check if this is semantically undefined (always true for SemanticUndefined).
   *
   * @returns true
   */
  isUndefined(): true;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number }` | `SemanticEqualsResult` |
| `inferReason()` | `{ reason: string; type: string }` | `InferReasonResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  InferReasonResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

The implementation is located in `src/primitives/undefined/`:

```
src/primitives/undefined/
├── index.ts                    # Public API exports
├── undefined.ts                # Main SemanticUndefined class
├── prompts.ts                  # LLM prompt templates
└── __tests__/
    ├── undefined.test.ts       # Unit tests (56 tests)
    └── mocks.ts                # Mock utilities for testing
```

### Design Decisions

1. **Does not implement `SemanticAbsence<undefined>`**: Unlike `SemanticNull`, `SemanticUndefined` uses different classification types (`not-initialized`, `optional-unset`, `property-missing`, `void-return`) that don't align with the `SemanticAbsence` interface's expected types (`not-set`, `not-applicable`, `unknown`). This is intentional as undefined has distinct semantics from null.

2. **Private constructor pattern**: Uses `static because()` and `static create()` factory methods consistent with other semantic primitives.

3. **LLM client injection**: All async operations accept an optional `LLMClient` parameter for dependency injection, enabling comprehensive unit testing with mocks.

4. **Classification types**: Five distinct classification types for undefined:
   - `not-initialized`: Variable/property declared but never assigned
   - `optional-unset`: Optional parameter/property not provided
   - `property-missing`: Accessing a property that doesn't exist
   - `void-return`: Function that doesn't explicitly return a value
   - `unknown`: Cannot determine the nature of the undefined

5. **Both `getContext()` and `getReason()`**: Provides `getContext()` per the spec and `getReason()` as an alias for API compatibility with other semantic types.

### Exported Types

```typescript
export {
  SemanticUndefined,
  type UndefinedType,
  type UndefinedClassifyResult,
  type SuggestInitializationResult,
  type TypeHint,
  type AcceptableResult,
  type CompareToNullResult,
  type SemanticEqualsResult,
  type InferReasonResult,
} from './undefined/index.ts';
```

### Test Coverage

- 56 unit tests covering all methods
- Tests use mocked LLM client to avoid actual API calls
- Comprehensive coverage for edge cases (no context, missing parameters, etc.)
- Prompt template tests verify correct parameter inclusion
