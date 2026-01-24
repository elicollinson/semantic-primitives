# SemanticSymbol

## Overview

The `SemanticSymbol` type extends the native JavaScript Symbol with LLM-powered semantic understanding. It helps create meaningful unique identifiers, understand symbol purposes, and manage symbol registries with semantic awareness.

**Core Principle**: Symbols represent unique identifiers with purpose - semantic operations should understand naming conventions, categorization, and appropriate usage.

---

## Interface

```typescript
interface SemanticSymbol {
  /**
   * Create a symbol with a semantically meaningful description.
   * Validates that the description is clear and follows conventions.
   *
   * @param description - Human-readable description of the symbol's purpose
   * @returns SemanticSymbol instance
   *
   * @example
   * SemanticSymbol.create("userAuthToken")
   * SemanticSymbol.create("cacheInvalidationKey")
   */
  static create(description: string): SemanticSymbol;

  /**
   * Create or retrieve a global symbol with semantic validation.
   *
   * @param key - Registry key for the symbol
   * @returns SemanticSymbol from global registry
   *
   * @example
   * SemanticSymbol.for("app.config.database")
   * SemanticSymbol.for("plugin.lifecycle.init")
   */
  static for(key: string): SemanticSymbol;

  /**
   * Check if two symbols serve the same semantic purpose.
   * Even unique symbols can be semantically equivalent in purpose.
   *
   * @param other - Another symbol to compare
   * @returns Equivalence result
   *
   * @example
   * SemanticSymbol.create("userId").semanticallyEquals(SemanticSymbol.create("user_id"))
   * // { equivalent: true, confidence: 0.95, note: "Same concept, different naming convention" }
   */
  semanticallyEquals(other: SemanticSymbol | symbol): {
    equivalent: boolean;
    confidence: number;
    note?: string;
  };

  /**
   * Suggest a better description for the symbol based on conventions.
   *
   * @returns Suggestion with explanation
   *
   * @example
   * SemanticSymbol.create("x").suggestBetterName()
   * // { suggestion: null, reason: "Cannot suggest without more context" }
   *
   * SemanticSymbol.create("usrid").suggestBetterName()
   * // { suggestion: "userId", reason: "Use camelCase and avoid abbreviations" }
   */
  suggestBetterName(): { suggestion: string | null; reason: string };

  /**
   * Classify the symbol into a category based on its description.
   *
   * @returns Category classification
   *
   * @example
   * SemanticSymbol.create("onUserLogin").classify()
   * // { category: "event", subcategory: "lifecycle" }
   *
   * SemanticSymbol.create("API_SECRET_KEY").classify()
   * // { category: "configuration", subcategory: "secrets" }
   */
  classify(): { category: string; subcategory?: string };

  /**
   * Validate the symbol description follows best practices.
   *
   * @param conventions - Optional custom conventions to check against
   * @returns Validation result
   *
   * @example
   * SemanticSymbol.create("_private_internal").validate()
   * // { valid: true, warnings: ["Underscore prefix suggests private; consider using # for true privacy"] }
   */
  validate(conventions?: string[]): { valid: boolean; warnings: string[] };

  /**
   * Get the semantic purpose/intent of this symbol.
   *
   * @returns Description of the symbol's purpose
   *
   * @example
   * SemanticSymbol.create("cacheKey").describePurpose()
   * // "Unique identifier for cache entries"
   */
  describePurpose(): string;

  /**
   * Check if this symbol is appropriate for a given use case.
   *
   * @param useCase - The intended use case
   * @returns Appropriateness assessment
   *
   * @example
   * SemanticSymbol.create("tempId").isAppropriateFor("database primary key")
   * // { appropriate: false, reason: "Temporary identifiers should not be used as permanent keys" }
   */
  isAppropriateFor(useCase: string): { appropriate: boolean; reason: string };

  /**
   * Get the underlying Symbol value.
   *
   * @returns The native Symbol
   */
  valueOf(): symbol;

  /**
   * Get the symbol's description.
   *
   * @returns The description string
   */
  description(): string | undefined;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number; note?: string }` | `SemanticEqualsResultWithReason` |
| `classify()` | `{ category: string; subcategory?: string }` | `ClassifyResult` (without confidence) |
| `validate()` | `{ valid: boolean; warnings: string[] }` | `ValidateResultWithWarnings` |
| `isAppropriateFor()` | `{ appropriate: boolean; reason: string }` | `AppropriateResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResultWithReason,
  ClassifyResult,
  ValidateResultWithWarnings,
  AppropriateResult
} from '../../shared/types.ts';
```
