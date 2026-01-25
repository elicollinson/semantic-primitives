# SemanticBun (Bun-specific APIs)

## Overview

The `SemanticBun` namespace wraps Bun-specific APIs with LLM-powered semantic understanding. It provides intelligent file operations, server configuration analysis, and shell command safety checking.

**Core Principle**: Bun APIs represent high-performance runtime operations - semantic operations should understand file contents, validate configurations, and ensure command safety.

---

## Interface

```typescript
namespace SemanticBun {
  /**
   * Semantic wrapper for Bun.file operations.
   */
  interface SemanticBunFile {
    /**
     * Read a file with automatic content detection and parsing.
     *
     * @param path - File path
     * @returns Semantic file wrapper
     *
     * @example
     * const config = await SemanticBun.file("config.json").json()
     */
    static file(path: string): SemanticBunFileRef;
  }

  interface SemanticBunFileRef {
    /**
     * Detect the file type semantically.
     *
     * @returns File type detection
     *
     * @example
     * await fileRef.detectType()
     * // { type: "json", subtype: "package-json", confidence: 0.95 }
     */
    detectType(): Promise<{
      type: string;
      subtype?: string;
      confidence: number;
    }>;

    /**
     * Read and explain the file contents.
     *
     * @returns File explanation
     *
     * @example
     * await fileRef.explain()
     * // "Node.js package.json with 15 dependencies, configured for TypeScript"
     */
    explain(): Promise<string>;

    /**
     * Validate file contents for a purpose.
     *
     * @param purpose - Intended use of the file
     * @returns Validation result
     *
     * @example
     * await fileRef.validateFor("production deployment")
     * // { valid: false, issues: ["Contains development dependencies"] }
     */
    validateFor(purpose: string): Promise<{
      valid: boolean;
      issues: string[];
    }>;

    /**
     * Read as text with encoding detection.
     */
    text(): Promise<string>;

    /**
     * Read and parse JSON with validation.
     */
    json<T>(): Promise<T>;

    /**
     * Check if file exists and is accessible.
     */
    exists(): Promise<boolean>;
  }

  /**
   * Semantic wrapper for Bun.serve configuration.
   */
  interface SemanticServer {
    /**
     * Analyze server configuration for issues.
     *
     * @param config - Server configuration
     * @returns Configuration analysis
     *
     * @example
     * SemanticBun.analyzeServerConfig({ port: 3000 })
     * // { secure: false, issues: ["No HTTPS configured"], suggestions: [...] }
     */
    static analyzeServerConfig(config: object): {
      secure: boolean;
      issues: string[];
      suggestions: string[];
    };

    /**
     * Suggest optimal server configuration.
     *
     * @param requirements - Server requirements
     * @returns Suggested configuration
     *
     * @example
     * SemanticBun.suggestServerConfig({ purpose: "REST API", scale: "medium" })
     */
    static suggestServerConfig(requirements: {
      purpose: string;
      scale?: "small" | "medium" | "large";
    }): object;
  }

  /**
   * Semantic wrapper for Bun shell operations.
   */
  interface SemanticShell {
    /**
     * Check if a shell command is safe to execute.
     *
     * @param command - Command to check
     * @returns Safety assessment
     *
     * @example
     * SemanticBun.isCommandSafe("rm -rf /")
     * // { safe: false, reason: "Destructive command targeting root directory" }
     */
    static isCommandSafe(command: string): {
      safe: boolean;
      reason?: string;
      risks: string[];
    };

    /**
     * Explain what a shell command does.
     *
     * @param command - Command to explain
     * @returns Human-readable explanation
     *
     * @example
     * SemanticBun.explainCommand("find . -name '*.ts' | xargs wc -l")
     * // "Counts total lines of code in all TypeScript files recursively"
     */
    static explainCommand(command: string): string;

    /**
     * Suggest a safer alternative for a command.
     *
     * @param command - Command to improve
     * @returns Safer alternative
     *
     * @example
     * SemanticBun.suggestSaferCommand("rm file.txt")
     * // { command: "rm -i file.txt", reason: "Interactive mode prevents accidental deletion" }
     */
    static suggestSaferCommand(command: string): {
      command: string;
      reason: string;
    } | null;
  }

  /**
   * Semantic wrapper for Bun.env operations.
   */
  interface SemanticEnv {
    /**
     * Validate environment configuration.
     *
     * @param required - Required environment variables
     * @returns Validation result
     *
     * @example
     * SemanticBun.validateEnv(["DATABASE_URL", "API_KEY"])
     * // { valid: false, missing: ["API_KEY"], suggestions: [...] }
     */
    static validateEnv(required: string[]): {
      valid: boolean;
      missing: string[];
      suggestions: Array<{ variable: string; example: string }>;
    };

    /**
     * Detect sensitive environment variables.
     *
     * @returns Sensitive variable analysis
     *
     * @example
     * SemanticBun.detectSensitiveEnv()
     * // { sensitive: ["DATABASE_URL", "API_KEY"], recommendation: "Use secrets manager" }
     */
    static detectSensitiveEnv(): {
      sensitive: string[];
      recommendation: string;
    };

    /**
     * Get an env variable with semantic fallback.
     *
     * @param name - Variable name or semantic description
     * @returns Variable value
     *
     * @example
     * SemanticBun.getEnv("database connection string")
     * // Matches DATABASE_URL, DB_CONNECTION, etc.
     */
    static getEnv(name: string): string | undefined;
  }
}
```

---

## Implementation Notes

### Architecture

The implementation follows the existing patterns in the codebase:

- **File Structure**: Located at `src/types/bun/` with the standard layout:
  - `bun.ts` - Main implementation with all classes and functions
  - `prompts.ts` - LLM prompt templates for semantic operations
  - `index.ts` - Module exports
  - `__tests__/bun.test.ts` - Comprehensive test suite with mocked LLM

### Key Design Decisions

1. **Unified Namespace**: All functionality is exposed through the `SemanticBun` namespace object which provides:
   - `file(path)` - Returns a `SemanticBunFileRef` instance
   - Direct access to server, shell, and env functions

2. **Dependency Injection**: All functions accept an optional `BunLLMClientInterface` parameter for testing. This follows the pattern used by `SemanticURL` and other types.

3. **File Operations**: `SemanticBunFileRef` wraps Bun's native `Bun.file()` API:
   - `detectType()` - Uses LLM to analyze file path and content preview
   - `explain()` - Provides human-readable file content explanation
   - `validateFor(purpose)` - Purpose-based validation
   - `text()`, `json()`, `exists()` - Direct Bun.file passthrough methods

4. **Environment Operations**:
   - `getEnv()` first tries direct lookup, then falls back to semantic matching
   - Confidence threshold of 0.5 for semantic matches

### Prompts

All prompts follow the established patterns:
- System prompts define the assistant's role and response format
- User prompts provide the specific input and expected JSON structure
- All responses are structured as JSON for reliable parsing

### Testing

The test suite includes 46 tests covering:
- All public API methods
- Edge cases (non-existent files, unsafe commands, missing env vars)
- Integration workflows combining multiple operations
- Mock LLM responses to avoid real API calls

### Exports

The module is exported from:
- `src/types/bun/index.ts` - Module-level exports
- `src/types/index.ts` - Re-exported as part of the types module
- `src/index.ts` - Available from main package entry point

### Dependencies

- Uses Bun's native APIs: `Bun.file()`, `Bun.env`
- LLM client from `../../llm/index.ts`
- Shared types: `ValidateResult` from `../../shared/types.ts`
