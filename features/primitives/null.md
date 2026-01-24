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
