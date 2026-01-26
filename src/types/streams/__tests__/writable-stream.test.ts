/**
 * Unit tests for SemanticWritableStream
 */

import { describe, test, expect } from 'bun:test';
import { SemanticWritableStream } from '../writable-stream.ts';
import {
  createMockLLMClient,
  createErrorMockLLMClient,
  createSequentialMockLLMClient,
  createCollectingWritableStream,
  mockWriteValidationValidResponse,
  mockWriteValidationInvalidResponse,
} from './mocks.ts';

describe('SemanticWritableStream', () => {
  describe('from', () => {
    test('creates SemanticWritableStream from WritableStream', () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      expect(semanticStream).toBeInstanceOf(SemanticWritableStream);
    });

    test('returns same instance if already SemanticWritableStream', () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);
      const rewrapped = SemanticWritableStream.from(
        semanticStream as unknown as WritableStream<string>,
        client
      );

      expect(rewrapped).toBe(semanticStream);
    });
  });

  describe('stream access', () => {
    test('stream getter returns underlying stream', () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      expect(semanticStream.stream).toBe(stream);
    });

    test('getWriter returns a writer', () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const writer = semanticStream.getWriter();

      expect(writer).toBeDefined();
      expect(typeof writer.write).toBe('function');
    });
  });

  describe('write', () => {
    test('writes data to the stream', async () => {
      const { stream, chunks } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write('test data');
      semanticStream.releaseLock();

      expect(chunks).toContain('test data');
    });

    test('tracks chunks written', async () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write('chunk1');
      await semanticStream.write('chunk2');
      await semanticStream.write('chunk3');

      const stats = await semanticStream.getStats();

      expect(stats.chunksWritten).toBe(3);
    });

    test('tracks bytes written for string data', async () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write('hello');

      const stats = await semanticStream.getStats();

      expect(stats.bytesWritten).toBe(5);
    });

    test('tracks bytes written for Uint8Array', async () => {
      const { stream } = createCollectingWritableStream<Uint8Array>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write(new Uint8Array([1, 2, 3, 4, 5]));

      const stats = await semanticStream.getStats();

      expect(stats.bytesWritten).toBe(5);
    });

    test('tracks bytes written for objects', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write({ key: 'value' });

      const stats = await semanticStream.getStats();

      expect(stats.bytesWritten).toBeGreaterThan(0);
    });
  });

  describe('close', () => {
    test('closes the stream', async () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write('data');
      await semanticStream.close();

      // Stream should be closed - trying to get another writer should fail
      expect(() => stream.getWriter()).toThrow();
    });
  });

  describe('releaseLock', () => {
    test('releases the writer lock', () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      semanticStream.getWriter();
      semanticStream.releaseLock();

      // Should be able to get another writer
      const newWriter = stream.getWriter();
      expect(newWriter).toBeDefined();
    });
  });

  describe('withValidation', () => {
    test('creates new stream with validation rules', () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream.withValidation(['id must exist']);

      expect(validating).toBeInstanceOf(SemanticWritableStream);
    });

    test('validates data before writing', async () => {
      const { stream, chunks } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream.withValidation(['id must exist']);
      await validating.write({ id: 1 });
      validating.releaseLock();

      expect(chunks.length).toBe(1);
    });

    test('rejects invalid data', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationInvalidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream.withValidation(['id must exist']);

      let threw = false;
      try {
        await validating.write({ name: 'no id' });
      } catch (error) {
        threw = true;
        expect((error as Error).message).toBe('Chunk failed validation');
      }
      expect(threw).toBe(true);
    });

    test('increments error count on validation failure', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationInvalidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream.withValidation(['id must exist']);

      try {
        await validating.write({ name: 'no id' });
      } catch {
        // Expected
      }

      const stats = await validating.getStats();
      expect(stats.errorCount).toBe(1);
    });

    test('uses basic validation on LLM error', async () => {
      const { stream, chunks } = createCollectingWritableStream<object>();
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream.withValidation(['some rule']);
      await validating.write({ data: 'test' });
      validating.releaseLock();

      // Basic validation allows non-null values
      expect(chunks.length).toBe(1);
    });

    test('basic validation rejects null when required rule exists', async () => {
      const { stream } = createCollectingWritableStream<object | null>();
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream.withValidation(['field is required']);

      let threw = false;
      try {
        await validating.write(null);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    test('combines multiple withValidation calls', async () => {
      const { stream, chunks } = createCollectingWritableStream<object>();
      const client = createSequentialMockLLMClient([
        mockWriteValidationValidResponse,
        mockWriteValidationValidResponse,
      ]);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const validating = semanticStream
        .withValidation(['rule1'])
        .withValidation(['rule2']);

      await validating.write({ data: 'test' });
      validating.releaseLock();

      expect(chunks.length).toBe(1);
    });

    test('marks original instance as transferred', () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      expect(semanticStream.isTransferred).toBe(false);

      semanticStream.withValidation(['rule']);

      expect(semanticStream.isTransferred).toBe(true);
    });

    test('throws when writing to transferred instance', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      semanticStream.withValidation(['rule']);

      let threw = false;
      try {
        await semanticStream.write({ data: 'test' });
      } catch (error) {
        threw = true;
        expect((error as Error).message).toContain('transferred');
      }
      expect(threw).toBe(true);
    });

    test('throws when getting writer from transferred instance', () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      semanticStream.withValidation(['rule']);

      expect(() => semanticStream.getWriter()).toThrow(/transferred/);
    });

    test('throws when closing transferred instance', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      semanticStream.withValidation(['rule']);

      let threw = false;
      try {
        await semanticStream.close();
      } catch (error) {
        threw = true;
        expect((error as Error).message).toContain('transferred');
      }
      expect(threw).toBe(true);
    });

    test('throws when calling withValidation on transferred instance', () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      semanticStream.withValidation(['rule1']);

      expect(() => semanticStream.withValidation(['rule2'])).toThrow(/transferred/);
    });

    test('shares statistics across validation wrappers', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const base = SemanticWritableStream.from(stream, client);

      const validated = base.withValidation(['rule']);

      await validated.write({ data: 'test1' });
      await validated.write({ data: 'test2' });

      // Stats should be visible from the wrapper
      const stats = await validated.getStats();
      expect(stats.chunksWritten).toBe(2);
    });

    test('shares statistics across chained validation wrappers', async () => {
      const { stream } = createCollectingWritableStream<object>();
      const client = createSequentialMockLLMClient([
        mockWriteValidationValidResponse,
        mockWriteValidationValidResponse,
        mockWriteValidationValidResponse,
      ]);
      const base = SemanticWritableStream.from(stream, client);

      const validated1 = base.withValidation(['rule1']);
      const validated2 = validated1.withValidation(['rule2']);

      await validated2.write({ data: 'test' });

      // Stats should be shared across the chain
      const stats = await validated2.getStats();
      expect(stats.chunksWritten).toBe(1);
    });

    test('prevents writer lock conflicts by using shared writer', async () => {
      const { stream, chunks } = createCollectingWritableStream<object>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const base = SemanticWritableStream.from(stream, client);

      const validated = base.withValidation(['rule']);

      // Write through the validated wrapper - should work
      await validated.write({ data: 'a' });
      await validated.write({ data: 'b' });

      validated.releaseLock();

      expect(chunks.length).toBe(2);
    });
  });

  describe('getStats', () => {
    test('returns initial stats', async () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      const stats = await semanticStream.getStats();

      expect(stats.chunksWritten).toBe(0);
      expect(stats.bytesWritten).toBe(0);
      expect(stats.errorCount).toBe(0);
    });

    test('accumulates stats over multiple writes', async () => {
      const { stream } = createCollectingWritableStream<string>();
      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(stream, client);

      await semanticStream.write('hello');
      await semanticStream.write('world');
      await semanticStream.write('!');

      const stats = await semanticStream.getStats();

      expect(stats.chunksWritten).toBe(3);
      expect(stats.bytesWritten).toBe(11); // 'hello' + 'world' + '!'
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('error handling', () => {
    test('tracks errors when write fails', async () => {
      let writeCount = 0;
      const failingStream = new WritableStream<string>({
        write() {
          writeCount++;
          if (writeCount > 1) {
            throw new Error('Write failed');
          }
        },
      });

      const client = createMockLLMClient(mockWriteValidationValidResponse);
      const semanticStream = SemanticWritableStream.from(failingStream, client);

      await semanticStream.write('success');
      try {
        await semanticStream.write('fail');
      } catch {
        // Expected
      }

      const stats = await semanticStream.getStats();

      expect(stats.chunksWritten).toBe(1);
      expect(stats.errorCount).toBe(1);
    });
  });
});

describe('SemanticWritableStream prompts', () => {
  test('createWriteValidationPrompt includes data and rules', async () => {
    const { createWriteValidationPrompt } = await import('../prompts.ts');
    const prompt = createWriteValidationPrompt('{"id": 1}', [
      'id must be positive',
      'name is required',
    ]);

    expect(prompt).toContain('{"id": 1}');
    expect(prompt).toContain('id must be positive');
    expect(prompt).toContain('name is required');
  });
});
