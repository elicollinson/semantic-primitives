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
