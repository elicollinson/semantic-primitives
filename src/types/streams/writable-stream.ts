/**
 * SemanticWritableStream
 * A WritableStream wrapper with LLM-powered semantic understanding
 *
 * Enables intelligent validation and statistics tracking for written data.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import { STREAM_SYSTEM_PROMPT, createWriteValidationPrompt } from './prompts.ts';

/** Statistics about written data */
export interface WriteStats {
  chunksWritten: number;
  bytesWritten: number;
  errorCount: number;
}

/**
 * Shared state across all wrappers of the same underlying stream.
 * This ensures statistics are tracked correctly and writer locks are managed.
 */
interface SharedStreamState<T> {
  writer: WritableStreamDefaultWriter<T> | null;
  stats: WriteStats;
}

/**
 * SemanticWritableStream - WritableStream with LLM-powered semantic understanding
 *
 * Wraps a native WritableStream and adds intelligent validation
 * and statistics tracking capabilities.
 *
 * Note: When using withValidation(), the original instance becomes unusable.
 * Only the returned wrapper should be used for subsequent operations.
 */
export class SemanticWritableStream<T> {
  readonly [Symbol.toStringTag] = 'SemanticWritableStream';

  private readonly _stream: WritableStream<T>;
  private readonly _client: LLMClient;
  private readonly _validationRules: string[];
  private readonly _sharedState: SharedStreamState<T>;
  private _transferred = false;

  private constructor(
    stream: WritableStream<T>,
    client?: LLMClient,
    validationRules: string[] = [],
    sharedState?: SharedStreamState<T>
  ) {
    this._stream = stream;
    this._client = client ?? getClient();
    this._validationRules = validationRules;
    this._sharedState = sharedState ?? {
      writer: null,
      stats: { chunksWritten: 0, bytesWritten: 0, errorCount: 0 },
    };
  }

  /**
   * Wrap a WritableStream with semantic capabilities.
   *
   * @param stream - WritableStream to wrap
   * @param client - Optional LLM client
   * @returns SemanticWritableStream instance
   *
   * @example
   * SemanticWritableStream.from(new WritableStream({ write(chunk) { ... } }))
   */
  static from<T>(
    stream: WritableStream<T>,
    client?: LLMClient
  ): SemanticWritableStream<T> {
    if (stream instanceof SemanticWritableStream) {
      return stream as unknown as SemanticWritableStream<T>;
    }
    return new SemanticWritableStream(stream, client);
  }

  /**
   * Get the underlying WritableStream.
   */
  get stream(): WritableStream<T> {
    return this._stream;
  }

  /**
   * Check if this instance has been transferred to a validation wrapper.
   */
  get isTransferred(): boolean {
    return this._transferred;
  }

  /**
   * Throws if this instance has been transferred.
   */
  private assertNotTransferred(): void {
    if (this._transferred) {
      throw new Error(
        'This SemanticWritableStream instance has been transferred via withValidation(). ' +
        'Use the returned wrapper instead.'
      );
    }
  }

  /**
   * Get a writer for the underlying stream.
   */
  getWriter(): WritableStreamDefaultWriter<T> {
    this.assertNotTransferred();
    if (!this._sharedState.writer) {
      this._sharedState.writer = this._stream.getWriter();
    }
    return this._sharedState.writer;
  }

  /**
   * Write a chunk to the stream.
   *
   * @param chunk - Data to write
   */
  async write(chunk: T): Promise<void> {
    this.assertNotTransferred();

    // Validate if rules are set
    if (this._validationRules.length > 0) {
      const isValid = await this.validateChunk(chunk);
      if (!isValid) {
        this._sharedState.stats.errorCount++;
        throw new Error('Chunk failed validation');
      }
    }

    try {
      const writer = this.getWriter();
      await writer.write(chunk);
      this._sharedState.stats.chunksWritten++;
      this._sharedState.stats.bytesWritten += this.getChunkSize(chunk);
    } catch (error) {
      this._sharedState.stats.errorCount++;
      throw error;
    }
  }

  /**
   * Close the stream.
   */
  async close(): Promise<void> {
    this.assertNotTransferred();
    const writer = this.getWriter();
    await writer.close();
  }

  /**
   * Abort the stream.
   */
  async abort(reason?: unknown): Promise<void> {
    this.assertNotTransferred();
    const writer = this.getWriter();
    await writer.abort(reason);
  }

  /**
   * Release the writer lock.
   */
  releaseLock(): void {
    if (this._sharedState.writer) {
      this._sharedState.writer.releaseLock();
      this._sharedState.writer = null;
    }
  }

  /**
   * Create a new SemanticWritableStream with validation rules.
   *
   * IMPORTANT: After calling this method, the current instance becomes unusable.
   * Only the returned wrapper should be used for subsequent operations.
   * Statistics are shared between all wrappers.
   *
   * @param rules - Validation rules
   * @returns Validating writable stream
   */
  withValidation(rules: string[]): SemanticWritableStream<T> {
    this.assertNotTransferred();

    // Mark this instance as transferred
    this._transferred = true;

    // Create new wrapper sharing the same state
    return new SemanticWritableStream(
      this._stream,
      this._client,
      [...this._validationRules, ...rules],
      this._sharedState
    );
  }

  /**
   * Get statistics about written data.
   * Statistics are shared across all validation wrappers of the same stream.
   *
   * @returns Write statistics
   */
  getStats(): Promise<WriteStats> {
    return Promise.resolve({
      chunksWritten: this._sharedState.stats.chunksWritten,
      bytesWritten: this._sharedState.stats.bytesWritten,
      errorCount: this._sharedState.stats.errorCount,
    });
  }

  /**
   * Validate a chunk against the validation rules.
   */
  private async validateChunk(chunk: T): Promise<boolean> {
    if (this._validationRules.length === 0) {
      return true;
    }

    const dataStr = this.stringifyChunk(chunk);
    const prompt = createWriteValidationPrompt(dataStr, this._validationRules);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      const result = JSON.parse(response.content) as {
        valid: boolean;
        issues: string[];
      };

      return result.valid;
    } catch {
      // On LLM error, fallback to basic validation
      return this.basicValidation(chunk);
    }
  }

  /**
   * Basic validation without LLM.
   */
  private basicValidation(chunk: T): boolean {
    // Basic null/undefined check
    if (chunk === null || chunk === undefined) {
      return !this._validationRules.some((r) =>
        r.toLowerCase().includes('not null') ||
        r.toLowerCase().includes('required')
      );
    }
    return true;
  }

  /**
   * Get the byte size of a chunk.
   */
  private getChunkSize(chunk: T): number {
    if (chunk instanceof Uint8Array) {
      return chunk.byteLength;
    }
    if (typeof chunk === 'string') {
      return new TextEncoder().encode(chunk).length;
    }
    return new TextEncoder().encode(JSON.stringify(chunk)).length;
  }

  /**
   * Convert a chunk to string for validation.
   */
  private stringifyChunk(chunk: T): string {
    if (chunk instanceof Uint8Array) {
      return new TextDecoder().decode(chunk);
    }
    if (typeof chunk === 'string') {
      return chunk;
    }
    return JSON.stringify(chunk);
  }
}
