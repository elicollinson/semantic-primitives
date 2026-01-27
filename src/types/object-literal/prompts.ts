/**
 * Prompts for SemanticObjectLiteral LLM operations
 * These prompts enable semantic operations on object literal data structures
 */

/**
 * System prompt for object literal semantic operations
 */
export const OBJECT_LITERAL_SYSTEM_PROMPT = `You are a semantic object literal analyzer. Your task is to analyze ad-hoc object structures and their properties to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider property names, values, and their semantic meanings
- Understand common naming conventions (camelCase, snake_case, etc.)
- Recognize synonymous property names (e.g., "email" and "emailAddress")
- Detect patterns that indicate domain/entity types
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic equality comparison with property mappings
 */
export function createSemanticallyEqualsPrompt(obj1: object, obj2: object): string {
  return `Compare these two object literals for semantic equivalence.

Object 1: ${JSON.stringify(obj1)}
Object 2: ${JSON.stringify(obj2)}

Consider:
- Property name synonyms (e.g., "firstName" and "first_name" are equivalent)
- Value semantic equivalence (same meaning, possibly different format)
- Overall structural similarity
- Missing properties that don't affect semantic meaning

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "mappings": { "obj1Key": "obj2Key" },
  "confidence": 0.0 to 1.0
}

The mappings object should show how properties from Object 1 map to Object 2.`;
}

/**
 * Prompt for schema inference
 */
export function createInferSchemaPrompt(obj: object): string {
  return `Infer the semantic schema of this object literal.

Object: ${JSON.stringify(obj)}

Analyze:
- Determine a descriptive name for this type of object
- Each property's data type and purpose
- Which properties appear required vs optional based on common patterns

Respond with JSON in this exact format:
{
  "name": "descriptive name for this object type (e.g., UserProfile, OrderDetails)",
  "properties": {
    "propertyName": "TypeScript type (string, number, boolean, etc.)"
  },
  "required": ["list", "of", "required", "properties"],
  "optional": ["list", "of", "optional", "properties"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validation against semantic rules
 */
export function createValidateWithRulesPrompt(obj: object, rules: string[]): string {
  return `Validate the object literal against the given semantic rules.

Object: ${JSON.stringify(obj)}
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each rule and report any violations. A rule violation should identify which field (if any) is problematic.

Respond with JSON in this exact format:
{
  "valid": true or false,
  "violations": [
    { "rule": "the original rule text", "field": "fieldName or null if not field-specific", "reason": "why it violated the rule" }
  ]
}`;
}

/**
 * Prompt for domain/entity detection
 */
export function createDetectDomainPrompt(obj: object): string {
  return `Detect what domain or entity this object literal represents.

Object: ${JSON.stringify(obj)}

Analyze the structure, property names, and values to determine:
- What domain this object belongs to (e.g., user-profile, e-commerce, analytics)
- How confident you are in this assessment
- Optionally suggest a TypeScript interface definition

Respond with JSON in this exact format:
{
  "domain": "domain identifier (e.g., user-profile, e-commerce-order, api-response, config)",
  "confidence": 0.0 to 1.0,
  "suggestedInterface": "interface Name { ... } or null if not confident enough"
}`;
}

/**
 * Prompt for finding properties by semantic description
 */
export function createFindPropertiesPrompt(obj: object, description: string): string {
  return `Find properties in this object that match the semantic description.

Object: ${JSON.stringify(obj)}
Looking for: "${description}"

Find all properties that semantically relate to the description. Consider:
- Exact matches
- Synonyms and related concepts
- Nested properties that relate to the description
- Partial matches

Respond with JSON in this exact format:
{
  "matches": [
    { "key": "propertyKey", "value": the actual value, "relevance": 0.0 to 1.0 }
  ]
}

Order matches by relevance (highest first). Only include matches with relevance >= 0.5.`;
}

/**
 * Prompt for suggesting missing properties
 */
export function createSuggestMissingPropertiesPrompt(obj: object): string {
  return `Analyze this object literal and suggest properties that are typically present in similar objects but are missing.

Object: ${JSON.stringify(obj)}

Consider:
- Common fields for this type of object
- Fields that would make the object more complete
- Industry standards and best practices
- Only suggest truly useful additions, not everything possible

Respond with JSON in this exact format:
{
  "suggestions": [
    { "property": "suggestedPropertyName", "type": "TypeScript type", "reason": "why this property would be useful" }
  ]
}

Limit to 5 most important suggestions.`;
}

/**
 * Prompt for sensitive data detection
 */
export function createIsSensitivePrompt(obj: object, propertyPath: string): string {
  return `Analyze if the specified property contains sensitive data.

Object: ${JSON.stringify(obj)}
Property to check: "${propertyPath}"

Consider these categories of sensitive data:
- PII (Personally Identifiable Information): SSN, passport, driver's license, date of birth
- Financial: credit cards, bank accounts, salaries, tax info
- Authentication: passwords, tokens, API keys, secrets
- Health: medical records, conditions, medications
- Contact: full addresses, phone numbers (context-dependent)

Respond with JSON in this exact format:
{
  "sensitive": true or false,
  "type": "type of sensitive data (e.g., PII, financial, authentication, health) or null if not sensitive",
  "recommendation": "recommended action (e.g., encrypt, mask, redact, hash) or null if not sensitive"
}`;
}

/**
 * Prompt for key transformation
 */
export function createTransformKeysPrompt(
  obj: object,
  convention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case'
): string {
  return `Transform all property names in this object literal to ${convention} convention.

Object: ${JSON.stringify(obj)}
Target convention: ${convention}

Convert each property name while preserving values. Handle nested objects recursively.

Convention examples:
- camelCase: firstName, lastName, emailAddress
- snake_case: first_name, last_name, email_address
- PascalCase: FirstName, LastName, EmailAddress
- kebab-case: first-name, last-name, email-address

Respond with JSON in this exact format:
{
  "transformed": { the transformed object with all keys in new convention }
}`;
}

/**
 * Prompt for TypeScript interface generation
 */
export function createGenerateInterfacePrompt(obj: object, name: string): string {
  return `Generate a TypeScript interface for this object literal.

Object: ${JSON.stringify(obj)}
Interface name: ${name}

Analyze each property to determine:
- The most appropriate TypeScript type
- Whether it should be optional (?) based on common patterns
- JSDoc comments for non-obvious properties

Respond with JSON in this exact format:
{
  "interface": "the complete TypeScript interface code as a string"
}

The interface should be properly formatted and ready to use in TypeScript code.`;
}

/**
 * Prompt for summarization
 */
export function createSummarizePrompt(obj: object): string {
  return `Create a human-readable summary of this object literal.

Object: ${JSON.stringify(obj)}

Provide a concise natural language summary that:
- Identifies what type of data this represents
- Highlights the most important information
- Is suitable for display to end users
- Is 1-2 sentences maximum

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary string"
}`;
}
