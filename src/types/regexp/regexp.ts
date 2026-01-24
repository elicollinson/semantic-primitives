/**
 * SemanticRegExp
 * A RegExp type with LLM-powered semantic understanding
 *
 * Provides semantic operations on regular expressions:
 * - Natural language pattern creation
 * - Human-readable explanation
 * - Test case generation
 * - Pattern validation and improvement suggestions
 * - Data type inference
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ImprovementSuggestion,
  RegExpTestCases,
  ValidateResultWithWarnings,
  RelatedSuggestion,
  InferTypeResult,
} from '../../shared/types.ts';
import type { Semantic, Explainable, TypeInferable } from '../../shared/interfaces.ts';
import {
  REGEXP_SYSTEM_PROMPT,
  createFromPrompt,
  createSemanticallyEqualsPrompt,
  createExplainPrompt,
  createTestWithExplanationPrompt,
  createSuggestImprovementsPrompt,
  createGenerateTestCasesPrompt,
  createValidatePrompt,
  createToReadablePrompt,
  createSuggestRelatedPrompt,
  createInferDataTypePrompt,
  createSimplifyPrompt,
} from './prompts.ts';

/** Options for creating regex from natural language */
export interface FromOptions {
  flags?: string;
  strict?: boolean;
}

/** Result of testWithExplanation */
export interface TestWithExplanationResult {
  matches: boolean;
  reason: string;
  matchedPart?: string;
}

/** Result of simplify operation */
export interface SimplifyResult {
  regex: SemanticRegExp;
  explanation: string;
}

/**
 * SemanticRegExp - Regular expression with LLM-powered semantic understanding
 *
 * Extends native RegExp functionality with semantic operations like
 * natural language pattern creation, explanation, and intelligent analysis.
 */
export class SemanticRegExp implements Semantic<RegExp>, Explainable, TypeInferable {
  private readonly regex: RegExp;
  private readonly client: LLMClient;

  private constructor(regex: RegExp, client?: LLMClient) {
    this.regex = regex;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticRegExp from an existing RegExp
   */
  static fromRegExp(regex: RegExp, client?: LLMClient): SemanticRegExp {
    return new SemanticRegExp(regex, client);
  }

  /**
   * Create a SemanticRegExp from a pattern string
   */
  static fromPattern(
    pattern: string,
    flags?: string,
    client?: LLMClient
  ): SemanticRegExp {
    return new SemanticRegExp(new RegExp(pattern, flags), client);
  }

  /**
   * Create a regex from natural language description using LLM
   *
   * @param description - Natural language pattern description
   * @param options - Creation options
   * @param client - Optional LLM client
   * @returns SemanticRegExp instance
   *
   * @example
   * SemanticRegExp.from("email addresses")
   * SemanticRegExp.from("phone numbers in US format")
   * SemanticRegExp.from("URLs starting with https")
   */
  static async from(
    description: string,
    options?: FromOptions,
    client?: LLMClient
  ): Promise<SemanticRegExp> {
    const llmClient = client ?? getClient();
    const prompt = createFromPrompt(description, options);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      pattern: string;
      flags: string;
      confidence: number;
      notes?: string;
    };

    return new SemanticRegExp(new RegExp(result.pattern, result.flags), llmClient);
  }

  /**
   * Get the underlying RegExp value
   */
  valueOf(): RegExp {
    return this.regex;
  }

  /**
   * Get the regex source pattern
   */
  get source(): string {
    return this.regex.source;
  }

  /**
   * Get the regex flags
   */
  get flags(): string {
    return this.regex.flags;
  }

  /**
   * Test if a string matches the regex
   */
  test(input: string): boolean {
    return this.regex.test(input);
  }

  /**
   * Execute the regex on a string
   */
  exec(input: string): RegExpExecArray | null {
    return this.regex.exec(input);
  }

  /**
   * Check if two regexes match the same patterns semantically
   *
   * @param other - RegExp to compare
   * @param testStrings - Optional strings to test against
   * @returns Equivalence result with confidence
   */
  async semanticallyEquals(
    other: RegExp | SemanticRegExp,
    testStrings?: string[]
  ): Promise<SemanticEqualsResult> {
    const otherRegex = other instanceof SemanticRegExp ? other.valueOf() : other;
    const prompt = createSemanticallyEqualsPrompt(
      this.regex.source,
      this.regex.flags,
      otherRegex.source,
      otherRegex.flags,
      testStrings
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      equivalent: boolean;
      confidence: number;
      differences?: string[];
      note?: string;
    };

    return {
      equivalent: result.equivalent,
      confidence: result.confidence,
    };
  }

  /**
   * Explain what the regex matches in plain language
   *
   * @param context - Optional context for more relevant explanation
   * @returns Human-readable explanation
   */
  async explain(context?: string): Promise<string> {
    const prompt = createExplainPrompt(this.regex.source, this.regex.flags);

    const response = await this.client.complete({
      prompt: context ? `${prompt}\n\nContext: ${context}` : prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      explanation: string;
      examples: string[];
      components: { part: string; meaning: string }[];
    };

    return result.explanation;
  }

  /**
   * Test a string and explain why it matched or didn't
   *
   * @param input - String to test
   * @returns Match result with explanation
   */
  async testWithExplanation(input: string): Promise<TestWithExplanationResult> {
    const prompt = createTestWithExplanationPrompt(
      this.regex.source,
      this.regex.flags,
      input
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as TestWithExplanationResult;
  }

  /**
   * Suggest improvements to the regex
   *
   * @returns Suggested improvements
   */
  async suggestImprovements(): Promise<ImprovementSuggestion[]> {
    const prompt = createSuggestImprovementsPrompt(
      this.regex.source,
      this.regex.flags
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: ImprovementSuggestion[];
      confidence: number;
    };

    return result.suggestions;
  }

  /**
   * Generate test cases for the regex
   *
   * @returns Test cases with strings that should and shouldn't match
   */
  async generateTestCases(): Promise<RegExpTestCases> {
    const prompt = createGenerateTestCasesPrompt(
      this.regex.source,
      this.regex.flags
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      shouldMatch: string[];
      shouldNotMatch: string[];
      confidence: number;
    };

    return {
      shouldMatch: result.shouldMatch,
      shouldNotMatch: result.shouldNotMatch,
    };
  }

  /**
   * Validate the regex for common issues
   *
   * @returns Validation result with issues and warnings
   */
  async validate(): Promise<ValidateResultWithWarnings> {
    const prompt = createValidatePrompt(this.regex.source, this.regex.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      issues: string[];
      warnings: string[];
      confidence: number;
    };

    return {
      valid: result.valid,
      issues: result.issues,
      warnings: result.warnings,
    };
  }

  /**
   * Convert to a more readable format
   *
   * @returns Readable regex representation
   */
  async toReadable(): Promise<string> {
    const prompt = createToReadablePrompt(this.regex.source, this.regex.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      readable: string;
      breakdown: string[];
      confidence: number;
    };

    return result.readable;
  }

  /**
   * Find similar patterns that might also be needed
   *
   * @returns Related patterns with reasons
   */
  async suggestRelated(): Promise<RelatedSuggestion[]> {
    const prompt = createSuggestRelatedPrompt(
      this.regex.source,
      this.regex.flags
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      related: { pattern: string; reason: string; regex?: string }[];
      confidence: number;
    };

    return result.related.map((r) => ({
      pattern: r.pattern,
      reason: r.reason,
      ...(r.regex && { value: r.regex }),
    }));
  }

  /**
   * Detect what type of data this regex is designed to match
   *
   * @returns Inferred data type with confidence
   */
  async inferDataType(): Promise<InferTypeResult> {
    const prompt = createInferDataTypePrompt(
      this.regex.source,
      this.regex.flags
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      type: string;
      confidence: number;
      category?: string;
    };

    return {
      type: result.type,
      confidence: result.confidence,
    };
  }

  /**
   * Alias for inferDataType to match TypeInferable interface
   */
  async inferType(): Promise<InferTypeResult> {
    return this.inferDataType();
  }

  /**
   * Simplify the regex if possible
   *
   * @returns Simplified version with explanation, or null if not simplifiable
   */
  async simplify(): Promise<SimplifyResult | null> {
    const prompt = createSimplifyPrompt(this.regex.source, this.regex.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      canSimplify: boolean;
      simplified?: string;
      simplifiedFlags?: string;
      explanation: string;
      confidence: number;
    };

    if (!result.canSimplify || !result.simplified) {
      return null;
    }

    return {
      regex: new SemanticRegExp(
        new RegExp(result.simplified, result.simplifiedFlags ?? this.regex.flags),
        this.client
      ),
      explanation: result.explanation,
    };
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.regex.toString();
  }

  /**
   * String tag for type identification
   */
  readonly [Symbol.toStringTag] = 'SemanticRegExp';
}
