/**
 * SemanticSet
 * A Set type with LLM-powered semantic understanding
 *
 * Extends native JavaScript Set with semantic capabilities including:
 * - Semantic membership checks
 * - Meaning-aware deduplication
 * - Semantic set operations (union, intersection, difference)
 * - Semantic filtering and grouping
 * - Theme inference
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  RelatedSuggestion,
  ConfidenceResult,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
import {
  SET_SYSTEM_PROMPT,
  createSemanticHasPrompt,
  createSemanticAddPrompt,
  createSemanticallyEqualsPrompt,
  createSemanticIntersectionPrompt,
  createSemanticUnionPrompt,
  createSemanticDifferencePrompt,
  createSemanticFilterPrompt,
  createGroupByPrompt,
  createSummarizePrompt,
  createSuggestRelatedPrompt,
  createValidatePrompt,
  createInferThemePrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResult,
  RelatedSuggestion,
  ConfidenceResult,
} from '../../shared/types.ts';

/** Result of semantic equality with mappings */
export interface SetSemanticEqualsResult extends SemanticEqualsResult {
  mappings?: [unknown, unknown][];
}

/** Result of set validation */
export interface SetValidateResult {
  valid: boolean;
  issues: { value: unknown; problems: string[] }[];
}

/** Result of theme inference */
export interface InferThemeResult extends ConfidenceResult {
  theme: string;
}

/**
 * SemanticSet - Set with LLM-powered semantic understanding
 *
 * Unlike traditional sets that require exact value matches,
 * semantic sets understand value equivalence by meaning
 * and can perform intelligent set operations.
 *
 * @template T - The type of elements
 */
export class SemanticSet<T> implements Semantic<Set<T>> {
  private readonly set: Set<T>;
  private readonly client: LLMClient;

  private constructor(values?: Iterable<T>, client?: LLMClient) {
    this.set = new Set(values);
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticSet from values
   */
  static from<T>(values?: Iterable<T> | Set<T>, client?: LLMClient): SemanticSet<T> {
    if (values instanceof Set) {
      return new SemanticSet(values.values(), client);
    }
    return new SemanticSet(values, client);
  }

  /**
   * Create an empty SemanticSet
   */
  static empty<T>(client?: LLMClient): SemanticSet<T> {
    return new SemanticSet<T>(undefined, client);
  }

  /**
   * Create a SemanticSet from variadic arguments
   */
  static of<T>(...values: T[]): SemanticSet<T> {
    return new SemanticSet(values);
  }

  /**
   * Get the underlying Set value
   */
  valueOf(): Set<T> {
    return new Set(this.set);
  }

  /**
   * Get the number of elements
   */
  get size(): number {
    return this.set.size;
  }

  // ===========================================================================
  // STANDARD SET METHODS
  // ===========================================================================

  /**
   * Add a value (exact match)
   */
  add(value: T): this {
    this.set.add(value);
    return this;
  }

  /**
   * Check if value exists (exact match)
   */
  has(value: T): boolean {
    return this.set.has(value);
  }

  /**
   * Delete a value
   */
  delete(value: T): boolean {
    return this.set.delete(value);
  }

  /**
   * Clear all values
   */
  clear(): void {
    this.set.clear();
  }

  /**
   * Get all values
   */
  values(): IterableIterator<T> {
    return this.set.values();
  }

  /**
   * Get all entries (for Set compatibility)
   */
  entries(): IterableIterator<[T, T]> {
    return this.set.entries();
  }

  /**
   * Execute a function for each value
   */
  forEach(callback: (value: T, value2: T, set: Set<T>) => void): void {
    this.set.forEach(callback);
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): IterableIterator<T> {
    return this.set[Symbol.iterator]();
  }

  // ===========================================================================
  // SEMANTIC OPERATIONS
  // ===========================================================================

  /**
   * Check if the set contains a semantically equivalent value
   */
  async semanticHas(query: string | T): Promise<boolean> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return false;
    }

    const prompt = createSemanticHasPrompt(values, query);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { has: boolean; confidence: number };
    return result.has;
  }

  /**
   * Add a value only if no semantic equivalent exists
   */
  async semanticAdd(value: T): Promise<boolean> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      this.set.add(value);
      return true;
    }

    const prompt = createSemanticAddPrompt(values, value);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      shouldAdd: boolean;
      confidence: number;
    };

    if (result.shouldAdd) {
      this.set.add(value);
      return true;
    }
    return false;
  }

  /**
   * Check if two sets are semantically equivalent
   */
  async semanticallyEquals(
    other: Set<T> | SemanticSet<T>
  ): Promise<SetSemanticEqualsResult> {
    const otherSet = other instanceof SemanticSet ? other.valueOf() : other;
    const thisValues = Array.from(this.set);
    const otherValues = Array.from(otherSet);

    const prompt = createSemanticallyEqualsPrompt(thisValues, otherValues);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      equivalent: boolean;
      mappings: [unknown, unknown][];
      confidence: number;
    };

    return {
      equivalent: result.equivalent,
      mappings: result.mappings,
      confidence: result.confidence,
    };
  }

  /**
   * Get semantic intersection with another set
   */
  async semanticIntersection(other: Set<T> | SemanticSet<T>): Promise<SemanticSet<T>> {
    const otherSet = other instanceof SemanticSet ? other.valueOf() : other;
    const thisValues = Array.from(this.set);
    const otherValues = Array.from(otherSet);

    if (thisValues.length === 0 || otherValues.length === 0) {
      return SemanticSet.empty<T>(this.client);
    }

    const prompt = createSemanticIntersectionPrompt(thisValues, otherValues);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      intersection: T[];
      confidence: number;
    };

    return SemanticSet.from(result.intersection, this.client);
  }

  /**
   * Get semantic union, merging equivalent values
   */
  async semanticUnion(other: Set<T> | SemanticSet<T>): Promise<SemanticSet<T>> {
    const otherSet = other instanceof SemanticSet ? other.valueOf() : other;
    const thisValues = Array.from(this.set);
    const otherValues = Array.from(otherSet);

    if (thisValues.length === 0) {
      return SemanticSet.from(otherValues, this.client);
    }
    if (otherValues.length === 0) {
      return SemanticSet.from(thisValues, this.client);
    }

    const prompt = createSemanticUnionPrompt(thisValues, otherValues);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      union: T[];
      confidence: number;
    };

    return SemanticSet.from(result.union, this.client);
  }

  /**
   * Get semantic difference (values not in other set)
   */
  async semanticDifference(other: Set<T> | SemanticSet<T>): Promise<SemanticSet<T>> {
    const otherSet = other instanceof SemanticSet ? other.valueOf() : other;
    const thisValues = Array.from(this.set);
    const otherValues = Array.from(otherSet);

    if (thisValues.length === 0) {
      return SemanticSet.empty<T>(this.client);
    }
    if (otherValues.length === 0) {
      return SemanticSet.from(thisValues, this.client);
    }

    const prompt = createSemanticDifferencePrompt(thisValues, otherValues);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      difference: T[];
      confidence: number;
    };

    return SemanticSet.from(result.difference, this.client);
  }

  /**
   * Find values matching semantic criteria
   */
  async semanticFilter(criteria: string): Promise<SemanticSet<T>> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return SemanticSet.empty<T>(this.client);
    }

    const prompt = createSemanticFilterPrompt(values, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchingValues: T[];
      confidence: number;
    };

    return SemanticSet.from(result.matchingValues, this.client);
  }

  /**
   * Group set values by semantic category
   */
  async groupBy(criteria: string): Promise<Map<string, SemanticSet<T>>> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return new Map();
    }

    const prompt = createGroupByPrompt(values, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      groups: Record<string, T[]>;
      confidence: number;
    };

    const groups = new Map<string, SemanticSet<T>>();
    for (const [groupName, groupValues] of Object.entries(result.groups)) {
      groups.set(groupName, SemanticSet.from(groupValues, this.client));
    }

    return groups;
  }

  /**
   * Summarize the set contents
   */
  async summarize(): Promise<string> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return 'Empty set with no values.';
    }

    const prompt = createSummarizePrompt(values);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { summary: string; confidence: number };
    return result.summary;
  }

  /**
   * Suggest related values that might belong in this set
   */
  async suggestRelated(): Promise<RelatedSuggestion[]> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return [];
    }

    const prompt = createSuggestRelatedPrompt(values);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: { value: string; reason: string }[];
      confidence: number;
    };

    return result.suggestions;
  }

  /**
   * Validate all values against semantic rules
   */
  async validate(rules: string[]): Promise<SetValidateResult> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return { valid: true, issues: [] };
    }

    const prompt = createValidatePrompt(values, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as SetValidateResult & { confidence: number };
    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Detect the semantic theme/category of this set
   */
  async inferTheme(): Promise<InferThemeResult> {
    const values = Array.from(this.set);
    if (values.length === 0) {
      return { theme: 'empty', confidence: 1.0 };
    }

    const prompt = createInferThemePrompt(values);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferThemeResult;
  }

  /**
   * Convert to array
   */
  toArray(): T[] {
    return Array.from(this.set);
  }

  /**
   * Convert to JSON
   */
  toJSON(): T[] {
    return this.toArray();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return `SemanticSet(${this.size})`;
  }
}
