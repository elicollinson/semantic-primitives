# SemanticArray

## Overview

The `SemanticArray<T>` type extends the native JavaScript Array with LLM-powered semantic understanding. It enables meaning-aware operations on collections including semantic filtering, intelligent grouping, and content-aware transformations.

**Core Principle**: Arrays represent ordered collections with meaning - semantic operations should understand element relationships, patterns, and collective meaning.

---

## Interface

```typescript
interface SemanticArray<T> extends Array<T> {
  /**
   * Check if two arrays are semantically equivalent.
   * Considers element meaning, order significance, and context.
   *
   * @param other - Array to compare with
   * @param options - Comparison options
   * @returns Equivalence result
   *
   * @example
   * SemanticArray.from(["red", "blue"]).semanticallyEquals(["crimson", "navy"])
   * // { equivalent: true, confidence: 0.85, note: "Same colors, different shades" }
   */
  semanticallyEquals(
    other: T[] | SemanticArray<T>,
    options?: { orderMatters?: boolean; threshold?: number }
  ): { equivalent: boolean; confidence: number; note?: string };

  /**
   * Filter elements using natural language criteria.
   *
   * @param criteria - Natural language filter condition
   * @returns Filtered SemanticArray
   *
   * @example
   * products.semanticFilter("items under $50 with good reviews")
   * users.semanticFilter("active users who signed up this month")
   */
  semanticFilter(criteria: string): SemanticArray<T>;

  /**
   * Group elements by semantic similarity or criteria.
   *
   * @param criteria - Grouping criteria (natural language or field name)
   * @returns Map of groups
   *
   * @example
   * products.semanticGroup("by category")
   * // Map { "electronics": [...], "clothing": [...] }
   *
   * feedback.semanticGroup("by sentiment")
   * // Map { "positive": [...], "negative": [...], "neutral": [...] }
   */
  semanticGroup(criteria: string): Map<string, SemanticArray<T>>;

  /**
   * Sort elements using semantic understanding.
   *
   * @param criteria - Natural language sort criteria
   * @returns Sorted SemanticArray
   *
   * @example
   * tasks.semanticSort("by urgency and importance")
   * products.semanticSort("by value for money")
   */
  semanticSort(criteria: string): SemanticArray<T>;

  /**
   * Find elements matching semantic criteria.
   *
   * @param criteria - Natural language search criteria
   * @param options - Search options
   * @returns Matching elements with relevance scores
   *
   * @example
   * articles.semanticSearch("machine learning tutorials for beginners")
   * // [{ item: {...}, relevance: 0.92 }, ...]
   */
  semanticSearch(
    criteria: string,
    options?: { limit?: number }
  ): Array<{ item: T; relevance: number }>;

  /**
   * Detect patterns in the array data.
   *
   * @returns Detected patterns
   *
   * @example
   * salesData.detectPatterns()
   * // { patterns: ["weekly cycle", "increasing trend"], anomalies: [...] }
   */
  detectPatterns(): {
    patterns: string[];
    anomalies: Array<{ index: number; reason: string }>;
  };

  /**
   * Summarize the array contents.
   *
   * @param options - Summary options
   * @returns Human-readable summary
   *
   * @example
   * transactions.summarize()
   * // "150 transactions totaling $12,450. Mostly food & dining (45%). Peak on weekends."
   */
  summarize(options?: { maxLength?: number; focus?: string }): string;

  /**
   * Remove semantic duplicates (items with same meaning).
   *
   * @param options - Deduplication options
   * @returns Deduplicated array
   *
   * @example
   * phrases.semanticUnique()
   * // Removes "buy now" if "purchase immediately" exists
   */
  semanticUnique(options?: { threshold?: number }): SemanticArray<T>;

  /**
   * Validate all elements against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result
   *
   * @example
   * emails.validate(["must be professional", "no spam-like content"])
   * // { valid: false, issues: [{ index: 5, problems: ["spam-like subject"] }] }
   */
  validate(rules: string[]): {
    valid: boolean;
    issues: Array<{ index: number; problems: string[] }>;
  };

  /**
   * Enrich each element with additional semantic information.
   *
   * @param enrichments - Fields to add
   * @returns Enriched array
   *
   * @example
   * reviews.enrich({ sentiment: "positive/negative/neutral", topics: "main topics" })
   */
  enrich<E extends Record<string, string>>(
    enrichments: E
  ): SemanticArray<T & { [K in keyof E]: string }>;

  /**
   * Detect the semantic type of array elements.
   *
   * @returns Inferred element type
   *
   * @example
   * data.inferElementType()
   * // { type: "user-profile", confidence: 0.92, fields: [...] }
   */
  inferElementType(): { type: string; confidence: number; fields?: string[] };
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number; note?: string }` | `SemanticEqualsResultWithReason` |
| `semanticSearch()` | `Array<{ item: T; relevance: number }>` | `SearchResult<T>[]` |
| `detectPatterns()` | `{ patterns: string[]; anomalies: Array<...> }` | `DetectPatternResult` (extended) |
| `inferElementType()` | `{ type: string; confidence: number; fields?: string[] }` | `InferTypeResult` (extended) |

Import shared types:
```typescript
import {
  SemanticEqualsResultWithReason,
  SearchResult,
  DetectPatternResult,
  InferTypeResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

```
src/types/array/
├── index.ts              # Public API exports
├── array.ts              # SemanticArray class implementation
├── prompts.ts            # LLM prompt templates
└── __tests__/
    ├── array.test.ts     # 79 unit tests
    └── mocks.ts          # Mock LLM client and responses
```

### Design Decisions

1. **Class-based implementation**: `SemanticArray<T>` is a class that wraps an internal array rather than extending `Array`. This approach:
   - Provides better encapsulation of the LLM client
   - Avoids complications with Array subclassing
   - Enables immutable operations (all operations return new SemanticArray instances)

2. **Async methods**: All LLM-powered methods return `Promise` since they require API calls:
   - `semanticallyEquals()`, `semanticFilter()`, `semanticGroup()`, `semanticSort()`
   - `semanticSearch()`, `detectPatterns()`, `summarize()`, `semanticUnique()`
   - `validate()`, `enrich()`, `inferElementType()`

3. **Standard array methods preserved**: Common array methods (`map`, `filter`, `reduce`, `forEach`, etc.) are implemented synchronously and return appropriate types (SemanticArray for chainable methods).

4. **Interface implementation**: The class implements `Semantic<T[]>` and `Comparable<SemanticArray<T> | T[], SemanticEqualsResultWithReason>` from shared interfaces. Other interfaces (like `SemanticFilterable`, `SemanticSortable`) were not implemented because they define synchronous return types, but our methods are async.

5. **Renamed types**: `SemanticEqualsOptions` was renamed to `ArraySemanticEqualsOptions` to avoid export collision with `SemanticNumber`'s options type.

### Custom Types

The implementation defines these array-specific types:

- `ArraySemanticEqualsOptions` - Options for equality comparison
- `SemanticSearchOptions` - Options for semantic search (limit)
- `SummarizeOptions` - Options for summarization (maxLength, focus)
- `SemanticUniqueOptions` - Options for deduplication (threshold)
- `ArrayValidateResult` - Validation result with per-element issues
- `ArrayInferTypeResult` - Element type inference with optional fields
- `ArrayDetectPatternResult` - Pattern detection with anomalies

### LLM Integration

- Temperature 0.1 is used for deterministic operations (filter, sort, group, search, validate, unique)
- Temperature 0.3 is used for more creative operations (summarize, enrich)
- All LLM responses are expected as JSON and parsed with `JSON.parse()`

### Testing

- 79 unit tests covering all methods
- Tests use mock LLM clients that return predefined responses
- No actual LLM calls are made during testing
