/**
 * SemanticFormData - LLM-enhanced FormData type with semantic understanding
 *
 * Extends the native FormData with semantic operations including:
 * - Intelligent field validation and matching
 * - Form purpose detection
 * - Sensitive data detection
 * - Missing field suggestions
 * - File validation
 *
 * Implements shared interfaces:
 * - Semantic<FormData> - Base semantic wrapper
 * - Comparable<FormData> - Semantic equality comparison
 * - Explainable - Human-readable explanations
 */

import type { LLMConfig, Message } from '../../llm/types.ts';

/** Type alias for FormData entry values (string or File) */
type FormDataEntryValue = string | File;

// Lazy load the chat function to avoid loading LLM providers when using mocks
let _chat: typeof import('../../llm/index.ts').chat | null = null;
async function getChat(): Promise<typeof import('../../llm/index.ts').chat> {
  if (!_chat) {
    const llm = await import('../../llm/index.ts');
    _chat = llm.chat;
  }
  return _chat;
}
import type { SemanticEqualsResult } from '../../shared/types.ts';
import type { Semantic, Comparable, Explainable } from '../../shared/interfaces.ts';
import {
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  VALIDATE_SYSTEM,
  validatePrompt,
  SEMANTIC_GET_SYSTEM,
  semanticGetPrompt,
  INFER_PURPOSE_SYSTEM,
  inferPurposePrompt,
  DETECT_SENSITIVE_SYSTEM,
  detectSensitivePrompt,
  SUGGEST_MISSING_SYSTEM,
  suggestMissingFieldsPrompt,
  VALIDATE_FILES_SYSTEM,
  validateFilesPrompt,
  EXPLAIN_SYSTEM,
  explainPrompt,
  TO_OBJECT_SYSTEM,
  toObjectPrompt,
} from './prompts.ts';

// =============================================================================
// TYPES
// =============================================================================

/** Extended semantic equals result with field mappings */
export interface FormDataSemanticEqualsResult extends SemanticEqualsResult {
  fieldMappings?: Record<string, string>;
}

/** Validation result with field-specific issues */
export interface FormDataValidateResult {
  valid: boolean;
  issues: { field: string; issue: string }[];
}

/** Result of semantic field access */
export interface FormDataSemanticGetResult {
  value: FormDataEntryValue | null;
  matchedField: string | undefined;
  confidence: number;
}

/** Result of purpose inference */
export interface FormDataInferPurposeResult {
  purpose: string;
  requiredFields: string[];
  confidence: number;
}

/** Result of sensitive data detection */
export interface FormDataDetectSensitiveResult {
  hasSensitive: boolean;
  fields: string[];
  recommendation: string;
}

/** Suggestion for a missing field */
export interface FormDataMissingSuggestion {
  field: string;
  reason: string;
  required: boolean;
}

/** File validation rules */
export interface FileValidationRules {
  maxSize?: string;
  allowedTypes?: string[];
}

/** File validation result */
export interface FormDataFileValidateResult {
  valid: boolean;
  issues: { field: string; issue: string }[];
}

/** LLM client interface for dependency injection */
export interface FormDataLLMClientInterface {
  chat(options: {
    messages: Message[];
    systemPrompt?: string;
  } & LLMConfig): Promise<{ content: string }>;
}

// =============================================================================
// CLASS
// =============================================================================

/**
 * SemanticFormData class
 * Wraps FormData with LLM-powered semantic operations
 *
 * Implements:
 * - Semantic<FormData> - valueOf() returns the FormData value
 * - Comparable<FormData> - semanticallyEquals() for comparison
 * - Explainable - explain() for human-readable explanations
 */
export class SemanticFormData
  implements
    Semantic<FormData>,
    Comparable<FormData, FormDataSemanticEqualsResult>,
    Explainable
{
  private readonly _formData: FormData;
  private readonly _context?: string;
  private readonly _llmClient: FormDataLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticFormData instance
   * @param formData - The FormData value to wrap
   * @param context - Optional context about the form's purpose
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    formData: FormData,
    context?: string,
    llmClient?: FormDataLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._formData = formData;
    this._context = context;
    // Use provided client or create a lazy-loading wrapper
    this._llmClient = llmClient || {
      chat: async (options) => {
        const chatFn = await getChat();
        return chatFn(options);
      },
    };
    this._llmConfig = llmConfig;
  }

  /**
   * Create SemanticFormData from existing FormData or object.
   *
   * @param data - FormData or plain object
   * @param context - Context about the form's purpose
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticFormData instance
   *
   * @example
   * SemanticFormData.from({ name: "John", email: "john@example.com" })
   * SemanticFormData.from(existingFormData, "user registration")
   */
  static from(
    data: FormData | Record<string, unknown>,
    context?: string,
    llmClient?: FormDataLLMClientInterface,
    llmConfig?: LLMConfig
  ): SemanticFormData {
    let formData: FormData;

    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof Blob) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          // Convert values to strings appropriately
          let stringValue: string;
          if (typeof value === 'string') {
            stringValue = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            stringValue = String(value);
          } else if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
          } else {
            // For other types (symbol, bigint, etc.), use JSON.stringify
            stringValue = JSON.stringify(value);
          }
          formData.append(key, stringValue);
        }
      }
    }

    return new SemanticFormData(formData, context, llmClient, llmConfig);
  }

  /**
   * Get a string representation of all form fields for LLM prompts
   */
  private _getFieldsString(): string {
    const fields: string[] = [];
    for (const [key, value] of this._formData.entries() as IterableIterator<[string, FormDataEntryValue]>) {
      if (value instanceof File) {
        fields.push(`${key}: [File: ${value.name}, type: ${value.type}, size: ${value.size} bytes]`);
      } else {
        fields.push(`${key}: ${value}`);
      }
    }
    return fields.join('\n');
  }

  /**
   * Get file information for validation
   */
  private _getFilesString(): string {
    const files: string[] = [];
    for (const [key, value] of this._formData.entries() as IterableIterator<[string, FormDataEntryValue]>) {
      if (value instanceof File) {
        files.push(`${key}: { name: "${value.name}", type: "${value.type}", size: ${value.size} }`);
      }
    }
    return files.length > 0 ? files.join('\n') : '(no files)';
  }

  /**
   * Check if two FormData objects are semantically equivalent.
   *
   * @param other - FormData to compare
   * @param _options - Optional comparison options (unused, for interface compatibility)
   * @returns Equivalence result with field mappings
   *
   * @example
   * form1.semanticallyEquals(form2)
   * // { equivalent: true, fieldMappings: { "firstName": "first_name" }, confidence: 0.95 }
   */
  async semanticallyEquals(
    other: FormData,
    _options?: Record<string, unknown>
  ): Promise<FormDataSemanticEqualsResult> {
    const thisFields = this._getFieldsString();

    // Get fields from the other FormData
    const otherFields: string[] = [];
    for (const [key, value] of other.entries() as IterableIterator<[string, FormDataEntryValue]>) {
      if (value instanceof File) {
        otherFields.push(`${key}: [File: ${value.name}, type: ${value.type}, size: ${value.size} bytes]`);
      } else {
        otherFields.push(`${key}: ${value}`);
      }
    }

    const messages: Message[] = [
      {
        role: 'user',
        content: semanticEqualsPrompt(thisFields, otherFields.join('\n'), this._context),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FormDataSemanticEqualsResult;
  }

  /**
   * Validate form data against semantic rules.
   *
   * @param rules - Validation rules in natural language
   * @returns Validation result with field-specific issues
   *
   * @example
   * form.validate([
   *   "email must be valid",
   *   "password must be strong",
   *   "file must be an image"
   * ])
   */
  async validate(rules: string[]): Promise<FormDataValidateResult> {
    const fields = this._getFieldsString();

    const messages: Message[] = [
      {
        role: 'user',
        content: validatePrompt(fields, rules),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FormDataValidateResult;
  }

  /**
   * Get a field using semantic matching.
   *
   * @param query - Field name or semantic description
   * @returns Field value with match confidence
   *
   * @example
   * form.semanticGet("user's email address")
   * // { value: "john@example.com", matchedField: "email", confidence: 0.95 }
   */
  async semanticGet(query: string): Promise<FormDataSemanticGetResult> {
    const fields = this._getFieldsString();

    const messages: Message[] = [
      {
        role: 'user',
        content: semanticGetPrompt(fields, query),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_GET_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as {
      matchedField: string | null;
      confidence: number;
    };

    return {
      value: result.matchedField ? this._formData.get(result.matchedField) : null,
      matchedField: result.matchedField || undefined,
      confidence: result.confidence,
    };
  }

  /**
   * Detect the purpose of this form.
   *
   * @returns Form purpose detection result
   *
   * @example
   * form.inferPurpose()
   * // { purpose: "user-registration", requiredFields: ["email", "password"], confidence: 0.92 }
   */
  async inferPurpose(): Promise<FormDataInferPurposeResult> {
    const fields = this._getFieldsString();

    const messages: Message[] = [
      {
        role: 'user',
        content: inferPurposePrompt(fields, this._context),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: INFER_PURPOSE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FormDataInferPurposeResult;
  }

  /**
   * Check for sensitive data in the form.
   *
   * @returns Sensitivity analysis result
   *
   * @example
   * form.detectSensitive()
   * // { hasSensitive: true, fields: ["password", "ssn"], recommendation: "Use HTTPS" }
   */
  async detectSensitive(): Promise<FormDataDetectSensitiveResult> {
    const fields = this._getFieldsString();

    const messages: Message[] = [
      {
        role: 'user',
        content: detectSensitivePrompt(fields),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DETECT_SENSITIVE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FormDataDetectSensitiveResult;
  }

  /**
   * Suggest missing fields based on form purpose.
   *
   * @returns Suggested fields with reasons
   *
   * @example
   * form.suggestMissingFields()
   * // [{ field: "confirmPassword", reason: "Registration forms typically require password confirmation", required: true }]
   */
  async suggestMissingFields(): Promise<FormDataMissingSuggestion[]> {
    const fields = this._getFieldsString();

    // First infer the purpose if not provided
    let purpose: string | undefined = this._context;
    if (!purpose) {
      const purposeResult = await this.inferPurpose();
      purpose = purposeResult.purpose;
    }

    const messages: Message[] = [
      {
        role: 'user',
        content: suggestMissingFieldsPrompt(fields, purpose),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SUGGEST_MISSING_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { suggestions: FormDataMissingSuggestion[] };
    return result.suggestions;
  }

  /**
   * Validate file fields in the form.
   *
   * @param rules - File validation rules
   * @returns Validation result for file fields
   *
   * @example
   * form.validateFiles({
   *   maxSize: "5MB",
   *   allowedTypes: ["image/*", "application/pdf"]
   * })
   */
  async validateFiles(rules: FileValidationRules): Promise<FormDataFileValidateResult> {
    const files = this._getFilesString();

    // If no files, return valid
    if (files === '(no files)') {
      return { valid: true, issues: [] };
    }

    const messages: Message[] = [
      {
        role: 'user',
        content: validateFilesPrompt(files, rules),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_FILES_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FormDataFileValidateResult;
  }

  /**
   * Explain the form contents.
   *
   * @param _context - Optional context (unused, for interface compatibility)
   * @returns Human-readable explanation
   *
   * @example
   * form.explain()
   * // "User registration form with name, email, password, and profile picture"
   */
  async explain(_context?: string): Promise<string> {
    const fields = this._getFieldsString();

    const messages: Message[] = [
      {
        role: 'user',
        content: explainPrompt(fields, this._context),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: EXPLAIN_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Convert to a plain object with semantic field names.
   *
   * @param targetConvention - Naming convention for keys (defaults to camelCase)
   * @returns Plain object with converted field names
   */
  async toObject(
    targetConvention: 'camelCase' | 'snake_case' = 'camelCase'
  ): Promise<Record<string, unknown>> {
    // Get all field names
    const fieldNames: string[] = [];
    for (const key of this._formData.keys()) {
      if (!fieldNames.includes(key)) {
        fieldNames.push(key);
      }
    }

    const fieldsString = fieldNames.join(', ');

    const messages: Message[] = [
      {
        role: 'user',
        content: toObjectPrompt(fieldsString, targetConvention),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: TO_OBJECT_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { mappings: Record<string, string> };

    // Build the result object
    const obj: Record<string, unknown> = {};
    for (const [originalKey, convertedKey] of Object.entries(result.mappings)) {
      const values = this._formData.getAll(originalKey);
      if (values.length === 1) {
        const value = values[0];
        obj[convertedKey] = value instanceof File ? value : value;
      } else if (values.length > 1) {
        obj[convertedKey] = values;
      }
    }

    return obj;
  }

  /**
   * Get the raw FormData value
   * @returns The underlying FormData
   */
  valueOf(): FormData {
    return this._formData;
  }

  /**
   * Get the context string
   * @returns The context or undefined
   */
  getContext(): string | undefined {
    return this._context;
  }

  // ==========================================================================
  // Delegate common FormData methods
  // ==========================================================================

  /**
   * Append a value to the form data
   */
  append(name: string, value: string | Blob, filename?: string): void {
    if (filename && value instanceof Blob) {
      this._formData.append(name, value, filename);
    } else {
      this._formData.append(name, value);
    }
  }

  /**
   * Delete all values for a field
   */
  delete(name: string): void {
    this._formData.delete(name);
  }

  /**
   * Get the first value for a field
   */
  get(name: string): FormDataEntryValue | null {
    return this._formData.get(name);
  }

  /**
   * Get all values for a field
   */
  getAll(name: string): FormDataEntryValue[] {
    return this._formData.getAll(name);
  }

  /**
   * Check if a field exists
   */
  has(name: string): boolean {
    return this._formData.has(name);
  }

  /**
   * Set a value for a field (replaces existing)
   */
  set(name: string, value: string | Blob, filename?: string): void {
    if (filename && value instanceof Blob) {
      this._formData.set(name, value, filename);
    } else {
      this._formData.set(name, value);
    }
  }

  /**
   * Iterate over all entries
   */
  entries(): IterableIterator<[string, FormDataEntryValue]> {
    return this._formData.entries();
  }

  /**
   * Iterate over all keys
   */
  keys(): IterableIterator<string> {
    return this._formData.keys();
  }

  /**
   * Iterate over all values
   */
  values(): IterableIterator<FormDataEntryValue> {
    return this._formData.values();
  }

  /**
   * forEach iteration
   */
  forEach(
    callback: (value: FormDataEntryValue, key: string, parent: FormData) => void
  ): void {
    this._formData.forEach(callback);
  }

  /**
   * Get all field names
   */
  getFieldNames(): string[] {
    const names: string[] = [];
    for (const key of this._formData.keys()) {
      if (!names.includes(key)) {
        names.push(key);
      }
    }
    return names;
  }
}
