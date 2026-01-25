/**
 * SemanticRegExp module
 * Exports the SemanticRegExp class and related types
 */

// Main class export
export { SemanticRegExp, type FromOptions, type TestWithExplanationResult, type SimplifyResult } from './regexp.ts';

// Re-export shared types used by this module
export type {
  SemanticEqualsResult,
  ImprovementSuggestion,
  RegExpTestCases,
  ValidateResultWithWarnings,
  RelatedSuggestion,
  InferTypeResult,
} from '../../shared/types.ts';
