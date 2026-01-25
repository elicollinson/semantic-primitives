# SemanticSet

## Overview

The `SemanticSet<T>` type extends the native JavaScript Set with LLM-powered semantic understanding. It enables meaning-aware membership checks, intelligent set operations, and semantic deduplication.

**Core Principle**: Sets represent unique value collections - semantic operations should understand value equivalence beyond exact matching.

---

## Interface

```typescript
interface SemanticSet<T> extends Set<T> {
  /**
   * Check if the set contains a semantically equivalent value.
   *
   * @param query - Value or semantic query
   * @returns Whether a matching value exists
   *
   * @example
   * colors.semanticHas("crimson") // true if has "red"
   * skills.semanticHas("programming") // true if has "coding", "software development"
   */
  semanticHas(query: string | T): boolean;

  /**
   * Add a value only if no semantic equivalent exists.
   *
   * @param value - Value to add
   * @returns Whether the value was added
   *
   * @example
   * tags.semanticAdd("ML") // false if "machine learning" already exists
   */
  semanticAdd(value: T): boolean;

  /**
   * Check if two sets are semantically equivalent.
   *
   * @param other - Set to compare with
   * @returns Equivalence result
   *
   * @example
   * set1.semanticallyEquals(set2)
   * // { equivalent: true, mappings: [["red", "crimson"]], confidence: 0.9 }
   */
  semanticallyEquals(other: Set<T> | SemanticSet<T>): {
    equivalent: boolean;
    mappings?: Array<[T, T]>;
    confidence: number;
  };

  /**
   * Get semantic intersection with another set.
   *
   * @param other - Set to intersect with
   * @returns Intersection with semantic matching
   *
   * @example
   * skills1.semanticIntersection(skills2)
   * // Matches "JavaScript" with "JS", "Node.js" with "NodeJS"
   */
  semanticIntersection(other: Set<T>): SemanticSet<T>;

  /**
   * Get semantic union, merging equivalent values.
   *
   * @param other - Set to union with
   * @returns Union with semantic deduplication
   *
   * @example
   * tags1.semanticUnion(tags2)
   * // Combines without duplicating "ML" and "machine learning"
   */
  semanticUnion(other: Set<T>): SemanticSet<T>;

  /**
   * Get semantic difference (values not in other set).
   *
   * @param other - Set to diff against
   * @returns Difference with semantic matching
   *
   * @example
   * allSkills.semanticDifference(requiredSkills)
   * // Excludes "Python" if required has "Python programming"
   */
  semanticDifference(other: Set<T>): SemanticSet<T>;

  /**
   * Find values matching semantic criteria.
   *
   * @param criteria - Natural language criteria
   * @returns Matching values
   *
   * @example
   * skills.semanticFilter("backend technologies")
   * // ["Node.js", "PostgreSQL", "Redis"]
   */
  semanticFilter(criteria: string): SemanticSet<T>;

  /**
   * Group set values by semantic category.
   *
   * @param criteria - Grouping criteria
   * @returns Grouped values
   *
   * @example
   * skills.groupBy("technology area")
   * // Map { "frontend": ["React", "CSS"], "backend": ["Node", "Python"] }
   */
  groupBy(criteria: string): Map<string, SemanticSet<T>>;

  /**
   * Summarize the set contents.
   *
   * @returns Human-readable summary
   *
   * @example
   * permissions.summarize()
   * // "15 permissions: 8 read, 5 write, 2 admin. Covers user and content management."
   */
  summarize(): string;

  /**
   * Suggest related values that might belong in this set.
   *
   * @returns Suggested additions
   *
   * @example
   * skills.suggestRelated()
   * // [{ value: "TypeScript", reason: "Commonly paired with JavaScript" }]
   */
  suggestRelated(): Array<{ value: string; reason: string }>;

  /**
   * Validate all values against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * tags.validate(["must be lowercase", "no special characters"])
   */
  validate(rules: string[]): {
    valid: boolean;
    issues: Array<{ value: T; problems: string[] }>;
  };

  /**
   * Detect the semantic theme/category of this set.
   *
   * @returns Inferred theme
   *
   * @example
   * values.inferTheme()
   * // { theme: "programming languages", confidence: 0.92 }
   */
  inferTheme(): { theme: string; confidence: number };
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; mappings?: Array<[T, T]>; confidence: number }` | `SemanticEqualsResult` (extended) |
| `suggestRelated()` | `Array<{ value: string; reason: string }>` | `RelatedSuggestion[]` |
| `inferTheme()` | `{ theme: string; confidence: number }` | `ConfidenceResult` (extended) |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  RelatedSuggestion,
  ConfidenceResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### Design Decisions

1. **Immutable Operations**: All mutating operations (`add`, `delete`, `clear`, `semanticAdd`) return new `SemanticSet` instances rather than mutating in place. This follows functional programming patterns and enables easier reasoning about state changes.

2. **Async Semantic Methods**: All LLM-powered methods (`semanticHas`, `semanticAdd`, `semanticallyEquals`, etc.) are async and return Promises. This reflects the inherent asynchronous nature of LLM API calls.

3. **semanticAdd Return Type**: The `semanticAdd` method returns an object containing both the result (`SemanticAddResult`) and the potentially modified set. This allows callers to check whether the add was successful and access the new set in a single call:
   ```typescript
   const { result, set: newSet } = await set.semanticAdd('ML');
   if (result.added) {
     // use newSet
   }
   ```

4. **Factory Methods**: The class uses a private constructor with static factory methods (`from`, `empty`, `of`) following the pattern established by `SemanticArray`. This provides clear, intention-revealing construction APIs.

5. **LLM Client Injection**: An optional `LLMClient` can be passed to factory methods for dependency injection, enabling easy testing with mocked clients.

### File Structure

```
src/types/set/
├── index.ts       # Re-exports public API
├── set.ts         # Main SemanticSet class (450+ lines)
├── prompts.ts     # LLM prompt templates (12 prompts)
└── __tests__/
    ├── set.test.ts  # 68 test cases
    └── mocks.ts     # Mock responses and client factories
```

### Exported Types

- `SemanticSet<T>` - Main class
- `SemanticHasResult` - Result of `semanticHas()`
- `SemanticAddResult` - Result of `semanticAdd()`
- `SetSemanticEqualsResult` - Result of `semanticallyEquals()`
- `SetSummarizeOptions` - Options for `summarize()`
- `SetValidateResult` - Result of `validate()`
- `InferThemeResult` - Result of `inferTheme()`

### Test Coverage

68 test cases covering:
- Factory methods (5 tests)
- Value access (5 tests)
- `semanticHas` (4 tests)
- `semanticAdd` (4 tests)
- `semanticallyEquals` (5 tests)
- `semanticIntersection` (4 tests)
- `semanticUnion` (4 tests)
- `semanticDifference` (4 tests)
- `semanticFilter` (3 tests)
- `groupBy` (2 tests)
- `summarize` (3 tests)
- `suggestRelated` (3 tests)
- `validate` (3 tests)
- `inferTheme` (3 tests)
- Standard Set methods (12 tests)
- Error handling (2 tests)
- Operation chaining (2 tests)
- Type safety (2 tests)

### Temperature Settings

- Deterministic operations (has, add, equals, filter, intersect, union, diff, validate, inferTheme): `temperature: 0.1`
- Creative operations (summarize, suggestRelated): `temperature: 0.3`
