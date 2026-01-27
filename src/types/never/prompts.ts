/**
 * Prompts for SemanticNever LLM operations
 * These prompts are used to analyze unreachable code, exhaustiveness, and never type semantics
 */

/**
 * System prompt for never type analysis tasks
 */
export const NEVER_SYSTEM_PROMPT = `You are a TypeScript type system expert specializing in the 'never' type and exhaustiveness checking. Your task is to analyze code patterns related to unreachable code, exhaustive switches, and impossible type states.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- "never" is the bottom type in TypeScript - it represents values that never occur
- A function returning "never" will never return normally (throws or infinite loop)
- Exhaustive checks ensure all cases of a union type are handled
- Dead code is code that can never be executed
- Type narrowing can result in "never" when all possibilities are eliminated
- Intersecting incompatible types (string & number) results in "never"

Unreachability types:
- "control-flow": Code after throw, return, or infinite loops
- "type-narrowing": Code in branches where type is narrowed to never
- "exhaustive-check": Default case in exhaustive switch that should never be reached
- "impossible-state": Code that handles states that cannot exist

Guidelines:
- Be precise about why code is unreachable
- Consider all edge cases in exhaustiveness analysis
- Provide actionable suggestions for handling never types
- Explain type intersections clearly`;

/**
 * Prompt template for checking if a switch/conditional is exhaustive
 */
export function createIsExhaustivePrompt(
  typeName: string,
  handledCases: string[]
): string {
  return `Analyze if the following union type is exhaustively handled by the provided cases.

Type name: "${typeName}"
Handled cases: ${JSON.stringify(handledCases)}

Consider:
- What are the likely members of this union type based on its name?
- Are all possible cases handled?
- What cases might be missing?

Common patterns:
- Status types: "pending", "active", "completed", "failed", "cancelled"
- Result types: "success", "error", "loading"
- Direction types: "up", "down", "left", "right"
- Boolean-like: "yes", "no", "maybe"

Respond with JSON in this exact format:
{
  "exhaustive": true or false,
  "missing": ["array", "of", "missing", "cases"] (empty if exhaustive)
}`;
}

/**
 * Prompt template for explaining why code is unreachable
 */
export function createExplainUnreachabilityPrompt(context: string): string {
  return `Explain why the following code context represents unreachable code (never type).

Context: "${context}"

Analyze the context and determine:
1. Why this code path cannot be executed
2. What type of unreachability this represents
3. What the developer should do about it

Types of unreachability:
- "control-flow": After throw statements, return statements, or infinite loops
- "type-narrowing": When type guards eliminate all possibilities
- "exhaustive-check": In default cases of exhaustive switches
- "impossible-state": When business logic makes a state impossible

Respond with JSON in this exact format:
{
  "reason": "clear explanation of why this code is unreachable",
  "type": "control-flow" | "type-narrowing" | "exhaustive-check" | "impossible-state",
  "suggestion": "what the developer should do (e.g., remove dead code, add assertNever)"
}`;
}

/**
 * Prompt template for checking if code is dead code
 */
export function createIsDeadCodePrompt(code: string, context?: string): string {
  let prompt = `Analyze if the following code is dead code (can never be executed).

Code: "${code}"`;

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

Consider:
- Is there any control flow that could reach this code?
- Are there any conditions that could allow this code to run?
- Could runtime behavior differ from static analysis?
- Is it safe to remove this code without side effects?

Respond with JSON in this exact format:
{
  "isDead": true or false,
  "reason": "explanation of why this code is or isn't dead",
  "safeToRemove": true or false
}`;

  return prompt;
}

/**
 * Prompt template for suggesting exhaustive handler code
 */
export function createSuggestExhaustiveHandlerPrompt(typeName: string): string {
  return `Generate TypeScript code for an exhaustive handler function that can be used with the discriminated union type "${typeName}".

The exhaustive handler pattern:
1. Takes a value of type 'never' as parameter
2. Throws an error if called (which should never happen if types are correct)
3. Used in default/else branches to ensure exhaustiveness at compile time

Provide:
1. The assertNever helper function definition
2. Example usage in a switch statement default case

Respond with JSON in this exact format:
{
  "code": "function assertNever(x: never): never { throw new Error(\`Unexpected value: \${x}\`); }",
  "usage": "default: return assertNever(${typeName.toLowerCase()});"
}`;
}

/**
 * Prompt template for validating exhaustiveness in function code
 */
export function createValidateExhaustivenessCheckPrompt(fnCode: string): string {
  return `Analyze the following function code to determine if it properly handles all cases of a discriminated union using exhaustiveness checking.

Function code:
\`\`\`
${fnCode}
\`\`\`

Check for:
1. Does it handle all visible cases in the switch/if-else?
2. Does it use an assertNever or similar pattern in the default case?
3. What cases are explicitly handled?
4. Are any cases potentially missing?

Respond with JSON in this exact format:
{
  "valid": true or false,
  "covers": ["array", "of", "handled", "cases"],
  "missing": ["array", "of", "missing", "cases"] (omit if valid),
  "suggestion": "how to fix if invalid" (omit if valid)
}`;
}

/**
 * Prompt template for checking if a function should return never
 */
export function createShouldReturnNeverPrompt(
  fnName: string,
  behavior: string
): string {
  return `Determine if the function "${fnName}" should have a return type of 'never' based on its behavior.

Function name: "${fnName}"
Behavior: "${behavior}"

A function should return 'never' if:
- It always throws an exception
- It contains an infinite loop that never breaks
- It calls process.exit() or similar termination
- It recursively calls itself forever

A function should NOT return 'never' if:
- It might return normally in some cases
- It has conditional throws
- It might complete without returning explicitly (void)

Respond with JSON in this exact format:
{
  "shouldReturn": true or false,
  "reason": "explanation of why the function should or shouldn't return never"
}`;
}

/**
 * Prompt template for explaining the never type
 */
export function createExplainPrompt(context?: string): string {
  let prompt = `Generate a clear, educational explanation of TypeScript's 'never' type`;

  if (context) {
    prompt += ` in the context of: "${context}"`;
  }

  prompt += `.

The explanation should cover:
- What the never type represents
- When it occurs naturally
- How it's used in practice
- Common patterns and best practices

Keep the explanation concise but comprehensive.

Respond with JSON in this exact format:
{
  "explanation": "clear explanation of the never type suitable for the given context"
}`;

  return prompt;
}

/**
 * Prompt template for analyzing type intersections
 */
export function createAnalyzeIntersectionPrompt(types: string[]): string {
  return `Analyze if the intersection of the following TypeScript types results in 'never'.

Types: ${JSON.stringify(types)}

Type intersection rules:
- Primitive types are mutually exclusive (string & number = never)
- Object types can be intersected if their properties are compatible
- Union members are intersected individually
- 'never' intersected with anything is 'never'
- 'unknown' intersected with T is T

Consider:
- Are these types fundamentally incompatible?
- Could any value satisfy all these types simultaneously?
- Are there edge cases where the intersection might be valid?

Respond with JSON in this exact format:
{
  "resultsInNever": true or false,
  "reason": "explanation of why the intersection does or doesn't result in never"
}`;
}

/**
 * Get appropriate patterns where never is commonly used
 * Note: This is a static list, not LLM-powered
 */
export function getAppropriatePatterns(): {
  pattern: string;
  description: string;
  example: string;
}[] {
  return [
    {
      pattern: 'Exhaustive switch handler',
      description:
        'Use never in default case to ensure all union members are handled at compile time',
      example:
        'function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }',
    },
    {
      pattern: 'Functions that never return',
      description:
        'Functions that always throw or have infinite loops should return never',
      example: 'function fail(message: string): never { throw new Error(message); }',
    },
    {
      pattern: 'Impossible type states',
      description:
        'After exhaustive type guards, remaining type is never',
      example:
        'if (typeof x === "string") { ... } else if (typeof x === "number") { ... } else { const _: never = x; }',
    },
    {
      pattern: 'Type narrowing endpoint',
      description:
        'When all possibilities are eliminated through narrowing, type becomes never',
      example:
        'function process(x: string | number) { if (typeof x === "string") return x.toUpperCase(); if (typeof x === "number") return x.toFixed(2); const exhaustiveCheck: never = x; }',
    },
    {
      pattern: 'Bottom type in generics',
      description:
        'Never is the identity for union types (T | never = T)',
      example:
        'type NonNullable<T> = T extends null | undefined ? never : T;',
    },
    {
      pattern: 'Conditional type termination',
      description:
        'Use never to filter out unwanted types in conditional types',
      example:
        'type ExtractStrings<T> = T extends string ? T : never;',
    },
  ];
}
