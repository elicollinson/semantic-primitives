/**
 * Prompts for SemanticFunction LLM operations
 * These prompts help analyze, validate, and understand functions
 */

/**
 * System prompt for function analysis
 */
export const FUNCTION_SYSTEM_PROMPT = `You are a TypeScript expert specializing in function analysis. Your task is to understand function behavior, validate inputs, and suggest improvements.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- Functions have inputs (parameters) and outputs (return value)
- Functions can be pure (no side effects) or impure
- Function behavior can be inferred from name, parameters, and implementation
- Test cases help verify function correctness

Guidelines:
- Analyze function structure and behavior
- Validate inputs against semantic rules
- Generate meaningful test cases
- Detect potential issues and suggest improvements`;

/**
 * Prompt for semantic equality between functions
 */
export function createSemanticallyEqualsPrompt(
  fn1Description: string,
  fn2Description: string,
  testInputs?: unknown[][]
): string {
  let prompt = `Determine if these two functions are semantically equivalent (same behavior).

Function 1: ${fn1Description}
Function 2: ${fn2Description}`;

  if (testInputs && testInputs.length > 0) {
    prompt += `\n\nTest inputs provided: ${JSON.stringify(testInputs)}`;
  }

  prompt += `

Consider:
- Do they produce the same outputs for the same inputs?
- Do they have the same side effects?
- Are edge cases handled the same way?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for explaining a function
 */
export function createExplainPrompt(fnDescription: string): string {
  return `Explain what this function does in plain language.

Function: ${fnDescription}

Provide:
- A clear explanation of the function's purpose
- How it handles different inputs
- Any notable behavior or edge cases

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation of the function"
}`;
}

/**
 * Prompt for validating function arguments
 */
export function createValidateArgsPrompt(
  fnDescription: string,
  args: unknown[],
  rules?: string[]
): string {
  let prompt = `Validate these arguments against the function's expected inputs.

Function: ${fnDescription}
Arguments: ${JSON.stringify(args)}`;

  if (rules && rules.length > 0) {
    prompt += `\n\nValidation rules:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  prompt += `

Check:
- Are the argument types correct?
- Do arguments satisfy any validation rules?
- Are there potential issues with these values?

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["array of validation issues, empty if valid"]
}`;

  return prompt;
}

/**
 * Prompt for inferring function purpose
 */
export function createInferPurposePrompt(fnDescription: string): string {
  return `Infer the purpose and category of this function.

Function: ${fnDescription}

Categories might include:
- data-transformation: Transforms input data
- validation: Validates or checks data
- calculation: Performs mathematical operations
- io: Input/output operations
- utility: General utility functions

Respond with JSON in this exact format:
{
  "purpose": "brief description of what the function does",
  "category": "category name",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating documentation
 */
export function createGenerateDocsPrompt(
  fnDescription: string,
  format: 'jsdoc' | 'markdown' | 'plain'
): string {
  return `Generate documentation for this function in ${format} format.

Function: ${fnDescription}

Include:
- Description of what the function does
- Parameter descriptions
- Return value description
- Usage examples if applicable

Respond with JSON in this exact format:
{
  "documentation": "the generated documentation string"
}`;
}

/**
 * Prompt for suggesting improvements
 */
export function createSuggestImprovementsPrompt(fnDescription: string): string {
  return `Suggest improvements for this function.

Function: ${fnDescription}

Consider:
- Input validation
- Error handling
- Code clarity
- Performance

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "suggestion": "description of improvement",
      "reason": "why this improvement is beneficial"
    }
  ]
}`;
}

/**
 * Prompt for detecting issues
 */
export function createDetectIssuesPrompt(fnDescription: string): string {
  return `Detect potential issues with this function.

Function: ${fnDescription}

Check for:
- Missing error handling
- Type safety issues
- Edge case handling
- Potential runtime errors

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
 * Prompt for generating test cases
 */
export function createGenerateTestsPrompt(fnDescription: string): string {
  return `Generate test cases for this function.

Function: ${fnDescription}

Generate tests for:
- Normal/happy path cases
- Edge cases (empty input, boundary values)
- Error cases

Respond with JSON in this exact format:
{
  "tests": [
    {
      "input": [array of input arguments],
      "expectedOutput": the expected return value,
      "description": "description of what this test checks"
    }
  ]
}`;
}

/**
 * Prompt for checking if safe to call
 */
export function createIsSafeToCallPrompt(fnDescription: string, args: unknown[]): string {
  return `Determine if it's safe to call this function with these arguments.

Function: ${fnDescription}
Arguments: ${JSON.stringify(args)}

Consider:
- Could these arguments cause errors?
- Are there security concerns (injection, etc.)?
- Could this cause unintended side effects?

Respond with JSON in this exact format:
{
  "safe": true or false,
  "reason": "explanation if not safe, null if safe"
}`;
}
