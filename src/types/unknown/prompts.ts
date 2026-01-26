/**
 * Prompts for SemanticUnknown LLM operations
 * These prompts help safely narrow unknown values to proper types
 */

/**
 * System prompt for unknown type analysis
 */
export const UNKNOWN_SYSTEM_PROMPT = `You are a TypeScript type expert specializing in safely handling 'unknown' typed values. Your task is to help infer types, generate type guards, and validate unknown data.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- 'unknown' is the type-safe counterpart to 'any'
- Values of type 'unknown' must be narrowed before use
- Type guards are functions that narrow types at runtime
- Safe access requires checking types before accessing properties

Guidelines:
- Analyze values to infer the most likely type
- Generate robust type guards for runtime validation
- Provide high confidence scores for clear structures
- Consider edge cases and null/undefined values`;

/**
 * Prompt for inferring type of unknown value
 */
export function createInferTypePrompt(value: unknown, context?: string): string {
  const valueStr = JSON.stringify(value, null, 2);
  const typeofValue = typeof value;
  const isArray = Array.isArray(value);
  const isNull = value === null;

  let prompt = `Infer the most likely TypeScript type for this unknown value.

Value: ${valueStr}
typeof: ${typeofValue}
isArray: ${isArray}
isNull: ${isNull}`;

  if (context) {
    prompt += `\nSource context: ${context}`;
  }

  prompt += `

Respond with JSON in this exact format:
{
  "type": "string" | "number" | "boolean" | "object" | "array" | "null" | "undefined" | "function",
  "shape": "TypeScript type annotation if object or array (or null for primitives)",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for suggesting possible types
 */
export function createSuggestTypesPrompt(value: unknown, limit: number): string {
  const valueStr = JSON.stringify(value, null, 2);

  return `Suggest up to ${limit} possible TypeScript types for this unknown value, ranked by likelihood.

Value: ${valueStr}

Consider:
- Common type patterns for this data shape
- Named types that might match (User, Product, etc.)
- Generic type annotations

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "type": "TypeScript type name or annotation",
      "confidence": 0.0 to 1.0,
      "reason": "why this type is suggested"
    }
  ]
}`;
}

/**
 * Prompt for validating shape
 */
export function createValidateShapePrompt(value: unknown, description: string): string {
  const valueStr = JSON.stringify(value, null, 2);

  return `Validate if this value matches the described shape.

Value: ${valueStr}
Expected shape: "${description}"

Check:
- Does the value have the expected structure?
- Are all expected fields present?
- Are there unexpected extra fields?

Respond with JSON in this exact format:
{
  "matches": true or false,
  "missingFields": ["array of fields expected but not found"],
  "extraFields": ["array of fields found but not expected"]
}`;
}

/**
 * Prompt for generating type guard
 */
export function createGenerateTypeGuardPrompt(value: unknown): string {
  const valueStr = JSON.stringify(value, null, 2);

  return `Generate a TypeScript type guard function for values matching this shape.

Value: ${valueStr}

Generate:
1. An interface or type for this value's shape
2. A type guard function that validates all properties

The type guard should:
- Check for null and object type
- Validate all required properties
- Check property types

Respond with JSON in this exact format:
{
  "code": "full type guard function code with type definition",
  "typeName": "name of the type/interface"
}`;
}

/**
 * Prompt for safe property access
 */
export function createSafeAccessPrompt(value: unknown, path: string): string {
  const valueStr = JSON.stringify(value, null, 2);

  return `Find the property matching this semantic description in the value.

Value: ${valueStr}
Looking for: "${path}"

Match properties by:
- Exact name match
- Semantic similarity (e.g., "user's email" matches "email" or "emailAddress")
- Nested path (e.g., "user.contact.email")

Respond with JSON in this exact format:
{
  "found": true or false,
  "path": "the property path if found (e.g., 'email' or 'contact.email')",
  "value": the value at that path or null if not found
}`;
}

/**
 * Prompt for semantic matching
 */
export function createMatchesPrompt(value: unknown, description: string): string {
  const valueStr = JSON.stringify(value, null, 2);
  const typeofValue = typeof value;

  return `Determine if this value matches the semantic description.

Value: ${valueStr}
typeof: ${typeofValue}
Description: "${description}"

Consider:
- Does the structure match?
- Do the value types align?
- Is this the kind of data described?

Respond with JSON in this exact format:
{
  "matches": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for narrowing to type
 */
export function createNarrowToPrompt(
  value: unknown,
  typeName: string,
  validator?: string[]
): string {
  const valueStr = JSON.stringify(value, null, 2);
  let prompt = `Validate if this value can be narrowed to the specified type.

Value: ${valueStr}
Target type: "${typeName}"`;

  if (validator && validator.length > 0) {
    prompt += `\nValidation rules:\n${validator.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  prompt += `

Check:
- Does the value structure match the type?
- Do all validation rules pass?
- What errors prevent narrowing?

Respond with JSON in this exact format:
{
  "success": true or false,
  "errors": ["array of validation errors, empty if success"]
}`;

  return prompt;
}

/**
 * Prompt for explaining the value
 */
export function createExplainPrompt(value: unknown, context?: string): string {
  const valueStr = JSON.stringify(value, null, 2);
  const typeofValue = typeof value;

  let prompt = `Explain what this unknown value appears to be.

Value: ${valueStr}
typeof: ${typeofValue}`;

  if (context) {
    prompt += `\nContext: ${context}`;
  }

  prompt += `

Provide a clear, human-readable explanation of:
- What kind of data this appears to be
- Its likely purpose
- Any notable characteristics

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation of the value"
}`;

  return prompt;
}
