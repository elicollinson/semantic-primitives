/**
 * Prompts for SemanticVoid LLM operations
 * These prompts analyze void functions, side effects, and proper usage patterns
 */

/**
 * System prompt for void function analysis tasks
 */
export const VOID_SYSTEM_PROMPT = `You are a semantic void function analyzer. Your task is to analyze functions that return void, understand their side effects, and validate their proper usage.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- Void functions perform side effects without returning values
- Side effects include: I/O operations, state mutations, logging, network requests, DOM manipulation
- Pure functions have no side effects and should typically return values
- Error handling is critical for void functions since errors cannot be returned

Guidelines:
- Analyze function code to identify all side effects
- Consider the function name semantics when inferring behavior
- Provide clear, actionable recommendations
- Be conservative with safety assessments`;

/**
 * Prompt template for analyzing side effects of a void function
 */
export function createAnalyzeSideEffectsPrompt(fnSource: string): string {
  return `Analyze this void function for its side effects.

Function source:
\`\`\`
${fnSource}
\`\`\`

Consider:
- What external state does this function modify?
- Does it perform I/O operations (file, network, console)?
- Does it mutate arguments or global state?
- Is this function pure (no side effects)?

Respond with JSON in this exact format:
{
  "hasSideEffects": true or false,
  "effects": ["list", "of", "side", "effects"],
  "pure": true or false
}`;
}

/**
 * Prompt template for determining if a function should return a value
 */
export function createShouldReturnValuePrompt(
  fnSource: string,
  context?: string
): string {
  const contextSection = context ? `\n\nContext: ${context}` : '';

  return `Analyze if this void function should actually return a value.

Function source:
\`\`\`
${fnSource}
\`\`\`${contextSection}

Consider:
- Does the function compute something that callers might need?
- Would returning a value enable better error handling?
- Is there a transformation happening that should be returned?
- Does the function name suggest it should return something?

Respond with JSON in this exact format:
{
  "shouldReturn": true or false,
  "reason": "explanation of why or why not",
  "suggestedType": "optional suggested return type if shouldReturn is true"
}`;
}

/**
 * Prompt template for explaining what a void function does
 */
export function createExplainPrompt(fnSource: string): string {
  return `Generate a clear, human-readable explanation of what this void function does.

Function source:
\`\`\`
${fnSource}
\`\`\`

Provide a concise explanation that describes:
- The primary purpose of the function
- Key side effects it performs
- Any important behaviors or conditions

Respond with JSON in this exact format:
{
  "explanation": "A clear, human-readable explanation of the function"
}`;
}

/**
 * Prompt template for validating usage of a void function
 */
export function createValidateUsagePrompt(
  fnSource: string,
  usage: string
): string {
  return `Validate that this void function is being used appropriately.

Function source:
\`\`\`
${fnSource}
\`\`\`

Usage context: ${usage}

Consider:
- Is this an appropriate context for a void function?
- Could this usage lead to bugs (e.g., void in map() loses values)?
- Should a different pattern be used?

Respond with JSON in this exact format:
{
  "appropriate": true or false,
  "reason": "explanation of why the usage is or isn't appropriate",
  "suggestion": "optional alternative approach if inappropriate"
}`;
}

/**
 * Prompt template for checking error handling in a void function
 */
export function createCheckErrorHandlingPrompt(fnSource: string): string {
  return `Analyze this void function for proper error handling.

Function source:
\`\`\`
${fnSource}
\`\`\`

Consider:
- Are there operations that could throw errors?
- Is there try-catch or other error handling?
- Could errors be silently swallowed?
- Should errors be propagated differently?

Respond with JSON in this exact format:
{
  "hasErrorHandling": true or false,
  "risks": ["list", "of", "error", "risks"],
  "recommendation": "how to improve error handling"
}`;
}

/**
 * Prompt template for suggesting a better function signature
 */
export function createSuggestSignaturePrompt(fnSource: string): string {
  return `Analyze this void function and suggest an improved signature if appropriate.

Function source:
\`\`\`
${fnSource}
\`\`\`

Consider:
- Should it return Promise<void> for async operations?
- Should it return a status or result?
- Are there better parameter types?
- Could it benefit from generic types?

Respond with JSON in this exact format:
{
  "current": "current function signature",
  "suggested": "suggested improved signature",
  "reason": "why this improvement helps"
}`;
}

/**
 * Prompt template for checking if void is appropriate for a function name
 */
export function createIsAppropriateForPrompt(fnName: string): string {
  return `Determine if void is an appropriate return type for a function named "${fnName}".

Function name: "${fnName}"

Consider common naming conventions:
- "get*", "find*", "calculate*", "compute*" should return values
- "set*", "log*", "print*", "send*", "emit*" are typically void
- "handle*", "on*" event handlers are typically void
- "init*", "setup*", "configure*" may or may not return
- "validate*", "check*", "is*" should return boolean

Respond with JSON in this exact format:
{
  "appropriate": true or false,
  "reason": "explanation based on the function name semantics"
}`;
}
