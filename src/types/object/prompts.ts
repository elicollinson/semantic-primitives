/**
 * Prompts for SemanticObject LLM operations
 * These prompts enable semantic operations on object data structures
 */

/**
 * System prompt for object semantic operations
 */
export const OBJECT_SYSTEM_PROMPT = `You are a semantic object analyzer. Your task is to analyze objects and their properties to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider property names, values, and their semantic meanings
- Understand common naming conventions (camelCase, snake_case, etc.)
- Recognize synonymous property names (e.g., "email" and "emailAddress")
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic property access
 */
export function createSemanticGetPrompt(
  obj: object,
  query: string
): string {
  return `Find the property in the object that best matches the semantic query.

Object: ${JSON.stringify(obj)}
Query: "${query}"

Analyze each property name and find the one that semantically matches the query.
Consider:
- Exact matches
- Synonyms (e.g., "email" matches "mail", "emailAddress", "e_mail")
- Partial matches (e.g., "name" matches "firstName", "lastName", "fullName")
- Abbreviations (e.g., "id" matches "identifier", "ID")

Respond with JSON in this exact format:
{
  "matchedKey": "the key that matches or null if none",
  "value": the value of the matched key or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  obj1: object,
  obj2: object
): string {
  return `Compare these two objects for semantic equivalence.

Object 1: ${JSON.stringify(obj1)}
Object 2: ${JSON.stringify(obj2)}

Consider:
- Property name synonyms (e.g., "firstName" and "first_name" are equivalent)
- Value semantic equivalence
- Overall structural similarity
- Missing properties that don't affect semantic meaning

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "mappings": { "obj1Key": "obj2Key" },
  "confidence": 0.0 to 1.0
}

The mappings object should show how properties from Object 1 map to Object 2.`;
}

/**
 * Prompt for validation against rules
 */
export function createValidatePrompt(
  obj: object,
  rules: string[]
): string {
  return `Validate the object against the given semantic rules.

Object: ${JSON.stringify(obj)}
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each rule and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "field": "fieldName", "problem": "description of the issue" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for schema inference
 */
export function createInferSchemaPrompt(obj: object): string {
  return `Infer the semantic schema of this object.

Object: ${JSON.stringify(obj)}

Analyze:
- The semantic type/purpose of this object
- Each field's type, purpose, and format
- Required vs optional fields based on typical usage

Respond with JSON in this exact format:
{
  "type": "semantic type name (e.g., user-profile, product, order)",
  "fields": {
    "fieldName": {
      "type": "data type (string, number, boolean, object, array)",
      "purpose": "brief description of field's purpose",
      "format": "optional format like email, url, date"
    }
  },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for key transformation
 */
export function createTransformKeysPrompt(
  obj: object,
  convention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case'
): string {
  return `Transform all property names in this object to ${convention} convention.

Object: ${JSON.stringify(obj)}
Target convention: ${convention}

Convert each property name while preserving values. Handle nested objects.

Respond with JSON in this exact format:
{
  "transformed": { the transformed object },
  "keyMappings": { "originalKey": "newKey" },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic merge
 */
export function createSemanticMergePrompt(
  obj1: object,
  obj2: object,
  options?: { conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine' }
): string {
  const resolution = options?.conflictResolution ?? 'prefer-other';

  return `Merge these two objects, handling semantic key synonyms.

Object 1 (this): ${JSON.stringify(obj1)}
Object 2 (other): ${JSON.stringify(obj2)}
Conflict resolution: ${resolution}

When merging:
- Identify semantically equivalent keys (e.g., "firstName" and "first_name")
- Use conflict resolution strategy for duplicate keys:
  - "prefer-this": keep Object 1's value
  - "prefer-other": keep Object 2's value
  - "combine": merge values if possible (arrays concatenate, objects deep merge)
- Use Object 1's key naming convention for merged keys

Respond with JSON in this exact format:
{
  "merged": { the merged object },
  "keyMappings": { "obj2Key": "obj1Key" },
  "conflicts": ["list of keys that had conflicts"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic field extraction (pick)
 */
export function createPickPrompt(
  obj: object,
  fields: string[]
): string {
  return `Extract fields from the object that semantically match the requested fields.

Object: ${JSON.stringify(obj)}
Requested fields: ${JSON.stringify(fields)}

For each requested field description:
- Find object properties that semantically match
- A single request may match multiple properties (e.g., "contact information" matches "email", "phone")
- Include matched properties in the result

Respond with JSON in this exact format:
{
  "picked": { extracted key-value pairs },
  "matchedFields": { "requestedField": ["matchedKey1", "matchedKey2"] },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting missing fields
 */
export function createSuggestMissingFieldsPrompt(obj: object): string {
  return `Analyze this object and suggest fields that are typically present in similar objects but are missing.

Object: ${JSON.stringify(obj)}

Consider:
- Common fields for this type of object
- Fields that would make the object more complete
- Industry standards and best practices

Respond with JSON in this exact format:
{
  "suggestions": [
    { "field": "suggestedFieldName", "reason": "why this field would be useful" }
  ],
  "objectType": "detected type of this object",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarization
 */
export function createSummarizePrompt(obj: object): string {
  return `Create a human-readable summary of this object.

Object: ${JSON.stringify(obj)}

Provide a concise natural language summary that:
- Identifies what type of data this represents
- Highlights key information
- Is suitable for display to end users

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary string",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for type inference
 */
export function createInferTypePrompt(obj: object): string {
  return `Detect the semantic type/purpose of this object.

Object: ${JSON.stringify(obj)}

Analyze the structure and values to determine what this object represents.

Respond with JSON in this exact format:
{
  "type": "semantic type (e.g., user-profile, e-commerce-order, config, log-entry)",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for sensitive data detection
 */
export function createIsSensitivePrompt(
  obj: object,
  field: string
): string {
  return `Analyze if the specified field contains sensitive data.

Object: ${JSON.stringify(obj)}
Field to check: "${field}"

Consider:
- PII (Personally Identifiable Information): SSN, passport, driver's license
- Financial: credit cards, bank accounts, salaries
- Authentication: passwords, tokens, API keys
- Health: medical records, conditions
- Contact: addresses, phone numbers (context-dependent)

Respond with JSON in this exact format:
{
  "sensitive": true or false,
  "type": "type of sensitive data (e.g., PII, financial, authentication) or null",
  "recommendation": "recommended action (e.g., encrypt, mask, redact) or null",
  "confidence": 0.0 to 1.0
}`;
}
