/**
 * SemanticRegExp
 * A RegExp type with LLM-powered semantic understanding
 *
 * Extends native JavaScript RegExp with semantic capabilities including:
 * - Natural language pattern creation
 * - Regex explanation
 * - Test with explanation
 * - Improvement suggestions
 * - Test case generation
 * - Validation and simplification
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
import type { Semantic } from '../../shared/interfaces.ts';
import {
  REGEXP_SYSTEM_PROMPT,
  createFromDescriptionPrompt,
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

export type {
  SemanticEqualsResult,
  ImprovementSuggestion,
  RegExpTestCases,
  ValidateResultWithWarnings,
  RelatedSuggestion,
  InferTypeResult,
} from '../../shared/types.ts';

/** Result of test with explanation */
export interface TestWithExplanationResult {
  matches: boolean;
  reason: string;
  matchedPart?: string;
}

/** Result of regex simplification */
export interface SimplifyResult {
  regex: SemanticRegExp;
  explanation: string;
}

/** Extended related suggestion for regex */
export interface RegExpRelatedSuggestion extends RelatedSuggestion {
  regex?: string;
}

/** Extended improvement suggestion for regex */
export interface RegExpImprovementSuggestion extends ImprovementSuggestion {
  improved?: string;
}

/**
 * SemanticRegExp - RegExp with LLM-powered semantic understanding
 *
 * Unlike traditional regular expressions, semantic regexes can be
 * created from natural language and explained in human terms.
 */
export class SemanticRegExp implements Semantic<RegExp> {
  private readonly regexp: RegExp;
  private readonly client: LLMClient;

  private constructor(pattern: string | RegExp, flags?: string, client?: LLMClient) {
    if (pattern instanceof RegExp) {
      this.regexp = new RegExp(pattern.source, flags ?? pattern.flags);
    } else {
      this.regexp = new RegExp(pattern, flags);
    }
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticRegExp from a pattern or existing RegExp
   */
  static fromPattern(
    pattern: string | RegExp,
    flags?: string,
    client?: LLMClient
  ): SemanticRegExp {
    return new SemanticRegExp(pattern, flags, client);
  }

  /**
   * Create a regex from natural language description
   */
  static async from(
    description: string,
    options?: { flags?: string; strict?: boolean },
    client?: LLMClient
  ): Promise<SemanticRegExp> {
    const llmClient = client ?? getClient();
    const prompt = createFromDescriptionPrompt(description, options);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      pattern: string;
      flags: string;
      confidence: number;
    };

    return new SemanticRegExp(result.pattern, result.flags, llmClient);
  }

  /**
   * Get the underlying RegExp
   */
  valueOf(): RegExp {
    return new RegExp(this.regexp.source, this.regexp.flags);
  }

  /**
   * Get the pattern source
   */
  get source(): string {
    return this.regexp.source;
  }

  /**
   * Get the flags
   */
  get flags(): string {
    return this.regexp.flags;
  }

  /**
   * Get the global flag
   */
  get global(): boolean {
    return this.regexp.global;
  }

  /**
   * Get the ignoreCase flag
   */
  get ignoreCase(): boolean {
    return this.regexp.ignoreCase;
  }

  /**
   * Get the multiline flag
   */
  get multiline(): boolean {
    return this.regexp.multiline;
  }

  // ===========================================================================
  // STANDARD REGEXP METHODS
  // ===========================================================================

  /**
   * Test if input matches
   */
  test(input: string): boolean {
    return this.regexp.test(input);
  }

  /**
   * Execute and return matches
   */
  exec(input: string): RegExpExecArray | null {
    return this.regexp.exec(input);
  }

  // ===========================================================================
  // SEMANTIC OPERATIONS
  // ===========================================================================

  /**
   * Check if two regexes match the same patterns semantically
   */
  async semanticallyEquals(
    other: RegExp | SemanticRegExp,
    testStrings?: string[]
  ): Promise<SemanticEqualsResult> {
    const otherRegexp = other instanceof SemanticRegExp ? other.valueOf() : other;
    const prompt = createSemanticallyEqualsPrompt(
      this.regexp.source,
      this.regexp.flags,
      otherRegexp.source,
      otherRegexp.flags,
      testStrings
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Explain what the regex matches in plain language
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string; confidence: number };
    return result.explanation;
  }

  /**
   * Test a string and explain why it matched or didn't
   */
  async testWithExplanation(input: string): Promise<TestWithExplanationResult> {
    const prompt = createTestWithExplanationPrompt(
      this.regexp.source,
      this.regexp.flags,
      input
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as TestWithExplanationResult & { confidence: number };
    return {
      matches: result.matches,
      reason: result.reason,
      matchedPart: result.matchedPart,
    };
  }

  /**
   * Suggest improvements to the regex
   */
  async suggestImprovements(): Promise<RegExpImprovementSuggestion[]> {
    const prompt = createSuggestImprovementsPrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: RegExpImprovementSuggestion[];
      confidence: number;
    };
    return result.suggestions;
  }

  /**
   * Generate test cases for the regex
   */
  async generateTestCases(): Promise<RegExpTestCases> {
    const prompt = createGenerateTestCasesPrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as RegExpTestCases & { confidence: number };
    return {
      shouldMatch: result.shouldMatch,
      shouldNotMatch: result.shouldNotMatch,
    };
  }

  /**
   * Validate the regex for common issues
   */
  async validate(): Promise<ValidateResultWithWarnings> {
    const prompt = createValidatePrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as ValidateResultWithWarnings & { confidence: number };
    return {
      valid: result.valid,
      warnings: result.warnings,
      issues: result.issues,
    };
  }

  /**
   * Convert to a more readable format
   */
  async toReadable(): Promise<string> {
    const prompt = createToReadablePrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { readable: string; confidence: number };
    return result.readable;
  }

  /**
   * Find similar patterns that might also be needed
   */
  async suggestRelated(): Promise<RegExpRelatedSuggestion[]> {
    const prompt = createSuggestRelatedPrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: RegExpRelatedSuggestion[];
      confidence: number;
    };
    return result.suggestions;
  }

  /**
   * Detect what type of data this regex is designed to match
   */
  async inferDataType(): Promise<InferTypeResult> {
    const prompt = createInferDataTypePrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferTypeResult;
  }

  /**
   * Simplify the regex if possible
   */
  async simplify(): Promise<SimplifyResult | null> {
    const prompt = createSimplifyPrompt(this.regexp.source, this.regexp.flags);

    const response = await this.client.complete({
      prompt,
      systemPrompt: REGEXP_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      canSimplify: boolean;
      simplified: string | null;
      explanation: string;
      confidence: number;
    };

    if (!result.canSimplify || !result.simplified) {
      return null;
    }

    return {
      regex: new SemanticRegExp(result.simplified, this.regexp.flags, this.client),
      explanation: result.explanation,
    };
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.regexp.toString();
  }

  /**
   * Convert to JSON
   */
  toJSON(): { source: string; flags: string } {
    return {
      source: this.regexp.source,
      flags: this.regexp.flags,
    };
  }
}
