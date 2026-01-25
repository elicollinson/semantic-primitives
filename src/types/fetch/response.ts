/**
 * SemanticResponse - LLM-enhanced Response type with semantic understanding
 *
 * Wraps the native Response with semantic operations including:
 * - Intelligent response comparison
 * - Content analysis
 * - Response summarization
 * - Contract validation
 * - Error interpretation
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type { SemanticEqualsResult, ValidateResult } from '../../shared/types.ts';
import {
  RESPONSE_SEMANTIC_EQUALS_SYSTEM,
  responseSemanticEqualsPrompt,
  ANALYZE_RESPONSE_SYSTEM,
  analyzeResponsePrompt,
  SUMMARIZE_RESPONSE_SYSTEM,
  summarizeResponsePrompt,
  VALIDATE_CONTRACT_SYSTEM,
  validateContractPrompt,
  INTERPRET_ERROR_SYSTEM,
  interpretErrorPrompt,
} from './prompts.ts';

/** Result of response analysis */
export interface ResponseAnalysisResult {
  dataType: string;
  entityType?: string;
  count?: number;
  pagination?: { hasMore: boolean };
}

/** Contract for response validation */
export interface ResponseContract {
  status?: number[];
  schema?: string;
  requiredHeaders?: string[];
}

/** Result of error interpretation */
export interface ErrorInterpretationResult {
  category: string;
  message: string;
  suggestedAction: string;
  retryable: boolean;
}

/** LLM client interface for dependency injection */
export interface ResponseLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticResponse class
 * Wraps a Response with LLM-powered semantic operations
 */
export class SemanticResponse {
  private readonly _response: Response;
  private readonly _llmClient: ResponseLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;
  private _cachedBody?: string;

  /**
   * Create a SemanticResponse instance
   * @param response - The Response to wrap
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    response: Response,
    llmClient?: ResponseLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._response = response.clone();
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Wrap a Response with semantic capabilities.
   *
   * @param response - Response to wrap
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticResponse instance
   */
  static from(
    response: Response,
    llmClient?: ResponseLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticResponse {
    return new SemanticResponse(response, llmClient, llmConfig);
  }

  /**
   * Get headers as a plain object
   */
  private _getHeadersObject(): Record<string, string> {
    const headers: Record<string, string> = {};
    this._response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Get the response body as text (cached)
   */
  private async _getBodyText(): Promise<string> {
    if (this._cachedBody !== undefined) {
      return this._cachedBody;
    }

    try {
      const cloned = this._response.clone();
      this._cachedBody = await cloned.text();
      return this._cachedBody;
    } catch {
      this._cachedBody = '';
      return '';
    }
  }

  /**
   * Check if two responses are semantically equivalent.
   *
   * @param other - Response to compare
   * @returns Equivalence result
   */
  async semanticallyEquals(other: Response | SemanticResponse): Promise<SemanticEqualsResult> {
    const otherResponse = other instanceof SemanticResponse ? other._response : other;
    const otherHeaders: Record<string, string> = {};
    otherResponse.headers.forEach((value, key) => {
      otherHeaders[key] = value;
    });

    let otherBody: string;
    try {
      const cloned = otherResponse.clone();
      otherBody = await cloned.text();
    } catch {
      otherBody = '';
    }

    const thisBody = await this._getBodyText();

    const resp1 = {
      status: this._response.status,
      headers: this._getHeadersObject(),
      body: thisBody,
    };

    const resp2 = {
      status: otherResponse.status,
      headers: otherHeaders,
      body: otherBody,
    };

    const messages: Message[] = [
      {
        role: 'user',
        content: responseSemanticEqualsPrompt(resp1, resp2),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: RESPONSE_SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Analyze the response content.
   *
   * @returns Response analysis
   *
   * @example
   * response.analyze()
   * // {
   * //   dataType: "collection",
   * //   entityType: "User",
   * //   count: 25,
   * //   pagination: { hasMore: true }
   * // }
   */
  async analyze(): Promise<ResponseAnalysisResult> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: analyzeResponsePrompt(
          this._response.status,
          this._getHeadersObject(),
          body
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: ANALYZE_RESPONSE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ResponseAnalysisResult;
  }

  /**
   * Summarize the response body.
   *
   * @returns Human-readable summary
   */
  async summarize(): Promise<string> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: summarizeResponsePrompt(
          this._response.status,
          this._getHeadersObject(),
          body
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SUMMARIZE_RESPONSE_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { summary: string };
    return result.summary;
  }

  /**
   * Validate response against expected contract.
   *
   * @param contract - Expected response shape
   * @returns Validation result
   */
  async validateContract(contract: ResponseContract): Promise<ValidateResult> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: validateContractPrompt(
          this._response.status,
          this._getHeadersObject(),
          body,
          contract
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_CONTRACT_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Interpret error responses with context.
   *
   * @returns Error interpretation
   */
  async interpretError(): Promise<ErrorInterpretationResult> {
    const body = await this._getBodyText();

    const messages: Message[] = [
      {
        role: 'user',
        content: interpretErrorPrompt(
          this._response.status,
          this._getHeadersObject(),
          body
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: INTERPRET_ERROR_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ErrorInterpretationResult;
  }

  /**
   * Get the underlying Response object
   */
  valueOf(): Response {
    return this._response.clone();
  }

  // Expose native Response properties

  /** Get the response status code */
  get status(): number {
    return this._response.status;
  }

  /** Get the response status text */
  get statusText(): string {
    return this._response.statusText;
  }

  /** Get the response headers */
  get headers(): Headers {
    return this._response.headers;
  }

  /** Check if response is OK (status 200-299) */
  get ok(): boolean {
    return this._response.ok;
  }

  /** Check if response was redirected */
  get redirected(): boolean {
    return this._response.redirected;
  }

  /** Get the response type */
  get type(): string {
    return this._response.type;
  }

  /** Get the response URL */
  get url(): string {
    return this._response.url;
  }

  /** Get the response body (ReadableStream) */
  get body(): ReadableStream<Uint8Array> | null {
    return this._response.body;
  }

  /** Check if body has been used */
  get bodyUsed(): boolean {
    return this._response.bodyUsed;
  }

  /** Clone the response */
  clone(): SemanticResponse {
    return new SemanticResponse(this._response.clone(), this._llmClient, this._llmConfig);
  }

  /** Get body as ArrayBuffer */
  arrayBuffer(): Promise<ArrayBuffer> {
    return this._response.clone().arrayBuffer();
  }

  /** Get body as Blob */
  blob(): Promise<Blob> {
    return this._response.clone().blob();
  }

  /** Get body as FormData */
  formData(): Promise<FormData> {
    return this._response.clone().formData();
  }

  /** Get body as JSON */
  json(): Promise<unknown> {
    return this._response.clone().json();
  }

  /** Get body as text */
  text(): Promise<string> {
    return this._response.clone().text();
  }

  /** Convert to string representation */
  toString(): string {
    return `SemanticResponse { status: ${this.status}, url: ${this.url} }`;
  }
}
