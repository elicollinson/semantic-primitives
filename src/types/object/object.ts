/**
 * SemanticObject
 * An object type with LLM-powered semantic understanding
 *
 * Wraps JavaScript objects with semantic capabilities including:
 * - Semantic property access
 * - Intelligent key matching
 * - Schema inference
 * - Semantic merging
 * - Field validation and suggestions
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticGetResult,
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  MissingSuggestion,
  InferTypeResult,
  SensitiveResult,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
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
  SemanticGetResult,
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  MissingSuggestion,
  InferTypeResult,
  SensitiveResult,
} from '../../shared/types.ts';

/** Validation result with field issues */
export interface ObjectValidateResult {
  valid: boolean;
  issues: { field: string; problem: string }[];
}

/** Options for semantic merge */
export interface ObjectMergeOptions {
  conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine';
}

/** Key transformation conventions */
export type KeyConvention = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';

/**
 * SemanticObject - Object with LLM-powered semantic understanding
 *
 * Unlike plain objects, semantic objects understand property
 * meanings and can perform intelligent operations on data.
 *
 * @template T - The object type
 */
export class SemanticObject<T extends object = object> implements Semantic<T> {
  private readonly obj: T;
  private readonly client: LLMClient;

  private constructor(obj: T, client?: LLMClient) {
    this.obj = { ...obj };
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticObject from a plain object
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
   * Get the underlying object
   */
  valueOf(): T {
    return { ...this.obj };
  }

  // ===========================================================================
  // STANDARD OBJECT OPERATIONS
  // ===========================================================================

  /**
   * Get a property by exact key
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.obj[key];
  }

  /**
   * Set a property
   */
  set<K extends keyof T>(key: K, value: T[K]): this {
    (this.obj as Record<K, T[K]>)[key] = value;
    return this;
  }

  /**
   * Check if property exists (exact match)
   */
  has(key: keyof T): boolean {
    return key in this.obj;
  }

  /**
   * Delete a property
   */
  delete(key: keyof T): boolean {
    if (key in this.obj) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.obj[key];
      return true;
    }
    return false;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Object.keys(this.obj);
  }

  /**
   * Get all values
   */
  values(): unknown[] {
    return Object.values(this.obj);
  }

  /**
   * Get all entries
   */
  entries(): [string, unknown][] {
    return Object.entries(this.obj);
  }

  // ===========================================================================
  // SEMANTIC OPERATIONS
  // ===========================================================================

  /**
   * Get a property using semantic key matching
   */
  async semanticGet(query: string): Promise<SemanticGetResult> {
    const keys = Object.keys(this.obj);
    if (keys.length === 0) {
      return { value: undefined, matchedKey: undefined, confidence: 1.0 };
    }

    const prompt = createSemanticGetPrompt(keys, query);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchedKey: string | null;
      confidence: number;
    };

    return {
      value: result.matchedKey ? (this.obj as Record<string, unknown>)[result.matchedKey] : undefined,
      matchedKey: result.matchedKey ?? undefined,
      confidence: result.confidence,
    };
  }

  /**
   * Check if two objects are semantically equivalent
   */
  async semanticallyEquals(other: object | SemanticObject): Promise<SemanticEqualsResultWithMappings> {
    const otherObj = other instanceof SemanticObject ? other.valueOf() : other;

    const prompt = createSemanticallyEqualsPrompt(this.obj, otherObj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithMappings;
  }

  /**
   * Validate the object against semantic rules
   */
  async validate(rules: string[]): Promise<ObjectValidateResult> {
    if (Object.keys(this.obj).length === 0) {
      return { valid: true, issues: [] };
    }

    const prompt = createValidatePrompt(this.obj, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as ObjectValidateResult & { confidence: number };
    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Infer the semantic schema of this object
   */
  async inferSchema(): Promise<InferSchemaResult> {
    if (Object.keys(this.obj).length === 0) {
      return { properties: {}, confidence: 1.0 };
    }

    const prompt = createInferSchemaPrompt(this.obj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      type: string;
      fields: Record<string, { type: string; purpose: string; format?: string }>;
      confidence: number;
    };

    return {
      type: result.type,
      fields: result.fields,
      properties: Object.fromEntries(
        Object.entries(result.fields).map(([k, v]) => [k, v.type])
      ),
      confidence: result.confidence,
    };
  }

  /**
   * Transform property names to a different convention
   */
  async transformKeys(convention: KeyConvention): Promise<SemanticObject<T>> {
    if (Object.keys(this.obj).length === 0) {
      return SemanticObject.from({} as T, this.client);
    }

    const prompt = createTransformKeysPrompt(this.obj, convention);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      transformed: T;
      confidence: number;
    };

    return SemanticObject.from(result.transformed, this.client);
  }

  /**
   * Merge with another object, handling key synonyms
   */
  async semanticMerge(
    other: object | SemanticObject,
    options?: ObjectMergeOptions
  ): Promise<SemanticObject<T>> {
    const otherObj = other instanceof SemanticObject ? other.valueOf() : other;
    const conflictResolution = options?.conflictResolution ?? 'prefer-this';

    const prompt = createSemanticMergePrompt(this.obj, otherObj, conflictResolution);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      merged: T;
      confidence: number;
    };

    return SemanticObject.from(result.merged, this.client);
  }

  /**
   * Extract specific fields using semantic matching
   */
  async pick(fields: string[]): Promise<SemanticObject<Partial<T>>> {
    if (Object.keys(this.obj).length === 0 || fields.length === 0) {
      return SemanticObject.from({} as Partial<T>, this.client);
    }

    const prompt = createPickPrompt(this.obj, fields);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      picked: Partial<T>;
      confidence: number;
    };

    return SemanticObject.from(result.picked, this.client);
  }

  /**
   * Suggest missing fields based on the object's purpose
   */
  async suggestMissingFields(): Promise<MissingSuggestion[]> {
    if (Object.keys(this.obj).length === 0) {
      return [];
    }

    const prompt = createSuggestMissingFieldsPrompt(this.obj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: { field: string; reason: string }[];
      confidence: number;
    };

    return result.suggestions;
  }

  /**
   * Summarize the object contents
   */
  async summarize(): Promise<string> {
    if (Object.keys(this.obj).length === 0) {
      return 'Empty object with no properties.';
    }

    const prompt = createSummarizePrompt(this.obj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { summary: string; confidence: number };
    return result.summary;
  }

  /**
   * Detect the semantic type/purpose of this object
   */
  async inferType(): Promise<InferTypeResult> {
    if (Object.keys(this.obj).length === 0) {
      return { type: 'empty', confidence: 1.0 };
    }

    const prompt = createInferTypePrompt(this.obj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferTypeResult;
  }

  /**
   * Check if a field contains sensitive data
   */
  async isSensitive(field: string): Promise<SensitiveResult> {
    if (!(field in this.obj)) {
      return { sensitive: false };
    }

    const prompt = createIsSensitivePrompt(this.obj, field);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as SensitiveResult & { confidence: number };
    return {
      sensitive: result.sensitive,
      type: result.type,
      recommendation: result.recommendation,
    };
  }

  /**
   * Convert to plain object
   */
  toObject(): T {
    return { ...this.obj };
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.toObject();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return JSON.stringify(this.obj);
  }
}
