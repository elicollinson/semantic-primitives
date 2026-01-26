/**
 * SemanticCallable
 * A callable type with LLM-powered semantic understanding
 *
 * Implements:
 * - Behavioral analysis and comparison
 * - Signature inference from usage patterns
 * - Intelligent argument validation
 * - Test case generation
 * - Issue detection
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ValidateResult,
  DetectedIssue,
  SafetyResult,
} from '../../shared/types.ts';
import {
  CALLABLE_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createExplainPrompt,
  createInferSignaturePrompt,
  createGenerateTypeDefinitionPrompt,
  createValidateArgsPrompt,
  createGenerateTestsPrompt,
  createSuggestWrapperPrompt,
  createDetectIssuesPrompt,
  createIsSafeToCallPrompt,
} from './prompts.ts';

export type { SemanticEqualsResult, ValidateResult, DetectedIssue, SafetyResult };

/** Inferred signature result */
export interface InferredSignature {
  params: string[];
  return: string;
  confidence: number;
}

/** Wrapper suggestion result */
export interface WrapperSuggestion {
  code: string;
  reason: string;
}

/** Generated test case for callable (typed version) */
export interface CallableTestCase<TInput extends unknown[] = unknown[], TOutput = unknown> {
  inputs: TInput;
  expectedOutput: TOutput;
  description: string;
}

/**
 * SemanticCallable - Function wrapper with LLM-powered semantic understanding
 *
 * Wraps a function and provides intelligent analysis, validation, and code generation.
 */
export class SemanticCallable<T extends (...args: never[]) => unknown> {
  readonly [Symbol.toStringTag] = 'SemanticCallable';

  private readonly _fn: T;
  private readonly _description?: string;
  private readonly _client: LLMClient;
  private _cachedSource?: string;

  private constructor(
    fn: T,
    description?: string,
    client?: LLMClient
  ) {
    this._fn = fn;
    this._description = description;
    this._client = client ?? getClient();
  }

  /**
   * Wrap a function with semantic callable capabilities.
   *
   * @param fn - Function to wrap
   * @param description - Optional description of what the function does
   * @param client - Optional LLM client
   * @returns SemanticCallable wrapper
   *
   * @example
   * const calc = SemanticCallable.from((a, b) => a + b, "adds two numbers")
   */
  static from<T extends (...args: never[]) => unknown>(
    fn: T,
    description?: string,
    client?: LLMClient
  ): SemanticCallable<T> {
    if (fn instanceof SemanticCallable) {
      return fn as unknown as SemanticCallable<T>;
    }
    return new SemanticCallable(fn, description, client);
  }

  /**
   * Get the source code representation of the function.
   * Uses Function.prototype.toString() for native functions.
   */
  private getSource(): string {
    if (this._cachedSource) {
      return this._cachedSource;
    }
    this._cachedSource = this._fn.toString();
    return this._cachedSource;
  }

  /**
   * Check if two callables are behaviorally equivalent.
   * Same outputs for same inputs, regardless of implementation.
   *
   * @param other - Callable to compare
   * @param testCases - Optional inputs to test with
   * @returns Equivalence result with confidence
   *
   * @example
   * fn1.semanticallyEquals(fn2, [[1, 2], [3, 4]])
   * // { equivalent: true, confidence: 0.95 }
   */
  async semanticallyEquals(
    other: ((...args: Parameters<T>) => ReturnType<T>) | SemanticCallable<T>,
    testCases?: Parameters<T>[]
  ): Promise<SemanticEqualsResult> {
    const otherFn = other instanceof SemanticCallable ? other._fn : other;
    const otherSource = other instanceof SemanticCallable
      ? other.getSource()
      : otherFn.toString();
    const otherDescription = other instanceof SemanticCallable
      ? other._description
      : undefined;

    const prompt = createSemanticallyEqualsPrompt(
      this.getSource(),
      otherSource,
      this._description,
      otherDescription,
      testCases as unknown[][]
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Explain what this callable does.
   *
   * @returns Human-readable explanation
   *
   * @example
   * fn.explain()
   * // "Takes two numbers and returns their sum, handling NaN edge cases"
   */
  async explain(): Promise<string> {
    const prompt = createExplainPrompt(this.getSource(), this._description);

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Infer parameter types from usage patterns.
   *
   * @param sampleCalls - Sample inputs used to call the function
   * @returns Inferred signature with confidence
   *
   * @example
   * fn.inferSignature([[1, 2], ["a", "b"], [true, false]])
   * // { params: ["number | string | boolean", "number | string | boolean"], return: "..." }
   */
  async inferSignature(sampleCalls: Parameters<T>[]): Promise<InferredSignature> {
    const prompt = createInferSignaturePrompt(
      this.getSource(),
      sampleCalls as unknown[][]
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferredSignature;
  }

  /**
   * Generate TypeScript type definition for this callable.
   *
   * @returns Type definition string
   *
   * @example
   * fn.generateTypeDefinition()
   * // "type Calculator = (a: number, b: number) => number;"
   */
  async generateTypeDefinition(): Promise<string> {
    const prompt = createGenerateTypeDefinitionPrompt(
      this.getSource(),
      this._description
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as { typeDefinition: string };
    return result.typeDefinition;
  }

  /**
   * Validate inputs against semantic rules.
   *
   * @param args - Arguments to validate
   * @param rules - Optional validation rules
   * @returns Validation result
   *
   * @example
   * divide.validateArgs([10, 0], ["divisor must not be zero"])
   * // { valid: false, issues: ["divisor is zero"] }
   */
  async validateArgs(
    args: Parameters<T>,
    rules?: string[]
  ): Promise<ValidateResult> {
    const prompt = createValidateArgsPrompt(
      this.getSource(),
      args as unknown[],
      rules
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Generate test cases for this callable.
   *
   * @returns Generated test cases
   *
   * @example
   * fn.generateTests()
   * // [
   * //   { inputs: [0, 0], expectedOutput: 0, description: "zero case" },
   * //   { inputs: [1, -1], expectedOutput: 0, description: "opposite numbers" }
   * // ]
   */
  async generateTests(): Promise<CallableTestCase<Parameters<T>, ReturnType<T>>[]> {
    const prompt = createGenerateTestsPrompt(
      this.getSource(),
      this._description
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.4,
    });

    const result = JSON.parse(response.content) as {
      tests: {
        inputs: Parameters<T>;
        expectedOutput: ReturnType<T>;
        description: string;
      }[];
    };

    return result.tests;
  }

  /**
   * Suggest type-safe wrapper or decorator.
   *
   * @returns Suggested wrapper code with reasoning
   *
   * @example
   * fn.suggestWrapper()
   * // { code: "function safeDivide(a: number, b: number): number | null { ... }", reason: "..." }
   */
  async suggestWrapper(): Promise<WrapperSuggestion> {
    // First detect issues to inform wrapper suggestion
    const issues = await this.detectIssues();
    const issueDescriptions = issues.map(i => i.issue);

    const prompt = createSuggestWrapperPrompt(
      this.getSource(),
      this._description,
      issueDescriptions
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    return JSON.parse(response.content) as WrapperSuggestion;
  }

  /**
   * Detect potential issues with the callable.
   *
   * @returns Detected issues with severity
   *
   * @example
   * fn.detectIssues()
   * // [{ issue: "No null check for optional param", severity: "warning" }]
   */
  async detectIssues(): Promise<DetectedIssue[]> {
    const prompt = createDetectIssuesPrompt(
      this.getSource(),
      this._description
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as { issues: DetectedIssue[] };
    return result.issues;
  }

  /**
   * Check if the callable is safe to call with given arguments.
   *
   * @param args - Arguments to check
   * @returns Safety assessment
   *
   * @example
   * divide.isSafeToCall([10, 0])
   * // { safe: false, reason: "Division by zero" }
   */
  async isSafeToCall(args: Parameters<T>): Promise<SafetyResult> {
    const prompt = createIsSafeToCallPrompt(
      this.getSource(),
      args as unknown[],
      this._description
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SafetyResult;
  }

  /**
   * Call the underlying function.
   *
   * @param args - Arguments to pass to the function
   * @returns Function result
   *
   * @example
   * const result = add.call(1, 2)
   * // 3
   */
  call(...args: Parameters<T>): ReturnType<T> {
    return this._fn(...args) as ReturnType<T>;
  }

  /**
   * Get the underlying function.
   *
   * @returns Original function
   *
   * @example
   * const originalFn = semanticCallable.valueOf()
   */
  valueOf(): T {
    return this._fn;
  }

  /**
   * Get the description of this callable.
   *
   * @returns Description if provided, undefined otherwise
   */
  getDescription(): string | undefined {
    return this._description;
  }

  /**
   * Get the function's name.
   *
   * @returns Function name or 'anonymous'
   */
  getName(): string {
    return this._fn.name || 'anonymous';
  }

  /**
   * Get the function's arity (number of expected arguments).
   *
   * @returns Number of parameters
   */
  getArity(): number {
    return this._fn.length;
  }
}
