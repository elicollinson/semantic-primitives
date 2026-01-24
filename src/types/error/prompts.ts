/**
 * Prompts for SemanticError LLM operations
 * These prompts enable intelligent error classification, explanation, and fix suggestions
 */

/**
 * System prompt for error analysis tasks
 */
export const ERROR_SYSTEM_PROMPT = `You are an expert error analyst and debugger. Your task is to analyze errors, classify them, suggest fixes, and provide helpful explanations.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze error messages, stack traces, and context to understand root causes
- Consider common error patterns in software development
- Provide actionable, specific suggestions for fixes
- Adjust explanations based on the target audience (developer, end-user, support)
- Be precise with confidence scores based on available information`;

/**
 * Prompt template for semantic equality comparison between errors
 */
export function createSemanticallyEqualsPrompt(
  error1Message: string,
  error1Stack: string | undefined,
  error2Message: string,
  error2Stack: string | undefined
): string {
  return `Compare these two errors and determine if they represent the same root cause, even if their messages differ.

Error 1:
Message: "${error1Message}"
${error1Stack ? `Stack: ${error1Stack}` : ''}

Error 2:
Message: "${error2Message}"
${error2Stack ? `Stack: ${error2Stack}` : ''}

Consider:
- Same underlying cause despite different wording
- Similar error types or categories
- Matching patterns in stack traces

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "reason": "explanation of why they are or aren't equivalent",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for error classification
 */
export function createClassifyPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  context?: Record<string, unknown>
): string {
  let prompt = `Classify this error into a category and assess its severity.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Categories to consider:
- network: Connection, timeout, DNS, SSL/TLS issues
- database: Query, connection pool, constraint, transaction issues
- authentication: Login, token, session, permission issues
- validation: Input, format, type, constraint issues
- resource: Memory, disk, CPU, file handle issues
- configuration: Missing/invalid config, environment issues
- runtime: Type errors, null reference, undefined issues
- system: OS, file system, process issues
- external: Third-party service, API issues

Respond with JSON in this exact format:
{
  "category": "main category",
  "subcategory": "specific subcategory or null",
  "severity": "critical" | "recoverable" | "warning",
  "retryable": true or false
}`;

  return prompt;
}

/**
 * Prompt template for generating human-readable explanations
 */
export function createExplainPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  audience: 'end-user' | 'developer' | 'support'
): string {
  const audienceGuidelines = {
    'end-user':
      'Use simple, non-technical language. Focus on what the user can do to resolve the issue. Avoid technical jargon.',
    developer:
      'Include technical details, relevant code locations, and debugging hints. Reference specific error codes and stack trace information.',
    support:
      'Balance technical accuracy with clarity. Include information needed for troubleshooting and escalation.',
  };

  return `Explain this error for a ${audience} audience.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}

Guidelines for ${audience}: ${audienceGuidelines[audience]}

Respond with a plain text explanation (not JSON), written as a single paragraph or short set of sentences appropriate for the ${audience}.`;
}

/**
 * Prompt template for suggesting fixes
 */
export function createSuggestFixesPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  context?: Record<string, unknown>
): string {
  let prompt = `Suggest fixes for this error, ordered by likelihood of success.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Provide actionable, specific suggestions. Include code snippets when applicable.

Respond with JSON in this exact format:
{
  "fixes": [
    {
      "fix": "description of the fix",
      "confidence": 0.0 to 1.0,
      "code": "optional code snippet or null"
    }
  ]
}`;

  return prompt;
}

/**
 * Prompt template for inferring root cause
 */
export function createInferRootCausePrompt(
  errorMessage: string,
  errorStack: string | undefined,
  context?: Record<string, unknown>
): string {
  let prompt = `Analyze this error and infer its root cause.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Look beyond the immediate error to identify the underlying issue that caused it.

Respond with JSON in this exact format:
{
  "cause": "description of the root cause",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt template for pattern matching
 */
export function createMatchesPatternPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  pattern: string
): string {
  return `Determine if this error matches the pattern "${pattern}".

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}

Pattern to match: "${pattern}"

Common patterns include:
- network-related: Any network, connection, or communication issues
- authentication-failure: Login, auth, permission, or access denied issues
- timeout: Any timeout or time limit exceeded issues
- not-found: Resource, file, or entity not found issues
- invalid-input: Validation, format, or input issues
- database-error: Any database-related issues
- memory-error: Out of memory, heap, or allocation issues

Respond with JSON in this exact format:
{
  "matches": true or false
}`;
}

/**
 * Prompt template for getting resources
 */
export function createGetResourcesPrompt(
  errorMessage: string,
  errorStack: string | undefined
): string {
  return `Suggest documentation and resources that could help resolve this error.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}

Suggest types of resources that would be helpful (documentation pages, troubleshooting guides, etc.).

Respond with JSON in this exact format:
{
  "resources": [
    {
      "title": "resource title",
      "type": "docs" | "troubleshooting" | "forum" | "tutorial" | "api-reference"
    }
  ]
}`;
}

/**
 * Prompt template for determining if error should be reported
 */
export function createShouldReportPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  context?: Record<string, unknown>
): string {
  let prompt = `Determine if this error should be reported/logged for further investigation.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Consider:
- Is this an unexpected error or a handled case?
- Does it indicate a bug or system issue?
- Is it likely to recur or affect other users?
- Is it actionable for developers?

Respond with JSON in this exact format:
{
  "report": true or false,
  "reason": "explanation for the recommendation",
  "priority": "high" | "medium" | "low" | null
}`;

  return prompt;
}

/**
 * Prompt template for determining recovery strategy
 */
export function createRecoveryStrategyPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  category?: string
): string {
  let prompt = `Determine the best recovery strategy for this error.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}`;

  if (category) {
    prompt += `\nError Category: ${category}`;
  }

  prompt += `

Recovery strategies:
- retry: The operation can be retried, possibly with backoff
- fallback: Use an alternative approach or default value
- abort: Stop the operation, cannot be recovered
- ignore: The error is non-critical and can be safely ignored

Respond with JSON in this exact format:
{
  "strategy": "retry" | "fallback" | "abort" | "ignore",
  "maxAttempts": number or null (for retry strategy),
  "backoff": "exponential" | "linear" | "constant" | null (for retry strategy)
}`;

  return prompt;
}

/**
 * Prompt template for getting severity level
 */
export function createGetSeverityPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  context?: Record<string, unknown>
): string {
  let prompt = `Assess the severity level of this error.

Error Message: "${errorMessage}"
${errorStack ? `Stack Trace: ${errorStack}` : ''}`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Severity levels:
- critical: System-breaking, data loss risk, requires immediate attention
- error: Significant issue affecting functionality, needs prompt resolution
- warning: Potential issue, degraded functionality, should be addressed
- info: Informational, expected in some scenarios, low priority

Respond with JSON in this exact format:
{
  "severity": "critical" | "error" | "warning" | "info"
}`;

  return prompt;
}
