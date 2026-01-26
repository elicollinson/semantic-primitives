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
 * - PurposeInferable - Purpose inference
 * - SemanticFilterable - Semantic filtering
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithMappings,
  SemanticGetResult,
  MissingSuggestion,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  RECORD_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createValidateKeysPrompt,
  createValidateValuesPrompt,
  createInferPurposePrompt,
  createSemanticGetPrompt,
  createSemanticFilterPrompt,
  createSuggestMissingKeysPrompt,
  createGroupByPrompt,
  createSummarizePrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithMappings,
  SemanticGetResult,
  MissingSuggestion,
} from '../../shared/types.ts';

/** Result of key validation */
export interface ValidateKeysResult {
  valid: boolean;
  invalidKeys: string[];
  reasons: string[];
}

/** Result of value validation */
export interface ValidateValuesResult<K, V> {
  valid: boolean;
  invalidEntries: { key: K; value: V; reason: string }[];
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
    Comparable<SemanticRecord<K, V> | Record<K, V>, SemanticEqualsResultWithMappings>
{
  private readonly internalRecord: Record<K, V>;
  private readonly client: LLMClient;
  private readonly context?: string;

  private constructor(
    obj: Record<K, V>,
    context?: string,
    client?: LLMClient
  ) {
    this.internalRecord = { ...obj };
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticRecord from a plain object
   *
   * @param obj - Record object
   * @param context - Optional context about the record's purpose
   * @param client - Optional LLM client
   * @returns SemanticRecord instance
   *
   * @example
   * SemanticRecord.from({ USD: 1.0, EUR: 0.85, GBP: 0.73 }, "exchange rates")
   */
  static from<K extends string | number | symbol, V>(
    obj: Record<K, V>,
    context?: string,
    client?: LLMClient
  ): SemanticRecord<K, V> {
    return new SemanticRecord(obj, context, client);
  }

  /**
   * Create an empty SemanticRecord
   */
  static empty<K extends string | number | symbol, V>(
    context?: string,
    client?: LLMClient
  ): SemanticRecord<K, V> {
    return new SemanticRecord({} as Record<K, V>, context, client);
  }

  /**
   * Get the underlying Record value
   */
  valueOf(): Record<K, V> {
    return { ...this.internalRecord };
  }

  /**
   * Get the number of entries in the record
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
   * Set a key-value pair (returns new SemanticRecord)
   */
  set(key: K, value: V): SemanticRecord<K, V> {
    const newRecord = { ...this.internalRecord, [key]: value } as Record<K, V>;
    return SemanticRecord.from(newRecord, this.context, this.client);
  }

  /**
   * Delete a key (returns new SemanticRecord)
   */
  delete(key: K): SemanticRecord<K, V> {
    const newRecord = { ...this.internalRecord };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete newRecord[key];
    return SemanticRecord.from(newRecord, this.context, this.client);
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
   * Check if two records are semantically equivalent.
   *
   * @param other - Record to compare
   * @returns Equivalence result with key mappings
   *
   * @example
   * record1.semanticallyEquals(record2)
   * // { equivalent: true, mappings: { "US_DOLLAR": "USD" }, confidence: 0.95 }
   */
  async semanticallyEquals(
    other: SemanticRecord<K, V> | Record<K, V>
  ): Promise<SemanticEqualsResultWithMappings> {
    const otherRecord = other instanceof SemanticRecord ? other.valueOf() : other;

    const thisEntries = Object.entries(this.internalRecord);
    const otherEntries = Object.entries(otherRecord);

    if (thisEntries.length === 0 && otherEntries.length === 0) {
      return { equivalent: true, mappings: {}, confidence: 1.0 };
    }

    const prompt = createSemanticallyEqualsPrompt(thisEntries, otherEntries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      equivalent: boolean;
      keyMappings: Record<string, string>;
      confidence: number;
    };

    return {
      equivalent: result.equivalent,
      mappings: result.keyMappings,
      confidence: result.confidence,
    };
  }

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
  async validateKeys(rules: string[]): Promise<ValidateKeysResult> {
    const keys = this.keys().map(k => String(k));

    if (keys.length === 0) {
      return { valid: true, invalidKeys: [], reasons: [] };
    }

    const prompt = createValidateKeysPrompt(keys, rules);

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
   *
   * @example
   * prices.validateValues(["must be positive numbers", "should be reasonable prices"])
   */
  async validateValues(rules: string[]): Promise<ValidateValuesResult<K, V>> {
    const entries = this.entries();

    if (entries.length === 0) {
      return { valid: true, invalidEntries: [] };
    }

    const prompt = createValidateValuesPrompt(
      entries.map(([k, v]) => [String(k), v]),
      rules
    );

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
   * Detect what this record represents.
   *
   * @returns Inferred purpose
   *
   * @example
   * record.inferPurpose()
   * // { purpose: "currency-exchange-rates", keyType: "currency-code", valueType: "rate", confidence: 0.95 }
   */
  async inferPurpose(): Promise<RecordInferPurposeResult> {
    if (this.size === 0) {
      return {
        purpose: 'empty',
        keyType: 'unknown',
        valueType: 'unknown',
        confidence: 1.0,
      };
    }

    const entries = this.entries().map(([k, v]) => [String(k), v]) as [string, unknown][];
    const prompt = createInferPurposePrompt(entries);

    const response = await this.client.complete({
      prompt,
      systemPrompt: RECORD_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as RecordInferPurposeResult;
  }

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
  async semanticGet(
    query: string,
    context?: Record<string, unknown>
  ): Promise<SemanticGetResult<K, V>> {
    if (this.size === 0) {
      return { value: undefined, matchedKey: undefined, confidence: 1.0 };
    }

    const keys = this.keys().map(k => String(k));
    const prompt = createSemanticGetPrompt(keys, query, context);

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

    const entries = this.entries();
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
   * Filter entries by semantic criteria.
   *
   * @param criteria - Natural language filter
   * @returns Filtered record
   *
   * @example
   * settings.semanticFilter("security-related settings")
   */
  async semanticFilter(criteria: string): Promise<SemanticRecord<K, V>> {
    if (this.size === 0) {
      return SemanticRecord.empty<K, V>(this.context, this.client);
    }

    const entries = this.entries().map(([k, v]) => [String(k), v]) as [string, unknown][];
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

    const allEntries = this.entries();
    const filteredEntries = result.matchingIndices
      .map(i => allEntries[i])
      .filter((e): e is [K, V] => e !== undefined);

    const filteredRecord = Object.fromEntries(filteredEntries) as Record<K, V>;
    return SemanticRecord.from(filteredRecord, this.context, this.client);
  }

  /**
   * Suggest missing keys based on patterns.
   *
   * @returns Suggested keys
   *
   * @example
   * SemanticRecord.from({ USD: 1.0, EUR: 0.85 }).suggestMissingKeys()
   * // [{ key: "GBP", reason: "Common major currency" }]
   */
  async suggestMissingKeys(): Promise<MissingSuggestion[]> {
    if (this.size === 0) {
      return [];
    }

    const entries = this.entries().map(([k, v]) => [String(k), v]) as [string, unknown][];
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
   * Group entries by semantic category.
   *
   * @param criteria - Grouping criteria
   * @returns Grouped records
   *
   * @example
   * config.groupBy("category")
   * // { database: {...}, auth: {...}, logging: {...} }
   */
  async groupBy(criteria: string): Promise<Record<string, SemanticRecord<K, V>>> {
    if (this.size === 0) {
      return {};
    }

    const entries = this.entries().map(([k, v]) => [String(k), v]) as [string, unknown][];
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

    const allEntries = this.entries();
    const groups: Record<string, SemanticRecord<K, V>> = {};

    for (const [groupName, indices] of Object.entries(result.groups)) {
      const groupEntries = indices
        .map(i => allEntries[i])
        .filter((e): e is [K, V] => e !== undefined);
      const groupRecord = Object.fromEntries(groupEntries) as Record<K, V>;
      groups[groupName] = SemanticRecord.from(groupRecord, this.context, this.client);
    }

    return groups;
  }

  /**
   * Summarize the record contents.
   *
   * @returns Human-readable summary
   *
   * @example
   * exchangeRates.summarize()
   * // "8 currency exchange rates against USD. Strongest: GBP (0.73), Weakest: JPY (149.5)"
   */
  async summarize(): Promise<string> {
    if (this.size === 0) {
      return 'Empty record with no entries.';
    }

    const entries = this.entries().map(([k, v]) => [String(k), v]) as [string, unknown][];
    const prompt = createSummarizePrompt(entries, this.size, this.context);

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
   * Execute a function for each entry
   */
  forEach(callback: (value: V, key: K) => void): void {
    for (const [key, value] of this.entries()) {
      callback(value, key);
    }
  }

  /**
   * Map over entries (returns new SemanticRecord with transformed values)
   */
  map<U>(callback: (value: V, key: K) => U): SemanticRecord<K, U> {
    const mapped: Record<K, U> = {} as Record<K, U>;
    for (const [key, value] of this.entries()) {
      mapped[key] = callback(value, key);
    }
    return SemanticRecord.from(mapped, this.context, this.client);
  }

  /**
   * Filter entries with a predicate (returns new SemanticRecord)
   */
  filter(predicate: (value: V, key: K) => boolean): SemanticRecord<K, V> {
    const filtered: Record<K, V> = {} as Record<K, V>;
    for (const [key, value] of this.entries()) {
      if (predicate(value, key)) {
        filtered[key] = value;
      }
    }
    return SemanticRecord.from(filtered, this.context, this.client);
  }

  /**
   * Clear the record (returns new empty SemanticRecord)
   */
  clear(): SemanticRecord<K, V> {
    return SemanticRecord.empty<K, V>(this.context, this.client);
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries()[Symbol.iterator]();
  }

  /**
   * Convert to string
   */
  toString(): string {
    const entries = this.entries();
    return `SemanticRecord(${entries.length}) { ${entries.map(([k, v]) => `${String(k)}: ${JSON.stringify(v)}`).join(', ')} }`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): Record<K, V> {
    return this.valueOf();
  }
}
