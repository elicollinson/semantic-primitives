/**
 * SemanticConstructable
 * A constructor type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T> - Base semantic wrapper
 * - Comparable<SemanticConstructable<T>> - Semantic equality comparison
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ValidateResult,
  DetectPatternResult,
  ImprovementSuggestion,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
import {
  CONSTRUCTABLE_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createValidateArgsPrompt,
  createAnalyzeInstanceShapePrompt,
  createExplainPrompt,
  createDetectPatternsPrompt,
  createGenerateDocsPrompt,
  createSuggestImprovementsPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResult,
  ValidateResult,
  DetectPatternResult,
  ImprovementSuggestion,
} from '../../shared/types.ts';

/** Constructor type constraint - uses any[] to support constructors with typed parameters */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = unknown> = new (...args: any[]) => T;

/** Extended semantic equals result with instance differences */
export interface ConstructableSemanticEqualsResult extends SemanticEqualsResult {
  instanceDifferences: string[];
}

/** Result of analyzing instance shape */
export interface InstanceShapeResult {
  properties: Record<string, string>;
  methods: string[];
  instanceOf: string[];
}

/** Result of createValidated operation */
export type CreateValidatedResult<T> =
  | { success: true; instance: T }
  | { success: false; errors: string[] };

/** Documentation format options */
export type DocFormat = 'jsdoc' | 'markdown' | 'plain';

/**
 * SemanticConstructable - Constructor with LLM-powered semantic understanding
 *
 * Wraps constructor functions/classes to enable semantic analysis,
 * validation, and intelligent instantiation patterns.
 *
 * @template T - The constructor type
 */
export class SemanticConstructable<T extends Constructor>
  implements Semantic<T>
{
  private readonly ctor: T;
  private readonly description?: string;
  private readonly client: LLMClient;

  private constructor(ctor: T, description?: string, client?: LLMClient) {
    this.ctor = ctor;
    this.description = description;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticConstructable from a constructor function or class
   *
   * @param ctor - Constructor function/class to wrap
   * @param description - Optional description of what the constructor creates
   * @param client - Optional LLM client
   * @returns SemanticConstructable wrapper
   */
  static from<T extends Constructor>(
    ctor: T,
    description?: string,
    client?: LLMClient
  ): SemanticConstructable<T> {
    return new SemanticConstructable(ctor, description, client);
  }

  /**
   * Get the underlying constructor
   */
  valueOf(): T {
    return this.ctor;
  }

  /**
   * Get the constructor name
   */
  get name(): string {
    return this.ctor.name || 'anonymous';
  }

  /**
   * Get the source representation of the constructor
   */
  private getSource(): string {
    return this.ctor.toString();
  }

  /**
   * Check if an instance was created by this constructor
   *
   * @param instance - Instance to check
   * @returns Whether it's an instance of this constructor
   */
  isInstance(instance: unknown): instance is InstanceType<T> {
    return instance instanceof this.ctor;
  }

  /**
   * Create an instance using the constructor
   *
   * @param args - Constructor arguments
   * @returns New instance
   */
  create(...args: ConstructorParameters<T>): InstanceType<T> {
    return new this.ctor(...args) as InstanceType<T>;
  }

  /**
   * Create an instance with validation
   *
   * @param args - Constructor arguments
   * @returns New instance or validation errors
   */
  async createValidated(
    ...args: ConstructorParameters<T>
  ): Promise<CreateValidatedResult<InstanceType<T>>> {
    const validation = await this.validateArgs(args);

    if (!validation.valid) {
      return { success: false, errors: validation.issues };
    }

    try {
      const instance = new this.ctor(...args) as InstanceType<T>;
      return { success: true, instance };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, errors: [`Construction failed: ${errorMessage}`] };
    }
  }

  /**
   * Check if two constructors create semantically equivalent instances
   *
   * @param other - Constructor to compare
   * @param testArgs - Arguments to test with
   * @returns Equivalence result
   */
  async semanticallyEquals(
    other: Constructor | SemanticConstructable<Constructor>,
    testArgs?: ConstructorParameters<T>[]
  ): Promise<ConstructableSemanticEqualsResult> {
    const otherCtor = other instanceof SemanticConstructable ? other.valueOf() : other;
    const testArgsStr = testArgs ? JSON.stringify(testArgs) : undefined;

    const prompt = createSemanticallyEqualsPrompt(
      this.getSource(),
      this.name,
      otherCtor.toString(),
      otherCtor.name || 'anonymous',
      testArgsStr
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ConstructableSemanticEqualsResult;
  }

  /**
   * Validate constructor arguments
   *
   * @param args - Arguments to validate
   * @param rules - Additional validation rules
   * @returns Validation result
   */
  async validateArgs(
    args: ConstructorParameters<T>,
    rules?: string[]
  ): Promise<ValidateResult> {
    const prompt = createValidateArgsPrompt(
      this.getSource(),
      this.name,
      JSON.stringify(args),
      rules
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Analyze the shape of instances this constructor creates
   *
   * @returns Instance shape analysis
   */
  async analyzeInstanceShape(): Promise<InstanceShapeResult> {
    const prompt = createAnalyzeInstanceShapePrompt(
      this.getSource(),
      this.name
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InstanceShapeResult;
  }

  /**
   * Explain what this constructor creates
   *
   * @returns Human-readable explanation
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(
      this.getSource(),
      this.name,
      this.description
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Detect design patterns used by this constructor
   *
   * @returns Detected patterns
   */
  async detectPatterns(): Promise<DetectPatternResult> {
    const prompt = createDetectPatternsPrompt(
      this.getSource(),
      this.name
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as DetectPatternResult;
  }

  /**
   * Generate documentation for this constructor
   *
   * @param format - Documentation format (jsdoc, markdown, or plain)
   * @returns Generated documentation
   */
  async generateDocs(format: DocFormat = 'jsdoc'): Promise<string> {
    const prompt = createGenerateDocsPrompt(
      this.getSource(),
      this.name,
      format
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { documentation: string };
    return result.documentation;
  }

  /**
   * Suggest improvements for the constructor
   *
   * @returns Suggested improvements
   */
  async suggestImprovements(): Promise<ImprovementSuggestion[]> {
    const prompt = createSuggestImprovementsPrompt(
      this.getSource(),
      this.name
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { suggestions: ImprovementSuggestion[] };
    return result.suggestions;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `SemanticConstructable<${this.name}>`;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { name: string; description?: string; source: string } {
    return {
      name: this.name,
      description: this.description,
      source: this.getSource(),
    };
  }
}
