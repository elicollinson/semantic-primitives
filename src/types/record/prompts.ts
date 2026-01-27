/**
 * Prompts for SemanticRecord LLM operations
 * These prompts enable semantic operations on Record key-value collections
 */

/**
 * System prompt for record semantic operations
 */
export const RECORD_SYSTEM_PROMPT = `You are a semantic record analyzer. Your task is to analyze Record key-value pairs to provide semantic understanding of keys, values, and their relationships.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider key meanings, synonyms, and naming conventions
- Understand value relationships and patterns
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis
- Handle both primitive and complex object values
- Records are uniform dictionaries where keys follow consistent patterns`;

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
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  record1Entries: [string, unknown][],
  record2Entries: [string, unknown][]
): string {
  return `Compare these two records for semantic equivalence.

Record 1 entries: ${JSON.stringify(record1Entries)}
Record 2 entries: ${JSON.stringify(record2Entries)}

Consider:
- Whether keys have semantically equivalent meanings (e.g., "userId" and "user_id")
- Whether corresponding values are semantically equivalent
- Overall record purpose and structure

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "keyMappings": { "keyFromRecord1": "matchingKeyFromRecord2", ... },
  "confidence": 0.0 to 1.0
}

Where keyMappings shows which keys from record1 correspond to which keys in record2.`;
}

/**
 * Prompt for validating keys
 */
export function createValidateKeysPrompt(
  keys: string[],
  rules: string[]
): string {
  return `Validate these record keys against the given rules.

Keys: ${JSON.stringify(keys)}
Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each key against all rules and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "invalidKeys": ["key1", "key2"],
  "reasons": ["reason for key1", "reason for key2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating values
 */
export function createValidateValuesPrompt(
  entries: [string, unknown][],
  rules: string[]
): string {
  return `Validate these record values against the given rules.

Record entries: ${JSON.stringify(entries)}
Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each value against all rules and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "invalidEntries": [
    { "key": "keyName", "value": "valueHere", "reason": "why invalid" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for inferring record purpose
 */
export function createInferPurposePrompt(entries: [string, unknown][]): string {
  return `Infer the semantic purpose of this record based on its keys and values.

Record entries: ${JSON.stringify(entries)}

Analyze the key naming patterns, value types, and overall structure to determine:
- The primary purpose/use case of this record
- What type of data the keys represent
- What type of data the values represent

Respond with JSON in this exact format:
{
  "purpose": "main purpose (e.g., configuration, exchange-rates, user-preferences)",
  "keyType": "what keys represent (e.g., currency-code, setting-name, user-id)",
  "valueType": "what values represent (e.g., rate, setting-value, user-data)",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic filtering
 */
export function createSemanticFilterPrompt(
  entries: [string, unknown][],
  criteria: string
): string {
  return `Filter the record entries based on the given semantic criteria.

Record entries: ${JSON.stringify(entries)}
Filter criteria: "${criteria}"

Analyze each entry and determine if it matches the criteria semantically.

Respond with JSON in this exact format:
{
  "matchingIndices": [0, 2, 5],
  "confidence": 0.0 to 1.0
}

Where matchingIndices contains the indices of entries that match the criteria.`;
}

/**
 * Prompt for suggesting missing keys
 */
export function createSuggestMissingKeysPrompt(
  entries: [string, unknown][]
): string {
  return `Analyze this record and suggest missing keys based on existing patterns.

Current record entries: ${JSON.stringify(entries)}

Look for:
- Common patterns with existing keys (e.g., if there's "minValue", suggest "maxValue")
- Standard fields typically found with these types of entries
- Keys commonly associated with the detected purpose of this record
- Complementary keys that would complete the record

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
  return `Group the record entries based on the given criteria.

Record entries: ${JSON.stringify(entries)}
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
  recordSize: number
): string {
  return `Summarize the contents of this record.

Record entries (sample): ${JSON.stringify(entries.slice(0, 20))}
Total entries: ${recordSize}

Provide a concise, human-readable summary that captures:
- The overall nature/purpose of the record
- Key categories or patterns
- Notable values or statistics
- Any important observations

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;
}
