/**
 * Prompts for SemanticString LLM operations
 * Each prompt is designed to return structured JSON output
 */

/**
 * Prompt for semantic equality comparison
 */
export function semanticallyEqualsPrompt(
  str1: string,
  str2: string,
  context?: string
): string {
  const contextPart = context ? `\nContext: ${context}` : '';
  return `You are a semantic comparison expert. Determine if the following two strings have the same meaning.

String 1: "${str1}"
String 2: "${str2}"${contextPart}

Consider:
- Synonyms and paraphrases
- Different phrasings with the same intent
- Context and nuance

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"equivalent": boolean, "confidence": number}

Where:
- equivalent: true if the strings mean the same thing, false otherwise
- confidence: a number between 0 and 1 indicating how confident you are`;
}

/**
 * Prompt for string classification
 */
export function classifyPrompt(
  text: string,
  categories: string[],
  context?: string
): string {
  const contextPart = context ? `\nAdditional context: ${context}` : '';
  return `You are a text classification expert. Classify the following text into exactly one of the provided categories.

Text: "${text}"

Categories: ${categories.map(c => `"${c}"`).join(', ')}${contextPart}

Use semantic understanding to match meaning, not just keywords.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"category": string, "confidence": number}

Where:
- category: the best matching category from the provided list (must be exactly one of the categories)
- confidence: a number between 0 and 1 indicating classification confidence`;
}

/**
 * Prompt for entity extraction
 */
export function extractPrompt(text: string, types: string[]): string {
  return `You are an entity extraction expert. Extract the following types of information from the text.

Text: "${text}"

Types to extract: ${types.map(t => `"${t}"`).join(', ')}

For each type, extract the value if present. If multiple values exist for a type, return them as an array.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{${types.map(t => `"${t}": string | string[] | null`).join(', ')}}

Use null for types that cannot be found in the text.`;
}

/**
 * Prompt for semantic validation
 */
export function validatePrompt(text: string, rules: string[]): string {
  return `You are a text validation expert. Validate the following text against the semantic rules provided.

Text: "${text}"

Rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check if the text violates any of these rules using semantic understanding, not just literal matching.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"valid": boolean, "issues": string[]}

Where:
- valid: true if all rules pass, false if any rule is violated
- issues: array of specific issues found (empty array if valid)`;
}

/**
 * Prompt for intent detection
 */
export function detectIntentPrompt(text: string): string {
  return `You are an intent detection expert. Analyze the following text and determine its intent.

Text: "${text}"

Determine:
1. The primary intent (e.g., "question", "command", "statement", "request", "complaint", "greeting", "farewell")
2. A more specific subtype if applicable (e.g., "how-to", "yes-no", "clarification" for questions)
3. The main topic being discussed

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"intent": string, "subtype": string | null, "topic": string | null, "confidence": number}

Where:
- intent: the primary intent category
- subtype: a more specific classification (or null if not applicable)
- topic: the main subject matter (or null if unclear)
- confidence: a number between 0 and 1`;
}

/**
 * Prompt for language detection
 */
export function detectLanguagePrompt(text: string): string {
  return `You are a language detection expert. Identify the language of the following text.

Text: "${text}"

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"language": string, "confidence": number}

Where:
- language: ISO 639-1 two-letter language code (e.g., "en" for English, "fr" for French, "es" for Spanish)
- confidence: a number between 0 and 1 indicating detection confidence`;
}

/**
 * Prompt for sensitive information detection
 */
export function containsSensitivePrompt(text: string): string {
  return `You are a privacy and security expert. Analyze the following text for sensitive information.

Text: "${text}"

Check for:
- Personal Identifiable Information (PII): SSN, driver's license, passport numbers
- Financial data: credit card numbers, bank account numbers
- Authentication data: passwords, API keys, tokens, secrets
- Contact information: phone numbers, addresses, email addresses
- Health information: medical records, health conditions
- Other sensitive data: dates of birth, biometric data

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"hasSensitive": boolean, "types": string[]}

Where:
- hasSensitive: true if any sensitive information is found
- types: array of types of sensitive information found (e.g., ["ssn", "email", "phone"])`;
}

/**
 * Prompt for semantic similarity scoring
 */
export function similarityPrompt(str1: string, str2: string): string {
  return `You are a semantic similarity expert. Calculate the semantic similarity between these two strings.

String 1: "${str1}"
String 2: "${str2}"

Consider:
- Meaning and intent similarity
- Topic overlap
- Emotional/sentiment alignment
- Contextual relationship

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"similarity": number}

Where similarity is a number between 0 and 1:
- 0: completely unrelated meanings
- 0.5: somewhat related
- 1: identical or nearly identical meaning`;
}

/**
 * Prompt for text summarization
 */
export function summarizePrompt(text: string, maxLength: number): string {
  return `You are a text summarization expert. Summarize the following text while preserving its core meaning.

Text: "${text}"

Requirements:
- Maximum length: ${maxLength} characters
- Preserve the most important information
- Maintain the original tone where possible
- Create a coherent, readable summary

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"summary": string}

Where summary is the condensed version of the text within the character limit.`;
}

/**
 * Prompt for correction suggestions
 */
export function suggestCorrectionsPrompt(text: string): string {
  return `You are a writing assistant expert. Analyze the following text for spelling, grammar, and style issues.

Text: "${text}"

Identify:
- Spelling errors
- Grammar mistakes
- Common word confusion (their/they're/there, its/it's, etc.)
- Punctuation issues

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"corrections": [{"original": string, "suggestion": string, "reason": string}]}

Where each correction object contains:
- original: the word or phrase that needs correction
- suggestion: the corrected version
- reason: brief explanation of the issue

Return an empty array if no corrections are needed.`;
}
