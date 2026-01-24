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

// SemanticFunction
export {
  SemanticFunction,
  type ValidateResult,
  type InferPurposeResult,
  type ImprovementSuggestion,
  type DetectedIssue,
  type GeneratedTestCase,
  type SafetyResult,
} from './function/index.ts';

// SemanticMap
export {
  SemanticMap,
  type SemanticGetResult,
  type SemanticEqualsResultWithMappings,
  type SearchResult,
  type MissingSuggestion,
  type FindKeysResult,
  type FindValuesResult,
  type SemanticMergeOptions,
  type MapValidationRules,
} from './map/index.ts';

// SemanticSet
export {
  SemanticSet,
  type SetSemanticEqualsResult,
  type SetValidateResult,
  type InferThemeResult,
  type RelatedSuggestion,
  type ConfidenceResult,
} from './set/index.ts';

// SemanticPromise
export {
  SemanticPromise,
  type PromiseStatus,
  type RetryOptions,
  type InferOperationResult,
} from './promise/index.ts';

// SemanticRegExp
export {
  SemanticRegExp,
  type RegExpTestCases,
  type ValidateResultWithWarnings,
  type InferTypeResult,
  type TestWithExplanationResult,
  type SimplifyResult,
  type RegExpRelatedSuggestion,
  type RegExpImprovementSuggestion,
} from './regexp/index.ts';

// SemanticURL
export {
  SemanticURL,
  type ClassifyResult,
  type URLSemanticEqualsResult,
  type URLClassifyResult,
  type URLValidateResult,
  type ParsedQueryParam,
} from './url/index.ts';

// SemanticObject
export {
  SemanticObject,
  type InferSchemaResult,
  type SensitiveResult,
  type ObjectValidateResult,
  type ObjectMergeOptions,
  type KeyConvention,
} from './object/index.ts';
