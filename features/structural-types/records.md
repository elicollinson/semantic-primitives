# SemanticRecord

## Overview

The `SemanticRecord<K, V>` type wraps TypeScript's `Record` type with LLM-powered semantic understanding. It enables intelligent key-value operations, pattern detection, and semantic validation of uniform dictionaries.

**Core Principle**: Records represent uniform key-value mappings - semantic operations should understand key patterns, value relationships, and dictionary purpose.

---

## Interface

```typescript
interface SemanticRecord<K extends string | number | symbol, V> {
  /**
   * Create a SemanticRecord from a plain object.
   *
   * @param obj - Record object
   * @param context - Optional context about the record's purpose
   * @returns SemanticRecord instance
   *
   * @example
   * SemanticRecord.from({ USD: 1.0, EUR: 0.85, GBP: 0.73 }, "exchange rates")
   */
  static from<K extends string, V>(
    obj: Record<K, V>,
    context?: string
  ): SemanticRecord<K, V>;

  /**
   * Check if two records are semantically equivalent.
   *
   * @param other - Record to compare
   * @returns Equivalence result
   *
   * @example
   * record1.semanticallyEquals(record2)
   * // { equivalent: true, keyMappings: { "US_DOLLAR": "USD" } }
   */
  semanticallyEquals(other: Record<K, V>): {
    equivalent: boolean;
    keyMappings?: Record<string, string>;
    confidence: number;
  };

  /**
   * Validate keys against semantic rules.
   *
   * @param rules - Validation rules for keys
   * @returns Validation result
   *
   * @example
   * config.validateKeys(["should be SCREAMING_CASE", "should be valid env var names"])
   * // { valid: false, invalidKeys: ["myKey"], reasons: ["not SCREAMING_CASE"] }
   */
  validateKeys(rules: string[]): {
    valid: boolean;
    invalidKeys: string[];
    reasons: string[];
  };

  /**
   * Validate values against semantic rules.
   *
   * @param rules - Validation rules for values
   * @returns Validation result
   *
   * @example
   * prices.validateValues(["must be positive numbers", "should be reasonable prices"])
   */
  validateValues(rules: string[]): {
    valid: boolean;
    invalidEntries: Array<{ key: K; value: V; reason: string }>;
  };

  /**
   * Detect what this record represents.
   *
   * @returns Inferred purpose
   *
   * @example
   * record.inferPurpose()
   * // { purpose: "currency-exchange-rates", keyType: "currency-code", valueType: "rate" }
   */
  inferPurpose(): {
    purpose: string;
    keyType: string;
    valueType: string;
    confidence: number;
  };

  /**
   * Get a value using semantic key matching.
   *
   * @param query - Key or semantic description
   * @returns Matched value
   *
   * @example
   * exchangeRates.semanticGet("British Pound")
   * // { value: 0.73, matchedKey: "GBP", confidence: 0.95 }
   */
  semanticGet(query: string): {
    value: V | undefined;
    matchedKey: K | undefined;
    confidence: number;
  };

  /**
   * Filter entries by semantic criteria.
   *
   * @param criteria - Natural language filter
   * @returns Filtered record
   *
   * @example
   * settings.semanticFilter("security-related settings")
   */
  semanticFilter(criteria: string): SemanticRecord<K, V>;

  /**
   * Suggest missing keys based on patterns.
   *
   * @returns Suggested keys
   *
   * @example
   * SemanticRecord.from({ USD: 1.0, EUR: 0.85 }).suggestMissingKeys()
   * // [{ key: "GBP", reason: "Common major currency" }]
   */
  suggestMissingKeys(): Array<{ key: string; reason: string }>;

  /**
   * Group entries by semantic category.
   *
   * @param criteria - Grouping criteria
   * @returns Grouped records
   *
   * @example
   * config.groupBy("category")
   * // { database: {...}, auth: {...}, logging: {...} }
   */
  groupBy(criteria: string): Record<string, SemanticRecord<K, V>>;

  /**
   * Summarize the record contents.
   *
   * @returns Human-readable summary
   *
   * @example
   * exchangeRates.summarize()
   * // "8 currency exchange rates against USD. Strongest: GBP (0.73), Weakest: JPY (149.5)"
   */
  summarize(): string;

  /**
   * Get the underlying Record.
   *
   * @returns Plain object
   */
  valueOf(): Record<K, V>;

  /**
   * Get all keys.
   *
   * @returns Array of keys
   */
  keys(): K[];

  /**
   * Get all values.
   *
   * @returns Array of values
   */
  values(): V[];
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; keyMappings?: Record<string, string>; confidence: number }` | `SemanticEqualsResultWithMappings` |
| `semanticGet()` | `{ value: V \| undefined; matchedKey: K \| undefined; confidence: number }` | `SemanticGetResult<K, V>` |
| `suggestMissingKeys()` | `Array<{ key: string; reason: string }>` | `MissingSuggestion[]` |
| `inferPurpose()` | `{ purpose: string; keyType: string; valueType: string; confidence: number }` | `InferPurposeResult` (extended) |

Import shared types:
```typescript
import {
  SemanticEqualsResultWithMappings,
  SemanticGetResult,
  MissingSuggestion,
  InferPurposeResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

The implementation follows the standard semantic type structure:

```
src/types/record/
├── index.ts          # Re-exports public API
├── record.ts         # Main SemanticRecord class implementation
├── prompts.ts        # LLM prompt templates for all operations
└── __tests__/
    ├── record.test.ts  # Unit tests (62 tests)
    └── mocks.ts        # Mock LLM client and response fixtures
```

### Key Implementation Details

1. **Immutable Design**: The `SemanticRecord` class stores an internal copy of the record data, ensuring immutability. All operations return new instances rather than mutating existing ones.

2. **Factory Pattern**: Uses private constructor with static factory methods (`from()`, `empty()`) to create instances. This allows for optional context and client injection.

3. **Generic Type Support**: Supports `K extends string | number | symbol` for keys and any type `V` for values, matching TypeScript's native `Record<K, V>` type.

4. **LLM Client Injection**: Accepts an optional `LLMClient` parameter for dependency injection, enabling easy mocking in tests.

5. **Result Types**: Custom result types defined for record-specific operations:
   - `RecordSemanticEqualsResult` - Includes key mappings as `Record<string, string>`
   - `ValidateKeysResult` - Returns invalid keys and their reasons
   - `ValidateValuesResult<K, V>` - Returns invalid entries with typed keys/values
   - `RecordInferPurposeResult` - Extended with `keyType` and `valueType` fields

6. **Prompt Design**: All prompts follow best practices:
   - Clear JSON response format specifications
   - Confidence scores (0.0 to 1.0) for all operations
   - Context-aware analysis considering naming conventions
   - Low temperature (0.1) for deterministic responses

### Differences from SemanticMap

While similar to `SemanticMap`, `SemanticRecord` has key differences:

- Uses plain objects (`Record<K, V>`) instead of `Map<K, V>`
- Returns `Record<string, SemanticRecord<K, V>>` from `groupBy()` instead of `Map<string, SemanticMap<K, V>>`
- Includes separate `validateKeys()` and `validateValues()` methods (not in Map spec)
- Extended `inferPurpose()` result with `keyType` and `valueType` fields
- No `semanticMerge()` method (not in spec)

### Test Coverage

62 unit tests covering:
- Static factory methods (`from`, `empty`)
- Basic accessors (`valueOf`, `keys`, `values`, `entries`, `get`, `has`, `size`)
- All semantic operations with mocked LLM responses
- Edge cases (empty records, no matches)
- Iterator and forEach support
- JSON serialization (`toJSON`, `toString`)
- Prompt generation verification

### Exports

Exported from `src/types/index.ts`:
- `SemanticRecord` - Main class
- `RecordSemanticEqualsResult` - Equality comparison result type
- `ValidateKeysResult` - Key validation result type
- `ValidateValuesResult` - Value validation result type
- `InvalidEntry` - Individual invalid entry type
- `RecordInferPurposeResult` - Purpose inference result type
- `RecordSemanticGetResult` - Semantic get result type (aliased)
- `RecordMissingSuggestion` - Missing key suggestion type (aliased)
