/**
 * Tests for SemanticStream types
 */

import { describe, test, expect } from 'bun:test';
import {
  SemanticReadableStream,
  SemanticWritableStream,
  SemanticTransformStream,
} from '../streams.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  createReadableStreamFromArray,
  createCollectingWritableStream,
  collectStreamChunks,
  mockEquivalentStreamsResponse,
  mockNotEquivalentStreamsResponse,
  mockJsonContentTypeResponse,
  mockTextContentTypeResponse,
  mockLogSummaryResponse,
  mockDataSummaryResponse,
  mockFilterMatchResponse,
  mockFilterNoMatchResponse,
  mockExtractEmailTransformResponse,
  mockUppercaseTransformResponse,
  mockValidDataResponse,
  mockInvalidDataResponse,
  mockExplainStreamResponse,
  mockPatternsResponse,
  mockNoPatternsResponse,
  mockObjectSchemaResponse,
  mockTransformExplanationResponse,
} from './mocks.ts';

// =============================================================================
// SEMANTIC READABLE STREAM TESTS
// =============================================================================

describe('SemanticReadableStream', () => {
  describe('from', () => {
    test('creates a SemanticReadableStream from a ReadableStream', () => {
      const source = createReadableStreamFromArray(['hello', 'world']);
      const stream = SemanticReadableStream.from(source);

      expect(stream).toBeInstanceOf(SemanticReadableStream);
    });

    test('accepts optional description', () => {
      const source = createReadableStreamFromArray(['data']);
      const stream = SemanticReadableStream.from(source, 'test stream');

      expect(stream).toBeInstanceOf(SemanticReadableStream);
    });

    test('accepts custom LLM client', () => {
      const source = createReadableStreamFromArray(['data']);
      const client = createMockLLMClient(mockEquivalentStreamsResponse);
      const stream = SemanticReadableStream.from(source, undefined, client);

      expect(stream).toBeInstanceOf(SemanticReadableStream);
    });
  });

  describe('valueOf', () => {
    test('returns the underlying ReadableStream', () => {
      const source = createReadableStreamFromArray(['test']);
      const stream = SemanticReadableStream.from(source);

      expect(stream.valueOf()).toBeInstanceOf(ReadableStream);
    });
  });

  describe('getReader', () => {
    test('returns a reader for the underlying stream', async () => {
      const source = createReadableStreamFromArray(['chunk1', 'chunk2']);
      const stream = SemanticReadableStream.from(source);
      const reader = stream.getReader() as unknown as ReadableStreamDefaultReader<string>;

      const { value, done } = await reader.read();
      expect(done).toBe(false);
      expect(value).toBe('chunk1');

      reader.releaseLock();
    });
  });

  describe('semanticallyEquals', () => {
    test('returns true for equivalent streams', async () => {
      const client = createMockLLMClient(mockEquivalentStreamsResponse);
      const stream1 = SemanticReadableStream.from(
        createReadableStreamFromArray(['hello world']),
        undefined,
        client
      );
      const stream2 = createReadableStreamFromArray(['hello world']);

      const result = await stream1.semanticallyEquals(stream2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('returns false for non-equivalent streams', async () => {
      const client = createMockLLMClient(mockNotEquivalentStreamsResponse);
      const stream1 = SemanticReadableStream.from(
        createReadableStreamFromArray(['hello']),
        undefined,
        client
      );
      const stream2 = createReadableStreamFromArray(['goodbye']);

      const result = await stream1.semanticallyEquals(stream2);

      expect(result.equivalent).toBe(false);
    });
  });

  describe('detectContentType', () => {
    test('detects JSON content type', async () => {
      const client = createMockLLMClient(mockJsonContentTypeResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['{"id": 1}', '{"id": 2}']),
        undefined,
        client
      );

      const result = await stream.detectContentType();

      expect(result.type).toBe('json');
      expect(result.format).toBe('ndjson');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('detects text content type', async () => {
      const client = createMockLLMClient(mockTextContentTypeResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['Hello world', 'This is text']),
        undefined,
        client
      );

      const result = await stream.detectContentType();

      expect(result.type).toBe('text');
    });

    test('accepts custom sample size', async () => {
      const client = createMockLLMClient(mockJsonContentTypeResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['{"data": "test"}']),
        undefined,
        client
      );

      const result = await stream.detectContentType(512);

      expect(result.type).toBe('json');
    });
  });

  describe('summarize', () => {
    test('summarizes log stream contents', async () => {
      const client = createMockLLMClient(mockLogSummaryResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['[INFO] Starting...', '[ERROR] Failed']),
        undefined,
        client
      );

      const summary = await stream.summarize();

      expect(summary).toContain('log entries');
      expect(summary).toContain('errors');
    });

    test('summarizes data stream contents', async () => {
      const client = createMockLLMClient(mockDataSummaryResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([{ id: 1, name: 'John' }]),
        undefined,
        client
      );

      const summary = await stream.summarize();

      expect(summary).toContain('user records');
    });
  });

  describe('semanticFilter', () => {
    test('filters matching chunks', async () => {
      const client = createSequentialMockLLMClient([
        mockFilterMatchResponse,
        mockFilterNoMatchResponse,
        mockFilterMatchResponse,
      ]);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['error: failed', 'info: ok', 'error: timeout']),
        undefined,
        client
      );

      const filtered = stream.semanticFilter('error messages');
      const chunks = await collectStreamChunks(filtered.valueOf());

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe('error: failed');
      expect(chunks[1]).toBe('error: timeout');
    });

    test('returns empty stream when nothing matches', async () => {
      const client = createSequentialMockLLMClient([
        mockFilterNoMatchResponse,
        mockFilterNoMatchResponse,
      ]);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['info: ok', 'debug: test']),
        undefined,
        client
      );

      const filtered = stream.semanticFilter('error messages');
      const chunks = await collectStreamChunks(filtered.valueOf());

      expect(chunks).toHaveLength(0);
    });
  });

  describe('semanticTransform', () => {
    test('transforms chunks according to instruction', async () => {
      const client = createSequentialMockLLMClient([
        mockExtractEmailTransformResponse,
        mockExtractEmailTransformResponse,
      ]);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([
          { name: 'John', email: 'user@example.com' },
          { name: 'Jane', email: 'jane@example.com' },
        ]),
        undefined,
        client
      );

      const transformed = stream.semanticTransform<string>('extract only email addresses');
      const chunks = await collectStreamChunks(transformed.valueOf());

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe('user@example.com');
    });

    test('handles string transformation', async () => {
      const client = createMockLLMClient(mockUppercaseTransformResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['hello world']),
        undefined,
        client
      );

      const transformed = stream.semanticTransform<string>('convert to uppercase');
      const chunks = await collectStreamChunks(transformed.valueOf());

      expect(chunks[0]).toBe('HELLO WORLD');
    });
  });

  describe('validate', () => {
    test('validates chunks against rules', async () => {
      const client = createSequentialMockLLMClient([
        mockValidDataResponse,
        mockInvalidDataResponse,
      ]);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([
          { email: 'valid@test.com', age: 25 },
          { email: 'invalid', age: -5 },
        ]),
        undefined,
        client
      );

      const validated = stream.validate(['email must be valid', 'age must be positive']);
      const results = await collectStreamChunks(validated.valueOf());

      expect(results).toHaveLength(2);
      const firstResult = results[0];
      const secondResult = results[1];
      expect(firstResult).toBeDefined();
      expect(secondResult).toBeDefined();
      expect(firstResult?.valid).toBe(true);
      expect(firstResult?.issues).toHaveLength(0);
      expect(secondResult?.valid).toBe(false);
      expect(secondResult?.issues.length).toBeGreaterThan(0);
    });
  });

  describe('explain', () => {
    test('explains stream contents', async () => {
      const client = createMockLLMClient(mockExplainStreamResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([{ id: 1, name: 'John', email: 'john@test.com' }]),
        undefined,
        client
      );

      const explanation = await stream.explain();

      expect(explanation).toContain('JSON');
      expect(explanation).toContain('user');
    });

    test('accepts custom sample size', async () => {
      const client = createMockLLMClient(mockExplainStreamResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['data']),
        undefined,
        client
      );

      const explanation = await stream.explain(256);

      expect(typeof explanation).toBe('string');
    });
  });

  describe('detectPatterns', () => {
    test('detects patterns in stream data', async () => {
      const client = createMockLLMClient(mockPatternsResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([1, 2, 3, 4, 5, 100, 6, 7]),
        undefined,
        client
      );

      const result = await stream.detectPatterns();

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns).toContain('daily cycle');
      expect(result.anomalies.length).toBeGreaterThan(0);
    });

    test('returns empty patterns when none found', async () => {
      const client = createMockLLMClient(mockNoPatternsResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray(['random', 'data']),
        undefined,
        client
      );

      const result = await stream.detectPatterns();

      expect(result.patterns).toHaveLength(0);
      expect(result.anomalies).toHaveLength(0);
    });
  });

  describe('inferSchema', () => {
    test('infers object schema from stream', async () => {
      const client = createMockLLMClient(mockObjectSchemaResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([
          { id: 1, name: 'John', email: 'john@test.com' },
        ]),
        undefined,
        client
      );

      const schema = await stream.inferSchema();

      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties?.['id']).toBe('number');
      expect(schema.properties?.['name']).toBe('string');
    });

    test('accepts custom sample size', async () => {
      const client = createMockLLMClient(mockObjectSchemaResponse);
      const stream = SemanticReadableStream.from(
        createReadableStreamFromArray([{ data: 'test' }]),
        undefined,
        client
      );

      const schema = await stream.inferSchema(4096);

      expect(schema.type).toBe('object');
    });
  });
});

// =============================================================================
// SEMANTIC WRITABLE STREAM TESTS
// =============================================================================

describe('SemanticWritableStream', () => {
  describe('from', () => {
    test('creates a SemanticWritableStream from a WritableStream', () => {
      const { stream } = createCollectingWritableStream<string>();
      const semanticStream = SemanticWritableStream.from(stream);

      expect(semanticStream).toBeInstanceOf(SemanticWritableStream);
    });

    test('accepts custom LLM client', () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockValidDataResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      expect(semanticStream).toBeInstanceOf(SemanticWritableStream);
    });
  });

  describe('valueOf', () => {
    test('returns the underlying WritableStream', () => {
      const { stream } = createCollectingWritableStream<string>();
      const semanticStream = SemanticWritableStream.from(stream);

      expect(semanticStream.valueOf()).toBeInstanceOf(WritableStream);
    });
  });

  describe('getWriter', () => {
    test('returns a writer for the underlying stream', async () => {
      const { stream, chunks } = createCollectingWritableStream<string>();
      const semanticStream = SemanticWritableStream.from(stream);
      const writer = semanticStream.getWriter();

      await writer.write('test chunk');
      await writer.close();

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('test chunk');
    });
  });

  describe('withValidation', () => {
    test('validates data before writing', async () => {
      const client = createMockLLMClient(mockValidDataResponse);
      const { stream, chunks } = createCollectingWritableStream<object>();
      const semanticStream = SemanticWritableStream.from(stream, client);
      const validatingStream = semanticStream.withValidation([
        'email must be valid',
        'age must be positive',
      ]);

      const writer = validatingStream.getWriter();
      await writer.write({ email: 'test@example.com', age: 25 });
      await writer.close();

      expect(chunks).toHaveLength(1);
    });

    test('rejects invalid data', async () => {
      const client = createMockLLMClient(mockInvalidDataResponse);
      const { stream } = createCollectingWritableStream<object>();
      const semanticStream = SemanticWritableStream.from(stream, client);
      const validatingStream = semanticStream.withValidation([
        'email must be valid',
      ]);

      const writer = validatingStream.getWriter();

      let error: Error | undefined;
      try {
        await writer.write({ email: 'invalid' });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain('Validation failed');
    });

    test('tracks error count on validation failure', async () => {
      const client = createMockLLMClient(mockInvalidDataResponse);
      const { stream } = createCollectingWritableStream<object>();
      const semanticStream = SemanticWritableStream.from(stream, client);
      const validatingStream = semanticStream.withValidation(['email must be valid']);

      const writer = validatingStream.getWriter();

      try {
        await writer.write({ email: 'invalid' });
      } catch {
        // Expected to fail
      }

      const stats = validatingStream.getStats();
      expect(stats.errorCount).toBe(1);
    });
  });

  describe('getStats', () => {
    test('returns initial stats', () => {
      const { stream } = createCollectingWritableStream<string>();
      const semanticStream = SemanticWritableStream.from(stream);

      const stats = semanticStream.getStats();

      expect(stats.chunksWritten).toBe(0);
      expect(stats.bytesWritten).toBe(0);
      expect(stats.errorCount).toBe(0);
    });

    test('tracks write statistics with validation', async () => {
      const client = createMockLLMClient(mockValidDataResponse);
      const { stream } = createCollectingWritableStream<string>();
      const semanticStream = SemanticWritableStream.from(stream, client);
      const validatingStream = semanticStream.withValidation(['must be text']);

      const writer = validatingStream.getWriter();
      await writer.write('hello');
      await writer.write('world');
      await writer.close();

      const stats = validatingStream.getStats();

      expect(stats.chunksWritten).toBe(2);
      expect(stats.bytesWritten).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// SEMANTIC TRANSFORM STREAM TESTS
// =============================================================================

describe('SemanticTransformStream', () => {
  describe('from', () => {
    test('creates a SemanticTransformStream from instruction', () => {
      const stream = SemanticTransformStream.from('extract names');

      expect(stream).toBeInstanceOf(SemanticTransformStream);
    });

    test('accepts custom LLM client', () => {
      const client = createMockLLMClient(mockExtractEmailTransformResponse);
      const stream = SemanticTransformStream.from('extract emails', client);

      expect(stream).toBeInstanceOf(SemanticTransformStream);
    });
  });

  describe('valueOf', () => {
    test('returns the underlying TransformStream', () => {
      const stream = SemanticTransformStream.from('transform');

      expect(stream.valueOf()).toBeInstanceOf(TransformStream);
    });
  });

  describe('readable and writable', () => {
    test('exposes readable side', () => {
      const stream = SemanticTransformStream.from('transform');

      expect(stream.readable).toBeInstanceOf(ReadableStream);
    });

    test('exposes writable side', () => {
      const stream = SemanticTransformStream.from('transform');

      expect(stream.writable).toBeInstanceOf(WritableStream);
    });

    test('transforms data through the stream', async () => {
      const client = createMockLLMClient(mockUppercaseTransformResponse);
      const transformStream = SemanticTransformStream.from<string, string>(
        'convert to uppercase',
        client
      );

      // Create a source stream and pipe it through the transform
      const source = createReadableStreamFromArray(['hello world']);
      const output = source.pipeThrough(transformStream.valueOf());
      const chunks = await collectStreamChunks(output);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('HELLO WORLD');
    });
  });

  describe('explain', () => {
    test('explains what the transform does', async () => {
      const client = createMockLLMClient(mockTransformExplanationResponse);
      const stream = SemanticTransformStream.from('parse JSON and extract names', client);

      const explanation = await stream.explain();

      expect(explanation).toContain('Parses');
      expect(explanation).toContain('name');
    });

    test('caches explanation result', async () => {
      const client = createMockLLMClient(mockTransformExplanationResponse);
      const stream = SemanticTransformStream.from('extract data', client);

      const explanation1 = await stream.explain();
      const explanation2 = await stream.explain();

      // Results should be identical due to caching
      expect(explanation1).toBe(explanation2);
    });
  });

  describe('getExplanationDetails', () => {
    test('returns full explanation details', async () => {
      const client = createMockLLMClient(mockTransformExplanationResponse);
      const stream = SemanticTransformStream.from('parse and extract', client);

      const details = await stream.getExplanationDetails();

      expect(details.explanation).toBeDefined();
      expect(details.inputType).toBe('object');
      expect(details.outputType).toBe('string');
      expect(details.confidence).toBeGreaterThan(0.8);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Stream Integration', () => {
  test('can pipe SemanticReadableStream through SemanticTransformStream', async () => {
    const transformClient = createMockLLMClient(mockUppercaseTransformResponse);
    const readableClient = createMockLLMClient(mockEquivalentStreamsResponse);

    const source = SemanticReadableStream.from(
      createReadableStreamFromArray(['hello']),
      undefined,
      readableClient
    );

    const transform = SemanticTransformStream.from<string, string>(
      'uppercase',
      transformClient
    );

    const transformed = source.valueOf().pipeThrough(transform.valueOf());
    const chunks = await collectStreamChunks(transformed);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('HELLO WORLD');
  });

  test('can chain filter and transform operations', async () => {
    const client = createSequentialMockLLMClient([
      mockFilterMatchResponse,
      mockFilterNoMatchResponse,
      mockUppercaseTransformResponse,
    ]);

    const source = SemanticReadableStream.from(
      createReadableStreamFromArray(['error: test', 'info: ok']),
      undefined,
      client
    );

    const filtered = source.semanticFilter('error messages');
    const transformed = filtered.semanticTransform<string>('uppercase');
    const chunks = await collectStreamChunks(transformed.valueOf());

    expect(chunks).toHaveLength(1);
  });
});
