/**
 * Prompts for SemanticFormData LLM operations
 * These prompts are used for various semantic form data operations that require LLM understanding
 */

// =============================================================================
// SEMANTIC EQUALS
// =============================================================================

/**
 * System prompt for semantic form data equality comparison
 */
export const SEMANTIC_EQUALS_SYSTEM = `You are a form data comparison assistant. Your task is to determine if two sets of form data are semantically equivalent.

Consider these factors when comparing:
- Field name variations (e.g., "firstName" vs "first_name" vs "first-name")
- Similar field meanings (e.g., "email" vs "emailAddress" vs "user_email")
- Value equivalence (same data, different formatting)
- Missing fields that may have default values
- Field ordering (typically irrelevant)

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic form data equality
 */
export function semanticEqualsPrompt(
  fields1: string,
  fields2: string,
  context?: string
): string {
  const contextPart = context ? `\nContext: ${context}` : '';
  return `Compare these two form data sets for semantic equivalence.${contextPart}

Form Data 1:
${fields1}

Form Data 2:
${fields2}

Respond with JSON in this exact format:
{"equivalent": <boolean>, "fieldMappings": {"<form1Field>": "<form2Field>", ...}, "confidence": <0-1>}

fieldMappings should map fields from Form 1 to their semantic equivalent in Form 2.`;
}

// =============================================================================
// VALIDATE
// =============================================================================

/**
 * System prompt for form validation
 */
export const VALIDATE_SYSTEM = `You are a form validation assistant. Your task is to validate form data against semantic rules described in natural language.

Consider:
- Field value formats (email, phone, date patterns)
- Required field presence
- Value constraints (length, range, allowed values)
- Cross-field validations (password confirmation, date ranges)
- Business logic rules

Always respond with valid JSON only.`;

/**
 * User prompt template for form validation
 */
export function validatePrompt(fields: string, rules: string[]): string {
  const rulesFormatted = rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
  return `Validate this form data against the specified rules.

Form Data:
${fields}

Validation Rules:
${rulesFormatted}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [{"field": "<field name>", "issue": "<description of the issue>"}]}

Only include issues for rules that are violated. Return an empty issues array if all rules pass.`;
}

// =============================================================================
// SEMANTIC GET
// =============================================================================

/**
 * System prompt for semantic field access
 */
export const SEMANTIC_GET_SYSTEM = `You are a form field matching assistant. Your task is to find form fields that match a semantic query.

Consider:
- Field name variations and conventions
- Common abbreviations (e.g., "addr" for "address", "tel" for "telephone")
- Semantic meaning beyond exact name matching
- Context clues from other fields

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic field access
 */
export function semanticGetPrompt(fields: string, query: string): string {
  return `Find the form field that best matches this query.

Available Fields:
${fields}

Query: ${query}

Respond with JSON in this exact format:
{"matchedField": "<field name or null if no match>", "confidence": <0-1>}

matchedField should be the exact field name from the form, or null if no good match exists.`;
}

// =============================================================================
// INFER PURPOSE
// =============================================================================

/**
 * System prompt for inferring form purpose
 */
export const INFER_PURPOSE_SYSTEM = `You are a form analysis assistant. Your task is to determine the purpose of a form based on its fields.

Common form purposes include:
- user-registration: Sign-up forms with email, password, name
- login: Authentication with username/email and password
- contact: Contact forms with message, email, name
- checkout: Payment forms with address, card details
- profile-update: Profile editing with personal information
- search: Search forms with query fields
- feedback: Forms collecting user opinions
- newsletter-signup: Email subscription forms
- booking: Reservation forms with dates, times
- file-upload: Forms for uploading documents/media

Always respond with valid JSON only.`;

/**
 * User prompt template for purpose inference
 */
export function inferPurposePrompt(fields: string, context?: string): string {
  const contextPart = context ? `\nAdditional Context: ${context}` : '';
  return `Determine the purpose of this form based on its fields.${contextPart}

Form Fields:
${fields}

Respond with JSON in this exact format:
{"purpose": "<purpose identifier>", "requiredFields": [<list of field names that are typically required for this form type>], "confidence": <0-1>}`;
}

// =============================================================================
// DETECT SENSITIVE
// =============================================================================

/**
 * System prompt for detecting sensitive data
 */
export const DETECT_SENSITIVE_SYSTEM = `You are a data sensitivity analyst. Your task is to identify sensitive data in form fields.

Categories of sensitive data:
- Personally Identifiable Information (PII): name, email, phone, address
- Financial: credit card, bank account, SSN
- Authentication: password, PIN, security questions
- Health: medical information, health conditions
- Legal: government IDs, legal documents

Security recommendations:
- Use HTTPS for transmission
- Encrypt at rest
- Minimize data collection
- Implement access controls

Always respond with valid JSON only.`;

/**
 * User prompt template for sensitive data detection
 */
export function detectSensitivePrompt(fields: string): string {
  return `Analyze this form data for sensitive information.

Form Fields:
${fields}

Respond with JSON in this exact format:
{"hasSensitive": <boolean>, "fields": [<list of field names containing sensitive data>], "recommendation": "<security recommendation>"}`;
}

// =============================================================================
// SUGGEST MISSING FIELDS
// =============================================================================

/**
 * System prompt for suggesting missing fields
 */
export const SUGGEST_MISSING_SYSTEM = `You are a form design assistant. Your task is to suggest missing fields based on the form's purpose and existing fields.

Consider:
- Common patterns for the form type
- Required vs optional fields
- User experience best practices
- Data completeness requirements
- Regulatory requirements (GDPR consent, terms acceptance)

Always respond with valid JSON only.`;

/**
 * User prompt template for missing field suggestions
 */
export function suggestMissingFieldsPrompt(
  fields: string,
  purpose?: string
): string {
  const purposePart = purpose ? `\nDetected Purpose: ${purpose}` : '';
  return `Suggest fields that might be missing from this form.${purposePart}

Current Fields:
${fields}

Respond with JSON in this exact format:
{"suggestions": [{"field": "<suggested field name>", "reason": "<why this field should be added>", "required": <boolean>}]}

Only suggest fields that are commonly expected but missing. Return empty suggestions if the form appears complete.`;
}

// =============================================================================
// VALIDATE FILES
// =============================================================================

/**
 * System prompt for file validation
 */
export const VALIDATE_FILES_SYSTEM = `You are a file validation assistant. Your task is to validate file uploads in form data.

Consider:
- File size limits (parse human-readable sizes like "5MB", "1GB")
- MIME type restrictions
- File extension matching
- Security concerns (executable files, scripts)

Always respond with valid JSON only.`;

/**
 * User prompt template for file validation
 */
export function validateFilesPrompt(
  files: string,
  rules: { maxSize?: string; allowedTypes?: string[] }
): string {
  const rulesJson = JSON.stringify(rules);
  return `Validate these file uploads against the specified rules.

File Information:
${files}

Validation Rules: ${rulesJson}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [{"field": "<field name>", "issue": "<description of the issue>"}]}`;
}

// =============================================================================
// EXPLAIN
// =============================================================================

/**
 * System prompt for form explanation
 */
export const EXPLAIN_SYSTEM = `You are a form description assistant. Your task is to explain what a form is for in human-readable terms.

Consider:
- The purpose of the form
- What data it collects
- Who might use it
- Key fields and their purposes

Always respond with valid JSON only.`;

/**
 * User prompt template for form explanation
 */
export function explainPrompt(fields: string, context?: string): string {
  const contextPart = context ? `\nContext: ${context}` : '';
  return `Explain what this form is for in a single human-readable sentence.${contextPart}

Form Fields:
${fields}

Respond with JSON in this exact format:
{"explanation": "<concise description of the form's purpose>"}`;
}

// =============================================================================
// TO OBJECT
// =============================================================================

/**
 * System prompt for converting field names
 */
export const TO_OBJECT_SYSTEM = `You are a naming convention assistant. Your task is to convert form field names to a target naming convention.

Naming conventions:
- camelCase: firstName, lastName, emailAddress
- snake_case: first_name, last_name, email_address

Always respond with valid JSON only.`;

/**
 * User prompt template for field name conversion
 */
export function toObjectPrompt(
  fields: string,
  targetConvention: 'camelCase' | 'snake_case'
): string {
  return `Convert these field names to ${targetConvention} convention.

Current Fields:
${fields}

Respond with JSON in this exact format:
{"mappings": {"<original field>": "<converted field>", ...}}`;
}
