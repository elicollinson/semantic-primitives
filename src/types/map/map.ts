/**
 * SemanticMap
 * A Map type with LLM-powered semantic understanding
 *
 * Extends native JavaScript Map with semantic capabilities including:
 * - Semantic key lookup
 * - Meaning-aware membership checks
 * - Intelligent merge operations
 * - Semantic validation
 * - Purpose inference
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticGetResult,
  SemanticEqualsResultWithMappings,
  ValidateResult,
  MissingSuggestion,
  InferPurposeResult,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
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
  SemanticEqualsResultWithMappings,
  SearchResult,
  ValidateResult,
  MissingSuggestion,
  InferPurposeResult,
} from '../../shared/types.ts';

/** Result of findKeys operation */
export interface FindKeysResult<K> {
  key: K;
  relevance: number;
}

/** Result of findValues operation */
export interface FindValuesResult<K, V> {
  key: K;
  value: V;
  relevance: number;
}

/** Options for semantic merge */
export interface SemanticMergeOptions {
  conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine';
}

/** Validation rules for map */
export interface MapValidationRules {
  keys?: string;
  values?: string;
}

/**
 * SemanticMap - Map with LLM-powered semantic understanding
 *
 * Unlike traditional maps that require exact key matches,
 * semantic maps can find keys by meaning and understand
 * key-value relationships.
 *
 * @template K - The type of keys
 * @template V - The type of values
 */
export class SemanticMap<K extends string, V> implements Semantic<Map<K, V>> {
  private readonly map: Map<K, V>;
  private readonly client: LLMClient;

  private constructor(entries?: Iterable<[K, V]>, client?: LLMClient) {
    this.map = new Map(entries);
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticMap from entries
   */
  static from<K extends string, V>(
    entries?: Iterable<[K, V]> | Map<K, V>,
    client?: LLMClient
  ): SemanticMap<K, V> {
    if (entries instanceof Map) {
      return new SemanticMap(entries.entries(), client);
    }
    return new SemanticMap(entries, client);
  }

  /**
   * Create an empty SemanticMap
   */
  static empty<K extends string, V>(client?: LLMClient): SemanticMap<K, V> {
    return new SemanticMap<K, V>(undefined, client);
  }

  /**
   * Get the underlying Map value
   */
  valueOf(): Map<K, V> {
    return new Map(this.map);
  }

  /**
   * Get the number of entries
   */
  get size(): number {
    return this.map.size;
  }

  // ===========================================================================
  // STANDARD MAP METHODS
  // ===========================================================================

  /**
   * Get a value by exact key match
   */
  get(key: K): V | undefined {
    return this.map.get(key);
  }

  /**
   * Set a key-value pair
   */
  set(key: K, value: V): this {
    this.map.set(key, value);
    return this;
  }

  /**
   * Check if key exists (exact match)
   */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Delete a key
   */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Get all keys
   */
  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  /**
   * Get all values
   */
  values(): IterableIterator<V> {
    return this.map.values();
  }

  /**
   * Get all entries
   */
  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  /**
   * Execute a function for each entry
   */
  forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
    this.map.forEach(callback);
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.map[Symbol.iterator]();
  }

  // ===========================================================================
  // SEMANTIC OPERATIONS
  // ===========================================================================

  /**
   * Get a value using semantic key matching
   */
  async semanticGet(
    query: string,
    context?: Record<string, unknown>
  ): Promise<SemanticGetResult<K, V>> {
    const keys = Array.from(this.map.keys());
    if (keys.length === 0) {
      return { value: undefined, matchedKey: undefined, confidence: 1.0 };
    }

    const prompt = createSemanticGetPrompt(keys, query, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchedKey: K | null;
      confidence: number;
    };

    return {
      value: result.matchedKey ? this.map.get(result.matchedKey) : undefined,
      matchedKey: result.matchedKey ?? undefined,
      confidence: result.confidence,
    };
  }

  /**
   * Check if the map contains a semantically matching key
   */
  async semanticHas(query: string): Promise<boolean> {
    const keys = Array.from(this.map.keys());
    if (keys.length === 0) {
      return false;
    }

    const prompt = createSemanticHasPrompt(keys, query);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { has: boolean; confidence: number };
    return result.has;
  }

  /**
   * Check if two maps are semantically equivalent
   */
  async semanticallyEquals(
    other: Map<string, unknown> | SemanticMap<string, unknown>
  ): Promise<SemanticEqualsResultWithMappings> {
    const otherMap = other instanceof SemanticMap ? other.valueOf() : other;
    const thisEntries = Array.from(this.map.entries()) as [string, unknown][];
    const otherEntries = Array.from(otherMap.entries());

    const prompt = createSemanticallyEqualsPrompt(thisEntries, otherEntries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      equivalent: boolean;
      keyMappings: [string, string][];
      confidence: number;
    };

    return {
      equivalent: result.equivalent,
      mappings: result.keyMappings.length > 0
        ? Object.fromEntries(result.keyMappings)
        : undefined,
      confidence: result.confidence,
    };
  }

  /**
   * Find all keys matching semantic criteria
   */
  async findKeys(criteria: string): Promise<FindKeysResult<K>[]> {
    const keys = Array.from(this.map.keys());
    if (keys.length === 0) {
      return [];
    }

    const prompt = createFindKeysPrompt(keys, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matches: { key: K; relevance: number }[];
      confidence: number;
    };

    return result.matches;
  }

  /**
   * Find all values matching semantic criteria
   */
  async findValues(criteria: string): Promise<FindValuesResult<K, V>[]> {
    const entries = Array.from(this.map.entries());
    if (entries.length === 0) {
      return [];
    }

    const prompt = createFindValuesPrompt(entries as [string, unknown][], criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matches: { key: K; relevance: number }[];
      confidence: number;
    };

    return result.matches
      .filter((m) => this.map.has(m.key))
      .map((m) => ({
        key: m.key,
        value: this.map.get(m.key) as V,
        relevance: m.relevance,
      }));
  }

  /**
   * Merge another map with semantic key matching
   */
  async semanticMerge(
    other: Map<string, unknown> | SemanticMap<string, unknown>,
    options?: SemanticMergeOptions
  ): Promise<SemanticMap<K, V>> {
    const otherMap = other instanceof SemanticMap ? other.valueOf() : other;
    const thisEntries = Array.from(this.map.entries()) as [string, unknown][];
    const otherEntries = Array.from(otherMap.entries());
    const conflictResolution = options?.conflictResolution ?? 'prefer-this';

    const prompt = createSemanticMergePrompt(thisEntries, otherEntries, conflictResolution);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      mergedEntries: [K, V][];
      confidence: number;
    };

    return SemanticMap.from(result.mergedEntries, this.client);
  }

  /**
   * Validate all key-value pairs against semantic rules
   */
  async validate(rules: MapValidationRules): Promise<ValidateResult> {
    const entries = Array.from(this.map.entries());
    if (entries.length === 0) {
      return { valid: true, issues: [] };
    }

    const prompt = createValidatePrompt(entries as [string, unknown][], rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as ValidateResult & { confidence: number };
    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Suggest missing keys based on existing patterns
   */
  async suggestMissingKeys(): Promise<MissingSuggestion[]> {
    const keys = Array.from(this.map.keys());
    if (keys.length === 0) {
      return [];
    }

    const prompt = createSuggestMissingKeysPrompt(keys);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: { key: string; reason: string }[];
      confidence: number;
    };

    return result.suggestions.map((s) => ({ key: s.key, reason: s.reason }));
  }

  /**
   * Group entries by semantic criteria
   */
  async groupBy(criteria: string): Promise<Map<string, SemanticMap<K, V>>> {
    const entries = Array.from(this.map.entries());
    if (entries.length === 0) {
      return new Map();
    }

    const prompt = createGroupByPrompt(entries as [string, unknown][], criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      groups: Record<string, K[]>;
      confidence: number;
    };

    const groups = new Map<string, SemanticMap<K, V>>();
    for (const [groupName, keys] of Object.entries(result.groups)) {
      const groupEntries = keys
        .filter((k: K) => this.map.has(k))
        .map((k: K) => [k, this.map.get(k) as V] as [K, V]);
      groups.set(groupName, SemanticMap.from(groupEntries, this.client));
    }

    return groups;
  }

  /**
   * Summarize the map contents
   */
  async summarize(): Promise<string> {
    const entries = Array.from(this.map.entries());
    if (entries.length === 0) {
      return 'Empty map with no entries.';
    }

    const prompt = createSummarizePrompt(entries as [string, unknown][]);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { summary: string; confidence: number };
    return result.summary;
  }

  /**
   * Infer the semantic purpose of this map
   */
  async inferPurpose(): Promise<InferPurposeResult> {
    const entries = Array.from(this.map.entries());
    if (entries.length === 0) {
      return { purpose: 'empty', confidence: 1.0 };
    }

    const prompt = createInferPurposePrompt(entries as [string, unknown][]);

    const response = await this.client.complete({
      prompt,
      systemPrompt: MAP_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferPurposeResult;
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<K, V> {
    return Object.fromEntries(this.map) as Record<K, V>;
  }

  /**
   * Convert to JSON
   */
  toJSON(): Record<K, V> {
    return this.toObject();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return `SemanticMap(${this.size})`;
  }
}
