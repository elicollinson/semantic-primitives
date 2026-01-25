/**
 * Prompts for SemanticTextCodec LLM operations
 * These prompts are used for encoding detection, mojibake repair, and other text codec operations
 */

// =============================================================================
// ENCODING DETECTION
// =============================================================================

/**
 * System prompt for encoding detection
 */
export const DETECT_ENCODING_SYSTEM = `You are a text encoding detection specialist. Your task is to analyze byte patterns and determine the most likely character encoding.

Consider these common encodings and their characteristics:
- UTF-8: Variable-width, ASCII-compatible, most common for web content
- UTF-16LE/BE: Fixed 2+ bytes per character, often has BOM
- ISO-8859-1 (Latin-1): Single-byte Western European encoding
- Windows-1252: Superset of ISO-8859-1 with extra characters
- Shift-JIS: Japanese encoding, variable-width
- EUC-JP: Japanese encoding, variable-width
- GB2312/GBK/GB18030: Chinese encodings
- EUC-KR: Korean encoding
- KOI8-R: Russian encoding

Look for patterns like:
- Byte Order Marks (BOM)
- Invalid byte sequences for certain encodings
- Statistical distribution of byte values
- Multi-byte sequence patterns

Always respond with valid JSON only.`;

/**
 * User prompt for encoding detection
 */
export function detectEncodingPrompt(bytePreview: string, byteLength: number): string {
  return `Analyze the following byte data and determine the most likely character encoding.

Byte data (hex): ${bytePreview}
Total bytes: ${byteLength}

Consider common patterns and byte distributions. Respond with JSON in this exact format:
{"encoding": "<detected encoding>", "confidence": <0-1>, "alternatives": [<other possible encodings>]}`;
}

// =============================================================================
// MOJIBAKE REPAIR
// =============================================================================

/**
 * System prompt for mojibake repair
 */
export const REPAIR_MOJIBAKE_SYSTEM = `You are a text encoding corruption repair specialist. Your task is to detect and repair mojibake - text that has been decoded with the wrong encoding.

Common mojibake patterns:
- UTF-8 decoded as ISO-8859-1/Windows-1252: "Ã©" instead of "é", "Ã¨" instead of "è"
- Double-encoded UTF-8: Text encoded to UTF-8 twice
- UTF-8 decoded as Shift-JIS: Japanese characters appearing as garbage
- Windows-1252 decoded as UTF-8: Replacement characters appearing

Steps to repair:
1. Identify the corruption pattern
2. Determine the original encoding
3. Determine the incorrect decoding path
4. Suggest the repaired text

Always respond with valid JSON only.`;

/**
 * User prompt for mojibake repair
 */
export function repairMojibakePrompt(text: string): string {
  return `Analyze this potentially corrupted text and attempt to repair mojibake (encoding corruption).

Text: "${text}"

Identify if the text shows signs of encoding corruption. If so, determine the corruption path and provide the repaired text.

Respond with JSON in this exact format:
{"repaired": "<repaired text or original if no corruption>", "corruptionPath": [<encoding chain that caused corruption, e.g., "utf-8 -> windows-1252 -> utf-8">], "confidence": <0-1>}`;
}

// =============================================================================
// ENCODING VALIDATION
// =============================================================================

/**
 * System prompt for encoding validation
 */
export const VALIDATE_ENCODING_SYSTEM = `You are a text encoding validation specialist. Your task is to verify if byte sequences are valid for a specified encoding.

For each encoding, check:
- UTF-8: Valid multi-byte sequences, proper continuation bytes
- UTF-16: Valid surrogate pairs, proper byte order
- ISO-8859-1: All single bytes are valid (0x00-0xFF)
- Windows-1252: Valid character positions (0x80-0x9F has specific mappings)
- Shift-JIS: Valid lead/trail byte combinations
- Other encodings: Encoding-specific validation rules

Report specific issues with byte positions.

Always respond with valid JSON only.`;

/**
 * User prompt for encoding validation
 */
export function validateEncodingPrompt(bytePreview: string, encoding: string, byteLength: number): string {
  return `Validate if the following byte data is valid for the ${encoding} encoding.

Byte data (hex): ${bytePreview}
Expected encoding: ${encoding}
Total bytes: ${byteLength}

Check for invalid byte sequences, improper multi-byte patterns, or other encoding violations.

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [{"position": <byte position>, "issue": "<description of the issue>"}]}`;
}

// =============================================================================
// ENCODING SUGGESTION
// =============================================================================

/**
 * System prompt for encoding suggestion
 */
export const SUGGEST_ENCODING_SYSTEM = `You are a text encoding recommendation specialist. Your task is to suggest the best encoding for text content based on its characters and any constraints.

Consider these factors:
- Character coverage: What characters need to be encoded?
- Compatibility: Legacy systems, email, URLs, etc.
- Efficiency: Byte size for the content
- Standards: Modern standards prefer UTF-8
- Interoperability: Cross-platform compatibility

Common recommendations:
- For web content: UTF-8 (universal, widely supported)
- For email: UTF-8 with proper MIME headers, or ASCII with encoding
- For legacy Windows apps: Windows-1252
- For Japanese: UTF-8, or Shift-JIS for legacy
- For Chinese: UTF-8, or GB18030 for legacy

Always respond with valid JSON only.`;

/**
 * User prompt for encoding suggestion
 */
export function suggestEncodingPrompt(text: string, constraints?: { compatibility?: string }): string {
  const constraintInfo = constraints?.compatibility
    ? `\nConstraints: ${constraints.compatibility} compatibility required`
    : '';

  return `Suggest the best encoding for the following text content.

Text: "${text}"${constraintInfo}

Analyze the characters used and recommend the most appropriate encoding.

Respond with JSON in this exact format:
{"encoding": "<recommended encoding>", "reason": "<explanation>", "alternatives": [<other suitable encodings>]}`;
}

// =============================================================================
// ERROR EXPLANATION
// =============================================================================

/**
 * System prompt for encoding error explanation
 */
export const EXPLAIN_ERROR_SYSTEM = `You are a text encoding error diagnosis specialist. Your task is to explain encoding errors in plain language and suggest solutions.

Common encoding errors:
- "Invalid byte sequence": Data doesn't match expected encoding
- "Unmappable character": Character can't be represented in target encoding
- "Truncated multi-byte sequence": Incomplete UTF-8 or other multi-byte character
- "Invalid UTF-8 continuation byte": Byte sequence violates UTF-8 rules
- "BOM mismatch": Byte Order Mark doesn't match declared encoding

For each error:
1. Explain what went wrong in simple terms
2. Identify the likely cause
3. Suggest a practical solution

Always respond with valid JSON only.`;

/**
 * User prompt for error explanation
 */
export function explainErrorPrompt(errorMessage: string, contextHex?: string): string {
  const contextInfo = contextHex
    ? `\nContext bytes (hex): ${contextHex}`
    : '';

  return `Explain this encoding error in plain language.

Error: ${errorMessage}${contextInfo}

Provide a clear explanation of what went wrong, the likely cause, and how to fix it.

Respond with JSON in this exact format:
{"explanation": "<plain language explanation>", "likelyCause": "<most likely cause>", "solution": "<recommended fix>"}`;
}

// =============================================================================
// CAN ENCODE CHECK
// =============================================================================

/**
 * System prompt for checking if text can be encoded
 */
export const CAN_ENCODE_SYSTEM = `You are a text encoding compatibility specialist. Your task is to determine if text can be encoded in a specific encoding without data loss.

Check for:
- Characters outside the encoding's repertoire
- Characters that would require substitution or escaping
- Unicode normalization issues

For each problematic character, explain why it can't be encoded.

Always respond with valid JSON only.`;

/**
 * User prompt for can encode check
 */
export function canEncodePrompt(text: string, encoding: string): string {
  return `Check if the following text can be encoded in ${encoding} without data loss.

Text: "${text}"
Target encoding: ${encoding}

Identify any characters that cannot be represented in this encoding.

Respond with JSON in this exact format:
{"canEncode": <boolean>, "problematicChars": [<list of characters that cannot be encoded>], "suggestedEncoding": "<better encoding if canEncode is false>"}`;
}

// =============================================================================
// BUFFER EQUIVALENCE
// =============================================================================

/**
 * System prompt for checking buffer equivalence
 */
export const ARE_EQUIVALENT_SYSTEM = `You are a text encoding equivalence specialist. Your task is to determine if two encoded byte buffers represent the same text, even if they use different encodings.

Consider:
- Different encodings of the same text
- Byte Order Marks (BOM) differences
- Unicode normalization differences (NFC vs NFD)
- Line ending differences (CRLF vs LF)

Determine if the buffers are semantically equivalent (represent the same text content).

Always respond with valid JSON only.`;

/**
 * User prompt for buffer equivalence
 */
export function areEquivalentPrompt(
  bytes1Hex: string,
  bytes2Hex: string,
  decoded1: string,
  decoded2: string
): string {
  return `Determine if these two encoded buffers represent the same text.

Buffer 1 (hex): ${bytes1Hex}
Buffer 1 (decoded): "${decoded1}"

Buffer 2 (hex): ${bytes2Hex}
Buffer 2 (decoded): "${decoded2}"

Consider encoding differences, BOMs, normalization, and other factors.

Respond with JSON in this exact format:
{"equivalent": <boolean>, "note": "<explanation of differences or equivalence>", "confidence": <0-1>}`;
}

// =============================================================================
// DECODE WITH ANALYSIS
// =============================================================================

/**
 * System prompt for decode analysis
 */
export const DECODE_WITH_ANALYSIS_SYSTEM = `You are a text decoding analysis specialist. Your task is to analyze decoded text and identify any issues or repairs that were made.

Look for:
- Replacement characters (U+FFFD) indicating decoding errors
- Signs of mojibake that might need repair
- Encoding mismatches between declared and actual encoding
- Invalid character sequences that were sanitized

Report all issues found during decoding.

Always respond with valid JSON only.`;

/**
 * User prompt for decode analysis
 */
export function decodeWithAnalysisPrompt(
  text: string,
  declaredEncoding: string,
  detectedEncoding: string
): string {
  return `Analyze this decoded text for encoding issues.

Decoded text: "${text}"
Declared encoding: ${declaredEncoding}
Detected encoding: ${detectedEncoding}

Identify any decoding issues, replacement characters, or signs of corruption.

Respond with JSON in this exact format:
{"issues": [<list of issue descriptions>], "needsRepair": <boolean>, "suggestedFix": "<fix if needed, or null>"}`;
}

// =============================================================================
// ENCODE WITH ANALYSIS
// =============================================================================

/**
 * System prompt for encode analysis
 */
export const ENCODE_WITH_ANALYSIS_SYSTEM = `You are a text encoding analysis specialist. Your task is to analyze text that will be encoded and identify potential issues.

Check for:
- Non-ASCII characters that might cause issues in some systems
- Characters that might be normalized differently
- Potential encoding compatibility issues
- Characters that might need escaping

Provide warnings for any potential issues.

Always respond with valid JSON only.`;

/**
 * User prompt for encode analysis
 */
export function encodeWithAnalysisPrompt(text: string, encoding: string): string {
  return `Analyze this text for potential encoding issues when encoding to ${encoding}.

Text: "${text}"
Target encoding: ${encoding}

Identify any potential issues or warnings.

Respond with JSON in this exact format:
{"warnings": [<list of warning messages>], "hasNonAscii": <boolean>, "potentialIssues": [<list of potential issues>]}`;
}
