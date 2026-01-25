# SemanticTextCodec (TextEncoder / TextDecoder)

## Overview

The `SemanticTextCodec` types wrap TextEncoder and TextDecoder with LLM-powered semantic understanding. They enable intelligent encoding detection, mojibake repair, and cross-encoding operations.

**Core Principle**: Text codecs handle encoding transformations - semantic operations should detect encodings, repair corruption, and validate text integrity.

---

## Interface

```typescript
interface SemanticTextEncoder extends TextEncoder {
  /**
   * Create a SemanticTextEncoder with optional encoding validation.
   *
   * @param encoding - Target encoding (defaults to UTF-8)
   * @returns SemanticTextEncoder instance
   *
   * @example
   * SemanticTextEncoder.create("utf-8")
   */
  static create(encoding?: string): SemanticTextEncoder;

  /**
   * Encode text with validation and warnings.
   *
   * @param text - Text to encode
   * @returns Encoded bytes with metadata
   *
   * @example
   * encoder.encodeWithAnalysis("Hello 世界")
   * // { bytes: Uint8Array, warnings: [], hasNonAscii: true }
   */
  encodeWithAnalysis(text: string): {
    bytes: Uint8Array;
    warnings: string[];
    hasNonAscii: boolean;
    byteLength: number;
  };

  /**
   * Check if text can be encoded without loss.
   *
   * @param text - Text to check
   * @param encoding - Target encoding
   * @returns Analysis result
   *
   * @example
   * encoder.canEncode("Hello 世界", "ascii")
   * // { canEncode: false, problematicChars: ["世", "界"] }
   */
  canEncode(text: string, encoding?: string): {
    canEncode: boolean;
    problematicChars: string[];
    suggestedEncoding?: string;
  };
}

interface SemanticTextDecoder extends TextDecoder {
  /**
   * Create a SemanticTextDecoder with auto-detection capability.
   *
   * @param encoding - Encoding or "auto" for detection
   * @returns SemanticTextDecoder instance
   *
   * @example
   * SemanticTextDecoder.create("auto")
   */
  static create(encoding?: string | "auto"): SemanticTextDecoder;

  /**
   * Detect the encoding of a byte buffer.
   *
   * @param bytes - Bytes to analyze
   * @returns Encoding detection result
   *
   * @example
   * decoder.detectEncoding(buffer)
   * // { encoding: "utf-8", confidence: 0.95, alternatives: ["windows-1252"] }
   */
  static detectEncoding(bytes: BufferSource): {
    encoding: string;
    confidence: number;
    alternatives: string[];
  };

  /**
   * Decode with encoding detection and repair.
   *
   * @param bytes - Bytes to decode
   * @returns Decoded text with metadata
   *
   * @example
   * decoder.decodeWithAnalysis(buffer)
   * // { text: "Hello", detectedEncoding: "utf-8", repaired: false }
   */
  decodeWithAnalysis(bytes: BufferSource): {
    text: string;
    detectedEncoding: string;
    repaired: boolean;
    issues: string[];
  };

  /**
   * Detect and repair mojibake (encoding corruption).
   *
   * @param text - Potentially corrupted text
   * @returns Repair result
   *
   * @example
   * decoder.repairMojibake("Ã©tÃ©")
   * // { repaired: "été", corruptionPath: ["utf-8 -> windows-1252 -> utf-8"] }
   */
  static repairMojibake(text: string): {
    repaired: string;
    corruptionPath: string[];
    confidence: number;
  };
}

interface SemanticTextCodec {
  /**
   * Check if two encoded buffers represent the same text.
   *
   * @param bytes1 - First buffer
   * @param bytes2 - Second buffer
   * @returns Equivalence result
   *
   * @example
   * codec.areEquivalent(utf8Buffer, latin1Buffer)
   * // { equivalent: true, note: "Same text, different encodings" }
   */
  static areEquivalent(
    bytes1: BufferSource,
    bytes2: BufferSource
  ): Promise<{
    equivalent: boolean;
    note?: string;
    confidence: number;
  }>;

  /**
   * Transcode between encodings with smart fallbacks.
   *
   * @param bytes - Source bytes
   * @param options - Transcode options
   * @returns Transcoded bytes
   *
   * @example
   * codec.transcode(buffer, { from: "shift-jis", to: "utf-8" })
   */
  static transcode(
    bytes: BufferSource,
    options: { from?: string; to: string }
  ): {
    bytes: Uint8Array;
    fromEncoding: string;
    lossless: boolean;
    substitutions: Array<{ char: string; replacement: string }>;
  };

  /**
   * Validate text encoding integrity.
   *
   * @param bytes - Bytes to validate
   * @param expectedEncoding - Expected encoding
   * @returns Validation result
   *
   * @example
   * codec.validateEncoding(buffer, "utf-8")
   * // { valid: false, issues: ["Invalid UTF-8 sequence at position 45"] }
   */
  static validateEncoding(
    bytes: BufferSource,
    expectedEncoding: string
  ): {
    valid: boolean;
    issues: Array<{ position: number; issue: string }>;
  };

  /**
   * Suggest the best encoding for text content.
   *
   * @param text - Text to analyze
   * @param constraints - Constraints on encoding choice
   * @returns Encoding recommendation
   *
   * @example
   * codec.suggestEncoding(text, { compatibility: "legacy" })
   * // { encoding: "windows-1252", reason: "Supports required characters with legacy compatibility" }
   */
  static suggestEncoding(
    text: string,
    constraints?: { compatibility?: string }
  ): {
    encoding: string;
    reason: string;
    alternatives: string[];
  };

  /**
   * Explain encoding issues in plain language.
   *
   * @param error - Encoding error or issue
   * @param context - Additional context
   * @returns Human-readable explanation
   *
   * @example
   * codec.explainError(error, buffer)
   * // "The text appears to be Shift-JIS encoded but was decoded as UTF-8..."
   */
  static explainError(error: Error, context?: BufferSource): {
    explanation: string;
    likelyCause: string;
    solution: string;
  };
}
```

---

## Implementation Notes

### File Structure

The implementation follows the standard semantic primitives structure:

```
src/types/text-codec/
├── index.ts                    # Re-exports all public APIs
├── text-codec.ts               # Main classes implementation
├── prompts.ts                  # LLM prompt templates
└── __tests__/
    ├── text-codec.test.ts      # Comprehensive tests (66 tests)
    └── mocks.ts                # Mock responses and factories
```

### Classes Implemented

1. **SemanticTextEncoder** - Wraps native `TextEncoder` with:
   - `create()` static factory method
   - `encode()` - delegates to native encoder
   - `encodeInto()` - delegates to native encoder
   - `encodeWithAnalysis()` - synchronous analysis with warnings for non-ASCII, null bytes, BOM, and private use area characters
   - `canEncode()` - async LLM-powered check for encoding compatibility

2. **SemanticTextDecoder** - Wraps native `TextDecoder` with:
   - `create()` static factory method supporting `"auto"` for auto-detection
   - `decode()` - delegates to native decoder
   - `detectEncoding()` - static async method for LLM-powered encoding detection (with fast BOM detection fallback)
   - `decodeWithAnalysis()` - async decoding with issue detection and optional auto-detection
   - `repairMojibake()` - static async method for LLM-powered mojibake repair

3. **SemanticTextCodec** - Static utility class providing:
   - `areEquivalent()` - async LLM-powered buffer equivalence check (with fast byte comparison fallback)
   - `transcode()` - async transcoding between encodings
   - `validateEncoding()` - async validation with fast UTF-8 validation and LLM fallback for other encodings
   - `suggestEncoding()` - async LLM-powered encoding recommendation
   - `explainError()` - async LLM-powered error explanation

### Key Design Decisions

1. **Dependency Injection**: All classes accept an optional LLM client for testing purposes. The default uses the codebase's `chat` function.

2. **Fast Paths**: Where possible, synchronous fast paths are used before falling back to LLM:
   - BOM detection for encoding detection
   - Byte-identical comparison for equivalence
   - Native UTF-8 validation before LLM validation

3. **Type Safety**: Uses a custom `BufferSourceType` type alias (`ArrayBuffer | Uint8Array | DataView`) for TypeScript compatibility across different environments.

4. **TextEncoder Limitation**: The native `TextEncoder` only supports UTF-8. The implementation tracks requested encoding for analysis purposes but delegates to the native UTF-8 encoder.

5. **Error Handling**: `TextDecoder` creation with unsupported encodings falls back to UTF-8 to prevent runtime errors.

### Testing

- 66 tests covering all methods across all three classes
- Mock LLM client factories for deterministic testing
- Tests cover edge cases: empty inputs, large inputs, special characters, invalid sequences

### Exports

All classes and types are exported through:
- `src/types/text-codec/index.ts` (module level)
- `src/types/index.ts` (types collection level)
- `src/index.ts` (library level)
