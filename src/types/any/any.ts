/**
 * SemanticAny
 * An any type with LLM-powered semantic understanding
 *
 * Helps reason about untyped values, suggest proper types,
 * and manage the transition from `any` to properly typed code.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SeverityLevel,
  SafetyResult,
  ExplanationResult,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
import {
  ANY_SYSTEM_PROMPT,
  createClassifyIntentPrompt,
  createSuggestTypePrompt,
  createAssessRiskPrompt,
  createGenerateMigrationPrompt,
  createValidatePrompt,
  createIsSafeForPrompt,
  createExplainPrompt,
} from './prompts.ts';

export type { SeverityLevel, SafetyResult, ExplanationResult } from '../../shared/types.ts';

/** Intent classification for any usage */
export type AnyIntent = 'escape-hatch' | 'lazy' | 'necessary' | 'migration' | 'unknown';

/** Result of classifying intent behind any usage */
export interface ClassifyIntentResult {
  intent: AnyIntent;
  reason: string;
  risk: SeverityLevel;
}

/** Result of suggesting a type for an any value */
export interface SuggestTypeResult {
  type: string;
  interface?: string;
  confidence: number;
}

/** Result of risk assessment */
export interface AssessRiskResult {
  level: SeverityLevel;
  reasons: string[];
  recommendations: string[];
}

/** Result of migration code generation */
export interface GenerateMigrationResult {
  typeDefinition: string;
  typeGuard?: string;
  usage: string;
}

/** Result of validation */
export interface AnyValidateResult {
  valid: boolean;
  issues?: string[];
  inferredShape: string;
}

/** Context for SemanticAny creation */
export interface AnyContext {
  source?: string;
  reason?: string;
}

/** Options for migration generation */
export interface MigrationOptions {
  strict?: boolean;
}

/**
 * SemanticAny - Any type with LLM-powered semantic understanding
 *
 * Unlike plain any that bypasses type checking entirely,
 * SemanticAny can analyze the value, suggest proper types,
 * assess risks, and help migrate to properly typed code.
 */
export class SemanticAny implements Semantic<unknown> {
  private readonly value: unknown;
  private readonly context: AnyContext | undefined;
  private readonly client: LLMClient;

  private constructor(value: unknown, context?: AnyContext, client?: LLMClient) {
    this.value = value;
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Wrap an `any` value with semantic capabilities.
   *
   * @param value - The any-typed value
   * @param context - Context about where this any came from
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticAny wrapper
   */
  static from(value: unknown, context?: AnyContext, client?: LLMClient): SemanticAny {
    return new SemanticAny(value, context, client);
  }

  /**
   * Classify the intent behind using `any` here.
   *
   * @returns Intent classification with risk level
   */
  async classifyIntent(): Promise<ClassifyIntentResult> {
    const prompt = createClassifyIntentPrompt(this.value, this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ClassifyIntentResult;
  }

  /**
   * Suggest a proper TypeScript type for this value.
   *
   * @returns Type suggestion with confidence
   */
  async suggestType(): Promise<SuggestTypeResult> {
    const prompt = createSuggestTypePrompt(this.value);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SuggestTypeResult;
  }

  /**
   * Assess the risk of using `any` for this value.
   *
   * @returns Risk assessment with recommendations
   */
  async assessRisk(): Promise<AssessRiskResult> {
    const prompt = createAssessRiskPrompt(this.value, this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AssessRiskResult;
  }

  /**
   * Generate migration code to replace `any` with proper types.
   *
   * @param options - Migration options
   * @returns Migration suggestions with code
   */
  async generateMigration(options?: MigrationOptions): Promise<GenerateMigrationResult> {
    const prompt = createGenerateMigrationPrompt(this.value, options);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as GenerateMigrationResult;
  }

  /**
   * Validate the value at runtime with inferred rules.
   *
   * @returns Validation result with inferred shape
   */
  async validate(): Promise<AnyValidateResult> {
    const prompt = createValidatePrompt(this.value);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AnyValidateResult;
  }

  /**
   * Check if the value is safe to use in a specific context.
   *
   * @param context - Usage context
   * @returns Safety assessment
   */
  async isSafeFor(context: string): Promise<SafetyResult> {
    const prompt = createIsSafeForPrompt(this.value, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SafetyResult;
  }

  /**
   * Explain why `any` might be used here and alternatives.
   *
   * @returns Explanation with alternatives
   */
  async explain(): Promise<ExplanationResult> {
    const prompt = createExplainPrompt(this.value, this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ANY_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ExplanationResult;
  }

  /**
   * Narrow to a specific type with runtime checking.
   *
   * @param guard - Type guard function
   * @returns Narrowed value or null
   */
  narrowTo<T>(guard: (x: unknown) => x is T): T | null {
    if (guard(this.value)) {
      return this.value;
    }
    return null;
  }

  /**
   * Get the underlying value.
   *
   * @returns The wrapped value
   */
  valueOf(): unknown {
    return this.value;
  }

  /**
   * Get the context for this any value.
   *
   * @returns The context or undefined
   */
  getContext(): AnyContext | undefined {
    return this.context;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const valueStr = JSON.stringify(this.value);
    if (this.context?.source) {
      return `any<${valueStr}> (from: ${this.context.source})`;
    }
    return `any<${valueStr}>`;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: unknown; context?: AnyContext } {
    return {
      value: this.value,
      ...(this.context && { context: this.context }),
    };
  }
}
