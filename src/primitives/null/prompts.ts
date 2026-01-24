/**
 * Prompts for SemanticNull LLM operations
 * These prompts are used to reason about null values and their semantic meaning
 */

/**
 * System prompt for null interpretation tasks
 */
export const NULL_SYSTEM_PROMPT = `You are a semantic null value interpreter. Your task is to analyze and reason about null values, their meaning, and appropriate handling.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- "not-set": A value that could be provided but hasn't been (e.g., optional field left blank)
- "not-applicable": A value that doesn't apply to the current context (e.g., spouse name for single person)
- "unknown": The reason for null is unclear or indeterminate

Guidelines:
- Consider the field name semantics when inferring reasons
- Analyze context to determine if null is intentional or missing
- Provide confidence scores from 0.0 to 1.0 based on clarity
- Suggest appropriate defaults only when safe (never for sensitive data)`;

/**
 * Prompt template for comparing two null reasons for semantic equivalence
 */
export function createSemanticallyEqualsPrompt(
  reason1: string,
  reason2: string
): string {
  return `Compare these two reasons for a null value and determine if they are semantically equivalent (both represent the same type/cause of absence).

Reason 1: "${reason1}"
Reason 2: "${reason2}"

Consider:
- Do they represent the same type of absence?
- Would they be handled the same way in code?
- Are they expressing the same underlying concept?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for inferring the reason a field is null
 */
export function createInferReasonPrompt(
  fieldName: string,
  context?: Record<string, unknown>
): string {
  let prompt = `Analyze why the field "${fieldName}" might be null based on its name and context.

Field name: "${fieldName}"`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context, null, 2)}`;
  }

  prompt += `

Consider:
- Common patterns for this field name (e.g., "deletedAt" implies soft delete)
- Surrounding context values that might indicate why it's null
- Whether null here means "not set", "not applicable", or "unknown"

Respond with JSON in this exact format:
{
  "reason": "human-readable explanation of why the field is null",
  "type": "not-set" | "not-applicable" | "unknown"
}`;

  return prompt;
}

/**
 * Prompt template for suggesting a default value for a null field
 */
export function createSuggestDefaultPrompt(
  fieldName: string,
  schema?: { type: string; format?: string }
): string {
  let prompt = `Suggest an appropriate default value for the field "${fieldName}" that is currently null.

Field name: "${fieldName}"`;

  if (schema) {
    prompt += `\nSchema: ${JSON.stringify(schema)}`;
  }

  prompt += `

Guidelines:
- Never suggest defaults for sensitive fields (passwords, tokens, SSN, etc.)
- For counts/quantities, 0 is often appropriate
- For optional strings, empty string or null may be appropriate
- For dates, consider if "now" or null is more appropriate
- For required fields, suggest requiring user input

Respond with JSON in this exact format:
{
  "default": the suggested default value (can be null, string, number, boolean, etc.),
  "explanation": "why this default is appropriate"
}`;

  return prompt;
}

/**
 * Prompt template for checking if null is appropriate for a field
 */
export function createIsAppropriatePrompt(
  fieldName: string,
  context?: { required?: boolean; schema?: unknown }
): string {
  let prompt = `Determine if null is an appropriate value for the field "${fieldName}".

Field name: "${fieldName}"`;

  if (context) {
    if (context.required !== undefined) {
      prompt += `\nRequired: ${context.required}`;
    }
    if (context.schema) {
      prompt += `\nSchema: ${JSON.stringify(context.schema)}`;
    }
  }

  prompt += `

Consider:
- Is this field semantically required for the data to be meaningful?
- Would null here cause issues downstream?
- Is there a validation rule that would reject null?

Respond with JSON in this exact format:
{
  "appropriate": true or false,
  "reason": "explanation of why null is or isn't appropriate"
}`;

  return prompt;
}

/**
 * Prompt template for classifying the type of null
 */
export function createClassifyPrompt(reason: string): string {
  return `Classify this null value reason into a category.

Reason: "${reason}"

Categories:
- "not-set": Value could be provided but hasn't been (optional, pending, etc.)
- "not-applicable": Value doesn't apply to current context (irrelevant, N/A)
- "unknown": Cannot determine the nature of the absence

Also determine if the value can potentially be provided in the future.

Respond with JSON in this exact format:
{
  "type": "not-set" | "not-applicable" | "unknown",
  "canBeProvided": true or false
}`;
}

/**
 * Prompt template for generating a human-readable explanation
 */
export function createExplainPrompt(
  fieldName: string,
  reason?: string
): string {
  let prompt = `Generate a clear, human-readable explanation for why the field "${fieldName}" is null.

Field name: "${fieldName}"`;

  if (reason) {
    prompt += `\nReason context: "${reason}"`;
  }

  prompt += `

Generate a single sentence explanation that would be helpful for:
- End users viewing a form or record
- Developers debugging data issues
- Documentation purposes

Respond with JSON in this exact format:
{
  "explanation": "A clear, human-readable sentence explaining the null value"
}`;

  return prompt;
}
