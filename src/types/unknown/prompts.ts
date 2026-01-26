/**
 * Prompts for SemanticUnknown LLM operations
 * These prompts are used to analyze and reason about unknown values
 */

/**
 * System prompt for unknown value interpretation tasks
 */
export const UNKNOWN_SYSTEM_PROMPT = `You are a semantic type analyzer. Your task is to analyze unknown values, infer their types, and help safely narrow them to proper TypeScript types.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- "unknown" represents type-safe uncertainty
- Type inference should consider value structure, patterns, and common conventions
- Type guards help safely narrow unknown values
- Confidence scores from 0.0 to 1.0 indicate certainty

Guidelines:
- Analyze value structure to determine probable types
- Consider common naming patterns and data shapes
- Suggest practical TypeScript types when possible
- Generate safe type guard code that checks all necessary conditions
- Be conservative with confidence scores for ambiguous values`;

/**
 * Prompt template for inferring the type of an unknown value
 */
export function createInferTypePrompt(
  value: unknown,
  context?: { source?: string }
): string {
  let prompt = `Analyze this unknown value and infer its most likely type.

Value: ${JSON.stringify(value, null, 2)}`;

  if (context?.source) {
    prompt += `\nSource: "${context.source}"`;
  }

  prompt += `

Determine:
- The basic JavaScript type (string, number, boolean, object, array, null, undefined, function)
- For objects/arrays, describe the shape (e.g., "{ id: number; name: string }")
- Your confidence in this assessment (0.0 to 1.0)

Respond with JSON in this exact format:
{
  "type": "string" | "number" | "boolean" | "object" | "array" | "null" | "undefined" | "function",
  "shape": "optional shape description for objects/arrays",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt template for suggesting possible TypeScript types
 */
export function createSuggestTypesPrompt(
  value: unknown,
  limit = 3
): string {
  return `Analyze this unknown value and suggest possible TypeScript types it could represent.

Value: ${JSON.stringify(value, null, 2)}

Suggest up to ${limit} possible types, ranked by likelihood.
Consider:
- Common TypeScript patterns and interfaces
- Typical naming conventions for similar data
- Whether this looks like a domain-specific type (User, Product, Config, etc.)
- Generic type representations when specific types are unclear

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "type": "TypeName or inline type definition",
      "confidence": 0.0 to 1.0,
      "reason": "why this type is likely"
    }
  ]
}`;
}

/**
 * Prompt template for validating value shape
 */
export function createValidateShapePrompt(
  value: unknown,
  description: string
): string {
  return `Validate if this unknown value matches the described shape.

Value: ${JSON.stringify(value, null, 2)}
Expected shape: "${description}"

Check:
- Does the value's structure match the description?
- What fields are missing from what's expected?
- What extra fields exist that weren't described?

Respond with JSON in this exact format:
{
  "matches": true or false,
  "missingFields": ["field1", "field2"],
  "extraFields": ["extra1", "extra2"]
}`;
}

/**
 * Prompt template for generating a type guard function
 */
export function createGenerateTypeGuardPrompt(value: unknown): string {
  return `Generate a TypeScript type guard function for this unknown value.

Value: ${JSON.stringify(value, null, 2)}

Create:
- A type guard function that safely narrows unknown to the inferred type
- A descriptive type name based on the value's apparent purpose
- The function should check all necessary conditions

Respond with JSON in this exact format:
{
  "code": "function isTypeName(x: unknown): x is TypeName { ... }",
  "typeName": "TypeName"
}`;
}

/**
 * Prompt template for safe property access
 */
export function createSafeAccessPrompt(
  value: unknown,
  path: string
): string {
  return `Analyze this unknown value and find the property that best matches the description.

Value: ${JSON.stringify(value, null, 2)}
Path/Query: "${path}"

Determine:
- The actual property path that matches the semantic description
- Whether the path exists and what value it contains
- Return null for propertyPath if no match is found

Respond with JSON in this exact format:
{
  "propertyPath": "actual.path.to.value" or null,
  "value": the value at that path or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for checking if value matches a description
 */
export function createMatchesPrompt(
  value: unknown,
  description: string
): string {
  return `Check if this unknown value matches the semantic description.

Value: ${JSON.stringify(value, null, 2)}
Description: "${description}"

Assess:
- Does the value structurally match what's described?
- How confident are you in this match?

Respond with JSON in this exact format:
{
  "matches": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for narrowing to a specific type
 */
export function createNarrowToPrompt(
  value: unknown,
  typeName: string,
  validator?: string[]
): string {
  let prompt = `Validate if this unknown value can be safely narrowed to the specified type.

Value: ${JSON.stringify(value, null, 2)}
Target type: "${typeName}"`;

  if (validator && validator.length > 0) {
    prompt += `\nValidation rules:\n${validator.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  prompt += `

Check:
- Does the value match the expected structure for "${typeName}"?
- Does it satisfy all validation rules?
- What specific errors prevent narrowing?

Respond with JSON in this exact format:
{
  "success": true or false,
  "errors": ["error message 1", "error message 2"]
}`;

  return prompt;
}

/**
 * Prompt template for explaining what an unknown value appears to be
 */
export function createExplainPrompt(
  value: unknown,
  context?: { source?: string }
): string {
  let prompt = `Explain what this unknown value appears to be in human-readable terms.

Value: ${JSON.stringify(value, null, 2)}`;

  if (context?.source) {
    prompt += `\nSource: "${context.source}"`;
  }

  prompt += `

Provide a clear, helpful explanation that describes:
- What kind of data this appears to be
- Its likely purpose or use case
- Any notable characteristics

Keep the explanation concise (1-2 sentences).

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation of what this value appears to be"
}`;

  return prompt;
}
