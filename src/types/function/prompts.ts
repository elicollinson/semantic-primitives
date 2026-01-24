/**
 * Prompts for SemanticFunction LLM operations
 * These prompts enable semantic operations on functions
 */

/**
 * System prompt for function semantic operations
 */
export const FUNCTION_SYSTEM_PROMPT = `You are a semantic function analyzer. Your task is to analyze JavaScript/TypeScript functions to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze function code, parameters, and behavior
- Consider function names, comments, and patterns
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for explaining what a function does
 */
export function createExplainPrompt(fnString: string, description?: string): string {
  let prompt = `Explain what this function does in plain language.

Function code:
\`\`\`
${fnString}
\`\`\``;

  if (description) {
    prompt += `\n\nProvided description: "${description}"`;
  }

  prompt += `

Provide a clear, concise explanation of:
- What the function does
- Its inputs and outputs
- Any edge cases it handles

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation here",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for semantic equality comparison of functions
 */
export function createSemanticallyEqualsPrompt(
  fn1String: string,
  fn2String: string,
  testInputs?: unknown[][]
): string {
  let prompt = `Compare these two functions for semantic equivalence.
They should be considered equivalent if they produce the same outputs for the same inputs.

Function 1:
\`\`\`
${fn1String}
\`\`\`

Function 2:
\`\`\`
${fn2String}
\`\`\``;

  if (testInputs && testInputs.length > 0) {
    prompt += `\n\nTest inputs provided: ${JSON.stringify(testInputs)}`;
  }

  prompt += `

Consider:
- Do both functions produce the same results for the same inputs?
- Do they handle edge cases similarly?
- Are they functionally equivalent despite different implementations?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "optional explanation"
}`;

  return prompt;
}

/**
 * Prompt for validating function arguments
 */
export function createValidateArgsPrompt(
  fnString: string,
  args: unknown[],
  rules?: string[]
): string {
  let prompt = `Validate these arguments for the given function.

Function:
\`\`\`
${fnString}
\`\`\`

Arguments: ${JSON.stringify(args)}`;

  if (rules && rules.length > 0) {
    prompt += `\n\nValidation rules:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  prompt += `

Check if:
- Arguments match expected types
- Arguments are valid values for the function's purpose
- Any semantic rules are satisfied

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["issue 1", "issue 2"],
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for inferring function purpose
 */
export function createInferPurposePrompt(fnString: string, description?: string): string {
  let prompt = `Analyze this function and infer its purpose and category.

Function:
\`\`\`
${fnString}
\`\`\``;

  if (description) {
    prompt += `\n\nProvided description: "${description}"`;
  }

  prompt += `

Categorize the function by:
- Its primary purpose (e.g., "data-transformation", "validation", "calculation", "api-call")
- Its category (e.g., "array-manipulation", "string-processing", "math", "async-operation")

Respond with JSON in this exact format:
{
  "purpose": "primary purpose",
  "category": "category name",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for generating function documentation
 */
export function createGenerateDocsPrompt(
  fnString: string,
  format: 'jsdoc' | 'markdown' | 'plain'
): string {
  const formatDescriptions = {
    jsdoc: 'JSDoc format with @param, @returns, @example tags',
    markdown: 'Markdown format with headers, code blocks, and lists',
    plain: 'Plain text format with clear sections',
  };

  return `Generate documentation for this function.

Function:
\`\`\`
${fnString}
\`\`\`

Format: ${format} (${formatDescriptions[format]})

Include:
- Description of what the function does
- Parameters with types and descriptions
- Return value description
- Usage example(s)

Respond with JSON in this exact format:
{
  "documentation": "the generated documentation string",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting function improvements
 */
export function createSuggestImprovementsPrompt(fnString: string): string {
  return `Analyze this function and suggest improvements.

Function:
\`\`\`
${fnString}
\`\`\`

Consider:
- Code clarity and readability
- Error handling
- Performance optimizations
- Edge case handling
- Best practices

Respond with JSON in this exact format:
{
  "suggestions": [
    { "suggestion": "improvement description", "reason": "why this improvement helps" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for detecting function issues
 */
export function createDetectIssuesPrompt(fnString: string): string {
  return `Analyze this function and detect potential issues.

Function:
\`\`\`
${fnString}
\`\`\`

Look for:
- Potential bugs or errors
- Missing error handling
- Security vulnerabilities
- Performance issues
- Code smells

Respond with JSON in this exact format:
{
  "issues": [
    { "issue": "issue description", "severity": "info" | "warning" | "error" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating test cases
 */
export function createGenerateTestsPrompt(fnString: string): string {
  return `Generate test cases for this function.

Function:
\`\`\`
${fnString}
\`\`\`

Create test cases that cover:
- Normal/happy path scenarios
- Edge cases
- Error conditions
- Boundary values

Respond with JSON in this exact format:
{
  "testCases": [
    { "input": [arg1, arg2], "expectedOutput": result, "description": "test description" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for checking if function is safe to call
 */
export function createIsSafeToCallPrompt(fnString: string, args: unknown[]): string {
  return `Assess whether it's safe to call this function with the given arguments.

Function:
\`\`\`
${fnString}
\`\`\`

Arguments: ${JSON.stringify(args)}

Consider:
- Could the arguments cause unexpected behavior?
- Are there potential injection risks?
- Could the function produce harmful side effects with these inputs?
- Are the argument types and values appropriate?

Respond with JSON in this exact format:
{
  "safe": true or false,
  "reason": "explanation if not safe",
  "confidence": 0.0 to 1.0
}`;
}
