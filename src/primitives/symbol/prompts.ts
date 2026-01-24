/**
 * Prompts for SemanticSymbol LLM operations
 * These prompts are used to analyze and understand symbol descriptions
 */

/**
 * System prompt for symbol interpretation tasks
 */
export const SYMBOL_SYSTEM_PROMPT = `You are a semantic symbol analyzer. Your task is to analyze symbol descriptions, naming conventions, and purposes.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze symbol descriptions for clarity and purpose
- Identify naming conventions (camelCase, snake_case, PascalCase, SCREAMING_SNAKE_CASE)
- Classify symbols by their semantic purpose (event, configuration, identifier, lifecycle, etc.)
- Evaluate appropriateness of symbols for given use cases
- Suggest better names when descriptions are unclear or violate conventions`;

/**
 * Prompt template for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  description1: string,
  description2: string
): string {
  return `Compare these two symbol descriptions and determine if they serve the same semantic purpose.

Symbol 1 description: "${description1}"
Symbol 2 description: "${description2}"

Consider:
- Do they represent the same concept?
- Are they variations of the same name (e.g., userId vs user_id)?
- Would they be used for the same purpose in code?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0,
  "note": "explanation of the comparison"
}`;
}

/**
 * Prompt template for suggesting a better name
 */
export function createSuggestBetterNamePrompt(description: string): string {
  return `Analyze this symbol description and suggest a better name if improvements are possible.

Symbol description: "${description}"

Consider:
- Naming conventions (prefer camelCase for most symbols)
- Avoid abbreviations unless universally understood
- Clarity and expressiveness
- Common programming conventions

If the name is already good or cannot be improved without more context, set suggestion to null.

Respond with JSON in this exact format:
{
  "suggestion": "betterName" or null,
  "reason": "explanation of why this suggestion is made or why no suggestion is possible"
}`;
}

/**
 * Prompt template for classifying a symbol
 */
export function createClassifyPrompt(description: string): string {
  return `Classify this symbol based on its description.

Symbol description: "${description}"

Categories to consider:
- "event": Events, callbacks, hooks (e.g., onUserLogin, onClick, afterInit)
- "configuration": Config keys, settings (e.g., API_KEY, databaseUrl, maxRetries)
- "identifier": Unique IDs, keys (e.g., userId, cacheKey, sessionToken)
- "lifecycle": Lifecycle stages (e.g., init, destroy, mount, unmount)
- "metadata": Metadata markers (e.g., Symbol.iterator, Symbol.toStringTag)
- "internal": Internal/private markers (e.g., _internal, __private)
- "constant": Constant values (e.g., MAX_SIZE, DEFAULT_TIMEOUT)
- "unknown": Cannot be determined

Subcategories are optional and provide more specific classification.

Respond with JSON in this exact format:
{
  "category": "category name",
  "subcategory": "subcategory name" or null
}`;
}

/**
 * Prompt template for validating a symbol description
 */
export function createValidatePrompt(
  description: string,
  conventions?: string[]
): string {
  let prompt = `Validate this symbol description against naming best practices.

Symbol description: "${description}"

Check for:
- Clear and descriptive naming
- Appropriate use of naming conventions (camelCase, PascalCase, snake_case)
- Avoidance of overly cryptic abbreviations
- Consistency with common programming conventions`;

  if (conventions && conventions.length > 0) {
    prompt += `\n\nAdditional conventions to check against:\n${conventions.map(c => `- ${c}`).join('\n')}`;
  }

  prompt += `

Respond with JSON in this exact format:
{
  "valid": true or false,
  "warnings": ["warning 1", "warning 2", ...]
}`;

  return prompt;
}

/**
 * Prompt template for describing purpose
 */
export function createDescribePurposePrompt(description: string): string {
  return `Describe the semantic purpose of this symbol based on its description.

Symbol description: "${description}"

Provide a clear, concise explanation of what this symbol is likely used for in code.

Respond with JSON in this exact format:
{
  "purpose": "description of the symbol's purpose"
}`;
}

/**
 * Prompt template for checking appropriateness for a use case
 */
export function createIsAppropriateForPrompt(
  description: string,
  useCase: string
): string {
  return `Determine if this symbol is appropriate for the given use case.

Symbol description: "${description}"
Intended use case: "${useCase}"

Consider:
- Does the symbol's implied purpose match the use case?
- Are there semantic mismatches that could cause confusion?
- Would using this symbol for this purpose be a code smell?

Respond with JSON in this exact format:
{
  "appropriate": true or false,
  "reason": "explanation of why the symbol is or isn't appropriate"
}`;
}
