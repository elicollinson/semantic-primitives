/**
 * SemanticURL
 * A URL type with LLM-powered semantic understanding
 *
 * Extends native JavaScript URL with semantic capabilities including:
 * - Intelligent URL parsing
 * - Semantic equality comparison
 * - URL classification
 * - Safety assessment
 * - Query parameter analysis
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ClassifyResult,
  SafetyResult,
  RelatedSuggestion,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
import {
  URL_SYSTEM_PROMPT,
  createFromInputPrompt,
  createSemanticallyEqualsPrompt,
  createClassifyPrompt,
  createValidateForPrompt,
  createExplainPrompt,
  createExtractInfoPrompt,
  createIsSafePrompt,
  createCanonicalPrompt,
  createVariationsPrompt,
  createParseQueryPrompt,
  createSuggestRelatedPrompt,
  createMatchesPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResult,
  ClassifyResult,
  SafetyResult,
  RelatedSuggestion,
} from '../../shared/types.ts';

/** Extended semantic equals result with differences */
export interface URLSemanticEqualsResult extends SemanticEqualsResult {
  differences: string[];
}

/** URL classification result */
export interface URLClassifyResult extends ClassifyResult {
  type: string;
  resource?: string;
  action?: string;
}

/** Validation result for URL */
export interface URLValidateResult {
  valid: boolean;
  reason?: string;
  warnings: string[];
}

/** Parsed query parameter */
export interface ParsedQueryParam {
  value: string;
  meaning: string;
}

/**
 * SemanticURL - URL with LLM-powered semantic understanding
 *
 * Unlike traditional URL parsing, semantic URLs understand
 * the purpose and meaning of URL components.
 */
export class SemanticURL implements Semantic<URL> {
  private readonly url: URL;
  private readonly client: LLMClient;

  private constructor(url: URL, client?: LLMClient) {
    this.url = url;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticURL from a URL string
   */
  static fromString(urlString: string, base?: string, client?: LLMClient): SemanticURL {
    const url = base ? new URL(urlString, base) : new URL(urlString);
    return new SemanticURL(url, client);
  }

  /**
   * Create a SemanticURL from a URL object
   */
  static fromURL(url: URL, client?: LLMClient): SemanticURL {
    return new SemanticURL(url, client);
  }

  /**
   * Create a SemanticURL from flexible input
   */
  static async from(input: string, base?: string, client?: LLMClient): Promise<SemanticURL> {
    const llmClient = client ?? getClient();

    // Try to parse directly first
    try {
      const url = base ? new URL(input, base) : new URL(input);
      return new SemanticURL(url, llmClient);
    } catch {
      // Use LLM to parse flexible input
      const prompt = createFromInputPrompt(input, base);

      const response = await llmClient.complete({
        prompt,
        systemPrompt: URL_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      const result = JSON.parse(response.content) as { url: string; confidence: number };
      return new SemanticURL(new URL(result.url), llmClient);
    }
  }

  /**
   * Get the underlying URL
   */
  valueOf(): URL {
    return new URL(this.url.href);
  }

  // ===========================================================================
  // STANDARD URL PROPERTIES
  // ===========================================================================

  get href(): string {
    return this.url.href;
  }

  get origin(): string {
    return this.url.origin;
  }

  get protocol(): string {
    return this.url.protocol;
  }

  get hostname(): string {
    return this.url.hostname;
  }

  get host(): string {
    return this.url.host;
  }

  get port(): string {
    return this.url.port;
  }

  get pathname(): string {
    return this.url.pathname;
  }

  get search(): string {
    return this.url.search;
  }

  get searchParams(): URLSearchParams {
    return this.url.searchParams;
  }

  get hash(): string {
    return this.url.hash;
  }

  get username(): string {
    return this.url.username;
  }

  get password(): string {
    return this.url.password;
  }

  // ===========================================================================
  // SEMANTIC OPERATIONS
  // ===========================================================================

  /**
   * Check if two URLs are semantically equivalent
   */
  async semanticallyEquals(other: string | URL | SemanticURL): Promise<URLSemanticEqualsResult> {
    const otherUrl = other instanceof SemanticURL
      ? other.href
      : other instanceof URL
        ? other.href
        : other;

    const prompt = createSemanticallyEqualsPrompt(this.url.href, otherUrl);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as URLSemanticEqualsResult;
  }

  /**
   * Classify the URL by type and purpose
   */
  async classify(): Promise<URLClassifyResult> {
    const prompt = createClassifyPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as URLClassifyResult & { confidence: number };
    return {
      type: result.type,
      category: result.category,
      resource: result.resource,
      action: result.action,
      confidence: result.confidence,
    };
  }

  /**
   * Validate the URL for a specific purpose
   */
  async validateFor(purpose: string): Promise<URLValidateResult> {
    const prompt = createValidateForPrompt(this.url.href, purpose);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as URLValidateResult & { confidence: number };
    return {
      valid: result.valid,
      reason: result.reason,
      warnings: result.warnings,
    };
  }

  /**
   * Explain what this URL points to
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string; confidence: number };
    return result.explanation;
  }

  /**
   * Extract semantic information from URL components
   */
  async extractInfo(): Promise<Record<string, string | undefined>> {
    const prompt = createExtractInfoPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      info: Record<string, string | undefined>;
      confidence: number;
    };
    return result.info;
  }

  /**
   * Check if the URL is safe to visit/request
   */
  async isSafe(): Promise<SafetyResult> {
    const prompt = createIsSafePrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as SafetyResult & { confidence: number };
    return {
      safe: result.safe,
      reason: result.reason,
      severity: result.severity,
    };
  }

  /**
   * Suggest the canonical form of this URL
   */
  async canonical(): Promise<SemanticURL> {
    const prompt = createCanonicalPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { canonical: string; confidence: number };
    return SemanticURL.fromString(result.canonical, undefined, this.client);
  }

  /**
   * Generate variations of this URL
   */
  async variations(): Promise<string[]> {
    const prompt = createVariationsPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as { variations: string[]; confidence: number };
    return result.variations;
  }

  /**
   * Parse query parameters with semantic understanding
   */
  async parseQuery(): Promise<Record<string, ParsedQueryParam>> {
    if (!this.url.search) {
      return {};
    }

    const prompt = createParseQueryPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      parameters: Record<string, ParsedQueryParam>;
      confidence: number;
    };
    return result.parameters;
  }

  /**
   * Suggest related URLs based on patterns
   */
  async suggestRelated(): Promise<RelatedSuggestion[]> {
    const prompt = createSuggestRelatedPrompt(this.url.href);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: RelatedSuggestion[];
      confidence: number;
    };
    return result.suggestions;
  }

  /**
   * Check if URL matches a pattern description
   */
  async matches(pattern: string): Promise<boolean> {
    const prompt = createMatchesPrompt(this.url.href, pattern);

    const response = await this.client.complete({
      prompt,
      systemPrompt: URL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { matches: boolean; confidence: number };
    return result.matches;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.url.href;
  }

  /**
   * Convert to JSON
   */
  toJSON(): string {
    return this.url.href;
  }
}
