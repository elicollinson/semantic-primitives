/**
 * Prompts for SemanticSet LLM operations
 * These prompts enable semantic operations on set collections
 */

/**
 * System prompt for set semantic operations
 */
export const SET_SYSTEM_PROMPT = `You are a semantic set analyzer. Your task is to analyze sets and their elements to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider element meanings, relationships, and uniqueness
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis
- Understand that sets represent unique value collections
- Focus on semantic equivalence beyond exact string matching`;

/**
 * Prompt for semantic has (membership check)
 */
export function createSemanticHasPrompt(
  setValues: unknown[],
  query: unknown
): string {
  return `Check if the following set contains a value that is semantically equivalent to the query.

Set values: ${JSON.stringify(setValues)}
Query: ${JSON.stringify(query)}

Consider semantic equivalence:
- "crimson" matches "red" (color synonyms)
- "ML" matches "machine learning" (abbreviations)
- "programming" matches "coding" or "software development" (related concepts)

Respond with JSON in this exact format:
{
  "exists": true or false,
  "matchedValue": "the value in the set that matches (if any)" or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic add (conditional add based on semantic equivalence)
 */
export function createSemanticAddPrompt(
  setValues: unknown[],
  value: unknown
): string {
  return `Determine if the value should be added to the set based on semantic uniqueness.

Current set values: ${JSON.stringify(setValues)}
Value to add: ${JSON.stringify(value)}

The value should NOT be added if the set already contains a semantically equivalent value.
For example:
- Don't add "ML" if "machine learning" exists
- Don't add "crimson" if "red" exists (same concept)
- Don't add "JavaScript" if "JS" exists

Respond with JSON in this exact format:
{
  "shouldAdd": true or false,
  "existingEquivalent": "the semantically equivalent value that already exists" or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic equality comparison between sets
 */
export function createSemanticallyEqualsPrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Compare these two sets for semantic equivalence.

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Two sets are semantically equivalent if:
- They contain the same number of semantically distinct concepts
- Each element in one set has a semantic match in the other set

Consider:
- "red" and "crimson" are semantically similar (colors)
- "ML" and "machine learning" are equivalent (abbreviation)
- "JavaScript" and "JS" are equivalent

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "mappings": [["set1_value", "set2_value"], ...],
  "confidence": 0.0 to 1.0
}

The mappings array should show which elements in set1 correspond to which elements in set2.`;
}

/**
 * Prompt for semantic intersection
 */
export function createSemanticIntersectionPrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Find the semantic intersection of these two sets.

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Include values that exist semantically in BOTH sets.
For example:
- If set1 has "JavaScript" and set2 has "JS", include one of them
- If set1 has "red" and set2 has "crimson", include one

Respond with JSON in this exact format:
{
  "intersectionIndices": [0, 2],
  "mappings": [["set1_value", "set2_value"], ...],
  "confidence": 0.0 to 1.0
}

The intersectionIndices should be indices from Set 1 that have semantic matches in Set 2.`;
}

/**
 * Prompt for semantic union
 */
export function createSemanticUnionPrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Create a semantic union of these two sets with deduplication.

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Include all semantically unique values from both sets.
Deduplicate semantic equivalents:
- Don't include both "ML" and "machine learning"
- Don't include both "red" and "crimson"

Prefer values from Set 1 when there are equivalent values.

Respond with JSON in this exact format:
{
  "unionIndicesSet1": [0, 1, 2],
  "unionIndicesSet2": [1, 3],
  "duplicateMappings": [["set1_value", "set2_value"], ...],
  "confidence": 0.0 to 1.0
}

unionIndicesSet1: indices from Set 1 to include
unionIndicesSet2: indices from Set 2 to include (values not equivalent to any in Set 1)
duplicateMappings: shows which Set 2 values were excluded due to equivalence`;
}

/**
 * Prompt for semantic difference
 */
export function createSemanticDifferencePrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Find the semantic difference (set1 - set2).

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Return values from Set 1 that have NO semantic equivalent in Set 2.
For example:
- Exclude "Python" from Set 1 if Set 2 has "Python programming"
- Exclude "JS" from Set 1 if Set 2 has "JavaScript"

Respond with JSON in this exact format:
{
  "differenceIndices": [0, 2],
  "excludedMappings": [["set1_excluded", "set2_match"], ...],
  "confidence": 0.0 to 1.0
}

differenceIndices: indices from Set 1 that have no match in Set 2
excludedMappings: shows which Set 1 values were excluded and why`;
}

/**
 * Prompt for semantic filtering
 */
export function createSemanticFilterPrompt(
  setValues: unknown[],
  criteria: string
): string {
  return `Filter the following set using the given natural language criteria.

Set values: ${JSON.stringify(setValues)}
Criteria: "${criteria}"

Analyze each element and determine if it matches the criteria semantically.

Respond with JSON in this exact format:
{
  "matchingIndices": [0, 2, 5],
  "confidence": 0.0 to 1.0
}

Where matchingIndices contains the indices of elements that match the criteria.`;
}

/**
 * Prompt for grouping set values
 */
export function createGroupByPrompt(
  setValues: unknown[],
  criteria: string
): string {
  return `Group the following set values based on the given criteria.

Set values: ${JSON.stringify(setValues)}
Grouping criteria: "${criteria}"

Analyze each element and assign it to a semantic group based on the criteria.

Respond with JSON in this exact format:
{
  "groups": {
    "group_name_1": [0, 2],
    "group_name_2": [1, 3, 4]
  },
  "confidence": 0.0 to 1.0
}

Where each group name maps to an array of indices of elements belonging to that group.`;
}

/**
 * Prompt for summarization
 */
export function createSummarizePrompt(
  setValues: unknown[],
  options?: { maxLength?: number; focus?: string }
): string {
  const maxLength = options?.maxLength ?? 200;
  const focus = options?.focus;

  let prompt = `Summarize the following set contents.

Set values: ${JSON.stringify(setValues)}
Maximum summary length: ${maxLength} characters`;

  if (focus) {
    prompt += `\nFocus area: "${focus}"`;
  }

  prompt += `

Provide a concise, human-readable summary that captures:
- The overall nature/theme of the values
- Count and categorization of elements
- Notable characteristics

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for suggesting related values
 */
export function createSuggestRelatedPrompt(setValues: unknown[]): string {
  return `Suggest related values that might belong in this set.

Current set values: ${JSON.stringify(setValues)}

Based on the theme and existing values, suggest items that would logically fit.
For example:
- If the set contains ["React", "Vue", "Angular"], suggest "Svelte"
- If the set contains ["red", "blue", "green"], suggest "yellow"

Respond with JSON in this exact format:
{
  "suggestions": [
    { "value": "suggested value", "reason": "why it fits" },
    { "value": "another suggestion", "reason": "why it fits" }
  ],
  "confidence": 0.0 to 1.0
}

Provide 2-5 relevant suggestions.`;
}

/**
 * Prompt for validation against rules
 */
export function createValidatePrompt(
  setValues: unknown[],
  rules: string[]
): string {
  return `Validate all values in the following set against the given rules.

Set values: ${JSON.stringify(setValues)}
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each value against all rules and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "value": "the problematic value", "problems": ["problem 1", "problem 2"] }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring the theme of a set
 */
export function createInferThemePrompt(setValues: unknown[]): string {
  return `Analyze the following set and infer its semantic theme or category.

Set values: ${JSON.stringify(setValues)}

Determine:
- What theme or category unifies these values
- How specific or general the theme is

Examples:
- ["JavaScript", "Python", "Java"] -> "programming languages"
- ["red", "blue", "green"] -> "colors"
- ["Monday", "Tuesday", "Wednesday"] -> "days of the week"

Respond with JSON in this exact format:
{
  "theme": "the inferred theme",
  "confidence": 0.0 to 1.0
}`;
}
