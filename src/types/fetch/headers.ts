/**
 * SemanticHeaders - LLM-enhanced Headers type with semantic understanding
 *
 * Wraps the native Headers with semantic operations including:
 * - Intelligent header comparison
 * - Validation for common issues
 * - Header suggestions
 * - Human-readable explanations
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import {
  HEADERS_SEMANTIC_EQUALS_SYSTEM,
  headersSemanticEqualsPrompt,
  HEADERS_VALIDATE_SYSTEM,
  headersValidatePrompt,
  HEADERS_SUGGEST_SYSTEM,
  headersSuggestPrompt,
  HEADERS_EXPLAIN_SYSTEM,
  headersExplainPrompt,
} from './prompts.ts';

/** Result of semantic headers equality */
export interface HeadersSemanticEqualsResult {
  equivalent: boolean;
  differences: string[];
}

/** Individual header issue */
export interface HeaderIssue {
  header: string;
  issue: string;
}

/** Result of headers validation */
export interface HeadersValidateResult {
  valid: boolean;
  issues: HeaderIssue[];
}

/** Suggested header */
export interface HeaderSuggestion {
  header: string;
  value: string;
  reason: string;
}

/** LLM client interface for dependency injection */
export interface HeadersLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticHeaders class
 * Wraps Headers with LLM-powered semantic operations
 */
export class SemanticHeaders {
  private readonly _headers: Headers;
  private readonly _llmClient: HeadersLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticHeaders instance
   * @param headers - The Headers to wrap
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    headers: Headers,
    llmClient?: HeadersLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._headers = new Headers(headers);
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create SemanticHeaders from header init object.
   *
   * @param init - Headers initialization value
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticHeaders instance
   */
  static from(
    init: Headers | Record<string, string> | [string, string][],
    llmClient?: HeadersLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticHeaders {
    const headers = init instanceof Headers ? new Headers(init) : new Headers(init);
    return new SemanticHeaders(headers, llmClient, llmConfig);
  }

  /**
   * Get headers as a plain object
   */
  private _getHeadersObject(): Record<string, string> {
    const obj: Record<string, string> = {};
    this._headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Check if two header sets are semantically equivalent.
   *
   * @param other - Headers to compare
   * @returns Equivalence result
   */
  async semanticallyEquals(other: Headers | SemanticHeaders): Promise<HeadersSemanticEqualsResult> {
    const otherHeaders = other instanceof SemanticHeaders ? other._headers : other;
    const otherObj: Record<string, string> = {};
    otherHeaders.forEach((value, key) => {
      otherObj[key] = value;
    });

    const messages: Message[] = [
      {
        role: 'user',
        content: headersSemanticEqualsPrompt(this._getHeadersObject(), otherObj),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: HEADERS_SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as HeadersSemanticEqualsResult;
  }

  /**
   * Validate headers for common issues.
   *
   * @returns Validation result
   */
  async validate(): Promise<HeadersValidateResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: headersValidatePrompt(this._getHeadersObject()),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: HEADERS_VALIDATE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as HeadersValidateResult;
  }

  /**
   * Suggest missing headers for the context.
   *
   * @param context - Request context (e.g., "API request", "file upload")
   * @returns Suggested headers
   */
  async suggest(context?: string): Promise<HeaderSuggestion[]> {
    const messages: Message[] = [
      {
        role: 'user',
        content: headersSuggestPrompt(this._getHeadersObject(), context),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: HEADERS_SUGGEST_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { suggestions: HeaderSuggestion[] };
    return result.suggestions;
  }

  /**
   * Explain what these headers do.
   *
   * @returns Human-readable explanation
   */
  async explain(): Promise<string> {
    const messages: Message[] = [
      {
        role: 'user',
        content: headersExplainPrompt(this._getHeadersObject()),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: HEADERS_EXPLAIN_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Get the underlying Headers object
   */
  valueOf(): Headers {
    return new Headers(this._headers);
  }

  // Expose native Headers methods

  /** Append a value to an existing header, or add the header if it doesn't exist */
  append(name: string, value: string): void {
    this._headers.append(name, value);
  }

  /** Delete a header */
  delete(name: string): void {
    this._headers.delete(name);
  }

  /** Get the value of a header */
  get(name: string): string | null {
    return this._headers.get(name);
  }

  /** Get all values of a header */
  getSetCookie(): string[] {
    return this._headers.getSetCookie();
  }

  /** Check if a header exists */
  has(name: string): boolean {
    return this._headers.has(name);
  }

  /** Set the value of a header */
  set(name: string, value: string): void {
    this._headers.set(name, value);
  }

  /** Iterate over all headers */
  forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void,
    thisArg?: unknown
  ): void {
    this._headers.forEach((value, key) => {
      callbackfn(value, key, this._headers);
    }, thisArg);
  }

  /** Get an iterator of header entries */
  entries(): IterableIterator<[string, string]> {
    return this._headers.entries();
  }

  /** Get an iterator of header keys */
  keys(): IterableIterator<string> {
    return this._headers.keys();
  }

  /** Get an iterator of header values */
  values(): IterableIterator<string> {
    return this._headers.values();
  }

  /** Make the object iterable */
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this._headers.entries();
  }

  /** Convert to plain object */
  toObject(): Record<string, string> {
    return this._getHeadersObject();
  }

  /** Convert to string representation */
  toString(): string {
    const entries = Object.entries(this._getHeadersObject());
    return `SemanticHeaders { ${entries.map(([k, v]) => `${k}: ${v}`).join(', ')} }`;
  }
}
