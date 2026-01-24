/**
 * Prompts for SemanticSet LLM operations
 * These prompts enable semantic operations on Set collections
 */

/**
 * System prompt for set semantic operations
 */
export const SET_SYSTEM_PROMPT = `You are a semantic set analyzer. Your task is to analyze Set collections to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider value synonyms and semantic equivalence
- Understand relationships between set elements
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic membership check
 */
export function createSemanticHasPrompt(values: unknown[], query: unknown): string {
  return `Check if the set contains a semantically equivalent value.

Set values: ${JSON.stringify(values)}
Query: ${JSON.stringify(query)}

Determine if any value in the set is semantically equivalent to the query.
Consider synonyms and related meanings (e.g., "red" matches "crimson").

Respond with JSON in this exact format:
{
  "has": true or false,
  "matchedValue": the matching value or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic add check
 */
export function createSemanticAddPrompt(values: unknown[], newValue: unknown): string {
  return `Check if this value should be added to the set or if a semantic equivalent already exists.

Current values: ${JSON.stringify(values)}
New value: ${JSON.stringify(newValue)}

Determine if the new value is semantically unique (should be added) or if an equivalent already exists.

Respond with JSON in this exact format:
{
  "shouldAdd": true or false,
  "existingEquivalent": the existing equivalent value or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Compare these two sets for semantic equivalence.

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Consider value synonyms and semantic relationships.
Sets are equivalent if they contain the same meanings, even if expressed differently.

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "mappings": [[value1_from_set1, value1_from_set2], ...],
  "confidence": 0.0 to 1.0
}`;
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

Find values that exist in both sets (considering semantic equivalence).
For equivalent pairs, keep the value from Set 1.

Respond with JSON in this exact format:
{
  "intersection": [values that exist semantically in both],
  "mappings": [[set1_value, set2_value], ...],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic union
 */
export function createSemanticUnionPrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Find the semantic union of these two sets with deduplication.

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Combine both sets but remove semantic duplicates.
For equivalent pairs, keep the value from Set 1.

Respond with JSON in this exact format:
{
  "union": [all unique semantic values],
  "duplicates": [[kept_value, removed_value], ...],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic difference
 */
export function createSemanticDifferencePrompt(
  set1Values: unknown[],
  set2Values: unknown[]
): string {
  return `Find the semantic difference (Set 1 - Set 2).

Set 1: ${JSON.stringify(set1Values)}
Set 2: ${JSON.stringify(set2Values)}

Find values in Set 1 that have no semantic equivalent in Set 2.

Respond with JSON in this exact format:
{
  "difference": [values unique to Set 1],
  "removed": [values from Set 1 that had equivalents in Set 2],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic filter
 */
export function createSemanticFilterPrompt(values: unknown[], criteria: string): string {
  return `Filter the set values based on semantic criteria.

Values: ${JSON.stringify(values)}
Criteria: "${criteria}"

Find all values that match the criteria semantically.

Respond with JSON in this exact format:
{
  "matchingValues": [values that match the criteria],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for grouping by criteria
 */
export function createGroupByPrompt(values: unknown[], criteria: string): string {
  return `Group the set values by the given criteria.

Values: ${JSON.stringify(values)}
Grouping criteria: "${criteria}"

Assign each value to a semantic group based on the criteria.

Respond with JSON in this exact format:
{
  "groups": {
    "group_name_1": [values in this group],
    "group_name_2": [values in this group]
  },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarizing the set
 */
export function createSummarizePrompt(values: unknown[]): string {
  return `Summarize this set's contents.

Values: ${JSON.stringify(values)}

Provide a concise, human-readable summary that captures:
- The type/category of values
- Key statistics (count, diversity)
- Notable patterns or characteristics

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting related values
 */
export function createSuggestRelatedPrompt(values: unknown[]): string {
  return `Suggest values that might belong in this set based on existing patterns.

Current values: ${JSON.stringify(values)}

Analyze the existing values and suggest related values that would fit the set.

Respond with JSON in this exact format:
{
  "suggestions": [
    { "value": "suggested value", "reason": "why this value fits" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validation
 */
export function createValidatePrompt(values: unknown[], rules: string[]): string {
  return `Validate all values in the set against the given rules.

Values: ${JSON.stringify(values)}
Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each value against all rules and report violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "value": "problematic value", "problems": ["issue 1", "issue 2"] }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring theme
 */
export function createInferThemePrompt(values: unknown[]): string {
  return `Infer the semantic theme/category of this set.

Values: ${JSON.stringify(values)}

Analyze the values and determine what category or theme they represent.

Respond with JSON in this exact format:
{
  "theme": "identified theme",
  "confidence": 0.0 to 1.0
}`;
}
