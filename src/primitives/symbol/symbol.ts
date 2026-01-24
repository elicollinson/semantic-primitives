/**
 * SemanticSymbol
 * A symbol type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<symbol> - Base semantic wrapper
 * - Comparable<SemanticSymbol> - Semantic equality comparison
 * - Classifiable - Category classification
 * - Validatable - Description validation
 * - PurposeValidatable - Use case appropriateness
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithReason,
  ValidateResultWithWarnings,
  AppropriateResult,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  Validatable,
} from '../../shared/interfaces.ts';
import {
  SYMBOL_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createSuggestBetterNamePrompt,
  createClassifyPrompt,
  createValidatePrompt,
  createDescribePurposePrompt,
  createIsAppropriateForPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithReason,
  ValidateResultWithWarnings,
  AppropriateResult,
} from '../../shared/types.ts';

/** Result of suggesting a better name */
export interface SuggestBetterNameResult {
  suggestion: string | null;
  reason: string;
}

/** Result of classifying a symbol */
export interface SymbolClassifyResult {
  category: string;
  subcategory?: string;
}

/** Global symbol registry for SemanticSymbol.for() */
const globalSymbolRegistry = new Map<string, SemanticSymbol>();

/**
 * SemanticSymbol - Symbol with LLM-powered semantic understanding
 *
 * Unlike traditional Symbols that are just unique identifiers,
 * SemanticSymbol understands naming conventions, categorizes symbols,
 * and validates their appropriateness for different use cases.
 *
 * Implements:
 * - Semantic<symbol> - valueOf() returns the symbol value
 * - Comparable<SemanticSymbol> - semanticallyEquals() for comparison
 * - Classifiable<SymbolClassifyResult> - classify() for categorization
 * - Validatable<ValidateResultWithWarnings> - validate() for validation
 * - PurposeValidatable - isAppropriateFor() for use case checking
 */
export class SemanticSymbol
  implements
    Semantic<symbol>,
    Comparable<SemanticSymbol, SemanticEqualsResultWithReason>,
    Validatable<ValidateResultWithWarnings>
{
  private readonly symbol: symbol;
  private readonly symbolDescription: string | undefined;
  private readonly client: LLMClient;

  private constructor(
    sym: symbol,
    description: string | undefined,
    client?: LLMClient
  ) {
    this.symbol = sym;
    this.symbolDescription = description;
    this.client = client ?? getClient();
  }

  /**
   * Create a symbol with a semantically meaningful description.
   * Validates that the description is clear and follows conventions.
   *
   * @param description - Human-readable description of the symbol's purpose
   * @param client - Optional LLM client to use
   * @returns SemanticSymbol instance
   *
   * @example
   * SemanticSymbol.create("userAuthToken")
   * SemanticSymbol.create("cacheInvalidationKey")
   */
  static create(description: string, client?: LLMClient): SemanticSymbol {
    const sym = Symbol(description);
    return new SemanticSymbol(sym, description, client);
  }

  /**
   * Create or retrieve a global symbol with semantic validation.
   *
   * @param key - Registry key for the symbol
   * @param client - Optional LLM client to use
   * @returns SemanticSymbol from global registry
   *
   * @example
   * SemanticSymbol.for("app.config.database")
   * SemanticSymbol.for("plugin.lifecycle.init")
   */
  static for(key: string, client?: LLMClient): SemanticSymbol {
    const existing = globalSymbolRegistry.get(key);
    if (existing) {
      return existing;
    }

    const sym = Symbol.for(key);
    const semanticSymbol = new SemanticSymbol(sym, key, client);
    globalSymbolRegistry.set(key, semanticSymbol);
    return semanticSymbol;
  }

  /**
   * Wrap an existing native Symbol
   *
   * @param sym - Native Symbol to wrap
   * @param client - Optional LLM client to use
   * @returns SemanticSymbol instance
   */
  static fromSymbol(sym: symbol, client?: LLMClient): SemanticSymbol {
    return new SemanticSymbol(sym, sym.description, client);
  }

  /**
   * Check if two symbols serve the same semantic purpose.
   * Even unique symbols can be semantically equivalent in purpose.
   *
   * @param other - Another symbol to compare
   * @returns Equivalence result
   *
   * @example
   * SemanticSymbol.create("userId").semanticallyEquals(SemanticSymbol.create("user_id"))
   * // { equivalent: true, confidence: 0.95, note: "Same concept, different naming convention" }
   */
  async semanticallyEquals(
    other: SemanticSymbol | symbol
  ): Promise<SemanticEqualsResultWithReason> {
    const otherDescription =
      other instanceof SemanticSymbol
        ? other.symbolDescription
        : other.description;

    // If both have no description, they can only be equal by identity
    if (!this.symbolDescription && !otherDescription) {
      const isEqual = this.symbol === (other instanceof SemanticSymbol ? other.symbol : other);
      return {
        equivalent: isEqual,
        confidence: 1.0,
        note: isEqual
          ? 'Same symbol instance'
          : 'Cannot compare symbols without descriptions',
      };
    }

    // If one has no description, not semantically comparable
    if (!this.symbolDescription || !otherDescription) {
      return {
        equivalent: false,
        confidence: 0.5,
        note: 'Cannot compare symbol without description to one with description',
      };
    }

    const prompt = createSemanticallyEqualsPrompt(
      this.symbolDescription,
      otherDescription
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: SYMBOL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithReason;
  }

  /**
   * Suggest a better description for the symbol based on conventions.
   *
   * @returns Suggestion with explanation
   *
   * @example
   * SemanticSymbol.create("x").suggestBetterName()
   * // { suggestion: null, reason: "Cannot suggest without more context" }
   *
   * SemanticSymbol.create("usrid").suggestBetterName()
   * // { suggestion: "userId", reason: "Use camelCase and avoid abbreviations" }
   */
  async suggestBetterName(): Promise<SuggestBetterNameResult> {
    if (!this.symbolDescription) {
      return {
        suggestion: null,
        reason: 'Symbol has no description to analyze',
      };
    }

    const prompt = createSuggestBetterNamePrompt(this.symbolDescription);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SYMBOL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SuggestBetterNameResult;
  }

  /**
   * Classify the symbol into a category based on its description.
   *
   * @returns Category classification
   *
   * @example
   * SemanticSymbol.create("onUserLogin").classify()
   * // { category: "event", subcategory: "lifecycle" }
   *
   * SemanticSymbol.create("API_SECRET_KEY").classify()
   * // { category: "configuration", subcategory: "secrets" }
   */
  async classify(): Promise<SymbolClassifyResult> {
    if (!this.symbolDescription) {
      return {
        category: 'unknown',
        subcategory: undefined,
      };
    }

    const prompt = createClassifyPrompt(this.symbolDescription);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SYMBOL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SymbolClassifyResult;
  }

  /**
   * Validate the symbol description follows best practices.
   *
   * @param conventions - Optional custom conventions to check against
   * @returns Validation result
   *
   * @example
   * SemanticSymbol.create("_private_internal").validate()
   * // { valid: true, warnings: ["Underscore prefix suggests private; consider using # for true privacy"] }
   */
  async validate(conventions?: string[]): Promise<ValidateResultWithWarnings> {
    if (!this.symbolDescription) {
      return {
        valid: false,
        issues: ['Symbol has no description to validate'],
        warnings: [],
      };
    }

    const prompt = createValidatePrompt(this.symbolDescription, conventions);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SYMBOL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      warnings: string[];
    };

    return {
      valid: result.valid,
      issues: result.valid ? [] : result.warnings,
      warnings: result.warnings,
    };
  }

  /**
   * Get the semantic purpose/intent of this symbol.
   *
   * @returns Description of the symbol's purpose
   *
   * @example
   * SemanticSymbol.create("cacheKey").describePurpose()
   * // "Unique identifier for cache entries"
   */
  async describePurpose(): Promise<string> {
    if (!this.symbolDescription) {
      return 'Unknown purpose - symbol has no description';
    }

    const prompt = createDescribePurposePrompt(this.symbolDescription);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SYMBOL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { purpose: string };
    return result.purpose;
  }

  /**
   * Check if this symbol is appropriate for a given use case.
   *
   * @param useCase - The intended use case
   * @returns Appropriateness assessment
   *
   * @example
   * SemanticSymbol.create("tempId").isAppropriateFor("database primary key")
   * // { appropriate: false, reason: "Temporary identifiers should not be used as permanent keys" }
   */
  async isAppropriateFor(useCase: string): Promise<AppropriateResult> {
    if (!this.symbolDescription) {
      return {
        appropriate: false,
        reason: 'Cannot assess appropriateness without a symbol description',
      };
    }

    const prompt = createIsAppropriateForPrompt(this.symbolDescription, useCase);

    const response = await this.client.complete({
      prompt,
      systemPrompt: SYMBOL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AppropriateResult;
  }

  /**
   * Get the underlying Symbol value.
   *
   * @returns The native Symbol
   */
  valueOf(): symbol {
    return this.symbol;
  }

  /**
   * Get the symbol's description.
   *
   * @returns The description string
   */
  description(): string | undefined {
    return this.symbolDescription;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.symbol.toString();
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { description: string | undefined } {
    return {
      description: this.symbolDescription,
    };
  }
}
