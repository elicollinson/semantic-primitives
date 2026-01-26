/**
 * SemanticConstructable
 * A constructor/class type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T> - Base semantic wrapper
 * - Comparable - Semantic equality comparison
 * - Validatable - Validation of constructor arguments
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ValidateResult,
  DetectPatternResult,
  ImprovementSuggestion,
} from '../../shared/types.ts';
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

// Re-export shared types used by this module
export type {
  SemanticEqualsResult,
  ValidateResult,
  DetectPatternResult,
  ImprovementSuggestion,
} from '../../shared/types.ts';

/**
 * Extended semantic equals result with instance differences
 */
export interface ConstructableSemanticEqualsResult extends SemanticEqualsResult {
  instanceDifferences: string[];
}

/**
 * Result of instance shape analysis
 */
export interface InstanceShapeResult {
  properties: Record<string, string>;
  methods: string[];
  instanceOf: string[];
}

/**
 * Result of validated creation
 */
export type CreateValidatedResult<T> =
  | { success: true; instance: T }
  | { success: false; errors: string[] };

/**
 * Generic constructor type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = unknown> = new (...args: any[]) => T;

/**
 * SemanticConstructable - Constructor/class with LLM-powered semantic understanding
 *
 * Unlike traditional constructor wrappers that only handle instantiation,
 * semantic constructables can analyze class contracts, validate arguments,
 * and explain what they create.
 *
 * @template T - The constructor type being wrapped
 */
export class SemanticConstructable<T extends Constructor> {
  private readonly ctor: T;
  private readonly description: string | undefined;
  private readonly client: LLMClient;
  private readonly ctorSource: string;

  private constructor(ctor: T, description?: string, client?: LLMClient) {
    this.ctor = ctor;
    this.description = description;
    this.client = client ?? getClient();
    this.ctorSource = this.extractSource(ctor);
  }

  /**
   * Extract the source code representation of a constructor
   */
  private extractSource(ctor: T): string {
    const source = ctor.toString();
    // Add description if provided
    if (this.description) {
      return `// ${this.description}\n${source}`;
    }
    return source;
  }

  /**
   * Get the constructor name
   */
  private getCtorName(): string {
    return this.ctor.name || 'AnonymousConstructor';
  }

  /**
   * Create a SemanticConstructable from a constructor/class
   *
   * @param ctor - Constructor function or class
   * @param description - Optional description of what the constructor creates
   * @param client - Optional LLM client
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
   * Check if two constructors create semantically equivalent instances
   *
   * @param other - Constructor to compare with
   * @param testArgs - Optional arguments to test instantiation with
   */
  async semanticallyEquals(
    other: Constructor,
    testArgs?: ConstructorParameters<T>[]
  ): Promise<ConstructableSemanticEqualsResult> {
    const otherSource = other.toString();
    const otherName = other.name || 'AnonymousConstructor';

    const prompt = createSemanticallyEqualsPrompt(
      this.ctorSource,
      this.getCtorName(),
      otherSource,
      otherName,
      testArgs
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
   * @param rules - Optional additional validation rules
   */
  async validateArgs(
    args: ConstructorParameters<T>,
    rules?: string[]
  ): Promise<ValidateResult> {
    const prompt = createValidateArgsPrompt(
      this.ctorSource,
      this.getCtorName(),
      args as unknown[],
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
   */
  async analyzeInstanceShape(): Promise<InstanceShapeResult> {
    const prompt = createAnalyzeInstanceShapePrompt(
      this.ctorSource,
      this.getCtorName()
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
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.ctorSource, this.getCtorName());

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
   */
  async detectPatterns(): Promise<DetectPatternResult> {
    const prompt = createDetectPatternsPrompt(
      this.ctorSource,
      this.getCtorName()
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
   * @param format - Documentation format (jsdoc, markdown, plain)
   */
  async generateDocs(format: 'jsdoc' | 'markdown' | 'plain' = 'jsdoc'): Promise<string> {
    const prompt = createGenerateDocsPrompt(
      this.ctorSource,
      this.getCtorName(),
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
   * Suggest improvements for this constructor
   */
  async suggestImprovements(): Promise<ImprovementSuggestion[]> {
    const prompt = createSuggestImprovementsPrompt(
      this.ctorSource,
      this.getCtorName()
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: CONSTRUCTABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: ImprovementSuggestion[];
    };
    return result.suggestions;
  }

  /**
   * Check if an instance was created by this constructor
   *
   * @param instance - Instance to check
   */
  isInstance(instance: unknown): instance is InstanceType<T> {
    return instance instanceof this.ctor;
  }

  /**
   * Create an instance with validation
   *
   * @param args - Constructor arguments
   */
  async createValidated(
    ...args: ConstructorParameters<T>
  ): Promise<CreateValidatedResult<InstanceType<T>>> {
    // First validate the arguments
    const validation = await this.validateArgs(args);

    if (!validation.valid) {
      return { success: false, errors: validation.issues };
    }

    // Arguments are valid, create the instance
    try {
      const instance = new this.ctor(...args) as InstanceType<T>;
      return { success: true, instance };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, errors: [`Construction failed: ${message}`] };
    }
  }

  /**
   * Create an instance using the constructor
   *
   * @param args - Constructor arguments
   */
  create(...args: ConstructorParameters<T>): InstanceType<T> {
    return new this.ctor(...args) as InstanceType<T>;
  }

  /**
   * Get the constructor name
   */
  get name(): string {
    return this.getCtorName();
  }

  /**
   * Get the description
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const name = this.getCtorName();
    return this.description
      ? `SemanticConstructable<${name}> (${this.description})`
      : `SemanticConstructable<${name}>`;
  }
}
