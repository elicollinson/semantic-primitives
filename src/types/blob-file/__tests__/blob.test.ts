import { describe, expect, test, mock } from 'bun:test';
import { SemanticBlob, type BlobLLMClientInterface } from '../blob.ts';
import type { Message } from '../../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): BlobLLMClientInterface {
  return {
    chat: mock(({ messages, systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
      // Find matching response based on system prompt or message content
      for (const [key, value] of Object.entries(responses)) {
        if (systemPrompt?.includes(key) || messages.some((m) => m.content.includes(key))) {
          return Promise.resolve({ content: value });
        }
      }
      // Default response
      return Promise.resolve({ content: '{"error": "No mock response found"}' });
    }),
  };
}

/**
 * Create a test blob with specified content
 */
function createTestBlob(content: Uint8Array, type = 'application/octet-stream'): Blob {
  const buffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type });
}

// PNG magic bytes
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// JPEG magic bytes
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
// PDF magic bytes
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

describe('SemanticBlob', () => {
  describe('constructor', () => {
    test('creates instance with Blob value', () => {
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob);
      expect(semanticBlob.type).toBe('image/png');
      expect(semanticBlob.size).toBe(8);
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      expect(semanticBlob.type).toBe('image/png');
    });
  });

  describe('static from()', () => {
    test('creates SemanticBlob from existing Blob', () => {
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = SemanticBlob.from(blob);
      expect(semanticBlob.type).toBe('image/png');
      expect(semanticBlob.size).toBe(8);
    });

    test('creates SemanticBlob from ArrayBuffer', () => {
      const buffer = PNG_MAGIC.buffer;
      const semanticBlob = SemanticBlob.from(buffer, { type: 'image/png' });
      expect(semanticBlob.type).toBe('image/png');
    });

    test('creates SemanticBlob from string', () => {
      const semanticBlob = SemanticBlob.from('Hello, World!', { type: 'text/plain' });
      expect(semanticBlob.type).toContain('text/plain');
      expect(semanticBlob.size).toBe(13);
    });

    test('creates SemanticBlob with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = SemanticBlob.from(blob, undefined, mockClient);
      expect(semanticBlob.type).toBe('image/png');
    });
  });

  describe('semanticallyEquals()', () => {
    test('compares two identical blobs', async () => {
      const mockClient = createMockLLMClient({
        'binary data comparison': JSON.stringify({
          equivalent: true,
          note: 'Identical content and type',
          confidence: 1.0,
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.semanticallyEquals(blob);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('compares two different blobs', async () => {
      const mockClient = createMockLLMClient({
        'binary data comparison': JSON.stringify({
          equivalent: false,
          note: 'Different file formats (PNG vs JPEG)',
          confidence: 0.95,
        }),
      });

      const blob1 = createTestBlob(PNG_MAGIC, 'image/png');
      const blob2 = createTestBlob(JPEG_MAGIC, 'image/jpeg');
      const semanticBlob = new SemanticBlob(blob1, mockClient);
      const result = await semanticBlob.semanticallyEquals(blob2);

      expect(result.equivalent).toBe(false);
      expect(result.note).toContain('Different');
    });

    test('identifies semantically equivalent blobs with different compression', async () => {
      const mockClient = createMockLLMClient({
        'binary data comparison': JSON.stringify({
          equivalent: true,
          note: 'Same image content, different compression levels',
          confidence: 0.85,
        }),
      });

      const blob1 = createTestBlob(PNG_MAGIC, 'image/png');
      const blob2 = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob1, mockClient);
      const result = await semanticBlob.semanticallyEquals(blob2);

      expect(result.equivalent).toBe(true);
    });
  });

  describe('detectContentType()', () => {
    test('detects PNG content type from magic bytes', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'image/png',
          mismatch: false,
          confidence: 0.99,
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.detectContentType();

      expect(result.type).toBe('image/png');
      expect(result.mismatch).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('detects mismatch between declared and actual type', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'application/octet-stream',
          mismatch: true,
          confidence: 0.95,
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'application/octet-stream');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.detectContentType();

      expect(result.type).toBe('image/png');
      expect(result.declaredType).toBe('application/octet-stream');
      expect(result.mismatch).toBe(true);
    });

    test('detects JPEG content type', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/jpeg',
          declaredType: 'image/jpeg',
          mismatch: false,
          confidence: 0.98,
        }),
      });

      const blob = createTestBlob(JPEG_MAGIC, 'image/jpeg');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.detectContentType();

      expect(result.type).toBe('image/jpeg');
    });

    test('detects PDF content type', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'application/pdf',
          declaredType: 'application/pdf',
          mismatch: false,
          confidence: 0.99,
        }),
      });

      const blob = createTestBlob(PDF_MAGIC, 'application/pdf');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.detectContentType();

      expect(result.type).toBe('application/pdf');
    });
  });

  describe('analyze()', () => {
    test('analyzes image blob', async () => {
      const mockClient = createMockLLMClient({
        'binary data analysis': JSON.stringify({
          type: 'image',
          details: {
            format: 'PNG',
            hasTransparency: true,
            estimatedDimensions: 'unknown',
          },
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.analyze();

      expect(result.type).toBe('image');
      expect(result.details.format).toBe('PNG');
    });

    test('analyzes document blob', async () => {
      const mockClient = createMockLLMClient({
        'binary data analysis': JSON.stringify({
          type: 'document',
          details: {
            format: 'PDF',
            structure: 'binary',
          },
        }),
      });

      const blob = createTestBlob(PDF_MAGIC, 'application/pdf');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.analyze();

      expect(result.type).toBe('document');
      expect(result.details.format).toBe('PDF');
    });

    test('analyzes text blob', async () => {
      const mockClient = createMockLLMClient({
        'binary data analysis': JSON.stringify({
          type: 'text',
          details: {
            encoding: 'UTF-8',
            structure: 'plain text',
          },
        }),
      });

      const textContent = new TextEncoder().encode('Hello, World!');
      const blob = createTestBlob(textContent, 'text/plain');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.analyze();

      expect(result.type).toBe('text');
    });
  });

  describe('validateFor()', () => {
    test('validates blob for profile picture use case', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: true,
          suggestions: [],
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.validateFor('profile picture');

      expect(result.valid).toBe(true);
    });

    test('invalidates blob for profile picture with issues', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: false,
          reason: 'Image size too small for profile picture (minimum 200x200)',
          suggestions: ['Use a larger image', 'Resize to at least 200x200 pixels'],
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.validateFor('profile picture');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too small');
      expect(result.suggestions).toHaveLength(2);
    });

    test('validates blob for document upload', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: true,
          suggestions: ['Consider adding metadata for better searchability'],
        }),
      });

      const blob = createTestBlob(PDF_MAGIC, 'application/pdf');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.validateFor('document upload');

      expect(result.valid).toBe(true);
    });
  });

  describe('isSafe()', () => {
    test('identifies safe blob', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'image/png',
          mismatch: false,
          confidence: 0.99,
        }),
        'file safety assessment': JSON.stringify({
          safe: true,
          warnings: [],
          scanned: ['magic-bytes', 'type-match', 'size-check'],
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.isSafe();

      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.scanned.length).toBeGreaterThan(0);
    });

    test('identifies unsafe blob with type mismatch', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'application/pdf',
          mismatch: true,
          confidence: 0.95,
        }),
        'file safety assessment': JSON.stringify({
          safe: false,
          warnings: ['Type mismatch: declared as PDF but content is PNG', 'Possible content spoofing'],
          scanned: ['magic-bytes', 'type-match'],
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'application/pdf');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.isSafe();

      expect(result.safe).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('identifies safe blob with minor warnings', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'image/png',
          mismatch: false,
          confidence: 0.99,
        }),
        'file safety assessment': JSON.stringify({
          safe: true,
          warnings: ['Large file size may impact performance'],
          scanned: ['magic-bytes', 'type-match', 'size-check'],
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.isSafe();

      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('explain()', () => {
    test('explains PNG image blob', async () => {
      const mockClient = createMockLLMClient({
        'file description': JSON.stringify({
          explanation: 'A PNG image file, commonly used for web graphics with transparency support.',
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.explain();

      expect(result).toContain('PNG');
      expect(result).toContain('image');
    });

    test('explains PDF document blob', async () => {
      const mockClient = createMockLLMClient({
        'file description': JSON.stringify({
          explanation: 'A PDF document file, a portable document format used for sharing documents.',
        }),
      });

      const blob = createTestBlob(PDF_MAGIC, 'application/pdf');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.explain();

      expect(result).toContain('PDF');
      expect(result).toContain('document');
    });

    test('explains text blob', async () => {
      const mockClient = createMockLLMClient({
        'file description': JSON.stringify({
          explanation: 'A plain text file containing human-readable text content.',
        }),
      });

      const textContent = new TextEncoder().encode('Hello, World!');
      const blob = createTestBlob(textContent, 'text/plain');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.explain();

      expect(result).toContain('text');
    });
  });

  describe('getMetadata()', () => {
    test('extracts metadata from image blob', async () => {
      const mockClient = createMockLLMClient({
        'file metadata extraction': JSON.stringify({
          type: 'image/png',
          size: 8,
          format: 'PNG',
          category: 'image',
        }),
      });

      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.getMetadata();

      expect(result.type).toBe('image/png');
      expect(result.format).toBe('PNG');
    });

    test('extracts metadata from document blob', async () => {
      const mockClient = createMockLLMClient({
        'file metadata extraction': JSON.stringify({
          type: 'application/pdf',
          size: 4,
          format: 'PDF',
          category: 'document',
        }),
      });

      const blob = createTestBlob(PDF_MAGIC, 'application/pdf');
      const semanticBlob = new SemanticBlob(blob, mockClient);
      const result = await semanticBlob.getMetadata();

      expect(result.type).toBe('application/pdf');
      expect(result.category).toBe('document');
    });
  });

  describe('valueOf()', () => {
    test('returns the underlying Blob', () => {
      const originalBlob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(originalBlob);
      const value = semanticBlob.valueOf();

      expect(value).toBe(originalBlob);
      expect(value.type).toBe('image/png');
      expect(value.size).toBe(8);
    });
  });

  describe('Blob properties', () => {
    test('type returns the MIME type', () => {
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob);
      expect(semanticBlob.type).toBe('image/png');
    });

    test('size returns the size in bytes', () => {
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob);
      expect(semanticBlob.size).toBe(8);
    });

    test('slice returns a sliced Blob', () => {
      const content = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const blob = createTestBlob(content, 'application/octet-stream');
      const semanticBlob = new SemanticBlob(blob);
      const sliced = semanticBlob.slice(0, 4);

      expect(sliced.size).toBe(4);
    });

    test('arrayBuffer returns ArrayBuffer', async () => {
      const content = new Uint8Array([1, 2, 3, 4]);
      const blob = createTestBlob(content, 'application/octet-stream');
      const semanticBlob = new SemanticBlob(blob);
      const buffer = await semanticBlob.arrayBuffer();

      expect(buffer.byteLength).toBe(4);
      expect(new Uint8Array(buffer)).toEqual(content);
    });

    test('text returns text content', async () => {
      const textContent = new TextEncoder().encode('Hello, World!');
      const blob = createTestBlob(textContent, 'text/plain');
      const semanticBlob = new SemanticBlob(blob);
      const text = await semanticBlob.text();

      expect(text).toBe('Hello, World!');
    });

    test('stream returns a ReadableStream', () => {
      const blob = createTestBlob(PNG_MAGIC, 'image/png');
      const semanticBlob = new SemanticBlob(blob);
      const stream = semanticBlob.stream();

      expect(stream).toBeInstanceOf(ReadableStream);
    });
  });
});
