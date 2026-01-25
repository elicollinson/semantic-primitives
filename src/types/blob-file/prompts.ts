/**
 * Prompts for SemanticBlob and SemanticFile LLM operations
 * These prompts are used for various semantic blob/file operations that require LLM understanding
 */

// =============================================================================
// SEMANTIC BLOB PROMPTS
// =============================================================================

/**
 * System prompt for semantic blob equality comparison
 */
export const SEMANTIC_EQUALS_SYSTEM = `You are a binary data comparison assistant. Your task is to determine if two blobs are semantically equivalent.

Consider these factors when comparing:
- Content type and MIME types
- Binary signatures and magic bytes
- Content structure similarity
- Whether content represents the same data in different formats/compressions
- Size differences and their implications

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic blob equality
 */
export function semanticEqualsPrompt(
  blob1Info: { type: string; size: number; preview: string },
  blob2Info: { type: string; size: number; preview: string }
): string {
  return `Compare these two blobs for semantic equivalence.

Blob 1:
- Type: ${blob1Info.type}
- Size: ${blob1Info.size} bytes
- Preview (hex): ${blob1Info.preview}

Blob 2:
- Type: ${blob2Info.type}
- Size: ${blob2Info.size} bytes
- Preview (hex): ${blob2Info.preview}

Respond with JSON in this exact format:
{"equivalent": <boolean>, "note": "<explanation of equivalence or differences>", "confidence": <0-1>}`;
}

/**
 * System prompt for content type detection
 */
export const DETECT_CONTENT_TYPE_SYSTEM = `You are a file type detection assistant. Your task is to detect the actual content type of binary data based on magic bytes and content signatures.

Common magic byte patterns:
- PNG: 89 50 4E 47 0D 0A 1A 0A
- JPEG: FF D8 FF
- GIF: 47 49 46 38
- PDF: 25 50 44 46
- ZIP: 50 4B 03 04
- MP3: 49 44 33 or FF FB
- MP4: various (ftyp signature)
- HTML/XML: text patterns
- JSON: starts with { or [

Always respond with valid JSON only.`;

/**
 * User prompt template for content type detection
 */
export function detectContentTypePrompt(
  declaredType: string,
  magicBytes: string,
  size: number
): string {
  return `Detect the actual content type of this blob.

Declared MIME type: ${declaredType || 'not specified'}
Magic bytes (hex): ${magicBytes}
Size: ${size} bytes

Respond with JSON in this exact format:
{"type": "<detected MIME type>", "declaredType": "${declaredType || ''}", "mismatch": <boolean>, "confidence": <0-1>}`;
}

/**
 * System prompt for blob analysis
 */
export const ANALYZE_BLOB_SYSTEM = `You are a binary data analysis assistant. Your task is to analyze blob contents and provide detailed information about the data.

For images, consider: dimensions, color depth, transparency, compression
For documents: format, potential content type
For audio/video: format, potential duration, codec hints
For text-based: encoding, structure

Always respond with valid JSON only.`;

/**
 * User prompt template for blob analysis
 */
export function analyzeBlobPrompt(
  type: string,
  size: number,
  preview: string
): string {
  return `Analyze this blob and provide details about its contents.

Type: ${type}
Size: ${size} bytes
Preview (hex): ${preview}

Respond with JSON in this exact format:
{"type": "<content category>", "details": {<relevant details based on type>}}

For images, include: format, estimatedDimensions, hasTransparency (if detectable)
For documents: format, structure
For audio/video: format, codecHints
For other types: structure, encoding`;
}

/**
 * System prompt for use case validation
 */
export const VALIDATE_FOR_SYSTEM = `You are a file validation assistant. Your task is to validate if a blob is suitable for a specific use case.

Consider:
- Content type appropriateness
- Size constraints for the use case
- Format compatibility
- Quality requirements
- Security considerations

Always respond with valid JSON only.`;

/**
 * User prompt template for use case validation
 */
export function validateForPrompt(
  useCase: string,
  type: string,
  size: number,
  preview: string
): string {
  return `Validate if this blob is suitable for the specified use case.

Use case: ${useCase}
Type: ${type}
Size: ${size} bytes
Preview (hex): ${preview}

Respond with JSON in this exact format:
{"valid": <boolean>, "reason": "<reason if not valid>", "suggestions": [<list of improvement suggestions if any>]}`;
}

/**
 * System prompt for safety assessment
 */
export const IS_SAFE_SYSTEM = `You are a file safety assessment assistant. Your task is to assess whether a blob is safe (no malicious content indicators).

Safety checks to consider:
- Magic byte validation (type matches declared type)
- Suspicious patterns (embedded scripts, polyglot files)
- Known malicious signatures
- Extension/type mismatches
- Unusual size characteristics

Always respond with valid JSON only.`;

/**
 * User prompt template for safety assessment
 */
export function isSafePrompt(
  declaredType: string,
  detectedType: string,
  size: number,
  magicBytes: string
): string {
  return `Assess the safety of this blob.

Declared type: ${declaredType}
Detected type: ${detectedType}
Size: ${size} bytes
Magic bytes (hex): ${magicBytes}

Respond with JSON in this exact format:
{"safe": <boolean>, "warnings": [<list of warning messages>], "scanned": [<list of checks performed>]}`;
}

/**
 * System prompt for blob explanation
 */
export const EXPLAIN_BLOB_SYSTEM = `You are a file description assistant. Your task is to explain what a blob contains in human-readable terms.

Provide a clear, concise description that a non-technical user could understand.

Always respond with valid JSON only.`;

/**
 * User prompt template for blob explanation
 */
export function explainBlobPrompt(
  type: string,
  size: number,
  preview: string
): string {
  return `Explain what this blob contains in human-readable terms.

Type: ${type}
Size: ${size} bytes
Preview (hex): ${preview}

Respond with JSON in this exact format:
{"explanation": "<human-readable description of the blob contents>"}`;
}

/**
 * System prompt for metadata extraction
 */
export const GET_METADATA_SYSTEM = `You are a file metadata extraction assistant. Your task is to extract and infer metadata from blob data.

Extract information like:
- Content type and format
- Size information
- Structural characteristics
- Format-specific metadata hints

Always respond with valid JSON only.`;

/**
 * User prompt template for metadata extraction
 */
export function getMetadataPrompt(
  type: string,
  size: number,
  preview: string
): string {
  return `Extract metadata from this blob.

Type: ${type}
Size: ${size} bytes
Preview (hex): ${preview}

Respond with JSON containing relevant metadata fields based on the content type.
Always include: type, size, format. Add additional fields as appropriate.`;
}

// =============================================================================
// SEMANTIC FILE PROMPTS
// =============================================================================

/**
 * System prompt for filename validation
 */
export const VALIDATE_FILENAME_SYSTEM = `You are a filename validation assistant. Your task is to validate filenames against specified rules.

Common filename rules:
- no spaces: filename should not contain spaces
- lowercase only: all characters should be lowercase
- alphanumeric: only letters, numbers, and allowed separators
- no special characters: avoid special characters
- max length: reasonable filename length
- valid extension: extension matches content

Always respond with valid JSON only.`;

/**
 * User prompt template for filename validation
 */
export function validateFilenamePrompt(filename: string, rules: string[]): string {
  return `Validate this filename against the specified rules.

Filename: ${filename}
Rules: ${rules.join(', ')}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [<list of rule violations>], "suggestions": [<suggested corrected filenames>]}`;
}

/**
 * System prompt for extension validation
 */
export const VALIDATE_EXTENSION_SYSTEM = `You are a file extension validation assistant. Your task is to check if a file's extension matches its actual content type.

Consider:
- Common extension mappings
- MIME type to extension relationships
- Content detection results

Always respond with valid JSON only.`;

/**
 * User prompt template for extension validation
 */
export function validateExtensionPrompt(
  filename: string,
  actualType: string,
  detectedType: string
): string {
  return `Check if this file's extension matches its content.

Filename: ${filename}
Declared MIME type: ${actualType}
Detected content type: ${detectedType}

Respond with JSON in this exact format:
{"matches": <boolean>, "actualType": "${detectedType}", "expectedType": "<expected type based on extension>"}`;
}

/**
 * System prompt for category inference
 */
export const INFER_CATEGORY_SYSTEM = `You are a file categorization assistant. Your task is to infer the category of a file based on its name, type, and content.

Categories to consider:
- document (subcategories: text, spreadsheet, presentation, pdf)
- image (subcategories: photo, icon, vector, screenshot)
- video (subcategories: movie, clip, animation)
- audio (subcategories: music, voice, sound-effect)
- archive (subcategories: compressed, backup)
- code (subcategories: source, config, script)
- data (subcategories: database, dataset, export)

Always respond with valid JSON only.`;

/**
 * User prompt template for category inference
 */
export function inferCategoryPrompt(
  filename: string,
  type: string,
  size: number
): string {
  return `Infer the category of this file.

Filename: ${filename}
Type: ${type}
Size: ${size} bytes

Respond with JSON in this exact format:
{"category": "<main category>", "subcategory": "<specific subcategory if applicable>", "confidence": <0-1>}`;
}

/**
 * System prompt for filename suggestion
 */
export const SUGGEST_FILENAME_SYSTEM = `You are a filename suggestion assistant. Your task is to suggest a better, more descriptive filename based on file content and context.

Consider:
- Content type and format
- Descriptive naming conventions
- Date/timestamp inclusion if appropriate
- Proper extension
- Clean, readable format

Always respond with valid JSON only.`;

/**
 * User prompt template for filename suggestion
 */
export function suggestFilenamePrompt(
  currentFilename: string,
  type: string,
  contentHints: string
): string {
  return `Suggest a better filename for this file.

Current filename: ${currentFilename}
Type: ${type}
Content hints: ${contentHints}

Respond with JSON in this exact format:
{"suggested": "<suggested filename with extension>", "reason": "<explanation for the suggestion>"}`;
}
