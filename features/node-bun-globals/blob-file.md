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

---

## Implementation Notes

### Implementation Details

The implementation is located in `src/types/blob-file/` with the following structure:

```
src/types/blob-file/
├── index.ts          # Re-exports all public APIs
├── blob.ts           # SemanticBlob class implementation
├── file.ts           # SemanticFile class (extends SemanticBlob)
├── prompts.ts        # LLM prompt templates for semantic operations
└── __tests__/
    ├── blob.test.ts  # Tests for SemanticBlob
    └── file.test.ts  # Tests for SemanticFile
```

### API Changes from Spec

1. **SemanticFile.fromFile()**: The static factory method on `SemanticFile` is named `fromFile()` instead of `from()` to avoid signature conflicts with the inherited `SemanticBlob.from()` method. Usage:
   ```typescript
   const file = SemanticFile.fromFile(inputElement.files[0]);
   const fileFromBlob = SemanticFile.fromFile(blob, 'filename.txt');
   ```

2. **validateFilename() is async**: The `validateFilename()` method returns a `Promise` (not synchronous as shown in spec) since it uses LLM for validation.

### TypeScript Configuration

The implementation required adding `"DOM"` to the TypeScript `lib` configuration in `tsconfig.json` to get proper Blob/File type definitions with the `slice()` method:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"]
  }
}
```

### LLM Integration

All semantic operations use dependency injection for the LLM client, allowing easy mocking in tests:

```typescript
// Production usage
const blob = SemanticBlob.from(data);
await blob.detectContentType();

// Testing with mock
const mockClient = { chat: mockFn };
const blob = new SemanticBlob(data, mockClient);
```

### Binary Data Handling

The implementation uses hex-encoded previews of binary content (first 16-64 bytes) for LLM analysis. This is sufficient for magic byte detection and basic content analysis while keeping prompts concise.

### Test Coverage

70 unit tests covering:
- Constructor and factory methods
- All semantic methods (semanticallyEquals, detectContentType, analyze, validateFor, isSafe, explain, getMetadata)
- File-specific methods (validateFilename, validateExtension, inferCategory, suggestFilename, getLastModified)
- Native Blob/File property accessors
- Inheritance from SemanticBlob to SemanticFile
