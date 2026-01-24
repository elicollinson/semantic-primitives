/**
 * Prompts for SemanticObject LLM operations
 * These prompts enable semantic operations on objects
 */

/**
 * System prompt for object semantic operations
 */
export const OBJECT_SYSTEM_PROMPT = `You are a semantic object analyzer. Your task is to analyze JavaScript objects to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Understand property names and their meanings
- Consider naming conventions and synonyms
- Analyze value types and purposes
- Provide confidence scores from 0.0 to 1.0`;

/**
 * Prompt for semantic property access
 */
export function createSemanticGetPrompt(
  keys: string[],
  query: string
): string {
  return `Find the best matching property for this semantic query.

Object keys: ${JSON.stringify(keys)}
Query: "${query}"

Find the property that best matches the query semantically.
Consider synonyms and naming conventions (camelCase, snake_case, etc.).

Respond with JSON in this exact format:
{
  "matchedKey": "the best matching key" or null,
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
- Property name synonyms (e.g., "firstName" and "first_name")
- Value semantic equality
- Overall structure meaning

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "mappings": { "key1_from_obj1": "key1_from_obj2", ... },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validation
 */
export function createValidatePrompt(obj: object, rules: string[]): string {
  return `Validate this object against the given rules.

Object: ${JSON.stringify(obj)}
Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each property against all rules and report violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "field": "fieldName", "problem": "description" }
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

Analyze each property and determine:
- The semantic type of the object
- The purpose of each field
- Any format patterns (email, date, etc.)

Respond with JSON in this exact format:
{
  "type": "object type (e.g., 'user-profile', 'product')",
  "fields": {
    "fieldName": { "type": "data type", "purpose": "what it represents", "format": "format if any or null" }
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
  return `Transform all property names to ${convention}.

Object: ${JSON.stringify(obj)}
Target convention: ${convention}

Convert all keys to the specified naming convention while preserving values.

Respond with JSON in this exact format:
{
  "transformed": { "newKey1": value1, "newKey2": value2 },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic merge
 */
export function createSemanticMergePrompt(
  obj1: object,
  obj2: object,
  conflictResolution: 'prefer-this' | 'prefer-other' | 'combine'
): string {
  return `Merge these objects with semantic key matching.

Object 1: ${JSON.stringify(obj1)}
Object 2: ${JSON.stringify(obj2)}
Conflict resolution: ${conflictResolution}

Identify semantically equivalent keys and merge appropriately.

Respond with JSON in this exact format:
{
  "merged": { merged object },
  "mappings": { "obj1_key": "obj2_key", ... },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic pick
 */
export function createPickPrompt(obj: object, fields: string[]): string {
  return `Extract specific fields using semantic matching.

Object: ${JSON.stringify(obj)}
Fields to extract: ${JSON.stringify(fields)}

For each requested field description, find the matching property.

Respond with JSON in this exact format:
{
  "picked": { extracted properties },
  "mappings": { "requested": "actual_key", ... },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting missing fields
 */
export function createSuggestMissingFieldsPrompt(obj: object): string {
  return `Suggest fields that might be missing from this object.

Object: ${JSON.stringify(obj)}

Based on the object's apparent purpose, suggest additional fields that would commonly be expected.

Respond with JSON in this exact format:
{
  "suggestions": [
    { "field": "fieldName", "reason": "why this field might be needed" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarizing the object
 */
export function createSummarizePrompt(obj: object): string {
  return `Summarize this object's contents.

Object: ${JSON.stringify(obj)}

Provide a concise, human-readable summary that captures:
- The type/purpose of the object
- Key information
- Notable characteristics

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring type
 */
export function createInferTypePrompt(obj: object): string {
  return `Infer the semantic type of this object.

Object: ${JSON.stringify(obj)}

Determine what kind of entity or data structure this object represents.

Respond with JSON in this exact format:
{
  "type": "inferred type (e.g., 'user-profile', 'order', 'configuration')",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for checking field sensitivity
 */
export function createIsSensitivePrompt(obj: object, field: string): string {
  return `Check if this field contains sensitive data.

Object: ${JSON.stringify(obj)}
Field to check: "${field}"

Determine if the field value appears to contain sensitive or personal information.

Respond with JSON in this exact format:
{
  "sensitive": true or false,
  "type": "type of sensitive data (e.g., 'PII', 'credential', 'financial')" or null,
  "recommendation": "suggested handling" or null,
  "confidence": 0.0 to 1.0
}`;
}
