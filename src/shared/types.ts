/**
 * Shared types used across semantic primitives
 */

// =============================================================================
// CORE RESULT TYPES
// =============================================================================

/**
 * Base interface for results that include a confidence score.
 * Used across all semantic primitives.
 */
export interface ConfidenceResult {
  confidence: number;
}

/**
 * Result of semantic equality comparison.
 * Used by: SemanticString, SemanticNumber, SemanticBoolean, SemanticBigInt,
 * SemanticNull, SemanticUndefined, SemanticSymbol, SemanticArray, SemanticObject,
 * SemanticMap, SemanticSet, SemanticDate, SemanticError, SemanticURL, SemanticRegExp,
 * SemanticPromise, SemanticFunction, SemanticTuple, SemanticRecord, SemanticCallable,
 * SemanticConstructable, SemanticObjectLiteral
 */
export interface SemanticEqualsResult extends ConfidenceResult {
  equivalent: boolean;
}

/**
 * Extended semantic equals result with additional context.
 * Used by: SemanticSymbol, SemanticError, SemanticTuple
 */
export interface SemanticEqualsResultWithReason extends SemanticEqualsResult {
  reason?: string;
  note?: string;
}

/**
 * Extended semantic equals result with key/value mappings.
 * Used by: SemanticObject, SemanticMap, SemanticSet, SemanticRecord, SemanticObjectLiteral
 */
export interface SemanticEqualsResultWithMappings extends SemanticEqualsResult {
  mappings?: Record<string, string>;
}

// =============================================================================
// CLASSIFICATION TYPES
// =============================================================================

/**
 * Result of semantic classification into categories.
 * Used by: SemanticString, SemanticSymbol, SemanticURL, SemanticError
 */
export interface ClassifyResult extends ConfidenceResult {
  category: string;
  subcategory?: string;
}

/**
 * Result of detecting/inferring the type of a value.
 * Used by: SemanticObject, SemanticArray, SemanticSet, SemanticRegExp, SemanticUnknown
 */
export interface InferTypeResult extends ConfidenceResult {
  type: string;
}

/**
 * Result of inferring purpose or intent.
 * Used by: SemanticFunction, SemanticMap, SemanticRecord, SemanticCallable
 */
export interface InferPurposeResult extends ConfidenceResult {
  purpose: string;
  category?: string;
  subcategory?: string;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Basic validation result with issues list.
 * Used by: SemanticString, SemanticFunction, SemanticCallable, SemanticSymbol
 */
export interface ValidateResult {
  valid: boolean;
  issues: string[];
}

/**
 * Validation result with warnings in addition to issues.
 * Used by: SemanticRegExp, SemanticSymbol
 */
export interface ValidateResultWithWarnings extends ValidateResult {
  warnings: string[];
}

/**
 * Result of checking if a value is reasonable for a context.
 * Used by: SemanticNumber, SemanticBigInt, SemanticDate
 */
export interface ReasonableResult {
  reasonable: boolean;
  explanation?: string;
  reason?: string;
}

/**
 * Result of checking if something is appropriate for a use case.
 * Used by: SemanticSymbol, SemanticNull, SemanticVoid
 */
export interface AppropriateResult {
  appropriate: boolean;
  reason: string;
}

// =============================================================================
// SUGGESTION TYPES
// =============================================================================

/**
 * A single suggestion with reason.
 * Used by: SemanticObject, SemanticMap, SemanticSet, SemanticRecord
 */
export interface Suggestion {
  suggestion?: string;
  reason: string;
}

/**
 * Suggestion for a missing field/key.
 * Used by: SemanticObject, SemanticMap, SemanticRecord
 */
export interface MissingSuggestion {
  field?: string;
  key?: string;
  property?: string;
  reason: string;
}

/**
 * Suggestion for related items.
 * Used by: SemanticSet, SemanticURL, SemanticRegExp
 */
export interface RelatedSuggestion {
  value?: string;
  url?: string;
  pattern?: string;
  reason: string;
}

/**
 * Suggestion for improvements with optional code.
 * Used by: SemanticFunction, SemanticRegExp, SemanticCallable, SemanticConstructable
 */
export interface ImprovementSuggestion {
  suggestion: string;
  reason: string;
  code?: string;
  improved?: string;
}

/**
 * Correction suggestion for text.
 * Used by: SemanticString
 */
export interface Correction {
  original: string;
  suggestion: string;
  reason?: string;
}

// =============================================================================
// SEMANTIC ACCESS TYPES
// =============================================================================

/**
 * Result of semantic property/key access.
 * Used by: SemanticObject, SemanticMap, SemanticRecord
 */
export interface SemanticGetResult<K = string, V = unknown> extends ConfidenceResult {
  value: V | undefined;
  matchedKey: K | undefined;
}

/**
 * Result of semantic search/find operations.
 * Used by: SemanticArray, SemanticMap, SemanticRecord, SemanticSet
 */
export interface SearchResult<T> {
  item?: T;
  key?: string;
  value?: T;
  relevance: number;
}

// =============================================================================
// SAFETY AND SENSITIVITY TYPES
// =============================================================================

/**
 * Standard severity levels.
 * Used by: SemanticURL, SemanticError, SemanticAny, SemanticCallable
 */
export type SeverityLevel = "low" | "medium" | "high";

/**
 * Extended severity levels including info.
 * Used by: SemanticCallable
 */
export type ExtendedSeverityLevel = "info" | "warning" | "error";

/**
 * Error severity levels.
 * Used by: SemanticError
 */
export type ErrorSeverityLevel = "critical" | "error" | "warning" | "info";

/**
 * Result of safety assessment.
 * Used by: SemanticURL, SemanticFunction, SemanticCallable, SemanticAny
 */
export interface SafetyResult {
  safe: boolean;
  reason?: string;
  severity?: SeverityLevel;
}

/**
 * Result of sensitive data detection.
 * Used by: SemanticString, SemanticObject, SemanticObjectLiteral
 */
export interface SensitiveResult {
  sensitive?: boolean;
  hasSensitive?: boolean;
  types?: string[];
  type?: string;
  recommendation?: string;
}

// =============================================================================
// DETECTION AND INFERENCE TYPES
// =============================================================================

/**
 * Result of intent detection.
 * Used by: SemanticString
 */
export interface DetectIntentResult extends ConfidenceResult {
  intent: string;
  subtype?: string;
  topic?: string;
}

/**
 * Result of language detection.
 * Used by: SemanticString
 */
export interface DetectLanguageResult extends ConfidenceResult {
  language: string;
}

/**
 * Result of pattern detection.
 * Used by: SemanticArray, SemanticTuple, SemanticConstructable
 */
export interface DetectPatternResult extends ConfidenceResult {
  pattern?: string;
  patterns?: string[];
  suggestedType?: string;
}

/**
 * Result of inferring a unit for a numeric value.
 * Used by: SemanticNumber
 */
export interface InferUnitResult extends ConfidenceResult {
  unit: string;
}

/**
 * Result of inferring domain/context.
 * Used by: SemanticBigInt
 */
export interface InferDomainResult extends ConfidenceResult {
  domain: string;
}

/**
 * Result of inferring meaning.
 * Used by: SemanticDate
 */
export interface InferMeaningResult extends ConfidenceResult {
  meaning: string;
  type: string;
}

/**
 * Result of inferring a reason (for null/undefined).
 * Used by: SemanticNull, SemanticUndefined
 */
export interface InferReasonResult {
  reason: string;
  type: string;
}

/**
 * Result of inferring schema.
 * Used by: SemanticObject, SemanticObjectLiteral
 */
export interface InferSchemaResult extends ConfidenceResult {
  type?: string;
  name?: string;
  properties: Record<string, string | { type: string; purpose?: string; format?: string }>;
  required?: string[];
  optional?: string[];
  fields?: Record<string, { type: string; purpose: string; format?: string }>;
}

// =============================================================================
// EXPLANATION AND DESCRIPTION TYPES
// =============================================================================

/**
 * Result with explanation and alternatives.
 * Used by: SemanticAny
 */
export interface ExplanationResult {
  explanation: string;
  alternatives?: string[];
}

/**
 * Duration description result.
 * Used by: SemanticDate
 */
export interface DurationResult {
  description: string;
  days: number;
  businessDays?: number;
}

// =============================================================================
// ISSUE AND ERROR TYPES
// =============================================================================

/**
 * A detected issue with severity.
 * Used by: SemanticFunction, SemanticCallable
 */
export interface DetectedIssue {
  issue: string;
  severity: ExtendedSeverityLevel;
}

/**
 * Result of root cause analysis.
 * Used by: SemanticError
 */
export interface RootCauseResult extends ConfidenceResult {
  cause: string;
}

/**
 * Suggested fix for an error.
 * Used by: SemanticError
 */
export interface SuggestedFix extends ConfidenceResult {
  fix: string;
  code?: string;
}

/**
 * Recovery strategy for errors.
 * Used by: SemanticError
 */
export interface RecoveryStrategy {
  strategy: "retry" | "fallback" | "abort" | "ignore";
  maxAttempts?: number;
  backoff?: string;
}

// =============================================================================
// TEST GENERATION TYPES
// =============================================================================

/**
 * Generated test case.
 * Used by: SemanticFunction, SemanticCallable, SemanticRegExp
 */
export interface GeneratedTestCase<TInput = unknown[], TOutput = unknown> {
  input?: TInput;
  inputs?: TInput;
  expectedOutput?: TOutput;
  description: string;
}

/**
 * Test cases for regex validation.
 * Used by: SemanticRegExp
 */
export interface RegExpTestCases {
  shouldMatch: string[];
  shouldNotMatch: string[];
}
