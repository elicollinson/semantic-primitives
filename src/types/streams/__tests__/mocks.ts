/**
 * Mock utilities for Semantic Streams testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// DETECT CONTENT TYPE RESPONSES
// =============================================================================

/** Mock response for detectContentType - JSON */
export const mockDetectContentTypeJsonResponse = {
  type: 'json',
  format: 'object',
  confidence: 0.95,
};

/** Mock response for detectContentType - NDJSON */
export const mockDetectContentTypeNdjsonResponse = {
  type: 'json',
  format: 'ndjson',
  confidence: 0.92,
};

/** Mock response for detectContentType - CSV */
export const mockDetectContentTypeCsvResponse = {
  type: 'csv',
  format: null,
  confidence: 0.88,
};

/** Mock response for detectContentType - text */
export const mockDetectContentTypeTextResponse = {
  type: 'text',
  format: null,
  confidence: 0.75,
};

// =============================================================================
// SUMMARIZE RESPONSES
// =============================================================================

/** Mock response for summarize */
export const mockSummarizeResponse = {
  summary:
    '100 JSON records containing user data. Fields include id, name, email. No anomalies detected.',
};

/** Mock response for summarize - log data */
export const mockSummarizeLogResponse = {
  summary:
    '1,500 log entries over 24 hours. 45 errors, 120 warnings. Peak activity at 2PM UTC.',
};

// =============================================================================
// SEMANTIC EQUALS RESPONSES
// =============================================================================

/** Mock response for semanticallyEquals - equivalent */
export const mockSemanticEqualsEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
  reason: 'Both streams contain identical user data with same structure',
};

/** Mock response for semanticallyEquals - not equivalent */
export const mockSemanticEqualsNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
  reason: 'Streams contain different data records',
};

// =============================================================================
// SEMANTIC FILTER RESPONSES
// =============================================================================

/** Mock response for semanticFilter - matches */
export const mockSemanticFilterMatchResponse = {
  matches: true,
  confidence: 0.92,
};

/** Mock response for semanticFilter - no match */
export const mockSemanticFilterNoMatchResponse = {
  matches: false,
  confidence: 0.85,
};

// =============================================================================
// SEMANTIC TRANSFORM RESPONSES
// =============================================================================

/** Mock response for semanticTransform - success */
export const mockSemanticTransformSuccessResponse = {
  result: { name: 'John' },
  success: true,
};

/** Mock response for semanticTransform - string result */
export const mockSemanticTransformStringResponse = {
  result: 'john@example.com',
  success: true,
};

/** Mock response for semanticTransform - failure */
export const mockSemanticTransformFailureResponse = {
  result: null,
  success: false,
};

// =============================================================================
// VALIDATE RESPONSES
// =============================================================================

/** Mock response for validate - valid */
export const mockValidateValidResponse = {
  valid: true,
  issues: [],
};

/** Mock response for validate - invalid */
export const mockValidateInvalidResponse = {
  valid: false,
  issues: ['email field is missing', 'age must be a positive number'],
};

// =============================================================================
// EXPLAIN RESPONSES
// =============================================================================

/** Mock response for explain */
export const mockExplainResponse = {
  explanation:
    'JSON stream of user records with id, name, and email fields',
};

/** Mock response for explain - log data */
export const mockExplainLogResponse = {
  explanation:
    'Server log stream with timestamp, level, and message fields',
};

// =============================================================================
// DETECT PATTERNS RESPONSES
// =============================================================================

/** Mock response for detectPatterns */
export const mockDetectPatternsResponse = {
  patterns: ['daily cycle in activity', 'increasing trend over time'],
  anomalies: [
    { index: 42, reason: 'Unexpected spike in error count' },
    { index: 87, reason: 'Missing expected data field' },
  ],
};

/** Mock response for detectPatterns - clean */
export const mockDetectPatternsCleanResponse = {
  patterns: ['consistent data format', 'regular intervals'],
  anomalies: [],
};

// =============================================================================
// INFER SCHEMA RESPONSES
// =============================================================================

/** Mock response for inferSchema - object */
export const mockInferSchemaObjectResponse = {
  type: 'object',
  properties: {
    id: 'number',
    name: 'string',
    email: 'string',
  },
  confidence: 0.92,
};

/** Mock response for inferSchema - array */
export const mockInferSchemaArrayResponse = {
  type: 'array',
  properties: null,
  confidence: 0.85,
};

// =============================================================================
// EXPLAIN TRANSFORM RESPONSES
// =============================================================================

/** Mock response for explainTransform */
export const mockExplainTransformResponse = {
  explanation:
    'Extracts the name field from each JSON object and returns it as a string',
};

// =============================================================================
// WRITE VALIDATION RESPONSES
// =============================================================================

/** Mock response for write validation - valid */
export const mockWriteValidationValidResponse = {
  valid: true,
  issues: [],
};

/** Mock response for write validation - invalid */
export const mockWriteValidationInvalidResponse = {
  valid: false,
  issues: ['Required field "id" is missing'],
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object | string): LLMClient {
  const content =
    typeof responseContent === 'string'
      ? responseContent
      : JSON.stringify(responseContent);

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.resolve({
        content,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

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
export function createSequentialMockLLMClient(
  responses: (object | string)[]
): LLMClient {
  let callIndex = 0;

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      const content =
        typeof response === 'string' ? response : JSON.stringify(response);
      return Promise.resolve({
        content,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

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
 * Create a mock LLM client that throws an error
 */
export function createErrorMockLLMClient(error: Error): LLMClient {
  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.reject(error);
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() => Promise.reject(error)),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

// =============================================================================
// STREAM HELPER FACTORIES
// =============================================================================

/**
 * Create a readable stream from an array of values
 */
export function createReadableStreamFromArray<T>(values: T[]): ReadableStream<T> {
  let index = 0;
  return new ReadableStream<T>({
    pull(controller) {
      if (index < values.length) {
        const value = values[index];
        if (value !== undefined) {
          controller.enqueue(value);
        }
        index++;
      } else {
        controller.close();
      }
    },
  });
}

/**
 * Create a readable stream from a string
 */
export function createReadableStreamFromString(str: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(str));
      controller.close();
    },
  });
}

/**
 * Collect all chunks from a readable stream
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

/**
 * Create a mock writable stream that collects chunks
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
