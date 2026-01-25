/**
 * SemanticFile - LLM-enhanced File type with semantic understanding
 *
 * Extends SemanticBlob with file-specific semantic operations including:
 * - Filename validation
 * - Extension matching
 * - Category inference
 * - Filename suggestions
 *
 * Implements shared interfaces:
 * - Semantic<File> - Base semantic wrapper
 * - Comparable<File> - Semantic equality comparison
 * - Explainable - Human-readable explanations
 */

import type { LLMConfig, Message } from '../../llm/types.ts';
import { SemanticBlob, type BlobLLMClientInterface } from './blob.ts';
import { SemanticDate } from '../date/date.ts';
import {
  VALIDATE_FILENAME_SYSTEM,
  validateFilenamePrompt,
  VALIDATE_EXTENSION_SYSTEM,
  validateExtensionPrompt,
  INFER_CATEGORY_SYSTEM,
  inferCategoryPrompt,
  SUGGEST_FILENAME_SYSTEM,
  suggestFilenamePrompt,
} from './prompts.ts';

// Re-export blob types
export type {
  BlobSemanticEqualsResult,
  ContentTypeResult,
  AnalyzeResult,
  ValidateForResult,
  SafetyResult,
  BlobLLMClientInterface,
} from './blob.ts';

/** Result of filename validation */
export interface FilenameValidationResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

/** Result of extension validation */
export interface ExtensionValidationResult {
  matches: boolean;
  actualType: string;
  expectedType: string;
}

/** Result of category inference */
export interface CategoryResult {
  category: string;
  subcategory?: string;
  confidence: number;
}

/** Result of filename suggestion */
export interface FilenameSuggestionResult {
  suggested: string;
  reason: string;
}

/** LLM client interface for dependency injection */
export type FileLLMClientInterface = BlobLLMClientInterface;

/**
 * SemanticFile class
 * Wraps a File value with LLM-powered semantic operations
 *
 * Extends SemanticBlob with file-specific capabilities:
 * - validateFilename() for filename rule validation
 * - validateExtension() for extension/content matching
 * - inferCategory() for file categorization
 * - suggestFilename() for better naming suggestions
 * - getLastModified() for semantic date access
 */
export class SemanticFile extends SemanticBlob {
  protected readonly _file: File;
  protected readonly _filename: string;
  protected readonly _lastModified: number;

  /**
   * Create a SemanticFile instance
   * @param file - The File value to wrap
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    file: File,
    llmClient?: FileLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    super(file, llmClient, llmConfig);
    this._file = file;
    this._filename = file.name;
    this._lastModified = file.lastModified;
  }

  /**
   * Create a SemanticFile from File or Blob.
   *
   * @param file - File or Blob with name
   * @param filename - Optional filename override
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticFile instance
   *
   * @example
   * SemanticFile.fromFile(inputElement.files[0])
   */
  static fromFile(
    file: File | Blob,
    filename?: string,
    llmClient?: FileLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticFile {
    if (file instanceof File) {
      return new SemanticFile(file, llmClient, llmConfig);
    }
    // Convert Blob to File
    const name = filename || 'unnamed';
    const fileFromBlob = new File([file], name, { type: file.type });
    return new SemanticFile(fileFromBlob, llmClient, llmConfig);
  }

  /**
   * Validate the filename.
   *
   * @param rules - Filename validation rules
   * @returns Validation result
   *
   * @example
   * file.validateFilename(["no spaces", "lowercase only"])
   * // { valid: false, issues: ["contains spaces"], suggestions: ["use-kebab-case.pdf"] }
   */
  async validateFilename(rules: string[] = []): Promise<FilenameValidationResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: validateFilenamePrompt(this._filename, rules),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_FILENAME_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FilenameValidationResult;
  }

  /**
   * Check if file extension matches content.
   *
   * @returns Match result
   *
   * @example
   * file.validateExtension()
   * // { matches: false, actualType: "image/png", expectedType: "image/jpeg" }
   */
  async validateExtension(): Promise<ExtensionValidationResult> {
    const detectedResult = await this.detectContentType();

    const messages: Message[] = [
      {
        role: 'user',
        content: validateExtensionPrompt(
          this._filename,
          this._file.type || 'application/octet-stream',
          detectedResult.type
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_EXTENSION_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ExtensionValidationResult;
  }

  /**
   * Infer the file category.
   *
   * @returns File category
   *
   * @example
   * file.inferCategory()
   * // { category: "document", subcategory: "spreadsheet", confidence: 0.95 }
   */
  async inferCategory(): Promise<CategoryResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: inferCategoryPrompt(
          this._filename,
          this._file.type || 'application/octet-stream',
          this._file.size
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: INFER_CATEGORY_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as CategoryResult;
  }

  /**
   * Suggest a better filename.
   *
   * @returns Suggested filename
   *
   * @example
   * file.suggestFilename()
   * // { suggested: "invoice-2024-01.pdf", reason: "Based on document content" }
   */
  async suggestFilename(): Promise<FilenameSuggestionResult> {
    const preview = await this.getPreview(32);

    const messages: Message[] = [
      {
        role: 'user',
        content: suggestFilenamePrompt(
          this._filename,
          this._file.type || 'application/octet-stream',
          `Size: ${this._file.size} bytes, Preview: ${preview}`
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SUGGEST_FILENAME_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FilenameSuggestionResult;
  }

  /**
   * Get the file's modification timestamp as SemanticDate.
   *
   * @returns Last modified date with semantic capabilities
   */
  getLastModified(): SemanticDate {
    return new SemanticDate(new Date(this._lastModified));
  }

  /**
   * Get the raw File value
   * @returns The underlying File
   */
  override valueOf(): File {
    return this._file;
  }

  // Expose native File properties

  /**
   * Get the filename
   */
  get name(): string {
    return this._filename;
  }

  /**
   * Get the last modified timestamp
   */
  get lastModified(): number {
    return this._lastModified;
  }

  /**
   * Get the webkitRelativePath (if available)
   */
  get webkitRelativePath(): string {
    return (this._file as { webkitRelativePath?: string }).webkitRelativePath ?? '';
  }
}
