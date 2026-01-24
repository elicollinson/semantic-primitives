/**
 * SemanticBoolean
 * A boolean type with LLM-powered semantic understanding
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type { SemanticEqualsResult } from '../../shared/types.ts';
import {
  BOOLEAN_SYSTEM_PROMPT,
  createFromPrompt,
  createFromImplicationPrompt,
  createSemanticallyEqualsPrompt,
  createCompareStrengthPrompt,
  createExtractConditionsPrompt,
} from './prompts.ts';

export type { SemanticEqualsResult } from '../../shared/types.ts';

/** Options for parsing natural language to boolean */
export interface FromOptions {
  locale?: string;
  context?: string;
}

/** Categories of boolean expressions */
export type BooleanCategory = 'affirmative' | 'negative' | 'uncertain' | 'conditional';

/** Internal state of a SemanticBoolean */
interface SemanticBooleanState {
  value: boolean;
  confidence: number;
  category: BooleanCategory;
  conditions: string[];
  originalExpression: string;
}

/**
 * SemanticBoolean - Boolean with LLM-powered semantic understanding
 *
 * Unlike traditional booleans that only understand true/false,
 * semantic booleans can interpret natural language, handle ambiguity,
 * and bridge the gap between human communication and binary logic.
 */
export class SemanticBoolean {
  private readonly state: SemanticBooleanState;
  private readonly client: LLMClient;

  private constructor(state: SemanticBooleanState, client?: LLMClient) {
    this.state = state;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticBoolean from a raw boolean value
   */
  static fromBoolean(value: boolean, client?: LLMClient): SemanticBoolean {
    return new SemanticBoolean(
      {
        value,
        confidence: 1.0,
        category: value ? 'affirmative' : 'negative',
        conditions: [],
        originalExpression: String(value),
      },
      client
    );
  }

  /**
   * Parse natural language into a boolean value.
   * Understands affirmatives, negatives, and contextual expressions.
   *
   * @param input - Natural language text to interpret
   * @param options - Optional locale and context settings
   * @param client - Optional LLM client to use
   * @returns Promise resolving to SemanticBoolean instance
   *
   * @example
   * await SemanticBoolean.from("yes") // true
   * await SemanticBoolean.from("absolutely") // true
   * await SemanticBoolean.from("nope") // false
   * await SemanticBoolean.from("hai", { locale: "ja" }) // true (Japanese yes)
   */
  static async from(
    input: string,
    options?: FromOptions,
    client?: LLMClient
  ): Promise<SemanticBoolean> {
    const llmClient = client ?? getClient();
    const prompt = createFromPrompt(input, options?.locale, options?.context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: BOOLEAN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      value: boolean;
      confidence: number;
      category: BooleanCategory;
      conditions?: string[];
    };

    return new SemanticBoolean(
      {
        value: result.value,
        confidence: result.confidence,
        category: result.category,
        conditions: result.conditions ?? [],
        originalExpression: input,
      },
      llmClient
    );
  }

  /**
   * Infer boolean value from an implication or statement.
   * Analyzes statements that imply success/failure, presence/absence.
   *
   * @param statement - A declarative statement to analyze
   * @param client - Optional LLM client to use
   * @returns Promise resolving to SemanticBoolean with inferred value
   *
   * @example
   * await SemanticBoolean.fromImplication("The test passed") // true
   * await SemanticBoolean.fromImplication("We encountered errors") // false
   * await SemanticBoolean.fromImplication("No issues found") // true
   */
  static async fromImplication(
    statement: string,
    client?: LLMClient
  ): Promise<SemanticBoolean> {
    const llmClient = client ?? getClient();
    const prompt = createFromImplicationPrompt(statement);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: BOOLEAN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      value: boolean;
      confidence: number;
    };

    return new SemanticBoolean(
      {
        value: result.value,
        confidence: result.confidence,
        category: result.value ? 'affirmative' : 'negative',
        conditions: [],
        originalExpression: statement,
      },
      llmClient
    );
  }

  /**
   * Check if two boolean expressions are semantically equivalent.
   * Considers synonyms, cultural variations, and context.
   *
   * @param other - Another SemanticBoolean to compare
   * @returns Promise resolving to equivalence result with confidence score
   *
   * @example
   * const yes = await SemanticBoolean.from("yes");
   * const absolutely = await SemanticBoolean.from("absolutely");
   * await yes.semanticallyEquals(absolutely) // { equivalent: true, confidence: 0.95 }
   */
  async semanticallyEquals(other: SemanticBoolean): Promise<SemanticEqualsResult> {
    const prompt = createSemanticallyEqualsPrompt(
      this.state.originalExpression,
      other.state.originalExpression
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: BOOLEAN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Compare the strength/emphasis of two boolean expressions.
   * Returns negative if this is weaker, positive if stronger.
   *
   * @param other - Another SemanticBoolean to compare strength with
   * @returns Promise resolving to number from -1 to 1 indicating relative strength
   *
   * @example
   * const guess = await SemanticBoolean.from("I guess so");
   * const absolutely = await SemanticBoolean.from("Absolutely!");
   * await guess.compareStrength(absolutely) // -0.6 (weaker)
   */
  async compareStrength(other: SemanticBoolean): Promise<number> {
    const prompt = createCompareStrengthPrompt(
      this.state.originalExpression,
      other.state.originalExpression
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: BOOLEAN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      strengthDifference: number;
    };

    return result.strengthDifference;
  }

  /**
   * Check if the expression is affirmative (yes, sure, absolutely, etc.).
   *
   * @returns true if the expression indicates agreement/yes
   *
   * @example
   * const sb = await SemanticBoolean.from("sure thing");
   * sb.isAffirmative() // true
   */
  isAffirmative(): boolean {
    return this.state.category === 'affirmative';
  }

  /**
   * Check if the expression is negative (no, nope, never, etc.).
   *
   * @returns true if the expression indicates disagreement/no
   *
   * @example
   * const sb = await SemanticBoolean.from("no way");
   * sb.isNegative() // true
   */
  isNegative(): boolean {
    return this.state.category === 'negative';
  }

  /**
   * Check if the expression indicates uncertainty (maybe, perhaps, etc.).
   *
   * @returns true if the expression is ambiguous or uncertain
   *
   * @example
   * const sb = await SemanticBoolean.from("maybe");
   * sb.isUncertain() // true
   */
  isUncertain(): boolean {
    return this.state.category === 'uncertain';
  }

  /**
   * Check if the expression is conditional (yes, but...; if...; etc.).
   *
   * @returns true if the response depends on conditions
   *
   * @example
   * const sb = await SemanticBoolean.from("yes, if the price is right");
   * sb.isConditional() // true
   */
  isConditional(): boolean {
    return this.state.category === 'conditional';
  }

  /**
   * Extract conditions from a conditional boolean expression.
   * Uses LLM for more complex condition extraction if needed.
   *
   * @returns Promise resolving to array of condition strings, empty if not conditional
   *
   * @example
   * const sb = await SemanticBoolean.from("yes, if you can deliver by Friday");
   * await sb.extractConditions() // ["deliver by Friday"]
   */
  async extractConditions(): Promise<string[]> {
    if (this.state.conditions.length > 0) {
      return this.state.conditions;
    }

    if (!this.isConditional()) {
      return [];
    }

    const prompt = createExtractConditionsPrompt(this.state.originalExpression);

    const response = await this.client.complete({
      prompt,
      systemPrompt: BOOLEAN_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      isConditional: boolean;
      conditions: string[];
    };

    return result.conditions;
  }

  /**
   * Get the raw boolean value.
   *
   * @returns The resolved true/false value
   */
  valueOf(): boolean {
    return this.state.value;
  }

  /**
   * Get the confidence level of the interpretation.
   *
   * @returns Number from 0 to 1 indicating interpretation confidence
   */
  confidence(): number {
    return this.state.confidence;
  }

  /**
   * Get the original expression that was parsed
   */
  getOriginalExpression(): string {
    return this.state.originalExpression;
  }

  /**
   * Get the category of the boolean expression
   */
  getCategory(): BooleanCategory {
    return this.state.category;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return String(this.state.value);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: boolean; confidence: number; category: BooleanCategory } {
    return {
      value: this.state.value,
      confidence: this.state.confidence,
      category: this.state.category,
    };
  }
}
