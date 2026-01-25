/**
 * Prompts for SemanticBun LLM operations
 * These prompts are used for various semantic Bun API operations that require LLM understanding
 */

// =============================================================================
// FILE OPERATIONS
// =============================================================================

/**
 * System prompt for file type detection
 */
export const DETECT_FILE_TYPE_SYSTEM = `You are a file type detection assistant. Your task is to analyze file paths, names, and optionally content to determine the file type.

Consider:
- File extension and common naming patterns
- Content structure if provided (JSON, YAML, XML, etc.)
- Common configuration file patterns (package.json, tsconfig.json, .env, etc.)
- Source code file patterns
- Document and media file types

Always respond with valid JSON only.`;

/**
 * User prompt template for file type detection
 */
export function detectFileTypePrompt(path: string, contentPreview?: string): string {
  const contentPart = contentPreview ? `\n\nContent preview:\n${contentPreview}` : '';
  return `Detect the type of this file.

File path: ${path}${contentPart}

Respond with JSON in this exact format:
{"type": "<file type category>", "subtype": "<specific type if applicable>", "confidence": <0-1>}

Example types: json, javascript, typescript, markdown, yaml, configuration, image, etc.
Example subtypes: package-json, tsconfig, eslint-config, etc.`;
}

/**
 * System prompt for file content explanation
 */
export const EXPLAIN_FILE_SYSTEM = `You are a file content explanation assistant. Your task is to explain what a file contains and its purpose in human-readable terms.

Consider:
- The file's purpose in a project context
- Key configuration or content elements
- Dependencies, scripts, or important settings
- Potential issues or notable configurations

Provide concise, informative explanations.

Always respond with valid JSON only.`;

/**
 * User prompt template for file explanation
 */
export function explainFilePrompt(path: string, content: string): string {
  return `Explain the contents of this file.

File path: ${path}
Content:
${content}

Respond with JSON in this exact format:
{"explanation": "<human-readable explanation of the file's contents and purpose>"}`;
}

/**
 * System prompt for file validation for purpose
 */
export const VALIDATE_FILE_FOR_SYSTEM = `You are a file validation assistant. Your task is to validate file contents for specific use cases and purposes.

Consider:
- Required fields or configurations for the purpose
- Security concerns (exposed secrets, debug settings, etc.)
- Best practices for the file type
- Production vs development configurations
- Missing or incorrect settings

Always respond with valid JSON only.`;

/**
 * User prompt template for purpose validation
 */
export function validateFileForPrompt(path: string, content: string, purpose: string): string {
  return `Validate this file for the specified purpose.

File path: ${path}
Purpose: ${purpose}
Content:
${content}

Respond with JSON in this exact format:
{"valid": <boolean>, "issues": [<list of issues found>]}`;
}

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

/**
 * System prompt for server configuration analysis
 */
export const ANALYZE_SERVER_CONFIG_SYSTEM = `You are a Bun server configuration analyst. Your task is to analyze Bun.serve() configurations for security, performance, and best practices.

Consider:
- HTTPS/TLS configuration
- CORS settings
- Rate limiting
- Request validation
- Error handling
- WebSocket configuration
- Development vs production settings
- Port and hostname security

Always respond with valid JSON only.`;

/**
 * User prompt template for server config analysis
 */
export function analyzeServerConfigPrompt(config: string): string {
  return `Analyze this Bun.serve() configuration for issues and improvements.

Configuration:
${config}

Respond with JSON in this exact format:
{"secure": <boolean>, "issues": [<list of security or configuration issues>], "suggestions": [<list of improvement suggestions>]}`;
}

/**
 * System prompt for server configuration suggestions
 */
export const SUGGEST_SERVER_CONFIG_SYSTEM = `You are a Bun server configuration expert. Your task is to suggest optimal server configurations based on requirements.

Consider:
- Purpose (REST API, static files, WebSocket, etc.)
- Scale requirements
- Security best practices
- Performance optimizations
- Common middleware needs

Always respond with valid JSON only.`;

/**
 * User prompt template for server config suggestions
 */
export function suggestServerConfigPrompt(purpose: string, scale?: 'small' | 'medium' | 'large'): string {
  const scalePart = scale ? `\nScale: ${scale}` : '';
  return `Suggest an optimal Bun.serve() configuration for these requirements.

Purpose: ${purpose}${scalePart}

Respond with JSON representing a Bun.serve() configuration object. Include relevant options like:
- port
- hostname
- development settings if appropriate
- any recommended middleware patterns
- security headers

Format: A valid JSON object that could be passed to Bun.serve()`;
}

// =============================================================================
// SHELL OPERATIONS
// =============================================================================

/**
 * System prompt for command safety assessment
 */
export const IS_COMMAND_SAFE_SYSTEM = `You are a shell command safety analyst. Your task is to assess whether shell commands are safe to execute.

Consider these risk factors:
- Destructive operations (rm, del, format, etc.)
- System-wide impact (sudo, admin commands)
- Data exfiltration risks
- Privilege escalation
- Network operations
- File permission changes
- Environment variable exposure
- Command injection vulnerabilities
- Piping to dangerous commands

Classify risks by severity and provide clear explanations.

Always respond with valid JSON only.`;

/**
 * User prompt template for command safety check
 */
export function isCommandSafePrompt(command: string): string {
  return `Assess the safety of this shell command.

Command: ${command}

Respond with JSON in this exact format:
{"safe": <boolean>, "reason": "<explanation if not safe>", "risks": [<list of identified risks>]}`;
}

/**
 * System prompt for command explanation
 */
export const EXPLAIN_COMMAND_SYSTEM = `You are a shell command explanation assistant. Your task is to explain what shell commands do in human-readable terms.

Consider:
- The main command and its purpose
- All flags and options
- Piped commands and their effects
- Redirections and their targets
- Environment variables used
- Overall effect of the command

Provide clear, concise explanations suitable for developers.

Always respond with valid JSON only.`;

/**
 * User prompt template for command explanation
 */
export function explainCommandPrompt(command: string): string {
  return `Explain what this shell command does.

Command: ${command}

Respond with JSON in this exact format:
{"explanation": "<human-readable explanation of what the command does>"}`;
}

/**
 * System prompt for safer command suggestions
 */
export const SUGGEST_SAFER_COMMAND_SYSTEM = `You are a shell command safety advisor. Your task is to suggest safer alternatives to potentially risky shell commands.

Consider:
- Interactive modes for destructive operations
- Dry-run options
- Backup strategies
- More specific targeting
- Permission restrictions
- Safer alternatives that achieve the same goal

Always respond with valid JSON only.`;

/**
 * User prompt template for safer command suggestion
 */
export function suggestSaferCommandPrompt(command: string): string {
  return `Suggest a safer alternative to this shell command, if one exists.

Command: ${command}

Respond with JSON in this exact format:
{"command": "<safer alternative command>", "reason": "<explanation of why it's safer>"}

If the command is already safe or no safer alternative exists, respond with:
{"command": null, "reason": "Command is already safe" | "No safer alternative available"}`;
}

// =============================================================================
// ENVIRONMENT OPERATIONS
// =============================================================================

/**
 * System prompt for environment validation
 */
export const VALIDATE_ENV_SYSTEM = `You are an environment variable validation assistant. Your task is to validate that required environment variables are properly configured.

Consider:
- Presence of required variables
- Correct naming conventions
- Common environment variable patterns
- Suggestions for missing variables

Always respond with valid JSON only.`;

/**
 * User prompt template for environment validation
 */
export function validateEnvPrompt(required: string[], currentEnv: string[]): string {
  return `Validate that the required environment variables are present.

Required variables: ${JSON.stringify(required)}
Current environment variables: ${JSON.stringify(currentEnv)}

Respond with JSON in this exact format:
{"valid": <boolean>, "missing": [<list of missing variables>], "suggestions": [{"variable": "<var name>", "example": "<example value>"}]}`;
}

/**
 * System prompt for sensitive env detection
 */
export const DETECT_SENSITIVE_ENV_SYSTEM = `You are a security analyst for environment variables. Your task is to identify sensitive environment variables that should be protected.

Sensitive variables typically include:
- API keys and tokens
- Database credentials
- Encryption keys and secrets
- OAuth credentials
- Private keys
- Connection strings with credentials
- Service account credentials

Always respond with valid JSON only.`;

/**
 * User prompt template for sensitive env detection
 */
export function detectSensitiveEnvPrompt(envNames: string[]): string {
  return `Identify which of these environment variables are likely sensitive and should be protected.

Environment variables: ${JSON.stringify(envNames)}

Respond with JSON in this exact format:
{"sensitive": [<list of sensitive variable names>], "recommendation": "<security recommendation>"}`;
}

/**
 * System prompt for semantic env lookup
 */
export const GET_ENV_SEMANTIC_SYSTEM = `You are an environment variable matching assistant. Your task is to match semantic descriptions to environment variable names.

Consider:
- Common naming conventions (DATABASE_URL, DB_URL, DB_CONNECTION)
- Abbreviations and variations
- Purpose-based naming
- Service-specific patterns

Always respond with valid JSON only.`;

/**
 * User prompt template for semantic env lookup
 */
export function getEnvSemanticPrompt(description: string, availableEnvs: string[]): string {
  return `Find the environment variable that best matches this semantic description.

Description: ${description}
Available variables: ${JSON.stringify(availableEnvs)}

Respond with JSON in this exact format:
{"matchedVariable": "<variable name or null if no match>", "confidence": <0-1>}`;
}
