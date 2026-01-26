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
 * SemanticWritableStream - WritableStream with LLM-powered semantic understanding
 *
 * Wraps a native WritableStream and adds intelligent validation
 * and statistics tracking capabilities.
 */
export class SemanticWritableStream<T> {
  readonly [Symbol.toStringTag] = 'SemanticWritableStream';

  private readonly _stream: WritableStream<T>;
  private readonly _client: LLMClient;
  private readonly _validationRules: string[];
  private _chunksWritten = 0;
  private _bytesWritten = 0;
  private _errorCount = 0;
  private _writer: WritableStreamDefaultWriter<T> | null = null;

  private constructor(
    stream: WritableStream<T>,
    client?: LLMClient,
    validationRules: string[] = []
  ) {
    this._stream = stream;
    this._client = client ?? getClient();
    this._validationRules = validationRules;
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
   * Get a writer for the underlying stream.
   */
  getWriter(): WritableStreamDefaultWriter<T> {
    if (!this._writer) {
      this._writer = this._stream.getWriter();
    }
    return this._writer;
  }

  /**
   * Write a chunk to the stream.
   *
   * @param chunk - Data to write
   */
  async write(chunk: T): Promise<void> {
    // Validate if rules are set
    if (this._validationRules.length > 0) {
      const isValid = await this.validateChunk(chunk);
      if (!isValid) {
        this._errorCount++;
        throw new Error('Chunk failed validation');
      }
    }

    try {
      const writer = this.getWriter();
      await writer.write(chunk);
      this._chunksWritten++;
      this._bytesWritten += this.getChunkSize(chunk);
    } catch (error) {
      this._errorCount++;
      throw error;
    }
  }

  /**
   * Close the stream.
   */
  async close(): Promise<void> {
    const writer = this.getWriter();
    await writer.close();
  }

  /**
   * Abort the stream.
   */
  async abort(reason?: unknown): Promise<void> {
    const writer = this.getWriter();
    await writer.abort(reason);
  }

  /**
   * Release the writer lock.
   */
  releaseLock(): void {
    if (this._writer) {
      this._writer.releaseLock();
      this._writer = null;
    }
  }

  /**
   * Create a new SemanticWritableStream with validation rules.
   *
   * @param rules - Validation rules
   * @returns Validating writable stream
   */
  withValidation(rules: string[]): SemanticWritableStream<T> {
    return new SemanticWritableStream(
      this._stream,
      this._client,
      [...this._validationRules, ...rules]
    );
  }

  /**
   * Get statistics about written data.
   *
   * @returns Write statistics
   */
  getStats(): Promise<WriteStats> {
    return Promise.resolve({
      chunksWritten: this._chunksWritten,
      bytesWritten: this._bytesWritten,
      errorCount: this._errorCount,
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
