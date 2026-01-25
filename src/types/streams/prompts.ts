/**
 * Prompts for SemanticStream LLM operations
 * These prompts enable semantic operations on stream data
 */

/**
 * System prompt for stream semantic operations
 */
export const STREAM_SYSTEM_PROMPT = `You are a semantic stream analyzer. Your task is to analyze streaming data to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider data content, types, patterns, and structure
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis
- Handle both text and binary stream data descriptions`;

/**
 * Prompt for semantic equality comparison between two stream contents
 */
export function createSemanticallyEqualsPrompt(
  content1: string,
  content2: string
): string {
  return `Compare these two stream contents for semantic equivalence.

Stream 1 Content:
${content1}

Stream 2 Content:
${content2}

Consider:
- Whether the data represents the same semantic meaning
- Order and structure similarity
- Overall content purpose

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for detecting content type of stream data
 */
export function createDetectContentTypePrompt(sample: string): string {
  return `Analyze this stream data sample and detect its content type and format.

Sample data:
${sample}

Determine:
- The primary content type (e.g., "json", "text", "binary", "csv", "xml", "html")
- The specific format if applicable (e.g., "ndjson", "utf-8", "base64")

Respond with JSON in this exact format:
{
  "type": "content type name",
  "format": "specific format or null",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for summarizing stream contents
 */
export function createSummarizePrompt(content: string): string {
  return `Summarize the following stream contents.

Stream Contents:
${content}

Provide a concise, human-readable summary that captures:
- The overall nature of the data
- Key statistics or metrics (counts, sizes, patterns)
- Notable characteristics

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary here",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic filtering criteria evaluation
 */
export function createSemanticFilterPrompt(
  chunk: string,
  criteria: string
): string {
  return `Evaluate if this data chunk matches the given semantic filter criteria.

Data Chunk:
${chunk}

Filter Criteria: "${criteria}"

Determine if this chunk should be included based on the semantic meaning of the criteria.

Respond with JSON in this exact format:
{
  "matches": true or false,
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for semantic transformation
 */
export function createSemanticTransformPrompt(
  chunk: string,
  instruction: string
): string {
  return `Transform this data chunk according to the given instruction.

Data Chunk:
${chunk}

Transformation Instruction: "${instruction}"

Apply the transformation semantically to produce the output.

Respond with JSON in this exact format:
{
  "transformed": "transformed data here",
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating stream data against rules
 */
export function createValidatePrompt(
  chunk: string,
  rules: string[]
): string {
  return `Validate this data chunk against the given semantic rules.

Data Chunk:
${chunk}

Validation Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check the data against all rules and report any violations.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["issue 1", "issue 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for explaining stream contents
 */
export function createExplainPrompt(sample: string, description?: string): string {
  let prompt = `Explain what this stream contains based on the sample data.

Sample Data:
${sample}`;

  if (description) {
    prompt += `\n\nStream Description: "${description}"`;
  }

  prompt += `

Provide a clear, human-readable explanation of:
- What type of data the stream contains
- The structure and format of the data
- The likely purpose or source

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation here",
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for detecting patterns in stream data
 */
export function createDetectPatternsPrompt(content: string): string {
  return `Analyze this stream data and detect any patterns or anomalies.

Stream Data:
${content}

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
 * Prompt for inferring schema of stream elements
 */
export function createInferSchemaPrompt(sample: string): string {
  return `Analyze this stream data sample and infer the schema of its elements.

Sample Data:
${sample}

Determine:
- The primary type of elements (e.g., "object", "array", "string", "number")
- Properties/fields if elements are objects
- The structure and relationships

Respond with JSON in this exact format:
{
  "type": "element type",
  "properties": {
    "field1": "type1",
    "field2": "type2"
  },
  "confidence": 0.0 to 1.0
}

Note: Only include "properties" if the type is "object".`;
}

/**
 * Prompt for explaining a transform stream's operation
 */
export function createExplainTransformPrompt(instruction: string): string {
  return `Explain what this transformation instruction does to stream data.

Transformation Instruction: "${instruction}"

Provide a clear, technical explanation of:
- What the transformation does
- How it modifies the data
- What input and output types are expected

Respond with JSON in this exact format:
{
  "explanation": "Technical explanation here",
  "inputType": "expected input type",
  "outputType": "expected output type",
  "confidence": 0.0 to 1.0
}`;
}
