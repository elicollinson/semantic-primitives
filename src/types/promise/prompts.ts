/**
 * Prompts for SemanticPromise LLM operations
 * These prompts enable semantic operations on Promise wrappers
 */

/**
 * System prompt for promise semantic operations
 */
export const PROMISE_SYSTEM_PROMPT = `You are a semantic promise analyzer. Your task is to analyze async operations and their outcomes to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider operation descriptions and contexts
- Understand async operation patterns
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for explaining the operation
 */
export function createExplainPrompt(description: string): string {
  return `Explain what this async operation does.

Operation description: "${description}"

Provide a clear, human-readable explanation of what this operation does and what to expect.

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  value1: unknown,
  value2: unknown,
  context?: string
): string {
  let prompt = `Compare these two resolved promise values for semantic equivalence.

Value 1: ${JSON.stringify(value1)}
Value 2: ${JSON.stringify(value2)}`;

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

Determine if the values are semantically equivalent.

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for inferring operation type
 */
export function createInferOperationPrompt(description: string): string {
  return `Infer the type of async operation from the description.

Description: "${description}"

Categorize this operation by:
- Operation type (e.g., "api-call", "database-query", "file-operation")
- Resource being accessed (if applicable)
- Action being performed (e.g., "read", "write", "delete")

Respond with JSON in this exact format:
{
  "operation": "operation type",
  "resource": "resource name or null",
  "action": "action type or null",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating result
 */
export function createValidateResultPrompt(value: unknown, rules: string[]): string {
  return `Validate this promise result against the given rules.

Result: ${JSON.stringify(value)}
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check if the result satisfies all the rules.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["issue 1", "issue 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for transforming result
 */
export function createTransformPrompt(value: unknown, instruction: string): string {
  return `Transform this value according to the instruction.

Value: ${JSON.stringify(value)}
Instruction: "${instruction}"

Apply the transformation and return the result.

Respond with JSON in this exact format:
{
  "transformed": the transformed value,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for determining if error should trigger retry
 */
export function createShouldRetryPrompt(error: string, retryCondition: string): string {
  return `Determine if this error should trigger a retry.

Error: "${error}"
Retry condition: "${retryCondition}"

Analyze if the error matches the retry condition.

Respond with JSON in this exact format:
{
  "shouldRetry": true or false,
  "reason": "explanation",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for determining if fallback should apply
 */
export function createShouldFallbackPrompt(error: string, fallbackCondition: string): string {
  return `Determine if this error should trigger a fallback.

Error: "${error}"
Fallback condition: "${fallbackCondition}"

Analyze if the error matches the fallback condition.

Respond with JSON in this exact format:
{
  "shouldFallback": true or false,
  "reason": "explanation",
  "confidence": 0.0 to 1.0
}`;
}
