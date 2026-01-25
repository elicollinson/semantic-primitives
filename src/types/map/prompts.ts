/**
 * Prompts for SemanticMap LLM operations
 * These prompts enable semantic operations on Map key-value collections
 */

/**
 * System prompt for map semantic operations
 */
export const MAP_SYSTEM_PROMPT = `You are a semantic map analyzer. Your task is to analyze Map key-value pairs to provide semantic understanding of keys, values, and their relationships.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider key meanings, synonyms, and naming conventions
- Understand value relationships and patterns
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis
- Handle both primitive and complex object values`;

/**
 * Prompt for semantic key lookup
 */
export function createSemanticGetPrompt(
  keys: string[],
  query: string,
  context?: Record<string, unknown>
): string {
  let prompt = `Find the key that best semantically matches the query.

Available keys: ${JSON.stringify(keys)}
Query: "${query}"`;

  if (context && Object.keys(context).length > 0) {
    prompt += `\nContext: ${JSON.stringify(context)}`;
  }

  prompt += `

Consider:
- Key synonyms (e.g., "userId" matches "user identifier")
- Naming conventions (camelCase, snake_case, SCREAMING_SNAKE_CASE)
- Abbreviations and acronyms (e.g., "db" for "database")
- Semantic relationships between query and keys

Respond with JSON in this exact format:
{
  "matchedKeyIndex": 0 or null if no match,
  "confidence": 0.0 to 1.0
}

Where matchedKeyIndex is the index in the keys array, or null if no suitable match exists.`;

  return prompt;
}

/**
 * Prompt for semantic has check
 */
export function createSemanticHasPrompt(keys: string[], query: string): string {
  return `Determine if any key semantically matches the query.

Available keys: ${JSON.stringify(keys)}
Query: "${query}"

Consider:
- Key synonyms and variations
- Naming conventions (camelCase, snake_case, etc.)
- Abbreviations and common patterns

Respond with JSON in this exact format:
{
  "hasMatch": true or false,
  "matchedKeyIndex": 0 or null,
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

Map 1 entries: ${JSON.stringify(map1Entries)}
Map 2 entries: ${JSON.stringify(map2Entries)}

Consider:
- Whether keys have semantically equivalent meanings (e.g., "userId" and "user_id")
- Whether corresponding values are semantically equivalent
- Overall map purpose and structure

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "keyMappings": [[key1FromMap1, matchingKeyFromMap2], ...],
  "confidence": 0.0 to 1.0
}

Where keyMappings shows which keys from map1 correspond to which keys in map2.`;
}

/**
 * Prompt for finding keys by criteria
 */
export function createFindKeysPrompt(
  entries: [string, unknown][],
  criteria: string
): string {
  return `Find all keys that match the given semantic criteria.

Map entries: ${JSON.stringify(entries)}
Criteria: "${criteria}"

Analyze each key (and its value for context) to determine if it matches the criteria.

Respond with JSON in this exact format:
{
  "matches": [
    { "keyIndex": 0, "relevance": 0.95 },
    { "keyIndex": 2, "relevance": 0.80 }
  ],
  "confidence": 0.0 to 1.0
}

Where keyIndex refers to the index in the entries array, sorted by relevance (highest first).`;
}

/**
 * Prompt for finding values by criteria
 */
export function createFindValuesPrompt(
  entries: [string, unknown][],
  criteria: string
): string {
  return `Find all entries where the value matches the given semantic criteria.

Map entries: ${JSON.stringify(entries)}
Criteria: "${criteria}"

Analyze each value to determine if it semantically matches the criteria.

Respond with JSON in this exact format:
{
  "matches": [
    { "entryIndex": 0, "relevance": 0.95 },
    { "entryIndex": 3, "relevance": 0.82 }
  ],
  "confidence": 0.0 to 1.0
}

Where entryIndex refers to the index in the entries array, sorted by relevance (highest first).`;
}

/**
 * Prompt for semantic merge
 */
export function createSemanticMergePrompt(
  thisEntries: [string, unknown][],
  otherEntries: [string, unknown][],
  conflictResolution: 'prefer-this' | 'prefer-other' | 'combine'
): string {
  return `Merge two maps with semantic key matching.

This map entries: ${JSON.stringify(thisEntries)}
Other map entries: ${JSON.stringify(otherEntries)}
Conflict resolution: "${conflictResolution}"

Identify semantically equivalent keys between the maps and determine the merged result.

For conflicts:
- "prefer-this": Keep value from this map
- "prefer-other": Use value from other map
- "combine": Merge values if objects, otherwise prefer-other

Respond with JSON in this exact format:
{
  "mergedEntries": [
    { "key": "keyName", "value": "value", "source": "this" | "other" | "combined" }
  ],
  "keyMappings": [[thisKey, otherKey], ...],
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
  let rulesDescription = '';
  if (rules.keys) {
    rulesDescription += `Key rules: ${rules.keys}\n`;
  }
  if (rules.values) {
    rulesDescription += `Value rules: ${rules.values}\n`;
  }

  return `Validate all key-value pairs against the given rules.

Map entries: ${JSON.stringify(entries)}
${rulesDescription}
Check each entry against all applicable rules and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["issue 1 description", "issue 2 description"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for suggesting missing keys
 */
export function createSuggestMissingKeysPrompt(
  entries: [string, unknown][]
): string {
  return `Analyze this map and suggest missing keys based on existing patterns.

Current map entries: ${JSON.stringify(entries)}

Look for:
- Common configuration patterns (if this looks like config)
- Missing complementary keys (e.g., if there's "minValue", suggest "maxValue")
- Standard fields typically found with these types of entries
- Keys commonly associated with existing keys

Respond with JSON in this exact format:
{
  "suggestions": [
    { "key": "suggestedKey", "reason": "why this key should be added" }
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
  return `Group the map entries based on the given criteria.

Map entries: ${JSON.stringify(entries)}
Grouping criteria: "${criteria}"

Analyze each entry and assign it to a semantic group based on the criteria.

Respond with JSON in this exact format:
{
  "groups": {
    "group_name_1": [0, 2],
    "group_name_2": [1, 3, 4]
  },
  "confidence": 0.0 to 1.0
}

Where each group name maps to an array of entry indices belonging to that group.`;
}

/**
 * Prompt for summarization
 */
export function createSummarizePrompt(
  entries: [string, unknown][],
  mapSize: number
): string {
  return `Summarize the contents of this map.

Map entries (sample): ${JSON.stringify(entries.slice(0, 20))}
Total entries: ${mapSize}

Provide a concise, human-readable summary that captures:
- The overall nature/purpose of the map
- Key categories or patterns
- Notable values or statistics
- Any important observations

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring purpose
 */
export function createInferPurposePrompt(entries: [string, unknown][]): string {
  return `Infer the semantic purpose of this map based on its keys and values.

Map entries: ${JSON.stringify(entries)}

Analyze the key naming patterns, value types, and overall structure to determine:
- The primary purpose/use case of this map
- A subcategory if applicable (e.g., "database-settings" for "configuration")

Respond with JSON in this exact format:
{
  "purpose": "main purpose (e.g., configuration, user-preferences, translations)",
  "subcategory": "optional subcategory",
  "confidence": 0.0 to 1.0
}`;
}
