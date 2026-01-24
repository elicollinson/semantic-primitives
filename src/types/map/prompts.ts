/**
 * Prompts for SemanticMap LLM operations
 * These prompts enable semantic operations on Map collections
 */

/**
 * System prompt for map semantic operations
 */
export const MAP_SYSTEM_PROMPT = `You are a semantic map analyzer. Your task is to analyze key-value Map collections to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider key synonyms and naming conventions
- Understand value relationships and meanings
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic key lookup
 */
export function createSemanticGetPrompt(
  keys: string[],
  query: string,
  context?: Record<string, unknown>
): string {
  let prompt = `Find the best matching key for this semantic query.

Available keys: ${JSON.stringify(keys)}
Query: "${query}"`;

  if (context) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Find the key that best matches the query semantically. Consider:
- Key synonyms (e.g., "userId" matches "user identifier")
- Naming conventions (camelCase, snake_case, etc.)
- Contextual meaning

Respond with JSON in this exact format:
{
  "matchedKey": "the best matching key" or null if no match,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for semantic has check
 */
export function createSemanticHasPrompt(keys: string[], query: string): string {
  return `Check if any key matches this semantic query.

Available keys: ${JSON.stringify(keys)}
Query: "${query}"

Determine if any key semantically matches the query. Consider synonyms and naming conventions.

Respond with JSON in this exact format:
{
  "has": true or false,
  "matchedKey": "the matching key" or null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  map1Entries: [string, unknown][],
  map2Entries: [string, unknown][]
): string {
  return `Compare these two maps for semantic equivalence.

Map 1: ${JSON.stringify(Object.fromEntries(map1Entries))}
Map 2: ${JSON.stringify(Object.fromEntries(map2Entries))}

Consider:
- Key synonyms (e.g., "userId" and "user_id" may be equivalent)
- Value semantic equality
- Overall structure and meaning

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "keyMappings": [["key1_from_map1", "key1_from_map2"], ...],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for finding keys by criteria
 */
export function createFindKeysPrompt(keys: string[], criteria: string): string {
  return `Find all keys matching the semantic criteria.

Keys: ${JSON.stringify(keys)}
Criteria: "${criteria}"

Find all keys that match the criteria semantically.

Respond with JSON in this exact format:
{
  "matches": [
    { "key": "key1", "relevance": 0.95 },
    { "key": "key2", "relevance": 0.80 }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for finding values by criteria
 */
export function createFindValuesPrompt(
  entries: [string, unknown][],
  criteria: string
): string {
  return `Find all entries where values match the semantic criteria.

Entries: ${JSON.stringify(Object.fromEntries(entries))}
Criteria: "${criteria}"

Find all entries where the value matches the criteria semantically.

Respond with JSON in this exact format:
{
  "matches": [
    { "key": "key1", "relevance": 0.95 },
    { "key": "key2", "relevance": 0.80 }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic merge
 */
export function createSemanticMergePrompt(
  map1Entries: [string, unknown][],
  map2Entries: [string, unknown][],
  conflictResolution: 'prefer-this' | 'prefer-other' | 'combine'
): string {
  return `Merge these two maps with semantic key matching.

Map 1: ${JSON.stringify(Object.fromEntries(map1Entries))}
Map 2: ${JSON.stringify(Object.fromEntries(map2Entries))}
Conflict resolution: ${conflictResolution}

Identify semantically equivalent keys and merge appropriately.
For "${conflictResolution}":
- "prefer-this": Keep map1's value for conflicts
- "prefer-other": Keep map2's value for conflicts
- "combine": Combine values if possible

Respond with JSON in this exact format:
{
  "mergedEntries": [["key1", value1], ["key2", value2], ...],
  "keyMappings": [["map1_key", "map2_key"], ...],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validation
 */
export function createValidatePrompt(
  entries: [string, unknown][],
  rules: { keys?: string; values?: string }
): string {
  let prompt = `Validate all entries in this map.

Entries: ${JSON.stringify(Object.fromEntries(entries))}

Validation rules:`;

  if (rules.keys) {
    prompt += `\n- Keys: ${rules.keys}`;
  }
  if (rules.values) {
    prompt += `\n- Values: ${rules.values}`;
  }

  prompt += `

Check each entry against the rules and report violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["issue 1", "issue 2"],
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for suggesting missing keys
 */
export function createSuggestMissingKeysPrompt(keys: string[]): string {
  return `Suggest keys that might be missing from this map.

Current keys: ${JSON.stringify(keys)}

Based on the existing keys and their patterns, suggest additional keys that would be commonly expected.

Respond with JSON in this exact format:
{
  "suggestions": [
    { "key": "suggested_key", "reason": "why this key might be needed" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for grouping entries
 */
export function createGroupByPrompt(
  entries: [string, unknown][],
  criteria: string
): string {
  return `Group these map entries by the given criteria.

Entries: ${JSON.stringify(Object.fromEntries(entries))}
Grouping criteria: "${criteria}"

Assign each entry to a semantic group based on the criteria.

Respond with JSON in this exact format:
{
  "groups": {
    "group_name_1": ["key1", "key2"],
    "group_name_2": ["key3", "key4"]
  },
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarizing map
 */
export function createSummarizePrompt(entries: [string, unknown][]): string {
  return `Summarize this map's contents.

Entries: ${JSON.stringify(Object.fromEntries(entries))}

Provide a concise, human-readable summary that captures:
- The type/purpose of data stored
- Key statistics (count, categories)
- Notable patterns or characteristics

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring map purpose
 */
export function createInferPurposePrompt(entries: [string, unknown][]): string {
  return `Infer the semantic purpose of this map.

Entries: ${JSON.stringify(Object.fromEntries(entries))}

Analyze the keys and values to determine:
- What type of data this map holds
- Its likely use case
- Any subcategory classification

Respond with JSON in this exact format:
{
  "purpose": "main purpose",
  "subcategory": "optional subcategory",
  "confidence": 0.0 to 1.0
}`;
}
