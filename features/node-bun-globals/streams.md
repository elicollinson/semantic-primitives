# SemanticStream

## Overview

The `SemanticStream` types (SemanticReadableStream, SemanticWritableStream, SemanticTransformStream) wrap web streams with LLM-powered semantic understanding. They enable content analysis, intelligent transformations, and stream type detection.

**Core Principle**: Streams represent flowing data - semantic operations should understand content types, detect patterns, and enable intelligent processing.

---

## Interface

```typescript
interface SemanticReadableStream<T> extends ReadableStream<T> {
  /**
   * Wrap an existing ReadableStream with semantic capabilities.
   *
   * @param stream - Stream to wrap
   * @param description - Optional description of stream contents
   * @returns SemanticReadableStream
   *
   * @example
   * SemanticReadableStream.from(fetch(url).then(r => r.body), "API response")
   */
  static from<T>(
    stream: ReadableStream<T>,
    description?: string
  ): SemanticReadableStream<T>;

  /**
   * Check if two streams are semantically equivalent (same content/meaning).
   *
   * @param other - Stream to compare
   * @returns Equivalence result (after consuming both streams)
   *
   * @example
   * stream1.semanticallyEquals(stream2)
   * // { equivalent: true, confidence: 0.95 }
   */
  semanticallyEquals(other: ReadableStream<T>): Promise<{
    equivalent: boolean;
    confidence: number;
  }>;

  /**
   * Detect the content type of the stream data.
   *
   * @param sampleSize - Bytes to sample for detection
   * @returns Content type detection result
   *
   * @example
   * stream.detectContentType()
   * // { type: "json", format: "ndjson", confidence: 0.92 }
   */
  detectContentType(sampleSize?: number): Promise<{
    type: string;
    format?: string;
    confidence: number;
  }>;

  /**
   * Summarize the stream contents (consumes stream).
   *
   * @returns Content summary
   *
   * @example
   * logStream.summarize()
   * // "1,500 log entries over 24 hours. 45 errors, 120 warnings. Peak activity at 2PM UTC."
   */
  summarize(): Promise<string>;

  /**
   * Filter stream data using semantic criteria.
   *
   * @param criteria - Natural language filter
   * @returns Filtered stream
   *
   * @example
   * logStream.semanticFilter("error messages related to authentication")
   */
  semanticFilter(criteria: string): SemanticReadableStream<T>;

  /**
   * Transform stream using natural language instructions.
   *
   * @param instruction - Transformation instruction
   * @returns Transformed stream
   *
   * @example
   * dataStream.semanticTransform("extract only email addresses")
   */
  semanticTransform<U>(instruction: string): SemanticReadableStream<U>;

  /**
   * Validate stream data against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation stream (emits validation results)
   *
   * @example
   * userStream.validate(["email must be valid", "age must be positive"])
   */
  validate(rules: string[]): SemanticReadableStream<{
    data: T;
    valid: boolean;
    issues: string[];
  }>;

  /**
   * Explain what this stream contains.
   *
   * @param sampleSize - Data to sample for explanation
   * @returns Human-readable explanation
   *
   * @example
   * stream.explain()
   * // "JSON stream of user records with id, name, and email fields"
   */
  explain(sampleSize?: number): Promise<string>;

  /**
   * Detect patterns in stream data.
   *
   * @returns Detected patterns
   *
   * @example
   * timeSeriesStream.detectPatterns()
   * // { patterns: ["daily cycle", "upward trend"], anomalies: [...] }
   */
  detectPatterns(): Promise<{
    patterns: string[];
    anomalies: Array<{ index: number; reason: string }>;
  }>;

  /**
   * Infer the schema of stream elements.
   *
   * @returns Inferred schema
   *
   * @example
   * jsonStream.inferSchema()
   * // { type: "object", properties: { id: "number", name: "string" } }
   */
  inferSchema(): Promise<{
    type: string;
    properties?: Record<string, string>;
    confidence: number;
  }>;
}

interface SemanticWritableStream<T> extends WritableStream<T> {
  /**
   * Wrap a WritableStream with semantic capabilities.
   *
   * @param stream - Stream to wrap
   * @returns SemanticWritableStream
   */
  static from<T>(stream: WritableStream<T>): SemanticWritableStream<T>;

  /**
   * Validate data before writing.
   *
   * @param rules - Validation rules
   * @returns Validating writable stream
   */
  withValidation(rules: string[]): SemanticWritableStream<T>;

  /**
   * Get statistics about written data.
   *
   * @returns Write statistics
   */
  getStats(): Promise<{
    chunksWritten: number;
    bytesWritten: number;
    errorCount: number;
  }>;
}

interface SemanticTransformStream<I, O> extends TransformStream<I, O> {
  /**
   * Create a transform stream from natural language instruction.
   *
   * @param instruction - What transformation to perform
   * @returns Transform stream
   *
   * @example
   * SemanticTransformStream.from("parse JSON and extract names")
   */
  static from<I, O>(instruction: string): SemanticTransformStream<I, O>;

  /**
   * Explain what this transform does.
   *
   * @returns Transformation description
   */
  explain(): string;
}
```

---

## Implementation Notes

### Implementation Details

The streams implementation is located in `src/types/streams/` with the following structure:

```
src/types/streams/
├── streams.ts          # Main implementation with all three stream classes
├── prompts.ts          # LLM prompt templates for all operations
├── index.ts            # Public API exports
└── __tests__/
    ├── streams.test.ts # Comprehensive unit tests
    └── mocks.ts        # Mock LLM responses for testing
```

### Design Decisions

1. **Composition over Inheritance**: The semantic stream classes wrap native streams rather than extending them, avoiding issues with native class extension and maintaining flexibility.

2. **Stream Tee for Sampling**: `detectContentType()`, `explain()`, and `inferSchema()` use `stream.tee()` internally to sample data without consuming the entire stream.

3. **Lazy LLM Calls**: Transform operations (`semanticFilter`, `semanticTransform`, `validate`) create new streams that call the LLM lazily as chunks flow through, enabling efficient processing of large streams.

4. **Stats Tracking via Shared Object**: The `withValidation()` method shares the stats object between the original and validating stream instances using `Object.defineProperty`.

5. **Synchronous `getStats()`**: Changed from async to sync since it only returns cached statistics without any async operations.

6. **Cached Transform Explanation**: `SemanticTransformStream.explain()` caches results to avoid redundant LLM calls.

### Differences from Spec

1. **`explain()` is async**: The `SemanticTransformStream.explain()` returns `Promise<string>` instead of `string` since it requires an LLM call.

2. **Additional Methods**:
   - `valueOf()`: Returns the underlying native stream
   - `getReader()` / `getWriter()`: Direct access to stream readers/writers
   - `getExplanationDetails()`: Returns full explanation details including input/output types

3. **`getStats()` is synchronous**: Returns cached stats immediately rather than as a Promise.

### Testing Approach

- All 43 tests use mocked LLM clients to avoid actual API calls
- Mock responses defined in `mocks.ts` for consistent testing
- Integration tests verify stream piping and chaining work correctly
- Helper functions provided for creating test streams and collecting chunks

### Exported Types

```typescript
export {
  SemanticReadableStream,
  SemanticWritableStream,
  SemanticTransformStream,
  type ContentTypeResult,
  type StreamPatternResult,
  type StreamSchemaResult,
  type StreamValidationResult,
  type WriteStats,
  type TransformExplanation,
} from './streams/index.ts';
```
