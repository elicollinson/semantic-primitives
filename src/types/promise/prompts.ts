/**
 * Prompts for SemanticPromise LLM operations
 * These prompts enable intelligent error handling, result transformation, and operation inference
 */

/**
 * System prompt for promise analysis tasks
 */
export const PROMISE_SYSTEM_PROMPT = `You are an expert at analyzing asynchronous operations, understanding promise behaviors, and providing semantic insights about async code.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze promise descriptions, values, and errors to understand their semantics
- Consider common async patterns in software development
- Provide meaningful, contextual responses
- Be precise with confidence scores based on available information`;

/**
 * Prompt template for semantic equality comparison between promise results
 */
export function createSemanticallyEqualsPrompt(
  value1: unknown,
  value2: unknown,
  description1?: string,
  description2?: string
): string {
  return `Compare these two promise results and determine if they are semantically equivalent.

Result 1:
Value: ${JSON.stringify(value1, null, 2)}
${description1 ? `Description: "${description1}"` : ''}

Result 2:
Value: ${JSON.stringify(value2, null, 2)}
${description2 ? `Description: "${description2}"` : ''}

Consider:
- Same meaning or purpose despite different formats
- Equivalent data representations
- Functionally identical outcomes

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for generating timeout error messages
 */
export function createTimeoutErrorPrompt(
  ms: number,
  context?: string,
  description?: string
): string {
  return `Generate a meaningful, user-friendly timeout error message.

Timeout Duration: ${ms}ms (${(ms / 1000).toFixed(1)} seconds)
${context ? `Context: "${context}"` : ''}
${description ? `Operation Description: "${description}"` : ''}

Create an error message that:
- Is clear and specific about what timed out
- Mentions the duration if helpful
- Suggests what the user might do

Respond with JSON in this exact format:
{
  "message": "the error message"
}`;
}

/**
 * Prompt template for semantic error analysis
 */
export function createCatchSemanticPrompt(
  error: Error,
  description?: string
): string {
  return `Analyze this error from a promise operation and provide semantic understanding.

Error:
Name: "${error.name}"
Message: "${error.message}"
${error.stack ? `Stack: ${error.stack}` : ''}
${description ? `Operation Description: "${description}"` : ''}

Provide:
- A user-friendly explanation
- The likely root cause
- Suggested fixes

Respond with JSON in this exact format:
{
  "explanation": "user-friendly explanation of what went wrong",
  "rootCause": "likely root cause",
  "suggestedFixes": ["array of suggested fixes"],
  "isRetryable": true or false
}`;
}

/**
 * Prompt template for determining if error matches retry conditions
 */
export function createShouldRetryPrompt(
  error: Error,
  whenCondition: string,
  attemptNumber: number
): string {
  return `Determine if this error matches the retry condition.

Error:
Name: "${error.name}"
Message: "${error.message}"

Retry Condition: "${whenCondition}"
Current Attempt: ${attemptNumber}

Common retry conditions include:
- "network error or timeout": Connectivity issues, timeouts, DNS failures
- "rate limit": 429 errors, too many requests
- "server error": 5xx errors, temporary unavailability
- "transient failure": Temporary issues that may resolve

Respond with JSON in this exact format:
{
  "shouldRetry": true or false,
  "reason": "brief explanation"
}`;
}

/**
 * Prompt template for transforming promise results
 */
export function createTransformPrompt(
  value: unknown,
  instruction: string
): string {
  return `Transform the following value according to the natural language instruction.

Value:
${JSON.stringify(value, null, 2)}

Instruction: "${instruction}"

Apply the transformation and return the result. If the instruction cannot be applied, return null with an explanation.

Respond with JSON in this exact format:
{
  "result": <the transformed value>,
  "success": true or false,
  "explanation": "optional explanation if transformation failed or needs clarification"
}`;
}

/**
 * Prompt template for validating promise results
 */
export function createValidateResultPrompt(
  value: unknown,
  rules: string[]
): string {
  return `Validate the following value against the semantic rules.

Value:
${JSON.stringify(value, null, 2)}

Rules to validate:
${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

Check each rule and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "violations": ["array of rule violations, empty if valid"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for determining if fallback should be used
 */
export function createShouldUseFallbackPrompt(
  error: Error,
  whenCondition: string
): string {
  return `Determine if the fallback should be used based on this error and condition.

Error:
Name: "${error.name}"
Message: "${error.message}"

Fallback Condition: "${whenCondition}"

Common fallback conditions include:
- "when user not found": 404 errors, missing records
- "when data unavailable": Empty responses, null results
- "when service down": Connection failures, timeouts
- "on any error": Any exception or failure

Respond with JSON in this exact format:
{
  "useFallback": true or false,
  "reason": "brief explanation"
}`;
}

/**
 * Prompt template for inferring what a promise operation does
 */
export function createInferOperationPrompt(
  description?: string,
  resolvedValue?: unknown
): string {
  let prompt = `Infer what type of operation this promise represents.`;

  if (description) {
    prompt += `\n\nOperation Description: "${description}"`;
  }

  if (resolvedValue !== undefined) {
    prompt += `\n\nResolved Value Type: ${typeof resolvedValue}`;
    if (typeof resolvedValue === 'object' && resolvedValue !== null) {
      prompt += `\nValue Preview: ${JSON.stringify(resolvedValue, null, 2).slice(0, 500)}`;
    }
  }

  prompt += `

Infer:
- The type of operation (api-call, database-query, file-operation, computation, etc.)
- The resource being operated on (user, product, file, etc.)
- The action being performed (read, write, update, delete, etc.)

Respond with JSON in this exact format:
{
  "operation": "type of operation",
  "resource": "resource type or null",
  "action": "action type or null"
}`;

  return prompt;
}

/**
 * Prompt template for generating logging messages
 */
export function createLoggingMessagePrompt(
  phase: 'start' | 'complete' | 'error',
  description?: string,
  elapsed?: number,
  error?: Error
): string {
  let prompt = `Generate a concise logging message for a promise operation.

Phase: ${phase}`;

  if (description) {
    prompt += `\nOperation: "${description}"`;
  }

  if (elapsed !== undefined) {
    prompt += `\nElapsed Time: ${elapsed}ms`;
  }

  if (error) {
    prompt += `\nError: "${error.message}"`;
  }

  prompt += `

Generate a brief, informative log message appropriate for this phase.

Respond with JSON in this exact format:
{
  "message": "the log message"
}`;

  return prompt;
}
