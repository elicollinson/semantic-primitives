/**
 * SemanticMap
 * A Map type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<Map<K, V>> - Base semantic wrapper
 * - Comparable<SemanticMap<K, V>> - Semantic equality comparison
 * - Validatable - Validation against semantic rules
 * - Summarizable - Content summarization
 * - SemanticAccessible - Semantic key lookup
 * - SemanticGroupable - Semantic grouping
 * - PurposeInferable - Purpose inference
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticGetResult,
  ValidateResult,
  MissingSuggestion,
  InferPurposeResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  MAP_SYSTEM_PROMPT,
  createSemanticGetPrompt,
  createSemanticHasPrompt,
  createSemanticallyEqualsPrompt,
  createFindKeysPrompt,
  createFindValuesPrompt,
  createSemanticMergePrompt,
  createValidatePrompt,
  createSuggestMissingKeysPrompt,
  createGroupByPrompt,
  createSummarizePrompt,
  createInferPurposePrompt,
} from './prompts.ts';

export type {
  SemanticGetResult,
  ValidateResult,
  MissingSuggestion,
  InferPurposeResult,
} from '../../shared/types.ts';

/** Options for semantic merge */
export interface SemanticMergeOptions {
  conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine';
}

/** Validation rules for map */
export interface MapValidationRules {
  keys?: string;
  values?: string;
}

/** Result of finding keys */
export interface FindKeyResult<K> {
  key: K;
  relevance: number;
}

/** Result of finding values */
export interface FindValueResult<K, V> {
  key: K;
  value: V;
  relevance: number;
}

/** Result of semantic equality comparison for maps */
export interface MapSemanticEqualsResult {
  equivalent: boolean;
  keyMappings?: [string, string][];
  confidence: number;
}

/**
 * SemanticMap - Map with LLM-powered semantic understanding
 *
 * Unlike traditional maps that only support exact key matching,
 * semantic maps can look up values using natural language queries,
 * find semantically equivalent keys, and understand key-value relationships.
 *
 * @template K - The type of keys in the map
 * @template V - The type of values in the map
 */
export class SemanticMap<K, V>
  implements
    Semantic<Map<K, V>>,
    Comparable<SemanticMap<K, V> | Map<K, V>, MapSemanticEqualsResult>
{
  private readonly internalMap: Map<K, V>;
  private readonly client: LLMClient;

  private constructor(entries?: Iterable<readonly [K, V]>, client?: LLMClient) {
    this.internalMap = new Map(entries);
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticMap from an existing Map or entries
   */
  static from<K, V>(
    source: Map<K, V> | Iterable<readonly [K, V]>,
    client?: LLMClient
  ): SemanticMap<K, V> {
    return new SemanticMap(source, client);
  }

  /**
   * Create an empty SemanticMap
   */
  static empty<K, V>(client?: LLMClient): SemanticMap<K, V> {
    return new SemanticMap<K, V>([], client);
  }

  /**
   * Create a SemanticMap from key-value pairs
   */
  static of<K, V>(
    ...entries: (readonly [K, V])[]
  ): SemanticMap<K, V> {
    return new SemanticMap(entries);
  }

  /**
   * Get the underlying Map value
   */
  valueOf(): Map<K, V> {
    return new Map(this.internalMap);
  }

  /**
   * Get the size of the map
   */
  get size(): number {
    return this.internalMap.size;
  }

  /**
   * Get a value by exact key
   */
  get(key: K): V | undefined {
    return this.internalMap.get(key);
  }

  /**
   * Check if map has exact key
   */
  has(key: K): boolean {
    return this.internalMap.has(key);
  }

  /**
   * Set a key-value pair (returns new SemanticMap)
   */
  set(key: K, value: V): SemanticMap<K, V> {
    const newMap = new Map(this.internalMap);
    newMap.set(key, value);
    return SemanticMap.from(newMap, this.client);
  }

  /**
   * Delete a key (returns new SemanticMap)
   */
  delete(key: K): SemanticMap<K, V> {
    const newMap = new Map(this.internalMap);
    newMap.delete(key);
    return SemanticMap.from(newMap, this.client);
  }

  /**
   * Get all keys
   */
  keys(): IterableIterator<K> {
    return this.internalMap.keys();
  }

  /**
   * Get all values
   */
  values(): IterableIterator<V> {
    return this.internalMap.values();
  }

  /**
   * Get all entries
   */
  entries(): IterableIterator<[K, V]> {
    return this.internalMap.entries();
  }

  /**
   * Get a value using semantic key matching.
   * Finds the key that best matches the query, not just exact matches.
   *
   * @param query - Key or semantic query
   * @param context - Optional context for matching
   * @returns Value if found with match confidence
   */
  async semanticGet(
    query: string,
    context?: Record<string, unknown>
  ): Promise<SemanticGetResult<K, V>> {
    if (this.internalMap.size === 0) {
      return { value: undefined, matchedKey: undefined, confidence: 1.0 };
    }

    const keysArray = Array.from(this.internalMap.keys()).map(k => String(k));
    const prompt = createSemanticGetPrompt(keysArray, query, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchedKeyIndex: number | null;
      confidence: number;
    };

    if (result.matchedKeyIndex === null) {
      return { value: undefined, matchedKey: undefined, confidence: result.confidence };
    }

    const entries = Array.from(this.internalMap.entries());
    const matchedEntry = entries[result.matchedKeyIndex];
    if (!matchedEntry) {
      return { value: undefined, matchedKey: undefined, confidence: result.confidence };
    }

    return {
      value: matchedEntry[1],
      matchedKey: matchedEntry[0],
      confidence: result.confidence,
    };
  }

  /**
   * Check if the map contains a semantically matching key.
   *
   * @param query - Key or semantic query
   * @returns Whether a matching key exists
   */
  async semanticHas(query: string): Promise<boolean> {
    if (this.internalMap.size === 0) {
      return false;
    }

    const keysArray = Array.from(this.internalMap.keys()).map(k => String(k));
    const prompt = createSemanticHasPrompt(keysArray, query);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      hasMatch: boolean;
      matchedKeyIndex: number | null;
      confidence: number;
    };

    return result.hasMatch;
  }

  /**
   * Check if two maps are semantically equivalent.
   *
   * @param other - Map to compare with
   * @returns Equivalence result with key mappings
   */
  async semanticallyEquals(
    other: SemanticMap<K, V> | Map<K, V>
  ): Promise<MapSemanticEqualsResult> {
    const otherMap = other instanceof SemanticMap ? other.valueOf() : other;

    const thisEntries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);
    const otherEntries = Array.from(otherMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    if (thisEntries.length === 0 && otherEntries.length === 0) {
      return { equivalent: true, keyMappings: [], confidence: 1.0 };
    }

    const prompt = createSemanticallyEqualsPrompt(thisEntries, otherEntries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as MapSemanticEqualsResult;
  }

  /**
   * Find all keys matching semantic criteria.
   *
   * @param criteria - Natural language criteria
   * @returns Matching keys with relevance
   */
  async findKeys(criteria: string): Promise<FindKeyResult<K>[]> {
    if (this.internalMap.size === 0) {
      return [];
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createFindKeysPrompt(entries, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matches: { keyIndex: number; relevance: number }[];
      confidence: number;
    };

    const keysArray = Array.from(this.internalMap.keys());
    const results: FindKeyResult<K>[] = [];
    for (const m of result.matches) {
      const key = keysArray[m.keyIndex];
      if (key !== undefined) {
        results.push({ key, relevance: m.relevance });
      }
    }
    return results;
  }

  /**
   * Find all values matching semantic criteria.
   *
   * @param criteria - Natural language criteria
   * @returns Matching entries with relevance
   */
  async findValues(criteria: string): Promise<FindValueResult<K, V>[]> {
    if (this.internalMap.size === 0) {
      return [];
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createFindValuesPrompt(entries, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matches: { entryIndex: number; relevance: number }[];
      confidence: number;
    };

    const entriesArray = Array.from(this.internalMap.entries());
    const results: FindValueResult<K, V>[] = [];
    for (const m of result.matches) {
      const entry = entriesArray[m.entryIndex];
      if (entry) {
        results.push({ key: entry[0], value: entry[1], relevance: m.relevance });
      }
    }
    return results;
  }

  /**
   * Merge another map with semantic key matching.
   *
   * @param other - Map to merge
   * @param options - Merge options
   * @returns Merged map
   */
  async semanticMerge(
    other: Map<K, V> | SemanticMap<K, V>,
    options?: SemanticMergeOptions
  ): Promise<SemanticMap<K, V>> {
    const otherMap = other instanceof SemanticMap ? other.valueOf() : other;
    const conflictResolution = options?.conflictResolution ?? 'prefer-other';

    if (this.internalMap.size === 0) {
      return SemanticMap.from(otherMap, this.client);
    }
    if (otherMap.size === 0) {
      return SemanticMap.from(this.internalMap, this.client);
    }

    const thisEntries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);
    const otherEntries = Array.from(otherMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createSemanticMergePrompt(
      thisEntries,
      otherEntries,
      conflictResolution
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      mergedEntries: { key: string; value: unknown; source: string }[];
      keyMappings: [string, string][];
      confidence: number;
    };

    const merged = new Map<K, V>();
    for (const entry of result.mergedEntries) {
      merged.set(entry.key as K, entry.value as V);
    }

    return SemanticMap.from(merged, this.client);
  }

  /**
   * Validate all key-value pairs against semantic rules.
   *
   * @param rules - Validation rules for keys and/or values
   * @returns Validation result
   */
  async validate(rules: MapValidationRules): Promise<ValidateResult> {
    if (this.internalMap.size === 0) {
      return { valid: true, issues: [] };
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createValidatePrompt(entries, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      issues: string[];
      confidence: number;
    };

    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Suggest missing keys based on existing patterns.
   *
   * @returns Suggested keys with rationale
   */
  async suggestMissingKeys(): Promise<MissingSuggestion[]> {
    if (this.internalMap.size === 0) {
      return [];
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createSuggestMissingKeysPrompt(entries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: { key: string; reason: string }[];
      confidence: number;
    };

    return result.suggestions.map(s => ({
      key: s.key,
      reason: s.reason,
    }));
  }

  /**
   * Group entries by semantic criteria.
   *
   * @param criteria - Grouping criteria
   * @returns Map of groups
   */
  async groupBy(criteria: string): Promise<Map<string, SemanticMap<K, V>>> {
    if (this.internalMap.size === 0) {
      return new Map();
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createGroupByPrompt(entries, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      groups: Record<string, number[]>;
      confidence: number;
    };

    const entriesArray = Array.from(this.internalMap.entries());
    const groups = new Map<string, SemanticMap<K, V>>();

    for (const [groupName, indices] of Object.entries(result.groups)) {
      const groupEntries = indices
        .map(i => entriesArray[i])
        .filter((e): e is [K, V] => e !== undefined);
      groups.set(groupName, SemanticMap.from(groupEntries, this.client));
    }

    return groups;
  }

  /**
   * Summarize the map contents.
   *
   * @returns Human-readable summary
   */
  async summarize(): Promise<string> {
    if (this.internalMap.size === 0) {
      return 'Empty map with no entries.';
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createSummarizePrompt(entries, this.internalMap.size);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
      confidence: number;
    };

    return result.summary;
  }

  /**
   * Infer the semantic purpose of this map.
   *
   * @returns Inferred purpose
   */
  async inferPurpose(): Promise<InferPurposeResult> {
    if (this.internalMap.size === 0) {
      return { purpose: 'empty', confidence: 1.0 };
    }

    const entries = Array.from(this.internalMap.entries()).map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createInferPurposePrompt(entries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferPurposeResult;
  }

  // Standard Map methods that return SemanticMap

  /**
   * Execute a function for each entry
   */
  forEach(
    callback: (value: V, key: K, map: Map<K, V>) => void
  ): void {
    this.internalMap.forEach(callback);
  }

  /**
   * Clear the map (returns new empty SemanticMap)
   */
  clear(): SemanticMap<K, V> {
    return SemanticMap.empty<K, V>(this.client);
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.internalMap[Symbol.iterator]();
  }

  /**
   * Convert to string
   */
  toString(): string {
    const entries = Array.from(this.internalMap.entries());
    return `SemanticMap(${entries.length}) { ${entries.map(([k, v]) => `${String(k)} => ${JSON.stringify(v)}`).join(', ')} }`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): Record<string, V> {
    const result: Record<string, V> = {};
    for (const [key, value] of this.internalMap) {
      result[String(key)] = value;
    }
    return result;
  }
}
