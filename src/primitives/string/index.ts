/**
 * SemanticString - LLM-enhanced string with semantic understanding
 *
 * Extends native string capabilities with AI-powered semantic operations
 * including meaning-aware comparisons, classification, and analysis.
 *
 * Implements shared interfaces:
 * - Semantic<string> - Base semantic wrapper
 * - Comparable<string | SemanticString> - Semantic equality comparison
 * - Validatable - Rule-based validation
 * - Classifiable - Category classification
 * - Summarizable - Text summarization
 * - SensitivityDetectable - Sensitive data detection
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ClassifyResult,
  ValidateResult,
  DetectIntentResult,
  DetectLanguageResult,
  SensitiveResult,
  Correction,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  Validatable,
  Classifiable,
  Summarizable,
  SensitivityDetectable,
} from '../../shared/interfaces.ts';
import {
  semanticallyEqualsPrompt,
  classifyPrompt,
  extractPrompt,
  validatePrompt,
  detectIntentPrompt,
  detectLanguagePrompt,
  containsSensitivePrompt,
  similarityPrompt,
  summarizePrompt,
  suggestCorrectionsPrompt,
} from './string.prompts.ts';

// Re-export shared types
export type {
  SemanticEqualsResult,
  ClassifyResult,
  ValidateResult,
  DetectIntentResult,
  DetectLanguageResult,
  Correction,
} from '../../shared/types.ts';

/** Result of sensitive information detection (alias for SensitiveResult) */
export interface ContainsSensitiveResult {
  hasSensitive: boolean;
  types: string[];
}

/**
 * SemanticString class - wraps a string with semantic capabilities
 *
 * Implements:
 * - Semantic<string> - valueOf() returns the string value
 * - Comparable<string | SemanticString> - semanticallyEquals() for comparison
 * - Validatable - validate() for rule-based validation
 * - Classifiable - classify() for categorization
 * - Summarizable - summarize() for text summarization
 * - SensitivityDetectable - containsSensitive() for PII detection
 *
 * @example
 * ```ts
 * const str = SemanticString.from("The meeting is cancelled");
 * const result = await str.semanticallyEquals("Meeting has been called off");
 * // { equivalent: true, confidence: 0.92 }
 * ```
 */
export class SemanticString
  implements
    Semantic<string>,
    Comparable<string | SemanticString>,
    Validatable,
    Classifiable,
    Summarizable,
    SensitivityDetectable
{
  private readonly value: string;
  private readonly client: LLMClient;

  private constructor(value: string, client?: LLMClient) {
    this.value = value;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticString from a regular string
   */
  static from(value: string, client?: LLMClient): SemanticString {
    return new SemanticString(value, client);
  }

  /**
   * Get the underlying string value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the underlying string value
   */
  valueOf(): string {
    return this.value;
  }

  /**
   * Get the length of the string
   */
  get length(): number {
    return this.value.length;
  }

  /**
   * Check if two strings are semantically equivalent (same meaning).
   * Understands synonyms, paraphrases, and different phrasings.
   *
   * @param other - String to compare with
   * @param options - Comparison options
   * @returns Equivalence result with confidence
   *
   * @example
   * ```ts
   * const str = SemanticString.from("purchase");
   * await str.semanticallyEquals("buy");
   * // { equivalent: true, confidence: 0.95 }
   * ```
   */
  async semanticallyEquals(
    other: string | SemanticString,
    options?: { threshold?: number; context?: string }
  ): Promise<SemanticEqualsResult> {
    const otherValue = other instanceof SemanticString ? other.toString() : other;
    const prompt = semanticallyEqualsPrompt(this.value, otherValue, options?.context);

    const response = await this.client.complete({ prompt, temperature: 0.1 });
    const result = JSON.parse(response.content) as SemanticEqualsResult;

    if (options?.threshold !== undefined) {
      result.equivalent = result.confidence >= options.threshold;
    }

    return result;
  }

  /**
   * Classify the string into one of the provided categories.
   * Uses semantic understanding to match meaning, not just keywords.
   *
   * @param categories - Array of category names to classify into
   * @param context - Optional context to improve classification
   * @returns Best matching category with confidence
   *
   * @example
   * ```ts
   * const str = SemanticString.from("I can't log in to my account");
   * await str.classify(["billing", "technical", "account", "general"]);
   * // { category: "account", confidence: 0.89 }
   * ```
   */
  async classify(categories: string[], context?: string): Promise<ClassifyResult> {
    const prompt = classifyPrompt(this.value, categories, context);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    return JSON.parse(response.content) as ClassifyResult;
  }

  /**
   * Extract specific types of information from the string.
   *
   * @param types - Types of entities to extract (e.g., "email", "date", "name")
   * @returns Object mapping types to extracted values
   *
   * @example
   * ```ts
   * const str = SemanticString.from("Contact John at john@example.com by Friday");
   * await str.extract(["email", "name", "date"]);
   * // { email: "john@example.com", name: "John", date: "Friday" }
   * ```
   */
  async extract(types: string[]): Promise<Record<string, string | string[] | null>> {
    const prompt = extractPrompt(this.value, types);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    return JSON.parse(response.content) as Record<string, string | string[] | null>;
  }

  /**
   * Validate the string against semantic rules (not just regex).
   *
   * @param rules - Natural language validation rules
   * @returns Validation result with issues if any
   *
   * @example
   * ```ts
   * const str = SemanticString.from("Buy now!!!");
   * await str.validate(["should be professional", "no excessive punctuation"]);
   * // { valid: false, issues: ["excessive punctuation (!!!)"] }
   * ```
   */
  async validate(rules: string[]): Promise<ValidateResult> {
    const prompt = validatePrompt(this.value, rules);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Determine the likely intent or purpose of the string.
   *
   * @returns Intent classification with confidence
   *
   * @example
   * ```ts
   * const str = SemanticString.from("How do I reset my password?");
   * await str.detectIntent();
   * // { intent: "question", subtype: "how-to", topic: "password-reset", confidence: 0.94 }
   * ```
   */
  async detectIntent(): Promise<DetectIntentResult> {
    const prompt = detectIntentPrompt(this.value);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    return JSON.parse(response.content) as DetectIntentResult;
  }

  /**
   * Detect the language of the string.
   *
   * @returns Detected language code with confidence
   *
   * @example
   * ```ts
   * const str = SemanticString.from("Bonjour le monde");
   * await str.detectLanguage();
   * // { language: "fr", confidence: 0.98 }
   * ```
   */
  async detectLanguage(): Promise<DetectLanguageResult> {
    const prompt = detectLanguagePrompt(this.value);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    return JSON.parse(response.content) as DetectLanguageResult;
  }

  /**
   * Check if the string contains sensitive information (PII, secrets, etc.).
   *
   * @returns Detection result with types of sensitive data found
   *
   * @example
   * ```ts
   * const str = SemanticString.from("My SSN is 123-45-6789");
   * await str.containsSensitive();
   * // { hasSensitive: true, types: ["ssn"] }
   * ```
   */
  async containsSensitive(): Promise<ContainsSensitiveResult> {
    const prompt = containsSensitivePrompt(this.value);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    return JSON.parse(response.content) as ContainsSensitiveResult;
  }

  /**
   * Get a semantic similarity score with another string (0-1).
   *
   * @param other - String to compare with
   * @returns Similarity score from 0 (unrelated) to 1 (identical meaning)
   *
   * @example
   * ```ts
   * const str = SemanticString.from("happy");
   * await str.similarity("joyful"); // 0.85
   * await str.similarity("sad"); // 0.15
   * ```
   */
  async similarity(other: string | SemanticString): Promise<number> {
    const otherValue = other instanceof SemanticString ? other.toString() : other;
    const prompt = similarityPrompt(this.value, otherValue);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    const result = JSON.parse(response.content) as { similarity: number };
    return result.similarity;
  }

  /**
   * Summarize the string to a target length while preserving meaning.
   *
   * @param maxLength - Maximum character length for summary
   * @returns Summarized string
   *
   * @example
   * ```ts
   * const str = SemanticString.from("The quick brown fox jumps over the lazy dog. This is a common pangram used for testing.");
   * await str.summarize(50);
   * // "A pangram about a fox jumping over a lazy dog."
   * ```
   */
  async summarize(maxLength: number): Promise<string> {
    const prompt = summarizePrompt(this.value, maxLength);
    const response = await this.client.complete({ prompt, temperature: 0.3 });
    const result = JSON.parse(response.content) as { summary: string };
    return result.summary;
  }

  /**
   * Suggest corrections for spelling, grammar, or style issues.
   *
   * @returns Array of suggested corrections
   *
   * @example
   * ```ts
   * const str = SemanticString.from("Their going to the store tommorow");
   * await str.suggestCorrections();
   * // [{ original: "Their", suggestion: "They're" }, { original: "tommorow", suggestion: "tomorrow" }]
   * ```
   */
  async suggestCorrections(): Promise<Correction[]> {
    const prompt = suggestCorrectionsPrompt(this.value);
    const response = await this.client.complete({ prompt, temperature: 0.1 });
    const result = JSON.parse(response.content) as { corrections: Correction[] };
    return result.corrections;
  }
}
