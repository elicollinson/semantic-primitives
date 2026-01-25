/**
 * SemanticRequest - LLM-enhanced Request type with semantic understanding
 *
 * Wraps the native Request with semantic operations including:
 * - Intelligent request comparison
 * - Intent analysis
 * - Validation against semantic rules
 * - Human-readable explanations
 * - Security assessment
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type { SemanticEqualsResult, ValidateResult } from '../../shared/types.ts';
import {
  REQUEST_SEMANTIC_EQUALS_SYSTEM,
  requestSemanticEqualsPrompt,
  ANALYZE_INTENT_SYSTEM,
  analyzeIntentPrompt,
  REQUEST_VALIDATE_SYSTEM,
  requestValidatePrompt,
  REQUEST_EXPLAIN_SYSTEM,
  requestExplainPrompt,
  REQUEST_SECURITY_SYSTEM,
  requestSecurityPrompt,
} from './prompts.ts';

/** Extended semantic equals result with note */
export interface RequestSemanticEqualsResult extends SemanticEqualsResult {
  note?: string;
}

/** Filter criteria from request analysis */
export interface RequestFilter {
  field: string;
  value: unknown;
}

/** Result of request intent analysis */
export interface RequestIntentResult {
  intent: string;
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  filters?: RequestFilter[];
}

/** Result of request security validation */
export interface RequestSecurityResult {
  safe: boolean;
  issues: string[];
  warnings: string[];
}

/** LLM client interface for dependency injection */
export interface RequestLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticRequest class
 * Wraps a Request with LLM-powered semantic operations
 */
export class SemanticRequest {
  private readonly _request: Request;
  private readonly _llmClient: RequestLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;
  private _cachedBody?: string;

  /**
   * Create a SemanticRequest instance
   * @param request - The Request to wrap
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    request: Request,
    llmClient?: RequestLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._request = request.clone() as Request;
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create a SemanticRequest from URL or request options.
   *
   * @param input - URL string or Request object
   * @param init - Optional RequestInit options
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticRequest instance
   *
   * @example
   * SemanticRequest.from("/api/users?role=admin", { method: "GET" })
   * SemanticRequest.from(existingRequest)
   */
  static from(
    input: string | URL | Request,
    init?: RequestInit,
    llmClient?: RequestLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticRequest {
    let request: Request;
    if (input instanceof Request) {
      request = input.clone() as Request;
    } else if (input instanceof URL) {
      request = new Request(input.toString(), init);
    } else {
      request = new Request(input, init);
    }
    return new SemanticRequest(request, llmClient, llmConfig);
  }

  /**
   * Get headers as a plain object
   */
  private _getHeadersObject(): Record<string, string> {
    const headers: Record<string, string> = {};
    this._request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Get the request body as text (cached)
   */
  private async _getBodyText(): Promise<string | undefined> {
    if (this._cachedBody !== undefined) {
      return this._cachedBody || undefined;
    }

    try {
      const cloned = this._request.clone();
      this._cachedBody = await cloned.text();
      return this._cachedBody || undefined;
    } catch {
      this._cachedBody = '';
      return undefined;
    }
  }

  /**
   * Check if two requests are semantically equivalent.
   *
   * @param other - Request to compare
   * @returns Equivalence result
   *
   * @example
   * req1.semanticallyEquals(req2)
   * // { equivalent: true, note: "Same params, different order", confidence: 0.95 }
   */
  async semanticallyEquals(other: Request | SemanticRequest): Promise<RequestSemanticEqualsResult> {
    const otherRequest = other instanceof SemanticRequest ? other._request : other;
    const otherHeaders: Record<string, string> = {};
    otherRequest.headers.forEach((value, key) => {
      otherHeaders[key] = value;
    });

    let otherBody: string | undefined;
    try {
      const cloned = otherRequest.clone();
      otherBody = await cloned.text() || undefined;
    } catch {
      otherBody = undefined;
    }

    const thisBody = await this._getBodyText();

    const req1 = {
      method: this._request.method,
      url: this._request.url,
      headers: this._getHeadersObject(),
      body: thisBody,
    };

    const req2 = {
      method: otherRequest.method,
      url: otherRequest.url,
      headers: otherHeaders,
      body: otherBody,
    };

    const messages: Message[] = [
      {
        role: 'user',
        content: requestSemanticEqualsPrompt(req1, req2),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: REQUEST_SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as RequestSemanticEqualsResult;
  }

  /**
   * Analyze the intent of this request.
   *
   * @returns Request intent analysis
   *
   * @example
   * request.analyzeIntent()
   * // {
   * //   intent: "fetch paginated users",
   * //   operation: "READ",
   * //   resource: "users",
   * //   filters: [{ field: "role", value: "admin" }]
   * // }
   */
  async analyzeIntent(): Promise<RequestIntentResult> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: analyzeIntentPrompt(
          this._request.method,
          this._request.url,
          this._getHeadersObject(),
          body
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: ANALYZE_INTENT_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as RequestIntentResult;
  }

  /**
   * Validate the request against semantic rules.
   *
   * @param rules - Validation rules (optional, uses defaults if not provided)
   * @returns Validation result
   *
   * @example
   * request.validate(["must include authentication", "body must be valid JSON"])
   */
  async validate(rules?: string[]): Promise<ValidateResult> {
    const body = await this._getBodyText();
    const validationRules = rules || [
      'Request should have appropriate Content-Type header if body is present',
      'URL should be well-formed',
      'HTTP method should match the intended operation',
    ];

    const messages: Message[] = [
      {
        role: 'user',
        content: requestValidatePrompt(
          this._request.method,
          this._request.url,
          this._getHeadersObject(),
          body,
          validationRules
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: REQUEST_VALIDATE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Explain what this request does.
   *
   * @param audience - Target audience (defaults to "technical")
   * @returns Human-readable explanation
   *
   * @example
   * request.explain("non-technical")
   * // "Fetching the list of admin users"
   */
  async explain(audience: 'technical' | 'non-technical' = 'technical'): Promise<string> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: requestExplainPrompt(
          this._request.method,
          this._request.url,
          this._getHeadersObject(),
          body,
          audience
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: REQUEST_EXPLAIN_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Check if the request is safe (no security issues).
   *
   * @returns Security assessment
   *
   * @example
   * request.validateSecurity()
   * // { safe: true, issues: [], warnings: ["Consider using HTTPS"] }
   */
  async validateSecurity(): Promise<RequestSecurityResult> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: requestSecurityPrompt(
          this._request.method,
          this._request.url,
          this._getHeadersObject(),
          body
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: REQUEST_SECURITY_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as RequestSecurityResult;
  }

  /**
   * Get the underlying Request object
   */
  valueOf(): Request {
    return this._request.clone() as Request;
  }

  // Expose native Request properties

  /** Get the request method */
  get method(): string {
    return this._request.method;
  }

  /** Get the request URL */
  get url(): string {
    return this._request.url;
  }

  /** Get the request headers */
  get headers(): Headers {
    return this._request.headers;
  }

  /** Get the request body (ReadableStream) */
  get body(): ReadableStream<Uint8Array> | null {
    return this._request.body;
  }

  /** Check if body has been used */
  get bodyUsed(): boolean {
    return this._request.bodyUsed;
  }

  /** Get the request cache mode */
  get cache(): string {
    return this._request.cache;
  }

  /** Get the request credentials mode */
  get credentials(): string {
    return this._request.credentials;
  }

  /** Get the request destination */
  get destination(): string {
    return this._request.destination;
  }

  /** Get the request integrity */
  get integrity(): string {
    return this._request.integrity;
  }

  /** Get the request keepalive flag */
  get keepalive(): boolean {
    return this._request.keepalive;
  }

  /** Get the request mode */
  get mode(): string {
    return this._request.mode;
  }

  /** Get the request redirect mode */
  get redirect(): string {
    return this._request.redirect;
  }

  /** Get the request referrer */
  get referrer(): string {
    return this._request.referrer;
  }

  /** Get the request referrer policy */
  get referrerPolicy(): string {
    return this._request.referrerPolicy;
  }

  /** Get the abort signal */
  get signal(): AbortSignal {
    return this._request.signal;
  }

  /** Clone the request */
  clone(): SemanticRequest {
    return new SemanticRequest(this._request.clone() as Request, this._llmClient, this._llmConfig);
  }

  /** Get body as ArrayBuffer */
  arrayBuffer(): Promise<ArrayBuffer> {
    return this._request.clone().arrayBuffer();
  }

  /** Get body as Blob */
  blob(): Promise<Blob> {
    return this._request.clone().blob();
  }

  /** Get body as FormData */
  formData(): Promise<FormData> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return this._request.clone().formData() as Promise<FormData>;
  }

  /** Get body as JSON */
  json(): Promise<unknown> {
    return this._request.clone().json();
  }

  /** Get body as text */
  text(): Promise<string> {
    return this._request.clone().text();
  }

  /** Convert to string representation */
  toString(): string {
    return `SemanticRequest { method: ${this.method}, url: ${this.url} }`;
  }
}
