/**
 * Prompts for SemanticCallable LLM operations
 * These prompts enable intelligent function analysis, signature inference, and behavioral understanding
 */

/**
 * System prompt for callable analysis tasks
 */
export const CALLABLE_SYSTEM_PROMPT = `You are an expert at analyzing TypeScript/JavaScript functions, understanding their behavior, and providing semantic insights about callable types.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze function signatures, behavior, and usage patterns
- Consider edge cases, type safety, and common programming patterns
- Provide meaningful, contextual responses based on the function's purpose
- Be precise with confidence scores based on available information`;

/**
 * Prompt template for semantic equality comparison between callables
 */
export function createSemanticallyEqualsPrompt(
  fn1Source: string,
  fn2Source: string,
  fn1Description?: string,
  fn2Description?: string,
  testCases?: unknown[][]
): string {
  let prompt = `Compare these two functions and determine if they are behaviorally equivalent.
Functions are equivalent if they produce the same outputs for the same inputs, regardless of implementation.

Function 1:
${fn1Source}
${fn1Description ? `Description: "${fn1Description}"` : ''}

Function 2:
${fn2Source}
${fn2Description ? `Description: "${fn2Description}"` : ''}`;

  if (testCases && testCases.length > 0) {
    prompt += `

Test Cases (inputs):
${testCases.map((tc, i) => `${i + 1}. ${JSON.stringify(tc)}`).join('\n')}`;
  }

  prompt += `

Consider:
- Same return values for same inputs
- Handling of edge cases (null, undefined, empty values)
- Error handling behavior
- Side effects (if any)

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt template for explaining what a callable does
 */
export function createExplainPrompt(
  fnSource: string,
  description?: string
): string {
  return `Explain what this function does in plain English.

Function:
${fnSource}
${description ? `Provided Description: "${description}"` : ''}

Provide a clear, concise explanation that covers:
- What the function does
- What inputs it expects
- What it returns
- Any notable edge cases or behaviors

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation of what the function does"
}`;
}

/**
 * Prompt template for inferring function signature from sample calls
 */
export function createInferSignaturePrompt(
  fnSource: string,
  sampleCalls: unknown[][]
): string {
  return `Infer the TypeScript type signature for this function based on its implementation and sample calls.

Function:
${fnSource}

Sample Calls (arguments):
${sampleCalls.map((call, i) => `${i + 1}. ${JSON.stringify(call)} -> types: ${call.map(arg => typeof arg).join(', ')}`).join('\n')}

Analyze the function and sample inputs to infer:
- Parameter types (use union types if multiple types are observed)
- Return type
- Whether parameters are optional

Respond with JSON in this exact format:
{
  "params": ["type1", "type2", ...],
  "return": "return type",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for generating TypeScript type definition
 */
export function createGenerateTypeDefinitionPrompt(
  fnSource: string,
  description?: string,
  inferredParams?: string[],
  inferredReturn?: string
): string {
  let prompt = `Generate a TypeScript type definition for this function.

Function:
${fnSource}
${description ? `Description: "${description}"` : ''}`;

  if (inferredParams && inferredReturn) {
    prompt += `

Inferred Signature:
- Parameters: ${inferredParams.join(', ')}
- Return: ${inferredReturn}`;
  }

  prompt += `

Generate a complete type definition that:
- Uses meaningful parameter names
- Includes proper TypeScript types
- Is formatted as a type alias

Respond with JSON in this exact format:
{
  "typeDefinition": "type FunctionName = (param1: Type1, param2: Type2) => ReturnType;"
}`;

  return prompt;
}

/**
 * Prompt template for validating function arguments
 */
export function createValidateArgsPrompt(
  fnSource: string,
  args: unknown[],
  rules?: string[]
): string {
  let prompt = `Validate the following arguments for this function.

Function:
${fnSource}

Arguments to validate:
${JSON.stringify(args, null, 2)}`;

  if (rules && rules.length > 0) {
    prompt += `

Validation Rules:
${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;
  }

  prompt += `

Check for:
- Type correctness
- Value constraints (null checks, bounds, etc.)
- Semantic validity based on the function's purpose
${rules ? '- All specified validation rules' : ''}

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["array of issues found, empty if valid"]
}`;

  return prompt;
}

/**
 * Prompt template for generating test cases
 */
export function createGenerateTestsPrompt(
  fnSource: string,
  description?: string
): string {
  return `Generate test cases for this function.

Function:
${fnSource}
${description ? `Description: "${description}"` : ''}

Generate diverse test cases covering:
- Normal/happy path cases
- Edge cases (empty inputs, boundaries)
- Error cases (invalid inputs)
- Special values (null, undefined, zero, negative)

For each test case, provide inputs, expected output, and a description.

Respond with JSON in this exact format:
{
  "tests": [
    {
      "inputs": [arg1, arg2, ...],
      "expectedOutput": expected_result,
      "description": "brief description of what this test covers"
    }
  ]
}`;
}

/**
 * Prompt template for suggesting a type-safe wrapper
 */
export function createSuggestWrapperPrompt(
  fnSource: string,
  description?: string,
  detectedIssues?: string[]
): string {
  let prompt = `Suggest a type-safe wrapper or decorator for this function.

Function:
${fnSource}
${description ? `Description: "${description}"` : ''}`;

  if (detectedIssues && detectedIssues.length > 0) {
    prompt += `

Detected Issues:
${detectedIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}`;
  }

  prompt += `

Create a wrapper that:
- Adds runtime type checking if needed
- Handles edge cases safely
- Returns null/undefined safely instead of throwing
- Improves error messages

Respond with JSON in this exact format:
{
  "code": "function safeWrapper(...) { ... }",
  "reason": "explanation of why this wrapper is beneficial"
}`;

  return prompt;
}

/**
 * Prompt template for detecting potential issues
 */
export function createDetectIssuesPrompt(
  fnSource: string,
  description?: string
): string {
  return `Detect potential issues in this function.

Function:
${fnSource}
${description ? `Description: "${description}"` : ''}

Look for:
- Missing null/undefined checks
- Potential runtime errors
- Type coercion issues
- Missing error handling
- Potential infinite loops or recursion
- Security concerns (injection, unsafe operations)
- Performance issues

For each issue, specify severity:
- "info": Style or minor improvements
- "warning": Potential problems that should be addressed
- "error": Critical issues that could cause failures

Respond with JSON in this exact format:
{
  "issues": [
    {
      "issue": "description of the issue",
      "severity": "info" | "warning" | "error"
    }
  ]
}`;
}

/**
 * Prompt template for checking if safe to call with arguments
 */
export function createIsSafeToCallPrompt(
  fnSource: string,
  args: unknown[],
  description?: string
): string {
  return `Determine if it is safe to call this function with the given arguments.

Function:
${fnSource}
${description ? `Description: "${description}"` : ''}

Arguments:
${JSON.stringify(args, null, 2)}

Consider:
- Will the function throw an error?
- Could it cause infinite loops or hangs?
- Are there division by zero risks?
- Could it access undefined properties?
- Are the argument types compatible?
- Could it cause memory issues?

Respond with JSON in this exact format:
{
  "safe": true or false,
  "reason": "optional explanation if not safe"
}`;
}
