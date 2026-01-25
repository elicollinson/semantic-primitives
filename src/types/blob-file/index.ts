/**
 * SemanticBlob and SemanticFile Module
 * LLM-enhanced Blob and File types with semantic understanding
 */

// SemanticBlob - main class and types
export {
  SemanticBlob,
  type BlobSemanticEqualsResult,
  type ContentTypeResult,
  type AnalyzeResult,
  type ValidateForResult,
  type SafetyResult,
  type BlobLLMClientInterface,
} from './blob.ts';

// SemanticFile - main class and types
export {
  SemanticFile,
  type FilenameValidationResult,
  type ExtensionValidationResult,
  type CategoryResult,
  type FilenameSuggestionResult,
  type FileLLMClientInterface,
} from './file.ts';

// Re-export shared types used by this module
export type { SemanticEqualsResult } from '../../shared/types.ts';
