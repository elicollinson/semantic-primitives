/**
 * SemanticTransformStream
 * A TransformStream wrapper with LLM-powered semantic understanding
 *
 * Enables intelligent transformations based on natural language instructions.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import {
  STREAM_SYSTEM_PROMPT,
  createSemanticTransformPrompt,
  createExplainTransformPrompt,
} from './prompts.ts';

/**
 * SemanticTransformStream - TransformStream with LLM-powered semantic understanding
 *
 * Creates a transform stream from natural language instructions.
 */
export class SemanticTransformStream<I, O> {
  readonly [Symbol.toStringTag] = 'SemanticTransformStream';

  private readonly _transformStream: TransformStream<I, O>;
  private readonly _instruction: string;
  private readonly _client: LLMClient;
  private _explanation: string | null = null;

  private constructor(
    instruction: string,
    client?: LLMClient
  ) {
    this._instruction = instruction;
    this._client = client ?? getClient();

    const llmClient = this._client;
    const transformInstruction = instruction;

    this._transformStream = new TransformStream<I, O>({
      async transform(chunk, controller) {
        const itemStr = stringifyChunk(chunk);

        const prompt = createSemanticTransformPrompt(
          itemStr,
          transformInstruction
        );

        try {
          const response = await llmClient.complete({
            prompt,
            systemPrompt: STREAM_SYSTEM_PROMPT,
            temperature: 0.2,
          });

          const result = JSON.parse(response.content) as {
            result: O | null;
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
  }

  /**
   * Create a transform stream from natural language instruction.
   *
   * @param instruction - What transformation to perform
   * @param client - Optional LLM client
   * @returns Transform stream
   *
   * @example
   * SemanticTransformStream.from("parse JSON and extract names")
   */
  static from<I, O>(
    instruction: string,
    client?: LLMClient
  ): SemanticTransformStream<I, O> {
    return new SemanticTransformStream<I, O>(instruction, client);
  }

  /**
   * Get the underlying TransformStream.
   */
  get transformStream(): TransformStream<I, O> {
    return this._transformStream;
  }

  /**
   * Get the instruction.
   */
  get instruction(): string {
    return this._instruction;
  }

  /**
   * Get the readable side of the transform stream.
   */
  get readable(): ReadableStream<O> {
    return this._transformStream.readable;
  }

  /**
   * Get the writable side of the transform stream.
   */
  get writable(): WritableStream<I> {
    return this._transformStream.writable;
  }

  /**
   * Explain what this transform does.
   *
   * @returns Transformation description
   */
  explain(): string {
    if (this._explanation !== null) {
      return this._explanation;
    }

    // Synchronous explanation based on the instruction
    return `Transform that applies: "${this._instruction}"`;
  }

  /**
   * Explain what this transform does using LLM.
   *
   * @returns Transformation description
   */
  async explainAsync(): Promise<string> {
    if (this._explanation !== null) {
      return this._explanation;
    }

    const prompt = createExplainTransformPrompt(this._instruction);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: STREAM_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const result = JSON.parse(response.content) as { explanation: string };
      this._explanation = result.explanation;
      return result.explanation;
    } catch {
      return this.explain();
    }
  }

  /**
   * Pipe a readable stream through this transform.
   *
   * @param source - Source readable stream
   * @returns Transformed readable stream
   */
  pipeFrom(source: ReadableStream<I>): ReadableStream<O> {
    return source.pipeThrough(this._transformStream);
  }
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
