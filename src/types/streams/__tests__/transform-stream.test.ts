/**
 * Unit tests for SemanticTransformStream
 */

import { describe, test, expect } from 'bun:test';
import { SemanticTransformStream } from '../transform-stream.ts';
import {
  createMockLLMClient,
  createErrorMockLLMClient,
  createSequentialMockLLMClient,
  createReadableStreamFromArray,
  collectStreamChunks,
  mockSemanticTransformSuccessResponse,
  mockSemanticTransformStringResponse,
  mockExplainTransformResponse,
} from './mocks.ts';

describe('SemanticTransformStream', () => {
  describe('from', () => {
    test('creates SemanticTransformStream from instruction', () => {
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'extract name',
        client
      );

      expect(transform).toBeInstanceOf(SemanticTransformStream);
      expect(transform.instruction).toBe('extract name');
    });
  });

  describe('properties', () => {
    test('instruction getter returns the instruction', () => {
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'parse JSON',
        client
      );

      expect(transform.instruction).toBe('parse JSON');
    });

    test('transformStream getter returns underlying TransformStream', () => {
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'process',
        client
      );

      expect(transform.transformStream).toBeInstanceOf(TransformStream);
    });

    test('readable getter returns readable side', () => {
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'process',
        client
      );

      expect(transform.readable).toBeInstanceOf(ReadableStream);
    });

    test('writable getter returns writable side', () => {
      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'process',
        client
      );

      expect(transform.writable).toBeInstanceOf(WritableStream);
    });
  });

  describe('transformation', () => {
    test('transforms data through the stream', async () => {
      const items = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      const source = createReadableStreamFromArray(items);

      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<
        { id: number; name: string },
        { name: string }
      >('extract name', client);

      const result = source.pipeThrough(transform.transformStream);
      const outputs = await collectStreamChunks(result);

      expect(outputs.length).toBe(2);
    });

    test('skips items when transform fails', async () => {
      const items = [{ data: 'valid' }, { data: 'invalid' }, { data: 'valid2' }];
      const source = createReadableStreamFromArray(items);

      const client = createSequentialMockLLMClient([
        mockSemanticTransformSuccessResponse,
        { result: null, success: false },
        mockSemanticTransformSuccessResponse,
      ]);
      const transform = SemanticTransformStream.from<object, object>(
        'process',
        client
      );

      const result = source.pipeThrough(transform.transformStream);
      const outputs = await collectStreamChunks(result);

      expect(outputs.length).toBe(2);
    });

    test('transforms to string output', async () => {
      const items = [{ email: 'test@example.com' }];
      const source = createReadableStreamFromArray(items);

      const client = createMockLLMClient(mockSemanticTransformStringResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'extract email',
        client
      );

      const result = source.pipeThrough(transform.transformStream);
      const outputs = await collectStreamChunks(result);

      expect(outputs[0]).toBe('john@example.com');
    });

    test('handles LLM errors gracefully', async () => {
      const items = [{ data: 'test' }];
      const source = createReadableStreamFromArray(items);

      const client = createErrorMockLLMClient(new Error('LLM error'));
      const transform = SemanticTransformStream.from<object, object>(
        'process',
        client
      );

      const result = source.pipeThrough(transform.transformStream);
      const outputs = await collectStreamChunks(result);

      // Items are skipped on error
      expect(outputs.length).toBe(0);
    });
  });

  describe('pipeFrom', () => {
    test('pipes source through transform', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const source = createReadableStreamFromArray(items);

      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, object>(
        'process',
        client
      );

      const result = transform.pipeFrom(source);
      const outputs = await collectStreamChunks(result);

      expect(outputs.length).toBe(2);
    });

    test('returns a ReadableStream', () => {
      const items = [{ id: 1 }];
      const source = createReadableStreamFromArray(items);

      const client = createMockLLMClient(mockSemanticTransformSuccessResponse);
      const transform = SemanticTransformStream.from<object, object>(
        'process',
        client
      );

      const result = transform.pipeFrom(source);

      expect(result).toBeInstanceOf(ReadableStream);
    });
  });

  describe('explain', () => {
    test('returns synchronous explanation', () => {
      const client = createMockLLMClient(mockExplainTransformResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'extract name from JSON',
        client
      );

      const explanation = transform.explain();

      expect(explanation).toContain('extract name from JSON');
    });

    test('caches explanation from explainAsync', async () => {
      const client = createMockLLMClient(mockExplainTransformResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'extract name',
        client
      );

      const asyncExplanation = await transform.explainAsync();
      const syncExplanation = transform.explain();

      expect(syncExplanation).toBe(asyncExplanation);
    });
  });

  describe('explainAsync', () => {
    test('explains transform using LLM', async () => {
      const client = createMockLLMClient(mockExplainTransformResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'extract name',
        client
      );

      const explanation = await transform.explainAsync();

      expect(explanation).toContain('name field');
    });

    test('falls back to sync explanation on LLM error', async () => {
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const transform = SemanticTransformStream.from<object, string>(
        'extract email',
        client
      );

      const explanation = await transform.explainAsync();

      expect(explanation).toContain('extract email');
    });

    test('caches explanation', async () => {
      const client = createMockLLMClient(mockExplainTransformResponse);
      const transform = SemanticTransformStream.from<object, string>(
        'extract name',
        client
      );

      const explanation1 = await transform.explainAsync();
      const explanation2 = await transform.explainAsync();

      expect(explanation1).toBe(explanation2);
      // Should only call LLM once - check via mock
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(client.complete).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SemanticTransformStream prompts', () => {
  test('createSemanticTransformPrompt includes instruction', async () => {
    const { createSemanticTransformPrompt } = await import('../prompts.ts');
    const prompt = createSemanticTransformPrompt(
      '{"name": "John"}',
      'extract the name field'
    );

    expect(prompt).toContain('{"name": "John"}');
    expect(prompt).toContain('extract the name field');
  });

  test('createExplainTransformPrompt includes instruction', async () => {
    const { createExplainTransformPrompt } = await import('../prompts.ts');
    const prompt = createExplainTransformPrompt('parse JSON and extract emails');

    expect(prompt).toContain('parse JSON and extract emails');
  });
});
