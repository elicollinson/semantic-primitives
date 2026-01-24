/**
 * SemanticSymbol - LLM-enhanced symbol type with semantic understanding
 *
 * Extends the native JavaScript Symbol with semantic operations including:
 * - Semantic equivalence comparison
 * - Name suggestion based on conventions
 * - Category classification
 * - Validation against best practices
 * - Purpose description
 * - Appropriateness assessment
 *
 * Implements shared interfaces:
 * - Semantic<symbol> - Base semantic wrapper
 * - Comparable<SemanticSymbol | symbol> - Semantic equality comparison
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type {
  SemanticEqualsResultWithReason,
  ValidateResultWithWarnings,
  AppropriateResult,
  Suggestion,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  SUGGEST_NAME_SYSTEM,
  suggestBetterNamePrompt,
  CLASSIFY_SYSTEM,
  classifyPrompt,
  VALIDATE_SYSTEM,
  validatePrompt,
  DESCRIBE_PURPOSE_SYSTEM,
  describePurposePrompt,
  IS_APPROPRIATE_SYSTEM,
  isAppropriateForPrompt,
} from './symbol.prompts.ts';

// Re-export shared types
export type {
  SemanticEqualsResultWithReason,
  ValidateResultWithWarnings,
  AppropriateResult,
  Suggestion,
} from '../../shared/types.ts';

/** LLM client interface for dependency injection */
export interface LLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/** Result type for classification without confidence */
export interface SymbolClassifyResult {
  category: string;
  subcategory?: string;
}

/** Global registry for SemanticSymbol.for() */
const globalSymbolRegistry = new Map<string, SemanticSymbol>();

/**
 * SemanticSymbol class
 * Wraps a Symbol with LLM-powered semantic operations
 *
 * Implements:
 * - Semantic<symbol> - valueOf() returns the symbol
 * - Comparable<SemanticSymbol | symbol> - semanticallyEquals() for comparison
 */
export class SemanticSymbol implements Semantic<symbol>, Comparable<SemanticSymbol | symbol> {
  private readonly _symbol: symbol;
  private readonly _description: string | undefined;
  private readonly _llmClient: LLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Private constructor - use static factory methods to create instances
   */
  private constructor(
    symbolOrDescription: symbol | string,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    if (typeof symbolOrDescription === 'symbol') {
      this._symbol = symbolOrDescription;
      this._description = symbolOrDescription.description;
    } else {
      this._symbol = Symbol(symbolOrDescription);
      this._description = symbolOrDescription;
    }
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create a SemanticSymbol with a semantically meaningful description.
   *
   * @param description - Human-readable description of the symbol's purpose
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticSymbol instance
   *
   * @example
   * SemanticSymbol.create("userAuthToken")
   * SemanticSymbol.create("cacheInvalidationKey")
   */
  static create(
    description: string,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticSymbol {
    return new SemanticSymbol(description, llmClient, llmConfig);
  }

  /**
   * Create or retrieve a global symbol with semantic validation.
   * Uses the global symbol registry to ensure the same key always returns the same SemanticSymbol.
   *
   * @param key - Registry key for the symbol
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticSymbol from global registry
   *
   * @example
   * SemanticSymbol.for("app.config.database")
   * SemanticSymbol.for("plugin.lifecycle.init")
   */
  static for(
    key: string,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticSymbol {
    // Check if already in our registry
    const existing = globalSymbolRegistry.get(key);
    if (existing) {
      return existing;
    }

    // Create using Symbol.for for global symbol registry
    const globalSymbol = Symbol.for(key);
    const semanticSymbol = new SemanticSymbol(globalSymbol, llmClient, llmConfig);
    globalSymbolRegistry.set(key, semanticSymbol);
    return semanticSymbol;
  }

  /**
   * Wrap an existing symbol in a SemanticSymbol.
   *
   * @param symbol - The native symbol to wrap
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticSymbol instance
   */
  static from(
    symbol: symbol,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticSymbol {
    return new SemanticSymbol(symbol, llmClient, llmConfig);
  }

  /**
   * Check if two symbols serve the same semantic purpose.
   * Even unique symbols can be semantically equivalent in purpose.
   *
   * @param other - Another symbol to compare
   * @returns Equivalence result with confidence and note
   *
   * @example
   * SemanticSymbol.create("userId").semanticallyEquals(SemanticSymbol.create("user_id"))
   * // { equivalent: true, confidence: 0.95, note: "Same concept, different naming convention" }
   */
  async semanticallyEquals(
    other: SemanticSymbol | symbol
  ): Promise<SemanticEqualsResultWithReason> {
    const otherDesc =
      other instanceof SemanticSymbol ? other.description() : other.description;

    const thisDesc = this._description || '';
    const otherDescStr = otherDesc || '';

    // If both have no description, they can only be equal if they're the same symbol
    if (!thisDesc && !otherDescStr) {
      const areSame =
        other instanceof SemanticSymbol
          ? this._symbol === other.valueOf()
          : this._symbol === other;
      return {
        equivalent: areSame,
        confidence: 1.0,
        note: areSame
          ? 'Same symbol instance'
          : 'Different symbols with no descriptions to compare',
      };
    }

    const messages: Message[] = [
      { role: 'user', content: semanticEqualsPrompt(thisDesc, otherDescStr) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
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
  async suggestBetterName(): Promise<Suggestion> {
    const desc = this._description || '';

    if (!desc) {
      return {
        suggestion: undefined,
        reason: 'Cannot suggest a name for a symbol without a description',
      };
    }

    const messages: Message[] = [
      { role: 'user', content: suggestBetterNamePrompt(desc) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SUGGEST_NAME_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as {
      suggestion: string | null;
      reason: string;
    };

    return {
      suggestion: result.suggestion ?? undefined,
      reason: result.reason,
    };
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
    const desc = this._description || '';

    if (!desc) {
      return {
        category: 'unknown',
        subcategory: undefined,
      };
    }

    const messages: Message[] = [
      { role: 'user', content: classifyPrompt(desc) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: CLASSIFY_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as SymbolClassifyResult;
  }

  /**
   * Validate the symbol description follows best practices.
   *
   * @param conventions - Optional custom conventions to check against
   * @returns Validation result with warnings
   *
   * @example
   * SemanticSymbol.create("_private_internal").validate()
   * // { valid: true, warnings: ["Underscore prefix suggests private; consider using # for true privacy"] }
   */
  async validate(conventions?: string[]): Promise<ValidateResultWithWarnings> {
    const desc = this._description || '';

    if (!desc) {
      return {
        valid: false,
        issues: ['Symbol has no description'],
        warnings: ['Symbols should have meaningful descriptions'],
      };
    }

    const messages: Message[] = [
      { role: 'user', content: validatePrompt(desc, conventions) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_SYSTEM,
      ...this._llmConfig,
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
    const desc = this._description || '';

    if (!desc) {
      return 'Unknown purpose - symbol has no description';
    }

    const messages: Message[] = [
      { role: 'user', content: describePurposePrompt(desc) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DESCRIBE_PURPOSE_SYSTEM,
      ...this._llmConfig,
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
    const desc = this._description || '';

    if (!desc) {
      return {
        appropriate: false,
        reason: 'Cannot assess appropriateness for a symbol without a description',
      };
    }

    const messages: Message[] = [
      { role: 'user', content: isAppropriateForPrompt(desc, useCase) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: IS_APPROPRIATE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as AppropriateResult;
  }

  /**
   * Get the underlying Symbol value.
   * @returns The native Symbol
   */
  valueOf(): symbol {
    return this._symbol;
  }

  /**
   * Get the symbol's description.
   * @returns The description string or undefined
   */
  description(): string | undefined {
    return this._description;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._symbol.toString();
  }

  /**
   * Convert to JSON - symbols cannot be serialized, returns description
   */
  toJSON(): string | undefined {
    return this._description;
  }
}
