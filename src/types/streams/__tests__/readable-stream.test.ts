/**
 * Unit tests for SemanticReadableStream
 */

import { describe, test, expect } from 'bun:test';
import { SemanticReadableStream } from '../readable-stream.ts';
import {
  createMockLLMClient,
  createErrorMockLLMClient,
  createSequentialMockLLMClient,
  createReadableStreamFromString,
  createReadableStreamFromArray,
  collectStreamChunks,
  mockDetectContentTypeJsonResponse,
  mockSummarizeResponse,
  mockSemanticEqualsEquivalentResponse,
  mockSemanticEqualsNotEquivalentResponse,
  mockSemanticFilterMatchResponse,
  mockSemanticFilterNoMatchResponse,
  mockSemanticTransformSuccessResponse,
  mockValidateValidResponse,
  mockValidateInvalidResponse,
  mockExplainResponse,
  mockDetectPatternsResponse,
  mockDetectPatternsCleanResponse,
  mockInferSchemaObjectResponse,
} from './mocks.ts';

describe('SemanticReadableStream', () => {
  describe('from', () => {
    test('creates SemanticReadableStream from ReadableStream', () => {
      const stream = createReadableStreamFromString('test data');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, 'test', client);

      expect(semanticStream).toBeInstanceOf(SemanticReadableStream);
      expect(semanticStream.description).toBe('test');
    });

    test('creates SemanticReadableStream without description', () => {
      const stream = createReadableStreamFromString('test data');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      expect(semanticStream).toBeInstanceOf(SemanticReadableStream);
      expect(semanticStream.description).toBeUndefined();
    });

    test('returns same instance if already SemanticReadableStream', () => {
      const stream = createReadableStreamFromString('test data');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, 'test', client);
      const rewrapped = SemanticReadableStream.from(
        semanticStream as unknown as ReadableStream<Uint8Array>,
        'other',
        client
      );

      expect(rewrapped).toBe(semanticStream);
    });
  });

  describe('stream access', () => {
    test('stream getter returns underlying stream', () => {
      const stream = createReadableStreamFromString('test');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      expect(semanticStream.stream).toBe(stream);
    });

    test('getReader returns a reader', async () => {
      const stream = createReadableStreamFromString('test');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const reader = semanticStream.getReader();
      const { value, done } = await reader.read();

      expect(done).toBe(false);
      expect(new TextDecoder().decode(value)).toBe('test');
    });

    test('tee returns two SemanticReadableStreams', () => {
      const stream = createReadableStreamFromString('test');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, 'desc', client);

      const [s1, s2] = semanticStream.tee();

      expect(s1).toBeInstanceOf(SemanticReadableStream);
      expect(s2).toBeInstanceOf(SemanticReadableStream);
      expect(s1.description).toBe('desc');
      expect(s2.description).toBe('desc');
    });
  });

  describe('detectContentType', () => {
    test('detects JSON content type', async () => {
      const stream = createReadableStreamFromString('{"name": "John"}');
      const client = createMockLLMClient(mockDetectContentTypeJsonResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.detectContentType();

      expect(result.type).toBe('json');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('detects NDJSON content type with fallback', async () => {
      const stream = createReadableStreamFromString('{"a":1}\n{"b":2}');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.detectContentType();

      expect(result.type).toBe('json');
      expect(result.format).toBe('ndjson');
    });

    test('falls back to heuristics on LLM error', async () => {
      const stream = createReadableStreamFromString('plain text content');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.detectContentType();

      expect(result.type).toBe('text');
    });
  });

  describe('summarize', () => {
    test('summarizes stream content', async () => {
      const stream = createReadableStreamFromString('{"id": 1, "name": "John"}');
      const client = createMockLLMClient(mockSummarizeResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const summary = await semanticStream.summarize();

      expect(summary).toContain('JSON');
      expect(summary).toContain('user data');
    });

    test('handles empty stream', async () => {
      const stream = createReadableStreamFromString('');
      const client = createMockLLMClient(mockSummarizeResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const summary = await semanticStream.summarize();

      expect(summary).toContain('Empty');
    });

    test('falls back on LLM error', async () => {
      const stream = createReadableStreamFromString('line1\nline2\nline3');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const summary = await semanticStream.summarize();

      expect(summary).toContain('3 lines');
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for identical streams', async () => {
      const stream1 = createReadableStreamFromString('same content');
      const stream2 = createReadableStreamFromString('same content');
      const client = createMockLLMClient(mockSemanticEqualsEquivalentResponse);
      const semanticStream = SemanticReadableStream.from(stream1, undefined, client);

      const result = await semanticStream.semanticallyEquals(stream2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('uses LLM for different but potentially equivalent streams', async () => {
      const stream1 = createReadableStreamFromString('{"a": 1}');
      const stream2 = createReadableStreamFromString('{ "a" : 1 }');
      const client = createMockLLMClient(mockSemanticEqualsEquivalentResponse);
      const semanticStream = SemanticReadableStream.from(stream1, undefined, client);

      const result = await semanticStream.semanticallyEquals(stream2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('returns not equivalent for different streams', async () => {
      const stream1 = createReadableStreamFromString('content A');
      const stream2 = createReadableStreamFromString('content B');
      const client = createMockLLMClient(mockSemanticEqualsNotEquivalentResponse);
      const semanticStream = SemanticReadableStream.from(stream1, undefined, client);

      const result = await semanticStream.semanticallyEquals(stream2);

      expect(result.equivalent).toBe(false);
    });

    test('falls back on LLM error', async () => {
      const stream1 = createReadableStreamFromString('content');
      const stream2 = createReadableStreamFromString('different');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream1, undefined, client);

      const result = await semanticStream.semanticallyEquals(stream2);

      expect(result.equivalent).toBe(false);
      expect(result.reason).toBe('Fallback comparison');
    });
  });

  describe('semanticFilter', () => {
    test('filters stream based on criteria', async () => {
      const items = [
        { type: 'error', message: 'Failed' },
        { type: 'info', message: 'Success' },
        { type: 'error', message: 'Timeout' },
      ];
      const stream = createReadableStreamFromArray(items);
      const client = createSequentialMockLLMClient([
        mockSemanticFilterMatchResponse,
        mockSemanticFilterNoMatchResponse,
        mockSemanticFilterMatchResponse,
      ]);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const filtered = semanticStream.semanticFilter('error messages');
      const results = await collectStreamChunks(filtered.stream);

      expect(results.length).toBe(2);
    });

    test('includes items on LLM error (conservative)', async () => {
      const items = [{ data: 'test' }];
      const stream = createReadableStreamFromArray(items);
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const filtered = semanticStream.semanticFilter('any criteria');
      const results = await collectStreamChunks(filtered.stream);

      expect(results.length).toBe(1);
    });

    test('updates description after filtering', () => {
      const stream = createReadableStreamFromArray([{ data: 'test' }]);
      const client = createMockLLMClient(mockSemanticFilterMatchResponse);
      const semanticStream = SemanticReadableStream.from(stream, 'Original', client);

      const filtered = semanticStream.semanticFilter('error messages');

      expect(filtered.description).toContain('filtered by');
      expect(filtered.description).toContain('error messages');
    });
  });

  describe('semanticTransform', () => {
    test('transforms stream items', async () => {
      const items = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      const stream = createReadableStreamFromArray(items);
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const transformed = semanticStream.semanticTransform('extract name');
      const results = await collectStreamChunks(transformed.stream);

      expect(results.length).toBe(2);
    });

    test('skips items that fail transformation', async () => {
      const items = [{ data: 'valid' }, { data: 'invalid' }];
      const stream = createReadableStreamFromArray(items);
      const client = createSequentialMockLLMClient([
        mockSemanticTransformSuccessResponse,
        { result: null, success: false },
      ]);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const transformed = semanticStream.semanticTransform('process');
      const results = await collectStreamChunks(transformed.stream);

      expect(results.length).toBe(1);
    });

    test('updates description after transform', () => {
      const stream = createReadableStreamFromArray([{ data: 'test' }]);
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const semanticStream = SemanticReadableStream.from(stream, 'Original', client);

      const transformed = semanticStream.semanticTransform('extract emails');

      expect(transformed.description).toContain('transformed');
      expect(transformed.description).toContain('extract emails');
    });
  });

  describe('validate', () => {
    test('validates stream items against rules', async () => {
      const items = [{ email: 'test@example.com' }, { email: 'invalid' }];
      const stream = createReadableStreamFromArray(items);
      const client = createSequentialMockLLMClient([
        mockValidateValidResponse,
        mockValidateInvalidResponse,
      ]);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const validated = semanticStream.validate(['email must be valid']);
      const results = await collectStreamChunks(validated.stream);

      expect(results.length).toBe(2);
      expect(results[0]?.valid).toBe(true);
      expect(results[1]?.valid).toBe(false);
      expect(results[1]?.issues.length).toBeGreaterThan(0);
    });

    test('includes original data in validation result', async () => {
      const items = [{ id: 1, name: 'Test' }];
      const stream = createReadableStreamFromArray(items);
      const client = createMockLLMClient(mockValidateValidResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const validated = semanticStream.validate(['name required']);
      const results = await collectStreamChunks(validated.stream);

      expect(results[0]?.data).toEqual({ id: 1, name: 'Test' });
    });

    test('marks valid on LLM error', async () => {
      const items = [{ data: 'test' }];
      const stream = createReadableStreamFromArray(items);
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const validated = semanticStream.validate(['some rule']);
      const results = await collectStreamChunks(validated.stream);

      expect(results[0]?.valid).toBe(true);
      expect(results[0]?.issues).toEqual([]);
    });
  });

  describe('explain', () => {
    test('explains stream content', async () => {
      const stream = createReadableStreamFromString('{"id": 1, "name": "Test"}');
      const client = createMockLLMClient(mockExplainResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const explanation = await semanticStream.explain();

      expect(explanation).toContain('JSON');
      expect(explanation).toContain('user records');
    });

    test('handles empty stream', async () => {
      const stream = createReadableStreamFromString('');
      const client = createMockLLMClient(mockExplainResponse);
      const semanticStream = SemanticReadableStream.from(stream, 'Test stream', client);

      const explanation = await semanticStream.explain();

      expect(explanation).toContain('empty');
    });

    test('falls back on LLM error', async () => {
      const stream = createReadableStreamFromString('{"data": "test"}');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const explanation = await semanticStream.explain();

      expect(explanation).toContain('json');
    });
  });

  describe('detectPatterns', () => {
    test('detects patterns in stream data', async () => {
      const stream = createReadableStreamFromString('1,2,3,4,5\n6,7,8,9,10');
      const client = createMockLLMClient(mockDetectPatternsResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.detectPatterns();

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.anomalies.length).toBeGreaterThan(0);
    });

    test('handles empty stream', async () => {
      const stream = createReadableStreamFromString('');
      const client = createMockLLMClient(mockDetectPatternsCleanResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.detectPatterns();

      expect(result.patterns).toEqual([]);
      expect(result.anomalies).toEqual([]);
    });

    test('returns empty on LLM error', async () => {
      const stream = createReadableStreamFromString('some data');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.detectPatterns();

      expect(result.patterns).toEqual([]);
      expect(result.anomalies).toEqual([]);
    });
  });

  describe('inferSchema', () => {
    test('infers schema from JSON data', async () => {
      const stream = createReadableStreamFromString('{"id": 1, "name": "Test"}');
      const client = createMockLLMClient(mockInferSchemaObjectResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.inferSchema();

      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
      expect(result.properties?.id).toBe('number');
      expect(result.properties?.name).toBe('string');
    });

    test('handles empty stream', async () => {
      const stream = createReadableStreamFromString('');
      const client = createMockLLMClient(mockInferSchemaObjectResponse);
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.inferSchema();

      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    test('falls back on LLM error', async () => {
      const stream = createReadableStreamFromString('{"a": 1}');
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticReadableStream.from(stream, undefined, client);

      const result = await semanticStream.inferSchema();

      expect(result.type).toBe('object');
      expect(result.confidence).toBeLessThan(1);
    });
  });
});

describe('SemanticReadableStream prompts', () => {
  test('createDetectContentTypePrompt includes sample', async () => {
    const { createDetectContentTypePrompt } = await import('../prompts.ts');
    const prompt = createDetectContentTypePrompt('{"test": 1}', 'API data');

    expect(prompt).toContain('{"test": 1}');
    expect(prompt).toContain('API data');
  });

  test('createSummarizePrompt includes content', async () => {
    const { createSummarizePrompt } = await import('../prompts.ts');
    const prompt = createSummarizePrompt('data content', 'Log stream');

    expect(prompt).toContain('data content');
    expect(prompt).toContain('Log stream');
  });

  test('createSemanticEqualsPrompt includes both contents', async () => {
    const { createSemanticEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticEqualsPrompt('content1', 'content2', 'test');

    expect(prompt).toContain('content1');
    expect(prompt).toContain('content2');
  });

  test('createSemanticFilterPrompt includes criteria', async () => {
    const { createSemanticFilterPrompt } = await import('../prompts.ts');
    const prompt = createSemanticFilterPrompt('item data', 'error messages');

    expect(prompt).toContain('item data');
    expect(prompt).toContain('error messages');
  });

  test('createValidatePrompt includes rules', async () => {
    const { createValidatePrompt } = await import('../prompts.ts');
    const prompt = createValidatePrompt('data', ['rule1', 'rule2']);

    expect(prompt).toContain('rule1');
    expect(prompt).toContain('rule2');
  });

  test('createExplainPrompt includes sample', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('sample data', 'API response');

    expect(prompt).toContain('sample data');
    expect(prompt).toContain('API response');
  });

  test('createDetectPatternsPrompt includes content', async () => {
    const { createDetectPatternsPrompt } = await import('../prompts.ts');
    const prompt = createDetectPatternsPrompt('pattern data');

    expect(prompt).toContain('pattern data');
  });

  test('createInferSchemaPrompt includes sample', async () => {
    const { createInferSchemaPrompt } = await import('../prompts.ts');
    const prompt = createInferSchemaPrompt('{"field": "value"}');

    expect(prompt).toContain('{"field": "value"}');
  });
});
