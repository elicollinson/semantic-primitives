/**
 * SemanticBun Module
 * LLM-enhanced Bun-specific APIs with semantic understanding
 */

// Main exports
export {
  SemanticBun,
  SemanticBunFileRef,
  analyzeServerConfig,
  suggestServerConfig,
  isCommandSafe,
  explainCommand,
  suggestSaferCommand,
  validateEnv,
  detectSensitiveEnv,
  getEnv,
  type FileTypeResult,
  type ServerConfigAnalysis,
  type CommandSafetyResult,
  type SaferCommandSuggestion,
  type EnvValidationResult,
  type SensitiveEnvResult,
  type BunLLMClientInterface,
} from './bun.ts';

// Re-export shared types used by this module
export type { ValidateResult } from '../../shared/types.ts';
