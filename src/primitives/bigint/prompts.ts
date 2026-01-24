/**
 * Prompts for SemanticBigInt LLM operations
 * These prompts are used to interpret, analyze, and describe large integers
 */

/**
 * System prompt for BigInt interpretation and analysis tasks
 */
export const BIGINT_SYSTEM_PROMPT = `You are a semantic BigInt interpreter. Your task is to analyze large integers, understand their context, and provide meaningful interpretations.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Interpret natural language representations of large numbers (billions, trillions, scientific notation)
- Recognize common BigInt domains: timestamps, database IDs, cryptocurrency amounts, cryptographic values
- Provide confidence scores from 0.0 to 1.0 based on clarity and certainty
- Consider the magnitude and context when making domain inferences
- Use appropriate scale names: thousand, million, billion, trillion, quadrillion, etc.`;

/**
 * Prompt template for parsing natural language to BigInt
 */
export function createFromPrompt(input: string): string {
  return `Parse the following input into a BigInt value.

Input: "${input}"

Consider:
- Natural language forms: "1 trillion", "five billion", "2.5 million"
- Scientific notation: "10^18", "5.2e15", "1E12"
- Abbreviated forms: "1T", "500B", "2.5M"
- Decimal forms with large values (truncate to integer)

Respond with JSON in this exact format:
{
  "value": "string representation of the bigint (no 'n' suffix)",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  value1: string,
  value2: string,
  tolerance: 'exact' | 'approximate'
): string {
  return `Compare these two BigInt values and determine if they are semantically equivalent.

Value 1: ${value1}
Value 2: ${value2}
Tolerance: ${tolerance}

${tolerance === 'approximate' ? `For approximate comparison, consider values within the same order of magnitude (within 10%) as equivalent for very large numbers.` : `For exact comparison, values must be identical.`}

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for domain reasonableness validation
 */
export function createIsReasonablePrompt(
  value: string,
  domain: string
): string {
  return `Evaluate if this BigInt value is reasonable for the given domain.

Value: ${value}
Domain: "${domain}"

Consider domain-specific constraints:
- database-id: typically positive, within reasonable ID ranges
- unix-timestamp: within valid date range (1970 to ~2100)
- unix-timestamp-ms: millisecond timestamps (multiply above by 1000)
- cryptocurrency-amount: typically positive, within circulation limits
- file-size: positive, within reasonable storage limits
- memory-address: positive, within memory range
- cryptographic-value: large positive integers

Respond with JSON in this exact format:
{
  "reasonable": true or false,
  "explanation": "brief explanation of why"
}`;
}

/**
 * Prompt template for human-readable formatting
 */
export function createFormatPrompt(
  value: string,
  style: 'words' | 'compact' | 'scientific' | 'full',
  locale?: string
): string {
  return `Format this BigInt value in a human-readable way.

Value: ${value}
Style: ${style}
${locale ? `Locale: ${locale}` : ''}

Formatting guidelines:
- "words": Use word forms like "1.23 trillion", "500 million"
- "compact": Use abbreviations like "1.23T", "500M", "2.5K"
- "scientific": Use scientific notation like "1.23 × 10^12"
- "full": Full number with thousands separators like "1,234,567,890,123"

Respond with JSON in this exact format:
{
  "formatted": "the formatted string"
}`;
}

/**
 * Prompt template for describing magnitude with context
 */
export function createDescribePrompt(
  value: string,
  context?: string
): string {
  return `Provide a human-friendly description of this BigInt's magnitude.

Value: ${value}
${context ? `Context: "${context}"` : ''}

Include:
- A readable representation of the number
- A relatable real-world comparison when possible
${context ? `- Context-specific comparisons if relevant to "${context}"` : ''}

Respond with JSON in this exact format:
{
  "description": "human-friendly description with comparison"
}`;
}

/**
 * Prompt template for domain inference
 */
export function createInferDomainPrompt(value: string): string {
  return `Analyze this BigInt value and infer what domain or type it likely represents.

Value: ${value}

Common domains to consider:
- unix-timestamp: seconds since 1970 (10 digits, ~1.7 billion range)
- unix-timestamp-ms: milliseconds since 1970 (13 digits)
- database-id: auto-incrementing identifiers
- cryptocurrency-amount: satoshis, wei, or other smallest units
- file-size-bytes: storage sizes
- memory-address: pointer values
- cryptographic-hash: large random-looking values
- arbitrary-precision: general large integer computation

Respond with JSON in this exact format:
{
  "domain": "most likely domain",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for pattern matching
 */
export function createMatchesPatternPrompt(
  value: string,
  pattern: string
): string {
  return `Check if this BigInt value matches the specified mathematical pattern.

Value: ${value}
Pattern: "${pattern}"

Common patterns:
- "power-of-two": Value is 2^n for some non-negative integer n
- "prime": Value is a prime number (only divisible by 1 and itself)
- "perfect-square": Value is n^2 for some integer n
- "factorial": Value is n! for some positive integer n
- "fibonacci": Value appears in the Fibonacci sequence
- "even": Value is divisible by 2
- "odd": Value is not divisible by 2

For computational patterns, you can use heuristics for very large numbers.

Respond with JSON in this exact format:
{
  "matches": true or false,
  "confidence": 0.0 to 1.0
}`;
}
