/**
 * Prompts for SemanticCallable LLM operations
 * These prompts help analyze, validate, and understand callable values
 */

/**
 * System prompt for callable analysis
 */
export const CALLABLE_SYSTEM_PROMPT = `You are a TypeScript expert specializing in callable analysis. Your task is to understand callable behavior, validate inputs, infer types, and detect issues.

You must respond with valid JSON only, no additional text or explanation.

Key concepts:
- Callables include functions, arrow functions, methods, and any callable object
- Callables have inputs (parameters) and outputs (return value)
- Callables can be pure (no side effects) or impure
- Callable behavior can be inferred from name, parameters, and implementation
- Type signatures describe parameter and return types
- Test cases help verify callable correctness

Guidelines:
- Analyze callable structure and behavior
- Validate inputs against semantic rules
- Infer type signatures from usage patterns
- Generate meaningful test cases
- Detect potential issues and suggest improvements`;

/**
 * Prompt for semantic equality between callables
 */
export function createSemanticallyEqualsPrompt(
  callable1Description: string,
  callable2Description: string,
  testInputs?: unknown[][]
): string {
  let prompt = `Determine if these two callables are semantically equivalent (same behavior).

Callable 1: ${callable1Description}
Callable 2: ${callable2Description}`;

  if (testInputs && testInputs.length > 0) {
    prompt += `\n\nTest inputs provided: ${JSON.stringify(testInputs)}`;
  }

  prompt += `

Consider:
- Do they produce the same outputs for the same inputs?
- Do they have the same side effects?
- Are edge cases handled the same way?
- Do they have equivalent error handling?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for explaining a callable
 */
export function createExplainPrompt(callableDescription: string): string {
  return `Explain what this callable does in plain language.

Callable: ${callableDescription}

Provide:
- A clear explanation of the callable's purpose
- How it handles different inputs
- Any notable behavior or edge cases
- Side effects if any

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation of the callable"
}`;
}

/**
 * Prompt for inferring callable signature from sample calls
 */
export function createInferSignaturePrompt(
  callableDescription: string,
  sampleCalls: { args: unknown[]; result?: unknown }[]
): string {
  return `Infer the TypeScript type signature of this callable from sample calls.

Callable: ${callableDescription}

Sample calls:
${sampleCalls.map((call, i) => `Call ${i + 1}: args=${JSON.stringify(call.args)}${call.result !== undefined ? `, result=${JSON.stringify(call.result)}` : ''}`).join('\n')}

Infer:
- Parameter types (names and TypeScript types)
- Return type
- Whether parameters are optional
- Generic type parameters if applicable

Respond with JSON in this exact format:
{
  "parameters": [
    { "name": "paramName", "type": "TypeScript type", "optional": false }
  ],
  "returnType": "TypeScript return type",
  "generics": ["T", "U"] or [],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating TypeScript type definition
 */
export function createGenerateTypeDefinitionPrompt(
  callableDescription: string,
  name?: string
): string {
  return `Generate a TypeScript type definition for this callable.

Callable: ${callableDescription}
${name ? `Preferred name: ${name}` : ''}

Generate:
- A complete TypeScript type definition
- JSDoc comments for documentation
- Generic type parameters if needed
- Parameter and return type annotations

Respond with JSON in this exact format:
{
  "typeDefinition": "the complete TypeScript type definition",
  "interfaceName": "suggested interface/type name"
}`;
}

/**
 * Prompt for validating callable arguments
 */
export function createValidateArgsPrompt(
  callableDescription: string,
  args: unknown[],
  rules?: string[]
): string {
  let prompt = `Validate these arguments against the callable's expected inputs.

Callable: ${callableDescription}
Arguments: ${JSON.stringify(args)}`;

  if (rules && rules.length > 0) {
    prompt += `\n\nValidation rules:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  prompt += `

Check:
- Are the argument types correct?
- Do arguments satisfy any validation rules?
- Are there potential issues with these values?
- Would these arguments cause runtime errors?

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["array of validation issues, empty if valid"]
}`;

  return prompt;
}

/**
 * Prompt for generating test cases
 */
export function createGenerateTestsPrompt(callableDescription: string): string {
  return `Generate test cases for this callable.

Callable: ${callableDescription}

Generate tests for:
- Normal/happy path cases
- Edge cases (empty input, boundary values, null/undefined)
- Error cases (invalid inputs that should throw)
- Type coercion cases if applicable

Respond with JSON in this exact format:
{
  "tests": [
    {
      "input": [array of input arguments],
      "expectedOutput": the expected return value,
      "description": "description of what this test checks",
      "shouldThrow": false
    }
  ]
}`;
}

/**
 * Prompt for suggesting a type-safe wrapper
 */
export function createSuggestWrapperPrompt(callableDescription: string): string {
  return `Suggest a type-safe wrapper for this callable.

Callable: ${callableDescription}

Consider:
- Input validation with clear error messages
- Runtime type checking
- Default values for optional parameters
- Error handling and recovery
- Logging or instrumentation hooks

Respond with JSON in this exact format:
{
  "wrapper": "TypeScript code for the wrapper function",
  "benefits": ["list of benefits this wrapper provides"],
  "validations": ["list of validations added"]
}`;
}

/**
 * Prompt for detecting potential issues
 */
export function createDetectIssuesPrompt(callableDescription: string): string {
  return `Detect potential issues with this callable.

Callable: ${callableDescription}

Check for:
- Missing error handling
- Type safety issues
- Edge case handling
- Potential runtime errors
- Security vulnerabilities
- Performance concerns
- Memory leaks

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
 * Prompt for checking if safe to call with arguments
 */
export function createIsSafeToCallPrompt(
  callableDescription: string,
  args: unknown[]
): string {
  return `Determine if it's safe to call this callable with these arguments.

Callable: ${callableDescription}
Arguments: ${JSON.stringify(args)}

Consider:
- Could these arguments cause errors?
- Are there security concerns (injection, path traversal, etc.)?
- Could this cause unintended side effects?
- Are there resource exhaustion risks (memory, CPU)?
- Could this leak sensitive information?

Respond with JSON in this exact format:
{
  "safe": true or false,
  "reason": "explanation if not safe, null if safe",
  "severity": "low" | "medium" | "high" (only if not safe)
}`;
}
