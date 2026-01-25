/**
 * SemanticBlob - LLM-enhanced Blob type with semantic understanding
 *
 * Extends the native Blob with semantic operations including:
 * - Content type detection beyond MIME headers
 * - Semantic equivalence comparison
 * - Content analysis and validation
 * - Safety assessment
 *
 * Implements shared interfaces:
 * - Semantic<Blob> - Base semantic wrapper
 * - Comparable<Blob> - Semantic equality comparison
 * - Explainable - Human-readable explanations
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type { SemanticEqualsResult } from '../../shared/types.ts';
import type { Semantic, Comparable, Explainable } from '../../shared/interfaces.ts';
import {
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  DETECT_CONTENT_TYPE_SYSTEM,
  detectContentTypePrompt,
  ANALYZE_BLOB_SYSTEM,
  analyzeBlobPrompt,
  VALIDATE_FOR_SYSTEM,
  validateForPrompt,
  IS_SAFE_SYSTEM,
  isSafePrompt,
  EXPLAIN_BLOB_SYSTEM,
  explainBlobPrompt,
  GET_METADATA_SYSTEM,
  getMetadataPrompt,
} from './prompts.ts';

// Re-export shared types
export type { SemanticEqualsResult } from '../../shared/types.ts';

/** Extended semantic equals result with note */
export interface BlobSemanticEqualsResult extends SemanticEqualsResult {
  note?: string;
}

/** Result of content type detection */
export interface ContentTypeResult {
  type: string;
  declaredType: string;
  mismatch: boolean;
  confidence: number;
}

/** Result of blob analysis */
export interface AnalyzeResult {
  type: string;
  details: Record<string, unknown>;
}

/** Result of validation for a use case */
export interface ValidateForResult {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
}

/** Result of safety assessment */
export interface SafetyResult {
  safe: boolean;
  warnings: string[];
  scanned: string[];
}

/** LLM client interface for dependency injection */
export interface BlobLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * Convert ArrayBuffer to hex string for preview
 */
function bufferToHex(buffer: ArrayBuffer, maxBytes = 32): string {
  const bytes = new Uint8Array(buffer.slice(0, maxBytes));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

/**
 * SemanticBlob class
 * Wraps a Blob value with LLM-powered semantic operations
 *
 * Implements:
 * - Semantic<Blob> - valueOf() returns the Blob value
 * - Comparable<Blob> - semanticallyEquals() for comparison
 * - Explainable - explain() for human-readable explanations
 */
export class SemanticBlob
  implements
    Semantic<Blob>,
    Comparable<Blob, BlobSemanticEqualsResult>,
    Explainable
{
  protected readonly _value: Blob;
  protected readonly _llmClient: BlobLLMClientInterface;
  protected readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticBlob instance
   * @param value - The Blob value to wrap
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    value: Blob,
    llmClient?: BlobLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._value = value;
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create a SemanticBlob from existing Blob or data.
   *
   * @param data - Blob, ArrayBuffer, or string
   * @param options - Blob options
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticBlob instance
   *
   * @example
   * SemanticBlob.from(arrayBuffer, { type: "image/png" })
   */
  static from(
    data: Blob | ArrayBuffer | Uint8Array | string,
    options?: BlobPropertyBag,
    llmClient?: BlobLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticBlob {
    if (data instanceof Blob) {
      return new SemanticBlob(data, llmClient, llmConfig);
    }
    // Convert Uint8Array to ArrayBuffer slice for proper BlobPart compatibility
    const blobData = data instanceof Uint8Array
      ? (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer)
      : data;
    const blob = new Blob([blobData], options);
    return new SemanticBlob(blob, llmClient, llmConfig);
  }

  /**
   * Get a preview of the blob content as hex
   */
  protected async getPreview(maxBytes = 32): Promise<string> {
    const sliced = this._value.slice(0, maxBytes);
    const buffer = await sliced.arrayBuffer();
    return bufferToHex(buffer, maxBytes);
  }

  /**
   * Check if two blobs are semantically equivalent.
   *
   * @param other - Blob to compare
   * @returns Equivalence result
   *
   * @example
   * blob1.semanticallyEquals(blob2)
   * // { equivalent: true, note: "Same image, different compression", confidence: 0.9 }
   */
  async semanticallyEquals(
    other: Blob,
    _options?: Record<string, unknown>
  ): Promise<BlobSemanticEqualsResult> {
    const getOtherPreview = async (): Promise<string> => {
      const sliced = other.slice(0, 32);
      const buffer = await sliced.arrayBuffer();
      return bufferToHex(buffer);
    };

    const [thisPreview, otherPreview] = await Promise.all([
      this.getPreview(),
      getOtherPreview(),
    ]);

    const blob1Info = {
      type: this._value.type || 'application/octet-stream',
      size: this._value.size,
      preview: thisPreview,
    };

    const blob2Info = {
      type: other.type || 'application/octet-stream',
      size: other.size,
      preview: otherPreview,
    };

    const messages: Message[] = [
      {
        role: 'user',
        content: semanticEqualsPrompt(blob1Info, blob2Info),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as BlobSemanticEqualsResult;
  }

  /**
   * Detect the actual content type (not just MIME header).
   *
   * @returns Content detection result
   *
   * @example
   * blob.detectContentType()
   * // { type: "image/png", declaredType: "application/octet-stream", mismatch: true }
   */
  async detectContentType(): Promise<ContentTypeResult> {
    const preview = await this.getPreview(16);

    const messages: Message[] = [
      {
        role: 'user',
        content: detectContentTypePrompt(
          this._value.type,
          preview,
          this._value.size
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DETECT_CONTENT_TYPE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ContentTypeResult;
  }

  /**
   * Analyze the blob contents.
   *
   * @returns Content analysis
   *
   * @example
   * imageBlob.analyze()
   * // { type: "image", details: { format: "PNG", hasTransparency: true } }
   */
  async analyze(): Promise<AnalyzeResult> {
    const preview = await this.getPreview(64);

    const messages: Message[] = [
      {
        role: 'user',
        content: analyzeBlobPrompt(
          this._value.type || 'application/octet-stream',
          this._value.size,
          preview
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: ANALYZE_BLOB_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as AnalyzeResult;
  }

  /**
   * Validate the blob for a specific use case.
   *
   * @param useCase - Intended use
   * @returns Validation result
   *
   * @example
   * blob.validateFor("profile picture")
   * // { valid: false, reason: "Image dimensions too small (min 200x200)" }
   */
  async validateFor(useCase: string): Promise<ValidateForResult> {
    const preview = await this.getPreview(32);

    const messages: Message[] = [
      {
        role: 'user',
        content: validateForPrompt(
          useCase,
          this._value.type || 'application/octet-stream',
          this._value.size,
          preview
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_FOR_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ValidateForResult;
  }

  /**
   * Check if the blob is safe (no malicious content).
   *
   * @returns Safety assessment
   *
   * @example
   * blob.isSafe()
   * // { safe: true, warnings: [], scanned: ["magic-bytes", "extension-match"] }
   */
  async isSafe(): Promise<SafetyResult> {
    const preview = await this.getPreview(32);
    const detectedResult = await this.detectContentType();

    const messages: Message[] = [
      {
        role: 'user',
        content: isSafePrompt(
          this._value.type || 'application/octet-stream',
          detectedResult.type,
          this._value.size,
          preview
        ),
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
   * Explain what this blob contains.
   *
   * @param _context - Optional context (unused, for interface compatibility)
   * @returns Human-readable explanation
   */
  async explain(_context?: string): Promise<string> {
    const preview = await this.getPreview(32);

    const messages: Message[] = [
      {
        role: 'user',
        content: explainBlobPrompt(
          this._value.type || 'application/octet-stream',
          this._value.size,
          preview
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: EXPLAIN_BLOB_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Get a summary of blob metadata.
   *
   * @returns Metadata summary
   */
  async getMetadata(): Promise<Record<string, unknown>> {
    const preview = await this.getPreview(32);

    const messages: Message[] = [
      {
        role: 'user',
        content: getMetadataPrompt(
          this._value.type || 'application/octet-stream',
          this._value.size,
          preview
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: GET_METADATA_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as Record<string, unknown>;
  }

  /**
   * Get the raw Blob value
   * @returns The underlying Blob
   */
  valueOf(): Blob {
    return this._value;
  }

  // Expose native Blob properties

  /**
   * Get the MIME type
   */
  get type(): string {
    return this._value.type;
  }

  /**
   * Get the size in bytes
   */
  get size(): number {
    return this._value.size;
  }

  /**
   * Slice the blob
   */
  slice(start?: number, end?: number, contentType?: string): Blob {
    return this._value.slice(start, end, contentType);
  }

  /**
   * Get the blob as ArrayBuffer
   */
  arrayBuffer(): Promise<ArrayBuffer> {
    return this._value.arrayBuffer();
  }

  /**
   * Get the blob as text
   */
  text(): Promise<string> {
    return this._value.text();
  }

  /**
   * Get a stream of the blob
   */
  stream(): ReadableStream<Uint8Array> {
    return this._value.stream() as ReadableStream<Uint8Array>;
  }
}
