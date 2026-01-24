/**
 * Prompts for SemanticArray LLM operations
 * These prompts enable semantic operations on array collections
 */

/**
 * System prompt for array semantic operations
 */
export const ARRAY_SYSTEM_PROMPT = `You are a semantic array analyzer. Your task is to analyze arrays and their elements to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider element meanings, relationships, and patterns
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis
- Handle both primitive and complex object arrays`;

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  array1: unknown[],
  array2: unknown[],
  options?: { orderMatters?: boolean; threshold?: number }
): string {
  const orderMatters = options?.orderMatters ?? true;
  const threshold = options?.threshold ?? 0.7;

  return `Compare these two arrays for semantic equivalence.

Array 1: ${JSON.stringify(array1)}
Array 2: ${JSON.stringify(array2)}

Options:
- Order matters: ${orderMatters}
- Threshold for equivalence: ${threshold}

Consider:
- Whether elements have the same semantic meaning (e.g., "red" and "crimson" are semantically similar colors)
- Order significance based on the orderMatters flag
- Overall collection meaning and purpose

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0,
  "note": "optional explanation of the comparison"
}`;
}

/**
 * Prompt for semantic filtering
 */
export function createSemanticFilterPrompt(
  array: unknown[],
  criteria: string
): string {
  return `Filter the following array using the given natural language criteria.

Array: ${JSON.stringify(array)}
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
 * Prompt for semantic grouping
 */
export function createSemanticGroupPrompt(
  array: unknown[],
  criteria: string
): string {
  return `Group the following array elements based on the given criteria.

Array: ${JSON.stringify(array)}
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
 * Prompt for semantic sorting
 */
export function createSemanticSortPrompt(
  array: unknown[],
  criteria: string
): string {
  return `Sort the following array using the given semantic criteria.

Array: ${JSON.stringify(array)}
Sort criteria: "${criteria}"

Analyze each element and determine the optimal semantic ordering.

Respond with JSON in this exact format:
{
  "sortedIndices": [2, 0, 1, 3],
  "confidence": 0.0 to 1.0
}

Where sortedIndices contains the original indices in the new sorted order.`;
}

/**
 * Prompt for semantic search
 */
export function createSemanticSearchPrompt(
  array: unknown[],
  criteria: string,
  options?: { limit?: number }
): string {
  const limit = options?.limit ?? 10;

  return `Search the following array for elements matching the criteria.

Array: ${JSON.stringify(array)}
Search criteria: "${criteria}"
Maximum results: ${limit}

Analyze each element and calculate its semantic relevance to the search criteria.

Respond with JSON in this exact format:
{
  "results": [
    { "index": 0, "relevance": 0.95 },
    { "index": 3, "relevance": 0.82 }
  ],
  "confidence": 0.0 to 1.0
}

Results should be sorted by relevance (highest first) and limited to ${limit} items.`;
}

/**
 * Prompt for pattern detection
 */
export function createDetectPatternsPrompt(array: unknown[]): string {
  return `Analyze the following array and detect any patterns or anomalies.

Array: ${JSON.stringify(array)}

Look for:
- Repeating patterns or cycles
- Trends (increasing, decreasing)
- Structural patterns
- Statistical patterns
- Any anomalies or outliers

Respond with JSON in this exact format:
{
  "patterns": ["pattern 1 description", "pattern 2 description"],
  "anomalies": [
    { "index": 5, "reason": "explanation" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarization
 */
export function createSummarizePrompt(
  array: unknown[],
  options?: { maxLength?: number; focus?: string }
): string {
  const maxLength = options?.maxLength ?? 200;
  const focus = options?.focus;

  let prompt = `Summarize the following array contents.

Array: ${JSON.stringify(array)}
Maximum summary length: ${maxLength} characters`;

  if (focus) {
    prompt += `\nFocus area: "${focus}"`;
  }

  prompt += `

Provide a concise, human-readable summary that captures:
- The overall nature of the data
- Key statistics or metrics (counts, totals, etc.)
- Notable characteristics or patterns

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for semantic unique (deduplication)
 */
export function createSemanticUniquePrompt(
  array: unknown[],
  options?: { threshold?: number }
): string {
  const threshold = options?.threshold ?? 0.85;

  return `Identify semantic duplicates in the following array.

Array: ${JSON.stringify(array)}
Similarity threshold: ${threshold}

Elements are considered duplicates if they have the same semantic meaning,
even if expressed differently (e.g., "buy now" and "purchase immediately").

Respond with JSON in this exact format:
{
  "uniqueIndices": [0, 2, 4],
  "duplicateGroups": [
    { "keep": 0, "remove": [1, 3] }
  ],
  "confidence": 0.0 to 1.0
}

Where uniqueIndices are the indices to keep, and duplicateGroups show which items are semantically equivalent.`;
}

/**
 * Prompt for validation
 */
export function createValidatePrompt(
  array: unknown[],
  rules: string[]
): string {
  return `Validate all elements in the following array against the given rules.

Array: ${JSON.stringify(array)}
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each element against all rules and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "index": 0, "problems": ["problem 1", "problem 2"] }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for enrichment
 */
export function createEnrichPrompt(
  array: unknown[],
  enrichments: Record<string, string>
): string {
  const enrichmentDesc = Object.entries(enrichments)
    .map(([field, desc]) => `- ${field}: ${desc}`)
    .join('\n');

  return `Enrich each element in the following array with the specified fields.

Array: ${JSON.stringify(array)}
Fields to add:
${enrichmentDesc}

For each element, infer appropriate values for the requested fields.

Respond with JSON in this exact format:
{
  "enrichedValues": [
    { "sentiment": "positive", "topics": "customer service" },
    { "sentiment": "negative", "topics": "pricing" }
  ],
  "confidence": 0.0 to 1.0
}

The enrichedValues array should have the same length as the input array, with each object containing only the requested enrichment fields.`;
}

/**
 * Prompt for inferring element type
 */
export function createInferElementTypePrompt(array: unknown[]): string {
  return `Analyze the following array and infer the semantic type of its elements.

Array: ${JSON.stringify(array)}

Determine:
- What type of data the elements represent
- Common fields/properties (if objects)
- The semantic category (e.g., "user-profile", "product", "log-entry")

Respond with JSON in this exact format:
{
  "type": "semantic type name",
  "confidence": 0.0 to 1.0,
  "fields": ["field1", "field2"]
}

The fields array should only be included if elements are objects.`;
}
