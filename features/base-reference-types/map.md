# SemanticMap

## Overview

The `SemanticMap<K, V>` type extends the native JavaScript Map with LLM-powered semantic understanding. It enables meaning-aware key lookups, intelligent value associations, and semantic key matching.

**Core Principle**: Maps represent key-value associations - semantic operations should understand key synonyms, value relationships, and contextual lookups.

---

## Interface

```typescript
interface SemanticMap<K, V> extends Map<K, V> {
  /**
   * Get a value using semantic key matching.
   * Finds the key that best matches the query, not just exact matches.
   *
   * @param query - Key or semantic query
   * @returns Value if found with match confidence
   *
   * @example
   * config.semanticGet("database connection string")
   * // Matches "DB_CONNECTION_URL" or "databaseUrl"
   *
   * translations.semanticGet("greeting", { language: "es" })
   * // Matches "hello", "hi", "hey" keys
   */
  semanticGet(
    query: string,
    context?: Record<string, unknown>
  ): { value: V | undefined; matchedKey: K | undefined; confidence: number };

  /**
   * Check if the map contains a semantically matching key.
   *
   * @param query - Key or semantic query
   * @returns Whether a matching key exists
   *
   * @example
   * map.semanticHas("user identifier") // true if has "userId", "user_id", "uid"
   */
  semanticHas(query: string): boolean;

  /**
   * Check if two maps are semantically equivalent.
   *
   * @param other - Map to compare with
   * @returns Equivalence result
   *
   * @example
   * map1.semanticallyEquals(map2)
   * // { equivalent: true, keyMappings: [["userId", "user_id"]], confidence: 0.9 }
   */
  semanticallyEquals(other: Map<K, V> | SemanticMap<K, V>): {
    equivalent: boolean;
    keyMappings?: Array<[K, K]>;
    confidence: number;
  };

  /**
   * Find all keys matching semantic criteria.
   *
   * @param criteria - Natural language criteria
   * @returns Matching keys with relevance
   *
   * @example
   * config.findKeys("security related settings")
   * // [{ key: "API_KEY", relevance: 0.95 }, { key: "AUTH_TOKEN", relevance: 0.9 }]
   */
  findKeys(criteria: string): Array<{ key: K; relevance: number }>;

  /**
   * Find all values matching semantic criteria.
   *
   * @param criteria - Natural language criteria
   * @returns Matching entries
   *
   * @example
   * products.findValues("expensive items")
   * // [{ key: "laptop", value: {...}, relevance: 0.9 }]
   */
  findValues(criteria: string): Array<{ key: K; value: V; relevance: number }>;

  /**
   * Merge another map with semantic key matching.
   * Handles key synonyms and resolves conflicts intelligently.
   *
   * @param other - Map to merge
   * @param options - Merge options
   * @returns Merged map
   *
   * @example
   * map1.semanticMerge(map2, { conflictResolution: "prefer-newer" })
   */
  semanticMerge(
    other: Map<K, V>,
    options?: { conflictResolution?: "prefer-this" | "prefer-other" | "combine" }
  ): SemanticMap<K, V>;

  /**
   * Validate all key-value pairs against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * config.validate({ keys: "should be SCREAMING_SNAKE_CASE", values: "no sensitive data" })
   */
  validate(rules: {
    keys?: string;
    values?: string;
  }): { valid: boolean; issues: string[] };

  /**
   * Suggest missing keys based on existing patterns.
   *
   * @returns Suggested keys with rationale
   *
   * @example
   * config.suggestMissingKeys()
   * // [{ key: "LOG_LEVEL", reason: "Common config alongside existing logging keys" }]
   */
  suggestMissingKeys(): Array<{ key: string; reason: string }>;

  /**
   * Group entries by semantic criteria.
   *
   * @param criteria - Grouping criteria
   * @returns Grouped maps
   *
   * @example
   * settings.groupBy("category")
   * // Map { "database": SemanticMap{...}, "auth": SemanticMap{...} }
   */
  groupBy(criteria: string): Map<string, SemanticMap<K, V>>;

  /**
   * Summarize the map contents.
   *
   * @returns Human-readable summary
   *
   * @example
   * userPrefs.summarize()
   * // "12 preferences across 3 categories. Theme: dark, Notifications: enabled..."
   */
  summarize(): string;

  /**
   * Infer the semantic purpose of this map.
   *
   * @returns Inferred purpose
   *
   * @example
   * map.inferPurpose()
   * // { purpose: "configuration", subcategory: "database-settings", confidence: 0.88 }
   */
  inferPurpose(): { purpose: string; subcategory?: string; confidence: number };
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticGet()` | `{ value: V \| undefined; matchedKey: K \| undefined; confidence: number }` | `SemanticGetResult<K, V>` |
| `semanticallyEquals()` | `{ equivalent: boolean; keyMappings?: Array<[K, K]>; confidence: number }` | `SemanticEqualsResult` (extended) |
| `findKeys()` | `Array<{ key: K; relevance: number }>` | `SearchResult<K>[]` (adapted) |
| `findValues()` | `Array<{ key: K; value: V; relevance: number }>` | `SearchResult` (extended) |
| `validate()` | `{ valid: boolean; issues: string[] }` | `ValidateResult` |
| `suggestMissingKeys()` | `Array<{ key: string; reason: string }>` | `MissingSuggestion[]` |
| `inferPurpose()` | `{ purpose: string; subcategory?: string; confidence: number }` | `InferPurposeResult` |

Import shared types:
```typescript
import {
  SemanticGetResult,
  SemanticEqualsResult,
  SearchResult,
  ValidateResult,
  MissingSuggestion,
  InferPurposeResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

The implementation follows the library's standard structure:

```
src/types/map/
├── index.ts          # Re-exports public API
├── map.ts            # Main SemanticMap class implementation
├── prompts.ts        # LLM prompt templates
└── __tests__/
    ├── map.test.ts   # Unit tests (70 tests)
    └── mocks.ts      # Mock LLM responses for testing
```

### Design Decisions

1. **Immutability**: All mutation methods (`set`, `delete`, `clear`) return new `SemanticMap` instances instead of modifying the original, following functional programming patterns.

2. **LLM Client Injection**: The `LLMClient` is injected via constructor (optional) and defaults to `getClient()` from the LLM module. This enables easy mocking in tests.

3. **Async Semantic Operations**: All LLM-powered methods are async (e.g., `semanticGet`, `semanticHas`, `findKeys`) while standard Map operations remain synchronous.

4. **Key Conversion**: Internal operations convert keys to strings for LLM processing since LLMs work with text. This works well for common Map key types (string, number).

5. **Empty Map Handling**: Semantic methods short-circuit on empty maps to avoid unnecessary LLM calls, returning sensible defaults.

### Exported Types

- `SemanticMap<K, V>` - The main class
- `SemanticMergeOptions` - Options for `semanticMerge()`
- `MapValidationRules` - Rules object for `validate()`
- `FindKeyResult<K>` - Result type for `findKeys()`
- `FindValueResult<K, V>` - Result type for `findValues()`
- `MapSemanticEqualsResult` - Result type for `semanticallyEquals()`

### Shared Types Used

- `SemanticGetResult<K, V>` - For `semanticGet()`
- `ValidateResult` - For `validate()`
- `MissingSuggestion` - For `suggestMissingKeys()`
- `InferPurposeResult` - For `inferPurpose()`

### Testing

All semantic operations are unit tested using mock LLM clients that return predefined responses. This ensures:
- Tests run quickly without actual LLM API calls
- Deterministic test results
- Coverage of all code paths including edge cases (empty maps, no matches, etc.)

### Usage Example

```typescript
import { SemanticMap } from 'semantic-primitives';

// Create a configuration map
const config = SemanticMap.from(new Map([
  ['DB_HOST', 'localhost'],
  ['DB_PORT', '5432'],
  ['API_KEY', 'secret-key'],
]));

// Semantic key lookup
const result = await config.semanticGet('database connection host');
// { value: 'localhost', matchedKey: 'DB_HOST', confidence: 0.95 }

// Find related keys
const securityKeys = await config.findKeys('security related settings');
// [{ key: 'API_KEY', relevance: 0.92 }]

// Infer purpose
const purpose = await config.inferPurpose();
// { purpose: 'configuration', subcategory: 'database-settings', confidence: 0.88 }
```
