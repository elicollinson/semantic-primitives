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

// =============================================================================
// INTERFACES
// =============================================================================

// LLM Client
export {
  type LLMClientInterface,
  type LLMCompletionOptions,
} from './interfaces.ts';

// Core base interfaces
export {
  type Semantic,
  type SemanticFactory,
} from './interfaces.ts';

// Capability mixin interfaces
export {
  type Comparable,
  type Explainable,
  type Describable,
  type Validatable,
  type ContextValidatable,
  type PurposeValidatable,
  type TypeInferable,
  type PurposeInferable,
  type SchemaInferable,
  type Classifiable,
  type PatternDetectable,
  type Suggestible,
  type Summarizable,
  type SafetyAssessable,
  type SensitivityDetectable,
} from './interfaces.ts';

// Collection capability interfaces
export {
  type SemanticFilterable,
  type SemanticSortable,
  type SemanticGroupable,
  type SemanticSearchable,
  type SemanticAccessible,
  type SemanticSetOperations,
  type SemanticMergeable,
} from './interfaces.ts';

// Category-specific interfaces
export {
  type SemanticAbsence,
  type SemanticAbsenceFactory,
  type SemanticCollection,
  type SemanticKeyValueCollection,
  type SemanticCallableType,
} from './interfaces.ts';

// Transformation interfaces
export {
  type KeyTransformable,
  type UnitConvertible,
} from './interfaces.ts';

// Test generation interfaces
export {
  type TestGeneratable,
  type RegExpTestGeneratable,
} from './interfaces.ts';

// Error handling interfaces
export { type SemanticErrorType } from './interfaces.ts';

// Composite interfaces
export {
  type SemanticPrimitiveCapabilities,
  type SemanticPrimitiveExtended,
  type SemanticReferenceCapabilities,
} from './interfaces.ts';

// =============================================================================
// BASE CLASSES
// =============================================================================

export {
  SemanticBase,
  ComparableSemanticBase,
  ExplainableSemanticBase,
  ValidatableSemanticBase,
  SemanticCollectionBase,
  SemanticKeyValueBase,
  SemanticCallableBase,
  SemanticAbsenceBase,
  ResultBuilder,
} from './base-classes.ts';

// Type guards
export {
  isSemantic,
  isComparable,
  isExplainable,
  isValidatable,
} from './base-classes.ts';
