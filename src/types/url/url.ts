/**
 * SemanticURL - LLM-enhanced URL type with semantic understanding
 *
 * Extends the native JavaScript URL with semantic operations including:
 * - Intelligent URL parsing and normalization
 * - Context-aware equality comparison
 * - URL classification by type and purpose
 * - Purpose-based validation
 * - Safety assessment
 * - Related URL suggestions
 *
 * Implements shared interfaces:
 * - Semantic<URL> - Base semantic wrapper
 * - Comparable<URL | string> - Semantic equality comparison
 * - Classifiable - URL type classification
 * - Explainable - Human-readable explanations
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type {
  SemanticEqualsResult,
  ClassifyResult,
  SafetyResult,
  RelatedSuggestion,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  Classifiable,
  Explainable,
} from '../../shared/interfaces.ts';
import {
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  CLASSIFY_URL_SYSTEM,
  classifyUrlPrompt,
  VALIDATE_FOR_SYSTEM,
  validateForPrompt,
  EXPLAIN_URL_SYSTEM,
  explainUrlPrompt,
  EXTRACT_INFO_SYSTEM,
  extractInfoPrompt,
  IS_SAFE_SYSTEM,
  isSafePrompt,
  CANONICAL_URL_SYSTEM,
  canonicalUrlPrompt,
  VARIATIONS_SYSTEM,
  variationsPrompt,
  PARSE_QUERY_SYSTEM,
  parseQueryPrompt,
  SUGGEST_RELATED_SYSTEM,
  suggestRelatedPrompt,
  MATCHES_PATTERN_SYSTEM,
  matchesPatternPrompt,
} from './prompts.ts';

// Re-export shared types
export type {
  SemanticEqualsResult,
  ClassifyResult,
  SafetyResult,
  RelatedSuggestion,
} from '../../shared/types.ts';

/** Extended semantic equals result with differences list */
export interface URLSemanticEqualsResult extends SemanticEqualsResult {
  differences: string[];
}

/** Extended classify result for URLs */
export interface URLClassifyResult extends ClassifyResult {
  type: string;
  resource?: string;
  action?: string;
}

/** Validation result for purpose-based validation */
export interface URLValidateForResult {
  valid: boolean;
  reason?: string;
  warnings: string[];
}

/** Result of query parameter parsing */
export interface ParsedQueryParam {
  value: string;
  meaning: string;
}

/** LLM client interface for dependency injection */
export interface URLLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticURL class
 * Wraps a URL value with LLM-powered semantic operations
 *
 * Implements:
 * - Semantic<URL> - valueOf() returns the URL value
 * - Comparable<URL | string> - semanticallyEquals() for comparison
 * - Classifiable - classify() for URL type classification
 * - Explainable - explain() for human-readable explanations
 *
 * Also provides (as async methods):
 * - validateFor() for purpose-based validation
 * - isSafe() for safety checks
 * - suggestRelated() for related URL suggestions
 */
export class SemanticURL
  implements
    Semantic<URL>,
    Comparable<URL | string, URLSemanticEqualsResult>,
    Classifiable<URLClassifyResult>,
    Explainable
{
  private readonly _value: URL;
  private readonly _llmClient: URLLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticURL instance
   * @param value - The URL value to wrap
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    value: URL,
    llmClient?: URLLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._value = new URL(value.href);
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create a SemanticURL from a string, handling various formats.
   *
   * @param input - URL string, potentially incomplete or malformed
   * @param base - Optional base URL
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticURL instance
   *
   * @example
   * SemanticURL.from("example.com") // Adds https://
   * SemanticURL.from("/path", "https://example.com")
   */
  static from(
    input: string,
    base?: string,
    llmClient?: URLLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticURL {
    let urlString = input.trim();

    // Handle incomplete URLs - add protocol if missing
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(urlString)) {
      // Check if it starts with // (protocol-relative)
      if (urlString.startsWith('//')) {
        urlString = 'https:' + urlString;
      } else if (urlString.startsWith('/')) {
        // Relative path - needs base
        if (!base) {
          throw new Error('Relative URL requires a base URL');
        }
      } else {
        // Assume https for domain-like strings
        urlString = 'https://' + urlString;
      }
    }

    const url = base ? new URL(urlString, base) : new URL(urlString);
    return new SemanticURL(url, llmClient, llmConfig);
  }

  /**
   * Check if two URLs are semantically equivalent.
   * Considers trailing slashes, default ports, www prefix, etc.
   *
   * @param other - URL to compare
   * @returns Equivalence result with differences
   *
   * @example
   * url.semanticallyEquals("https://www.example.com/")
   * // { equivalent: true, differences: ["www prefix", "trailing slash"], confidence: 0.95 }
   */
  async semanticallyEquals(
    other: string | URL,
    _options?: Record<string, unknown>
  ): Promise<URLSemanticEqualsResult> {
    const otherUrl = other instanceof URL ? other.href : other;

    const messages: Message[] = [
      {
        role: 'user',
        content: semanticEqualsPrompt(this._value.href, otherUrl),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as URLSemanticEqualsResult;
  }

  /**
   * Classify the URL by type and purpose.
   *
   * @returns URL classification
   *
   * @example
   * url.classify()
   * // { type: "api-endpoint", category: "rest-api", resource: "users", action: "list", confidence: 0.9 }
   */
  async classify(): Promise<URLClassifyResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: classifyUrlPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: CLASSIFY_URL_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as URLClassifyResult;
  }

  /**
   * Validate the URL for a specific purpose.
   *
   * @param purpose - Intended purpose of the URL
   * @returns Validation result
   *
   * @example
   * url.validateFor("public website")
   * // { valid: true, warnings: ["Uses HTTP instead of HTTPS"] }
   */
  async validateFor(purpose: string): Promise<URLValidateForResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: validateForPrompt(this._value.href, purpose),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_FOR_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as URLValidateForResult;
  }

  /**
   * Explain what this URL points to.
   *
   * @param _context - Optional context for explanation (unused, for interface compatibility)
   * @returns Human-readable description
   *
   * @example
   * SemanticURL.from("https://api.github.com/users/octocat").explain()
   * // "GitHub API endpoint to fetch the user profile for 'octocat'"
   */
  async explain(_context?: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'user',
        content: explainUrlPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: EXPLAIN_URL_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Extract semantic information from URL components.
   *
   * @returns Extracted information
   *
   * @example
   * url.extractInfo()
   * // { service: "GitHub", resourceType: "user-profile", identifier: "octocat" }
   */
  async extractInfo(): Promise<Record<string, string | undefined>> {
    const messages: Message[] = [
      {
        role: 'user',
        content: extractInfoPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: EXTRACT_INFO_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as Record<string, string | undefined>;
  }

  /**
   * Check if the URL is safe to visit/request.
   *
   * @param _context - Optional context (unused, for interface compatibility)
   * @returns Safety assessment
   *
   * @example
   * url.isSafe()
   * // { safe: false, reason: "Known phishing domain", severity: "high" }
   */
  async isSafe(_context?: string): Promise<SafetyResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: isSafePrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: IS_SAFE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as SafetyResult;
  }

  /**
   * Suggest the canonical form of this URL.
   *
   * @returns Canonical URL
   *
   * @example
   * SemanticURL.from("HTTP://EXAMPLE.COM:80/path/").canonical()
   * // SemanticURL for "https://example.com/path"
   */
  async canonical(): Promise<SemanticURL> {
    const messages: Message[] = [
      {
        role: 'user',
        content: canonicalUrlPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: CANONICAL_URL_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { canonical: string; changes: string[] };
    return SemanticURL.from(result.canonical, undefined, this._llmClient, this._llmConfig);
  }

  /**
   * Generate variations of this URL.
   *
   * @returns URL variations
   *
   * @example
   * url.variations()
   * // ["https://example.com", "https://www.example.com", "http://example.com"]
   */
  async variations(): Promise<string[]> {
    const messages: Message[] = [
      {
        role: 'user',
        content: variationsPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VARIATIONS_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { variations: string[] };
    return result.variations;
  }

  /**
   * Parse query parameters with semantic understanding.
   *
   * @returns Parsed parameters with meanings
   *
   * @example
   * SemanticURL.from("https://api.example.com/search?q=test&limit=10").parseQuery()
   * // { q: { value: "test", meaning: "search query" }, limit: { value: "10", meaning: "results limit" } }
   */
  async parseQuery(): Promise<Record<string, ParsedQueryParam>> {
    const messages: Message[] = [
      {
        role: 'user',
        content: parseQueryPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: PARSE_QUERY_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as Record<string, ParsedQueryParam>;
  }

  /**
   * Suggest related URLs based on patterns.
   *
   * @returns Related URLs
   *
   * @example
   * url.suggestRelated()
   * // [{ url: "/users/octocat/repos", reason: "User's repositories" }]
   */
  async suggestRelated(): Promise<RelatedSuggestion[]> {
    const messages: Message[] = [
      {
        role: 'user',
        content: suggestRelatedPrompt(this._value.href),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SUGGEST_RELATED_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { suggestions: { url: string; reason: string }[] };
    return result.suggestions.map(s => ({ url: s.url, reason: s.reason }));
  }

  /**
   * Check if URL matches a pattern description.
   *
   * @param pattern - Pattern description
   * @returns Match result
   *
   * @example
   * url.matches("API endpoint")
   * url.matches("image URL")
   */
  async matches(pattern: string): Promise<boolean> {
    const messages: Message[] = [
      {
        role: 'user',
        content: matchesPatternPrompt(this._value.href, pattern),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: MATCHES_PATTERN_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { matches: boolean; confidence: number; explanation: string };
    return result.matches;
  }

  /**
   * Get the raw URL value
   * @returns The underlying URL
   */
  valueOf(): URL {
    return new URL(this._value.href);
  }

  // Expose native URL properties

  /**
   * Get the full URL string
   */
  get href(): string {
    return this._value.href;
  }

  /**
   * Get the protocol (e.g., "https:")
   */
  get protocol(): string {
    return this._value.protocol;
  }

  /**
   * Get the hostname
   */
  get hostname(): string {
    return this._value.hostname;
  }

  /**
   * Get the host (hostname:port)
   */
  get host(): string {
    return this._value.host;
  }

  /**
   * Get the port
   */
  get port(): string {
    return this._value.port;
  }

  /**
   * Get the pathname
   */
  get pathname(): string {
    return this._value.pathname;
  }

  /**
   * Get the search string (query string including ?)
   */
  get search(): string {
    return this._value.search;
  }

  /**
   * Get the search params
   */
  get searchParams(): URLSearchParams {
    return this._value.searchParams;
  }

  /**
   * Get the hash (fragment including #)
   */
  get hash(): string {
    return this._value.hash;
  }

  /**
   * Get the origin
   */
  get origin(): string {
    return this._value.origin;
  }

  /**
   * Get the username
   */
  get username(): string {
    return this._value.username;
  }

  /**
   * Get the password
   */
  get password(): string {
    return this._value.password;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this._value.href;
  }

  /**
   * Convert to JSON
   */
  toJSON(): string {
    return this._value.href;
  }
}
