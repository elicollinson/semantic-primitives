/**
 * Prompts for SemanticBoolean LLM operations
 * These prompts are used to interpret and analyze boolean expressions
 */

/**
 * System prompt for boolean interpretation tasks
 */
export const BOOLEAN_SYSTEM_PROMPT = `You are a semantic boolean interpreter. Your task is to analyze natural language expressions and determine their boolean meaning.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Interpret affirmative expressions (yes, sure, absolutely, correct, right, indeed) as true
- Interpret negative expressions (no, nope, never, not at all, negative) as false
- Consider context and locale when interpreting culturally-specific expressions
- Provide confidence scores from 0.0 to 1.0 based on clarity of the expression
- Identify uncertainty when expressions are ambiguous (maybe, perhaps, it depends)`;

/**
 * Prompt template for parsing natural language to boolean
 */
export function createFromPrompt(input: string, locale?: string, context?: string): string {
  let prompt = `Interpret the following expression as a boolean value.

Expression: "${input}"`;

  if (locale) {
    prompt += `\nLocale: ${locale}`;
  }

  if (context) {
    prompt += `\nContext: ${context}`;
  }

  prompt += `

Respond with JSON in this exact format:
{
  "value": true or false,
  "confidence": 0.0 to 1.0,
  "category": "affirmative" | "negative" | "uncertain" | "conditional",
  "conditions": [] (array of condition strings if conditional)
}`;

  return prompt;
}

/**
 * Prompt template for inferring boolean from implication
 */
export function createFromImplicationPrompt(statement: string): string {
  return `Analyze the following statement and infer whether it implies a positive (true) or negative (false) outcome.

Statement: "${statement}"

Consider:
- Success/failure implications (passed/failed, succeeded/error)
- Presence/absence indicators (found/not found, exists/missing)
- Positive/negative states (healthy/unhealthy, active/inactive)

Respond with JSON in this exact format:
{
  "value": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  expression1: string,
  expression2: string
): string {
  return `Compare these two boolean expressions and determine if they are semantically equivalent (both mean the same yes/no response).

Expression 1: "${expression1}"
Expression 2: "${expression2}"

Consider synonyms, cultural variations, and emphasis levels.

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt template for strength comparison
 */
export function createCompareStrengthPrompt(
  expression1: string,
  expression2: string
): string {
  return `Compare the strength/emphasis of these two boolean expressions.

Expression 1: "${expression1}"
Expression 2: "${expression2}"

Consider:
- Weak affirmatives: "I guess so", "maybe yes", "if you insist"
- Strong affirmatives: "absolutely!", "definitely!", "100%"
- Weak negatives: "not really", "probably not", "I'd rather not"
- Strong negatives: "absolutely not!", "never!", "no way!"

Return a number from -1.0 to 1.0:
- Negative values mean Expression 1 is weaker than Expression 2
- Positive values mean Expression 1 is stronger than Expression 2
- 0 means they have equal strength

Respond with JSON in this exact format:
{
  "strengthDifference": -1.0 to 1.0
}`;
}

/**
 * Prompt template for extracting conditions
 */
export function createExtractConditionsPrompt(expression: string): string {
  return `Extract any conditions from this boolean expression.

Expression: "${expression}"

Identify any "if", "when", "unless", "provided that", "as long as" conditions that qualify the response.

Respond with JSON in this exact format:
{
  "isConditional": true or false,
  "conditions": ["condition 1", "condition 2", ...]
}`;
}
