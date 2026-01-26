/**
 * Prompts for Semantic Stream LLM operations
 * These prompts enable intelligent content analysis, pattern detection, and stream processing
 */

/**
 * System prompt for stream analysis tasks
 */
export const STREAM_SYSTEM_PROMPT = `You are an expert at analyzing streaming data, understanding content types, detecting patterns, and providing semantic insights about data flows.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze stream content to understand its structure and meaning
- Detect patterns, anomalies, and data quality issues
- Consider common data formats: JSON, NDJSON, CSV, XML, binary, text
- Provide meaningful, contextual responses about stream content
- Be precise with confidence scores (0.0 to 1.0)`;

/**
 * Prompt for detecting content type of stream data
 */
export function createDetectContentTypePrompt(
  sample: string,
  description?: string
): string {
  return `Analyze this stream data sample and detect its content type.

${description ? `Stream Description: "${description}"` : ''}
Data Sample:
\`\`\`
${sample}
\`\`\`

Determine:
- The content type (e.g., "json", "ndjson", "csv", "xml", "text", "binary", "html")
- The format variant if applicable (e.g., for json: "object", "array", "ndjson")
- Confidence in the detection

Common patterns:
- Lines starting with { and ending with } → likely NDJSON
- Content wrapped in [] with objects → JSON array
- Comma-separated values with headers → CSV
- Tags with < and > → XML or HTML
- Plain readable text → text

Respond with JSON in this exact format:
{
  "type": "detected content type",
  "format": "format variant or null",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarizing stream contents
 */
export function createSummarizePrompt(
  content: string,
  description?: string
): string {
  return `Summarize the contents of this stream data.

${description ? `Stream Description: "${description}"` : ''}
Stream Content:
\`\`\`
${content}
\`\`\`

Provide a concise summary that includes:
1. Type and structure of the data
2. Key statistics (count of records, unique values, etc.)
3. Notable patterns or insights
4. Any issues or anomalies detected

Keep the summary brief (2-4 sentences) but informative.

Respond with JSON in this exact format:
{
  "summary": "concise summary string"
}`;
}

/**
 * Prompt for checking semantic equivalence between two streams
 */
export function createSemanticEqualsPrompt(
  content1: string,
  content2: string,
  description?: string
): string {
  return `Compare these two stream contents for semantic equivalence.

${description ? `Stream Description: "${description}"` : ''}

Stream 1:
\`\`\`
${content1}
\`\`\`

Stream 2:
\`\`\`
${content2}
\`\`\`

Determine if the streams are semantically equivalent:
- Same data with different formatting → equivalent
- Same meaning with different representation → equivalent
- Different data or conflicting meaning → not equivalent
- Consider order, whitespace, and formatting as potentially equivalent

Respond with JSON in this exact format:
{
  "equivalent": true | false,
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation"
}`;
}

/**
 * Prompt for filtering stream data based on criteria
 */
export function createSemanticFilterPrompt(
  item: string,
  criteria: string,
  description?: string
): string {
  return `Determine if this stream item matches the given semantic criteria.

${description ? `Stream Description: "${description}"` : ''}
Criteria: "${criteria}"

Item:
\`\`\`
${item}
\`\`\`

Examples of criteria matching:
- "error messages" matches items containing error information
- "high priority" matches items with urgent/important indicators
- "user data" matches items containing personal or user-related info
- "recent activity" matches items with recent timestamps

Respond with JSON in this exact format:
{
  "matches": true | false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for transforming stream data
 */
export function createSemanticTransformPrompt(
  item: string,
  instruction: string,
  description?: string
): string {
  return `Transform this stream item according to the given instruction.

${description ? `Stream Description: "${description}"` : ''}
Instruction: "${instruction}"

Input Item:
\`\`\`
${item}
\`\`\`

Apply the transformation as specified. If the item cannot be transformed according to the instruction, return null for the result.

Respond with JSON in this exact format:
{
  "result": transformed_value_or_null,
  "success": true | false
}`;
}

/**
 * Prompt for validating stream data against rules
 */
export function createValidatePrompt(
  item: string,
  rules: string[],
  description?: string
): string {
  return `Validate this stream item against the given rules.

${description ? `Stream Description: "${description}"` : ''}

Rules:
${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

Item:
\`\`\`
${item}
\`\`\`

Check each rule and report any violations.

Respond with JSON in this exact format:
{
  "valid": true | false,
  "issues": ["array of rule violations, empty if valid"]
}`;
}

/**
 * Prompt for explaining stream contents
 */
export function createExplainPrompt(
  sample: string,
  description?: string
): string {
  return `Explain what this stream contains in human-readable terms.

${description ? `Stream Description: "${description}"` : ''}
Data Sample:
\`\`\`
${sample}
\`\`\`

Provide a clear, concise explanation that:
1. Describes the data structure and format
2. Identifies the apparent purpose or use case
3. Notes any important characteristics

Keep it brief (1-2 sentences).

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation"
}`;
}

/**
 * Prompt for detecting patterns in stream data
 */
export function createDetectPatternsPrompt(
  content: string,
  description?: string
): string {
  return `Analyze this stream data for patterns and anomalies.

${description ? `Stream Description: "${description}"` : ''}
Stream Content:
\`\`\`
${content}
\`\`\`

Detect:
1. Recurring patterns (e.g., "values follow daily cycle", "monotonically increasing")
2. Anomalies or outliers with their position in the data
3. Data quality issues

Respond with JSON in this exact format:
{
  "patterns": ["array of detected patterns"],
  "anomalies": [
    {"index": number_or_approximate_position, "reason": "why this is anomalous"}
  ]
}`;
}

/**
 * Prompt for inferring schema from stream data
 */
export function createInferSchemaPrompt(
  sample: string,
  description?: string
): string {
  return `Infer the schema of the data elements in this stream.

${description ? `Stream Description: "${description}"` : ''}
Data Sample:
\`\`\`
${sample}
\`\`\`

Analyze the structure and infer:
- The type of each element (object, array, primitive)
- For objects: the properties and their types
- Confidence in the inference

Respond with JSON in this exact format:
{
  "type": "object" | "array" | "string" | "number" | "boolean" | "null" | "mixed",
  "properties": {"property_name": "type"} | null,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for explaining a transform operation
 */
export function createExplainTransformPrompt(instruction: string): string {
  return `Explain what this transform instruction does in plain terms.

Instruction: "${instruction}"

Provide a clear, concise explanation of:
1. What transformation will be applied
2. Expected input format
3. Expected output format

Keep it brief (1-2 sentences).

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation of the transform"
}`;
}

/**
 * Prompt for validating data before writing to a stream
 */
export function createWriteValidationPrompt(
  data: string,
  rules: string[]
): string {
  return `Validate this data before writing to the stream.

Validation Rules:
${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

Data to Write:
\`\`\`
${data}
\`\`\`

Check all rules and determine if the data is valid for writing.

Respond with JSON in this exact format:
{
  "valid": true | false,
  "issues": ["array of validation failures, empty if valid"]
}`;
}
