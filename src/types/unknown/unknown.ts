/**
 * SemanticUnknown
 * An unknown type with LLM-powered semantic understanding
 *
 * Helps safely narrow unknown values to proper types through
 * intelligent inference and validation.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type { ConfidenceResult } from '../../shared/types.ts';
import type { Semantic, Explainable, TypeInferable } from '../../shared/interfaces.ts';
import {
  UNKNOWN_SYSTEM_PROMPT,
  createInferTypePrompt,
  createSuggestTypesPrompt,
  createValidateShapePrompt,
  createGenerateTypeGuardPrompt,
  createSafeAccessPrompt,
  createMatchesPrompt,
  createNarrowToPrompt,
  createExplainPrompt,
} from './prompts.ts';

export type { ConfidenceResult } from '../../shared/types.ts';

/** Base type category */
export type UnknownBaseType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'undefined'
  | 'function';

/** Result of type inference */
export interface UnknownInferTypeResult {
  type: UnknownBaseType;
  shape?: string;
  confidence: number;
}

/** Type suggestion */
export interface TypeSuggestion {
  type: string;
  confidence: number;
  reason?: string;
}

/** Result of shape validation */
export interface ValidateShapeResult {
  matches: boolean;
  missingFields: string[];
  extraFields: string[];
}

/** Result of type guard generation */
export interface GenerateTypeGuardResult {
  code: string;
  typeName: string;
}

/** Result of semantic matching */
export interface MatchesResult extends ConfidenceResult {
  matches: boolean;
}

/** Result of narrowing attempt */
export interface NarrowToResult<T> {
  success: boolean;
  value?: T;
  errors?: string[];
}

/** Context for SemanticUnknown creation */
export interface UnknownContext {
  source?: string;
}

/**
 * SemanticUnknown - Unknown type with LLM-powered semantic understanding
 *
 * Unlike plain unknown that requires manual narrowing,
 * SemanticUnknown can intelligently infer types, generate type guards,
 * and safely access properties through semantic understanding.
 */
export class SemanticUnknown implements Semantic<unknown>, Explainable, TypeInferable {
  private readonly value: unknown;
  private readonly context: UnknownContext | undefined;
  private readonly client: LLMClient;

  private constructor(value: unknown, context?: UnknownContext, client?: LLMClient) {
    this.value = value;
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Wrap an unknown value with semantic capabilities.
   *
   * @param value - The unknown value
   * @param context - Optional context about the value's source
   * @param client - Optional LLM client
   * @returns SemanticUnknown wrapper
   */
  static from(
    value: unknown,
    context?: UnknownContext,
    client?: LLMClient
  ): SemanticUnknown {
    return new SemanticUnknown(value, context, client);
  }

  /**
   * Infer the most likely type of this unknown value.
   *
   * @returns Type inference with confidence
   */
  async inferType(): Promise<UnknownInferTypeResult> {
    const prompt = createInferTypePrompt(this.value, this.context?.source);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as UnknownInferTypeResult;
  }

  /**
   * Suggest possible TypeScript types this value could be.
   *
   * @param limit - Maximum number of suggestions
   * @returns Type suggestions ranked by likelihood
   */
  async suggestTypes(limit = 3): Promise<TypeSuggestion[]> {
    const prompt = createSuggestTypesPrompt(this.value, limit);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as { suggestions: TypeSuggestion[] };
    return result.suggestions;
  }

  /**
   * Validate the value has a specific shape.
   *
   * @param description - Natural language description of expected shape
   * @returns Validation result
   */
  async validateShape(description: string): Promise<ValidateShapeResult> {
    const prompt = createValidateShapePrompt(this.value, description);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateShapeResult;
  }

  /**
   * Generate a type guard function for this value's inferred type.
   *
   * @returns Generated type guard code
   */
  async generateTypeGuard(): Promise<GenerateTypeGuardResult> {
    const prompt = createGenerateTypeGuardPrompt(this.value);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as GenerateTypeGuardResult;
  }

  /**
   * Safely access a property with semantic understanding.
   *
   * @param path - Property path or semantic description
   * @returns Wrapped property value or undefined
   */
  async safeAccess(path: string): Promise<SemanticUnknown | undefined> {
    const prompt = createSafeAccessPrompt(this.value, path);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      found: boolean;
      path: string;
      value: unknown;
    };

    if (result.found) {
      return SemanticUnknown.from(result.value, { source: `${path} from unknown` }, this.client);
    }
    return undefined;
  }

  /**
   * Check if the value matches a semantic description.
   *
   * @param description - Description of what the value should be
   * @returns Match result
   */
  async matches(description: string): Promise<MatchesResult> {
    const prompt = createMatchesPrompt(this.value, description);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as MatchesResult;
  }

  /**
   * Narrow the unknown to a specific type with validation.
   *
   * @param typeName - Name of the expected type
   * @param validator - Optional custom validation rules
   * @returns Narrowed value or error
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  async narrowTo<T>(
    typeName: string,
    validator?: string[]
  ): Promise<{ success: true; value: T } | { success: false; errors: string[] }> {
    const prompt = createNarrowToPrompt(this.value, typeName, validator);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { success: boolean; errors: string[] };

    if (result.success) {
      return { success: true, value: this.value as T };
    }
    return { success: false, errors: result.errors };
  }

  /**
   * Explain what this unknown value appears to be.
   *
   * @returns Human-readable explanation
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.value, this.context?.source);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Check if the value is "empty" (null, undefined, empty string/array/object).
   *
   * @returns Whether the value is semantically empty
   */
  isEmpty(): boolean {
    if (this.value === null || this.value === undefined) {
      return true;
    }
    if (typeof this.value === 'string' && this.value === '') {
      return true;
    }
    if (Array.isArray(this.value) && this.value.length === 0) {
      return true;
    }
    if (
      typeof this.value === 'object' &&
      Object.keys(this.value).length === 0
    ) {
      return true;
    }
    return false;
  }

  /**
   * Get the underlying unknown value.
   *
   * @returns The wrapped value
   */
  valueOf(): unknown {
    return this.value;
  }

  /**
   * Get the context for this unknown value.
   *
   * @returns The context or undefined
   */
  getContext(): UnknownContext | undefined {
    return this.context;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const valueStr = JSON.stringify(this.value);
    return `unknown<${valueStr}>`;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: unknown; context?: UnknownContext } {
    return {
      value: this.value,
      ...(this.context && { context: this.context }),
    };
  }
}
