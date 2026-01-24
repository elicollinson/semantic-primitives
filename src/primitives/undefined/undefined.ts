/**
 * SemanticUndefined
 * An undefined type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<undefined> - Base semantic wrapper
 * - Comparable<SemanticUndefined> - Semantic equality comparison
 * - Explainable - Human-readable explanation
 *
 * Note: Does not implement SemanticAbsence<undefined> because undefined
 * has different classification types than null (not-initialized, optional-unset,
 * property-missing, void-return vs not-set, not-applicable).
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  InferReasonResult,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  Explainable,
} from '../../shared/interfaces.ts';
import {
  UNDEFINED_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createInferReasonPrompt,
  createSuggestInitializationPrompt,
  createIsAcceptablePrompt,
  createCompareToNullPrompt,
  createExplainPrompt,
  createClassifyPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResult,
  InferReasonResult,
} from '../../shared/types.ts';

/** Classification types for undefined values */
export type UndefinedType =
  | 'not-initialized'
  | 'optional-unset'
  | 'property-missing'
  | 'void-return'
  | 'unknown';

/** Result of undefined classification */
export interface UndefinedClassifyResult {
  type: UndefinedType;
  canBeInitialized: boolean;
}

/** Result of suggesting an initialization value */
export interface SuggestInitializationResult {
  value: unknown;
  explanation: string;
}

/** Type hint for initialization suggestion */
export interface TypeHint {
  type: string;
  schema?: unknown;
}

/** Result of checking if undefined is acceptable */
export interface AcceptableResult {
  acceptable: boolean;
  reason: string;
}

/** Result of comparing null vs undefined */
export interface CompareToNullResult {
  recommendation: 'null' | 'undefined';
  explanation: string;
}

/**
 * SemanticUndefined - Undefined with LLM-powered semantic understanding
 *
 * Unlike plain undefined that only represents an uninitialized/missing value,
 * SemanticUndefined can explain why a value is undefined, suggest initialization,
 * and help reason about appropriate handling.
 *
 * Implements:
 * - Semantic<undefined> - valueOf() returns undefined
 * - Comparable<SemanticUndefined> - semanticallyEquals() for comparison
 * - Explainable - explain() for human-readable description
 * - SemanticAbsence<undefined> - getReason() and classify()
 */
export class SemanticUndefined
  implements
    Semantic<undefined>,
    Comparable<SemanticUndefined>,
    Explainable
{
  private readonly context: string | undefined;
  private readonly client: LLMClient;

  private constructor(context?: string, client?: LLMClient) {
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticUndefined with context about why the value is undefined.
   *
   * @param context - Context explaining the undefined state
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticUndefined instance with context
   *
   * @example
   * SemanticUndefined.because("property not yet initialized")
   * SemanticUndefined.because("optional parameter not provided")
   */
  static because(context: string, client?: LLMClient): SemanticUndefined {
    return new SemanticUndefined(context, client);
  }

  /**
   * Create a SemanticUndefined without a context.
   *
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticUndefined instance
   */
  static create(client?: LLMClient): SemanticUndefined {
    return new SemanticUndefined(undefined, client);
  }

  /**
   * Check if two undefined values are semantically equivalent.
   * Undefined values with similar contexts are considered equivalent.
   *
   * @param other - Another SemanticUndefined to compare
   * @returns Equivalence result with confidence score
   *
   * @example
   * await SemanticUndefined.because("not initialized").semanticallyEquals(
   *   SemanticUndefined.because("unset")
   * )
   * // { equivalent: true, confidence: 0.9 }
   */
  async semanticallyEquals(
    other: SemanticUndefined
  ): Promise<SemanticEqualsResult> {
    // If neither has a context, they are equivalent
    if (!this.context && !other.context) {
      return { equivalent: true, confidence: 1.0 };
    }

    // If only one has a context, they may not be equivalent
    if (!this.context || !other.context) {
      return { equivalent: false, confidence: 0.7 };
    }

    // Both have contexts, use LLM to compare
    const prompt = createSemanticallyEqualsPrompt(this.context, other.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Infer why a value is undefined based on context.
   *
   * @param propertyPath - The property path that is undefined
   * @param context - Surrounding context
   * @param client - Optional LLM client for dependency injection
   * @returns Inferred reason
   *
   * @example
   * await SemanticUndefined.inferReason("user.profile.avatar", { user: { profile: {} } })
   * // { reason: "Optional property not set", type: "optional-unset" }
   */
  static async inferReason(
    propertyPath: string,
    context?: unknown,
    client?: LLMClient
  ): Promise<InferReasonResult> {
    const llmClient = client ?? getClient();
    const prompt = createInferReasonPrompt(propertyPath, context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferReasonResult;
  }

  /**
   * Suggest an appropriate initialization value.
   *
   * @param propertyName - Name of the property
   * @param typeHint - Optional type information
   * @param client - Optional LLM client for dependency injection
   * @returns Suggested initialization with explanation
   *
   * @example
   * await SemanticUndefined.suggestInitialization("items", { type: "array" })
   * // { value: [], explanation: "Arrays should be initialized empty, not undefined" }
   *
   * await SemanticUndefined.suggestInitialization("config", { type: "object" })
   * // { value: {}, explanation: "Objects should be initialized empty" }
   */
  static async suggestInitialization(
    propertyName: string,
    typeHint?: TypeHint,
    client?: LLMClient
  ): Promise<SuggestInitializationResult> {
    const llmClient = client ?? getClient();
    const prompt = createSuggestInitializationPrompt(propertyName, typeHint);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SuggestInitializationResult;
  }

  /**
   * Determine if undefined is acceptable here or indicates a bug.
   *
   * @param context - Context about where this undefined occurred
   * @param details - Additional details
   * @param client - Optional LLM client for dependency injection
   * @returns Assessment result
   *
   * @example
   * await SemanticUndefined.isAcceptable("return value", { functionName: "getUserById" })
   * // { acceptable: false, reason: "Function should return null for not found, not undefined" }
   */
  static async isAcceptable(
    context: string,
    details?: Record<string, unknown>,
    client?: LLMClient
  ): Promise<AcceptableResult> {
    const llmClient = client ?? getClient();
    const prompt = createIsAcceptablePrompt(context, details);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AcceptableResult;
  }

  /**
   * Check if this undefined differs semantically from null.
   * Explains when null vs undefined should be used.
   *
   * @param context - Context for the comparison
   * @param client - Optional LLM client for dependency injection
   * @returns Explanation of which is more appropriate
   *
   * @example
   * await SemanticUndefined.compareToNull("user.deletedAt")
   * // {
   * //   recommendation: "null",
   * //   explanation: "Use null for intentional absence (not deleted), undefined implies uninitialized"
   * // }
   */
  static async compareToNull(
    context: string,
    client?: LLMClient
  ): Promise<CompareToNullResult> {
    const llmClient = client ?? getClient();
    const prompt = createCompareToNullPrompt(context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as CompareToNullResult;
  }

  /**
   * Determine if this undefined represents a specific classification.
   *
   * @returns Classification of the undefined type
   *
   * @example
   * // For a property that was never initialized:
   * // { type: "not-initialized", canBeInitialized: true }
   *
   * // For an optional parameter not provided:
   * // { type: "optional-unset", canBeInitialized: true }
   */
  async classify(): Promise<UndefinedClassifyResult> {
    if (!this.context) {
      return { type: 'unknown', canBeInitialized: true };
    }

    const prompt = createClassifyPrompt(this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as UndefinedClassifyResult;
  }

  /**
   * Generate a human-readable explanation of this undefined value.
   *
   * @param propertyPath - The property path
   * @returns Human-readable explanation
   *
   * @example
   * await SemanticUndefined.because("not in response").explain("user.nickname")
   * // "The nickname property was not included in the API response"
   */
  async explain(propertyPath: string): Promise<string> {
    const prompt = createExplainPrompt(propertyPath, this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: UNDEFINED_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Get the context/reason for this undefined.
   * Note: This method is named getContext per the spec, but also implements
   * getReason from SemanticAbsence interface for compatibility.
   *
   * @returns The context string or undefined
   */
  getContext(): string | undefined {
    return this.context;
  }

  /**
   * Get the reason for this undefined (alias for getContext).
   * Implements SemanticAbsence interface.
   *
   * @returns The reason string or undefined
   */
  getReason(): string | undefined {
    return this.context;
  }

  /**
   * Check if this is semantically undefined (always true for SemanticUndefined).
   *
   * @returns true
   */
  isUndefined(): true {
    return true;
  }

  /**
   * Get the underlying undefined value.
   *
   * @returns undefined
   */
  valueOf(): undefined {
    return undefined;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    if (this.context) {
      return `undefined (${this.context})`;
    }
    return 'undefined';
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: undefined; context?: string } {
    return {
      value: undefined,
      ...(this.context && { context: this.context }),
    };
  }
}
