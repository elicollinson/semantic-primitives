/**
 * Semantic Types
 * LLM-enhanced reference and structural types
 */

// SemanticArray
export {
  SemanticArray,
  type ArraySemanticEqualsOptions,
  type SemanticSearchOptions,
  type SummarizeOptions,
  type SemanticUniqueOptions,
  type ArrayValidateResult,
  type ArrayInferTypeResult,
  type ArrayDetectPatternResult,
} from './array/index.ts';

// SemanticError
export {
  SemanticError,
  type ErrorClassifyResult,
  type ResourceSuggestion,
  type ReportRecommendation,
  type SemanticEqualsResultWithReason,
  type RootCauseResult,
  type SuggestedFix,
  type RecoveryStrategy,
  type ErrorSeverityLevel,
} from './error/index.ts';
