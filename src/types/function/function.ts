/**
 * SemanticFunction
 * A function type with LLM-powered semantic understanding
 *
 * Wraps JavaScript functions with semantic capabilities including:
 * - Function explanation
 * - Semantic equality comparison
 * - Argument validation
 * - Purpose inference
 * - Documentation generation
 * - Issue detection
 * - Test case generation
 * - Safety assessment
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ValidateResult,
  InferPurposeResult,
  ImprovementSuggestion,
  DetectedIssue,
  GeneratedTestCase,
  SafetyResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable } from '../../shared/interfaces.ts';
import {
  FUNCTION_SYSTEM_PROMPT,
  createExplainPrompt,
  createSemanticallyEqualsPrompt,
  createValidateArgsPrompt,
  createInferPurposePrompt,
  createGenerateDocsPrompt,
  createSuggestImprovementsPrompt,
  createDetectIssuesPrompt,
  createGenerateTestsPrompt,
  createIsSafeToCallPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResult,
  ValidateResult,
  InferPurposeResult,
  ImprovementSuggestion,
  DetectedIssue,
  GeneratedTestCase,
  SafetyResult,
} from '../../shared/types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * SemanticFunction - Function with LLM-powered semantic understanding
 *
 * Unlike traditional functions, semantic functions can explain what they do,
 * validate arguments semantically, and generate documentation and tests.
 *
 * @template T - The function type
 */
export class SemanticFunction<T extends AnyFunction>
  implements Semantic<T>, Comparable<SemanticFunction<T> | AnyFunction>
{
  private readonly fn: T;
  private readonly fnDescription?: string;
  private readonly client: LLMClient;

  private constructor(fn: T, description?: string, client?: LLMClient) {
    this.fn = fn;
    this.fnDescription = description;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticFunction from an existing function
   */
  static from<T extends AnyFunction>(
    fn: T,
    description?: string,
    client?: LLMClient
  ): SemanticFunction<T> {
    return new SemanticFunction(fn, description, client);
  }

  /**
   * Get the underlying function
   */
  valueOf(): T {
    return this.fn;
  }

  /**
   * Call the underlying function with arguments
   */
  call(...args: Parameters<T>): ReturnType<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.fn(...args) as ReturnType<T>;
  }

  /**
   * Get the function as a string for analysis
   */
  private getFunctionString(): string {
    return this.fn.toString();
  }

  /**
   * Explain what the function does in plain language
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.getFunctionString(), this.fnDescription);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string; confidence: number };
    return result.explanation;
  }

  /**
   * Check if two functions are semantically equivalent
   */
  async semanticallyEquals(
    other: SemanticFunction<T> | AnyFunction,
    options?: { testInputs?: unknown[][] }
  ): Promise<SemanticEqualsResult> {
    const otherFn = other instanceof SemanticFunction ? other.valueOf() : other;
    const prompt = createSemanticallyEqualsPrompt(
      this.getFunctionString(),
      otherFn.toString(),
      options?.testInputs
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as SemanticEqualsResult & { reason?: string };
    return {
      equivalent: result.equivalent,
      confidence: result.confidence,
    };
  }

  /**
   * Validate arguments against semantic rules
   */
  async validateArgs(args: unknown[], rules?: string[]): Promise<ValidateResult> {
    const prompt = createValidateArgsPrompt(this.getFunctionString(), args, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as ValidateResult & { confidence: number };
    return {
      valid: result.valid,
      issues: result.issues,
    };
  }

  /**
   * Infer the purpose and category of this function
   */
  async inferPurpose(): Promise<InferPurposeResult> {
    const prompt = createInferPurposePrompt(this.getFunctionString(), this.fnDescription);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferPurposeResult;
  }

  /**
   * Generate documentation for the function
   */
  async generateDocs(format: 'jsdoc' | 'markdown' | 'plain' = 'jsdoc'): Promise<string> {
    const prompt = createGenerateDocsPrompt(this.getFunctionString(), format);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { documentation: string; confidence: number };
    return result.documentation;
  }

  /**
   * Suggest improvements for the function
   */
  async suggestImprovements(): Promise<ImprovementSuggestion[]> {
    const prompt = createSuggestImprovementsPrompt(this.getFunctionString());

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: ImprovementSuggestion[];
      confidence: number;
    };
    return result.suggestions;
  }

  /**
   * Detect potential issues with the function
   */
  async detectIssues(): Promise<DetectedIssue[]> {
    const prompt = createDetectIssuesPrompt(this.getFunctionString());

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      issues: DetectedIssue[];
      confidence: number;
    };
    return result.issues;
  }

  /**
   * Generate test cases for the function
   */
  async generateTests(): Promise<GeneratedTestCase[]> {
    const prompt = createGenerateTestsPrompt(this.getFunctionString());

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      testCases: GeneratedTestCase[];
      confidence: number;
    };
    return result.testCases;
  }

  /**
   * Check if it's safe to call this function with the given arguments
   */
  async isSafeToCall(args: unknown[]): Promise<SafetyResult> {
    const prompt = createIsSafeToCallPrompt(this.getFunctionString(), args);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as SafetyResult & { confidence: number };
    return {
      safe: result.safe,
      reason: result.reason,
    };
  }

  /**
   * Get the description if provided
   */
  get description(): string | undefined {
    return this.fnDescription;
  }

  /**
   * Get the function name
   */
  get name(): string {
    return this.fn.name || 'anonymous';
  }

  /**
   * Get the number of expected parameters
   */
  get length(): number {
    return this.fn.length;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.fn.toString();
  }

  /**
   * Convert to JSON (returns function string)
   */
  toJSON(): string {
    return this.fn.toString();
  }
}
