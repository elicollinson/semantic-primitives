# SemanticNull

## Overview

The `SemanticNull` type wraps JavaScript's `null` with LLM-powered semantic understanding. It helps reason about why a value is null, what it should represent, and how to handle intentional absence of data.

**Core Principle**: Null represents intentional absence - semantic operations should understand why something is null and suggest appropriate handling.

---

## Interface

```typescript
interface SemanticNull {
  /**
   * Create a SemanticNull with context about why the value is null.
   *
   * @param reason - Reason or context for the null value
   * @returns SemanticNull instance with context
   *
   * @example
   * SemanticNull.because("user has not set a phone number")
   * SemanticNull.because("field is not applicable for this user type")
   */
  static because(reason: string): SemanticNull;

  /**
   * Check if two null values are semantically equivalent.
   * Null values with similar reasons/contexts are considered equivalent.
   *
   * @param other - Another SemanticNull to compare
   * @returns Equivalence result with explanation
   *
   * @example
   * SemanticNull.because("not set").semanticallyEquals(SemanticNull.because("empty"))
   * // { equivalent: true, confidence: 0.85 }
   */
  semanticallyEquals(other: SemanticNull): { equivalent: boolean; confidence: number };

  /**
   * Infer the likely reason for this null value based on context.
   *
   * @param fieldName - Name of the field that is null
   * @param context - Surrounding context (object, schema, etc.)
   * @returns Inferred reason for the null
   *
   * @example
   * SemanticNull.inferReason("deletedAt", { status: "active" })
   * // { reason: "Record has not been deleted", type: "not-applicable" }
   */
  static inferReason(
    fieldName: string,
    context?: Record<string, unknown>
  ): { reason: string; type: string };

  /**
   * Suggest an appropriate default value for this null.
   *
   * @param fieldName - Name of the field
   * @param schema - Optional schema or type information
   * @returns Suggested default with explanation
   *
   * @example
   * SemanticNull.suggestDefault("phoneNumber", { type: "string", format: "phone" })
   * // { default: null, explanation: "Phone numbers should not have a default; require user input" }
   *
   * SemanticNull.suggestDefault("retryCount", { type: "number" })
   * // { default: 0, explanation: "Retry count should start at 0" }
   */
  static suggestDefault(
    fieldName: string,
    schema?: { type: string; format?: string }
  ): { default: unknown; explanation: string };

  /**
   * Check if null is appropriate for this field/context.
   *
   * @param fieldName - Name of the field
   * @param context - Context information
   * @returns Validation result
   *
   * @example
   * SemanticNull.isAppropriate("email", { required: true })
   * // { appropriate: false, reason: "Email is a required field" }
   */
  static isAppropriate(
    fieldName: string,
    context?: { required?: boolean; schema?: unknown }
  ): { appropriate: boolean; reason: string };

  /**
   * Determine if this null represents "not set" vs "not applicable".
   *
   * @returns Classification of the null type
   *
   * @example
   * // For a middleName field where user left it blank:
   * // { type: "not-set", canBeProvided: true }
   *
   * // For a spouseName field for a single person:
   * // { type: "not-applicable", canBeProvided: false }
   */
  classify(): { type: "not-set" | "not-applicable" | "unknown"; canBeProvided: boolean };

  /**
   * Generate a human-readable explanation of this null value.
   *
   * @param fieldName - Name of the field
   * @returns Human-readable explanation
   *
   * @example
   * SemanticNull.because("user skipped").explain("middleName")
   * // "Middle name was not provided by the user"
   */
  explain(fieldName: string): string;

  /**
   * Get the reason for this null, if provided.
   *
   * @returns The reason string or undefined
   */
  getReason(): string | undefined;

  /**
   * Check if this is semantically null (always true for SemanticNull).
   *
   * @returns true
   */
  isNull(): true;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number }` | `SemanticEqualsResult` |
| `inferReason()` | `{ reason: string; type: string }` | `InferReasonResult` |
| `isAppropriate()` | `{ appropriate: boolean; reason: string }` | `AppropriateResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  InferReasonResult,
  AppropriateResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

```
src/primitives/null/
├── index.ts          # Module exports
├── null.ts           # Main SemanticNull class implementation
├── prompts.ts        # LLM prompt templates
└── __tests__/
    ├── mocks.ts      # Mock LLM client and response fixtures
    └── null.test.ts  # Unit tests (43 tests)
```

### Design Decisions

1. **Async Methods**: All LLM-powered methods (`semanticallyEquals`, `inferReason`, `suggestDefault`, `isAppropriate`, `classify`, `explain`) return Promises since they require LLM calls. This aligns with the async nature of the LLM client.

2. **Static Factory Methods**: Uses `SemanticNull.because(reason)` and `SemanticNull.create()` as factory methods instead of a public constructor. This provides clearer API semantics and allows for future optimizations.

3. **Synchronous Fallbacks**: `semanticallyEquals()` returns synchronous results when comparing two nulls without reasons (both equivalent with confidence 1.0) or when only one has a reason (not equivalent with confidence 0.7), avoiding unnecessary LLM calls.

4. **Classify Without Reason**: When `classify()` is called on a `SemanticNull` without a reason, it returns `{ type: 'unknown', canBeProvided: true }` synchronously without an LLM call.

5. **Interface Implementation**: Implements `Semantic<null>`, `Comparable<SemanticNull>`, `Explainable`, and `SemanticAbsence<null>` interfaces from the shared module.

6. **Dependency Injection**: All LLM-dependent methods accept an optional `LLMClient` parameter for testing and customization. Falls back to `getClient()` singleton when not provided.

### Additional Types Exported

- `NullType`: Union type for classification (`'not-set' | 'not-applicable' | 'unknown'`)
- `NullClassifyResult`: Result type for `classify()` method
- `SuggestDefaultResult`: Result type for `suggestDefault()` method
- `SchemaInfo`: Input type for schema information in `suggestDefault()`
- `AppropriateContext`: Input type for context in `isAppropriate()`

### Interface Update

The `SemanticAbsence` interface in `src/shared/interfaces.ts` was updated to allow async `classify()` returns, matching the async nature of LLM operations:

```typescript
classify(): {
  type: 'not-set' | 'not-applicable' | 'unknown';
  canBeProvided: boolean;
} | Promise<{
  type: 'not-set' | 'not-applicable' | 'unknown';
  canBeProvided: boolean;
}>;
```

### Test Coverage

- 43 unit tests covering all public methods
- All tests use mocked LLM client to avoid real API calls
- Tests verify both synchronous fallbacks and async LLM paths
- Prompt generation tests ensure correct formatting
