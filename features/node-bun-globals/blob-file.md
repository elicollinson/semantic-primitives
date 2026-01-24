# SemanticBlob / SemanticFile

## Overview

The `SemanticBlob` and `SemanticFile` types wrap the Blob and File APIs with LLM-powered semantic understanding. They enable intelligent content detection, file validation, and binary data analysis.

**Core Principle**: Blobs and Files represent binary data with meaning - semantic operations should understand content types, validate file integrity, and analyze contents.

---

## Interface

```typescript
interface SemanticBlob extends Blob {
  /**
   * Create a SemanticBlob from existing Blob or data.
   *
   * @param data - Blob, ArrayBuffer, or string
   * @param options - Blob options
   * @returns SemanticBlob instance
   *
   * @example
   * SemanticBlob.from(arrayBuffer, { type: "image/png" })
   */
  static from(
    data: BlobPart | Blob,
    options?: BlobPropertyBag
  ): SemanticBlob;

  /**
   * Check if two blobs are semantically equivalent.
   *
   * @param other - Blob to compare
   * @returns Equivalence result
   *
   * @example
   * blob1.semanticallyEquals(blob2)
   * // { equivalent: true, note: "Same image, different compression" }
   */
  semanticallyEquals(other: Blob): Promise<{
    equivalent: boolean;
    note?: string;
    confidence: number;
  }>;

  /**
   * Detect the actual content type (not just MIME header).
   *
   * @returns Content detection result
   *
   * @example
   * blob.detectContentType()
   * // { type: "image/png", declaredType: "application/octet-stream", mismatch: true }
   */
  detectContentType(): Promise<{
    type: string;
    declaredType: string;
    mismatch: boolean;
    confidence: number;
  }>;

  /**
   * Analyze the blob contents.
   *
   * @returns Content analysis
   *
   * @example
   * imageBlob.analyze()
   * // { type: "image", dimensions: { width: 800, height: 600 }, hasTransparency: true }
   */
  analyze(): Promise<{
    type: string;
    details: Record<string, unknown>;
  }>;

  /**
   * Validate the blob for a specific use case.
   *
   * @param useCase - Intended use
   * @returns Validation result
   *
   * @example
   * blob.validateFor("profile picture")
   * // { valid: false, reason: "Image dimensions too small (min 200x200)" }
   */
  validateFor(useCase: string): Promise<{
    valid: boolean;
    reason?: string;
    suggestions?: string[];
  }>;

  /**
   * Check if the blob is safe (no malicious content).
   *
   * @returns Safety assessment
   *
   * @example
   * blob.isSafe()
   * // { safe: true, scanned: ["magic-bytes", "extension-match"] }
   */
  isSafe(): Promise<{
    safe: boolean;
    warnings: string[];
    scanned: string[];
  }>;

  /**
   * Explain what this blob contains.
   *
   * @returns Human-readable explanation
   */
  explain(): Promise<string>;

  /**
   * Get a summary of blob metadata.
   *
   * @returns Metadata summary
   */
  getMetadata(): Promise<Record<string, unknown>>;
}

interface SemanticFile extends SemanticBlob, File {
  /**
   * Create a SemanticFile from File or Blob.
   *
   * @param file - File or Blob with name
   * @param filename - Optional filename override
   * @returns SemanticFile instance
   *
   * @example
   * SemanticFile.from(inputElement.files[0])
   */
  static from(file: File | Blob, filename?: string): SemanticFile;

  /**
   * Validate the filename.
   *
   * @param rules - Filename validation rules
   * @returns Validation result
   *
   * @example
   * file.validateFilename(["no spaces", "lowercase only"])
   * // { valid: false, suggestions: ["use-kebab-case.pdf"] }
   */
  validateFilename(rules?: string[]): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  };

  /**
   * Check if file extension matches content.
   *
   * @returns Match result
   *
   * @example
   * file.validateExtension()
   * // { matches: false, actualType: "image/png", expectedType: "image/jpeg" }
   */
  validateExtension(): Promise<{
    matches: boolean;
    actualType: string;
    expectedType: string;
  }>;

  /**
   * Infer the file category.
   *
   * @returns File category
   *
   * @example
   * file.inferCategory()
   * // { category: "document", subcategory: "spreadsheet", confidence: 0.95 }
   */
  inferCategory(): Promise<{
    category: string;
    subcategory?: string;
    confidence: number;
  }>;

  /**
   * Suggest a better filename.
   *
   * @returns Suggested filename
   *
   * @example
   * file.suggestFilename()
   * // { suggested: "invoice-2024-01.pdf", reason: "Based on document content" }
   */
  suggestFilename(): Promise<{
    suggested: string;
    reason: string;
  }>;

  /**
   * Get the file's modification timestamp as SemanticDate.
   *
   * @returns Last modified date with semantic capabilities
   */
  getLastModified(): SemanticDate;
}
```
