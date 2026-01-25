/**
 * SemanticObject
 * An object type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T> - Base semantic wrapper
 * - Comparable<SemanticObject<T>> - Semantic equality comparison
 * - Validatable - Validation against semantic rules
 * - Summarizable - Content summarization
 * - TypeInferable - Type/purpose detection
 * - SchemaInferable - Schema inference
 * - SensitivityDetectable - Sensitive data detection
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithMappings,
  SemanticGetResult,
  InferSchemaResult,
  MissingSuggestion,
  InferTypeResult,
  SensitiveResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  OBJECT_SYSTEM_PROMPT,
  createSemanticGetPrompt,
  createSemanticallyEqualsPrompt,
  createValidatePrompt,
  createInferSchemaPrompt,
  createTransformKeysPrompt,
  createSemanticMergePrompt,
  createPickPrompt,
  createSuggestMissingFieldsPrompt,
  createSummarizePrompt,
  createInferTypePrompt,
  createIsSensitivePrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithMappings,
  SemanticGetResult,
  InferSchemaResult,
  MissingSuggestion,
  InferTypeResult,
  SensitiveResult,
} from '../../shared/types.ts';

/** Validation result with field-specific issues */
export interface ObjectValidateResult {
  valid: boolean;
  issues: { field: string; problem: string }[];
}

/** Options for semantic merge */
export interface SemanticMergeOptions {
  conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine';
}

/** Key naming conventions */
export type KeyConvention = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';

/**
 * SemanticObject - Object with LLM-powered semantic understanding
 *
 * Unlike traditional objects that require exact key matches,
 * semantic objects can access properties using natural language
 * queries and understand synonymous keys.
 *
 * @template T - The type of the underlying object
 */
export class SemanticObject<T extends object = object>
  implements
    Semantic<T>,
    Comparable<SemanticObject<T> | object, SemanticEqualsResultWithMappings>
{
  private readonly data: T;
  private readonly client: LLMClient;

  private constructor(data: T, client?: LLMClient) {
    this.data = { ...data };
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticObject from an existing object
   */
  static from<T extends object>(obj: T, client?: LLMClient): SemanticObject<T> {
    return new SemanticObject(obj, client);
  }

  /**
   * Create an empty SemanticObject
   */
  static empty<T extends object = object>(client?: LLMClient): SemanticObject<T> {
    return new SemanticObject({} as T, client);
  }

  /**
   * Get the underlying object value
   */
  valueOf(): T {
    return { ...this.data };
  }

  /**
   * Get a property using semantic key matching.
   * Matches property names semantically, not just exactly.
   *
   * @param query - Property name or semantic query
   * @returns Property value with match info
   */
  async semanticGet(query: string): Promise<SemanticGetResult> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return { value: undefined, matchedKey: undefined, confidence: 1.0 };
    }

    // Try exact match first (synchronous optimization)
    if (query in this.data) {
      return {
        value: (this.data as Record<string, unknown>)[query],
        matchedKey: query,
        confidence: 1.0,
      };
    }

    const prompt = createSemanticGetPrompt(this.data, query);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchedKey: string | null;
      value: unknown;
      confidence: number;
    };

    return {
      value: result.matchedKey ? result.value : undefined,
      matchedKey: result.matchedKey ?? undefined,
      confidence: result.confidence,
    };
  }

  /**
   * Check if two objects are semantically equivalent.
   * Considers property name synonyms and value meaning.
   *
   * @param other - Object to compare with
   * @returns Equivalence result with mappings
   */
  async semanticallyEquals(
    other: SemanticObject<T> | object
  ): Promise<SemanticEqualsResultWithMappings> {
    const otherObj = other instanceof SemanticObject ? other.valueOf() : other;

    // Handle empty objects
    const thisKeys = Object.keys(this.data);
    const otherKeys = Object.keys(otherObj);
    if (thisKeys.length === 0 && otherKeys.length === 0) {
      return { equivalent: true, mappings: {}, confidence: 1.0 };
    }

    const prompt = createSemanticallyEqualsPrompt(this.data, otherObj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithMappings;
  }

  /**
   * Validate the object against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result
   */
  async validate(rules: string[]): Promise<ObjectValidateResult> {
    if (rules.length === 0) {
      return { valid: true, issues: [] };
    }

    const prompt = createValidatePrompt(this.data, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      issues: { field: string; problem: string }[];
      confidence: number;
    };

    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Infer the semantic schema of this object.
   *
   * @returns Inferred schema with field descriptions
   */
  async inferSchema(): Promise<InferSchemaResult> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return { type: 'empty', properties: {}, fields: {}, confidence: 1.0 };
    }

    const prompt = createInferSchemaPrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      type: string;
      fields: Record<string, { type: string; purpose: string; format?: string }>;
      confidence: number;
    };

    return {
      type: result.type,
      properties: result.fields,
      fields: result.fields,
      confidence: result.confidence,
    };
  }

  /**
   * Transform property names to a different convention.
   *
   * @param convention - Target naming convention
   * @returns Transformed object
   */
  async transformKeys(convention: KeyConvention): Promise<SemanticObject<T>> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return SemanticObject.from({} as T, this.client);
    }

    const prompt = createTransformKeysPrompt(this.data, convention);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      transformed: T;
      keyMappings: Record<string, string>;
      confidence: number;
    };

    return SemanticObject.from(result.transformed, this.client);
  }

  /**
   * Merge with another object, handling key synonyms.
   *
   * @param other - Object to merge
   * @param options - Merge options
   * @returns Merged object
   */
  async semanticMerge(
    other: object,
    options?: SemanticMergeOptions
  ): Promise<SemanticObject<T>> {
    const otherKeys = Object.keys(other);
    if (otherKeys.length === 0) {
      return SemanticObject.from(this.data, this.client);
    }

    const thisKeys = Object.keys(this.data);
    if (thisKeys.length === 0) {
      return SemanticObject.from(other as T, this.client);
    }

    const prompt = createSemanticMergePrompt(this.data, other, options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      merged: T;
      keyMappings: Record<string, string>;
      conflicts: string[];
      confidence: number;
    };

    return SemanticObject.from(result.merged, this.client);
  }

  /**
   * Extract specific fields using semantic matching.
   *
   * @param fields - Fields to extract (semantic descriptions)
   * @returns Extracted object
   */
  async pick(fields: string[]): Promise<SemanticObject<Partial<T>>> {
    if (fields.length === 0) {
      return SemanticObject.from({} as Partial<T>, this.client);
    }

    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return SemanticObject.from({} as Partial<T>, this.client);
    }

    const prompt = createPickPrompt(this.data, fields);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      picked: Partial<T>;
      matchedFields: Record<string, string[]>;
      confidence: number;
    };

    return SemanticObject.from(result.picked, this.client);
  }

  /**
   * Suggest missing fields based on the object's purpose.
   *
   * @returns Suggested fields
   */
  async suggestMissingFields(): Promise<MissingSuggestion[]> {
    const prompt = createSuggestMissingFieldsPrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: { field: string; reason: string }[];
      objectType: string;
      confidence: number;
    };

    return result.suggestions.map((s) => ({
      field: s.field,
      reason: s.reason,
    }));
  }

  /**
   * Summarize the object contents.
   *
   * @returns Human-readable summary
   */
  async summarize(): Promise<string> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return 'Empty object with no properties.';
    }

    const prompt = createSummarizePrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
      confidence: number;
    };

    return result.summary;
  }

  /**
   * Detect the semantic type/purpose of this object.
   *
   * @returns Inferred type
   */
  async inferType(): Promise<InferTypeResult> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return { type: 'empty', confidence: 1.0 };
    }

    const prompt = createInferTypePrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferTypeResult;
  }

  /**
   * Check if a field contains sensitive data.
   *
   * @param field - Field name to check
   * @returns Sensitivity assessment
   */
  async isSensitive(field: string): Promise<SensitiveResult> {
    if (!(field in this.data)) {
      return { sensitive: false };
    }

    const prompt = createIsSensitivePrompt(this.data, field);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      sensitive: boolean;
      type: string | null;
      recommendation: string | null;
      confidence: number;
    };

    return {
      sensitive: result.sensitive,
      type: result.type ?? undefined,
      recommendation: result.recommendation ?? undefined,
    };
  }

  /**
   * Get all keys of the object
   */
  keys(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Get all values of the object
   */
  values(): unknown[] {
    return Object.values(this.data);
  }

  /**
   * Get all entries of the object
   */
  entries(): [string, unknown][] {
    return Object.entries(this.data);
  }

  /**
   * Check if object has a property (exact match)
   */
  has(key: string): boolean {
    return key in this.data;
  }

  /**
   * Get a property value (exact match)
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  /**
   * Convert to string
   */
  toString(): string {
    return JSON.stringify(this.data);
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.valueOf();
  }
}
