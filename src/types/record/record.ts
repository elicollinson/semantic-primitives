/**
 * SemanticRecord
 * A Record type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<Record<K, V>> - Base semantic wrapper
 * - Comparable<SemanticRecord<K, V>> - Semantic equality comparison
 * - Validatable - Validation against semantic rules
 * - Summarizable - Content summarization
 * - SemanticAccessible - Semantic key lookup
 * - SemanticGroupable - Semantic grouping
 * - SemanticFilterable - Semantic filtering
 * - PurposeInferable - Purpose inference
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticGetResult,
  MissingSuggestion,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  RECORD_SYSTEM_PROMPT,
  createSemanticGetPrompt,
  createSemanticallyEqualsPrompt,
  createValidateKeysPrompt,
  createValidateValuesPrompt,
  createInferPurposePrompt,
  createSemanticFilterPrompt,
  createSuggestMissingKeysPrompt,
  createGroupByPrompt,
  createSummarizePrompt,
} from './prompts.ts';

export type {
  SemanticGetResult,
  MissingSuggestion,
} from '../../shared/types.ts';

/** Result of semantic equality comparison for records */
export interface RecordSemanticEqualsResult {
  equivalent: boolean;
  keyMappings?: Record<string, string>;
  confidence: number;
}

/** Result of key validation */
export interface ValidateKeysResult {
  valid: boolean;
  invalidKeys: string[];
  reasons: string[];
}

/** Invalid entry for value validation */
export interface InvalidEntry<K, V> {
  key: K;
  value: V;
  reason: string;
}

/** Result of value validation */
export interface ValidateValuesResult<K, V> {
  valid: boolean;
  invalidEntries: InvalidEntry<K, V>[];
}

/** Result of purpose inference for records */
export interface RecordInferPurposeResult {
  purpose: string;
  keyType: string;
  valueType: string;
  confidence: number;
}

/**
 * SemanticRecord - Record with LLM-powered semantic understanding
 *
 * Unlike traditional records that only support exact key matching,
 * semantic records can look up values using natural language queries,
 * find semantically equivalent keys, and understand key-value relationships.
 *
 * @template K - The type of keys in the record (extends string | number | symbol)
 * @template V - The type of values in the record
 */
export class SemanticRecord<K extends string | number | symbol, V>
  implements
    Semantic<Record<K, V>>,
    Comparable<SemanticRecord<K, V> | Record<K, V>, RecordSemanticEqualsResult>
{
  private readonly internalRecord: Record<K, V>;
  private readonly client: LLMClient;
  private readonly context?: string;

  private constructor(
    record: Record<K, V>,
    context?: string,
    client?: LLMClient
  ) {
    this.internalRecord = { ...record };
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticRecord from an existing Record object
   */
  static from<K extends string | number | symbol, V>(
    record: Record<K, V>,
    context?: string,
    client?: LLMClient
  ): SemanticRecord<K, V> {
    return new SemanticRecord(record, context, client);
  }

  /**
   * Create an empty SemanticRecord
   */
  static empty<K extends string | number | symbol, V>(
    client?: LLMClient
  ): SemanticRecord<K, V> {
    return new SemanticRecord({} as Record<K, V>, undefined, client);
  }

  /**
   * Get the underlying Record value
   */
  valueOf(): Record<K, V> {
    return { ...this.internalRecord };
  }

  /**
   * Get all keys
   */
  keys(): K[] {
    return Object.keys(this.internalRecord) as K[];
  }

  /**
   * Get all values
   */
  values(): V[] {
    return Object.values(this.internalRecord);
  }

  /**
   * Get all entries
   */
  entries(): [K, V][] {
    return Object.entries(this.internalRecord) as [K, V][];
  }

  /**
   * Get the number of entries
   */
  get size(): number {
    return Object.keys(this.internalRecord).length;
  }

  /**
   * Get a value by exact key
   */
  get(key: K): V | undefined {
    return this.internalRecord[key];
  }

  /**
   * Check if record has exact key
   */
  has(key: K): boolean {
    return key in this.internalRecord;
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
    if (this.size === 0) {
      return { value: undefined, matchedKey: undefined, confidence: 1.0 };
    }

    const keysArray = this.keys().map(k => String(k));
    const prompt = createSemanticGetPrompt(keysArray, query, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchedKeyIndex: number | null;
      confidence: number;
    };

    if (result.matchedKeyIndex === null) {
      return { value: undefined, matchedKey: undefined, confidence: result.confidence };
    }

    const entriesArray = this.entries();
    const matchedEntry = entriesArray[result.matchedKeyIndex];
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
   * Check if two records are semantically equivalent.
   *
   * @param other - Record to compare with
   * @returns Equivalence result with key mappings
   */
  async semanticallyEquals(
    other: SemanticRecord<K, V> | Record<K, V>
  ): Promise<RecordSemanticEqualsResult> {
    const otherRecord = other instanceof SemanticRecord ? other.valueOf() : other;

    const thisEntries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);
    const otherEntries = Object.entries(otherRecord).map(([k, v]) => [
      k,
      v,
    ] as [string, unknown]);

    if (thisEntries.length === 0 && otherEntries.length === 0) {
      return { equivalent: true, keyMappings: {}, confidence: 1.0 };
    }

    const prompt = createSemanticallyEqualsPrompt(thisEntries, otherEntries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as RecordSemanticEqualsResult;
  }

  /**
   * Validate keys against semantic rules.
   *
   * @param rules - Validation rules for keys
   * @returns Validation result
   */
  async validateKeys(rules: string[]): Promise<ValidateKeysResult> {
    if (this.size === 0) {
      return { valid: true, invalidKeys: [], reasons: [] };
    }

    const keysArray = this.keys().map(k => String(k));
    const prompt = createValidateKeysPrompt(keysArray, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      invalidKeys: string[];
      reasons: string[];
      confidence: number;
    };

    return {
      valid: result.valid,
      invalidKeys: result.invalidKeys,
      reasons: result.reasons,
    };
  }

  /**
   * Validate values against semantic rules.
   *
   * @param rules - Validation rules for values
   * @returns Validation result
   */
  async validateValues(rules: string[]): Promise<ValidateValuesResult<K, V>> {
    if (this.size === 0) {
      return { valid: true, invalidEntries: [] };
    }

    const entries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createValidateValuesPrompt(entries, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      invalidEntries: { key: string; value: unknown; reason: string }[];
      confidence: number;
    };

    return {
      valid: result.valid,
      invalidEntries: result.invalidEntries.map(e => ({
        key: e.key as K,
        value: e.value as V,
        reason: e.reason,
      })),
    };
  }

  /**
   * Infer the semantic purpose of this record.
   *
   * @returns Inferred purpose with key and value types
   */
  async inferPurpose(): Promise<RecordInferPurposeResult> {
    if (this.size === 0) {
      return { purpose: 'empty', keyType: 'unknown', valueType: 'unknown', confidence: 1.0 };
    }

    const entries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createInferPurposePrompt(entries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as RecordInferPurposeResult;
  }

  /**
   * Filter entries by semantic criteria.
   *
   * @param criteria - Natural language filter
   * @returns Filtered record
   */
  async semanticFilter(criteria: string): Promise<SemanticRecord<K, V>> {
    if (this.size === 0) {
      return SemanticRecord.empty<K, V>(this.client);
    }

    const entries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createSemanticFilterPrompt(entries, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchingIndices: number[];
      confidence: number;
    };

    const entriesArray = this.entries();
    const filteredRecord = {} as Record<K, V>;
    for (const index of result.matchingIndices) {
      const entry = entriesArray[index];
      if (entry) {
        filteredRecord[entry[0]] = entry[1];
      }
    }

    return SemanticRecord.from(filteredRecord, this.context, this.client);
  }

  /**
   * Suggest missing keys based on patterns.
   *
   * @returns Suggested keys with rationale
   */
  async suggestMissingKeys(): Promise<MissingSuggestion[]> {
    if (this.size === 0) {
      return [];
    }

    const entries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createSuggestMissingKeysPrompt(entries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
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
   * @returns Object of groups
   */
  async groupBy(criteria: string): Promise<Record<string, SemanticRecord<K, V>>> {
    if (this.size === 0) {
      return {};
    }

    const entries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createGroupByPrompt(entries, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      groups: Record<string, number[]>;
      confidence: number;
    };

    const entriesArray = this.entries();
    const groups: Record<string, SemanticRecord<K, V>> = {};

    for (const [groupName, indices] of Object.entries(result.groups)) {
      const groupRecord = {} as Record<K, V>;
      for (const index of indices) {
        const entry = entriesArray[index];
        if (entry) {
          groupRecord[entry[0]] = entry[1];
        }
      }
      groups[groupName] = SemanticRecord.from(groupRecord, this.context, this.client);
    }

    return groups;
  }

  /**
   * Summarize the record contents.
   *
   * @returns Human-readable summary
   */
  async summarize(): Promise<string> {
    if (this.size === 0) {
      return 'Empty record with no entries.';
    }

    const entries = this.entries().map(([k, v]) => [
      String(k),
      v,
    ] as [string, unknown]);

    const prompt = createSummarizePrompt(entries, this.size);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
      confidence: number;
    };

    return result.summary;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const entries = this.entries();
    const entriesStr = entries
      .map(([k, v]) => `${String(k)}: ${JSON.stringify(v)}`)
      .join(', ');
    return `SemanticRecord(${entries.length}) { ${entriesStr} }`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): Record<K, V> {
    return { ...this.internalRecord };
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries()[Symbol.iterator]();
  }

  /**
   * Execute a function for each entry
   */
  forEach(callback: (value: V, key: K) => void): void {
    for (const [key, value] of this.entries()) {
      callback(value, key);
    }
  }
}
