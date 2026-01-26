/**
 * Prompts for SemanticNever LLM operations
 * These prompts help analyze unreachable code, exhaustiveness, and never type patterns
 */

/**
 * System prompt for never type analysis
 */
export const NEVER_SYSTEM_PROMPT = `You are a TypeScript type system expert specializing in the 'never' type and control flow analysis. Your task is to help developers understand unreachable code, validate exhaustiveness, and identify appropriate uses of 'never'.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- The 'never' type represents values that never occur
- Functions returning 'never' never return normally (throw or infinite loop)
- After exhaustive type narrowing, remaining type is 'never'
- Code after 'never' is unreachable (dead code)

Guidelines:
- Analyze control flow to determine unreachability
- Validate exhaustive switches and conditionals
- Identify functions that should return never
- Suggest proper exhaustiveness check patterns`;

/**
 * Prompt for checking exhaustiveness
 */
export function createIsExhaustivePrompt(
  typeName: string,
  handledCases: string[]
): string {
  return `Check if the following switch/conditional is exhaustive for the given type.

Type name: "${typeName}"
Handled cases: ${JSON.stringify(handledCases)}

Analyze:
- What are all possible values of this type?
- Which values are not handled?
- Is the handling complete?

Respond with JSON in this exact format:
{
  "exhaustive": true or false,
  "missing": ["array of unhandled cases, empty if exhaustive"]
}`;
}

/**
 * Prompt for explaining unreachability
 */
export function createExplainUnreachabilityPrompt(context: string): string {
  return `Explain why the following code path is unreachable (results in 'never').

Context: "${context}"

Types of unreachability:
- "control-flow": Code after return/throw/break/continue
- "type-narrowing": Impossible after type guards
- "exhaustive-check": After handling all union cases
- "impossible-state": Logically impossible condition

Respond with JSON in this exact format:
{
  "reason": "explanation of why this code is unreachable",
  "type": "control-flow" | "type-narrowing" | "exhaustive-check" | "impossible-state",
  "suggestion": "what to do about this unreachable code"
}`;
}

/**
 * Prompt for checking dead code
 */
export function createIsDeadCodePrompt(code: string, context?: string): string {
  let prompt = `Analyze if the following code is dead (unreachable).

Code: "${code}"`;

  if (context) {
    prompt += `\nSurrounding context: "${context}"`;
  }

  prompt += `

Consider:
- Is there a return/throw/break before this code?
- Is this after an exhaustive check?
- Can the condition ever be true?
- Is it safe to remove this code?

Respond with JSON in this exact format:
{
  "isDead": true or false,
  "reason": "explanation of why it is or isn't dead code",
  "safeToRemove": true or false
}`;

  return prompt;
}

/**
 * Prompt for suggesting exhaustive handler
 */
export function createSuggestExhaustiveHandlerPrompt(typeName: string): string {
  return `Generate an exhaustive check handler function for the type "${typeName}".

The handler should:
- Accept a value of type 'never'
- Throw an error if reached (indicates non-exhaustive handling)
- Include the unexpected value in the error message

Respond with JSON in this exact format:
{
  "code": "the assertNever function implementation",
  "usage": "example of how to use it in a default case"
}`;
}

/**
 * Prompt for validating exhaustiveness check
 */
export function createValidateExhaustivenessCheckPrompt(fnCode: string): string {
  return `Validate that the following function properly uses 'never' for exhaustiveness checking.

Function code/description: "${fnCode}"

Check:
- Does it handle all cases of the discriminated union?
- Does it have a proper default case with never?
- Are there any missing cases?

Respond with JSON in this exact format:
{
  "valid": true or false,
  "covers": ["array of handled cases"],
  "missing": ["array of missing cases, if any"],
  "suggestion": "improvement suggestion if not valid, null if valid"
}`;
}

/**
 * Prompt for checking if function should return never
 */
export function createShouldReturnNeverPrompt(
  fnName: string,
  behavior: string
): string {
  return `Determine if the function "${fnName}" should have a return type of 'never'.

Function behavior: "${behavior}"

A function should return 'never' if it:
- Always throws an error
- Has an infinite loop
- Always terminates the process
- Never returns normally

Respond with JSON in this exact format:
{
  "shouldReturn": true or false,
  "reason": "explanation of why it should or shouldn't return never"
}`;
}

/**
 * Prompt for explaining never type
 */
export function createExplainPrompt(context?: string): string {
  let prompt = `Explain the TypeScript 'never' type`;

  if (context) {
    prompt += ` in the context of "${context}"`;
  }

  prompt += `.

Provide a clear, educational explanation suitable for developers learning TypeScript.

Respond with JSON in this exact format:
{
  "explanation": "clear explanation of the never type in this context"
}`;

  return prompt;
}

/**
 * Prompt for analyzing type intersection
 */
export function createAnalyzeIntersectionPrompt(types: string[]): string {
  return `Analyze if the intersection of the following types results in 'never'.

Types: ${JSON.stringify(types)}

Consider:
- Are these types mutually exclusive?
- Can a value satisfy all type constraints?
- What property conflicts exist?

Respond with JSON in this exact format:
{
  "resultsInNever": true or false,
  "reason": "explanation of why the intersection does or doesn't result in never"
}`;
}

/**
 * Prompt for getting appropriate patterns
 */
export function createAppropriatePatternsPrompt(): string {
  return `List common TypeScript patterns where the 'never' type is appropriately used.

Include:
- Pattern name
- Description of when to use it
- Code example

Respond with JSON in this exact format:
{
  "patterns": [
    {
      "pattern": "pattern name",
      "description": "when and why to use this pattern",
      "example": "code example"
    }
  ]
}`;
}
