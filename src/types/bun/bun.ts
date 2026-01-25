/**
 * SemanticBun - LLM-enhanced Bun-specific APIs with semantic understanding
 *
 * Provides intelligent wrappers around Bun's file operations, server configuration,
 * shell commands, and environment variable management.
 *
 * Core capabilities:
 * - SemanticBunFile: File operations with content detection and explanation
 * - SemanticServer: Server configuration analysis and suggestions
 * - SemanticShell: Shell command safety checking and explanation
 * - SemanticEnv: Environment variable validation and semantic lookup
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type { ValidateResult } from '../../shared/types.ts';
import {
  DETECT_FILE_TYPE_SYSTEM,
  detectFileTypePrompt,
  EXPLAIN_FILE_SYSTEM,
  explainFilePrompt,
  VALIDATE_FILE_FOR_SYSTEM,
  validateFileForPrompt,
  ANALYZE_SERVER_CONFIG_SYSTEM,
  analyzeServerConfigPrompt,
  SUGGEST_SERVER_CONFIG_SYSTEM,
  suggestServerConfigPrompt,
  IS_COMMAND_SAFE_SYSTEM,
  isCommandSafePrompt,
  EXPLAIN_COMMAND_SYSTEM,
  explainCommandPrompt,
  SUGGEST_SAFER_COMMAND_SYSTEM,
  suggestSaferCommandPrompt,
  VALIDATE_ENV_SYSTEM,
  validateEnvPrompt,
  DETECT_SENSITIVE_ENV_SYSTEM,
  detectSensitiveEnvPrompt,
  GET_ENV_SEMANTIC_SYSTEM,
  getEnvSemanticPrompt,
} from './prompts.ts';

// Re-export shared types
export type { ValidateResult } from '../../shared/types.ts';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Result of file type detection */
export interface FileTypeResult {
  type: string;
  subtype?: string;
  confidence: number;
}

/** Result of server configuration analysis */
export interface ServerConfigAnalysis {
  secure: boolean;
  issues: string[];
  suggestions: string[];
}

/** Result of command safety assessment */
export interface CommandSafetyResult {
  safe: boolean;
  reason?: string;
  risks: string[];
}

/** Suggestion for a safer command alternative */
export interface SaferCommandSuggestion {
  command: string;
  reason: string;
}

/** Result of environment variable validation */
export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  suggestions: { variable: string; example: string }[];
}

/** Result of sensitive environment detection */
export interface SensitiveEnvResult {
  sensitive: string[];
  recommendation: string;
}

/** LLM client interface for dependency injection */
export interface BunLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

// =============================================================================
// SEMANTIC FILE REFERENCE
// =============================================================================

/**
 * SemanticBunFileRef - A reference to a file with semantic capabilities
 *
 * Provides LLM-enhanced operations on file references including:
 * - Type detection with semantic understanding
 * - Content explanation
 * - Purpose-based validation
 * - Standard file operations (text, json, exists)
 */
export class SemanticBunFileRef {
  private readonly _path: string;
  private readonly _llmClient: BunLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticBunFileRef instance
   * @param path - The file path
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    path: string,
    llmClient?: BunLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._path = path;
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Get the file path
   */
  get path(): string {
    return this._path;
  }

  /**
   * Detect the file type semantically.
   *
   * @returns File type detection with confidence
   *
   * @example
   * await fileRef.detectType()
   * // { type: "json", subtype: "package-json", confidence: 0.95 }
   */
  async detectType(): Promise<FileTypeResult> {
    let contentPreview: string | undefined;

    try {
      const file = Bun.file(this._path);
      if (await file.exists()) {
        const content = await file.text();
        // Take first 500 characters as preview
        contentPreview = content.slice(0, 500);
      }
    } catch {
      // If we can't read the file, proceed with just the path
    }

    const messages: Message[] = [
      {
        role: 'user',
        content: detectFileTypePrompt(this._path, contentPreview),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DETECT_FILE_TYPE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as FileTypeResult;
  }

  /**
   * Read and explain the file contents.
   *
   * @returns Human-readable explanation of the file
   *
   * @example
   * await fileRef.explain()
   * // "Node.js package.json with 15 dependencies, configured for TypeScript"
   */
  async explain(): Promise<string> {
    const file = Bun.file(this._path);
    const content = await file.text();

    const messages: Message[] = [
      {
        role: 'user',
        content: explainFilePrompt(this._path, content),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: EXPLAIN_FILE_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Validate file contents for a specific purpose.
   *
   * @param purpose - Intended use of the file
   * @returns Validation result with issues
   *
   * @example
   * await fileRef.validateFor("production deployment")
   * // { valid: false, issues: ["Contains development dependencies"] }
   */
  async validateFor(purpose: string): Promise<ValidateResult> {
    const file = Bun.file(this._path);
    const content = await file.text();

    const messages: Message[] = [
      {
        role: 'user',
        content: validateFileForPrompt(this._path, content, purpose),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: VALIDATE_FILE_FOR_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Read file as text with encoding detection.
   *
   * @returns File content as string
   */
  async text(): Promise<string> {
    const file = Bun.file(this._path);
    return file.text();
  }

  /**
   * Read and parse JSON with validation.
   *
   * @returns Parsed JSON content
   */
  async json<T>(): Promise<T> {
    const file = Bun.file(this._path);
    return file.json() as Promise<T>;
  }

  /**
   * Check if file exists and is accessible.
   *
   * @returns true if file exists
   */
  async exists(): Promise<boolean> {
    const file = Bun.file(this._path);
    return file.exists();
  }
}

// =============================================================================
// SEMANTIC SERVER
// =============================================================================

/**
 * Analyze server configuration for issues.
 *
 * @param config - Server configuration object
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Configuration analysis with issues and suggestions
 *
 * @example
 * analyzeServerConfig({ port: 3000 })
 * // { secure: false, issues: ["No HTTPS configured"], suggestions: [...] }
 */
export async function analyzeServerConfig(
  config: object,
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<ServerConfigAnalysis> {
  const client = llmClient || { chat };
  const configStr = JSON.stringify(config, null, 2);

  const messages: Message[] = [
    {
      role: 'user',
      content: analyzeServerConfigPrompt(configStr),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: ANALYZE_SERVER_CONFIG_SYSTEM,
    ...llmConfig,
  });

  return JSON.parse(response.content) as ServerConfigAnalysis;
}

/**
 * Suggest optimal server configuration.
 *
 * @param requirements - Server requirements
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Suggested server configuration
 *
 * @example
 * suggestServerConfig({ purpose: "REST API", scale: "medium" })
 */
export async function suggestServerConfig(
  requirements: { purpose: string; scale?: 'small' | 'medium' | 'large' },
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<object> {
  const client = llmClient || { chat };

  const messages: Message[] = [
    {
      role: 'user',
      content: suggestServerConfigPrompt(requirements.purpose, requirements.scale),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: SUGGEST_SERVER_CONFIG_SYSTEM,
    ...llmConfig,
  });

  return JSON.parse(response.content) as object;
}

// =============================================================================
// SEMANTIC SHELL
// =============================================================================

/**
 * Check if a shell command is safe to execute.
 *
 * @param command - Command to check
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Safety assessment with risks
 *
 * @example
 * isCommandSafe("rm -rf /")
 * // { safe: false, reason: "Destructive command targeting root directory", risks: [...] }
 */
export async function isCommandSafe(
  command: string,
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<CommandSafetyResult> {
  const client = llmClient || { chat };

  const messages: Message[] = [
    {
      role: 'user',
      content: isCommandSafePrompt(command),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: IS_COMMAND_SAFE_SYSTEM,
    ...llmConfig,
  });

  return JSON.parse(response.content) as CommandSafetyResult;
}

/**
 * Explain what a shell command does.
 *
 * @param command - Command to explain
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Human-readable explanation
 *
 * @example
 * explainCommand("find . -name '*.ts' | xargs wc -l")
 * // "Counts total lines of code in all TypeScript files recursively"
 */
export async function explainCommand(
  command: string,
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<string> {
  const client = llmClient || { chat };

  const messages: Message[] = [
    {
      role: 'user',
      content: explainCommandPrompt(command),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: EXPLAIN_COMMAND_SYSTEM,
    ...llmConfig,
  });

  const result = JSON.parse(response.content) as { explanation: string };
  return result.explanation;
}

/**
 * Suggest a safer alternative for a command.
 *
 * @param command - Command to improve
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Safer alternative or null if already safe
 *
 * @example
 * suggestSaferCommand("rm file.txt")
 * // { command: "rm -i file.txt", reason: "Interactive mode prevents accidental deletion" }
 */
export async function suggestSaferCommand(
  command: string,
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<SaferCommandSuggestion | null> {
  const client = llmClient || { chat };

  const messages: Message[] = [
    {
      role: 'user',
      content: suggestSaferCommandPrompt(command),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: SUGGEST_SAFER_COMMAND_SYSTEM,
    ...llmConfig,
  });

  const result = JSON.parse(response.content) as { command: string | null; reason: string };

  if (result.command === null) {
    return null;
  }

  return { command: result.command, reason: result.reason };
}

// =============================================================================
// SEMANTIC ENV
// =============================================================================

/**
 * Validate environment configuration.
 *
 * @param required - Required environment variable names
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Validation result with missing variables and suggestions
 *
 * @example
 * validateEnv(["DATABASE_URL", "API_KEY"])
 * // { valid: false, missing: ["API_KEY"], suggestions: [...] }
 */
export async function validateEnv(
  required: string[],
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<EnvValidationResult> {
  const client = llmClient || { chat };
  const currentEnv = Object.keys(Bun.env);

  const messages: Message[] = [
    {
      role: 'user',
      content: validateEnvPrompt(required, currentEnv),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: VALIDATE_ENV_SYSTEM,
    ...llmConfig,
  });

  return JSON.parse(response.content) as EnvValidationResult;
}

/**
 * Detect sensitive environment variables.
 *
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Sensitive variable analysis with recommendations
 *
 * @example
 * detectSensitiveEnv()
 * // { sensitive: ["DATABASE_URL", "API_KEY"], recommendation: "Use secrets manager" }
 */
export async function detectSensitiveEnv(
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<SensitiveEnvResult> {
  const client = llmClient || { chat };
  const envNames = Object.keys(Bun.env);

  const messages: Message[] = [
    {
      role: 'user',
      content: detectSensitiveEnvPrompt(envNames),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: DETECT_SENSITIVE_ENV_SYSTEM,
    ...llmConfig,
  });

  return JSON.parse(response.content) as SensitiveEnvResult;
}

/**
 * Get an env variable with semantic fallback.
 *
 * @param nameOrDescription - Variable name or semantic description
 * @param llmClient - Optional LLM client for dependency injection
 * @param llmConfig - Optional LLM configuration
 * @returns Variable value or undefined
 *
 * @example
 * getEnv("database connection string")
 * // Matches DATABASE_URL, DB_CONNECTION, etc.
 */
export async function getEnv(
  nameOrDescription: string,
  llmClient?: BunLLMClientInterface,
  llmConfig?: LLMConfig
): Promise<string | undefined> {
  // First try direct lookup
  const directValue = Bun.env[nameOrDescription];
  if (directValue !== undefined) {
    return directValue;
  }

  // Fall back to semantic matching
  const client = llmClient || { chat };
  const envNames = Object.keys(Bun.env);

  const messages: Message[] = [
    {
      role: 'user',
      content: getEnvSemanticPrompt(nameOrDescription, envNames),
    },
  ];

  const response = await client.chat({
    messages,
    systemPrompt: GET_ENV_SEMANTIC_SYSTEM,
    ...llmConfig,
  });

  const result = JSON.parse(response.content) as { matchedVariable: string | null; confidence: number };

  if (result.matchedVariable && result.confidence > 0.5) {
    return Bun.env[result.matchedVariable];
  }

  return undefined;
}

// =============================================================================
// SEMANTIC BUN NAMESPACE
// =============================================================================

/**
 * SemanticBun - Unified namespace for all semantic Bun operations
 */
export const SemanticBun = {
  /**
   * Create a semantic file reference.
   *
   * @param path - File path
   * @param llmClient - Optional LLM client
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticBunFileRef instance
   *
   * @example
   * const config = await SemanticBun.file("config.json").json()
   */
  file(path: string, llmClient?: BunLLMClientInterface, llmConfig?: LLMConfig): SemanticBunFileRef {
    return new SemanticBunFileRef(path, llmClient, llmConfig);
  },

  // Server operations
  analyzeServerConfig,
  suggestServerConfig,

  // Shell operations
  isCommandSafe,
  explainCommand,
  suggestSaferCommand,

  // Environment operations
  validateEnv,
  detectSensitiveEnv,
  getEnv,
};
