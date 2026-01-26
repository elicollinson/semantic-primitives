/**
 * SemanticReadableStream
 * A ReadableStream wrapper with LLM-powered semantic understanding
 *
 * Enables content analysis, intelligent transformations, and pattern detection on streaming data.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import {
  STREAM_SYSTEM_PROMPT,
  createDetectContentTypePrompt,
  createSummarizePrompt,
  createSemanticEqualsPrompt,
  createSemanticFilterPrompt,
  createSemanticTransformPrompt,
  createValidatePrompt,
  createExplainPrompt,
  createDetectPatternsPrompt,
  createInferSchemaPrompt,
} from './prompts.ts';

/** Result of content type detection */
export interface DetectContentTypeResult {
  type: string;
  format?: string;
  confidence: number;
}

/** Result of semantic equality comparison */
export interface StreamSemanticEqualsResult {
  equivalent: boolean;
  confidence: number;
  reason?: string;
}

/** Result of pattern detection */
export interface DetectPatternsResult {
  patterns: string[];
  anomalies: { index: number; reason: string }[];
}

/** Result of schema inference */
export interface InferSchemaResult {
  type: string;
  properties?: Record<string, string>;
  confidence: number;
}

/** Validation result for stream items */
export interface StreamValidationItem<T> {
  data: T;
  valid: boolean;
  issues: string[];
}

const DEFAULT_SAMPLE_SIZE = 4096;

/**
 * SemanticReadableStream - ReadableStream with LLM-powered semantic understanding
 *
 * Wraps a native ReadableStream and adds intelligent content analysis,
 * pattern detection, and transformation capabilities.
 */
export class SemanticReadableStream<T> {
  readonly [Symbol.toStringTag] = 'SemanticReadableStream';

  private _stream: ReadableStream<T>;
  private readonly _description?: string;
  private readonly _client: LLMClient;

  private constructor(
    stream: ReadableStream<T>,
    description?: string,
    client?: LLMClient
  ) {
    this._stream = stream;
    this._description = description;
    this._client = client ?? getClient();
  }

  /**
   * Wrap a ReadableStream with semantic capabilities.
   *
   * @param stream - ReadableStream to wrap
   * @param description - Optional description of stream contents
   * @param client - Optional LLM client
   * @returns SemanticReadableStream instance
   *
   * @example
   * SemanticReadableStream.from(fetch(url).then(r => r.body), "API response")
   */
  static from<T>(
    stream: ReadableStream<T>,
    description?: string,
    client?: LLMClient
  ): SemanticReadableStream<T> {
    if (stream instanceof SemanticReadableStream) {
      return stream as unknown as SemanticReadableStream<T>;
    }
    return new SemanticReadableStream(stream, description, client);
  }

  /**
   * Get the underlying ReadableStream.
   */
  get stream(): ReadableStream<T> {
    return this._stream;
  }

  /**
   * Get the description.
   */
  get description(): string | undefined {
    return this._description;
  }

  /**
   * Get a reader for the underlying stream.
   */
  getReader(): ReadableStreamDefaultReader<T> {
    return this._stream.getReader();
  }

  /**
   * Tee the stream into two branches.
   */
  tee(): [SemanticReadableStream<T>, SemanticReadableStream<T>] {
    const [s1, s2] = this._stream.tee();
    return [
      new SemanticReadableStream(s1, this._description, this._client),
      new SemanticReadableStream(s2, this._description, this._client),
    ];
  }

  /**
   * Check if two streams are semantically equivalent.
   * Note: This consumes both streams.
   *
   * @param other - Stream to compare
   * @returns Equivalence result
   */
  async semanticallyEquals(
    other: ReadableStream<T>
  ): Promise<StreamSemanticEqualsResult> {
    const [content1, content2] = await Promise.all([
      this.consumeAsString(),
      consumeStreamAsString(other),
    ]);

    // Fast path: identical content
    if (content1 === content2) {
      return { equivalent: true, confidence: 1.0, reason: 'Identical content' };
    }

    const prompt = createSemanticEqualsPrompt(
      content1,
      content2,
      this._description
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      return JSON.parse(response.content) as StreamSemanticEqualsResult;
    } catch {
      // Fallback: simple comparison
      const trimmed1 = content1.trim();
      const trimmed2 = content2.trim();
      return {
        equivalent: trimmed1 === trimmed2,
        confidence: trimmed1 === trimmed2 ? 0.8 : 0.5,
        reason: 'Fallback comparison',
      };
    }
  }

  /**
   * Detect the content type of the stream data.
   *
   * @param sampleSize - Bytes to sample for detection
   * @returns Content type detection result
   */
  async detectContentType(
    sampleSize: number = DEFAULT_SAMPLE_SIZE
  ): Promise<DetectContentTypeResult> {
    const [teeSample, restStream] = this._stream.tee();
    this._stream = restStream;

    const sample = await sampleStreamData(teeSample, sampleSize);

    // Fast path: detect common patterns
    const trimmed = sample.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const hasNewlineObjects = trimmed.includes('}\n{');
      if (hasNewlineObjects) {
        return { type: 'json', format: 'ndjson', confidence: 0.9 };
      }
    }

    const prompt = createDetectContentTypePrompt(sample, this._description);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      return JSON.parse(response.content) as DetectContentTypeResult;
    } catch {
      return detectContentTypeFallback(sample);
    }
  }

  /**
   * Summarize the stream contents.
   * Note: This consumes the stream.
   *
   * @returns Content summary
   */
  async summarize(): Promise<string> {
    const content = await this.consumeAsString();

    if (!content.trim()) {
      return 'Empty stream with no content.';
    }

    const prompt = createSummarizePrompt(content, this._description);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const result = JSON.parse(response.content) as { summary: string };
      return result.summary;
    } catch {
      return summarizeFallback(content);
    }
  }

  /**
   * Filter stream data using semantic criteria.
   *
   * @param criteria - Natural language filter
   * @returns Filtered stream
   */
  semanticFilter(criteria: string): SemanticReadableStream<T> {
    const client = this._client;
    const description = this._description;
    const sourceStream = this._stream;

    const transformStream = new TransformStream<T, T>({
      async transform(chunk, controller) {
        const itemStr = stringifyChunk(chunk);

        const prompt = createSemanticFilterPrompt(
          itemStr,
          criteria,
          description
        );

        try {
          const response = await client.complete({
            prompt,
            systemPrompt: STREAM_SYSTEM_PROMPT,
            temperature: 0.1,
          });

          const result = JSON.parse(response.content) as {
            matches: boolean;
            confidence: number;
          };

          if (result.matches && result.confidence >= 0.7) {
            controller.enqueue(chunk);
          }
        } catch {
          // On error, include the item (conservative approach)
          controller.enqueue(chunk);
        }
      },
    });

    const filteredStream = sourceStream.pipeThrough(transformStream);
    return new SemanticReadableStream(
      filteredStream,
      `${description ?? 'Stream'} filtered by: ${criteria}`,
      client
    );
  }

  /**
   * Transform stream using natural language instructions.
   *
   * @param instruction - Transformation instruction
   * @returns Transformed stream
   */
  semanticTransform<U>(instruction: string): SemanticReadableStream<U> {
    const client = this._client;
    const description = this._description;
    const sourceStream = this._stream;

    const transformStream = new TransformStream<T, U>({
      async transform(chunk, controller) {
        const itemStr = stringifyChunk(chunk);

        const prompt = createSemanticTransformPrompt(
          itemStr,
          instruction,
          description
        );

        try {
          const response = await client.complete({
            prompt,
            systemPrompt: STREAM_SYSTEM_PROMPT,
            temperature: 0.2,
          });

          const result = JSON.parse(response.content) as {
            result: U | null;
            success: boolean;
          };

          if (result.success && result.result !== null) {
            controller.enqueue(result.result);
          }
        } catch {
          // On error, skip the item
        }
      },
    });

    const transformedStream = sourceStream.pipeThrough(transformStream);
    return new SemanticReadableStream(
      transformedStream,
      `${description ?? 'Stream'} transformed: ${instruction}`,
      client
    );
  }

  /**
   * Validate stream data against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation stream
   */
  validate(rules: string[]): SemanticReadableStream<StreamValidationItem<T>> {
    const client = this._client;
    const description = this._description;
    const sourceStream = this._stream;

    const transformStream = new TransformStream<T, StreamValidationItem<T>>({
      async transform(chunk, controller) {
        const itemStr = stringifyChunk(chunk);

        const prompt = createValidatePrompt(itemStr, rules, description);

        try {
          const response = await client.complete({
            prompt,
            systemPrompt: STREAM_SYSTEM_PROMPT,
            temperature: 0.1,
          });

          const result = JSON.parse(response.content) as {
            valid: boolean;
            issues: string[];
          };

          controller.enqueue({
            data: chunk,
            valid: result.valid,
            issues: result.issues,
          });
        } catch {
          // On error, mark as valid with no issues
          controller.enqueue({
            data: chunk,
            valid: true,
            issues: [],
          });
        }
      },
    });

    const validationStream = sourceStream.pipeThrough(transformStream);
    return new SemanticReadableStream(
      validationStream,
      `${description ?? 'Stream'} validation results`,
      client
    );
  }

  /**
   * Explain what this stream contains.
   *
   * @param sampleSize - Data to sample for explanation
   * @returns Human-readable explanation
   */
  async explain(sampleSize: number = DEFAULT_SAMPLE_SIZE): Promise<string> {
    const [teeSample, restStream] = this._stream.tee();
    this._stream = restStream;

    const sample = await sampleStreamData(teeSample, sampleSize);

    if (!sample.trim()) {
      return this._description
        ? `${this._description} (empty stream)`
        : 'Empty stream with no content';
    }

    const prompt = createExplainPrompt(sample, this._description);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const result = JSON.parse(response.content) as { explanation: string };
      return result.explanation;
    } catch {
      return explainFallback(sample, this._description);
    }
  }

  /**
   * Detect patterns in stream data.
   * Note: This consumes the stream.
   *
   * @returns Detected patterns
   */
  async detectPatterns(): Promise<DetectPatternsResult> {
    const content = await this.consumeAsString();

    if (!content.trim()) {
      return { patterns: [], anomalies: [] };
    }

    const prompt = createDetectPatternsPrompt(content, this._description);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.2,
      });

      return JSON.parse(response.content) as DetectPatternsResult;
    } catch {
      return { patterns: [], anomalies: [] };
    }
  }

  /**
   * Infer the schema of stream elements.
   *
   * @returns Inferred schema
   */
  async inferSchema(): Promise<InferSchemaResult> {
    const [teeSample, restStream] = this._stream.tee();
    this._stream = restStream;

    const sample = await sampleStreamData(teeSample, DEFAULT_SAMPLE_SIZE);

    if (!sample.trim()) {
      return { type: 'unknown', confidence: 0 };
    }

    const prompt = createInferSchemaPrompt(sample, this._description);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      return JSON.parse(response.content) as InferSchemaResult;
    } catch {
      return inferSchemaFallback(sample);
    }
  }

  /**
   * Consume the entire stream as a string.
   */
  private async consumeAsString(): Promise<string> {
    return consumeStreamAsString(this._stream);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Sample data from a stream up to a given size.
 */
async function sampleStreamData(
  stream: ReadableStream<unknown>,
  maxSize: number
): Promise<string> {
  const reader = stream.getReader();
  let result = '';
  const decoder = new TextDecoder();

  try {
    while (result.length < maxSize) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value instanceof Uint8Array) {
        result += decoder.decode(value, { stream: true });
      } else if (typeof value === 'string') {
        result += value;
      } else {
        result += JSON.stringify(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result.slice(0, maxSize);
}

/**
 * Consume an entire stream as a string.
 */
async function consumeStreamAsString(
  stream: ReadableStream<unknown>
): Promise<string> {
  const reader = stream.getReader();
  let result = '';
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value instanceof Uint8Array) {
        result += decoder.decode(value, { stream: true });
      } else if (typeof value === 'string') {
        result += value;
      } else {
        result += JSON.stringify(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

/**
 * Convert a chunk to a string for analysis.
 */
function stringifyChunk(chunk: unknown): string {
  if (chunk instanceof Uint8Array) {
    return new TextDecoder().decode(chunk);
  }
  if (typeof chunk === 'string') {
    return chunk;
  }
  return JSON.stringify(chunk);
}

/**
 * Fallback content type detection based on simple heuristics.
 */
function detectContentTypeFallback(sample: string): DetectContentTypeResult {
  const trimmed = sample.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    if (trimmed.includes('}\n{') || trimmed.includes('}\r\n{')) {
      return { type: 'json', format: 'ndjson', confidence: 0.7 };
    }
    return { type: 'json', confidence: 0.7 };
  }

  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().includes('<html')) {
      return { type: 'html', confidence: 0.7 };
    }
    return { type: 'xml', confidence: 0.7 };
  }

  if (trimmed.includes(',') && trimmed.includes('\n')) {
    const lines = trimmed.split('\n');
    const firstLineCommas = (lines[0] ?? '').split(',').length;
    const secondLineCommas = (lines[1] ?? '').split(',').length;
    if (firstLineCommas > 1 && firstLineCommas === secondLineCommas) {
      return { type: 'csv', confidence: 0.6 };
    }
  }

  return { type: 'text', confidence: 0.5 };
}

/**
 * Fallback summarization based on simple analysis.
 */
function summarizeFallback(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim());
  const bytes = new TextEncoder().encode(content).length;

  return `Stream contains ${lines.length} lines and ${bytes} bytes of data.`;
}

/**
 * Fallback explanation based on simple analysis.
 */
function explainFallback(sample: string, description?: string): string {
  const detected = detectContentTypeFallback(sample);
  const prefix = description ? `${description}: ` : '';

  return `${prefix}${detected.type} data stream`;
}

/**
 * Fallback schema inference based on simple analysis.
 */
function inferSchemaFallback(sample: string): InferSchemaResult {
  const trimmed = sample.trim();

  try {
    const parsed: unknown = JSON.parse(trimmed.split('\n')[0] ?? trimmed);

    if (Array.isArray(parsed)) {
      return { type: 'array', confidence: 0.6 };
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const properties: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        properties[key] = typeof value;
      }
      return { type: 'object', properties, confidence: 0.6 };
    }

    return { type: typeof parsed, confidence: 0.6 };
  } catch {
    return { type: 'string', confidence: 0.4 };
  }
}
