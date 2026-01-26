/**
 * SemanticCallable
 * A callable wrapper with LLM-powered semantic understanding
 *
 * Enables callable analysis, parameter validation, signature inference,
 * and intelligent behavior understanding.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ValidateResult,
  DetectedIssue,
  SafetyResult,
  SeverityLevel,
} from '../../shared/types.ts';
import type { Semantic } from '../../shared/interfaces.ts';
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

export type {
  SemanticEqualsResult,
  ValidateResult,
  DetectedIssue,
  SafetyResult,
} from '../../shared/types.ts';

/** Parameter information from signature inference */
export interface InferredParameter {
  name: string;
  type: string;
  optional: boolean;
}

/** Result of signature inference */
export interface InferSignatureResult {
  parameters: InferredParameter[];
  returnType: string;
  generics: string[];
  confidence: number;
}

/** Result of type definition generation */
export interface GenerateTypeDefinitionResult {
  typeDefinition: string;
  interfaceName: string;
}

/** Generated test case for callable */
export interface CallableTestCase {
  input: unknown[];
  expectedOutput: unknown;
  description: string;
  shouldThrow?: boolean;
}

/** Result of wrapper suggestion */
export interface SuggestWrapperResult {
  wrapper: string;
  benefits: string[];
  validations: string[];
}

/** Sample call for signature inference */
export interface SampleCall {
  args: unknown[];
  result?: unknown;
}

/**
 * SemanticCallable - Callable wrapper with LLM-powered analysis
 *
 * Unlike plain functions, SemanticCallable can explain its behavior,
 * infer signatures from usage, validate inputs semantically, and generate
 * type-safe wrappers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SemanticCallable<T extends (...args: any[]) => any>
  implements Semantic<T>
{
  private readonly callable: T;
  private readonly description: string | undefined;
  private readonly client: LLMClient;

  private constructor(callable: T, description?: string, client?: LLMClient) {
    this.callable = callable;
    this.description = description;
    this.client = client ?? getClient();
  }

  /**
   * Wrap a callable with semantic capabilities.
   *
   * @param callable - Callable to wrap
   * @param description - Optional description of what the callable does
   * @param client - Optional LLM client
   * @returns SemanticCallable wrapper
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static from<T extends (...args: any[]) => any>(
    callable: T,
    description?: string,
    client?: LLMClient
  ): SemanticCallable<T> {
    return new SemanticCallable(callable, description, client);
  }

  /**
   * Get the callable description for LLM analysis.
   */
  private getCallableDescription(): string {
    const callableString = this.callable.toString();
    const name = this.callable.name || 'anonymous';
    let desc = `Callable ${name}`;
    if (this.description) {
      desc += `: ${this.description}`;
    }
    desc += `\nSource: ${callableString.slice(0, 1000)}`;
    return desc;
  }

  /**
   * Check if two callables are semantically equivalent.
   *
   * @param other - Callable to compare
   * @param testInputs - Inputs to test with
   * @returns Equivalence result
   */
  async semanticallyEquals(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    other: (...args: any[]) => any,
    testInputs?: unknown[][]
  ): Promise<SemanticEqualsResult> {
    const callable1Desc = this.getCallableDescription();
    const callable2Desc = `Callable ${other.name || 'anonymous'}\nSource: ${other.toString().slice(0, 1000)}`;
    const prompt = createSemanticallyEqualsPrompt(callable1Desc, callable2Desc, testInputs);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Explain what the callable does in plain language.
   *
   * @returns Callable explanation
   */
  async explain(): Promise<string> {
    const callableDesc = this.getCallableDescription();
    const prompt = createExplainPrompt(callableDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Infer the type signature from sample calls.
   *
   * @param sampleCalls - Sample calls with arguments and optional results
   * @returns Inferred signature
   */
  async inferSignature(sampleCalls: SampleCall[]): Promise<InferSignatureResult> {
    const callableDesc = this.getCallableDescription();
    const prompt = createInferSignaturePrompt(callableDesc, sampleCalls);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferSignatureResult;
  }

  /**
   * Generate a TypeScript type definition for the callable.
   *
   * @param name - Optional preferred name for the type
   * @returns Type definition
   */
  async generateTypeDefinition(name?: string): Promise<GenerateTypeDefinitionResult> {
    const callableDesc = this.getCallableDescription();
    const prompt = createGenerateTypeDefinitionPrompt(callableDesc, name);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    return JSON.parse(response.content) as GenerateTypeDefinitionResult;
  }

  /**
   * Validate arguments against semantic rules.
   *
   * @param args - Arguments to validate
   * @param rules - Validation rules
   * @returns Validation result
   */
  async validateArgs(args: unknown[], rules?: string[]): Promise<ValidateResult> {
    const callableDesc = this.getCallableDescription();
    const prompt = createValidateArgsPrompt(callableDesc, args, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateResult;
  }

  /**
   * Generate test cases for the callable.
   *
   * @returns Generated test cases
   */
  async generateTests(): Promise<CallableTestCase[]> {
    const callableDesc = this.getCallableDescription();
    const prompt = createGenerateTestsPrompt(callableDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { tests: CallableTestCase[] };
    return result.tests;
  }

  /**
   * Suggest a type-safe wrapper for the callable.
   *
   * @returns Wrapper suggestion
   */
  async suggestWrapper(): Promise<SuggestWrapperResult> {
    const callableDesc = this.getCallableDescription();
    const prompt = createSuggestWrapperPrompt(callableDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    return JSON.parse(response.content) as SuggestWrapperResult;
  }

  /**
   * Detect potential issues with the callable.
   *
   * @returns Detected issues
   */
  async detectIssues(): Promise<DetectedIssue[]> {
    const callableDesc = this.getCallableDescription();
    const prompt = createDetectIssuesPrompt(callableDesc);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { issues: DetectedIssue[] };
    return result.issues;
  }

  /**
   * Check if the callable is safe to call with given arguments.
   *
   * @param args - Arguments to check
   * @returns Safety assessment
   */
  async isSafeToCall(args: unknown[]): Promise<SafetyResult> {
    const callableDesc = this.getCallableDescription();
    const prompt = createIsSafeToCallPrompt(callableDesc, args);

    const response = await this.client.complete({
      prompt,
      systemPrompt: CALLABLE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      safe: boolean;
      reason?: string;
      severity?: SeverityLevel;
    };

    return {
      safe: result.safe,
      reason: result.reason ?? undefined,
      severity: result.severity,
    };
  }

  /**
   * Call the underlying callable.
   *
   * @param args - Arguments to pass
   * @returns Callable result
   */
  call(...args: Parameters<T>): ReturnType<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.callable(...args) as ReturnType<T>;
  }

  /**
   * Get the underlying callable.
   *
   * @returns Original callable
   */
  valueOf(): T {
    return this.callable;
  }

  /**
   * Get the callable name.
   *
   * @returns Callable name or 'anonymous'
   */
  getName(): string {
    return this.callable.name || 'anonymous';
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
      return `SemanticCallable(${name}): ${this.description}`;
    }
    return `SemanticCallable(${name})`;
  }
}
