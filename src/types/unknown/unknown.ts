/**
 * SemanticUnknown
 * An unknown type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<unknown> - Base semantic wrapper
 * - Explainable - Human-readable explanation
 * - TypeInferable - Type inference capabilities
 *
 * Core Principle: unknown represents type-safe uncertainty - semantic
 * operations help infer types and generate proper type guards.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  Semantic,
  Explainable,
  TypeInferable,
} from '../../shared/interfaces.ts';
import type { ConfidenceResult, InferTypeResult } from '../../shared/types.ts';
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

/** Basic JavaScript types that can be inferred */
export type BasicType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'undefined'
  | 'function';

/** Result of type inference */
export interface UnknownInferTypeResult extends InferTypeResult {
  type: BasicType;
  shape?: string;
  confidence: number;
}

/** Type suggestion with confidence and reason */
export interface TypeSuggestion extends ConfidenceResult {
  type: string;
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

/** Result of matches check */
export interface MatchesResult extends ConfidenceResult {
  matches: boolean;
}

/** Result of narrowTo operation */
export type NarrowToResult<T> =
  | { success: true; value: T }
  | { success: false; errors: string[] };

/**
 * SemanticUnknown - Unknown with LLM-powered semantic understanding
 *
 * Unlike plain unknown that only represents type uncertainty,
 * SemanticUnknown can infer types, validate shapes, generate type guards,
 * and help safely narrow unknown values to proper types.
 *
 * Implements:
 * - Semantic<unknown> - valueOf() returns the wrapped value
 * - Explainable - explain() for human-readable description
 * - TypeInferable - inferType() for type inference
 */
export class SemanticUnknown
  implements Semantic<unknown>, Explainable, TypeInferable
{
  private readonly value: unknown;
  private readonly context: { source?: string } | undefined;
  private readonly client: LLMClient;

  private constructor(
    value: unknown,
    context?: { source?: string },
    client?: LLMClient
  ) {
    this.value = value;
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Wrap an unknown value with semantic capabilities.
   *
   * @param value - The unknown value
   * @param context - Optional context about the value's source
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticUnknown wrapper
   *
   * @example
   * SemanticUnknown.from(JSON.parse(data), { source: "API response" })
   */
  static from(
    value: unknown,
    context?: { source?: string },
    client?: LLMClient
  ): SemanticUnknown {
    return new SemanticUnknown(value, context, client);
  }

  /**
   * Infer the most likely type of this unknown value.
   *
   * @returns Type inference with confidence
   *
   * @example
   * SemanticUnknown.from({ id: 1, name: "test" }).inferType()
   * // {
   * //   type: "object",
   * //   shape: "{ id: number; name: string }",
   * //   confidence: 0.95
   * // }
   */
  async inferType(): Promise<UnknownInferTypeResult> {
    // For simple types, return immediately without LLM
    const simpleType = this.getSimpleType();
    if (simpleType) {
      return simpleType;
    }

    // Use LLM for complex type inference
    const prompt = createInferTypePrompt(this.value, this.context);

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
   * @param limit - Maximum number of suggestions (default: 3)
   * @returns Type suggestions ranked by likelihood
   *
   * @example
   * unknownValue.suggestTypes(3)
   * // [
   * //   { type: "User", confidence: 0.9, reason: "Has typical user fields" },
   * //   { type: "{ name: string; email: string }", confidence: 0.85 }
   * // ]
   */
  async suggestTypes(limit = 3): Promise<TypeSuggestion[]> {
    const prompt = createSuggestTypesPrompt(this.value, limit);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      suggestions: TypeSuggestion[];
    };
    return result.suggestions;
  }

  /**
   * Validate the value has a specific shape.
   *
   * @param description - Natural language description of expected shape
   * @returns Validation result
   *
   * @example
   * unknownValue.validateShape("user object with name and email")
   * // { matches: true, missingFields: [], extraFields: ["age"] }
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
   *
   * @example
   * unknownValue.generateTypeGuard()
   * // {
   * //   code: "function isUser(x: unknown): x is User { ... }",
   * //   typeName: "User"
   * // }
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
   *
   * @example
   * unknownValue.safeAccess("user's email address")
   * // SemanticUnknown containing the email, or undefined
   */
  async safeAccess(path: string): Promise<SemanticUnknown | undefined> {
    // Try direct property access first for simple paths
    const directValue = this.tryDirectAccess(path);
    if (directValue !== undefined) {
      return SemanticUnknown.from(directValue, undefined, this.client);
    }

    // Use LLM for semantic path resolution
    const prompt = createSafeAccessPrompt(this.value, path);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      propertyPath: string | null;
      value: unknown;
      confidence: number;
    };

    if (result.propertyPath === null || result.value === null) {
      return undefined;
    }

    return SemanticUnknown.from(result.value, undefined, this.client);
  }

  /**
   * Check if the value matches a semantic description.
   *
   * @param description - Description of what the value should be
   * @returns Match result
   *
   * @example
   * unknownValue.matches("array of user objects")
   * // { matches: true, confidence: 0.92 }
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
   *
   * @example
   * unknownValue.narrowTo("User", ["must have email", "id must be positive"])
   */
  async narrowTo<T>(
    typeName: string,
    validator?: string[]
  ): Promise<NarrowToResult<T>> {
    const prompt = createNarrowToPrompt(this.value, typeName, validator);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      success: boolean;
      errors: string[];
    };

    if (result.success) {
      return { success: true, value: this.value as T };
    }

    return { success: false, errors: result.errors };
  }

  /**
   * Explain what this unknown value appears to be.
   *
   * @returns Human-readable explanation
   *
   * @example
   * unknownValue.explain()
   * // "This appears to be a user profile object with personal information..."
   */
  async explain(): Promise<string> {
    // For null/undefined, return immediately
    if (this.value === null) {
      return 'This value is null, indicating an intentional absence of data.';
    }
    if (this.value === undefined) {
      return 'This value is undefined, indicating uninitialized or missing data.';
    }

    const prompt = createExplainPrompt(this.value, this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNKNOWN_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
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
   * Check if the value is "empty" (null, undefined, empty string/array/object).
   *
   * @returns Whether the value is semantically empty
   */
  isEmpty(): boolean {
    if (this.value === null || this.value === undefined) {
      return true;
    }
    if (typeof this.value === 'string' && this.value.length === 0) {
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
   * Get the context/source for this unknown value.
   *
   * @returns The context object or undefined
   */
  getContext(): { source?: string } | undefined {
    return this.context;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const type = typeof this.value;
    if (this.value === null) {
      return 'SemanticUnknown(null)';
    }
    if (Array.isArray(this.value)) {
      return `SemanticUnknown(Array[${this.value.length}])`;
    }
    if (type === 'object') {
      return `SemanticUnknown(Object)`;
    }
    return `SemanticUnknown(${type})`;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: unknown; context?: { source?: string } } {
    return {
      value: this.value,
      ...(this.context && { context: this.context }),
    };
  }

  /**
   * Try direct property access for simple dot-notation paths
   */
  private tryDirectAccess(path: string): unknown {
    if (typeof this.value !== 'object' || this.value === null) {
      return undefined;
    }

    // Only handle simple property names (no dots, no special characters)
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(path)) {
      return undefined;
    }

    const obj = this.value as Record<string, unknown>;
    if (path in obj) {
      return obj[path];
    }

    return undefined;
  }

  /**
   * Get simple type without LLM for primitive values
   */
  private getSimpleType(): UnknownInferTypeResult | null {
    if (this.value === null) {
      return { type: 'null', confidence: 1.0 };
    }
    if (this.value === undefined) {
      return { type: 'undefined', confidence: 1.0 };
    }
    if (typeof this.value === 'string') {
      return { type: 'string', confidence: 1.0 };
    }
    if (typeof this.value === 'number') {
      return { type: 'number', confidence: 1.0 };
    }
    if (typeof this.value === 'boolean') {
      return { type: 'boolean', confidence: 1.0 };
    }
    if (typeof this.value === 'function') {
      return { type: 'function', confidence: 1.0 };
    }
    if (Array.isArray(this.value)) {
      // Arrays need LLM for shape inference
      return null;
    }
    // Objects need LLM for shape inference
    return null;
  }
}
