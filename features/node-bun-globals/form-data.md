# SemanticFormData

## Overview

The `SemanticFormData` type wraps the FormData API with LLM-powered semantic understanding. It enables intelligent form validation, field analysis, and multipart content handling.

**Core Principle**: FormData represents form submissions - semantic operations should understand field purposes, validate content, and ensure data integrity.

---

## Interface

```typescript
interface SemanticFormData extends FormData {
  /**
   * Create SemanticFormData from existing FormData or object.
   *
   * @param data - FormData, object, or HTMLFormElement
   * @param context - Context about the form's purpose
   * @returns SemanticFormData instance
   *
   * @example
   * SemanticFormData.from(document.querySelector("form"), "user registration")
   * SemanticFormData.from({ name: "John", email: "john@example.com" })
   */
  static from(
    data: FormData | Record<string, unknown> | HTMLFormElement,
    context?: string
  ): SemanticFormData;

  /**
   * Check if two FormData objects are semantically equivalent.
   *
   * @param other - FormData to compare
   * @returns Equivalence result
   *
   * @example
   * form1.semanticallyEquals(form2)
   * // { equivalent: true, fieldMappings: { "firstName": "first_name" } }
   */
  semanticallyEquals(other: FormData): {
    equivalent: boolean;
    fieldMappings?: Record<string, string>;
    confidence: number;
  };

  /**
   * Validate form data against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * form.validate([
   *   "email must be valid",
   *   "password must be strong",
   *   "file must be an image"
   * ])
   */
  validate(rules: string[]): {
    valid: boolean;
    issues: Array<{ field: string; issue: string }>;
  };

  /**
   * Get a field using semantic matching.
   *
   * @param query - Field name or semantic description
   * @returns Field value
   *
   * @example
   * form.semanticGet("user's email address")
   * // { value: "john@example.com", matchedField: "email", confidence: 0.95 }
   */
  semanticGet(query: string): {
    value: FormDataEntryValue | null;
    matchedField: string | undefined;
    confidence: number;
  };

  /**
   * Detect the purpose of this form.
   *
   * @returns Form purpose detection
   *
   * @example
   * form.inferPurpose()
   * // { purpose: "user-registration", requiredFields: ["email", "password"] }
   */
  inferPurpose(): {
    purpose: string;
    requiredFields: string[];
    confidence: number;
  };

  /**
   * Check for sensitive data in the form.
   *
   * @returns Sensitivity analysis
   *
   * @example
   * form.detectSensitive()
   * // { hasSensitive: true, fields: ["password", "ssn"], recommendation: "Use HTTPS" }
   */
  detectSensitive(): {
    hasSensitive: boolean;
    fields: string[];
    recommendation: string;
  };

  /**
   * Suggest missing fields based on form purpose.
   *
   * @returns Suggested fields
   *
   * @example
   * form.suggestMissingFields()
   * // [{ field: "confirmPassword", reason: "Registration forms typically require password confirmation" }]
   */
  suggestMissingFields(): Array<{
    field: string;
    reason: string;
    required: boolean;
  }>;

  /**
   * Validate file fields in the form.
   *
   * @param rules - File validation rules
   * @returns Validation result
   *
   * @example
   * form.validateFiles({
   *   maxSize: "5MB",
   *   allowedTypes: ["image/*", "application/pdf"]
   * })
   */
  validateFiles(rules: {
    maxSize?: string;
    allowedTypes?: string[];
  }): {
    valid: boolean;
    issues: Array<{ field: string; issue: string }>;
  };

  /**
   * Explain the form contents.
   *
   * @returns Human-readable explanation
   *
   * @example
   * form.explain()
   * // "User registration form with name, email, password, and profile picture"
   */
  explain(): string;

  /**
   * Convert to a plain object with semantic field names.
   *
   * @param targetConvention - Naming convention for keys
   * @returns Plain object
   */
  toObject(targetConvention?: "camelCase" | "snake_case"): Record<string, unknown>;
}
```
