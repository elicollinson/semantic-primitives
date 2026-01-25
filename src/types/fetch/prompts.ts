/**
 * Prompts for SemanticFetch LLM operations
 * These prompts are used for semantic Request, Response, and Headers operations
 */

// =============================================================================
// SEMANTIC REQUEST PROMPTS
// =============================================================================

/**
 * System prompt for semantic request equality comparison
 */
export const REQUEST_SEMANTIC_EQUALS_SYSTEM = `You are an HTTP request comparison assistant. Your task is to determine if two requests are semantically equivalent.

Consider these factors when comparing:
- HTTP method differences (case-insensitive)
- URL path differences (query parameter order, trailing slashes)
- Header differences (case-insensitive keys, common defaults)
- Body content differences (JSON key order, whitespace)
- Authentication mechanisms

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic request equality
 */
export function requestSemanticEqualsPrompt(
  req1: { method: string; url: string; headers: Record<string, string>; body?: string },
  req2: { method: string; url: string; headers: Record<string, string>; body?: string }
): string {
  return `Compare these two HTTP requests for semantic equivalence.

Request 1:
Method: ${req1.method}
URL: ${req1.url}
Headers: ${JSON.stringify(req1.headers)}
${req1.body ? `Body: ${req1.body}` : 'Body: (none)'}

Request 2:
Method: ${req2.method}
URL: ${req2.url}
Headers: ${JSON.stringify(req2.headers)}
${req2.body ? `Body: ${req2.body}` : 'Body: (none)'}

Respond with JSON in this exact format:
{"equivalent": <boolean>, "note": "<explanation if needed>", "confidence": <0-1>}`;
}

/**
 * System prompt for request intent analysis
 */
export const ANALYZE_INTENT_SYSTEM = `You are an HTTP request analyzer. Your task is to understand the intent behind HTTP requests.

Consider:
- HTTP method semantics (GET=read, POST=create, PUT/PATCH=update, DELETE=delete)
- URL path patterns for resource identification
- Query parameters for filtering/pagination
- Request body for data payloads

Always respond with valid JSON only.`;

/**
 * User prompt template for intent analysis
 */
export function analyzeIntentPrompt(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): string {
  return `Analyze the intent of this HTTP request.

Method: ${method}
URL: ${url}
Headers: ${JSON.stringify(headers)}
${body ? `Body: ${body}` : 'Body: (none)'}

Respond with JSON in this exact format:
{"intent": "<human-readable intent>", "operation": "<CREATE|READ|UPDATE|DELETE>", "resource": "<resource being accessed>", "filters": [{"field": "<field>", "value": "<value>"}]}

Only include filters if query parameters or body contains filtering criteria.`;
}

/**
 * System prompt for request validation
 */
export const REQUEST_VALIDATE_SYSTEM = `You are an HTTP request validator. Your task is to validate requests against semantic rules.

Common validation rules to consider:
- Authentication headers present when required
- Content-Type matches body format
- Required headers for specific operations
- Valid JSON body structure
- Appropriate HTTP method for operation

Always respond with valid JSON only.`;

/**
 * User prompt template for request validation
 */
export function requestValidatePrompt(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string | undefined,
  rules: string[]
): string {
  return `Validate this HTTP request against the provided rules.

Method: ${method}
URL: ${url}
Headers: ${JSON.stringify(headers)}
${body ? `Body: ${body}` : 'Body: (none)'}

Validation Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [<list of issues found>]}`;
}

/**
 * System prompt for request explanation
 */
export const REQUEST_EXPLAIN_SYSTEM = `You are an HTTP request explainer. Your task is to explain HTTP requests in human-readable terms.

Adjust your explanation based on the target audience:
- technical: Use proper HTTP terminology, mention headers, methods, etc.
- non-technical: Focus on the action being performed in plain language

Always respond with valid JSON only.`;

/**
 * User prompt template for request explanation
 */
export function requestExplainPrompt(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string | undefined,
  audience: 'technical' | 'non-technical'
): string {
  return `Explain what this HTTP request does for a ${audience} audience.

Method: ${method}
URL: ${url}
Headers: ${JSON.stringify(headers)}
${body ? `Body: ${body}` : 'Body: (none)'}

Respond with JSON in this exact format:
{"explanation": "<human-readable explanation>"}`;
}

/**
 * System prompt for request security validation
 */
export const REQUEST_SECURITY_SYSTEM = `You are an HTTP security analyst. Your task is to assess the security of HTTP requests.

Check for:
- Use of HTTPS vs HTTP
- Sensitive data in URLs (passwords, tokens in query strings)
- Missing authentication headers for sensitive operations
- CORS-related headers
- Content security issues
- Injection vulnerabilities in parameters

Severity levels:
- Issues: Critical security problems that should be fixed
- Warnings: Potential concerns that should be reviewed

Always respond with valid JSON only.`;

/**
 * User prompt template for security validation
 */
export function requestSecurityPrompt(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): string {
  return `Assess the security of this HTTP request.

Method: ${method}
URL: ${url}
Headers: ${JSON.stringify(headers)}
${body ? `Body: ${body}` : 'Body: (none)'}

Respond with JSON in this exact format:
{"safe": <boolean>, "issues": [<list of security issues>], "warnings": [<list of warnings>]}`;
}

// =============================================================================
// SEMANTIC RESPONSE PROMPTS
// =============================================================================

/**
 * System prompt for semantic response equality comparison
 */
export const RESPONSE_SEMANTIC_EQUALS_SYSTEM = `You are an HTTP response comparison assistant. Your task is to determine if two responses are semantically equivalent.

Consider these factors when comparing:
- Status code equivalence (e.g., 200 and 201 may be equivalent for success)
- Header differences (ignore timestamps, request IDs)
- Body content differences (JSON key order, formatting)
- Semantic meaning of the data

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic response equality
 */
export function responseSemanticEqualsPrompt(
  resp1: { status: number; headers: Record<string, string>; body: string },
  resp2: { status: number; headers: Record<string, string>; body: string }
): string {
  return `Compare these two HTTP responses for semantic equivalence.

Response 1:
Status: ${resp1.status}
Headers: ${JSON.stringify(resp1.headers)}
Body: ${resp1.body}

Response 2:
Status: ${resp2.status}
Headers: ${JSON.stringify(resp2.headers)}
Body: ${resp2.body}

Respond with JSON in this exact format:
{"equivalent": <boolean>, "confidence": <0-1>}`;
}

/**
 * System prompt for response analysis
 */
export const ANALYZE_RESPONSE_SYSTEM = `You are an HTTP response analyzer. Your task is to analyze the content and structure of HTTP responses.

Identify:
- Data type (single object, collection/array, primitive, error)
- Entity type (User, Product, Order, etc.)
- Count of items (for collections)
- Pagination indicators (hasMore, nextPage, total)

Always respond with valid JSON only.`;

/**
 * User prompt template for response analysis
 */
export function analyzeResponsePrompt(
  status: number,
  headers: Record<string, string>,
  body: string
): string {
  return `Analyze this HTTP response.

Status: ${status}
Headers: ${JSON.stringify(headers)}
Body: ${body}

Respond with JSON in this exact format:
{"dataType": "<single|collection|error|empty>", "entityType": "<type if identifiable>", "count": <number if collection>, "pagination": {"hasMore": <boolean>}}

Only include fields that are clearly determinable from the response.`;
}

/**
 * System prompt for response summarization
 */
export const SUMMARIZE_RESPONSE_SYSTEM = `You are an HTTP response summarizer. Your task is to provide a concise, human-readable summary of HTTP response content.

Focus on:
- What data is being returned
- Key information in the response
- Status and success/failure indication
- Relevant metadata

Always respond with valid JSON only.`;

/**
 * User prompt template for response summarization
 */
export function summarizeResponsePrompt(
  status: number,
  headers: Record<string, string>,
  body: string
): string {
  return `Summarize this HTTP response in a concise, human-readable format.

Status: ${status}
Headers: ${JSON.stringify(headers)}
Body: ${body}

Respond with JSON in this exact format:
{"summary": "<concise summary of the response>"}`;
}

/**
 * System prompt for contract validation
 */
export const VALIDATE_CONTRACT_SYSTEM = `You are an API contract validator. Your task is to validate HTTP responses against expected contracts.

Check:
- Status codes match expected values
- Required headers are present
- Body structure matches schema description
- Data types are correct

Always respond with valid JSON only.`;

/**
 * User prompt template for contract validation
 */
export function validateContractPrompt(
  status: number,
  headers: Record<string, string>,
  body: string,
  contract: { status?: number[]; schema?: string; requiredHeaders?: string[] }
): string {
  return `Validate this HTTP response against the expected contract.

Response:
Status: ${status}
Headers: ${JSON.stringify(headers)}
Body: ${body}

Expected Contract:
${contract.status ? `- Allowed status codes: ${contract.status.join(', ')}` : ''}
${contract.schema ? `- Expected schema: ${contract.schema}` : ''}
${contract.requiredHeaders ? `- Required headers: ${contract.requiredHeaders.join(', ')}` : ''}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [<list of contract violations>]}`;
}

/**
 * System prompt for error interpretation
 */
export const INTERPRET_ERROR_SYSTEM = `You are an HTTP error interpreter. Your task is to interpret error responses and provide actionable guidance.

Consider:
- HTTP status code meaning
- Error message in body
- Common error patterns
- Potential causes and solutions

Error categories:
- authentication: Auth/permission issues
- validation: Invalid input/parameters
- not_found: Resource doesn't exist
- rate_limit: Too many requests
- server_error: Server-side issues
- network: Connection issues

Always respond with valid JSON only.`;

/**
 * User prompt template for error interpretation
 */
export function interpretErrorPrompt(
  status: number,
  headers: Record<string, string>,
  body: string
): string {
  return `Interpret this error response and provide guidance.

Status: ${status}
Headers: ${JSON.stringify(headers)}
Body: ${body}

Respond with JSON in this exact format:
{"category": "<error category>", "message": "<human-readable error message>", "suggestedAction": "<what the user should do>", "retryable": <boolean>}`;
}

// =============================================================================
// SEMANTIC HEADERS PROMPTS
// =============================================================================

/**
 * System prompt for semantic headers equality comparison
 */
export const HEADERS_SEMANTIC_EQUALS_SYSTEM = `You are an HTTP headers comparison assistant. Your task is to determine if two sets of headers are semantically equivalent.

Consider:
- Header names are case-insensitive
- Common default values
- Order doesn't matter
- Timestamps and request IDs may differ
- Some headers are semantically equivalent (e.g., different cache directives)

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic headers equality
 */
export function headersSemanticEqualsPrompt(
  headers1: Record<string, string>,
  headers2: Record<string, string>
): string {
  return `Compare these two sets of HTTP headers for semantic equivalence.

Headers 1: ${JSON.stringify(headers1)}
Headers 2: ${JSON.stringify(headers2)}

Respond with JSON in this exact format:
{"equivalent": <boolean>, "differences": [<list of meaningful differences>]}`;
}

/**
 * System prompt for headers validation
 */
export const HEADERS_VALIDATE_SYSTEM = `You are an HTTP headers validator. Your task is to validate headers for common issues.

Check for:
- Invalid or malformed header values
- Conflicting headers
- Security issues (missing security headers)
- Content-Type mismatches
- Deprecated headers
- Missing required headers for certain operations

Always respond with valid JSON only.`;

/**
 * User prompt template for headers validation
 */
export function headersValidatePrompt(headers: Record<string, string>): string {
  return `Validate these HTTP headers for common issues.

Headers: ${JSON.stringify(headers)}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [{"header": "<header name>", "issue": "<description of issue>"}]}`;
}

/**
 * System prompt for headers suggestions
 */
export const HEADERS_SUGGEST_SYSTEM = `You are an HTTP headers advisor. Your task is to suggest missing or recommended headers based on context.

Consider suggesting:
- Security headers (Content-Security-Policy, X-Frame-Options, etc.)
- Caching headers (Cache-Control, ETag)
- Content negotiation headers
- CORS headers if needed
- Authentication headers
- Compression headers

Always respond with valid JSON only.`;

/**
 * User prompt template for headers suggestions
 */
export function headersSuggestPrompt(
  headers: Record<string, string>,
  context?: string
): string {
  return `Suggest missing or recommended headers for this request/response.

Current Headers: ${JSON.stringify(headers)}
${context ? `Context: ${context}` : ''}

Respond with JSON in this exact format:
{"suggestions": [{"header": "<header name>", "value": "<suggested value>", "reason": "<why this header is recommended>"}]}`;
}

/**
 * System prompt for headers explanation
 */
export const HEADERS_EXPLAIN_SYSTEM = `You are an HTTP headers explainer. Your task is to explain what a set of headers does in plain language.

Cover:
- Purpose of each significant header
- How they affect the request/response
- Security implications
- Caching behavior
- Content handling

Always respond with valid JSON only.`;

/**
 * User prompt template for headers explanation
 */
export function headersExplainPrompt(headers: Record<string, string>): string {
  return `Explain what these HTTP headers do.

Headers: ${JSON.stringify(headers)}

Respond with JSON in this exact format:
{"explanation": "<human-readable explanation of what these headers do>"}`;
}
