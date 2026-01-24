/**
 * Shared interfaces for semantic primitives
 *
 * This file defines the core abstractions used across all semantic types:
 * - Base interfaces for all semantic wrappers
 * - Capability mixin interfaces (composable behaviors)
 * - Category-specific interfaces
 * - LLM client abstraction
 */

import type {
  SemanticEqualsResult,
  SemanticEqualsResultWithReason,
  SemanticEqualsResultWithMappings,
  ValidateResult,
  ClassifyResult,
  InferTypeResult,
  InferPurposeResult,
  ReasonableResult,
  SearchResult,
  MissingSuggestion,
  ImprovementSuggestion,
  SafetyResult,
  InferReasonResult,
} from './types.ts';

// =============================================================================
// LLM CLIENT ABSTRACTION
// =============================================================================

/**
 * Interface for LLM client implementations.
 * All semantic operations that require AI capabilities depend on this interface.
 */
export interface LLMClientInterface {
  /**
   * Send a completion request to the LLM.
   *
   * @param options - Request options including messages and temperature
   * @returns Promise resolving to the LLM response content
   */
  complete(options: LLMCompletionOptions): Promise<string>;
}

/**
 * Options for LLM completion requests.
 */
export interface LLMCompletionOptions {
  /** System prompt setting the context for the LLM */
  systemPrompt?: string;
  /** User message/prompt for the completion */
  userPrompt: string;
  /** Temperature for response randomness (0-1, lower = more deterministic) */
  temperature?: number;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Expected response format */
  responseFormat?: 'text' | 'json';
}

// =============================================================================
// CORE BASE INTERFACES
// =============================================================================

/**
 * Base interface for all semantic type wrappers.
 * Every semantic type must be able to return its underlying value.
 *
 * @template T - The underlying native type being wrapped
 *
 * Used by: All 26 semantic types
 */
export interface Semantic<T> {
  /**
   * Get the underlying native value.
   * @returns The wrapped primitive or object value
   */
  valueOf(): T;
}

/**
 * Base interface for semantic types that can be constructed with context.
 * Provides the common factory method pattern.
 *
 * @template T - The semantic type being created
 * @template TInput - The input type(s) accepted
 *
 * Used by: SemanticString, SemanticNumber, SemanticBoolean, SemanticBigInt,
 * SemanticDate, SemanticError, SemanticURL, SemanticRegExp, SemanticPromise,
 * SemanticFunction, SemanticArray, SemanticObject, SemanticMap, SemanticSet,
 * SemanticTuple, SemanticRecord, SemanticCallable, SemanticConstructable,
 * SemanticObjectLiteral, SemanticAny, SemanticUnknown
 */
export interface SemanticFactory<T, TInput = unknown> {
  /**
   * Create a semantic wrapper from input value.
   *
   * @param input - The value to wrap
   * @param context - Optional context for interpretation
   * @param client - Optional LLM client for dependency injection
   * @returns The semantic wrapper instance
   */
  from(
    input: TInput,
    context?: string | Record<string, unknown>,
    client?: LLMClientInterface
  ): T;
}

// =============================================================================
// CAPABILITY MIXIN INTERFACES
// =============================================================================

/**
 * Capability for semantic equality comparison.
 * Types implementing this can be compared for semantic equivalence.
 *
 * @template T - The type being compared
 * @template TResult - The comparison result type
 *
 * Used by: 24 of 26 semantic types (all except SemanticPromise, SemanticNever)
 */
export interface Comparable<T, TResult extends SemanticEqualsResult = SemanticEqualsResult> {
  /**
   * Check if this value is semantically equivalent to another.
   *
   * @param other - The value to compare with
   * @param options - Optional comparison options
   * @returns Equivalence result with confidence score (sync or async)
   */
  semanticallyEquals(
    other: T,
    options?: Record<string, unknown>
  ): TResult | Promise<TResult>;
}

/**
 * Capability for generating human-readable explanations.
 * Types implementing this can explain themselves in natural language.
 *
 * Used by: SemanticString, SemanticNumber, SemanticBigInt, SemanticDate,
 * SemanticError, SemanticURL, SemanticPromise, SemanticFunction,
 * SemanticSymbol, SemanticTuple, SemanticCallable, SemanticConstructable,
 * SemanticNull, SemanticUndefined, SemanticAny, SemanticUnknown
 */
export interface Explainable {
  /**
   * Generate a human-readable explanation.
   *
   * @param context - Optional context for more relevant explanation
   * @returns Human-readable description (sync or async)
   */
  explain(context?: string): string | Promise<string>;
}

/**
 * Extended explainable with describe method.
 *
 * Used by: SemanticNumber, SemanticBigInt, SemanticDate, SemanticSymbol
 */
export interface Describable extends Explainable {
  /**
   * Describe the value in context.
   *
   * @param context - Optional context for description
   * @returns Human-readable description (sync or async)
   */
  describe(context?: string): string | Promise<string>;
}

/**
 * Capability for validation against semantic rules.
 * Types implementing this can validate their values using natural language rules.
 *
 * @template TResult - The validation result type
 *
 * Used by: SemanticString, SemanticArray, SemanticObject, SemanticMap,
 * SemanticSet, SemanticSymbol, SemanticRegExp, SemanticFunction,
 * SemanticTuple, SemanticRecord, SemanticCallable, SemanticConstructable
 */
export interface Validatable<TResult extends ValidateResult = ValidateResult> {
  /**
   * Validate the value against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result with issues (sync or async)
   */
  validate(rules: string[]): TResult | Promise<TResult>;
}

/**
 * Capability for context-aware reasonableness checks.
 * Types implementing this can assess if their value is reasonable for a given context.
 *
 * Used by: SemanticNumber, SemanticBigInt, SemanticDate
 */
export interface ContextValidatable {
  /**
   * Check if the value is reasonable for a given context.
   *
   * @param context - The context to validate against
   * @returns Reasonableness assessment with explanation (sync or async)
   */
  isReasonable(context: string): ReasonableResult | Promise<ReasonableResult>;
}

/**
 * Capability for purpose/use-case validation.
 *
 * Used by: SemanticURL, SemanticSymbol, SemanticVoid
 */
export interface PurposeValidatable {
  /**
   * Validate the value for a specific purpose.
   *
   * @param purpose - The intended use case
   * @returns Validation result
   */
  validateFor?(purpose: string): { valid: boolean; reason?: string; warnings?: string[] };

  /**
   * Check if appropriate for a use case.
   *
   * @param useCase - The intended use case
   * @returns Appropriateness assessment
   */
  isAppropriateFor?(useCase: string): { appropriate: boolean; reason: string };
}

/**
 * Capability for type inference.
 * Types implementing this can infer semantic type information.
 *
 * Used by: SemanticObject, SemanticArray, SemanticSet, SemanticRegExp,
 * SemanticUnknown, SemanticAny
 */
export interface TypeInferable {
  /**
   * Infer the semantic type of this value.
   *
   * @returns Inferred type with confidence (sync or async)
   */
  inferType(): InferTypeResult | Promise<InferTypeResult>;
}

/**
 * Capability for purpose inference.
 *
 * Used by: SemanticFunction, SemanticMap, SemanticRecord, SemanticCallable
 */
export interface PurposeInferable {
  /**
   * Infer the purpose of this value.
   *
   * @returns Inferred purpose with confidence (sync or async)
   */
  inferPurpose(): InferPurposeResult | Promise<InferPurposeResult>;
}

/** Schema inference result type */
export interface InferSchemaResultType {
  type?: string;
  name?: string;
  properties?: Record<string, string | { type: string; purpose?: string }>;
  fields?: Record<string, { type: string; purpose: string; format?: string }>;
  required?: string[];
  optional?: string[];
  confidence: number;
}

/**
 * Capability for schema inference.
 *
 * Used by: SemanticObject, SemanticObjectLiteral
 */
export interface SchemaInferable {
  /**
   * Infer the schema of this value.
   *
   * @returns Inferred schema with field descriptions (sync or async)
   */
  inferSchema(): InferSchemaResultType | Promise<InferSchemaResultType>;
}

/**
 * Capability for classification into categories.
 *
 * Used by: SemanticString, SemanticSymbol, SemanticURL, SemanticError,
 * SemanticNull, SemanticUndefined
 */
export interface Classifiable<TResult extends ClassifyResult = ClassifyResult> {
  /**
   * Classify the value into a category.
   *
   * @returns Classification result (sync or async)
   */
  classify(...args: unknown[]): TResult | Promise<TResult>;
}

/**
 * Capability for pattern detection.
 *
 * Used by: SemanticArray, SemanticTuple, SemanticConstructable
 */
export interface PatternDetectable {
  /**
   * Detect patterns in the value.
   *
   * @returns Detected patterns
   */
  detectPatterns?(): {
    patterns: string[];
    anomalies?: { index: number; reason: string }[];
    confidence?: number;
  };

  /**
   * Detect single pattern.
   *
   * @returns Detected pattern
   */
  detectPattern?(): {
    pattern: string;
    confidence: number;
    suggestedType?: string;
  };
}

/**
 * Capability for suggesting improvements or additions.
 *
 * Used by: SemanticObject, SemanticMap, SemanticSet, SemanticRecord,
 * SemanticFunction, SemanticRegExp, SemanticCallable, SemanticConstructable
 */
export interface Suggestible {
  /**
   * Suggest improvements for this value.
   *
   * @returns Suggested improvements
   */
  suggestImprovements?(): ImprovementSuggestion[];

  /**
   * Suggest missing fields/keys.
   *
   * @returns Suggested additions
   */
  suggestMissingFields?(): MissingSuggestion[];
  suggestMissingKeys?(): MissingSuggestion[];

  /**
   * Suggest related items.
   *
   * @returns Related suggestions
   */
  suggestRelated?(): { value?: string; url?: string; pattern?: string; reason: string }[];
}

/**
 * Capability for summarization.
 *
 * Used by: SemanticString, SemanticArray, SemanticObject, SemanticMap,
 * SemanticSet, SemanticRecord, SemanticObjectLiteral
 */
export interface Summarizable {
  /**
   * Generate a summary of the value.
   *
   * @param options - Optional summarization options (or maxLength for backwards compatibility)
   * @returns Human-readable summary (sync or async)
   */
  summarize(options?: { maxLength?: number; focus?: string } | number): string | Promise<string>;
}

/**
 * Capability for safety assessment.
 *
 * Used by: SemanticURL, SemanticFunction, SemanticCallable, SemanticAny
 */
export interface SafetyAssessable {
  /**
   * Check if the value is safe for a given context.
   *
   * @param context - Optional context for safety check
   * @returns Safety assessment
   */
  isSafe?(context?: string): SafetyResult;

  /**
   * Check if safe to call with arguments.
   *
   * @param args - Arguments to check
   * @returns Safety assessment
   */
  isSafeToCall?(args: unknown[]): SafetyResult;

  /**
   * Check if safe for specific use.
   *
   * @param context - Use context
   * @returns Safety assessment
   */
  isSafeFor?(context: string): SafetyResult;
}

/** Sensitivity assessment result */
export interface SensitivityAssessment {
  sensitive?: boolean;
  hasSensitive?: boolean;
  types?: string[];
  type?: string;
  recommendation?: string;
}

/**
 * Capability for sensitivity detection.
 *
 * Used by: SemanticString, SemanticObject, SemanticObjectLiteral
 */
export interface SensitivityDetectable {
  /**
   * Check for sensitive data.
   *
   * @param field - Optional field to check
   * @returns Sensitivity assessment (sync or async)
   */
  isSensitive?(field?: string): SensitivityAssessment | Promise<SensitivityAssessment>;

  /**
   * Check if value contains sensitive information.
   *
   * @returns Sensitivity assessment (sync or async)
   */
  containsSensitive?(): { hasSensitive: boolean; types: string[] } | Promise<{ hasSensitive: boolean; types: string[] }>;
}

// =============================================================================
// COLLECTION CAPABILITY INTERFACES
// =============================================================================

/**
 * Capability for semantic filtering.
 *
 * @template TSelf - The collection type (for return type)
 *
 * Used by: SemanticArray, SemanticSet, SemanticRecord
 */
export interface SemanticFilterable<TSelf> {
  /**
   * Filter elements using natural language criteria.
   *
   * @param criteria - Natural language filter condition
   * @returns Filtered collection
   */
  semanticFilter(criteria: string): TSelf;
}

/**
 * Capability for semantic sorting.
 *
 * @template TSelf - The collection type (for return type)
 *
 * Used by: SemanticArray
 */
export interface SemanticSortable<TSelf> {
  /**
   * Sort elements using semantic understanding.
   *
   * @param criteria - Natural language sort criteria
   * @returns Sorted collection
   */
  semanticSort(criteria: string): TSelf;
}

/**
 * Capability for semantic grouping.
 *
 * @template TSelf - The collection type (for group values)
 *
 * Used by: SemanticArray, SemanticSet, SemanticMap, SemanticRecord
 */
export interface SemanticGroupable<TSelf> {
  /**
   * Group elements by semantic criteria.
   *
   * @param criteria - Grouping criteria
   * @returns Map of groups
   */
  semanticGroup?(criteria: string): Map<string, TSelf>;
  groupBy?(criteria: string): Map<string, TSelf>;
}

/**
 * Capability for semantic search.
 *
 * @template T - The element type
 *
 * Used by: SemanticArray, SemanticMap, SemanticRecord
 */
export interface SemanticSearchable<T> {
  /**
   * Find elements matching semantic criteria.
   *
   * @param criteria - Natural language search criteria
   * @param options - Search options
   * @returns Matching elements with relevance scores
   */
  semanticSearch(
    criteria: string,
    options?: { limit?: number }
  ): SearchResult<T>[];
}

/** Semantic get result type */
export interface SemanticGetResultType<K, V> {
  value: V | undefined;
  matchedKey: K | undefined;
  confidence: number;
}

/**
 * Capability for semantic key-based access.
 *
 * @template K - The key type
 * @template V - The value type
 *
 * Used by: SemanticObject, SemanticMap, SemanticRecord
 */
export interface SemanticAccessible<K, V> {
  /**
   * Get a value using semantic key matching.
   *
   * @param query - Key or semantic query
   * @param context - Optional context
   * @returns Value with match confidence (sync or async)
   */
  semanticGet(
    query: string,
    context?: Record<string, unknown>
  ): SemanticGetResultType<K, V> | Promise<SemanticGetResultType<K, V>>;

  /**
   * Check if key semantically exists.
   *
   * @param query - Key or semantic query
   * @returns Whether a matching key exists (sync or async)
   */
  semanticHas?(query: string): boolean | Promise<boolean>;
}

/**
 * Capability for semantic set operations.
 *
 * @template TSelf - The set type
 *
 * Used by: SemanticSet
 */
export interface SemanticSetOperations<TSelf> {
  /**
   * Semantic intersection with another set.
   */
  semanticIntersection(other: unknown): TSelf;

  /**
   * Semantic union with another set.
   */
  semanticUnion(other: unknown): TSelf;

  /**
   * Semantic difference from another set.
   */
  semanticDifference(other: unknown): TSelf;
}

/**
 * Capability for semantic merging.
 *
 * @template TSelf - The collection type
 *
 * Used by: SemanticObject, SemanticMap
 */
export interface SemanticMergeable<TSelf> {
  /**
   * Merge with another collection using semantic key matching.
   *
   * @param other - Collection to merge
   * @param options - Merge options
   * @returns Merged collection
   */
  semanticMerge(
    other: unknown,
    options?: { conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine' }
  ): TSelf;
}

// =============================================================================
// CATEGORY-SPECIFIC INTERFACES
// =============================================================================

/**
 * Interface for semantic types representing absence (null, undefined).
 *
 * @template T - The absence type (null or undefined)
 *
 * Used by: SemanticNull, SemanticUndefined
 */
export interface SemanticAbsence<T extends null | undefined> extends Semantic<T> {
  /**
   * Create with context about why the value is absent.
   *
   * @param reason - Reason for absence
   * @returns Semantic absence instance
   */
  // Note: This is typically a static method, shown here for documentation
  // static because(reason: string): SemanticAbsence<T>;

  /**
   * Get the reason for absence, if provided.
   *
   * @returns The reason string or undefined
   */
  getReason(): string | undefined;

  /**
   * Classify the type of absence.
   *
   * @returns Classification result (sync or async)
   */
  classify(): {
    type: 'not-set' | 'not-applicable' | 'unknown';
    canBeProvided: boolean;
  } | Promise<{
    type: 'not-set' | 'not-applicable' | 'unknown';
    canBeProvided: boolean;
  }>;
}

/**
 * Static factory methods for absence types.
 *
 * Used by: SemanticNull, SemanticUndefined
 */
export interface SemanticAbsenceFactory<T> {
  /**
   * Create with reason for absence.
   */
  because(reason: string, client?: LLMClientInterface): T;

  /**
   * Infer reason for absence from context.
   */
  inferReason(
    fieldOrPath: string,
    context?: Record<string, unknown>
  ): InferReasonResult;

  /**
   * Check if absence is appropriate for field/context.
   */
  isAppropriate(
    fieldName: string,
    context?: { required?: boolean; schema?: unknown }
  ): { appropriate: boolean; reason: string };
}

/**
 * Interface for semantic collection types.
 * Combines common collection capabilities.
 *
 * @template T - The element type
 * @template TSelf - The collection type itself
 *
 * Used by: SemanticArray, SemanticSet
 */
export interface SemanticCollection<T, TSelf>
  extends Semantic<T[]>,
    Comparable<T[]>,
    Validatable,
    Summarizable,
    SemanticFilterable<TSelf>,
    SemanticGroupable<TSelf> {}

/**
 * Interface for semantic key-value collection types.
 *
 * @template K - The key type
 * @template V - The value type
 * @template TSelf - The collection type itself
 *
 * Used by: SemanticObject, SemanticMap, SemanticRecord
 */
export interface SemanticKeyValueCollection<K, V, TSelf>
  extends Semantic<Record<string, V> | Map<K, V>>,
    Comparable<unknown, SemanticEqualsResultWithMappings>,
    Validatable,
    Summarizable,
    SemanticAccessible<K, V>,
    SemanticMergeable<TSelf>,
    Suggestible {}

/**
 * Interface for callable semantic types.
 *
 * @template TFn - The function type
 *
 * Used by: SemanticFunction, SemanticCallable
 */
export interface SemanticCallableType<TFn extends (...args: unknown[]) => unknown>
  extends Semantic<TFn>,
    Comparable<TFn>,
    Explainable,
    Validatable,
    Suggestible,
    SafetyAssessable {
  /**
   * Validate function arguments.
   */
  validateArgs(args: unknown[], rules?: string[]): ValidateResult;

  /**
   * Generate test cases for the function.
   */
  generateTests(): {
    input?: unknown[];
    inputs?: unknown[];
    expectedOutput?: unknown;
    description: string;
  }[];

  /**
   * Call the underlying function.
   */
  call(...args: Parameters<TFn>): ReturnType<TFn>;
}

// =============================================================================
// TRANSFORMATION INTERFACES
// =============================================================================

/**
 * Capability for key/property transformation.
 *
 * Used by: SemanticObject, SemanticObjectLiteral
 */
export interface KeyTransformable<TSelf> {
  /**
   * Transform property names to a different convention.
   *
   * @param convention - Target naming convention
   * @returns Transformed instance
   */
  transformKeys(
    convention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case'
  ): TSelf;
}

/**
 * Capability for unit conversion.
 *
 * Used by: SemanticNumber
 */
export interface UnitConvertible<TSelf> {
  /**
   * Convert to a different unit.
   *
   * @param toUnit - Target unit
   * @param fromUnit - Source unit (optional, can be inferred)
   * @returns Converted value (sync or async)
   */
  convert(toUnit: string, fromUnit?: string): TSelf | Promise<TSelf>;

  /**
   * Infer the unit of this value.
   *
   * @param context - Context for inference
   * @returns Inferred unit with confidence (sync or async)
   */
  inferUnit(context: string): { unit: string; confidence: number } | Promise<{ unit: string; confidence: number }>;
}

// =============================================================================
// TEST GENERATION INTERFACES
// =============================================================================

/**
 * Capability for generating test cases.
 *
 * Used by: SemanticFunction, SemanticCallable, SemanticRegExp
 */
export interface TestGeneratable<TInput = unknown[], TOutput = unknown> {
  /**
   * Generate test cases for this value/function.
   *
   * @returns Generated test cases
   */
  generateTests(): {
    input?: TInput;
    inputs?: TInput;
    expectedOutput?: TOutput;
    description: string;
  }[];
}

/**
 * Test case generation for regex.
 *
 * Used by: SemanticRegExp
 */
export interface RegExpTestGeneratable {
  /**
   * Generate test strings for the regex.
   *
   * @returns Test cases with expected match results
   */
  generateTestCases(): {
    shouldMatch: string[];
    shouldNotMatch: string[];
  };
}

// =============================================================================
// ERROR HANDLING INTERFACES
// =============================================================================

/**
 * Interface for semantic error types.
 *
 * Used by: SemanticError
 */
export interface SemanticErrorType
  extends Comparable<Error, SemanticEqualsResultWithReason>,
    Explainable,
    Classifiable {
  /**
   * Suggest fixes for the error.
   */
  suggestFixes(): { fix: string; confidence: number; code?: string }[];

  /**
   * Infer the root cause.
   */
  inferRootCause(): { cause: string; confidence: number };

  /**
   * Get recovery strategy.
   */
  recoveryStrategy(): {
    strategy: 'retry' | 'fallback' | 'abort' | 'ignore';
    maxAttempts?: number;
    backoff?: string;
  };

  /**
   * Get severity level.
   */
  getSeverity(): 'critical' | 'error' | 'warning' | 'info';
}

// =============================================================================
// COMPOSITE INTERFACES (Common Combinations)
// =============================================================================

/**
 * Core capabilities shared by most semantic primitives.
 *
 * @template T - The underlying type
 *
 * Used by: SemanticString, SemanticNumber, SemanticBoolean, SemanticBigInt,
 * SemanticSymbol
 */
export interface SemanticPrimitiveCapabilities<T>
  extends Semantic<T>,
    Comparable<T>,
    Explainable {}

/**
 * Extended capabilities for richer semantic primitives.
 *
 * @template T - The underlying type
 *
 * Used by: SemanticString, SemanticNumber, SemanticBigInt
 */
export interface SemanticPrimitiveExtended<T>
  extends SemanticPrimitiveCapabilities<T>,
    Describable,
    Validatable {}

/**
 * Capabilities for semantic wrappers of reference types.
 *
 * @template T - The underlying type
 *
 * Used by: SemanticDate, SemanticURL, SemanticRegExp
 */
export interface SemanticReferenceCapabilities<T>
  extends Semantic<T>,
    Comparable<T>,
    Explainable,
    Validatable {}
