/**
 * Prompts for SemanticTuple LLM operations
 * These prompts enable semantic operations on fixed-length tuples with positional meaning
 */

/**
 * System prompt for tuple semantic operations
 */
export const TUPLE_SYSTEM_PROMPT = `You are a semantic tuple analyzer. Your task is to analyze tuples (fixed-length arrays with positional meaning) and provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Tuples have positional meaning - each index represents a specific semantic concept
- Consider common tuple patterns: coordinates, ranges, RGB colors, key-value pairs, etc.
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic equality comparison
 */
export function createSemanticallyEqualsPrompt(
  tuple1: unknown[],
  tuple2: unknown[],
  labels1?: string[],
  labels2?: string[]
): string {
  let prompt = `Compare these two tuples for semantic equivalence.

Tuple 1: ${JSON.stringify(tuple1)}`;

  if (labels1) {
    prompt += `\nTuple 1 Labels: ${JSON.stringify(labels1)}`;
  }

  prompt += `\nTuple 2: ${JSON.stringify(tuple2)}`;

  if (labels2) {
    prompt += `\nTuple 2 Labels: ${JSON.stringify(labels2)}`;
  }

  prompt += `

Consider:
- Whether tuples have the same arity (length)
- Whether corresponding positions have equivalent semantic meaning
- Whether the overall tuple pattern matches (e.g., both are coordinates, both are ranges)

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "explanation of the comparison"
}`;

  return prompt;
}

/**
 * Prompt for inferring positional meaning
 */
export function createInferPositionalMeaningPrompt(
  tuple: unknown[],
  context?: string
): string {
  let prompt = `Infer the semantic meaning of each position in this tuple.

Tuple: ${JSON.stringify(tuple)}`;

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

Analyze the values and determine what each position represents semantically.
Common patterns include:
- Coordinates: [latitude, longitude] or [x, y, z]
- Colors: [red, green, blue] or [hue, saturation, lightness]
- Ranges: [start, end] or [min, max]
- Records: [key, value] or [id, name, status]
- HTTP responses: [statusCode, message]

Respond with JSON in this exact format:
{
  "positions": {
    "0": { "meaning": "description", "confidence": 0.0 to 1.0 },
    "1": { "meaning": "description", "confidence": 0.0 to 1.0 }
  },
  "overallPattern": "pattern name or description"
}`;

  return prompt;
}

/**
 * Prompt for validating relationships between elements
 */
export function createValidateRelationshipPrompt(
  tuple: unknown[],
  rules: string[],
  labels?: string[]
): string {
  let prompt = `Validate the relationships between elements in this tuple.

Tuple: ${JSON.stringify(tuple)}`;

  if (labels) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  prompt += `
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check if the tuple elements satisfy the given relationship rules.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "violations": ["description of each violated rule"],
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for detecting tuple pattern
 */
export function createDetectPatternPrompt(
  tuple: unknown[],
  labels?: string[]
): string {
  let prompt = `Detect what type of tuple this is (what pattern it represents).

Tuple: ${JSON.stringify(tuple)}`;

  if (labels) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  prompt += `

Common tuple patterns include:
- coordinate: Geographic coordinates [lat, lng] or spatial [x, y, z]
- RGB: Color values [red, green, blue] (0-255)
- HSL: Color values [hue, saturation, lightness]
- range: Numeric range [start, end] or [min, max]
- dateRange: Date/time range [startDate, endDate]
- keyValue: Key-value pair [key, value]
- record: Data record [id, name, ...fields]
- httpStatus: HTTP response [code, message]
- version: Software version [major, minor, patch]
- point: Mathematical point [x, y] or [x, y, z]
- bounds: Bounding box [top, right, bottom, left] or [x, y, width, height]

Respond with JSON in this exact format:
{
  "pattern": "pattern name",
  "confidence": 0.0 to 1.0,
  "suggestedType": "optional TypeScript type suggestion"
}`;

  return prompt;
}

/**
 * Prompt for converting tuple to labeled object
 */
export function createToObjectPrompt(
  tuple: unknown[],
  existingLabels?: string[]
): string {
  let prompt = `Convert this tuple to a labeled object with meaningful property names.

Tuple: ${JSON.stringify(tuple)}`;

  if (existingLabels) {
    prompt += `\nExisting labels (use these if provided): ${JSON.stringify(existingLabels)}`;
  }

  prompt += `

Determine appropriate property names for each position based on:
- The values themselves
- Common tuple patterns
- Any provided labels

Respond with JSON in this exact format:
{
  "labels": ["label1", "label2", ...],
  "object": { "label1": value1, "label2": value2, ... },
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for getting element by semantic label
 */
export function createGetByLabelPrompt(
  tuple: unknown[],
  label: string,
  existingLabels?: string[]
): string {
  let prompt = `Find the element in this tuple that matches the semantic label.

Tuple: ${JSON.stringify(tuple)}
Query label: "${label}"`;

  if (existingLabels) {
    prompt += `\nExisting labels: ${JSON.stringify(existingLabels)}`;
  }

  prompt += `

Match the query label to the most appropriate position, considering:
- Exact label matches
- Synonyms and related terms (e.g., "lat" matches "latitude")
- Semantic meaning of the values

Respond with JSON in this exact format:
{
  "index": 0 or null if not found,
  "matchedLabel": "the label that was matched",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for validating structure
 */
export function createValidateStructurePrompt(
  tuple: unknown[],
  expectedTypes: string[]
): string {
  return `Validate that this tuple matches the expected structure.

Tuple: ${JSON.stringify(tuple)}
Expected types: ${JSON.stringify(expectedTypes)}

Check each position:
- Does the actual type match or is compatible with the expected type?
- Consider semantic compatibility (e.g., "integer" is compatible with "number")

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "position": 0, "expected": "string", "actual": "number" }
  ],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for explaining what the tuple represents
 */
export function createExplainPrompt(
  tuple: unknown[],
  labels?: string[]
): string {
  let prompt = `Explain what this tuple represents in a human-readable way.

Tuple: ${JSON.stringify(tuple)}`;

  if (labels) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  prompt += `

Provide a clear, concise explanation that describes:
- What kind of data this tuple represents
- What each element means
- The overall purpose or use case

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}
