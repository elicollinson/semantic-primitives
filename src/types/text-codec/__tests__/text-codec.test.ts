import { describe, expect, test } from 'bun:test';
import {
  SemanticTextEncoder,
  SemanticTextDecoder,
  SemanticTextCodec,
} from '../text-codec.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockDetectEncodingUtf8Response,
  mockDetectEncodingShiftJisResponse,
  mockRepairMojibakeResponse,
  mockRepairMojibakeNoCorruptionResponse,
  mockCanEncodeSuccessResponse,
  mockCanEncodeFailureResponse,
  mockAreEquivalentTrueResponse,
  mockAreEquivalentFalseResponse,
  mockValidateEncodingValidResponse,
  mockValidateEncodingInvalidResponse,
  mockSuggestEncodingUtf8Response,
  mockSuggestEncodingLegacyResponse,
  mockExplainErrorResponse,
  mockDecodeWithAnalysisCleanResponse,
  mockDecodeWithAnalysisIssuesResponse,
} from './mocks.ts';

// =============================================================================
// SEMANTIC TEXT ENCODER TESTS
// =============================================================================

describe('SemanticTextEncoder', () => {
  describe('constructor', () => {
    test('creates instance with default UTF-8 encoding', () => {
      const encoder = new SemanticTextEncoder();
      expect(encoder.encoding).toBe('utf-8');
    });

    test('creates instance with specified encoding', () => {
      const encoder = new SemanticTextEncoder('utf-8');
      expect(encoder.encoding).toBe('utf-8');
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const encoder = new SemanticTextEncoder('utf-8', mockClient);
      expect(encoder.encoding).toBe('utf-8');
    });
  });

  describe('static create()', () => {
    test('creates SemanticTextEncoder instance', () => {
      const encoder = SemanticTextEncoder.create();
      expect(encoder).toBeInstanceOf(SemanticTextEncoder);
      expect(encoder.encoding).toBe('utf-8');
    });

    test('creates instance with specified encoding', () => {
      const encoder = SemanticTextEncoder.create('utf-8');
      expect(encoder.encoding).toBe('utf-8');
    });
  });

  describe('encode()', () => {
    test('encodes ASCII text', () => {
      const encoder = new SemanticTextEncoder();
      const bytes = encoder.encode('Hello');
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(5);
      expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
    });

    test('encodes Unicode text', () => {
      const encoder = new SemanticTextEncoder();
      const bytes = encoder.encode('Hello 世界');
      expect(bytes).toBeInstanceOf(Uint8Array);
      // "Hello " is 6 bytes, "世界" is 6 bytes (3 bytes each in UTF-8)
      expect(bytes.length).toBe(12);
    });

    test('encodes empty string', () => {
      const encoder = new SemanticTextEncoder();
      const bytes = encoder.encode('');
      expect(bytes.length).toBe(0);
    });

    test('encodes emoji correctly', () => {
      const encoder = new SemanticTextEncoder();
      const bytes = encoder.encode('Hello 👋');
      expect(bytes).toBeInstanceOf(Uint8Array);
      // "Hello " is 6 bytes, emoji is 4 bytes in UTF-8
      expect(bytes.length).toBe(10);
    });
  });

  describe('encodeInto()', () => {
    test('encodes text into existing buffer', () => {
      const encoder = new SemanticTextEncoder();
      const destination = new Uint8Array(10);
      const result = encoder.encodeInto('Hello', destination);
      expect(result.read).toBe(5);
      expect(result.written).toBe(5);
      expect(destination.slice(0, 5)).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    test('handles buffer too small', () => {
      const encoder = new SemanticTextEncoder();
      const destination = new Uint8Array(3);
      const result = encoder.encodeInto('Hello', destination);
      expect(result.written).toBe(3);
    });
  });

  describe('encodeWithAnalysis()', () => {
    test('encodes ASCII text with no warnings', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('Hello World');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.warnings).toHaveLength(0);
      expect(result.hasNonAscii).toBe(false);
      expect(result.byteLength).toBe(11);
    });

    test('detects non-ASCII characters', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('Hello 世界');
      expect(result.hasNonAscii).toBe(true);
      expect(result.byteLength).toBe(12);
    });

    test('warns about null bytes', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('Hello\0World');
      expect(result.warnings).toContain('Text contains null bytes which may cause issues in some systems');
    });

    test('warns about BOM character', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('\uFEFFHello');
      expect(result.warnings).toContain('Text contains BOM character which may not be intended');
    });

    test('warns about private use area characters', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('Hello \uE000');
      expect(result.warnings).toContain('Text contains private use area characters');
    });

    test('warns when encoding non-ASCII as ASCII', () => {
      const encoder = new SemanticTextEncoder('ascii');
      const result = encoder.encodeWithAnalysis('Hello 世界');
      expect(result.warnings).toContain('Text contains non-ASCII characters that cannot be represented in ASCII');
    });
  });

  describe('canEncode()', () => {
    test('returns success for encodable text', async () => {
      const mockClient = createMockLLMClient(mockCanEncodeSuccessResponse);
      const encoder = new SemanticTextEncoder('utf-8', mockClient);
      const result = await encoder.canEncode('Hello World');
      expect(result.canEncode).toBe(true);
      expect(result.problematicChars).toHaveLength(0);
    });

    test('returns failure for non-encodable text', async () => {
      const mockClient = createMockLLMClient(mockCanEncodeFailureResponse);
      const encoder = new SemanticTextEncoder('ascii', mockClient);
      const result = await encoder.canEncode('Hello 世界', 'ascii');
      expect(result.canEncode).toBe(false);
      expect(result.problematicChars).toContain('世');
      expect(result.problematicChars).toContain('界');
      expect(result.suggestedEncoding).toBe('utf-8');
    });

    test('uses instance encoding when not specified', async () => {
      const mockClient = createMockLLMClient(mockCanEncodeSuccessResponse);
      const encoder = new SemanticTextEncoder('utf-8', mockClient);
      const result = await encoder.canEncode('Hello');
      expect(result.canEncode).toBe(true);
    });
  });
});

// =============================================================================
// SEMANTIC TEXT DECODER TESTS
// =============================================================================

describe('SemanticTextDecoder', () => {
  describe('constructor', () => {
    test('creates instance with default UTF-8 encoding', () => {
      const decoder = new SemanticTextDecoder();
      expect(decoder.encoding).toBe('utf-8');
      expect(decoder.isAutoDetect).toBe(false);
    });

    test('creates instance with specified encoding', () => {
      const decoder = new SemanticTextDecoder('utf-16le');
      expect(decoder.encoding).toBe('utf-16le');
      expect(decoder.isAutoDetect).toBe(false);
    });

    test('creates instance with auto-detection', () => {
      const decoder = new SemanticTextDecoder('auto');
      expect(decoder.isAutoDetect).toBe(true);
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const decoder = new SemanticTextDecoder('utf-8', mockClient);
      expect(decoder.encoding).toBe('utf-8');
    });
  });

  describe('static create()', () => {
    test('creates SemanticTextDecoder instance', () => {
      const decoder = SemanticTextDecoder.create();
      expect(decoder).toBeInstanceOf(SemanticTextDecoder);
      expect(decoder.encoding).toBe('utf-8');
    });

    test('creates instance with auto-detection', () => {
      const decoder = SemanticTextDecoder.create('auto');
      expect(decoder.isAutoDetect).toBe(true);
    });
  });

  describe('decode()', () => {
    test('decodes UTF-8 bytes', () => {
      const decoder = new SemanticTextDecoder();
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const text = decoder.decode(bytes);
      expect(text).toBe('Hello');
    });

    test('decodes Unicode bytes', () => {
      const decoder = new SemanticTextDecoder();
      const encoder = new TextEncoder();
      const bytes = encoder.encode('Hello 世界');
      const text = decoder.decode(bytes);
      expect(text).toBe('Hello 世界');
    });

    test('decodes empty bytes', () => {
      const decoder = new SemanticTextDecoder();
      const bytes = new Uint8Array([]);
      const text = decoder.decode(bytes);
      expect(text).toBe('');
    });

    test('handles ArrayBuffer input', () => {
      const decoder = new SemanticTextDecoder();
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const text = decoder.decode(buffer);
      expect(text).toBe('Hello');
    });
  });

  describe('static detectEncoding()', () => {
    test('detects UTF-8 BOM', async () => {
      const bytes = new Uint8Array([0xEF, 0xBB, 0xBF, 72, 101, 108, 108, 111]);
      const result = await SemanticTextDecoder.detectEncoding(bytes);
      expect(result.encoding).toBe('utf-8');
      expect(result.confidence).toBe(1.0);
    });

    test('detects UTF-16BE BOM', async () => {
      const bytes = new Uint8Array([0xFE, 0xFF, 0, 72, 0, 101]);
      const result = await SemanticTextDecoder.detectEncoding(bytes);
      expect(result.encoding).toBe('utf-16be');
      expect(result.confidence).toBe(1.0);
    });

    test('detects UTF-16LE BOM', async () => {
      const bytes = new Uint8Array([0xFF, 0xFE, 72, 0, 101, 0]);
      const result = await SemanticTextDecoder.detectEncoding(bytes);
      expect(result.encoding).toBe('utf-16le');
      expect(result.confidence).toBe(1.0);
    });

    test('uses LLM for encoding without BOM', async () => {
      const mockClient = createMockLLMClient(mockDetectEncodingUtf8Response);
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = await SemanticTextDecoder.detectEncoding(bytes, mockClient);
      expect(result.encoding).toBe('utf-8');
      expect(result.confidence).toBe(0.95);
      expect(result.alternatives).toContain('windows-1252');
    });

    test('detects Japanese encoding', async () => {
      const mockClient = createMockLLMClient(mockDetectEncodingShiftJisResponse);
      const bytes = new Uint8Array([0x82, 0xB1, 0x82, 0xF1]); // Example Shift-JIS bytes
      const result = await SemanticTextDecoder.detectEncoding(bytes, mockClient);
      expect(result.encoding).toBe('shift-jis');
      expect(result.alternatives).toContain('euc-jp');
    });
  });

  describe('decodeWithAnalysis()', () => {
    test('decodes with no issues', async () => {
      const mockClient = createSequentialMockLLMClient([
        mockDetectEncodingUtf8Response,
        mockDecodeWithAnalysisCleanResponse,
      ]);
      const decoder = new SemanticTextDecoder('auto', mockClient);
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = await decoder.decodeWithAnalysis(bytes);
      expect(result.text).toBe('Hello');
      expect(result.issues).toHaveLength(0);
      expect(result.repaired).toBe(false);
    });

    test('decodes with issues detected', async () => {
      const mockClient = createSequentialMockLLMClient([
        mockDetectEncodingUtf8Response,
        mockDecodeWithAnalysisIssuesResponse,
      ]);
      const decoder = new SemanticTextDecoder('auto', mockClient);
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = await decoder.decodeWithAnalysis(bytes);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.repaired).toBe(true);
    });

    test('uses specified encoding when not auto-detect', async () => {
      const mockClient = createMockLLMClient(mockDecodeWithAnalysisCleanResponse);
      const decoder = new SemanticTextDecoder('utf-8', mockClient);
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = await decoder.decodeWithAnalysis(bytes);
      expect(result.detectedEncoding).toBe('utf-8');
    });
  });

  describe('static repairMojibake()', () => {
    test('repairs mojibake text', async () => {
      const mockClient = createMockLLMClient(mockRepairMojibakeResponse);
      const result = await SemanticTextDecoder.repairMojibake('Ã©tÃ©', mockClient);
      expect(result.repaired).toBe('été');
      expect(result.corruptionPath).toContain('utf-8 -> windows-1252 -> utf-8');
      expect(result.confidence).toBe(0.92);
    });

    test('returns original text when no corruption', async () => {
      const mockClient = createMockLLMClient(mockRepairMojibakeNoCorruptionResponse);
      const result = await SemanticTextDecoder.repairMojibake('Hello World', mockClient);
      expect(result.repaired).toBe('Hello World');
      expect(result.corruptionPath).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });
  });
});

// =============================================================================
// SEMANTIC TEXT CODEC TESTS
// =============================================================================

describe('SemanticTextCodec', () => {
  describe('static areEquivalent()', () => {
    test('returns true for identical bytes', async () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = await SemanticTextCodec.areEquivalent(bytes, bytes);
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.note).toBe('Byte-identical buffers');
    });

    test('returns true for same text in different representations', async () => {
      const encoder = new TextEncoder();
      const bytes1 = encoder.encode('Hello');
      const bytes2 = encoder.encode('Hello');
      const result = await SemanticTextCodec.areEquivalent(bytes1, bytes2);
      expect(result.equivalent).toBe(true);
    });

    test('uses LLM for complex comparison', async () => {
      const mockClient = createMockLLMClient(mockAreEquivalentTrueResponse);
      const bytes1 = new Uint8Array([72, 101, 108, 108, 111]);
      const bytes2 = new Uint8Array([72, 101, 108, 108, 111, 33]); // Different
      const result = await SemanticTextCodec.areEquivalent(bytes1, bytes2, mockClient);
      expect(result.equivalent).toBe(true);
      expect(result.note).toContain('encoding');
    });

    test('returns false for different content', async () => {
      const mockClient = createMockLLMClient(mockAreEquivalentFalseResponse);
      const bytes1 = new Uint8Array([72, 101, 108, 108, 111]);
      const bytes2 = new Uint8Array([87, 111, 114, 108, 100]);
      const result = await SemanticTextCodec.areEquivalent(bytes1, bytes2, mockClient);
      expect(result.equivalent).toBe(false);
    });

    test('handles ArrayBuffer input', async () => {
      const buffer1 = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const buffer2 = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const result = await SemanticTextCodec.areEquivalent(buffer1, buffer2);
      expect(result.equivalent).toBe(true);
    });
  });

  describe('static transcode()', () => {
    test('transcodes with auto-detection', async () => {
      const mockClient = createMockLLMClient(mockDetectEncodingUtf8Response);
      const encoder = new TextEncoder();
      const bytes = encoder.encode('Hello World');
      const result = await SemanticTextCodec.transcode(
        bytes,
        { to: 'utf-8' },
        mockClient
      );
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.lossless).toBe(true);
      expect(result.substitutions).toHaveLength(0);
    });

    test('transcodes with specified source encoding', async () => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode('Hello');
      const result = await SemanticTextCodec.transcode(
        bytes,
        { from: 'utf-8', to: 'utf-8' }
      );
      expect(result.fromEncoding).toBe('utf-8');
      expect(result.lossless).toBe(true);
    });

    test('handles ArrayBuffer input', async () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode('Hello').buffer;
      const result = await SemanticTextCodec.transcode(
        buffer,
        { from: 'utf-8', to: 'utf-8' }
      );
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe('static validateEncoding()', () => {
    test('validates valid UTF-8', async () => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode('Hello World');
      const result = await SemanticTextCodec.validateEncoding(bytes, 'utf-8');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('validates valid UTF-8 with Unicode', async () => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode('Hello 世界 🌍');
      const result = await SemanticTextCodec.validateEncoding(bytes, 'utf-8');
      expect(result.valid).toBe(true);
    });

    test('detects invalid UTF-8 sequences', async () => {
      // Invalid UTF-8: continuation byte without lead byte
      const bytes = new Uint8Array([0x80, 0x81, 0x82]);
      const result = await SemanticTextCodec.validateEncoding(bytes, 'utf-8');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('detects truncated UTF-8 sequences', async () => {
      // Start of 3-byte sequence without continuation
      const bytes = new Uint8Array([0xE4, 0xB8]);
      const result = await SemanticTextCodec.validateEncoding(bytes, 'utf-8');
      expect(result.valid).toBe(false);
    });

    test('uses LLM for non-UTF-8 encodings', async () => {
      const mockClient = createMockLLMClient(mockValidateEncodingValidResponse);
      const bytes = new Uint8Array([0x82, 0xB1, 0x82, 0xF1]);
      const result = await SemanticTextCodec.validateEncoding(bytes, 'shift-jis', mockClient);
      expect(result.valid).toBe(true);
    });

    test('returns issues for invalid encoding', async () => {
      const mockClient = createMockLLMClient(mockValidateEncodingInvalidResponse);
      const bytes = new Uint8Array([0x82, 0xB1, 0x82]);
      const result = await SemanticTextCodec.validateEncoding(bytes, 'shift-jis', mockClient);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]?.position).toBe(45);
    });
  });

  describe('static suggestEncoding()', () => {
    test('suggests UTF-8 for universal compatibility', async () => {
      const mockClient = createMockLLMClient(mockSuggestEncodingUtf8Response);
      const result = await SemanticTextCodec.suggestEncoding(
        'Hello 世界 🌍',
        undefined,
        mockClient
      );
      expect(result.encoding).toBe('utf-8');
      expect(result.reason).toContain('Universal');
      expect(result.alternatives).toContain('utf-16');
    });

    test('suggests legacy encoding with compatibility constraint', async () => {
      const mockClient = createMockLLMClient(mockSuggestEncodingLegacyResponse);
      const result = await SemanticTextCodec.suggestEncoding(
        'Hello World',
        { compatibility: 'legacy' },
        mockClient
      );
      expect(result.encoding).toBe('windows-1252');
      expect(result.reason).toContain('legacy');
    });

    test('returns alternatives', async () => {
      const mockClient = createMockLLMClient(mockSuggestEncodingUtf8Response);
      const result = await SemanticTextCodec.suggestEncoding(
        'Hello',
        undefined,
        mockClient
      );
      expect(result.alternatives).toBeInstanceOf(Array);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('static explainError()', () => {
    test('explains encoding error', async () => {
      const mockClient = createMockLLMClient(mockExplainErrorResponse);
      const error = new Error('Invalid byte sequence');
      const result = await SemanticTextCodec.explainError(error, undefined, mockClient);
      expect(result.explanation).toContain('Shift-JIS');
      expect(result.likelyCause).toContain('mismatch');
      expect(result.solution).toContain('Re-decode');
    });

    test('explains error with context bytes', async () => {
      const mockClient = createMockLLMClient(mockExplainErrorResponse);
      const error = new Error('Invalid UTF-8');
      const context = new Uint8Array([0x82, 0xB1, 0x82, 0xF1]);
      const result = await SemanticTextCodec.explainError(error, context, mockClient);
      expect(result.explanation).toBeDefined();
      expect(result.solution).toBeDefined();
    });

    test('handles error without context', async () => {
      const mockClient = createMockLLMClient(mockExplainErrorResponse);
      const error = new Error('Decoding failed');
      const result = await SemanticTextCodec.explainError(error, undefined, mockClient);
      expect(result.explanation).toBeDefined();
      expect(result.likelyCause).toBeDefined();
      expect(result.solution).toBeDefined();
    });

    test('handles ArrayBuffer context', async () => {
      const mockClient = createMockLLMClient(mockExplainErrorResponse);
      const error = new Error('Invalid byte');
      const context = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const result = await SemanticTextCodec.explainError(error, context, mockClient);
      expect(result.explanation).toBeDefined();
    });
  });
});

// =============================================================================
// EDGE CASES AND ERROR HANDLING
// =============================================================================

describe('Edge Cases', () => {
  describe('Empty inputs', () => {
    test('encoder handles empty string', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('');
      expect(result.bytes.length).toBe(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.hasNonAscii).toBe(false);
    });

    test('decoder handles empty bytes', () => {
      const decoder = new SemanticTextDecoder();
      const result = decoder.decode(new Uint8Array([]));
      expect(result).toBe('');
    });
  });

  describe('Large inputs', () => {
    test('encoder handles long strings', () => {
      const encoder = new SemanticTextEncoder();
      const longString = 'a'.repeat(10000);
      const result = encoder.encodeWithAnalysis(longString);
      expect(result.byteLength).toBe(10000);
    });
  });

  describe('Special characters', () => {
    test('encoder handles surrogate pairs', () => {
      const encoder = new SemanticTextEncoder();
      const result = encoder.encodeWithAnalysis('Hello 🌍🎉');
      expect(result.hasNonAscii).toBe(true);
      expect(result.byteLength).toBeGreaterThan(8);
    });

    test('decoder handles replacement characters gracefully', () => {
      const decoder = new SemanticTextDecoder('utf-8');
      // Invalid UTF-8 byte should be replaced, not throw
      const bytes = new Uint8Array([72, 0xFF, 108, 108, 111]);
      const result = decoder.decode(bytes);
      expect(result).toBeDefined();
    });
  });
});
