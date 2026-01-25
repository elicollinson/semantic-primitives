import { describe, expect, test, mock } from 'bun:test';
import { SemanticFile, type FileLLMClientInterface } from '../file.ts';
import { SemanticDate } from '../../date/date.ts';
import type { Message } from '../../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): FileLLMClientInterface {
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
 * Create a test file with specified content
 */
function createTestFile(
  content: Uint8Array,
  filename: string,
  type = 'application/octet-stream'
): File {
  const buffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
  return new File([buffer], filename, { type, lastModified: Date.now() });
}

// PNG magic bytes
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// JPEG magic bytes
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
// PDF magic bytes
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

describe('SemanticFile', () => {
  describe('constructor', () => {
    test('creates instance with File value', () => {
      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      expect(semanticFile.name).toBe('test.png');
      expect(semanticFile.type).toBe('image/png');
      expect(semanticFile.size).toBe(8);
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      expect(semanticFile.name).toBe('test.png');
    });

    test('preserves lastModified timestamp', () => {
      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      expect(semanticFile.lastModified).toBe(file.lastModified);
    });
  });

  describe('static fromFile()', () => {
    test('creates SemanticFile from existing File', () => {
      const file = createTestFile(PNG_MAGIC, 'image.png', 'image/png');
      const semanticFile = SemanticFile.fromFile(file);
      expect(semanticFile.name).toBe('image.png');
      expect(semanticFile.type).toBe('image/png');
    });

    test('creates SemanticFile from Blob with filename', () => {
      const buffer = PNG_MAGIC.buffer.slice(PNG_MAGIC.byteOffset, PNG_MAGIC.byteOffset + PNG_MAGIC.byteLength);
      const blob = new Blob([buffer], { type: 'image/png' });
      const semanticFile = SemanticFile.fromFile(blob, 'converted.png');
      expect(semanticFile.name).toBe('converted.png');
      expect(semanticFile.type).toBe('image/png');
    });

    test('creates SemanticFile from Blob without filename uses default', () => {
      const buffer = PNG_MAGIC.buffer.slice(PNG_MAGIC.byteOffset, PNG_MAGIC.byteOffset + PNG_MAGIC.byteLength);
      const blob = new Blob([buffer], { type: 'image/png' });
      const semanticFile = SemanticFile.fromFile(blob);
      expect(semanticFile.name).toBe('unnamed');
    });

    test('creates SemanticFile with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = SemanticFile.fromFile(file, undefined, mockClient);
      expect(semanticFile.name).toBe('test.png');
    });
  });

  describe('validateFilename()', () => {
    test('validates filename with no rules', async () => {
      const mockClient = createMockLLMClient({
        'filename validation': JSON.stringify({
          valid: true,
          issues: [],
          suggestions: [],
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'valid-file.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateFilename();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('validates filename against no-spaces rule', async () => {
      const mockClient = createMockLLMClient({
        'filename validation': JSON.stringify({
          valid: false,
          issues: ['Filename contains spaces'],
          suggestions: ['my-document.pdf', 'my_document.pdf'],
        }),
      });

      const file = createTestFile(PDF_MAGIC, 'my document.pdf', 'application/pdf');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateFilename(['no spaces']);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Filename contains spaces');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('validates filename against lowercase rule', async () => {
      const mockClient = createMockLLMClient({
        'filename validation': JSON.stringify({
          valid: false,
          issues: ['Filename contains uppercase characters'],
          suggestions: ['myfile.txt'],
        }),
      });

      const textContent = new TextEncoder().encode('Hello');
      const file = createTestFile(textContent, 'MyFile.txt', 'text/plain');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateFilename(['lowercase only']);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Filename contains uppercase characters');
    });

    test('validates filename against multiple rules', async () => {
      const mockClient = createMockLLMClient({
        'filename validation': JSON.stringify({
          valid: false,
          issues: ['Filename contains spaces', 'Filename contains uppercase characters'],
          suggestions: ['my-file.pdf'],
        }),
      });

      const file = createTestFile(PDF_MAGIC, 'My File.pdf', 'application/pdf');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateFilename(['no spaces', 'lowercase only']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
    });

    test('passes validation for conforming filename', async () => {
      const mockClient = createMockLLMClient({
        'filename validation': JSON.stringify({
          valid: true,
          issues: [],
          suggestions: [],
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'my-image.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateFilename(['no spaces', 'lowercase only']);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateExtension()', () => {
    test('validates matching extension and content', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'image/png',
          mismatch: false,
          confidence: 0.99,
        }),
        'file extension validation': JSON.stringify({
          matches: true,
          actualType: 'image/png',
          expectedType: 'image/png',
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'image.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateExtension();

      expect(result.matches).toBe(true);
      expect(result.actualType).toBe('image/png');
    });

    test('detects mismatched extension and content', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'image/jpeg',
          mismatch: true,
          confidence: 0.95,
        }),
        'file extension validation': JSON.stringify({
          matches: false,
          actualType: 'image/png',
          expectedType: 'image/jpeg',
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'image.jpg', 'image/jpeg');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateExtension();

      expect(result.matches).toBe(false);
      expect(result.actualType).toBe('image/png');
      expect(result.expectedType).toBe('image/jpeg');
    });

    test('validates PDF extension', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'application/pdf',
          declaredType: 'application/pdf',
          mismatch: false,
          confidence: 0.99,
        }),
        'file extension validation': JSON.stringify({
          matches: true,
          actualType: 'application/pdf',
          expectedType: 'application/pdf',
        }),
      });

      const file = createTestFile(PDF_MAGIC, 'document.pdf', 'application/pdf');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateExtension();

      expect(result.matches).toBe(true);
    });
  });

  describe('inferCategory()', () => {
    test('infers document category for PDF', async () => {
      const mockClient = createMockLLMClient({
        'file categorization': JSON.stringify({
          category: 'document',
          subcategory: 'pdf',
          confidence: 0.95,
        }),
      });

      const file = createTestFile(PDF_MAGIC, 'report.pdf', 'application/pdf');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.inferCategory();

      expect(result.category).toBe('document');
      expect(result.subcategory).toBe('pdf');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('infers image category for PNG', async () => {
      const mockClient = createMockLLMClient({
        'file categorization': JSON.stringify({
          category: 'image',
          subcategory: 'photo',
          confidence: 0.92,
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'photo.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.inferCategory();

      expect(result.category).toBe('image');
    });

    test('infers spreadsheet subcategory', async () => {
      const mockClient = createMockLLMClient({
        'file categorization': JSON.stringify({
          category: 'document',
          subcategory: 'spreadsheet',
          confidence: 0.88,
        }),
      });

      const content = new TextEncoder().encode('A,B,C\n1,2,3');
      const file = createTestFile(content, 'data.csv', 'text/csv');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.inferCategory();

      expect(result.category).toBe('document');
      expect(result.subcategory).toBe('spreadsheet');
    });

    test('infers code category for source files', async () => {
      const mockClient = createMockLLMClient({
        'file categorization': JSON.stringify({
          category: 'code',
          subcategory: 'source',
          confidence: 0.94,
        }),
      });

      const content = new TextEncoder().encode('function hello() {}');
      const file = createTestFile(content, 'app.js', 'application/javascript');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.inferCategory();

      expect(result.category).toBe('code');
      expect(result.subcategory).toBe('source');
    });
  });

  describe('suggestFilename()', () => {
    test('suggests descriptive filename for image', async () => {
      const mockClient = createMockLLMClient({
        'filename suggestion': JSON.stringify({
          suggested: 'landscape-photo.png',
          reason: 'Based on image content analysis suggesting a landscape photograph',
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'IMG_001.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.suggestFilename();

      expect(result.suggested).toBe('landscape-photo.png');
      expect(result.reason).toContain('landscape');
    });

    test('suggests filename based on document content', async () => {
      const mockClient = createMockLLMClient({
        'filename suggestion': JSON.stringify({
          suggested: 'invoice-2024-01.pdf',
          reason: 'Based on document content indicating an invoice from January 2024',
        }),
      });

      const file = createTestFile(PDF_MAGIC, 'document.pdf', 'application/pdf');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.suggestFilename();

      expect(result.suggested).toBe('invoice-2024-01.pdf');
      expect(result.reason).toContain('invoice');
    });

    test('suggests filename with proper extension', async () => {
      const mockClient = createMockLLMClient({
        'filename suggestion': JSON.stringify({
          suggested: 'profile-picture.jpg',
          reason: 'Based on content appearing to be a portrait photograph',
        }),
      });

      const file = createTestFile(JPEG_MAGIC, 'upload.jpg', 'image/jpeg');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.suggestFilename();

      expect(result.suggested).toContain('.jpg');
    });

    test('suggests filename for code file', async () => {
      const mockClient = createMockLLMClient({
        'filename suggestion': JSON.stringify({
          suggested: 'api-handler.ts',
          reason: 'Based on code content handling API requests',
        }),
      });

      const content = new TextEncoder().encode('export function handleRequest() {}');
      const file = createTestFile(content, 'file.ts', 'text/typescript');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.suggestFilename();

      expect(result.suggested).toContain('.ts');
    });
  });

  describe('getLastModified()', () => {
    test('returns SemanticDate instance', () => {
      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      const lastModified = semanticFile.getLastModified();

      expect(lastModified).toBeInstanceOf(SemanticDate);
    });

    test('returns correct date value', () => {
      const now = Date.now();
      const file = new File([PNG_MAGIC], 'test.png', { type: 'image/png', lastModified: now });
      const semanticFile = new SemanticFile(file);
      const lastModified = semanticFile.getLastModified();

      expect(lastModified.valueOf().getTime()).toBe(now);
    });
  });

  describe('valueOf()', () => {
    test('returns the underlying File', () => {
      const originalFile = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(originalFile);
      const value = semanticFile.valueOf();

      expect(value).toBe(originalFile);
      expect(value.name).toBe('test.png');
    });
  });

  describe('File properties', () => {
    test('name returns the filename', () => {
      const file = createTestFile(PNG_MAGIC, 'my-image.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      expect(semanticFile.name).toBe('my-image.png');
    });

    test('lastModified returns the timestamp', () => {
      const timestamp = 1704067200000; // 2024-01-01
      const file = new File([PNG_MAGIC], 'test.png', { type: 'image/png', lastModified: timestamp });
      const semanticFile = new SemanticFile(file);
      expect(semanticFile.lastModified).toBe(timestamp);
    });

    test('type returns the MIME type', () => {
      const file = createTestFile(PNG_MAGIC, 'image.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      expect(semanticFile.type).toBe('image/png');
    });

    test('size returns the file size', () => {
      const file = createTestFile(PNG_MAGIC, 'image.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      expect(semanticFile.size).toBe(8);
    });

    test('webkitRelativePath is accessible', () => {
      const file = createTestFile(PNG_MAGIC, 'image.png', 'image/png');
      const semanticFile = new SemanticFile(file);
      // webkitRelativePath may be empty string or undefined depending on runtime
      expect(semanticFile.webkitRelativePath === '' || semanticFile.webkitRelativePath === undefined).toBe(true);
    });
  });

  describe('inherited SemanticBlob methods', () => {
    test('detectContentType works on SemanticFile', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'image/png',
          declaredType: 'image/png',
          mismatch: false,
          confidence: 0.99,
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.detectContentType();

      expect(result.type).toBe('image/png');
    });

    test('analyze works on SemanticFile', async () => {
      const mockClient = createMockLLMClient({
        'binary data analysis': JSON.stringify({
          type: 'image',
          details: {
            format: 'PNG',
          },
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.analyze();

      expect(result.type).toBe('image');
    });

    test('validateFor works on SemanticFile', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: true,
          suggestions: [],
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'profile.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.validateFor('profile picture');

      expect(result.valid).toBe(true);
    });

    test('isSafe works on SemanticFile', async () => {
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
          scanned: ['magic-bytes'],
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'safe.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.isSafe();

      expect(result.safe).toBe(true);
    });

    test('explain works on SemanticFile', async () => {
      const mockClient = createMockLLMClient({
        'file description': JSON.stringify({
          explanation: 'A PNG image file named test.png',
        }),
      });

      const file = createTestFile(PNG_MAGIC, 'test.png', 'image/png');
      const semanticFile = new SemanticFile(file, mockClient);
      const result = await semanticFile.explain();

      expect(result).toContain('PNG');
    });
  });
});
