/**
 * SemanticTuple
 * A tuple type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T[]> - Base semantic wrapper
 * - Comparable<SemanticTuple<T>> - Semantic equality comparison
 * - Explainable - Human-readable explanations
 * - PatternDetectable - Tuple pattern detection
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

export type { SemanticEqualsResultWithReason, DetectPatternResult } from '../../shared/types.ts';

/** Result of inferring positional meaning */
export interface PositionalMeaningResult {
  positions: Record<number, { meaning: string; confidence: number }>;
  overallPattern?: string;
}

/** Result of relationship validation */
export interface ValidateRelationshipResult {
  valid: boolean;
  violations: string[];
  confidence?: number;
}

/** Result of structure validation */
export interface ValidateStructureResult {
  valid: boolean;
  issues: { position: number; expected: string; actual: string }[];
  confidence?: number;
}

/** Result of toObject operation */
export interface ToObjectResult {
  labels: string[];
  object: Record<string, unknown>;
  confidence: number;
}

/** Result of getByLabel operation */
export interface GetByLabelResult<T> {
  value: T | undefined;
  index: number | null;
  matchedLabel?: string;
  confidence: number;
}

/**
 * SemanticTuple - Tuple with LLM-powered semantic understanding
 *
 * Unlike traditional tuples that only support index-based access,
 * semantic tuples understand positional meaning, can detect patterns,
 * and support label-based access.
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
  private readonly labels?: string[];
  private readonly client: LLMClient;

  private constructor(elements: T, labels?: string[], client?: LLMClient) {
    this.elements = [...elements] as T;
    this.labels = labels ? [...labels] : undefined;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticTuple from values with optional position labels
   */
  static from<T extends unknown[]>(
    values: T,
    labels?: string[],
    client?: LLMClient
  ): SemanticTuple<T> {
    return new SemanticTuple(values, labels, client);
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
   * Get the labels for this tuple (if set)
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
   * @returns Equivalence result with reason
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
   * @returns Position meanings
   */
  async inferPositionalMeaning(context?: string): Promise<PositionalMeaningResult> {
    const prompt = createInferPositionalMeaningPrompt(this.elements, context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      positions: Record<string, { meaning: string; confidence: number }>;
      overallPattern?: string;
    };

    // Convert string keys to numbers
    const positions: Record<number, { meaning: string; confidence: number }> = {};
    for (const [key, value] of Object.entries(result.positions)) {
      positions[parseInt(key, 10)] = value;
    }

    return {
      positions,
      overallPattern: result.overallPattern,
    };
  }

  /**
   * Validate relationships between tuple elements.
   *
   * @param rules - Validation rules
   * @returns Validation result
   */
  async validateRelationship(rules: string[]): Promise<ValidateRelationshipResult> {
    if (rules.length === 0) {
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
   * @returns Detected tuple pattern
   */
  async detectPattern(): Promise<DetectPatternResult> {
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
   * @param labels - Optional custom labels (uses inferred if not provided)
   * @returns Object with labeled properties
   */
  async toObject(labels?: string[]): Promise<Record<string, unknown>> {
    const labelsToUse = labels ?? this.labels;

    // If we have exact labels for each position, use them directly
    if (labelsToUse?.length === this.elements.length) {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < this.elements.length; i++) {
        const label = labelsToUse[i];
        if (label !== undefined) {
          obj[label] = this.elements[i];
        }
      }
      return obj;
    }

    // Otherwise, use LLM to infer labels
    const prompt = createToObjectPrompt(this.elements, labelsToUse);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as ToObjectResult;
    return result.object;
  }

  /**
   * Access an element by semantic label instead of index.
   *
   * @param label - Semantic label for the position
   * @returns Value at that position, or undefined if not found
   */
  async getByLabel(label: string): Promise<T[number] | undefined> {
    // Check existing labels first (case-insensitive)
    if (this.labels) {
      const labelLower = label.toLowerCase();
      const index = this.labels.findIndex((l) => l.toLowerCase() === labelLower);
      if (index !== -1) {
        return this.elements[index];
      }
    }

    // Use LLM for semantic matching
    const prompt = createGetByLabelPrompt(this.elements, label, this.labels);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      index: number | null;
      matchedLabel?: string;
      confidence: number;
    };

    if (result.index !== null && result.index >= 0 && result.index < this.elements.length) {
      return this.elements[result.index];
    }

    return undefined;
  }

  /**
   * Validate that the tuple matches expected structure.
   *
   * @param expectedTypes - Expected type for each position
   * @returns Validation result
   */
  async validateStructure(expectedTypes: string[]): Promise<ValidateStructureResult> {
    // Quick check for length mismatch
    if (expectedTypes.length !== this.elements.length) {
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

    const prompt = createValidateStructurePrompt(this.elements, expectedTypes);

    const response = await this.client.complete({
      prompt,
      systemPrompt: TUPLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as ValidateStructureResult;

    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Explain what this tuple represents.
   *
   * @returns Human-readable explanation
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.elements, this.labels);

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

  /**
   * Create a new SemanticTuple with updated labels
   */
  withLabels(labels: string[]): SemanticTuple<T> {
    return new SemanticTuple(this.elements, labels, this.client);
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
    return `[${this.elements.join(', ')}]`;
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.valueOf();
  }
}
