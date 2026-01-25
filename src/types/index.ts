/**
 * Semantic Types
 * LLM-enhanced reference and structural types
 */

// Shared types
export { type SemanticEqualsResult, type DurationResult, type InferMeaningResult } from '../shared/types.ts';

// SemanticDate
export {
  SemanticDate,
  type ParseDateOptions,
  type DatePrecision,
  type DateSemanticEqualsOptions,
  type DateLLMClientInterface,
} from './date/index.ts';

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

// SemanticMap
export {
  SemanticMap,
  type SemanticMergeOptions,
  type MapValidationRules,
  type FindKeyResult,
  type FindValueResult,
  type MapSemanticEqualsResult,
  type SemanticGetResult,
  type ValidateResult,
  type MissingSuggestion,
  type InferPurposeResult,
} from './map/index.ts';
