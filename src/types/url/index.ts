/**
 * SemanticURL Module
 * LLM-enhanced URL type with semantic understanding
 */

// Main class and types
export {
  SemanticURL,
  type URLSemanticEqualsResult,
  type URLClassifyResult,
  type URLValidateForResult,
  type ParsedQueryParam,
  type URLLLMClientInterface,
} from './url.ts';

// Re-export shared types used by this module
export type {
  SemanticEqualsResult,
  ClassifyResult,
  SafetyResult,
  RelatedSuggestion,
} from '../../shared/types.ts';
