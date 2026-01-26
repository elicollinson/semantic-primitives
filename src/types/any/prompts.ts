/**
 * Prompts for SemanticAny LLM operations
 * These prompts help analyze untyped values and suggest proper types
 */

/**
 * System prompt for any type analysis
 */
export const ANY_SYSTEM_PROMPT = `You are a TypeScript type expert specializing in analyzing untyped (any) values. Your task is to help understand, classify, and migrate from 'any' types to proper TypeScript types.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- "escape-hatch": Using any to bypass TypeScript's type system intentionally
- "lazy": Using any out of convenience when proper types could be defined
- "necessary": Using any when interfacing with truly untyped external code
- "migration": Using any temporarily during a type migration
- "unknown": The intent is unclear

Guidelines:
- Analyze values to suggest the most appropriate TypeScript type
- Consider security implications when assessing risk
- Generate type guards and migration code when appropriate
- Provide confidence scores from 0.0 to 1.0 based on certainty`;

/**
 * Prompt for classifying the intent behind using any
 */
export function createClassifyIntentPrompt(
  value: unknown,
  context?: { source?: string; reason?: string }
): string {
  const valueStr = JSON.stringify(value, null, 2);
  let prompt = `Analyze why 'any' might be used for this value and classify the intent.

Value: ${valueStr}`;

  if (context?.source) {
    prompt += `\nSource: ${context.source}`;
  }
  if (context?.reason) {
    prompt += `\nStated reason: ${context.reason}`;
  }

  prompt += `

Consider:
- Is this a deliberate escape hatch for interop with untyped code?
- Is this laziness that could be properly typed?
- Is this necessary due to truly dynamic data?
- Is this part of a type migration?

Respond with JSON in this exact format:
{
  "intent": "escape-hatch" | "lazy" | "necessary" | "migration" | "unknown",
  "reason": "explanation of why this intent was inferred",
  "risk": "low" | "medium" | "high"
}`;

  return prompt;
}

/**
 * Prompt for suggesting a proper TypeScript type
 */
export function createSuggestTypePrompt(value: unknown): string {
  const valueStr = JSON.stringify(value, null, 2);
  const typeofValue = typeof value;
  const isArray = Array.isArray(value);

  return `Analyze this value and suggest the most appropriate TypeScript type.

Value: ${valueStr}
typeof: ${typeofValue}
isArray: ${isArray}

Consider:
- The structure and shape of the value
- Common TypeScript patterns for this kind of data
- Whether an interface definition would be helpful

Respond with JSON in this exact format:
{
  "type": "the suggested inline type annotation",
  "interface": "optional interface definition if the value is an object (or null if not applicable)",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for assessing risk of using any
 */
export function createAssessRiskPrompt(
  value: unknown,
  context?: { source?: string; reason?: string }
): string {
  const valueStr = JSON.stringify(value, null, 2);
  let prompt = `Assess the risk of using 'any' type for this value.

Value: ${valueStr}`;

  if (context?.source) {
    prompt += `\nSource: ${context.source}`;
  }
  if (context?.reason) {
    prompt += `\nContext: ${context.reason}`;
  }

  prompt += `

Consider:
- Could this value contain user input (XSS/injection risk)?
- Is this used in security-sensitive operations?
- Could type mismatches cause runtime errors?
- How much of the codebase might be affected?

Respond with JSON in this exact format:
{
  "level": "low" | "medium" | "high",
  "reasons": ["array of specific risk factors"],
  "recommendations": ["array of mitigation suggestions"]
}`;

  return prompt;
}

/**
 * Prompt for generating migration code
 */
export function createGenerateMigrationPrompt(
  value: unknown,
  options?: { strict?: boolean }
): string {
  const valueStr = JSON.stringify(value, null, 2);
  const strict = options?.strict ?? false;

  return `Generate TypeScript code to migrate from 'any' to proper types for this value.

Value: ${valueStr}
Strict mode: ${strict}

Generate:
1. A type/interface definition for this value
2. A runtime type guard function (if strict mode)
3. Example usage code showing how to use the type

Respond with JSON in this exact format:
{
  "typeDefinition": "the interface or type definition",
  "typeGuard": "the type guard function code (or null if not strict)",
  "usage": "example code showing proper usage"
}`;
}

/**
 * Prompt for validating an any value
 */
export function createValidatePrompt(value: unknown): string {
  const valueStr = JSON.stringify(value, null, 2);
  const typeofValue = typeof value;

  return `Validate this 'any' typed value and infer its shape.

Value: ${valueStr}
typeof: ${typeofValue}

Analyze:
- Is the value well-formed for its apparent type?
- Are there any structural issues or inconsistencies?
- What is the inferred shape/structure?

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["array of any issues found, empty if valid"],
  "inferredShape": "TypeScript type annotation representing the shape"
}`;
}

/**
 * Prompt for checking safety for a specific context
 */
export function createIsSafeForPrompt(value: unknown, context: string): string {
  const valueStr = JSON.stringify(value, null, 2);
  const typeofValue = typeof value;

  return `Determine if this 'any' typed value is safe to use in the specified context.

Value: ${valueStr}
typeof: ${typeofValue}
Context: "${context}"

Consider:
- Does the value's structure fit the expected use case?
- Are there security concerns (XSS, injection, etc.)?
- Could using this value cause runtime errors in this context?

Respond with JSON in this exact format:
{
  "safe": true or false,
  "reason": "explanation of why it is or isn't safe (only if not safe)"
}`;
}

/**
 * Prompt for explaining why any might be used
 */
export function createExplainPrompt(
  value: unknown,
  context?: { source?: string; reason?: string }
): string {
  const valueStr = JSON.stringify(value, null, 2);
  let prompt = `Explain why 'any' might be used here and suggest alternatives.

Value: ${valueStr}`;

  if (context?.source) {
    prompt += `\nSource: ${context.source}`;
  }
  if (context?.reason) {
    prompt += `\nContext: ${context.reason}`;
  }

  prompt += `

Provide:
1. A clear explanation of why any might be used
2. Alternative approaches that maintain type safety

Respond with JSON in this exact format:
{
  "explanation": "why any might be used in this situation",
  "alternatives": ["array of alternative approaches with type safety"]
}`;

  return prompt;
}
