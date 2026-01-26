/**
 * Prompts for SemanticVoid LLM operations
 * These prompts help analyze void-returning functions and their side effects
 */

/**
 * System prompt for void type analysis
 */
export const VOID_SYSTEM_PROMPT = `You are a TypeScript expert specializing in analyzing void-returning functions. Your task is to understand side effects, validate appropriate usage, and suggest improvements.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- Void functions don't return a value
- They typically perform side effects (logging, mutations, I/O)
- Some functions should return values instead of void
- Error handling in void functions can be problematic

Guidelines:
- Identify all side effects a function performs
- Determine if void is the appropriate return type
- Suggest improvements for error handling and return types`;

/**
 * Prompt for analyzing side effects
 */
export function createAnalyzeSideEffectsPrompt(fnDescription: string): string {
  return `Analyze the side effects of this void-returning function.

Function description: "${fnDescription}"

Identify:
- What side effects does this function have?
- Is this function pure (no side effects)?
- What external state does it modify?

Respond with JSON in this exact format:
{
  "hasSideEffects": true or false,
  "effects": ["array of side effects"],
  "pure": true or false
}`;
}

/**
 * Prompt for checking if function should return a value
 */
export function createShouldReturnValuePrompt(fnDescription: string, context?: string): string {
  let prompt = `Determine if this void function should actually return a value.

Function description: "${fnDescription}"`;

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

Consider:
- Does this function process or transform data?
- Would a return value be useful for callers?
- Is information being lost by not returning?

Respond with JSON in this exact format:
{
  "shouldReturn": true or false,
  "reason": "explanation of why it should or shouldn't return",
  "suggestedType": "suggested return type if shouldReturn is true, null otherwise"
}`;

  return prompt;
}

/**
 * Prompt for explaining a void function
 */
export function createExplainPrompt(fnDescription: string): string {
  return `Explain what this void-returning function does.

Function description: "${fnDescription}"

Provide:
- A clear explanation of what the function does
- Its side effects
- Why it returns void

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation of the function"
}`;
}

/**
 * Prompt for validating usage
 */
export function createValidateUsagePrompt(fnDescription: string, usage: string): string {
  return `Validate if this void function is being used appropriately.

Function description: "${fnDescription}"
Usage context: "${usage}"

Check:
- Is void appropriate for this usage pattern?
- Are there potential issues with this usage?
- What would be better alternatives?

Respond with JSON in this exact format:
{
  "appropriate": true or false,
  "reason": "explanation of why it is or isn't appropriate",
  "suggestion": "alternative approach if not appropriate, null if appropriate"
}`;
}

/**
 * Prompt for checking error handling
 */
export function createCheckErrorHandlingPrompt(fnDescription: string): string {
  return `Analyze the error handling of this void function.

Function description: "${fnDescription}"

Consider:
- Does this function handle errors?
- Could errors be silently ignored?
- What are the risks of not propagating errors?

Respond with JSON in this exact format:
{
  "hasErrorHandling": true or false,
  "risks": ["array of potential risks"],
  "recommendation": "suggestion for better error handling"
}`;
}

/**
 * Prompt for suggesting better signature
 */
export function createSuggestSignaturePrompt(fnDescription: string): string {
  return `Suggest a better function signature for this void function.

Function description: "${fnDescription}"

Consider:
- Should it return a value?
- Should it return a Promise for async operations?
- Should it use a callback pattern?

Respond with JSON in this exact format:
{
  "current": "inferred current signature",
  "suggested": "suggested improved signature",
  "reason": "why this signature is better"
}`;
}

/**
 * Prompt for checking if void is appropriate for a function name
 */
export function createIsAppropriateForPrompt(fnName: string): string {
  return `Determine if void is an appropriate return type for a function named "${fnName}".

Common patterns:
- "log*", "print*", "send*" -> typically void
- "get*", "find*", "calculate*" -> should return value
- "set*", "update*" -> could be void or return updated value
- "on*", "handle*" -> event handlers are typically void

Respond with JSON in this exact format:
{
  "appropriate": true or false,
  "reason": "explanation of why void is or isn't appropriate for this function name"
}`;
}

/**
 * Prompt for getting appropriate void patterns
 */
export function createAppropriatePatternsPrompt(): string {
  return `List common patterns where void return type is appropriate.

Respond with JSON in this exact format:
{
  "patterns": ["array of pattern names/descriptions"]
}`;
}
