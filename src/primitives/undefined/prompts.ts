/**
 * Prompts for SemanticUndefined LLM operations
 * These prompts are used to reason about undefined values and their semantic meaning
 */

/**
 * System prompt for undefined interpretation tasks
 */
export const UNDEFINED_SYSTEM_PROMPT = `You are a semantic undefined value interpreter. Your task is to analyze and reason about undefined values, their meaning, and appropriate handling in JavaScript/TypeScript contexts.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- "not-initialized": A variable/property that has been declared but not assigned a value
- "optional-unset": An optional parameter/property that was not provided
- "property-missing": Accessing a property that doesn't exist on an object
- "void-return": A function that doesn't explicitly return a value
- "unknown": The reason for undefined is unclear or indeterminate

Guidelines:
- Consider property/variable names when inferring reasons
- Analyze context to determine if undefined is intentional or a potential bug
- Provide confidence scores from 0.0 to 1.0 based on clarity
- Suggest appropriate initializations only when safe (never for sensitive data)
- Distinguish between undefined (uninitialized) and null (intentional absence)`;

/**
 * Prompt template for comparing two undefined contexts for semantic equivalence
 */
export function createSemanticallyEqualsPrompt(
  context1: string,
  context2: string
): string {
  return `Compare these two contexts for undefined values and determine if they are semantically equivalent (both represent the same type/cause of being undefined).

Context 1: "${context1}"
Context 2: "${context2}"

Consider:
- Do they represent the same reason for being undefined?
- Would they be handled the same way in code?
- Are they expressing the same underlying concept?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for inferring the reason a property/value is undefined
 */
export function createInferReasonPrompt(
  propertyPath: string,
  context?: unknown
): string {
  let prompt = `Analyze why the property path "${propertyPath}" might be undefined based on its name and context.

Property path: "${propertyPath}"`;

  if (context !== undefined) {
    prompt += `\nContext: ${JSON.stringify(context, null, 2)}`;
  }

  prompt += `

Consider:
- Common patterns for this property name (e.g., "user.profile.avatar" suggests optional profile data)
- Whether the property path suggests a deeply nested optional value
- Whether undefined here means "not-initialized", "optional-unset", "property-missing", or "unknown"

Respond with JSON in this exact format:
{
  "reason": "human-readable explanation of why the property is undefined",
  "type": "not-initialized" | "optional-unset" | "property-missing" | "void-return" | "unknown"
}`;

  return prompt;
}

/**
 * Prompt template for suggesting an appropriate initialization value
 */
export function createSuggestInitializationPrompt(
  propertyName: string,
  typeHint?: { type: string; schema?: unknown }
): string {
  let prompt = `Suggest an appropriate initialization value for the property "${propertyName}" that is currently undefined.

Property name: "${propertyName}"`;

  if (typeHint) {
    prompt += `\nType hint: ${JSON.stringify(typeHint)}`;
  }

  prompt += `

Guidelines:
- Never suggest initialization for sensitive fields (passwords, tokens, SSN, etc.)
- For arrays, an empty array [] is often appropriate
- For objects, an empty object {} is often appropriate
- For counts/quantities, 0 is often appropriate
- For optional strings, empty string or null may be appropriate
- For booleans, consider if true or false makes more sense as default
- If no good default exists, suggest null to indicate intentional absence

Respond with JSON in this exact format:
{
  "value": the suggested initialization value (can be null, string, number, boolean, [], {}, etc.),
  "explanation": "why this initialization is appropriate"
}`;

  return prompt;
}

/**
 * Prompt template for checking if undefined is acceptable for a context
 */
export function createIsAcceptablePrompt(
  context: string,
  details?: Record<string, unknown>
): string {
  let prompt = `Determine if undefined is an acceptable value in this context or if it indicates a potential bug.

Context: "${context}"`;

  if (details && Object.keys(details).length > 0) {
    prompt += `\nDetails: ${JSON.stringify(details, null, 2)}`;
  }

  prompt += `

Consider:
- Is undefined semantically meaningful here or does it indicate an error?
- Would undefined here cause issues downstream (e.g., cannot read property of undefined)?
- Is there a more appropriate value that should be used instead?
- Does the function/context expect undefined or is it an oversight?

Respond with JSON in this exact format:
{
  "acceptable": true or false,
  "reason": "explanation of why undefined is or isn't acceptable here"
}`;

  return prompt;
}

/**
 * Prompt template for comparing null vs undefined appropriateness
 */
export function createCompareToNullPrompt(context: string): string {
  return `Determine whether null or undefined is more semantically appropriate for: "${context}"

Consider JavaScript/TypeScript conventions:
- undefined: Value has not been assigned, property doesn't exist, function has no return
- null: Intentional absence of a value, explicitly set to "no value"

Common patterns:
- Function returns: null for "not found", undefined for "no explicit return"
- Optional properties: undefined when not provided
- Cleared values: null to indicate deliberate clearing
- Database fields: null for "no value", undefined means field wasn't queried

Respond with JSON in this exact format:
{
  "recommendation": "null" or "undefined",
  "explanation": "detailed explanation of why this choice is more appropriate"
}`;
}

/**
 * Prompt template for generating a human-readable explanation
 */
export function createExplainPrompt(
  propertyPath: string,
  context?: string
): string {
  let prompt = `Generate a clear, human-readable explanation for why the property "${propertyPath}" is undefined.

Property path: "${propertyPath}"`;

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

Generate a single sentence explanation that would be helpful for:
- End users viewing a form or data display
- Developers debugging undefined values
- Documentation purposes

Respond with JSON in this exact format:
{
  "explanation": "A clear, human-readable sentence explaining why this value is undefined"
}`;

  return prompt;
}

/**
 * Prompt template for classifying the type of undefined
 */
export function createClassifyPrompt(context: string): string {
  return `Classify this undefined value context into a category.

Context: "${context}"

Categories:
- "not-initialized": Variable/property declared but never assigned a value
- "optional-unset": Optional parameter/property not provided
- "property-missing": Accessing a property that doesn't exist on an object
- "void-return": Function that doesn't explicitly return a value
- "unknown": Cannot determine the nature of the undefined

Also determine if the value can potentially be initialized/provided.

Respond with JSON in this exact format:
{
  "type": "not-initialized" | "optional-unset" | "property-missing" | "void-return" | "unknown",
  "canBeInitialized": true or false
}`;
}
