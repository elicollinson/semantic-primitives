/**
 * Prompts for SemanticURL LLM operations
 * These prompts enable semantic operations on URLs
 */

/**
 * System prompt for URL semantic operations
 */
export const URL_SYSTEM_PROMPT = `You are a semantic URL analyzer. Your task is to analyze URLs to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Understand URL structure and components
- Recognize common URL patterns (APIs, websites, resources)
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for parsing URL from flexible input
 */
export function createFromInputPrompt(input: string, base?: string): string {
  let prompt = `Parse this input as a URL, handling various formats.

Input: "${input}"`;

  if (base) {
    prompt += `\nBase URL: "${base}"`;
  }

  prompt += `

Handle cases like:
- Missing protocol (add https://)
- Relative paths with base URL
- Incomplete URLs

Respond with JSON in this exact format:
{
  "url": "the complete, valid URL",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(url1: string, url2: string): string {
  return `Compare these two URLs for semantic equivalence.

URL 1: "${url1}"
URL 2: "${url2}"

Consider:
- Trailing slashes
- Default ports (80 for http, 443 for https)
- www prefix
- Case sensitivity
- Query parameter order

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "differences": ["difference 1", "difference 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for URL classification
 */
export function createClassifyPrompt(url: string): string {
  return `Classify this URL by type and purpose.

URL: "${url}"

Determine:
- Type (e.g., "api-endpoint", "webpage", "image", "download", "social-media")
- Category (e.g., "rest-api", "graphql", "static-asset")
- Resource being accessed (if applicable)
- Action being performed (e.g., "list", "create", "read")

Respond with JSON in this exact format:
{
  "type": "url type",
  "category": "category or null",
  "resource": "resource name or null",
  "action": "action or null",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating URL for a purpose
 */
export function createValidateForPrompt(url: string, purpose: string): string {
  return `Validate this URL for the specified purpose.

URL: "${url}"
Purpose: "${purpose}"

Check if the URL is appropriate and valid for the stated purpose.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "reason": "reason if invalid or null",
  "warnings": ["warning 1", "warning 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for explaining the URL
 */
export function createExplainPrompt(url: string): string {
  return `Explain what this URL points to.

URL: "${url}"

Provide a human-readable description of:
- What resource or service this URL accesses
- Any identifiable patterns (API endpoints, user profiles, etc.)
- The likely purpose

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for extracting information
 */
export function createExtractInfoPrompt(url: string): string {
  return `Extract semantic information from this URL.

URL: "${url}"

Identify:
- Service or platform
- Resource type
- Identifiers (user IDs, product IDs, etc.)
- Any other meaningful components

Respond with JSON in this exact format:
{
  "info": {
    "service": "service name or null",
    "resourceType": "resource type or null",
    "identifier": "main identifier or null",
    ...other relevant fields
  },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for safety assessment
 */
export function createIsSafePrompt(url: string): string {
  return `Assess the safety of this URL.

URL: "${url}"

Check for:
- Known suspicious patterns
- Potential phishing indicators
- Unsafe protocols
- Unusual structure

Respond with JSON in this exact format:
{
  "safe": true or false,
  "reason": "reason if unsafe or null",
  "severity": "low" | "medium" | "high" or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for canonical form
 */
export function createCanonicalPrompt(url: string): string {
  return `Determine the canonical form of this URL.

URL: "${url}"

Normalize:
- Protocol to https (if applicable)
- Remove default ports
- Lowercase hostname
- Remove trailing slash (unless root)
- Sort query parameters

Respond with JSON in this exact format:
{
  "canonical": "the canonical URL",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating URL variations
 */
export function createVariationsPrompt(url: string): string {
  return `Generate common variations of this URL.

URL: "${url}"

Include variations like:
- With/without www
- HTTP and HTTPS
- With/without trailing slash

Respond with JSON in this exact format:
{
  "variations": ["url1", "url2", ...],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for parsing query parameters
 */
export function createParseQueryPrompt(url: string): string {
  return `Parse and explain the query parameters in this URL.

URL: "${url}"

For each parameter, determine:
- Its value
- Its likely meaning or purpose

Respond with JSON in this exact format:
{
  "parameters": {
    "param1": { "value": "value1", "meaning": "what it represents" },
    ...
  },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting related URLs
 */
export function createSuggestRelatedPrompt(url: string): string {
  return `Suggest related URLs based on patterns.

URL: "${url}"

Based on common API patterns and URL structures, suggest related URLs.

Respond with JSON in this exact format:
{
  "suggestions": [
    { "url": "related URL or path", "reason": "why it's related" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for pattern matching
 */
export function createMatchesPrompt(url: string, pattern: string): string {
  return `Check if this URL matches the pattern description.

URL: "${url}"
Pattern: "${pattern}"

Determine if the URL matches the described pattern semantically.

Respond with JSON in this exact format:
{
  "matches": true or false,
  "confidence": 0.0 to 1.0
}`;
}
