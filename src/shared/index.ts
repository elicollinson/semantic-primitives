/**
 * Shared utilities and types
 */

// Core result types
export {
  type ConfidenceResult,
  type SemanticEqualsResult,
  type SemanticEqualsResultWithReason,
  type SemanticEqualsResultWithMappings,
} from './types.ts';

// Classification types
export {
  type ClassifyResult,
  type InferTypeResult,
  type InferPurposeResult,
} from './types.ts';

// Validation types
export {
  type ValidateResult,
  type ValidateResultWithWarnings,
  type ReasonableResult,
  type AppropriateResult,
} from './types.ts';

// Suggestion types
export {
  type Suggestion,
  type MissingSuggestion,
  type RelatedSuggestion,
  type ImprovementSuggestion,
  type Correction,
} from './types.ts';

// Semantic access types
export {
  type SemanticGetResult,
  type SearchResult,
} from './types.ts';

// Safety and sensitivity types
export {
  type SeverityLevel,
  type ExtendedSeverityLevel,
  type ErrorSeverityLevel,
  type SafetyResult,
  type SensitiveResult,
} from './types.ts';

// Detection and inference types
export {
  type DetectIntentResult,
  type DetectLanguageResult,
  type DetectPatternResult,
  type InferUnitResult,
  type InferDomainResult,
  type InferMeaningResult,
  type InferReasonResult,
  type InferSchemaResult,
} from './types.ts';

// Explanation and description types
export {
  type ExplanationResult,
  type DurationResult,
} from './types.ts';

// Issue and error types
export {
  type DetectedIssue,
  type RootCauseResult,
  type SuggestedFix,
  type RecoveryStrategy,
} from './types.ts';

// Test generation types
export {
  type GeneratedTestCase,
  type RegExpTestCases,
} from './types.ts';
