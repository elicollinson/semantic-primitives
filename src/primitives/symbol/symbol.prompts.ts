/**
 * Prompts for SemanticSymbol LLM operations
 * These prompts are used for various semantic symbol operations that require LLM understanding
 */

/**
 * System prompt for semantic equality comparison of symbols
 */
export const SEMANTIC_EQUALS_SYSTEM = `You are a symbol naming expert. Your task is to determine if two symbol descriptions serve the same semantic purpose.

Consider:
- Naming conventions (camelCase, snake_case, SCREAMING_CASE)
- Common abbreviations and their expansions
- Synonyms and related concepts
- The underlying intent, not just the literal text

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic equality
 */
export function semanticEqualsPrompt(desc1: string, desc2: string): string {
  return `Compare these two symbol descriptions for semantic equivalence.

Symbol 1 description: "${desc1}"
Symbol 2 description: "${desc2}"

Determine if they represent the same concept or purpose.

Respond with JSON in this exact format:
{"equivalent": <boolean>, "confidence": <0-1>, "note": "<brief explanation>"}`;
}

/**
 * System prompt for suggesting better names
 */
export const SUGGEST_NAME_SYSTEM = `You are a code naming expert. Your task is to suggest better names for identifiers based on best practices.

Best practices:
- Use descriptive, meaningful names
- Follow camelCase for most identifiers
- Avoid single letters except for well-known conventions (i, j for loops)
- Expand abbreviations when clarity is improved
- Keep names concise but clear

Always respond with valid JSON only.`;

/**
 * User prompt template for suggesting better names
 */
export function suggestBetterNamePrompt(description: string): string {
  return `Evaluate this symbol description and suggest a better name if appropriate.

Symbol description: "${description}"

If the name is already good, return suggestion as null.
If improvement is possible, suggest a better name following best practices.

Respond with JSON in this exact format:
{"suggestion": <string or null>, "reason": "<explanation for suggestion or why it's already good>"}`;
}

/**
 * System prompt for classifying symbols
 */
export const CLASSIFY_SYSTEM = `You are a code analysis expert. Your task is to classify symbol descriptions into categories.

Categories:
- event: Event handlers, listeners, callbacks (e.g., onClick, onUserLogin)
- configuration: Config keys, settings, options (e.g., API_KEY, maxRetries)
- lifecycle: Initialization, cleanup, state transitions (e.g., init, destroy, mount)
- identifier: IDs, keys, references (e.g., userId, cacheKey)
- action: Methods, commands, operations (e.g., submit, validate, process)
- data: Data structures, storage (e.g., userData, itemList)
- constant: Unchanging values (e.g., MAX_SIZE, DEFAULT_TIMEOUT)
- internal: Private/internal markers (e.g., _private, __internal)
- metadata: Descriptive information (e.g., version, timestamp)
- unknown: Cannot be determined

Subcategories provide more specific classification within each category.

Always respond with valid JSON only.`;

/**
 * User prompt template for classification
 */
export function classifyPrompt(description: string): string {
  return `Classify this symbol description into a category.

Symbol description: "${description}"

Respond with JSON in this exact format:
{"category": "<category>", "subcategory": "<optional subcategory>"}`;
}

/**
 * System prompt for validation
 */
export const VALIDATE_SYSTEM = `You are a code review expert. Your task is to validate symbol descriptions against naming conventions and best practices.

Check for:
- Clarity and descriptiveness
- Consistent naming convention (camelCase, snake_case, etc.)
- Appropriate length (not too short, not too long)
- Avoidance of reserved words or problematic names
- Proper use of prefixes/suffixes

Always respond with valid JSON only.`;

/**
 * User prompt template for validation
 */
export function validatePrompt(description: string, conventions?: string[]): string {
  const conventionsPart = conventions?.length
    ? `\nAdditional conventions to check:\n${conventions.map((c) => `- ${c}`).join('\n')}`
    : '';

  return `Validate this symbol description against naming best practices.${conventionsPart}

Symbol description: "${description}"

Respond with JSON in this exact format:
{"valid": <boolean>, "warnings": ["<list of warnings or suggestions>"]}`;
}

/**
 * System prompt for describing purpose
 */
export const DESCRIBE_PURPOSE_SYSTEM = `You are a documentation expert. Your task is to describe the likely purpose of a symbol based on its name.

Consider:
- Common naming patterns in programming
- Domain-specific terminology
- Prefixes and suffixes that indicate purpose

Always respond with valid JSON only.`;

/**
 * User prompt template for describing purpose
 */
export function describePurposePrompt(description: string): string {
  return `Describe the likely purpose of this symbol based on its name.

Symbol description: "${description}"

Provide a clear, concise description of what this symbol is likely used for.

Respond with JSON in this exact format:
{"purpose": "<description of the symbol's purpose>"}`;
}

/**
 * System prompt for appropriateness check
 */
export const IS_APPROPRIATE_SYSTEM = `You are a software design expert. Your task is to assess if a symbol is appropriate for a given use case.

Consider:
- Semantic fit between the name and use case
- Potential confusion or misuse
- Naming conventions for the specific use case
- Longevity and maintainability concerns

Always respond with valid JSON only.`;

/**
 * User prompt template for appropriateness check
 */
export function isAppropriateForPrompt(description: string, useCase: string): string {
  return `Assess if this symbol is appropriate for the given use case.

Symbol description: "${description}"
Use case: "${useCase}"

Respond with JSON in this exact format:
{"appropriate": <boolean>, "reason": "<explanation of why it is or isn't appropriate>"}`;
}
