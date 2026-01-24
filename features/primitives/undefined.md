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
