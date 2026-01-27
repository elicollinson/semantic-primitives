/**
 * Prompts for SemanticConstructable LLM operations
 * These prompts enable semantic analysis of constructor functions and classes
 */

/**
 * System prompt for constructable semantic operations
 */
export const CONSTRUCTABLE_SYSTEM_PROMPT = `You are a semantic constructor analyzer. Your task is to analyze JavaScript/TypeScript class constructors and provide semantic understanding.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Consider constructor signatures, parameter types, and instance shapes
- Analyze design patterns, class relationships, and best practices
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
  testArgsStr?: string
): string {
  let prompt = `Compare these two constructors for semantic equivalence.

Constructor 1 (${ctor1Name}):
${ctor1Source}

Constructor 2 (${ctor2Name}):
${ctor2Source}`;

  if (testArgsStr) {
    prompt += `

Test arguments to consider: ${testArgsStr}`;
  }

  prompt += `

Analyze:
- Do they create instances with the same semantic structure?
- Do they have equivalent parameter signatures?
- Would instances created by both constructors be interchangeable?

Respond with JSON in this exact format:
{
  "equivalent": true or false,
  "instanceDifferences": ["difference 1", "difference 2"],
  "confidence": 0.0 to 1.0
}`;

  return prompt;
}

/**
 * Prompt for validating constructor arguments
 */
export function createValidateArgsPrompt(
  ctorSource: string,
  ctorName: string,
  argsStr: string,
  rules?: string[]
): string {
  let prompt = `Validate the following constructor arguments.

Constructor (${ctorName}):
${ctorSource}

Arguments to validate: ${argsStr}`;

  if (rules && rules.length > 0) {
    prompt += `

Additional validation rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  prompt += `

Analyze:
- Are the arguments valid for this constructor?
- Do they match expected types and constraints?
- Do they violate any validation rules?

Respond with JSON in this exact format:
{
  "valid": true or false,
  "issues": ["issue 1", "issue 2"]
}`;

  return prompt;
}

/**
 * Prompt for analyzing instance shape
 */
export function createAnalyzeInstanceShapePrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Analyze the shape of instances created by this constructor.

Constructor (${ctorName}):
${ctorSource}

Determine:
- What properties will instances have?
- What methods will instances have?
- What is the prototype chain (instanceof relationships)?

Respond with JSON in this exact format:
{
  "properties": {
    "propertyName": "type description",
    "anotherProperty": "type description"
  },
  "methods": ["method1", "method2"],
  "instanceOf": ["ClassName", "ParentClass", "Object"]
}`;
}

/**
 * Prompt for explaining what a constructor creates
 */
export function createExplainPrompt(
  ctorSource: string,
  ctorName: string,
  description?: string
): string {
  let prompt = `Explain what this constructor creates.

Constructor (${ctorName}):
${ctorSource}`;

  if (description) {
    prompt += `

Provided description: "${description}"`;
  }

  prompt += `

Provide a clear, human-readable explanation of:
- What kind of instances this constructor creates
- The purpose and behavior of the instances
- Key properties and methods

Respond with JSON in this exact format:
{
  "explanation": "Human-readable explanation here"
}`;

  return prompt;
}

/**
 * Prompt for detecting design patterns
 */
export function createDetectPatternsPrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Analyze this constructor for design patterns.

Constructor (${ctorName}):
${ctorSource}

Look for patterns such as:
- Factory Method
- Builder
- Singleton
- Prototype
- Abstract Factory
- Dependency Injection
- Repository
- Value Object
- Entity
- Aggregate

Respond with JSON in this exact format:
{
  "patterns": ["pattern 1", "pattern 2"],
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
    markdown: 'Markdown format with headers, code blocks, and bullet points',
    plain: 'Plain text format with clear paragraphs and indentation',
  };

  return `Generate documentation for this constructor.

Constructor (${ctorName}):
${ctorSource}

Output format: ${formatInstructions[format]}

Include:
- Description of what the constructor creates
- Parameter documentation with types and descriptions
- Usage examples
- Return value description

Respond with JSON in this exact format:
{
  "documentation": "Generated documentation here"
}`;
}

/**
 * Prompt for suggesting improvements
 */
export function createSuggestImprovementsPrompt(
  ctorSource: string,
  ctorName: string
): string {
  return `Analyze this constructor and suggest improvements.

Constructor (${ctorName}):
${ctorSource}

Consider:
- Parameter validation
- Error handling
- Type safety
- Code clarity
- Best practices
- Performance optimizations
- Maintainability

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "suggestion": "What to improve",
      "reason": "Why this improvement helps"
    }
  ]
}`;
}

/**
 * Prompt for validating instance type
 */
export function createIsInstancePrompt(
  ctorSource: string,
  ctorName: string,
  instanceStr: string
): string {
  return `Determine if this value could be an instance of the constructor.

Constructor (${ctorName}):
${ctorSource}

Value to check:
${instanceStr}

Analyze:
- Does the value have the expected shape for instances of this constructor?
- Does it have the expected properties and methods?
- Is it structurally compatible?

Respond with JSON in this exact format:
{
  "isInstance": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "Explanation of why or why not"
}`;
}
