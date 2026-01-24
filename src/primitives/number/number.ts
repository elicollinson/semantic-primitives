/**
 * SemanticNumber - LLM-enhanced number type with semantic understanding
 *
 * Extends the native JavaScript number with semantic operations including:
 * - Natural language parsing
 * - Context-aware equality comparison
 * - Reasonableness validation
 * - Unit inference and conversion
 * - Human-friendly descriptions
 *
 * Implements shared interfaces:
 * - Semantic<number> - Base semantic wrapper
 * - Comparable<number | SemanticNumber> - Semantic equality comparison
 * - ContextValidatable - Reasonableness checks
 * - UnitConvertible<SemanticNumber> - Unit conversion
 * - Describable - Human-friendly descriptions
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type {
  SemanticEqualsResult,
  ReasonableResult,
  InferUnitResult,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  ContextValidatable,
  UnitConvertible,
  Describable,
} from '../../shared/interfaces.ts';
import {
  PARSE_NUMBER_SYSTEM,
  parseNumberPrompt,
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  IS_REASONABLE_SYSTEM,
  isReasonablePrompt,
  INFER_UNIT_SYSTEM,
  inferUnitPrompt,
  CONVERT_UNIT_SYSTEM,
  convertUnitPrompt,
  DESCRIBE_NUMBER_SYSTEM,
  describeNumberPrompt,
} from './number.prompts.ts';

// Re-export shared types
export type {
  SemanticEqualsResult,
  ReasonableResult,
  InferUnitResult,
} from '../../shared/types.ts';

/** Options for semantic equality comparison */
export interface SemanticEqualsOptions {
  tolerance?: 'exact' | 'approximate' | number;
}

/** LLM client interface for dependency injection (compatible with shared LLMClientInterface) */
export interface LLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticNumber class
 * Wraps a numeric value with LLM-powered semantic operations
 *
 * Implements:
 * - Semantic<number> - valueOf() returns the numeric value
 * - Comparable<number | SemanticNumber> - semanticallyEquals() for comparison
 * - ContextValidatable - isReasonable() for context-aware validation
 * - UnitConvertible<SemanticNumber> - convert() and inferUnit()
 * - Describable - describe() for human-friendly descriptions
 */
export class SemanticNumber
  implements
    Semantic<number>,
    Comparable<number | SemanticNumber>,
    ContextValidatable,
    UnitConvertible<SemanticNumber>,
    Describable
{
  private readonly _value: number;
  private readonly _llmClient: LLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticNumber instance
   * @param value - The numeric value to wrap
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    value: number,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._value = value;
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Parse a number from natural language or formatted string
   * Understands words, abbreviations, and localized formats
   *
   * @param input - Natural language or formatted number string
   * @param context - Optional context for interpretation
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticNumber instance
   *
   * @example
   * SemanticNumber.from("twenty-five") // 25
   * SemanticNumber.from("2.5k") // 2500
   * SemanticNumber.from("$1,234.56") // 1234.56
   * SemanticNumber.from("about a dozen") // 12
   */
  static async from(
    input: string,
    context?: string,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<SemanticNumber> {
    // Use LLM for parsing
    const client = llmClient || { chat };
    const messages: Message[] = [
      { role: 'user', content: parseNumberPrompt(input, context) },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: PARSE_NUMBER_SYSTEM,
      ...llmConfig,
    });

    const result = JSON.parse(response.content) as {
      value: number | null;
      confidence: number;
      interpretation: string;
    };

    if (result.value === null) {
      throw new Error(`Unable to parse "${input}" as a number: ${result.interpretation}`);
    }

    return new SemanticNumber(result.value, llmClient, llmConfig);
  }

  /**
   * Check if two numbers are semantically equivalent
   * Considers approximate values and contextual equivalence
   *
   * @param other - Number to compare with
   * @param options - Comparison options including tolerance
   * @returns Equivalence result with confidence
   *
   * @example
   * SemanticNumber.from(100).semanticallyEquals(99, { tolerance: "approximate" })
   * // { equivalent: true, confidence: 0.95 }
   */
  async semanticallyEquals(
    other: number | SemanticNumber,
    options?: SemanticEqualsOptions
  ): Promise<SemanticEqualsResult> {
    const otherValue = other instanceof SemanticNumber ? other.valueOf() : other;
    const tolerance = options?.tolerance ?? 'approximate';

    // Use LLM for semantic comparison
    const messages: Message[] = [
      { role: 'user', content: semanticEqualsPrompt(this._value, otherValue, tolerance) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Validate if the number is reasonable for a given context
   *
   * @param context - What this number represents
   * @returns Validation result with explanation
   *
   * @example
   * SemanticNumber.from(150).isReasonable("human age")
   * // { reasonable: false, explanation: "Human age rarely exceeds 120 years" }
   */
  async isReasonable(context: string): Promise<ReasonableResult> {
    const messages: Message[] = [
      { role: 'user', content: isReasonablePrompt(this._value, context) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: IS_REASONABLE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ReasonableResult;
  }

  /**
   * Infer the likely unit for this number based on context
   *
   * @param context - Context describing what this number represents
   * @returns Inferred unit with confidence
   *
   * @example
   * SemanticNumber.from(72).inferUnit("body temperature")
   * // { unit: "fahrenheit", confidence: 0.85 }
   */
  async inferUnit(context: string): Promise<InferUnitResult> {
    const messages: Message[] = [
      { role: 'user', content: inferUnitPrompt(this._value, context) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: INFER_UNIT_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as InferUnitResult;
  }

  /**
   * Convert to a different unit with semantic understanding
   *
   * @param toUnit - Target unit
   * @param fromUnit - Source unit (optional, can be inferred)
   * @returns Converted number
   *
   * @example
   * SemanticNumber.from(100).convert("celsius", "fahrenheit")
   * // SemanticNumber(37.78)
   */
  async convert(toUnit: string, fromUnit?: string): Promise<SemanticNumber> {
    const sourceUnit = fromUnit || 'unknown';

    const messages: Message[] = [
      { role: 'user', content: convertUnitPrompt(this._value, sourceUnit, toUnit) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: CONVERT_UNIT_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as {
      value: number;
      fromUnit: string;
      toUnit: string;
      formula: string;
    };

    return new SemanticNumber(result.value, this._llmClient, this._llmConfig);
  }

  /**
   * Get a human-friendly description of the number's magnitude
   *
   * @param context - Optional context for more relevant description
   * @returns Human-readable description
   *
   * @example
   * SemanticNumber.from(1000000).describe()
   * // "one million"
   */
  async describe(context?: string): Promise<string> {
    const messages: Message[] = [
      { role: 'user', content: describeNumberPrompt(this._value, context) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DESCRIBE_NUMBER_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as {
      description: string;
      magnitude: string;
    };

    return result.description;
  }

  /**
   * Get the raw numeric value
   * @returns The underlying number
   */
  valueOf(): number {
    return this._value;
  }

  /**
   * Explain the number in a human-readable way.
   * Implements Explainable interface.
   *
   * @param context - Optional context for the explanation
   * @returns Human-readable explanation
   */
  async explain(context?: string): Promise<string> {
    return this.describe(context);
  }

  /**
   * Convert to string
   */
  toString(): string {
    return String(this._value);
  }

  /**
   * Convert to JSON
   */
  toJSON(): number {
    return this._value;
  }
}
