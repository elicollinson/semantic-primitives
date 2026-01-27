/**
 * SemanticTuple
 * A tuple type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T> - Base semantic wrapper
 * - Comparable<SemanticTuple<T>> - Semantic equality comparison
 * - Explainable - Human-readable explanations
 * - PatternDetectable - Pattern detection
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithReason,
  DetectPatternResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable, Explainable } from '../../shared/interfaces.ts';
import {
  TUPLE_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createInferPositionalMeaningPrompt,
  createValidateRelationshipPrompt,
  createDetectPatternPrompt,
  createToObjectPrompt,
  createGetByLabelPrompt,
  createValidateStructurePrompt,
  createExplainPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithReason,
  DetectPatternResult,
} from '../../shared/types.ts';

/** Result of inferring positional meaning */
export interface PositionalMeaning {
  meaning: string;
  confidence: number;
}

/** Result of inferPositionalMeaning */
export interface InferPositionalMeaningResult {
  positions: Record<number, PositionalMeaning>;
  overallConfidence: number;
}

/** Result of validateRelationship */
export interface ValidateRelationshipResult {
  valid: boolean;
  violations: string[];
}

/** Result of toObject */
export interface ToObjectResult {
  object: Record<string, unknown>;
  labelsUsed: string[];
  confidence: number;
}

/** Result of getByLabel */
export interface GetByLabelResult<T> {
  value: T | undefined;
  matchedPosition: number | undefined;
  confidence: number;
}

/** Issue found during structure validation */
export interface StructureIssue {
  position: number;
  expected: string;
  actual: string;
}

/** Result of validateStructure */
export interface ValidateStructureResult {
  valid: boolean;
  issues: StructureIssue[];
}

/**
 * SemanticTuple - Tuple with LLM-powered semantic understanding
 *
 * Unlike traditional tuples that only support index-based operations,
 * semantic tuples can understand positional meaning, detect patterns,
 * and validate relationships between elements.
 *
 * @template T - The tuple type
 */
export class SemanticTuple<T extends unknown[]>
  implements
    Semantic<T>,
    Comparable<SemanticTuple<T> | unknown[], SemanticEqualsResultWithReason>,
    Explainable
{
  private readonly elements: T;
  private readonly client: LLMClient;
  private readonly labels: string[] | undefined;

  private constructor(elements: T, labels?: string[], client?: LLMClient) {
    this.elements = [...elements] as T;
    this.labels = labels ? [...labels] : undefined;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticTuple from values with optional position labels.
   *
   * @param values - Tuple values
   * @param labels - Optional labels for each position
   * @returns SemanticTuple instance
   *
   * @example
   * SemanticTuple.from([37.7749, -122.4194], ["latitude", "longitude"])
   * SemanticTuple.from(["John", 30, true], ["name", "age", "active"])
   */
  static from<T extends unknown[]>(
    values: T,
    labels?: string[],
    client?: LLMClient
  ): SemanticTuple<T> {
    return new SemanticTuple(values, labels, client);
  }

  /**
   * Create an empty SemanticTuple
   */
  static empty<T extends unknown[] = []>(client?: LLMClient): SemanticTuple<T> {
    return new SemanticTuple([] as unknown as T, undefined, client);
  }

  /**
   * Get the underlying tuple value
   */
  valueOf(): T {
    return [...this.elements] as T;
  }

  /**
   * Get the length of the tuple
   */
  get length(): number {
    return this.elements.length;
  }

  /**
   * Get the labels if provided
   */
  getLabels(): string[] | undefined {
    return this.labels ? [...this.labels] : undefined;
  }

  /**
   * Get element at index
   */
  at(index: number): T[number] | undefined {
    return this.elements.at(index);
  }

  /**
   * Check if two tuples are semantically equivalent.
   * Considers position meanings, not just values.
   *
   * @param other - Tuple to compare
   * @returns Equivalence result with confidence and reason
   *
   * @example
   * SemanticTuple.from([lat, lng]).semanticallyEquals([lat, lng, alt])
   * // { equivalent: false, reason: "Different arity (2 vs 3)" }
   */
  async semanticallyEquals(
    other: SemanticTuple<T> | unknown[]
  ): Promise<SemanticEqualsResultWithReason> {
    const otherArray = other instanceof SemanticTuple ? other.valueOf() : other;
    const otherLabels = other instanceof SemanticTuple ? other.getLabels() : undefined;

    const prompt = createSemanticallyEqualsPrompt(
      this.elements,
      otherArray,
      this.labels,
      otherLabels
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithReason;
  }

  /**
   * Infer the meaning of each position in the tuple.
   *
   * @param context - Optional context to improve inference
   * @returns Position meanings with confidence scores
   *
   * @example
   * SemanticTuple.from([37.7749, -122.4194]).inferPositionalMeaning()
   * // { positions: { 0: { meaning: "latitude", confidence: 0.9 }, 1: { meaning: "longitude", confidence: 0.9 } } }
   */
  async inferPositionalMeaning(context?: string): Promise<InferPositionalMeaningResult> {
    if (this.elements.length === 0) {
      return { positions: {}, overallConfidence: 1.0 };
    }

    const prompt = createInferPositionalMeaningPrompt(this.elements, this.labels, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferPositionalMeaningResult;
  }

  /**
   * Validate relationships between tuple elements.
   *
   * @param rules - Validation rules
   * @returns Validation result with any violations
   *
   * @example
   * SemanticTuple.from([startDate, endDate]).validateRelationship([
   *   "end should be after start"
   * ])
   * // { valid: true, violations: [] }
   */
  async validateRelationship(rules: string[]): Promise<ValidateRelationshipResult> {
    if (this.elements.length === 0 || rules.length === 0) {
      return { valid: true, violations: [] };
    }

    const prompt = createValidateRelationshipPrompt(this.elements, rules, this.labels);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateRelationshipResult;
  }

  /**
   * Detect what type of tuple this is (coordinate, range, RGB, etc.).
   *
   * @returns Detected tuple pattern with confidence
   *
   * @example
   * SemanticTuple.from([255, 128, 0]).detectPattern()
   * // { pattern: "RGB color", confidence: 0.95, suggestedType: "Color" }
   */
  async detectPattern(): Promise<DetectPatternResult> {
    if (this.elements.length === 0) {
      return { pattern: 'empty tuple', confidence: 1.0 };
    }

    const prompt = createDetectPatternPrompt(this.elements, this.labels);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as DetectPatternResult;
  }

  /**
   * Convert tuple to a labeled object.
   *
   * @param labels - Optional custom labels (uses inferred or provided if not specified)
   * @returns Object with labeled properties
   *
   * @example
   * SemanticTuple.from([37.7749, -122.4194]).toObject()
   * // { latitude: 37.7749, longitude: -122.4194 }
   */
  async toObject(labels?: string[]): Promise<ToObjectResult> {
    if (this.elements.length === 0) {
      return { object: {}, labelsUsed: [], confidence: 1.0 };
    }

    // If labels are provided directly, use them
    const labelsToUse = labels ?? this.labels;
    if (labelsToUse?.length === this.elements.length) {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < this.elements.length; i++) {
        const label = labelsToUse[i];
        if (label !== undefined) {
          obj[label] = this.elements[i];
        }
      }
      return { object: obj, labelsUsed: labelsToUse, confidence: 1.0 };
    }

    // Otherwise, use LLM to infer labels
    const prompt = createToObjectPrompt(this.elements, labelsToUse);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ToObjectResult;
  }

  /**
   * Access an element by semantic label instead of index.
   *
   * @param label - Semantic label for the position
   * @returns Value at that position with match info
   *
   * @example
   * coords.getByLabel("latitude") // { value: 37.7749, matchedPosition: 0, confidence: 0.95 }
   */
  async getByLabel(label: string): Promise<GetByLabelResult<T[number]>> {
    if (this.elements.length === 0) {
      return { value: undefined, matchedPosition: undefined, confidence: 1.0 };
    }

    // If we have exact matching labels, use them directly
    if (this.labels) {
      const index = this.labels.findIndex(
        (l) => l.toLowerCase() === label.toLowerCase()
      );
      if (index !== -1) {
        return {
          value: this.elements[index],
          matchedPosition: index,
          confidence: 1.0,
        };
      }
    }

    // Otherwise, use LLM to find semantic match
    const prompt = createGetByLabelPrompt(this.elements, label, this.labels);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matchedPosition: number | null;
      confidence: number;
    };

    return {
      value: result.matchedPosition !== null ? this.elements[result.matchedPosition] : undefined,
      matchedPosition: result.matchedPosition ?? undefined,
      confidence: result.confidence,
    };
  }

  /**
   * Validate that the tuple matches expected structure.
   *
   * @param expectedTypes - Expected type for each position
   * @returns Validation result with issues
   *
   * @example
   * tuple.validateStructure(["string", "number", "boolean"])
   * // { valid: true, issues: [] }
   */
  async validateStructure(expectedTypes: string[]): Promise<ValidateStructureResult> {
    if (this.elements.length === 0 && expectedTypes.length === 0) {
      return { valid: true, issues: [] };
    }

    // Quick length check
    if (this.elements.length !== expectedTypes.length) {
      return {
        valid: false,
        issues: [
          {
            position: -1,
            expected: `${expectedTypes.length} elements`,
            actual: `${this.elements.length} elements`,
          },
        ],
      };
    }

    const prompt = createValidateStructurePrompt(this.elements, expectedTypes, this.labels);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateStructureResult;
  }

  /**
   * Explain what this tuple represents.
   *
   * @param context - Optional context for more relevant explanation
   * @returns Human-readable explanation
   *
   * @example
   * SemanticTuple.from([200, "OK"]).explain()
   * // "HTTP status response: status code 200 with message 'OK'"
   */
  async explain(context?: string): Promise<string> {
    if (this.elements.length === 0) {
      return 'Empty tuple with no elements.';
    }

    const prompt = createExplainPrompt(this.elements, this.labels, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      explanation: string;
      confidence: number;
    };

    return result.explanation;
  }

  // Standard tuple/array methods

  /**
   * Map elements and return a new SemanticTuple
   */
  map<U>(fn: (element: T[number], index: number) => U): SemanticTuple<U[]> {
    const mapped = this.elements.map(fn);
    return SemanticTuple.from(mapped, this.labels, this.client);
  }

  /**
   * Execute a function for each element
   */
  forEach(fn: (element: T[number], index: number) => void): void {
    this.elements.forEach(fn);
  }

  /**
   * Check if some element satisfies the predicate
   */
  some(predicate: (element: T[number], index: number) => boolean): boolean {
    return this.elements.some(predicate);
  }

  /**
   * Check if every element satisfies the predicate
   */
  every(predicate: (element: T[number], index: number) => boolean): boolean {
    return this.elements.every(predicate);
  }

  /**
   * Reduce the tuple to a single value
   */
  reduce<U>(fn: (acc: U, element: T[number], index: number) => U, initial: U): U {
    return this.elements.reduce(fn, initial);
  }

  /**
   * Iterator support
   */
  [Symbol.iterator](): Iterator<T[number]> {
    return this.elements[Symbol.iterator]();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return `(${this.elements.join(', ')})`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.valueOf();
  }
}
