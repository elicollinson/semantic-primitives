/**
 * SemanticStream Types
 * Stream types with LLM-powered semantic understanding
 *
 * Provides:
 * - SemanticReadableStream - Readable stream with semantic analysis
 * - SemanticWritableStream - Writable stream with validation
 * - SemanticTransformStream - Transform stream from natural language
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type { SemanticEqualsResult } from '../../shared/types.ts';
import {
  STREAM_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createDetectContentTypePrompt,
  createSummarizePrompt,
  createSemanticFilterPrompt,
  createSemanticTransformPrompt,
  createValidatePrompt,
  createExplainPrompt,
  createDetectPatternsPrompt,
  createInferSchemaPrompt,
  createExplainTransformPrompt,
} from './prompts.ts';

// =============================================================================
// TYPES
// =============================================================================

/** Result of content type detection */
export interface ContentTypeResult {
  type: string;
  format?: string;
  confidence: number;
}

/** Result of pattern detection in streams */
export interface StreamPatternResult {
  patterns: string[];
  anomalies: { index: number; reason: string }[];
  confidence: number;
}

/** Result of schema inference */
export interface StreamSchemaResult {
  type: string;
  properties?: Record<string, string>;
  confidence: number;
}

/** Validation result for stream chunks */
export interface StreamValidationResult<T> {
  data: T;
  valid: boolean;
  issues: string[];
}

/** Write statistics for writable streams */
export interface WriteStats {
  chunksWritten: number;
  bytesWritten: number;
  errorCount: number;
}

/** Transform explanation result */
export interface TransformExplanation {
  explanation: string;
  inputType: string;
  outputType: string;
  confidence: number;
}

// =============================================================================
// SEMANTIC READABLE STREAM
// =============================================================================

/**
 * SemanticReadableStream - ReadableStream with LLM-powered semantic understanding
 *
 * Wraps a ReadableStream to provide semantic analysis, filtering, transformation,
 * and content understanding capabilities.
 *
 * @template T - The type of chunks in the stream
 */
export class SemanticReadableStream<T> {
  private readonly stream: ReadableStream<T>;
  private readonly client: LLMClient;
  private readonly description?: string;

  private constructor(
    stream: ReadableStream<T>,
    description?: string,
    client?: LLMClient
  ) {
    this.stream = stream;
    this.description = description;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticReadableStream from an existing ReadableStream
   */
  static from<T>(
    stream: ReadableStream<T>,
    description?: string,
    client?: LLMClient
  ): SemanticReadableStream<T> {
    return new SemanticReadableStream(stream, description, client);
  }

  /**
   * Get the underlying ReadableStream
   */
  valueOf(): ReadableStream<T> {
    return this.stream;
  }

  /**
   * Get a reader for the underlying stream
   */
  getReader(): ReturnType<ReadableStream<T>['getReader']> {
    return this.stream.getReader();
  }

  /**
   * Check if two streams are semantically equivalent (consumes both streams)
   */
  async semanticallyEquals(
    other: ReadableStream<T>
  ): Promise<SemanticEqualsResult> {
    const [content1, content2] = await Promise.all([
      this.collectContent(),
      this.collectContentFromStream(other),
    ]);

    const prompt = createSemanticallyEqualsPrompt(content1, content2);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Detect the content type of the stream data
   */
  async detectContentType(sampleSize = 1024): Promise<ContentTypeResult> {
    const sample = await this.getSample(sampleSize);
    const prompt = createDetectContentTypePrompt(sample);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ContentTypeResult;
  }

  /**
   * Summarize the stream contents (consumes stream)
   */
  async summarize(): Promise<string> {
    const content = await this.collectContent();
    const prompt = createSummarizePrompt(content);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
      confidence: number;
    };

    return result.summary;
  }

  /**
   * Filter stream data using semantic criteria
   * Returns a new SemanticReadableStream with only matching chunks
   */
  semanticFilter(criteria: string): SemanticReadableStream<T> {
    const client = this.client;
    const sourceStream = this.stream;

    const transformStream = new TransformStream<T, T>({
      async transform(chunk, controller) {
        const chunkStr = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
        const prompt = createSemanticFilterPrompt(chunkStr, criteria);

        const response = await client.complete({
          prompt,
          systemPrompt: STREAM_SYSTEM_PROMPT,
          temperature: 0.1,
        });

        const result = JSON.parse(response.content) as {
          matches: boolean;
          confidence: number;
        };

        if (result.matches) {
          controller.enqueue(chunk);
        }
      },
    });

    const filteredStream = sourceStream.pipeThrough(transformStream);
    return new SemanticReadableStream(filteredStream, this.description, client);
  }

  /**
   * Transform stream using natural language instructions
   * Returns a new SemanticReadableStream with transformed chunks
   */
  semanticTransform<U>(instruction: string): SemanticReadableStream<U> {
    const client = this.client;
    const sourceStream = this.stream;

    const transformStream = new TransformStream<T, U>({
      async transform(chunk, controller) {
        const chunkStr = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
        const prompt = createSemanticTransformPrompt(chunkStr, instruction);

        const response = await client.complete({
          prompt,
          systemPrompt: STREAM_SYSTEM_PROMPT,
          temperature: 0.1,
        });

        const result = JSON.parse(response.content) as {
          transformed: string;
          confidence: number;
        };

        // Try to parse as JSON, otherwise return as string
        let transformed: U;
        try {
          transformed = JSON.parse(result.transformed) as U;
        } catch {
          transformed = result.transformed as unknown as U;
        }

        controller.enqueue(transformed);
      },
    });

    const transformedStream = sourceStream.pipeThrough(transformStream);
    return new SemanticReadableStream(
      transformedStream,
      `Transformed: ${instruction}`,
      client
    );
  }

  /**
   * Validate stream data against semantic rules
   * Returns a new stream emitting validation results
   */
  validate(rules: string[]): SemanticReadableStream<StreamValidationResult<T>> {
    const client = this.client;
    const sourceStream = this.stream;

    const transformStream = new TransformStream<T, StreamValidationResult<T>>({
      async transform(chunk, controller) {
        const chunkStr = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
        const prompt = createValidatePrompt(chunkStr, rules);

        const response = await client.complete({
          prompt,
          systemPrompt: STREAM_SYSTEM_PROMPT,
          temperature: 0.1,
        });

        const result = JSON.parse(response.content) as {
          valid: boolean;
          issues: string[];
          confidence: number;
        };

        controller.enqueue({
          data: chunk,
          valid: result.valid,
          issues: result.issues,
        });
      },
    });

    const validatedStream = sourceStream.pipeThrough(transformStream);
    return new SemanticReadableStream(
      validatedStream,
      `Validated against ${rules.length} rules`,
      client
    );
  }

  /**
   * Explain what this stream contains
   */
  async explain(sampleSize = 1024): Promise<string> {
    const sample = await this.getSample(sampleSize);
    const prompt = createExplainPrompt(sample, this.description);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      explanation: string;
      confidence: number;
    };

    return result.explanation;
  }

  /**
   * Detect patterns in stream data (consumes stream)
   */
  async detectPatterns(): Promise<StreamPatternResult> {
    const content = await this.collectContent();
    const prompt = createDetectPatternsPrompt(content);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as StreamPatternResult;
  }

  /**
   * Infer the schema of stream elements
   */
  async inferSchema(sampleSize = 2048): Promise<StreamSchemaResult> {
    const sample = await this.getSample(sampleSize);
    const prompt = createInferSchemaPrompt(sample);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as StreamSchemaResult;
  }

  /**
   * Collect all content from the stream as a string
   */
  private async collectContent(): Promise<string> {
    return this.collectContentFromStream(this.stream);
  }

  /**
   * Collect content from any readable stream
   */
  private async collectContentFromStream(
    stream: ReadableStream<T>
  ): Promise<string> {
    const reader = stream.getReader();
    const chunks: string[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(typeof value === 'string' ? value : JSON.stringify(value));
      }
    } finally {
      reader.releaseLock();
    }

    return chunks.join('');
  }

  /**
   * Get a sample of stream data without fully consuming it
   * Note: This tees the stream internally
   */
  private async getSample(maxBytes: number): Promise<string> {
    const [stream1, stream2] = this.stream.tee();
    // Replace internal stream with one of the tees
    Object.defineProperty(this, 'stream', { value: stream2 });

    const reader = stream1.getReader();
    let collected = '';

    try {
      while (collected.length < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        collected += str;
      }
    } finally {
      reader.releaseLock();
    }

    return collected.slice(0, maxBytes);
  }
}

// =============================================================================
// SEMANTIC WRITABLE STREAM
// =============================================================================

/**
 * SemanticWritableStream - WritableStream with validation capabilities
 *
 * Wraps a WritableStream to provide semantic validation of written data
 * and statistics tracking.
 *
 * @template T - The type of chunks written to the stream
 */
export class SemanticWritableStream<T> {
  private readonly stream: WritableStream<T>;
  private readonly client: LLMClient;
  private stats: WriteStats = {
    chunksWritten: 0,
    bytesWritten: 0,
    errorCount: 0,
  };

  private constructor(stream: WritableStream<T>, client?: LLMClient) {
    this.stream = stream;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticWritableStream from an existing WritableStream
   */
  static from<T>(
    stream: WritableStream<T>,
    client?: LLMClient
  ): SemanticWritableStream<T> {
    return new SemanticWritableStream(stream, client);
  }

  /**
   * Get the underlying WritableStream
   */
  valueOf(): WritableStream<T> {
    return this.stream;
  }

  /**
   * Get a writer for the underlying stream
   */
  getWriter(): WritableStreamDefaultWriter<T> {
    return this.stream.getWriter();
  }

  /**
   * Add validation rules - returns a new stream that validates before writing
   */
  withValidation(rules: string[]): SemanticWritableStream<T> {
    const client = this.client;
    const underlyingStream = this.stream;
    const stats = this.stats;

    // Create a new writable stream that validates before writing
    const validatingStream = new WritableStream<T>({
      async write(chunk) {
        const chunkStr = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
        const prompt = createValidatePrompt(chunkStr, rules);

        const response = await client.complete({
          prompt,
          systemPrompt: STREAM_SYSTEM_PROMPT,
          temperature: 0.1,
        });

        const result = JSON.parse(response.content) as {
          valid: boolean;
          issues: string[];
          confidence: number;
        };

        if (!result.valid) {
          stats.errorCount++;
          throw new Error(`Validation failed: ${result.issues.join(', ')}`);
        }

        // Write to the underlying stream
        const writer = underlyingStream.getWriter();
        try {
          await writer.write(chunk);
          stats.chunksWritten++;
          stats.bytesWritten += chunkStr.length;
        } finally {
          writer.releaseLock();
        }
      },

      async close() {
        const writer = underlyingStream.getWriter();
        try {
          await writer.close();
        } finally {
          writer.releaseLock();
        }
      },

      async abort(reason) {
        const writer = underlyingStream.getWriter();
        try {
          await writer.abort(reason);
        } finally {
          writer.releaseLock();
        }
      },
    });

    const newStream = new SemanticWritableStream(validatingStream, client);
    // Share stats object with new instance
    Object.defineProperty(newStream, 'stats', { value: stats });
    return newStream;
  }

  /**
   * Get statistics about written data
   */
  getStats(): WriteStats {
    return { ...this.stats };
  }
}

// =============================================================================
// SEMANTIC TRANSFORM STREAM
// =============================================================================

/**
 * SemanticTransformStream - TransformStream created from natural language
 *
 * Creates a transform stream based on a natural language instruction,
 * using LLM to perform the transformation on each chunk.
 *
 * @template I - Input chunk type
 * @template O - Output chunk type
 */
export class SemanticTransformStream<I, O> {
  private readonly stream: TransformStream<I, O>;
  private readonly instruction: string;
  private readonly client: LLMClient;
  private cachedExplanation?: TransformExplanation;

  private constructor(
    instruction: string,
    client?: LLMClient
  ) {
    this.instruction = instruction;
    this.client = client ?? getClient();

    const llmClient = this.client;
    const transformInstruction = instruction;

    this.stream = new TransformStream<I, O>({
      async transform(chunk, controller) {
        const chunkStr = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
        const prompt = createSemanticTransformPrompt(chunkStr, transformInstruction);

        const response = await llmClient.complete({
          prompt,
          systemPrompt: STREAM_SYSTEM_PROMPT,
          temperature: 0.1,
        });

        const result = JSON.parse(response.content) as {
          transformed: string;
          confidence: number;
        };

        // Try to parse as JSON, otherwise return as string
        let transformed: O;
        try {
          transformed = JSON.parse(result.transformed) as O;
        } catch {
          transformed = result.transformed as unknown as O;
        }

        controller.enqueue(transformed);
      },
    });
  }

  /**
   * Create a SemanticTransformStream from a natural language instruction
   */
  static from<I, O>(
    instruction: string,
    client?: LLMClient
  ): SemanticTransformStream<I, O> {
    return new SemanticTransformStream<I, O>(instruction, client);
  }

  /**
   * Get the underlying TransformStream
   */
  valueOf(): TransformStream<I, O> {
    return this.stream;
  }

  /**
   * Get the readable side of the transform stream
   */
  get readable(): ReadableStream<O> {
    return this.stream.readable;
  }

  /**
   * Get the writable side of the transform stream
   */
  get writable(): WritableStream<I> {
    return this.stream.writable;
  }

  /**
   * Explain what this transform does
   */
  async explain(): Promise<string> {
    if (this.cachedExplanation) {
      return this.cachedExplanation.explanation;
    }

    const prompt = createExplainTransformPrompt(this.instruction);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    this.cachedExplanation = JSON.parse(response.content) as TransformExplanation;
    return this.cachedExplanation.explanation;
  }

  /**
   * Get full explanation details including input/output types
   */
  async getExplanationDetails(): Promise<TransformExplanation> {
    if (this.cachedExplanation) {
      return this.cachedExplanation;
    }

    const prompt = createExplainTransformPrompt(this.instruction);

    const response = await this.client.complete({
      prompt,
      systemPrompt: STREAM_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    this.cachedExplanation = JSON.parse(response.content) as TransformExplanation;
    return this.cachedExplanation;
  }
}
