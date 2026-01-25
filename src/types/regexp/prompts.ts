/**
 * Prompts for SemanticRegExp LLM operations
 * These prompts enable semantic understanding and manipulation of regular expressions
 */

/**
 * System prompt for regex semantic operations
 */
export const REGEXP_SYSTEM_PROMPT = `You are an expert regular expression analyzer and generator. Your task is to help users understand, create, and improve regular expressions.

You must respond with valid JSON only, no additional text, markdown formatting, or code blocks.

Guidelines:
- Provide accurate regex patterns that work in JavaScript/TypeScript
- Consider edge cases and common variations
- Be precise about what patterns match and don't match
- Provide confidence scores from 0.0 to 1.0
- When generating regex, prefer readability over cleverness when possible`;

/**
 * Prompt for creating regex from natural language description
 */
export function createFromPrompt(
  description: string,
  options?: { flags?: string; strict?: boolean }
): string {
  const flags = options?.flags ?? '';
  const strict = options?.strict ?? false;

  return `Create a JavaScript regular expression that matches: "${description}"

Options:
- Flags to include: ${flags || 'none specified (use appropriate defaults)'}
- Strict matching: ${strict} (if true, be more restrictive; if false, be more permissive)

Consider:
- Common variations and edge cases
- International characters if applicable
- Practical real-world usage

Respond with JSON in this exact format:
{
  "pattern": "the regex pattern without delimiters",
  "flags": "flags to use (e.g., 'gi')",
  "confidence": 0.0 to 1.0,
  "notes": "optional notes about limitations or assumptions"
}`;
}

/**
 * Prompt for semantic equality comparison between regexes
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
Regex 2: /${pattern2}/${flags2}

Determine if they match the same set of strings (or nearly the same set).`;

  if (testStrings && testStrings.length > 0) {
    prompt += `\n\nTest against these sample strings:\n${testStrings.map((s) => `- "${s}"`).join('\n')}`;
  }

  prompt += `

Consider:
- Whether they match the same strings in practice
- Differences in flags (case sensitivity, global, multiline)
- Edge cases where behavior might differ

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0,
  "differences": ["list of differences if not equivalent"],
  "note": "optional explanation"
}`;

  return prompt;
}

/**
 * Prompt for explaining what a regex matches
 */
export function createExplainPrompt(pattern: string, flags: string): string {
  return `Explain what this regular expression matches in plain, human-readable language.

Regex: /${pattern}/${flags}

Provide a clear explanation that:
- Describes the overall purpose of the regex
- Breaks down each component if complex
- Gives examples of what it matches
- Notes any important flags being used

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation of what this regex matches",
  "examples": ["example1", "example2", "example3"],
  "components": [
    {"part": "regex component", "meaning": "what it matches"}
  ]
}`;
}

/**
 * Prompt for testing a string with explanation
 */
export function createTestWithExplanationPrompt(
  pattern: string,
  flags: string,
  input: string
): string {
  return `Test if the following string matches the regex and explain why.

Regex: /${pattern}/${flags}
Input: "${input}"

Analyze:
- Whether the string matches or not
- Why it matches or doesn't match
- Which part of the string matches (if any)

Respond with JSON in this exact format:
{
  "matches": true or false,
  "reason": "Explanation of why it matches or doesn't match",
  "matchedPart": "the part that matched (if any, otherwise omit)"
}`;
}

/**
 * Prompt for suggesting regex improvements
 */
export function createSuggestImprovementsPrompt(
  pattern: string,
  flags: string
): string {
  return `Analyze this regular expression and suggest improvements.

Regex: /${pattern}/${flags}

Consider:
- Performance optimizations
- Readability improvements
- Edge case handling
- Common issues (greedy vs lazy quantifiers, anchoring, etc.)
- Security concerns (ReDoS vulnerabilities)

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "suggestion": "What to improve",
      "reason": "Why this improvement helps",
      "improved": "The improved regex pattern (optional)"
    }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating test cases
 */
export function createGenerateTestCasesPrompt(
  pattern: string,
  flags: string
): string {
  return `Generate comprehensive test cases for this regular expression.

Regex: /${pattern}/${flags}

Generate:
- Strings that should match (valid inputs)
- Strings that should NOT match (invalid inputs)
- Edge cases and boundary conditions

Respond with JSON in this exact format:
{
  "shouldMatch": ["string1", "string2", "string3"],
  "shouldNotMatch": ["invalid1", "invalid2", "invalid3"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating regex for issues
 */
export function createValidatePrompt(pattern: string, flags: string): string {
  return `Validate this regular expression for common issues and potential problems.

Regex: /${pattern}/${flags}

Check for:
- Syntax errors or invalid patterns
- Performance issues (catastrophic backtracking, ReDoS)
- Logical errors or unintended matches
- Missing anchors or boundaries
- Overly permissive or restrictive patterns
- Flag-related issues

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["critical issue 1", "critical issue 2"],
  "warnings": ["warning 1", "warning 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for converting regex to readable format
 */
export function createToReadablePrompt(pattern: string, flags: string): string {
  return `Convert this regular expression to a more human-readable format.

Regex: /${pattern}/${flags}

Create a readable representation that:
- Uses descriptive labels for parts
- Shows the structure clearly
- Is easy to understand at a glance

Respond with JSON in this exact format:
{
  "readable": "human-readable representation",
  "breakdown": ["step 1", "step 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting related patterns
 */
export function createSuggestRelatedPrompt(
  pattern: string,
  flags: string
): string {
  return `Suggest related patterns that might also be useful based on this regex.

Regex: /${pattern}/${flags}

Consider:
- Related data types often used together
- Variations of this pattern
- Complementary patterns

Respond with JSON in this exact format:
{
  "related": [
    {
      "pattern": "Name of the related pattern (e.g., 'phone number')",
      "reason": "Why this might be needed",
      "regex": "The actual regex pattern (optional)"
    }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring data type matched by regex
 */
export function createInferDataTypePrompt(
  pattern: string,
  flags: string
): string {
  return `Analyze this regular expression and infer what type of data it's designed to match.

Regex: /${pattern}/${flags}

Consider:
- Common data formats (email, phone, URL, date, etc.)
- Domain-specific patterns
- General categories (identifier, number, text format)

Respond with JSON in this exact format:
{
  "type": "inferred data type (e.g., 'email', 'phone-us', 'uuid', 'custom-id')",
  "confidence": 0.0 to 1.0,
  "category": "broader category if applicable"
}`;
}

/**
 * Prompt for simplifying regex
 */
export function createSimplifyPrompt(pattern: string, flags: string): string {
  return `Analyze this regular expression and simplify it if possible.

Regex: /${pattern}/${flags}

Consider:
- Using character class shortcuts (\\d, \\w, \\s)
- Using quantifiers instead of repetition
- Removing redundant groups or escapes
- Consolidating character classes

If the regex cannot be meaningfully simplified, indicate that.

Respond with JSON in this exact format:
{
  "canSimplify": true or false,
  "simplified": "simplified pattern (if applicable)",
  "simplifiedFlags": "flags for simplified version",
  "explanation": "What was simplified and why",
  "confidence": 0.0 to 1.0
}`;
}
