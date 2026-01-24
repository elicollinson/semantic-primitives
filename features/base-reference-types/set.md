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
