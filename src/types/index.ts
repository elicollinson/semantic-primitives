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

// SemanticPromise
export {
  SemanticPromise,
  type PromiseState,
  type PromiseStatus,
  type InferredOperation,
  type RetryOptions,
  type ValidationResult,
  type SemanticErrorAnalysis,
} from './promise/index.ts';

// SemanticRegExp
export {
  SemanticRegExp,
  type FromOptions as RegExpFromOptions,
  type TestWithExplanationResult,
  type SimplifyResult,
  type ImprovementSuggestion,
  type RegExpTestCases,
  type ValidateResultWithWarnings,
  type RelatedSuggestion,
  type InferTypeResult,
} from './regexp/index.ts';

// SemanticURL
export {
  SemanticURL,
  type URLSemanticEqualsResult,
  type URLClassifyResult,
  type URLValidateForResult,
  type ParsedQueryParam,
  type URLLLMClientInterface,
} from './url/index.ts';

// SemanticObject
export {
  SemanticObject,
  type ObjectValidateResult,
  type SemanticMergeOptions as ObjectSemanticMergeOptions,
  type KeyConvention,
  type SemanticEqualsResultWithMappings,
  type SemanticGetResult as ObjectSemanticGetResult,
  type InferSchemaResult,
  type MissingSuggestion as ObjectMissingSuggestion,
  type InferTypeResult as ObjectInferTypeResult,
  type SensitiveResult,
} from './object/index.ts';

// SemanticMap
export {
  SemanticMap,
  type SemanticMergeOptions as MapSemanticMergeOptions,
  type MapValidationRules,
  type FindKeyResult,
  type FindValueResult,
  type MapSemanticEqualsResult,
  type SemanticGetResult as MapSemanticGetResult,
  type ValidateResult,
  type MissingSuggestion as MapMissingSuggestion,
  type InferPurposeResult,
} from './map/index.ts';

// SemanticSet
export {
  SemanticSet,
  type SemanticHasResult,
  type SemanticAddResult,
  type SetSemanticEqualsResult,
  type SetSummarizeOptions,
  type SetValidateResult,
  type InferThemeResult,
} from './set/index.ts';

// SemanticStream types
export {
  SemanticReadableStream,
  SemanticWritableStream,
  SemanticTransformStream,
  type ContentTypeResult,
  type StreamPatternResult,
  type StreamSchemaResult,
  type StreamValidationResult,
  type WriteStats,
  type TransformExplanation,
} from './streams/index.ts';
