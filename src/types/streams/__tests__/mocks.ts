/**
 * Mock utilities for SemanticStream testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent streams */
export const mockEquivalentStreamsResponse = {
  equivalent: true,
  confidence: 0.92,
};

/** Mock response for non-equivalent streams */
export const mockNotEquivalentStreamsResponse = {
  equivalent: false,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR DETECT CONTENT TYPE
// =============================================================================

/** Mock response for JSON content type */
export const mockJsonContentTypeResponse = {
  type: 'json',
  format: 'ndjson',
  confidence: 0.95,
};

/** Mock response for text content type */
export const mockTextContentTypeResponse = {
  type: 'text',
  format: 'utf-8',
  confidence: 0.90,
};

/** Mock response for CSV content type */
export const mockCsvContentTypeResponse = {
  type: 'csv',
  format: null,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SUMMARIZE
// =============================================================================

/** Mock response for log stream summary */
export const mockLogSummaryResponse = {
  summary: '1,500 log entries over 24 hours. 45 errors, 120 warnings. Peak activity at 2PM UTC.',
  confidence: 0.90,
};

/** Mock response for data stream summary */
export const mockDataSummaryResponse = {
  summary: '250 user records with id, name, and email fields. Majority from US region.',
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC FILTER
// =============================================================================

/** Mock response for matching filter */
export const mockFilterMatchResponse = {
  matches: true,
  confidence: 0.92,
};

/** Mock response for non-matching filter */
export const mockFilterNoMatchResponse = {
  matches: false,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC TRANSFORM
// =============================================================================

/** Mock response for email extraction transform */
export const mockExtractEmailTransformResponse = {
  transformed: '"user@example.com"',
  confidence: 0.95,
};

/** Mock response for name extraction transform */
export const mockExtractNameTransformResponse = {
  transformed: '"John Doe"',
  confidence: 0.92,
};

/** Mock response for uppercase transform */
export const mockUppercaseTransformResponse = {
  transformed: '"HELLO WORLD"',
  confidence: 0.98,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE
// =============================================================================

/** Mock response for valid data */
export const mockValidDataResponse = {
  valid: true,
  issues: [],
  confidence: 0.95,
};

/** Mock response for invalid data */
export const mockInvalidDataResponse = {
  valid: false,
  issues: ['email format is invalid', 'age must be positive'],
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for stream explanation */
export const mockExplainStreamResponse = {
  explanation: 'JSON stream of user records with id, name, and email fields. Data appears to be exported user profiles.',
  confidence: 0.88,
};

/** Mock response for log stream explanation */
export const mockExplainLogStreamResponse = {
  explanation: 'Server log entries in timestamp-level-message format. Contains application runtime events and errors.',
  confidence: 0.90,
};

// =============================================================================
// MOCK RESPONSES FOR DETECT PATTERNS
// =============================================================================

/** Mock response for detected patterns */
export const mockPatternsResponse = {
  patterns: ['daily cycle', 'upward trend'],
  anomalies: [{ index: 5, reason: 'unusually high value' }],
  confidence: 0.87,
};

/** Mock response for no patterns */
export const mockNoPatternsResponse = {
  patterns: [],
  anomalies: [],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR INFER SCHEMA
// =============================================================================

/** Mock response for object schema */
export const mockObjectSchemaResponse = {
  type: 'object',
  properties: {
    id: 'number',
    name: 'string',
    email: 'string',
  },
  confidence: 0.92,
};

/** Mock response for string array schema */
export const mockStringArraySchemaResponse = {
  type: 'string',
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR TRANSFORM EXPLANATION
// =============================================================================

/** Mock response for transform explanation */
export const mockTransformExplanationResponse = {
  explanation: 'Parses JSON objects and extracts the name field from each record.',
  inputType: 'object',
  outputType: 'string',
  confidence: 0.90,
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.resolve({
      content: JSON.stringify(responseContent),
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
  });

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(responses: object[]): LLMClient {
  let callIndex = 0;

  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      content: JSON.stringify(response),
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
  });

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that fails with an error
 */
export function createFailingMockLLMClient(error: Error): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.reject(error);
  });

  return {
    complete: mockComplete,
    chat: mock(() => Promise.reject(error)),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

// =============================================================================
// STREAM HELPERS FOR TESTING
// =============================================================================

/**
 * Create a ReadableStream from an array of chunks
 */
export function createReadableStreamFromArray<T>(chunks: T[]): ReadableStream<T> {
  let index = 0;
  return new ReadableStream<T>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index]);
        index++;
      } else {
        controller.close();
      }
    },
  });
}

/**
 * Create a WritableStream that collects chunks into an array
 */
export function createCollectingWritableStream<T>(): {
  stream: WritableStream<T>;
  chunks: T[];
} {
  const chunks: T[] = [];
  const stream = new WritableStream<T>({
    write(chunk) {
      chunks.push(chunk);
    },
  });
  return { stream, chunks };
}

/**
 * Collect all chunks from a ReadableStream
 */
export async function collectStreamChunks<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const chunks: T[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return chunks;
}
