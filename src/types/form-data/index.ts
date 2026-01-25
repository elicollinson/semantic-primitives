/**
 * SemanticFormData Module
 * LLM-enhanced FormData type with semantic understanding
 */

// Main class and types
export {
  SemanticFormData,
  type FormDataSemanticEqualsResult,
  type FormDataValidateResult,
  type FormDataSemanticGetResult,
  type FormDataInferPurposeResult,
  type FormDataDetectSensitiveResult,
  type FormDataMissingSuggestion,
  type FileValidationRules,
  type FormDataFileValidateResult,
  type FormDataLLMClientInterface,
} from './form-data.ts';

// Re-export shared types used by this module
export type { SemanticEqualsResult } from '../../shared/types.ts';
