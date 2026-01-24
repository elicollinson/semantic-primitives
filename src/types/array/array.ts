/**
 * SemanticArray
 * An array type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T[]> - Base semantic wrapper
 * - Comparable<SemanticArray<T>> - Semantic equality comparison
 * - Validatable - Validation against semantic rules
 * - Summarizable - Content summarization
 * - SemanticFilterable - Natural language filtering
 * - SemanticSortable - Semantic sorting
 * - SemanticGroupable - Semantic grouping
 * - SemanticSearchable - Semantic search
 * - PatternDetectable - Pattern detection
 * - TypeInferable - Element type inference
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithReason,
  SearchResult,
  InferTypeResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  ARRAY_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createSemanticFilterPrompt,
  createSemanticGroupPrompt,
  createSemanticSortPrompt,
  createSemanticSearchPrompt,
  createDetectPatternsPrompt,
  createSummarizePrompt,
  createSemanticUniquePrompt,
  createValidatePrompt,
  createEnrichPrompt,
  createInferElementTypePrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithReason,
  SearchResult,
  InferTypeResult,
} from '../../shared/types.ts';

/** Options for semantic equality comparison */
export interface ArraySemanticEqualsOptions {
  orderMatters?: boolean;
  threshold?: number;
}

/** Options for semantic search */
export interface SemanticSearchOptions {
  limit?: number;
}

/** Options for summarization */
export interface SummarizeOptions {
  maxLength?: number;
  focus?: string;
}

/** Options for semantic unique (deduplication) */
export interface SemanticUniqueOptions {
  threshold?: number;
}

/** Validation result with per-element issues */
export interface ArrayValidateResult {
  valid: boolean;
  issues: { index: number; problems: string[] }[];
}

/** Extended element type inference result with optional fields */
export interface ArrayInferTypeResult extends InferTypeResult {
  fields?: string[];
}

/** Extended pattern detection result with anomalies */
export interface ArrayDetectPatternResult {
  patterns: string[];
  anomalies: { index: number; reason: string }[];
  confidence: number;
}

/**
 * SemanticArray - Array with LLM-powered semantic understanding
 *
 * Unlike traditional arrays that only support index-based operations,
 * semantic arrays can filter, group, sort, and search using natural
 * language criteria.
 *
 * @template T - The type of elements in the array
 */
export class SemanticArray<T>
  implements
    Semantic<T[]>,
    Comparable<SemanticArray<T> | T[], SemanticEqualsResultWithReason>
{
  private readonly elements: T[];
  private readonly client: LLMClient;

  private constructor(elements: T[], client?: LLMClient) {
    this.elements = [...elements];
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticArray from an existing array
   */
  static from<T>(array: T[], client?: LLMClient): SemanticArray<T> {
    return new SemanticArray(array, client);
  }

  /**
   * Create an empty SemanticArray
   */
  static empty<T>(client?: LLMClient): SemanticArray<T> {
    return new SemanticArray<T>([], client);
  }

  /**
   * Create a SemanticArray from variadic arguments
   */
  static of<T>(...items: T[]): SemanticArray<T> {
    return new SemanticArray(items);
  }

  /**
   * Get the underlying array value
   */
  valueOf(): T[] {
    return [...this.elements];
  }

  /**
   * Get the length of the array
   */
  get length(): number {
    return this.elements.length;
  }

  /**
   * Get element at index
   */
  at(index: number): T | undefined {
    return this.elements.at(index);
  }

  /**
   * Check if two arrays are semantically equivalent.
   * Considers element meaning, order significance, and context.
   *
   * @param other - Array to compare with
   * @param options - Comparison options
   * @returns Equivalence result with confidence and optional note
   */
  async semanticallyEquals(
    other: SemanticArray<T> | T[],
    options?: ArraySemanticEqualsOptions
  ): Promise<SemanticEqualsResultWithReason> {
    const otherArray = other instanceof SemanticArray ? other.valueOf() : other;
    const prompt = createSemanticallyEqualsPrompt(this.elements, otherArray, options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithReason;
  }

  /**
   * Filter elements using natural language criteria.
   *
   * @param criteria - Natural language filter condition
   * @returns Filtered SemanticArray
   */
  async semanticFilter(criteria: string): Promise<SemanticArray<T>> {
    if (this.elements.length === 0) {
      return SemanticArray.from([], this.client);
    }

    const prompt = createSemanticFilterPrompt(this.elements, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchingIndices: number[];
      confidence: number;
    };

    const filtered = result.matchingIndices.map((i) => this.elements[i]).filter((el): el is T => el !== undefined);
    return SemanticArray.from(filtered, this.client);
  }

  /**
   * Group elements by semantic similarity or criteria.
   *
   * @param criteria - Grouping criteria (natural language or field name)
   * @returns Map of groups
   */
  async semanticGroup(criteria: string): Promise<Map<string, SemanticArray<T>>> {
    if (this.elements.length === 0) {
      return new Map();
    }

    const prompt = createSemanticGroupPrompt(this.elements, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      groups: Record<string, number[]>;
      confidence: number;
    };

    const groups = new Map<string, SemanticArray<T>>();
    for (const [groupName, indices] of Object.entries(result.groups)) {
      const groupElements = indices.map((i) => this.elements[i]).filter((el): el is T => el !== undefined);
      groups.set(groupName, SemanticArray.from(groupElements, this.client));
    }

    return groups;
  }

  /**
   * Sort elements using semantic understanding.
   *
   * @param criteria - Natural language sort criteria
   * @returns Sorted SemanticArray
   */
  async semanticSort(criteria: string): Promise<SemanticArray<T>> {
    if (this.elements.length <= 1) {
      return SemanticArray.from(this.elements, this.client);
    }

    const prompt = createSemanticSortPrompt(this.elements, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      sortedIndices: number[];
      confidence: number;
    };

    const sorted = result.sortedIndices.map((i) => this.elements[i]).filter((el): el is T => el !== undefined);
    return SemanticArray.from(sorted, this.client);
  }

  /**
   * Find elements matching semantic criteria.
   *
   * @param criteria - Natural language search criteria
   * @param options - Search options
   * @returns Matching elements with relevance scores
   */
  async semanticSearch(
    criteria: string,
    options?: SemanticSearchOptions
  ): Promise<SearchResult<T>[]> {
    if (this.elements.length === 0) {
      return [];
    }

    const prompt = createSemanticSearchPrompt(this.elements, criteria, options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      results: { index: number; relevance: number }[];
      confidence: number;
    };

    return result.results.map((r) => ({
      item: this.elements[r.index],
      relevance: r.relevance,
    }));
  }

  /**
   * Detect patterns in the array data.
   *
   * @returns Detected patterns and anomalies
   */
  async detectPatterns(): Promise<ArrayDetectPatternResult> {
    if (this.elements.length === 0) {
      return { patterns: [], anomalies: [], confidence: 1.0 };
    }

    const prompt = createDetectPatternsPrompt(this.elements);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ArrayDetectPatternResult;
  }

  /**
   * Summarize the array contents.
   *
   * @param options - Summary options
   * @returns Human-readable summary
   */
  async summarize(options?: SummarizeOptions): Promise<string> {
    if (this.elements.length === 0) {
      return 'Empty array with no elements.';
    }

    const prompt = createSummarizePrompt(this.elements, options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
      confidence: number;
    };

    return result.summary;
  }

  /**
   * Remove semantic duplicates (items with same meaning).
   *
   * @param options - Deduplication options
   * @returns Deduplicated array
   */
  async semanticUnique(options?: SemanticUniqueOptions): Promise<SemanticArray<T>> {
    if (this.elements.length <= 1) {
      return SemanticArray.from(this.elements, this.client);
    }

    const prompt = createSemanticUniquePrompt(this.elements, options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      uniqueIndices: number[];
      duplicateGroups: { keep: number; remove: number[] }[];
      confidence: number;
    };

    const unique = result.uniqueIndices.map((i) => this.elements[i]).filter((el): el is T => el !== undefined);
    return SemanticArray.from(unique, this.client);
  }

  /**
   * Validate all elements against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result
   */
  async validate(rules: string[]): Promise<ArrayValidateResult> {
    if (this.elements.length === 0) {
      return { valid: true, issues: [] };
    }

    const prompt = createValidatePrompt(this.elements, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      issues: { index: number; problems: string[] }[];
      confidence: number;
    };

    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Enrich each element with additional semantic information.
   *
   * @param enrichments - Fields to add with descriptions
   * @returns Enriched array
   */
  async enrich<E extends Record<string, string>>(
    enrichments: E
  ): Promise<SemanticArray<T & { [K in keyof E]: string }>> {
    if (this.elements.length === 0) {
      return SemanticArray.from([], this.client);
    }

    const prompt = createEnrichPrompt(this.elements, enrichments);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      enrichedValues: { [K in keyof E]: string }[];
      confidence: number;
    };

    const enriched = this.elements.map((element, i) => ({
      ...(typeof element === 'object' && element !== null ? element : { value: element }),
      ...result.enrichedValues[i],
    })) as (T & { [K in keyof E]: string })[];

    return SemanticArray.from(enriched, this.client);
  }

  /**
   * Detect the semantic type of array elements.
   *
   * @returns Inferred element type
   */
  async inferElementType(): Promise<ArrayInferTypeResult> {
    if (this.elements.length === 0) {
      return { type: 'empty', confidence: 1.0 };
    }

    const prompt = createInferElementTypePrompt(this.elements);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ARRAY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ArrayInferTypeResult;
  }

  /**
   * Infer type - alias for inferElementType for interface compatibility
   */
  async inferType(): Promise<InferTypeResult> {
    const result = await this.inferElementType();
    return {
      type: result.type,
      confidence: result.confidence,
    };
  }

  // Standard array methods that return SemanticArray

  /**
   * Map elements and return a new SemanticArray
   */
  map<U>(fn: (element: T, index: number, array: T[]) => U): SemanticArray<U> {
    return SemanticArray.from(this.elements.map(fn), this.client);
  }

  /**
   * Filter elements using a predicate and return a new SemanticArray
   */
  filter(predicate: (element: T, index: number, array: T[]) => boolean): SemanticArray<T> {
    return SemanticArray.from(this.elements.filter(predicate), this.client);
  }

  /**
   * Concatenate with another array or SemanticArray
   */
  concat(...items: (T | T[] | SemanticArray<T>)[]): SemanticArray<T> {
    const arrays = items.map((item) => {
      if (item instanceof SemanticArray) {
        return item.valueOf();
      } else if (Array.isArray(item)) {
        return item;
      } else {
        return [item];
      }
    });
    return SemanticArray.from(this.elements.concat(...arrays), this.client);
  }

  /**
   * Get a slice of the array
   */
  slice(start?: number, end?: number): SemanticArray<T> {
    return SemanticArray.from(this.elements.slice(start, end), this.client);
  }

  /**
   * Reverse the array
   */
  reverse(): SemanticArray<T> {
    return SemanticArray.from([...this.elements].reverse(), this.client);
  }

  /**
   * Reduce the array to a single value
   */
  reduce<U>(fn: (acc: U, element: T, index: number, array: T[]) => U, initial: U): U {
    return this.elements.reduce(fn, initial);
  }

  /**
   * Check if some element satisfies the predicate
   */
  some(predicate: (element: T, index: number, array: T[]) => boolean): boolean {
    return this.elements.some(predicate);
  }

  /**
   * Check if every element satisfies the predicate
   */
  every(predicate: (element: T, index: number, array: T[]) => boolean): boolean {
    return this.elements.every(predicate);
  }

  /**
   * Find an element matching the predicate
   */
  find(predicate: (element: T, index: number, array: T[]) => boolean): T | undefined {
    return this.elements.find(predicate);
  }

  /**
   * Find the index of an element matching the predicate
   */
  findIndex(predicate: (element: T, index: number, array: T[]) => boolean): number {
    return this.elements.findIndex(predicate);
  }

  /**
   * Check if array includes an element
   */
  includes(element: T): boolean {
    return this.elements.includes(element);
  }

  /**
   * Get the index of an element
   */
  indexOf(element: T): number {
    return this.elements.indexOf(element);
  }

  /**
   * Execute a function for each element
   */
  forEach(fn: (element: T, index: number, array: T[]) => void): void {
    this.elements.forEach(fn);
  }

  /**
   * Flat map the array
   */
  flatMap<U>(fn: (element: T, index: number, array: T[]) => U | U[]): SemanticArray<U> {
    return SemanticArray.from(this.elements.flatMap(fn), this.client);
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): Iterator<T> {
    return this.elements[Symbol.iterator]();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.elements.toString();
  }

  /**
   * Convert to JSON
   */
  toJSON(): T[] {
    return this.valueOf();
  }
}
