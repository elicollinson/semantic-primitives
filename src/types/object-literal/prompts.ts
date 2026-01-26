/**
 * Prompts for SemanticObjectLiteral LLM operations
 * These prompts enable semantic operations on object literal data structures
 */

/**
 * System prompt for object literal semantic operations
 */
export const OBJECT_LITERAL_SYSTEM_PROMPT = `You are a semantic object literal analyzer. Your task is to analyze object literals and their properties to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider property names, values, and their semantic meanings
- Understand common naming conventions (camelCase, snake_case, etc.)
- Recognize synonymous property names (e.g., "email" and "emailAddress")
- Detect domain entities and schemas from object structure
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic equality comparison with property name mappings
 */
export function createSemanticallyEqualsPrompt(
  obj1: object,
  obj2: object
): string {
  return `Compare these two object literals for semantic equivalence.

Object 1: ${JSON.stringify(obj1)}
Object 2: ${JSON.stringify(obj2)}

Consider:
- Property name synonyms (e.g., "firstName" and "first_name" are equivalent)
- Value semantic equivalence (not just strict equality)
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
 * Prompt for schema inference with properties, required/optional
 */
export function createInferSchemaPrompt(obj: object): string {
  return `Infer the schema/type of this object literal.

Object: ${JSON.stringify(obj)}

Analyze:
- What entity/type this object represents
- Each property's type and purpose
- Which properties appear required vs optional based on typical usage patterns

Respond with JSON in this exact format:
{
  "name": "semantic type name (e.g., User, Product, Order)",
  "properties": {
    "propertyName": "data type (string, number, boolean, object, array, etc.)"
  },
  "required": ["list", "of", "required", "property", "names"],
  "optional": ["list", "of", "optional", "property", "names"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validation against natural language rules
 */
export function createValidateWithRulesPrompt(
  obj: object,
  rules: string[]
): string {
  return `Validate this object literal against the given semantic rules.

Object: ${JSON.stringify(obj)}
Validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check each rule and report any violations. A violation should include:
- The rule that was violated
- The field involved (if applicable)
- The reason for the violation

Respond with JSON in this exact format:
{
  "valid": true or false,
  "violations": [
    { "rule": "the rule text", "field": "fieldName or null if not field-specific", "reason": "why it violated" }
  ]
}`;
}

/**
 * Prompt for domain/entity detection
 */
export function createDetectDomainPrompt(obj: object): string {
  return `Detect what domain/entity this object literal represents.

Object: ${JSON.stringify(obj)}

Analyze the structure, property names, and values to determine:
- What domain this object belongs to (e.g., user-profile, e-commerce-product, config)
- How confident you are in this detection
- Optionally, a suggested TypeScript interface name

Respond with JSON in this exact format:
{
  "domain": "domain-name in kebab-case",
  "confidence": 0.0 to 1.0,
  "suggestedInterface": "InterfaceName or null"
}`;
}

/**
 * Prompt for finding properties matching a description
 */
export function createFindPropertiesPrompt(
  obj: object,
  description: string
): string {
  return `Find properties in this object that match the semantic description.

Object: ${JSON.stringify(obj)}
Description: "${description}"

Identify all properties that are semantically related to the description.
For example, "contact information" might match "email", "phone", "address".

Respond with JSON in this exact format:
{
  "matches": [
    { "key": "propertyName", "value": the value, "relevance": 0.0 to 1.0 }
  ]
}

Sort matches by relevance (highest first).`;
}

/**
 * Prompt for suggesting missing properties
 */
export function createSuggestMissingPropertiesPrompt(obj: object): string {
  return `Analyze this object literal and suggest properties that are typically present in similar objects but are missing.

Object: ${JSON.stringify(obj)}

Consider:
- Common fields for this type of object/entity
- Fields that would make the object more complete
- Industry standards and best practices
- Don't suggest properties that would be redundant with existing ones

Respond with JSON in this exact format:
{
  "suggestions": [
    { "property": "suggestedPropertyName", "type": "expected data type", "reason": "why this property would be useful" }
  ]
}`;
}

/**
 * Prompt for checking if a property contains sensitive data
 */
export function createIsSensitivePrompt(
  obj: object,
  propertyPath: string
): string {
  return `Analyze if the specified property contains sensitive data.

Object: ${JSON.stringify(obj)}
Property to check: "${propertyPath}"

Consider these categories of sensitive data:
- PII (Personally Identifiable Information): SSN, passport, driver's license
- Financial: credit cards, bank accounts, salaries
- Authentication: passwords, tokens, API keys, secrets
- Health: medical records, conditions, medications
- Contact: addresses, phone numbers (context-dependent)
- Location: GPS coordinates, precise addresses

Respond with JSON in this exact format:
{
  "sensitive": true or false,
  "type": "type of sensitive data (e.g., PII, financial, authentication) or null if not sensitive",
  "recommendation": "recommended action (e.g., encrypt, mask, redact, hash) or null if not sensitive"
}`;
}

/**
 * Prompt for transforming keys to a naming convention
 */
export function createTransformKeysPrompt(
  obj: object,
  convention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case'
): string {
  return `Transform all property names in this object literal to ${convention} convention.

Object: ${JSON.stringify(obj)}
Target convention: ${convention}

Convert each property name while preserving values. Handle nested objects recursively.

Convention rules:
- camelCase: firstWord lowercase, subsequent words capitalized, no separators
- snake_case: all lowercase, words separated by underscores
- PascalCase: all words capitalized, no separators
- kebab-case: all lowercase, words separated by hyphens

Respond with JSON in this exact format:
{
  "transformed": { the transformed object },
  "keyMappings": { "originalKey": "newKey" }
}`;
}

/**
 * Prompt for generating TypeScript interface
 */
export function createGenerateInterfacePrompt(
  obj: object,
  name: string
): string {
  return `Generate a TypeScript interface for this object literal.

Object: ${JSON.stringify(obj)}
Interface name: "${name}"

Create a well-typed TypeScript interface that:
- Uses appropriate TypeScript types (string, number, boolean, etc.)
- Marks optional properties with ? based on typical usage patterns
- Uses union types where appropriate
- Handles nested objects and arrays properly

Respond with JSON in this exact format:
{
  "interface": "the TypeScript interface code as a string",
  "notes": ["optional notes about type decisions"]
}`;
}

/**
 * Prompt for summarizing object contents
 */
export function createSummarizePrompt(obj: object): string {
  return `Create a human-readable summary of this object literal.

Object: ${JSON.stringify(obj)}

Provide a concise natural language summary that:
- Identifies what type of data this represents
- Highlights key information and values
- Is suitable for display to end users
- Does not expose sensitive data (mask if present)

Respond with JSON in this exact format:
{
  "summary": "Human-readable summary string"
}`;
}
