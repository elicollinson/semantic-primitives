/**
 * Prompts for SemanticTuple LLM operations
 * These prompts enable semantic operations on tuple types
 */

/**
 * System prompt for tuple semantic operations
 */
export const TUPLE_SYSTEM_PROMPT = `You are a semantic tuple analyzer. Your task is to analyze tuples (fixed-length heterogeneous sequences) and understand their positional meaning.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Tuples have fixed length and each position typically has a specific meaning
- Consider common tuple patterns: coordinates (lat/lng), ranges (start/end), RGB colors, key-value pairs, etc.
- Analyze the relationship between elements at different positions
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

  if (labels1?.length) {
    prompt += `\nTuple 1 labels: ${JSON.stringify(labels1)}`;
  }

  prompt += `\n\nTuple 2: ${JSON.stringify(tuple2)}`;

  if (labels2?.length) {
    prompt += `\nTuple 2 labels: ${JSON.stringify(labels2)}`;
  }

  prompt += `

Consider:
- Whether the tuples have the same arity (length)
- Whether elements at corresponding positions have equivalent meanings
- Whether the overall semantic purpose is the same

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "explanation of why they are or are not equivalent"
}`;

  return prompt;
}

/**
 * Prompt for inferring positional meaning
 */
export function createInferPositionalMeaningPrompt(
  tuple: unknown[],
  labels?: string[],
  context?: string
): string {
  let prompt = `Analyze the following tuple and infer the semantic meaning of each position.

Tuple: ${JSON.stringify(tuple)}`;

  if (labels?.length) {
    prompt += `\nProvided labels: ${JSON.stringify(labels)}`;
  }

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

For each position (0-indexed), determine:
- What the value at that position represents
- How confident you are in that interpretation

Common patterns to consider:
- Geographic coordinates: [latitude, longitude] or [lat, lng, altitude]
- Color values: [R, G, B] or [R, G, B, A]
- Ranges: [start, end] or [min, max]
- Key-value pairs: [key, value]
- HTTP responses: [statusCode, statusMessage]
- Dimensions: [width, height] or [x, y, z]
- Date/time: [year, month, day] or [hour, minute, second]

Respond with JSON in this exact format:
{
  "positions": {
    "0": { "meaning": "description of what position 0 represents", "confidence": 0.0 to 1.0 },
    "1": { "meaning": "description of what position 1 represents", "confidence": 0.0 to 1.0 }
  },
  "overallConfidence": 0.0 to 1.0
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
  let prompt = `Validate the relationships between elements in this tuple against the given rules.

Tuple: ${JSON.stringify(tuple)}`;

  if (labels?.length) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  prompt += `

Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each rule and determine if the tuple satisfies it.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "violations": ["list of rules that were violated, if any"]
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
  let prompt = `Analyze the following tuple and detect what type of data it represents.

Tuple: ${JSON.stringify(tuple)}`;

  if (labels?.length) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  prompt += `

Common tuple patterns to identify:
- Geographic coordinate (latitude, longitude)
- 3D coordinate (x, y, z)
- RGB color (red, green, blue values 0-255)
- RGBA color (with alpha channel)
- HSL/HSV color
- Date components (year, month, day)
- Time components (hour, minute, second)
- Range/interval (start, end)
- Bounds (min, max)
- Dimensions (width, height)
- Key-value pair
- HTTP status (code, message)
- Version number (major, minor, patch)
- Name parts (first, last) or (first, middle, last)
- Point/Vector (2D or 3D)

Respond with JSON in this exact format:
{
  "pattern": "name of the detected pattern",
  "confidence": 0.0 to 1.0,
  "suggestedType": "suggested TypeScript/semantic type name"
}`;

  return prompt;
}

/**
 * Prompt for converting tuple to labeled object
 */
export function createToObjectPrompt(
  tuple: unknown[],
  partialLabels?: string[]
): string {
  let prompt = `Convert this tuple to a labeled object by inferring appropriate property names for each position.

Tuple: ${JSON.stringify(tuple)}`;

  if (partialLabels?.length) {
    prompt += `\nPartial labels provided: ${JSON.stringify(partialLabels)}`;
  }

  prompt += `

Infer meaningful, descriptive property names for each position based on:
- The values themselves
- Common conventions for similar data structures
- Any partial labels provided

Use camelCase for property names.

Respond with JSON in this exact format:
{
  "object": { "propertyName1": value1, "propertyName2": value2, ... },
  "labelsUsed": ["propertyName1", "propertyName2", ...],
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
  let prompt = `Find which position in this tuple corresponds to the given semantic label.

Tuple: ${JSON.stringify(tuple)}
Looking for: "${label}"`;

  if (existingLabels?.length) {
    prompt += `\nExisting labels: ${JSON.stringify(existingLabels)}`;
  }

  prompt += `

Determine which position (0-indexed) best matches the requested label semantically.
Consider synonyms and related terms (e.g., "lat" matches "latitude", "x" might match "width").

Respond with JSON in this exact format:
{
  "matchedPosition": 0-based index or null if no match,
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for validating tuple structure
 */
export function createValidateStructurePrompt(
  tuple: unknown[],
  expectedTypes: string[],
  labels?: string[]
): string {
  let prompt = `Validate that each element in this tuple matches the expected type for its position.

Tuple: ${JSON.stringify(tuple)}
Expected types: ${JSON.stringify(expectedTypes)}`;

  if (labels?.length) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  prompt += `

For each position, check if the actual value is compatible with the expected type.
Types can be:
- Primitive types: "string", "number", "boolean", "null", "undefined"
- Semantic types: "email", "url", "date", "phone", "uuid", etc.
- Range descriptions: "positive number", "integer", "non-empty string"

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": [
    { "position": 0, "expected": "expected type", "actual": "actual type found" }
  ]
}

Only include items in issues array if there are actual problems.`;

  return prompt;
}

/**
 * Prompt for explaining tuple
 */
export function createExplainPrompt(
  tuple: unknown[],
  labels?: string[],
  context?: string
): string {
  let prompt = `Provide a human-readable explanation of what this tuple represents.

Tuple: ${JSON.stringify(tuple)}`;

  if (labels?.length) {
    prompt += `\nLabels: ${JSON.stringify(labels)}`;
  }

  if (context) {
    prompt += `\nContext: "${context}"`;
  }

  prompt += `

Create a clear, concise explanation that:
- Identifies what type of data this tuple represents
- Explains what each position means
- Describes the relationship between elements if relevant

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}
