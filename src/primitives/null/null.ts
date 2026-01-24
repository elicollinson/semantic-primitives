/**
 * SemanticNull
 * A null type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<null> - Base semantic wrapper
 * - Comparable<SemanticNull> - Semantic equality comparison
 * - Explainable - Human-readable explanation
 * - SemanticAbsence<null> - Absence-specific methods
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  InferReasonResult,
  AppropriateResult,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  Explainable,
  SemanticAbsence,
} from '../../shared/interfaces.ts';
import {
  NULL_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createInferReasonPrompt,
  createSuggestDefaultPrompt,
  createIsAppropriatePrompt,
  createClassifyPrompt,
  createExplainPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResult,
  InferReasonResult,
  AppropriateResult,
} from '../../shared/types.ts';

/** Classification types for null values */
export type NullType = 'not-set' | 'not-applicable' | 'unknown';

/** Result of null classification */
export interface NullClassifyResult {
  type: NullType;
  canBeProvided: boolean;
}

/** Result of suggesting a default value */
export interface SuggestDefaultResult {
  default: unknown;
  explanation: string;
}

/** Schema information for suggestDefault */
export interface SchemaInfo {
  type: string;
  format?: string;
}

/** Context for isAppropriate */
export interface AppropriateContext {
  required?: boolean;
  schema?: unknown;
}

/**
 * SemanticNull - Null with LLM-powered semantic understanding
 *
 * Unlike plain null that only represents absence,
 * SemanticNull can explain why a value is null, classify the type of absence,
 * and help reason about appropriate handling.
 *
 * Implements:
 * - Semantic<null> - valueOf() returns null
 * - Comparable<SemanticNull> - semanticallyEquals() for comparison
 * - Explainable - explain() for human-readable description
 * - SemanticAbsence<null> - getReason() and classify()
 */
export class SemanticNull
  implements
    Semantic<null>,
    Comparable<SemanticNull>,
    Explainable,
    SemanticAbsence<null>
{
  private readonly reason: string | undefined;
  private readonly client: LLMClient;

  private constructor(reason?: string, client?: LLMClient) {
    this.reason = reason;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticNull with context about why the value is null.
   *
   * @param reason - Reason or context for the null value
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticNull instance with context
   *
   * @example
   * SemanticNull.because("user has not set a phone number")
   * SemanticNull.because("field is not applicable for this user type")
   */
  static because(reason: string, client?: LLMClient): SemanticNull {
    return new SemanticNull(reason, client);
  }

  /**
   * Create a SemanticNull without a reason.
   *
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticNull instance
   */
  static create(client?: LLMClient): SemanticNull {
    return new SemanticNull(undefined, client);
  }

  /**
   * Check if two null values are semantically equivalent.
   * Null values with similar reasons/contexts are considered equivalent.
   *
   * @param other - Another SemanticNull to compare
   * @returns Equivalence result with confidence score
   *
   * @example
   * await SemanticNull.because("not set").semanticallyEquals(SemanticNull.because("empty"))
   * // { equivalent: true, confidence: 0.85 }
   */
  async semanticallyEquals(other: SemanticNull): Promise<SemanticEqualsResult> {
    // If neither has a reason, they are equivalent
    if (!this.reason && !other.reason) {
      return { equivalent: true, confidence: 1.0 };
    }

    // If only one has a reason, they may not be equivalent
    if (!this.reason || !other.reason) {
      return { equivalent: false, confidence: 0.7 };
    }

    // Both have reasons, use LLM to compare
    const prompt = createSemanticallyEqualsPrompt(this.reason, other.reason);

    const response = await this.client.complete({
      prompt,
      systemPrompt: NULL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Infer the likely reason for a null value based on context.
   *
   * @param fieldName - Name of the field that is null
   * @param context - Surrounding context (object, schema, etc.)
   * @param client - Optional LLM client for dependency injection
   * @returns Inferred reason for the null
   *
   * @example
   * await SemanticNull.inferReason("deletedAt", { status: "active" })
   * // { reason: "Record has not been deleted", type: "not-applicable" }
   */
  static async inferReason(
    fieldName: string,
    context?: Record<string, unknown>,
    client?: LLMClient
  ): Promise<InferReasonResult> {
    const llmClient = client ?? getClient();
    const prompt = createInferReasonPrompt(fieldName, context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NULL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferReasonResult;
  }

  /**
   * Suggest an appropriate default value for a null field.
   *
   * @param fieldName - Name of the field
   * @param schema - Optional schema or type information
   * @param client - Optional LLM client for dependency injection
   * @returns Suggested default with explanation
   *
   * @example
   * await SemanticNull.suggestDefault("phoneNumber", { type: "string", format: "phone" })
   * // { default: null, explanation: "Phone numbers should not have a default; require user input" }
   *
   * await SemanticNull.suggestDefault("retryCount", { type: "number" })
   * // { default: 0, explanation: "Retry count should start at 0" }
   */
  static async suggestDefault(
    fieldName: string,
    schema?: SchemaInfo,
    client?: LLMClient
  ): Promise<SuggestDefaultResult> {
    const llmClient = client ?? getClient();
    const prompt = createSuggestDefaultPrompt(fieldName, schema);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NULL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SuggestDefaultResult;
  }

  /**
   * Check if null is appropriate for this field/context.
   *
   * @param fieldName - Name of the field
   * @param context - Context information
   * @param client - Optional LLM client for dependency injection
   * @returns Validation result
   *
   * @example
   * await SemanticNull.isAppropriate("email", { required: true })
   * // { appropriate: false, reason: "Email is a required field" }
   */
  static async isAppropriate(
    fieldName: string,
    context?: AppropriateContext,
    client?: LLMClient
  ): Promise<AppropriateResult> {
    const llmClient = client ?? getClient();
    const prompt = createIsAppropriatePrompt(fieldName, context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NULL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AppropriateResult;
  }

  /**
   * Determine if this null represents "not set" vs "not applicable".
   *
   * @returns Classification of the null type
   *
   * @example
   * // For a middleName field where user left it blank:
   * // { type: "not-set", canBeProvided: true }
   *
   * // For a spouseName field for a single person:
   * // { type: "not-applicable", canBeProvided: false }
   */
  async classify(): Promise<NullClassifyResult> {
    if (!this.reason) {
      return { type: 'unknown', canBeProvided: true };
    }

    const prompt = createClassifyPrompt(this.reason);

    const response = await this.client.complete({
      prompt,
      systemPrompt: NULL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as NullClassifyResult;
  }

  /**
   * Generate a human-readable explanation of this null value.
   *
   * @param fieldName - Name of the field
   * @returns Human-readable explanation
   *
   * @example
   * await SemanticNull.because("user skipped").explain("middleName")
   * // "Middle name was not provided by the user"
   */
  async explain(fieldName: string): Promise<string> {
    const prompt = createExplainPrompt(fieldName, this.reason);

    const response = await this.client.complete({
      prompt,
      systemPrompt: NULL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Get the reason for this null, if provided.
   *
   * @returns The reason string or undefined
   */
  getReason(): string | undefined {
    return this.reason;
  }

  /**
   * Check if this is semantically null (always true for SemanticNull).
   *
   * @returns true
   */
  isNull(): true {
    return true;
  }

  /**
   * Get the underlying null value.
   *
   * @returns null
   */
  valueOf(): null {
    return null;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    if (this.reason) {
      return `null (${this.reason})`;
    }
    return 'null';
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: null; reason?: string } {
    return {
      value: null,
      ...(this.reason && { reason: this.reason }),
    };
  }
}
