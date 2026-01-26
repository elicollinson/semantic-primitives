/**
 * Prompts for SemanticConstructable LLM operations
 * These prompts enable semantic operations on constructor/class types
 */

/**
 * System prompt for constructable semantic operations
 */
export const CONSTRUCTABLE_SYSTEM_PROMPT = `You are a semantic constructor analyzer. Your task is to analyze TypeScript/JavaScript constructors and classes to provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze constructor signatures, parameter types, and instance shapes
- Understand common design patterns (factory, builder, singleton, etc.)
- Recognize constructor conventions and best practices
- Provide confidence scores from 0.0 to 1.0
- Be precise and consistent in your analysis`;

/**
 * Prompt for semantic equality comparison between constructors
 */
export function createSemanticallyEqualsPrompt(
  ctor1Source: string,
  ctor1Name: string,
  ctor2Source: string,
  ctor2Name: string,
  testArgs?: unknown[][]
): string {
  const argsSection = testArgs
    ? `\nTest arguments to compare instances:\n${testArgs.map((args, i) => `  ${i + 1}. ${JSON.stringify(args)}`).join('\n')}`
    : '';

  return `Compare these two constructors/classes for semantic equivalence.

Constructor 1 (${ctor1Name}):
${ctor1Source}

Constructor 2 (${ctor2Name}):
${ctor2Source}
${argsSection}

Consider:
- Do they create instances with the same shape/properties?
- Do they accept semantically equivalent parameters?
- Do the created instances have the same methods/behavior?
- Are there any meaningful differences in functionality?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "instanceDifferences": ["list of differences in instance shape/behavior"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for validating constructor arguments
 */
export function createValidateArgsPrompt(
  ctorSource: string,
  ctorName: string,
  args: unknown[],
  rules?: string[]
): string {
  const rulesSection = rules?.length
    ? `\nAdditional validation rules:\n${rules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`
    : '';

  return `Validate the constructor arguments for ${ctorName}.

Constructor:
${ctorSource}

Arguments to validate: ${JSON.stringify(args)}
${rulesSection}

Check:
- Type compatibility with constructor parameters
- Value constraints (e.g., non-empty strings, positive numbers)
- Business logic requirements from the rules
- Common validation issues (null, undefined, wrong types)

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["list of validation issues found"]
}`;
}

/**
 * Prompt for analyzing instance shape
 */
export function createAnalyzeInstanceShapePrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Analyze the shape of instances created by the constructor ${ctorName}.

Constructor:
${ctorSource}

Determine:
- What properties are assigned to instances
- What methods are available on instances
- What prototype chain/inheritance is used

Respond with JSON in this exact format:
{
  "properties": { "propertyName": "type description" },
  "methods": ["list of method names"],
  "instanceOf": ["class names in prototype chain"]
}`;
}

/**
 * Prompt for explaining what a constructor creates
 */
export function createExplainPrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Explain what the constructor ${ctorName} creates.

Constructor:
${ctorSource}

Provide a clear, human-readable explanation of:
- What kind of object this creates
- What the constructor parameters represent
- What the created instance can do

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation of what this constructor creates"
}`;
}

/**
 * Prompt for detecting design patterns
 */
export function createDetectPatternsPrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Detect design patterns used by the constructor ${ctorName}.

Constructor:
${ctorSource}

Look for patterns such as:
- Builder pattern (fluent interface, method chaining)
- Factory pattern (creates different types based on input)
- Singleton pattern (only one instance exists)
- Prototype pattern (cloning objects)
- Decorator pattern (wrapping/enhancing objects)
- Observer pattern (event handling)
- Strategy pattern (interchangeable algorithms)

Respond with JSON in this exact format:
{
  "patterns": ["list of detected pattern names"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Prompt for generating documentation
 */
export function createGenerateDocsPrompt(
  ctorSource: string,
  ctorName: string,
  format: 'jsdoc' | 'markdown' | 'plain'
): string {
  const formatInstructions = {
    jsdoc: 'JSDoc format with @param, @returns, @example tags',
    markdown: 'Markdown format with headers, lists, and code blocks',
    plain: 'Plain text format suitable for display',
  };

  return `Generate documentation for the constructor ${ctorName}.

Constructor:
${ctorSource}

Generate documentation in ${format} format (${formatInstructions[format]}).

Include:
- Description of what the constructor creates
- Parameter descriptions and types
- Usage examples
- Notes about the created instance

Respond with JSON in this exact format:
{
  "documentation": "The generated documentation string"
}`;
}

/**
 * Prompt for suggesting improvements
 */
export function createSuggestImprovementsPrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Suggest improvements for the constructor ${ctorName}.

Constructor:
${ctorSource}

Consider:
- Parameter validation (null checks, type checks)
- Error handling
- Default parameter values
- Documentation
- TypeScript typing improvements
- Code organization and readability
- Performance considerations
- Security considerations

Respond with JSON in this exact format:
{
  "suggestions": [
    { "suggestion": "What to improve", "reason": "Why this improvement helps" }
  ]
}`;
}
