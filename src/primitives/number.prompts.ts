/**
 * Prompts for SemanticNumber LLM operations
 * These prompts are used for various semantic number operations that require LLM understanding
 */

/**
 * System prompt for number parsing operations
 */
export const PARSE_NUMBER_SYSTEM = `You are a number parsing assistant. Your task is to extract numeric values from natural language or formatted strings.

Rules:
- Parse words (e.g., "twenty-five" -> 25)
- Parse abbreviations (e.g., "2.5k" -> 2500, "1M" -> 1000000)
- Parse formatted numbers (e.g., "$1,234.56" -> 1234.56)
- Parse approximate terms (e.g., "about a dozen" -> 12, "a few" -> 3)
- Handle fractions (e.g., "half" -> 0.5, "a quarter" -> 0.25)
- Return null if the input cannot be parsed as a number

Always respond with valid JSON only.`;

/**
 * User prompt template for parsing numbers
 */
export function parseNumberPrompt(input: string, context?: string): string {
  const contextPart = context ? `\nContext: ${context}` : '';
  return `Parse the following input into a numeric value.${contextPart}

Input: "${input}"

Respond with JSON in this exact format:
{"value": <number or null>, "confidence": <0-1>, "interpretation": "<brief explanation>"}`;
}

/**
 * System prompt for semantic equality comparison
 */
export const SEMANTIC_EQUALS_SYSTEM = `You are a number comparison assistant. Your task is to determine if two numbers are semantically equivalent based on context and tolerance.

Consider:
- Approximate equivalence when tolerance is "approximate"
- Exact equivalence when tolerance is "exact"
- Numeric tolerance when a number is provided
- Context matters: in some domains small differences matter more than others

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic equality
 */
export function semanticEqualsPrompt(
  value1: number,
  value2: number,
  tolerance: 'exact' | 'approximate' | number
): string {
  const toleranceDesc =
    tolerance === 'exact'
      ? 'exact match only'
      : tolerance === 'approximate'
        ? 'approximately equal (within reasonable range)'
        : `within ${tolerance} numeric tolerance`;

  return `Compare these two numbers for semantic equivalence.

Number 1: ${value1}
Number 2: ${value2}
Tolerance: ${toleranceDesc}

Respond with JSON in this exact format:
{"equivalent": <boolean>, "confidence": <0-1>, "reasoning": "<brief explanation>"}`;
}

/**
 * System prompt for reasonableness validation
 */
export const IS_REASONABLE_SYSTEM = `You are a validation assistant. Your task is to determine if a given number is reasonable for a specific context.

Consider:
- Physical constraints (e.g., human age rarely exceeds 120)
- Logical constraints (e.g., quantities cannot be negative)
- Domain-specific norms (e.g., typical salary ranges)
- Common sense expectations

Always respond with valid JSON only.`;

/**
 * User prompt template for reasonableness check
 */
export function isReasonablePrompt(value: number, context: string): string {
  return `Determine if this number is reasonable for the given context.

Number: ${value}
Context: ${context}

Respond with JSON in this exact format:
{"reasonable": <boolean>, "explanation": "<clear explanation of why it is or isn't reasonable>"}`;
}

/**
 * System prompt for unit inference
 */
export const INFER_UNIT_SYSTEM = `You are a unit inference assistant. Your task is to infer the most likely unit for a number based on its value and context.

Consider:
- The numeric value (e.g., 72 for body temperature suggests Fahrenheit in US)
- The context provided (e.g., "body temperature", "speed limit")
- Regional conventions (e.g., US uses Fahrenheit, Europe uses Celsius)
- Domain-specific standards (e.g., scientific measurements)

Always respond with valid JSON only.`;

/**
 * User prompt template for unit inference
 */
export function inferUnitPrompt(value: number, context: string): string {
  return `Infer the most likely unit for this number based on its value and context.

Number: ${value}
Context: ${context}

Respond with JSON in this exact format:
{"unit": "<inferred unit>", "confidence": <0-1>, "reasoning": "<brief explanation>"}`;
}

/**
 * System prompt for unit conversion
 */
export const CONVERT_UNIT_SYSTEM = `You are a unit conversion assistant. Your task is to convert numbers between different units.

You must:
- Apply correct conversion formulas
- Handle temperature conversions (C to F: multiply by 9/5 and add 32)
- Handle length conversions (m to ft, km to mi, etc.)
- Handle weight conversions (kg to lb, etc.)
- Handle any other standard unit conversions

Always respond with valid JSON only.`;

/**
 * User prompt template for unit conversion
 */
export function convertUnitPrompt(value: number, fromUnit: string, toUnit: string): string {
  return `Convert this number from one unit to another.

Value: ${value}
From unit: ${fromUnit}
To unit: ${toUnit}

Respond with JSON in this exact format:
{"value": <converted number>, "fromUnit": "${fromUnit}", "toUnit": "${toUnit}", "formula": "<conversion formula used>"}`;
}

/**
 * System prompt for number description
 */
export const DESCRIBE_NUMBER_SYSTEM = `You are a number description assistant. Your task is to provide human-friendly descriptions of numbers, explaining their magnitude in understandable terms.

Consider:
- Large numbers: use words like "million", "billion"
- Time-based context: convert seconds to readable durations
- Contextual comparisons: relate to familiar concepts
- Keep descriptions concise but informative

Always respond with valid JSON only.`;

/**
 * User prompt template for describing numbers
 */
export function describeNumberPrompt(value: number, context?: string): string {
  const contextPart = context ? `\nContext: ${context}` : '';
  return `Provide a human-friendly description of this number's magnitude.${contextPart}

Number: ${value}

Respond with JSON in this exact format:
{"description": "<human-readable description>", "magnitude": "<e.g., 'millions', 'thousands', etc.>"}`;
}
