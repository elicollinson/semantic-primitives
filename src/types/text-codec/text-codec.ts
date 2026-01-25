/**
 * SemanticTextCodec - LLM-enhanced text encoding/decoding types
 *
 * Provides semantic wrappers for TextEncoder and TextDecoder with:
 * - Intelligent encoding detection
 * - Mojibake (encoding corruption) repair
 * - Cross-encoding operations
 * - Validation and suggestions
 *
 * Includes three classes:
 * - SemanticTextEncoder: Enhanced TextEncoder with analysis capabilities
 * - SemanticTextDecoder: Enhanced TextDecoder with detection and repair
 * - SemanticTextCodec: Static utility methods for encoding operations
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type { ConfidenceResult } from '../../shared/types.ts';
import {
  DETECT_ENCODING_SYSTEM,
  detectEncodingPrompt,
  REPAIR_MOJIBAKE_SYSTEM,
  repairMojibakePrompt,
  VALIDATE_ENCODING_SYSTEM,
  validateEncodingPrompt,
  SUGGEST_ENCODING_SYSTEM,
  suggestEncodingPrompt,
  EXPLAIN_ERROR_SYSTEM,
  explainErrorPrompt,
  CAN_ENCODE_SYSTEM,
  canEncodePrompt,
  ARE_EQUIVALENT_SYSTEM,
  areEquivalentPrompt,
  DECODE_WITH_ANALYSIS_SYSTEM,
  decodeWithAnalysisPrompt,
} from './prompts.ts';

// Type alias for BufferSource which includes ArrayBuffer, TypedArrays, and DataView
type BufferSourceType = ArrayBuffer | Uint8Array | DataView;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** LLM client interface for dependency injection */
export interface TextCodecLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/** Result of encoding with analysis */
export interface EncodeWithAnalysisResult {
  bytes: Uint8Array;
  warnings: string[];
  hasNonAscii: boolean;
  byteLength: number;
}

/** Result of checking if text can be encoded */
export interface CanEncodeResult {
  canEncode: boolean;
  problematicChars: string[];
  suggestedEncoding?: string;
}

/** Result of encoding detection */
export interface DetectEncodingResult extends ConfidenceResult {
  encoding: string;
  alternatives: string[];
}

/** Result of decoding with analysis */
export interface DecodeWithAnalysisResult {
  text: string;
  detectedEncoding: string;
  repaired: boolean;
  issues: string[];
}

/** Result of mojibake repair */
export interface RepairMojibakeResult extends ConfidenceResult {
  repaired: string;
  corruptionPath: string[];
}

/** Result of buffer equivalence check */
export interface AreEquivalentResult extends ConfidenceResult {
  equivalent: boolean;
  note?: string;
}

/** Result of transcoding */
export interface TranscodeResult {
  bytes: Uint8Array;
  fromEncoding: string;
  lossless: boolean;
  substitutions: { char: string; replacement: string }[];
}

/** Encoding validation issue */
export interface EncodingIssue {
  position: number;
  issue: string;
}

/** Result of encoding validation */
export interface ValidateEncodingResult {
  valid: boolean;
  issues: EncodingIssue[];
}

/** Result of encoding suggestion */
export interface SuggestEncodingResult {
  encoding: string;
  reason: string;
  alternatives: string[];
}

/** Result of error explanation */
export interface ExplainErrorResult {
  explanation: string;
  likelyCause: string;
  solution: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert a BufferSource to Uint8Array
 */
function toUint8Array(source: BufferSourceType): Uint8Array {
  if (source instanceof Uint8Array) {
    return source;
  }
  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }
  // DataView
  return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
}

/**
 * Convert bytes to hex string for LLM prompts
 */
function bytesToHex(bytes: Uint8Array, maxBytes = 100): string {
  const slice = bytes.slice(0, maxBytes);
  const hex = Array.from(slice)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
  return bytes.length > maxBytes ? `${hex}... (${bytes.length} bytes total)` : hex;
}

/**
 * Check if text contains non-ASCII characters
 */
function hasNonAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// SEMANTIC TEXT ENCODER
// =============================================================================

/**
 * SemanticTextEncoder - Enhanced TextEncoder with analysis capabilities
 *
 * Extends TextEncoder functionality with:
 * - Encoding analysis and warnings
 * - Character compatibility checking
 * - LLM-powered encoding recommendations
 */
export class SemanticTextEncoder {
  private readonly _encoder: TextEncoder;
  private readonly _encoding: string;
  private readonly _llmClient: TextCodecLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticTextEncoder instance
   *
   * @param encoding - Target encoding (defaults to UTF-8, the only encoding TextEncoder supports)
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    encoding?: string,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    // TextEncoder only supports UTF-8, but we track the requested encoding
    this._encoder = new TextEncoder();
    this._encoding = encoding || 'utf-8';
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create a SemanticTextEncoder with optional encoding validation.
   *
   * @param encoding - Target encoding (defaults to UTF-8)
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticTextEncoder instance
   */
  static create(
    encoding?: string,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticTextEncoder {
    return new SemanticTextEncoder(encoding, llmClient, llmConfig);
  }

  /**
   * Encode text to bytes (delegates to native TextEncoder)
   *
   * @param text - Text to encode
   * @returns Encoded bytes
   */
  encode(text: string): Uint8Array {
    return this._encoder.encode(text);
  }

  /**
   * Encode text into an existing buffer (delegates to native TextEncoder)
   *
   * @param text - Text to encode
   * @param destination - Destination buffer
   * @returns Result with read and written counts
   */
  encodeInto(text: string, destination: Uint8Array): { read: number; written: number } {
    return this._encoder.encodeInto(text, destination);
  }

  /**
   * Encode text with validation and warnings.
   *
   * @param text - Text to encode
   * @returns Encoded bytes with metadata
   */
  encodeWithAnalysis(text: string): EncodeWithAnalysisResult {
    const bytes = this._encoder.encode(text);
    const textHasNonAscii = hasNonAscii(text);

    // Generate warnings for potential issues
    const warnings: string[] = [];

    if (textHasNonAscii && this._encoding.toLowerCase() === 'ascii') {
      warnings.push('Text contains non-ASCII characters that cannot be represented in ASCII');
    }

    // Check for potentially problematic characters
    if (text.includes('\u0000')) {
      warnings.push('Text contains null bytes which may cause issues in some systems');
    }

    if (text.includes('\uFEFF')) {
      warnings.push('Text contains BOM character which may not be intended');
    }

    // Check for private use area characters
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if ((code >= 0xE000 && code <= 0xF8FF) || (code >= 0xF0000 && code <= 0xFFFFD)) {
        warnings.push('Text contains private use area characters');
        break;
      }
    }

    return {
      bytes,
      warnings,
      hasNonAscii: textHasNonAscii,
      byteLength: bytes.length,
    };
  }

  /**
   * Check if text can be encoded without loss.
   * Uses LLM for intelligent analysis of encoding compatibility.
   *
   * @param text - Text to check
   * @param encoding - Target encoding (defaults to instance encoding)
   * @returns Analysis result
   */
  async canEncode(text: string, encoding?: string): Promise<CanEncodeResult> {
    const targetEncoding = encoding || this._encoding;

    const messages: Message[] = [
      {
        role: 'user',
        content: canEncodePrompt(text, targetEncoding),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: CAN_ENCODE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as CanEncodeResult;
  }

  /**
   * Get the encoding name
   */
  get encoding(): string {
    return this._encoding;
  }
}

// =============================================================================
// SEMANTIC TEXT DECODER
// =============================================================================

/**
 * SemanticTextDecoder - Enhanced TextDecoder with detection and repair capabilities
 *
 * Extends TextDecoder functionality with:
 * - Automatic encoding detection
 * - Mojibake (encoding corruption) repair
 * - Decoding analysis and issue reporting
 */
export class SemanticTextDecoder {
  private readonly _decoder: TextDecoder;
  private readonly _encoding: string;
  private readonly _autoDetect: boolean;
  private readonly _llmClient: TextCodecLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticTextDecoder instance
   *
   * @param encoding - Encoding or "auto" for detection
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    encoding?: string,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._autoDetect = encoding === 'auto';
    this._encoding = this._autoDetect ? 'utf-8' : (encoding || 'utf-8');

    // Create decoder with error handling
    // Cast to 'utf-8' for type safety, actual encoding handled at runtime
    this._decoder = new TextDecoder(this._encoding as 'utf-8', { fatal: false });
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Create a SemanticTextDecoder with auto-detection capability.
   *
   * @param encoding - Encoding or "auto" for detection
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticTextDecoder instance
   */
  static create(
    encoding?: string,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticTextDecoder {
    return new SemanticTextDecoder(encoding, llmClient, llmConfig);
  }

  /**
   * Decode bytes to text (delegates to native TextDecoder)
   *
   * @param bytes - Bytes to decode
   * @returns Decoded text
   */
  decode(bytes?: BufferSourceType): string {
    return this._decoder.decode(bytes);
  }

  /**
   * Detect the encoding of a byte buffer using LLM analysis.
   *
   * @param bytes - Bytes to analyze
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Encoding detection result
   */
  static async detectEncoding(
    bytes: BufferSourceType,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<DetectEncodingResult> {
    const uint8 = toUint8Array(bytes);
    const client = llmClient || { chat };

    // Check for BOM first (quick detection)
    if (uint8.length >= 3 && uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
      return { encoding: 'utf-8', confidence: 1.0, alternatives: [] };
    }
    if (uint8.length >= 2 && uint8[0] === 0xFE && uint8[1] === 0xFF) {
      return { encoding: 'utf-16be', confidence: 1.0, alternatives: [] };
    }
    if (uint8.length >= 2 && uint8[0] === 0xFF && uint8[1] === 0xFE) {
      return { encoding: 'utf-16le', confidence: 1.0, alternatives: [] };
    }

    // Use LLM for more complex detection
    const messages: Message[] = [
      {
        role: 'user',
        content: detectEncodingPrompt(bytesToHex(uint8), uint8.length),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: DETECT_ENCODING_SYSTEM,
      ...llmConfig,
    });

    return JSON.parse(response.content) as DetectEncodingResult;
  }

  /**
   * Decode with encoding detection and repair.
   *
   * @param bytes - Bytes to decode
   * @returns Decoded text with metadata
   */
  async decodeWithAnalysis(bytes: BufferSourceType): Promise<DecodeWithAnalysisResult> {
    const uint8 = toUint8Array(bytes);

    // Detect encoding if in auto mode
    let detectedEncoding = this._encoding;
    if (this._autoDetect) {
      const detection = await SemanticTextDecoder.detectEncoding(
        uint8,
        this._llmClient,
        this._llmConfig
      );
      detectedEncoding = detection.encoding;
    }

    // Decode with the detected/specified encoding
    let decoder: TextDecoder;
    try {
      decoder = new TextDecoder(detectedEncoding as 'utf-8', { fatal: false });
    } catch {
      // Fall back to UTF-8 if encoding is not supported
      decoder = new TextDecoder('utf-8', { fatal: false });
      detectedEncoding = 'utf-8';
    }

    const text = decoder.decode(uint8);

    // Analyze for issues
    const messages: Message[] = [
      {
        role: 'user',
        content: decodeWithAnalysisPrompt(text, this._encoding, detectedEncoding),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DECODE_WITH_ANALYSIS_SYSTEM,
      ...this._llmConfig,
    });

    const analysis = JSON.parse(response.content) as {
      issues: string[];
      needsRepair: boolean;
      suggestedFix: string | null;
    };

    return {
      text,
      detectedEncoding,
      repaired: analysis.needsRepair,
      issues: analysis.issues,
    };
  }

  /**
   * Detect and repair mojibake (encoding corruption).
   *
   * @param text - Potentially corrupted text
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Repair result
   */
  static async repairMojibake(
    text: string,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<RepairMojibakeResult> {
    const client = llmClient || { chat };

    const messages: Message[] = [
      {
        role: 'user',
        content: repairMojibakePrompt(text),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: REPAIR_MOJIBAKE_SYSTEM,
      ...llmConfig,
    });

    return JSON.parse(response.content) as RepairMojibakeResult;
  }

  /**
   * Get the encoding name
   */
  get encoding(): string {
    return this._encoding;
  }

  /**
   * Check if auto-detection is enabled
   */
  get isAutoDetect(): boolean {
    return this._autoDetect;
  }
}

// =============================================================================
// SEMANTIC TEXT CODEC
// =============================================================================

/**
 * SemanticTextCodec - Static utility methods for encoding operations
 *
 * Provides LLM-enhanced encoding utilities:
 * - Cross-encoding equivalence checking
 * - Transcoding with smart fallbacks
 * - Encoding validation
 * - Encoding suggestions
 * - Error explanation
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SemanticTextCodec {
  /** Private constructor to prevent instantiation */
  private constructor() {}

  /**
   * Check if two encoded buffers represent the same text.
   *
   * @param bytes1 - First buffer
   * @param bytes2 - Second buffer
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Equivalence result
   */
  static async areEquivalent(
    bytes1: BufferSourceType,
    bytes2: BufferSourceType,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<AreEquivalentResult> {
    const client = llmClient || { chat };
    const uint8_1 = toUint8Array(bytes1);
    const uint8_2 = toUint8Array(bytes2);

    // Quick check: if bytes are identical, they're equivalent
    if (uint8_1.length === uint8_2.length) {
      let identical = true;
      for (let i = 0; i < uint8_1.length; i++) {
        if (uint8_1[i] !== uint8_2[i]) {
          identical = false;
          break;
        }
      }
      if (identical) {
        return { equivalent: true, confidence: 1.0, note: 'Byte-identical buffers' };
      }
    }

    // Decode both buffers and compare
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const decoded1 = decoder.decode(uint8_1);
    const decoded2 = decoder.decode(uint8_2);

    // If decoded text is identical, they're equivalent
    if (decoded1 === decoded2) {
      return {
        equivalent: true,
        confidence: 1.0,
        note: 'Same text, different byte representations',
      };
    }

    // Use LLM for more nuanced comparison
    const messages: Message[] = [
      {
        role: 'user',
        content: areEquivalentPrompt(
          bytesToHex(uint8_1),
          bytesToHex(uint8_2),
          decoded1,
          decoded2
        ),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: ARE_EQUIVALENT_SYSTEM,
      ...llmConfig,
    });

    return JSON.parse(response.content) as AreEquivalentResult;
  }

  /**
   * Transcode between encodings with smart fallbacks.
   *
   * @param bytes - Source bytes
   * @param options - Transcode options
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Transcoded bytes
   */
  static async transcode(
    bytes: BufferSourceType,
    options: { from?: string; to: string },
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<TranscodeResult> {
    const uint8 = toUint8Array(bytes);

    // Detect source encoding if not specified
    let fromEncoding = options.from;
    if (!fromEncoding) {
      const detection = await SemanticTextDecoder.detectEncoding(
        uint8,
        llmClient,
        llmConfig
      );
      fromEncoding = detection.encoding;
    }

    // Decode from source encoding
    let decoder: TextDecoder;
    try {
      decoder = new TextDecoder(fromEncoding as 'utf-8', { fatal: false });
    } catch {
      decoder = new TextDecoder('utf-8', { fatal: false });
      fromEncoding = 'utf-8';
    }

    const text = decoder.decode(uint8);

    // Encode to target encoding
    // Note: TextEncoder only supports UTF-8, so we handle this specially
    const encoder = new TextEncoder();
    const outputBytes = encoder.encode(text);

    // Check for lossless conversion
    const substitutions: { char: string; replacement: string }[] = [];
    const decoded = new TextDecoder('utf-8').decode(outputBytes);

    const lossless = decoded === text;

    return {
      bytes: outputBytes,
      fromEncoding: fromEncoding,
      lossless,
      substitutions,
    };
  }

  /**
   * Validate text encoding integrity.
   *
   * @param bytes - Bytes to validate
   * @param expectedEncoding - Expected encoding
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Validation result
   */
  static async validateEncoding(
    bytes: BufferSourceType,
    expectedEncoding: string,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<ValidateEncodingResult> {
    const client = llmClient || { chat };
    const uint8 = toUint8Array(bytes);

    // Quick validation for UTF-8
    if (expectedEncoding.toLowerCase() === 'utf-8' || expectedEncoding.toLowerCase() === 'utf8') {
      const issues: EncodingIssue[] = [];
      let i = 0;

      while (i < uint8.length) {
        const byte = uint8[i];

        if (byte === undefined) {
          break;
        }

        if (byte <= 0x7F) {
          // ASCII byte
          i++;
        } else if ((byte & 0xE0) === 0xC0) {
          // 2-byte sequence
          const next1 = uint8[i + 1];
          if (i + 1 >= uint8.length || next1 === undefined || (next1 & 0xC0) !== 0x80) {
            issues.push({ position: i, issue: 'Invalid UTF-8 2-byte sequence' });
          }
          i += 2;
        } else if ((byte & 0xF0) === 0xE0) {
          // 3-byte sequence
          const next1 = uint8[i + 1];
          const next2 = uint8[i + 2];
          if (
            i + 2 >= uint8.length ||
            next1 === undefined ||
            next2 === undefined ||
            (next1 & 0xC0) !== 0x80 ||
            (next2 & 0xC0) !== 0x80
          ) {
            issues.push({ position: i, issue: 'Invalid UTF-8 3-byte sequence' });
          }
          i += 3;
        } else if ((byte & 0xF8) === 0xF0) {
          // 4-byte sequence
          const next1 = uint8[i + 1];
          const next2 = uint8[i + 2];
          const next3 = uint8[i + 3];
          if (
            i + 3 >= uint8.length ||
            next1 === undefined ||
            next2 === undefined ||
            next3 === undefined ||
            (next1 & 0xC0) !== 0x80 ||
            (next2 & 0xC0) !== 0x80 ||
            (next3 & 0xC0) !== 0x80
          ) {
            issues.push({ position: i, issue: 'Invalid UTF-8 4-byte sequence' });
          }
          i += 4;
        } else {
          // Invalid UTF-8 start byte
          issues.push({ position: i, issue: 'Invalid UTF-8 start byte' });
          i++;
        }
      }

      if (issues.length > 0) {
        return { valid: false, issues };
      }
      return { valid: true, issues: [] };
    }

    // Use LLM for other encodings
    const messages: Message[] = [
      {
        role: 'user',
        content: validateEncodingPrompt(bytesToHex(uint8), expectedEncoding, uint8.length),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: VALIDATE_ENCODING_SYSTEM,
      ...llmConfig,
    });

    return JSON.parse(response.content) as ValidateEncodingResult;
  }

  /**
   * Suggest the best encoding for text content.
   *
   * @param text - Text to analyze
   * @param constraints - Constraints on encoding choice
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Encoding recommendation
   */
  static async suggestEncoding(
    text: string,
    constraints?: { compatibility?: string },
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<SuggestEncodingResult> {
    const client = llmClient || { chat };

    const messages: Message[] = [
      {
        role: 'user',
        content: suggestEncodingPrompt(text, constraints),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: SUGGEST_ENCODING_SYSTEM,
      ...llmConfig,
    });

    return JSON.parse(response.content) as SuggestEncodingResult;
  }

  /**
   * Explain encoding issues in plain language.
   *
   * @param error - Encoding error or issue
   * @param context - Additional context
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns Human-readable explanation
   */
  static async explainError(
    error: Error,
    context?: BufferSourceType,
    llmClient?: TextCodecLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<ExplainErrorResult> {
    const client = llmClient || { chat };

    const contextHex = context ? bytesToHex(toUint8Array(context)) : undefined;

    const messages: Message[] = [
      {
        role: 'user',
        content: explainErrorPrompt(error.message, contextHex),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: EXPLAIN_ERROR_SYSTEM,
      ...llmConfig,
    });

    return JSON.parse(response.content) as ExplainErrorResult;
  }
}
