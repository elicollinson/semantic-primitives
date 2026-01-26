/**
 * SemanticFunction
 * A function wrapper with LLM-powered semantic understanding
 *
 * Enables function analysis, parameter validation, and intelligent
 * behavior understanding.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ValidateResult,
  InferPurposeResult,
  ImprovementSuggestion,
  DetectedIssue,
  SafetyResult,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
import {
  FUNCTION_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createExplainPrompt,
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

/** Documentation format options */
export type DocFormat = 'jsdoc' | 'markdown' | 'plain';

/** Generated test case for function */
export interface FunctionTestCase {
  input: unknown[];
  expectedOutput: unknown;
  description: string;
}

/**
 * SemanticFunction - Function wrapper with LLM-powered analysis
 *
 * Unlike plain functions, SemanticFunction can explain its behavior,
 * validate inputs semantically, and generate test cases.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SemanticFunction<T extends (...args: any[]) => any>
  implements Semantic<T>
{
  private readonly fn: T;
  private readonly description: string | undefined;
  private readonly client: LLMClient;

  private constructor(fn: T, description?: string, client?: LLMClient) {
    this.fn = fn;
    this.description = description;
    this.client = client ?? getClient();
  }

  /**
   * Wrap a function with semantic capabilities.
   *
   * @param fn - Function to wrap
   * @param description - Optional description of what the function does
   * @param client - Optional LLM client
   * @returns SemanticFunction wrapper
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static from<T extends (...args: any[]) => any>(
    fn: T,
    description?: string,
    client?: LLMClient
  ): SemanticFunction<T> {
    return new SemanticFunction(fn, description, client);
  }

  /**
   * Get the function description for LLM analysis.
   */
  private getFunctionDescription(): string {
    const fnString = this.fn.toString();
    const name = this.fn.name || 'anonymous';
    let desc = `Function ${name}`;
    if (this.description) {
      desc += `: ${this.description}`;
    }
    desc += `\nSource: ${fnString.slice(0, 1000)}`;
    return desc;
  }

  /**
   * Check if two functions are semantically equivalent.
   *
   * @param other - Function to compare
   * @param testInputs - Inputs to test with
   * @returns Equivalence result
   */
  async semanticallyEquals(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    other: (...args: any[]) => any,
    testInputs?: unknown[][]
  ): Promise<SemanticEqualsResult> {
    const fn1Desc = this.getFunctionDescription();
    const fn2Desc = `Function ${other.name || 'anonymous'}\nSource: ${other.toString().slice(0, 1000)}`;
    const prompt = createSemanticallyEqualsPrompt(fn1Desc, fn2Desc, testInputs);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Explain what the function does in plain language.
   *
   * @returns Function explanation
   */
  async explain(): Promise<string> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createExplainPrompt(fnDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Validate arguments against semantic rules.
   *
   * @param args - Arguments to validate
   * @param rules - Validation rules
   * @returns Validation result
   */
  async validateArgs(args: unknown[], rules?: string[]): Promise<ValidateResult> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createValidateArgsPrompt(fnDesc, args, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Infer the purpose/category of this function.
   *
   * @returns Inferred purpose
   */
  async inferPurpose(): Promise<InferPurposeResult> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createInferPurposePrompt(fnDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferPurposeResult;
  }

  /**
   * Generate documentation for the function.
   *
   * @param format - Documentation format
   * @returns Generated documentation
   */
  async generateDocs(format: DocFormat = 'jsdoc'): Promise<string> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createGenerateDocsPrompt(fnDesc, format);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { documentation: string };
    return result.documentation;
  }

  /**
   * Suggest improvements for the function.
   *
   * @returns Suggested improvements
   */
  async suggestImprovements(): Promise<ImprovementSuggestion[]> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createSuggestImprovementsPrompt(fnDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { suggestions: ImprovementSuggestion[] };
    return result.suggestions;
  }

  /**
   * Detect potential issues with the function.
   *
   * @returns Detected issues
   */
  async detectIssues(): Promise<DetectedIssue[]> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createDetectIssuesPrompt(fnDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { issues: DetectedIssue[] };
    return result.issues;
  }

  /**
   * Generate test cases for the function.
   *
   * @returns Generated test cases
   */
  async generateTests(): Promise<FunctionTestCase[]> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createGenerateTestsPrompt(fnDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { tests: FunctionTestCase[] };
    return result.tests;
  }

  /**
   * Check if the function is safe to call with given arguments.
   *
   * @param args - Arguments to check
   * @returns Safety assessment
   */
  async isSafeToCall(args: unknown[]): Promise<SafetyResult> {
    const fnDesc = this.getFunctionDescription();
    const prompt = createIsSafeToCallPrompt(fnDesc, args);

    const response = await this.client.complete({
      prompt,
      systemPrompt: FUNCTION_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SafetyResult;
  }

  /**
   * Call the underlying function.
   *
   * @param args - Arguments to pass
   * @returns Function result
   */
  call(...args: Parameters<T>): ReturnType<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.fn(...args) as ReturnType<T>;
  }

  /**
   * Get the underlying function.
   *
   * @returns Original function
   */
  valueOf(): T {
    return this.fn;
  }

  /**
   * Get the function name.
   *
   * @returns Function name or 'anonymous'
   */
  getName(): string {
    return this.fn.name || 'anonymous';
  }

  /**
   * Get the provided description.
   *
   * @returns Description or undefined
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Convert to string representation.
   */
  toString(): string {
    const name = this.getName();
    if (this.description) {
      return `SemanticFunction(${name}): ${this.description}`;
    }
    return `SemanticFunction(${name})`;
  }
}
