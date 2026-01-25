/**
 * SemanticSet
 * A set type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<Set<T>> - Base semantic wrapper
 * - Comparable<SemanticSet<T>> - Semantic equality comparison
 * - Validatable - Validation against semantic rules
 * - Summarizable - Content summarization
 * - SemanticFilterable - Natural language filtering
 * - SemanticGroupable - Semantic grouping
 * - SemanticSetOperations - Intersection, union, difference
 * - Suggestible - Related value suggestions
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  RelatedSuggestion,
  ConfidenceResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
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

/** Result of semantic has operation */
export interface SemanticHasResult extends ConfidenceResult {
  exists: boolean;
  matchedValue: unknown;
}

/** Result of semantic add operation */
export interface SemanticAddResult extends ConfidenceResult {
  added: boolean;
  existingEquivalent: unknown;
}

/** Result of semantic equality with mappings */
export interface SetSemanticEqualsResult extends SemanticEqualsResult {
  mappings?: [unknown, unknown][];
}

/** Options for summarization */
export interface SetSummarizeOptions {
  maxLength?: number;
  focus?: string;
}

/** Validation result with per-value issues */
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
 * Unlike traditional sets that only support exact value matching,
 * semantic sets understand meaning-based membership, equivalence,
 * and operations.
 *
 * @template T - The type of elements in the set
 */
export class SemanticSet<T>
  implements
    Semantic<Set<T>>,
    Comparable<SemanticSet<T> | Set<T>, SetSemanticEqualsResult>
{
  private readonly elements: Set<T>;
  private readonly client: LLMClient;

  private constructor(values: Iterable<T>, client?: LLMClient) {
    this.elements = new Set(values);
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticSet from an existing iterable
   */
  static from<T>(values: Iterable<T>, client?: LLMClient): SemanticSet<T> {
    return new SemanticSet(values, client);
  }

  /**
   * Create an empty SemanticSet
   */
  static empty<T>(client?: LLMClient): SemanticSet<T> {
    return new SemanticSet<T>([], client);
  }

  /**
   * Create a SemanticSet from variadic arguments
   */
  static of<T>(...items: T[]): SemanticSet<T> {
    return new SemanticSet(items);
  }

  /**
   * Get the underlying Set value
   */
  valueOf(): Set<T> {
    return new Set(this.elements);
  }

  /**
   * Get the values as an array (for convenience)
   */
  toArray(): T[] {
    return Array.from(this.elements);
  }

  /**
   * Get the size of the set
   */
  get size(): number {
    return this.elements.size;
  }

  /**
   * Check if set has an exact value (standard Set behavior)
   */
  has(value: T): boolean {
    return this.elements.has(value);
  }

  /**
   * Check if the set contains a semantically equivalent value.
   *
   * @param query - Value or semantic query
   * @returns Whether a matching value exists with details
   *
   * @example
   * colors.semanticHas("crimson") // { exists: true, matchedValue: "red", confidence: 0.92 }
   */
  async semanticHas(query: T | string): Promise<SemanticHasResult> {
    if (this.elements.size === 0) {
      return { exists: false, matchedValue: null, confidence: 1.0 };
    }

    const prompt = createSemanticHasPrompt(this.toArray(), query);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticHasResult;
  }

  /**
   * Add a value only if no semantic equivalent exists.
   *
   * @param value - Value to add
   * @returns Result indicating if value was added
   *
   * @example
   * tags.semanticAdd("ML") // { added: false, existingEquivalent: "machine learning", confidence: 0.9 }
   */
  async semanticAdd(value: T): Promise<{ result: SemanticAddResult; set: SemanticSet<T> }> {
    if (this.elements.size === 0) {
      const newSet = new Set(this.elements);
      newSet.add(value);
      return {
        result: { added: true, existingEquivalent: null, confidence: 1.0 },
        set: SemanticSet.from(newSet, this.client),
      };
    }

    const prompt = createSemanticAddPrompt(this.toArray(), value);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const llmResult = JSON.parse(response.content) as {
      shouldAdd: boolean;
      existingEquivalent: unknown;
      confidence: number;
    };

    if (llmResult.shouldAdd) {
      const newSet = new Set(this.elements);
      newSet.add(value);
      return {
        result: {
          added: true,
          existingEquivalent: null,
          confidence: llmResult.confidence,
        },
        set: SemanticSet.from(newSet, this.client),
      };
    }

    return {
      result: {
        added: false,
        existingEquivalent: llmResult.existingEquivalent,
        confidence: llmResult.confidence,
      },
      set: this,
    };
  }

  /**
   * Check if two sets are semantically equivalent.
   *
   * @param other - Set to compare with
   * @returns Equivalence result with mappings
   *
   * @example
   * set1.semanticallyEquals(set2)
   * // { equivalent: true, mappings: [["red", "crimson"]], confidence: 0.9 }
   */
  async semanticallyEquals(
    other: SemanticSet<T> | Set<T>
  ): Promise<SetSemanticEqualsResult> {
    const otherArray =
      other instanceof SemanticSet ? other.toArray() : Array.from(other);
    const thisArray = this.toArray();

    if (thisArray.length === 0 && otherArray.length === 0) {
      return { equivalent: true, mappings: [], confidence: 1.0 };
    }

    if (thisArray.length === 0 || otherArray.length === 0) {
      return { equivalent: false, mappings: [], confidence: 1.0 };
    }

    const prompt = createSemanticallyEqualsPrompt(thisArray, otherArray);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SetSemanticEqualsResult;
  }

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
  async semanticIntersection(other: SemanticSet<T> | Set<T>): Promise<SemanticSet<T>> {
    const otherArray =
      other instanceof SemanticSet ? other.toArray() : Array.from(other);
    const thisArray = this.toArray();

    if (thisArray.length === 0 || otherArray.length === 0) {
      return SemanticSet.from([], this.client);
    }

    const prompt = createSemanticIntersectionPrompt(thisArray, otherArray);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      intersectionIndices: number[];
      confidence: number;
    };

    const intersected = result.intersectionIndices
      .map((i) => thisArray[i])
      .filter((el): el is T => el !== undefined);

    return SemanticSet.from(intersected, this.client);
  }

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
  async semanticUnion(other: SemanticSet<T> | Set<T>): Promise<SemanticSet<T>> {
    const otherArray =
      other instanceof SemanticSet ? other.toArray() : Array.from(other);
    const thisArray = this.toArray();

    if (thisArray.length === 0) {
      return SemanticSet.from(otherArray, this.client);
    }

    if (otherArray.length === 0) {
      return SemanticSet.from(thisArray, this.client);
    }

    const prompt = createSemanticUnionPrompt(thisArray, otherArray);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      unionIndicesSet1: number[];
      unionIndicesSet2: number[];
      confidence: number;
    };

    const fromSet1 = result.unionIndicesSet1
      .map((i) => thisArray[i])
      .filter((el): el is T => el !== undefined);
    const fromSet2 = result.unionIndicesSet2
      .map((i) => otherArray[i])
      .filter((el): el is T => el !== undefined);

    return SemanticSet.from([...fromSet1, ...fromSet2], this.client);
  }

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
  async semanticDifference(other: SemanticSet<T> | Set<T>): Promise<SemanticSet<T>> {
    const otherArray =
      other instanceof SemanticSet ? other.toArray() : Array.from(other);
    const thisArray = this.toArray();

    if (thisArray.length === 0) {
      return SemanticSet.from([], this.client);
    }

    if (otherArray.length === 0) {
      return SemanticSet.from(thisArray, this.client);
    }

    const prompt = createSemanticDifferencePrompt(thisArray, otherArray);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      differenceIndices: number[];
      confidence: number;
    };

    const difference = result.differenceIndices
      .map((i) => thisArray[i])
      .filter((el): el is T => el !== undefined);

    return SemanticSet.from(difference, this.client);
  }

  /**
   * Find values matching semantic criteria.
   *
   * @param criteria - Natural language criteria
   * @returns Matching values as a SemanticSet
   *
   * @example
   * skills.semanticFilter("backend technologies")
   * // SemanticSet containing ["Node.js", "PostgreSQL", "Redis"]
   */
  async semanticFilter(criteria: string): Promise<SemanticSet<T>> {
    if (this.elements.size === 0) {
      return SemanticSet.from([], this.client);
    }

    const thisArray = this.toArray();
    const prompt = createSemanticFilterPrompt(thisArray, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchingIndices: number[];
      confidence: number;
    };

    const filtered = result.matchingIndices
      .map((i) => thisArray[i])
      .filter((el): el is T => el !== undefined);

    return SemanticSet.from(filtered, this.client);
  }

  /**
   * Group set values by semantic category.
   *
   * @param criteria - Grouping criteria
   * @returns Grouped values
   *
   * @example
   * skills.groupBy("technology area")
   * // Map { "frontend": SemanticSet(["React", "CSS"]), "backend": SemanticSet(["Node", "Python"]) }
   */
  async groupBy(criteria: string): Promise<Map<string, SemanticSet<T>>> {
    if (this.elements.size === 0) {
      return new Map();
    }

    const thisArray = this.toArray();
    const prompt = createGroupByPrompt(thisArray, criteria);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      groups: Record<string, number[]>;
      confidence: number;
    };

    const groups = new Map<string, SemanticSet<T>>();
    for (const [groupName, indices] of Object.entries(result.groups)) {
      const groupElements = indices
        .map((i) => thisArray[i])
        .filter((el): el is T => el !== undefined);
      groups.set(groupName, SemanticSet.from(groupElements, this.client));
    }

    return groups;
  }

  /**
   * Summarize the set contents.
   *
   * @param options - Summary options
   * @returns Human-readable summary
   *
   * @example
   * permissions.summarize()
   * // "15 permissions: 8 read, 5 write, 2 admin. Covers user and content management."
   */
  async summarize(options?: SetSummarizeOptions): Promise<string> {
    if (this.elements.size === 0) {
      return 'Empty set with no elements.';
    }

    const prompt = createSummarizePrompt(this.toArray(), options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
      confidence: number;
    };

    return result.summary;
  }

  /**
   * Suggest related values that might belong in this set.
   *
   * @returns Suggested additions
   *
   * @example
   * skills.suggestRelated()
   * // [{ value: "TypeScript", reason: "Commonly paired with JavaScript" }]
   */
  async suggestRelated(): Promise<RelatedSuggestion[]> {
    if (this.elements.size === 0) {
      return [];
    }

    const prompt = createSuggestRelatedPrompt(this.toArray());

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: RelatedSuggestion[];
      confidence: number;
    };

    return result.suggestions;
  }

  /**
   * Validate all values against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * tags.validate(["must be lowercase", "no special characters"])
   */
  async validate(rules: string[]): Promise<SetValidateResult> {
    if (this.elements.size === 0) {
      return { valid: true, issues: [] };
    }

    const prompt = createValidatePrompt(this.toArray(), rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      issues: { value: unknown; problems: string[] }[];
      confidence: number;
    };

    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Detect the semantic theme/category of this set.
   *
   * @returns Inferred theme
   *
   * @example
   * values.inferTheme()
   * // { theme: "programming languages", confidence: 0.92 }
   */
  async inferTheme(): Promise<InferThemeResult> {
    if (this.elements.size === 0) {
      return { theme: 'empty', confidence: 1.0 };
    }

    const prompt = createInferThemePrompt(this.toArray());

    const response = await this.client.complete({
      prompt,
      systemPrompt: SET_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferThemeResult;
  }

  // Standard Set methods

  /**
   * Add a value (standard Set behavior)
   */
  add(value: T): SemanticSet<T> {
    const newSet = new Set(this.elements);
    newSet.add(value);
    return SemanticSet.from(newSet, this.client);
  }

  /**
   * Delete a value
   */
  delete(value: T): SemanticSet<T> {
    const newSet = new Set(this.elements);
    newSet.delete(value);
    return SemanticSet.from(newSet, this.client);
  }

  /**
   * Clear all values
   */
  clear(): SemanticSet<T> {
    return SemanticSet.from([], this.client);
  }

  /**
   * Execute a function for each value
   */
  forEach(fn: (value: T, value2: T, set: Set<T>) => void): void {
    this.elements.forEach(fn);
  }

  /**
   * Get an iterator over values
   */
  values(): IterableIterator<T> {
    return this.elements.values();
  }

  /**
   * Get an iterator over keys (same as values for Set)
   */
  keys(): IterableIterator<T> {
    return this.elements.keys();
  }

  /**
   * Get an iterator over entries
   */
  entries(): IterableIterator<[T, T]> {
    return this.elements.entries();
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
    return `SemanticSet(${this.size}) { ${this.toArray().join(', ')} }`;
  }

  /**
   * Convert to JSON (array representation)
   */
  toJSON(): T[] {
    return this.toArray();
  }
}
