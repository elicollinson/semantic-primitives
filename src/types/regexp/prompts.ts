/**
 * Prompts for SemanticRegExp LLM operations
 * These prompts enable semantic operations on regular expressions
 */

/**
 * System prompt for regexp semantic operations
 */
export const REGEXP_SYSTEM_PROMPT = `You are a semantic regular expression analyzer. Your task is to analyze regex patterns to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Understand regex syntax and patterns
- Consider common pattern use cases
- Provide confidence scores from 0.0 to 1.0
- Generate valid regex patterns when requested`;

/**
 * Prompt for creating regex from natural language
 */
export function createFromDescriptionPrompt(
  description: string,
  options?: { flags?: string; strict?: boolean }
): string {
  let prompt = `Create a regular expression from this natural language description.

Description: "${description}"`;

  if (options?.flags) {
    prompt += `\nFlags to include: ${options.flags}`;
  }
  if (options?.strict) {
    prompt += `\nStrict mode: true (require exact matches)`;
  }

  prompt += `

Generate a valid JavaScript regular expression pattern.

Respond with JSON in this exact format:
{
  "pattern": "the regex pattern without delimiters",
  "flags": "flags like 'gi'",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  pattern1: string,
  flags1: string,
  pattern2: string,
  flags2: string,
  testStrings?: string[]
): string {
  let prompt = `Compare these two regular expressions for semantic equivalence.

Regex 1: /${pattern1}/${flags1}
Regex 2: /${pattern2}/${flags2}`;

  if (testStrings && testStrings.length > 0) {
    prompt += `\n\nTest strings: ${JSON.stringify(testStrings)}`;
  }

  prompt += `

Determine if both regexes match the same patterns semantically.

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for explaining the regex
 */
export function createExplainPrompt(pattern: string, flags: string): string {
  return `Explain what this regular expression matches in plain language.

Regex: /${pattern}/${flags}

Provide a clear, human-readable explanation of:
- What patterns this regex matches
- Any notable characteristics or edge cases
- Example matches

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for testing with explanation
 */
export function createTestWithExplanationPrompt(
  pattern: string,
  flags: string,
  input: string
): string {
  return `Test this string against the regex and explain the result.

Regex: /${pattern}/${flags}
Input: "${input}"

Determine if the input matches and explain why or why not.

Respond with JSON in this exact format:
{
  "matches": true or false,
  "reason": "explanation of why it matched or didn't",
  "matchedPart": "the part that matched" or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting improvements
 */
export function createSuggestImprovementsPrompt(pattern: string, flags: string): string {
  return `Suggest improvements for this regular expression.

Regex: /${pattern}/${flags}

Consider:
- Clarity and readability
- Performance
- Edge case handling
- Common pitfalls

Respond with JSON in this exact format:
{
  "suggestions": [
    { "suggestion": "improvement description", "reason": "why this helps", "improved": "improved pattern" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating test cases
 */
export function createGenerateTestCasesPrompt(pattern: string, flags: string): string {
  return `Generate test cases for this regular expression.

Regex: /${pattern}/${flags}

Generate strings that should match and strings that should not match.

Respond with JSON in this exact format:
{
  "shouldMatch": ["string1", "string2", ...],
  "shouldNotMatch": ["string1", "string2", ...],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating the regex
 */
export function createValidatePrompt(pattern: string, flags: string): string {
  return `Validate this regular expression for common issues.

Regex: /${pattern}/${flags}

Check for:
- Syntax errors or issues
- Performance problems (catastrophic backtracking, etc.)
- Common regex pitfalls
- Best practice violations

Respond with JSON in this exact format:
{
  "valid": true or false,
  "warnings": ["warning 1", "warning 2"],
  "issues": ["issue 1", "issue 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for converting to readable format
 */
export function createToReadablePrompt(pattern: string, flags: string): string {
  return `Convert this regex to a more human-readable format.

Regex: /${pattern}/${flags}

Create a simplified representation that conveys what the regex matches.

Respond with JSON in this exact format:
{
  "readable": "human-readable representation",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting related patterns
 */
export function createSuggestRelatedPrompt(pattern: string, flags: string): string {
  return `Suggest related patterns that might be needed alongside this regex.

Regex: /${pattern}/${flags}

Based on common use cases, suggest other patterns that are often used together.

Respond with JSON in this exact format:
{
  "suggestions": [
    { "pattern": "pattern name or description", "reason": "why it's related", "regex": "the suggested regex pattern" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring data type
 */
export function createInferDataTypePrompt(pattern: string, flags: string): string {
  return `Infer what type of data this regex is designed to match.

Regex: /${pattern}/${flags}

Determine the semantic type of data this pattern is meant to validate or extract.

Respond with JSON in this exact format:
{
  "type": "inferred data type (e.g., 'email', 'phone', 'url', 'date')",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for simplifying the regex
 */
export function createSimplifyPrompt(pattern: string, flags: string): string {
  return `Simplify this regex if possible.

Regex: /${pattern}/${flags}

Look for opportunities to simplify the pattern while maintaining the same behavior.

Respond with JSON in this exact format:
{
  "canSimplify": true or false,
  "simplified": "simplified pattern" or null,
  "explanation": "what was simplified",
  "confidence": 0.0 to 1.0
}`;
}
