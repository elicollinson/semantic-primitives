/**
 * Abstract base classes for semantic primitives
 *
 * These classes provide common implementation patterns and can be extended
 * by concrete semantic type implementations.
 */

import type {
  LLMClientInterface,
  Semantic,
  Comparable,
  Explainable,
  Validatable,
  Summarizable,
  SemanticAccessible,
} from './interfaces.ts';

import type {
  SemanticEqualsResult,
  ValidateResult,
  ConfidenceResult,
} from './types.ts';

// =============================================================================
// ABSTRACT BASE CLASS FOR ALL SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class providing common functionality for all semantic wrappers.
 *
 * @template T - The underlying native type being wrapped
 *
 * Provides:
 * - Value storage and retrieval via valueOf()
 * - LLM client injection and access
 * - JSON serialization support
 *
 * @example
 * ```typescript
 * class SemanticString extends SemanticBase<string> implements Comparable<string> {
 *   constructor(value: string, client?: LLMClientInterface) {
 *     super(value, client);
 *   }
 *
 *   async semanticallyEquals(other: string): Promise<SemanticEqualsResult> {
 *     // Implementation using this.llmClient
 *   }
 * }
 * ```
 */
export abstract class SemanticBase<T> implements Semantic<T> {
  /** The wrapped native value */
  protected readonly value: T;

  /** The LLM client for AI-powered operations */
  protected readonly llmClient?: LLMClientInterface;

  /**
   * Create a new semantic wrapper.
   *
   * @param value - The value to wrap
   * @param client - Optional LLM client for AI operations
   */
  constructor(value: T, client?: LLMClientInterface) {
    this.value = value;
    this.llmClient = client;
  }

  /**
   * Get the underlying native value.
   * @returns The wrapped value
   */
  valueOf(): T {
    return this.value;
  }

  /**
   * Convert to JSON-serializable format.
   * Override in subclasses for custom serialization.
   */
  toJSON(): unknown {
    return this.value;
  }

  /**
   * Get string representation.
   */
  toString(): string {
    return String(this.value);
  }

  /**
   * Ensure LLM client is available, throw if not.
   * @throws Error if LLM client is not configured
   */
  protected requireLLMClient(): LLMClientInterface {
    if (!this.llmClient) {
      throw new Error(
        `LLM client required for this operation. ` +
        `Pass an LLM client to the constructor or use the static factory method.`
      );
    }
    return this.llmClient;
  }

  /**
   * Check if LLM client is available.
   */
  protected hasLLMClient(): boolean {
    return this.llmClient !== undefined;
  }
}

// =============================================================================
// ABSTRACT BASE FOR COMPARABLE SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic types that support equality comparison.
 *
 * @template T - The underlying native type
 */
export abstract class ComparableSemanticBase<T>
  extends SemanticBase<T>
  implements Comparable<T>
{
  /**
   * Compare this value with another for semantic equivalence.
   * Must be implemented by subclasses.
   *
   * @param other - The value to compare with
   * @param options - Optional comparison options
   * @returns Equivalence result with confidence
   */
  abstract semanticallyEquals(
    other: unknown,
    options?: Record<string, unknown>
  ): SemanticEqualsResult | Promise<SemanticEqualsResult>;
}

// =============================================================================
// ABSTRACT BASE FOR EXPLAINABLE SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic types that can explain themselves.
 *
 * @template T - The underlying native type
 */
export abstract class ExplainableSemanticBase<T>
  extends ComparableSemanticBase<T>
  implements Explainable
{
  /**
   * Generate a human-readable explanation of this value.
   * Must be implemented by subclasses.
   *
   * @param context - Optional context for more relevant explanation
   * @returns Human-readable description
   */
  abstract explain(context?: string): string | Promise<string>;
}

// =============================================================================
// ABSTRACT BASE FOR VALIDATABLE SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic types that support validation.
 *
 * @template T - The underlying native type
 */
export abstract class ValidatableSemanticBase<T>
  extends ExplainableSemanticBase<T>
  implements Validatable
{
  /**
   * Validate the value against semantic rules.
   * Must be implemented by subclasses.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result with issues
   */
  abstract validate(rules: string[]): ValidateResult | Promise<ValidateResult>;
}

// =============================================================================
// ABSTRACT BASE FOR COLLECTION SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic collection types (Array, Set).
 *
 * @template T - The element type
 * @template TSelf - The concrete collection type (for fluent returns)
 */
export abstract class SemanticCollectionBase<T, TSelf>
  extends SemanticBase<T[]>
  implements Summarizable
{
  /**
   * Get the number of elements in the collection.
   */
  get length(): number {
    return this.value.length;
  }

  /**
   * Check if the collection is empty.
   */
  isEmpty(): boolean {
    return this.value.length === 0;
  }

  /**
   * Get an element at a specific index.
   * @param index - The index of the element
   * @returns The element at the index, or undefined if out of bounds
   */
  at(index: number): T | undefined {
    return this.value[index];
  }

  /**
   * Get all elements as an array.
   * @returns Copy of the underlying array
   */
  toArray(): T[] {
    return [...this.value];
  }

  /**
   * Check if the collection includes a specific element.
   * @param element - The element to search for
   * @returns true if the element is found
   */
  includes(element: T): boolean {
    return this.value.includes(element);
  }

  /**
   * Generate a summary of the collection contents.
   * Must be implemented by subclasses.
   *
   * @param options - Optional summarization options
   * @returns Human-readable summary
   */
  abstract summarize(options?: { maxLength?: number; focus?: string }): string | Promise<string>;

  /**
   * Filter elements using natural language criteria.
   * Must be implemented by subclasses.
   *
   * @param criteria - Natural language filter condition
   * @returns Filtered collection
   */
  abstract semanticFilter(criteria: string): TSelf | Promise<TSelf>;

  /**
   * Group elements by semantic criteria.
   * Must be implemented by subclasses.
   *
   * @param criteria - Grouping criteria
   * @returns Map of groups
   */
  abstract semanticGroup(criteria: string): Map<string, TSelf> | Promise<Map<string, TSelf>>;
}

// =============================================================================
// ABSTRACT BASE FOR KEY-VALUE COLLECTION SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic key-value collection types (Object, Map, Record).
 *
 * @template K - The key type
 * @template V - The value type
 * @template TSelf - The concrete collection type (for fluent returns)
 */
export abstract class SemanticKeyValueBase<K, V, TSelf>
  extends SemanticBase<Map<K, V> | Record<string, V>>
  implements SemanticAccessible<K, V>, Summarizable
{
  /**
   * Get a value using semantic key matching.
   * Must be implemented by subclasses.
   *
   * @param query - Key or semantic query
   * @param context - Optional context
   * @returns Value with match confidence
   */
  abstract semanticGet(
    query: string,
    context?: Record<string, unknown>
  ): { value: V | undefined; matchedKey: K | undefined; confidence: number } |
     Promise<{ value: V | undefined; matchedKey: K | undefined; confidence: number }>;

  /**
   * Generate a summary of the collection contents.
   * Must be implemented by subclasses.
   */
  abstract summarize(options?: { maxLength?: number; focus?: string }): string | Promise<string>;

  /**
   * Merge with another collection using semantic key matching.
   * Must be implemented by subclasses.
   */
  abstract semanticMerge(
    other: unknown,
    options?: { conflictResolution?: 'prefer-this' | 'prefer-other' | 'combine' }
  ): TSelf | Promise<TSelf>;
}

// =============================================================================
// ABSTRACT BASE FOR CALLABLE SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic callable types (Function, Callable).
 *
 * @template TFn - The function type
 */
export abstract class SemanticCallableBase<TFn extends (...args: unknown[]) => unknown>
  extends SemanticBase<TFn>
  implements Explainable
{
  /** Optional description of what the function does */
  protected readonly description?: string;

  /**
   * Create a semantic callable wrapper.
   *
   * @param fn - The function to wrap
   * @param description - Optional description
   * @param client - Optional LLM client
   */
  constructor(fn: TFn, description?: string, client?: LLMClientInterface) {
    super(fn, client);
    this.description = description;
  }

  /**
   * Call the underlying function.
   *
   * @param args - Arguments to pass to the function
   * @returns The function's return value
   */
  call(...args: Parameters<TFn>): ReturnType<TFn> {
    return this.value(...args) as ReturnType<TFn>;
  }

  /**
   * Generate a human-readable explanation of what the function does.
   * Must be implemented by subclasses.
   */
  abstract explain(context?: string): string | Promise<string>;

  /**
   * Validate function arguments.
   * Must be implemented by subclasses.
   */
  abstract validateArgs(
    args: unknown[],
    rules?: string[]
  ): ValidateResult | Promise<ValidateResult>;
}

// =============================================================================
// ABSTRACT BASE FOR ABSENCE SEMANTIC TYPES
// =============================================================================

/**
 * Abstract base class for semantic absence types (Null, Undefined).
 *
 * @template T - The absence type (null or undefined)
 */
export abstract class SemanticAbsenceBase<T extends null | undefined>
  extends SemanticBase<T>
{
  /** The reason for the absence, if provided */
  protected readonly reason?: string;

  /**
   * Create a semantic absence wrapper.
   *
   * @param value - The absence value (null or undefined)
   * @param reason - Optional reason for the absence
   * @param client - Optional LLM client
   */
  constructor(value: T, reason?: string, client?: LLMClientInterface) {
    super(value, client);
    this.reason = reason;
  }

  /**
   * Get the reason for absence, if provided.
   */
  getReason(): string | undefined {
    return this.reason;
  }

  /**
   * Check if a reason was provided.
   */
  hasReason(): boolean {
    return this.reason !== undefined;
  }

  /**
   * Classify the type of absence.
   * Must be implemented by subclasses.
   */
  abstract classify(): {
    type: 'not-set' | 'not-applicable' | 'unknown';
    canBeProvided: boolean;
  } | Promise<{
    type: 'not-set' | 'not-applicable' | 'unknown';
    canBeProvided: boolean;
  }>;

  /**
   * Generate a human-readable explanation.
   * Must be implemented by subclasses.
   */
  abstract explain(fieldName: string): string | Promise<string>;
}

// =============================================================================
// UTILITY BASE FOR RESULT BUILDERS
// =============================================================================

/**
 * Builder for creating consistent result objects.
 * Useful for constructing SemanticEqualsResult and similar types.
 *
 * @template T - The result type being built
 */
export class ResultBuilder<T extends ConfidenceResult> {
  private result: Partial<T> = {};

  /**
   * Set the confidence score.
   */
  withConfidence(confidence: number): this {
    (this.result as ConfidenceResult).confidence = confidence;
    return this;
  }

  /**
   * Add a property to the result.
   */
  with<K extends keyof T>(key: K, value: T[K]): this {
    this.result[key] = value;
    return this;
  }

  /**
   * Build the final result object.
   */
  build(): T {
    return this.result as T;
  }

  /**
   * Create a new builder instance.
   */
  static create<T extends ConfidenceResult>(): ResultBuilder<T> {
    return new ResultBuilder<T>();
  }
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a Semantic wrapper.
 */
export function isSemantic<T>(value: unknown): value is Semantic<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'valueOf' in value &&
    typeof (value as Semantic<T>).valueOf === 'function'
  );
}

/**
 * Type guard to check if a value is Comparable.
 */
export function isComparable<T>(value: unknown): value is Comparable<T> {
  return (
    isSemantic(value) &&
    'semanticallyEquals' in value &&
    typeof (value as Comparable<T>).semanticallyEquals === 'function'
  );
}

/**
 * Type guard to check if a value is Explainable.
 */
export function isExplainable(value: unknown): value is Explainable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'explain' in value &&
    typeof (value as Explainable).explain === 'function'
  );
}

/**
 * Type guard to check if a value is Validatable.
 */
export function isValidatable(value: unknown): value is Validatable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'validate' in value &&
    typeof (value as Validatable).validate === 'function'
  );
}
