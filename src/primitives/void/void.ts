/**
 * SemanticVoid
 * A void type with LLM-powered semantic understanding
 *
 * Provides static methods to analyze void-returning functions,
 * understand their side effects, and validate proper usage patterns.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type { AppropriateResult } from '../../shared/types.ts';
import {
  VOID_SYSTEM_PROMPT,
  createAnalyzeSideEffectsPrompt,
  createShouldReturnValuePrompt,
  createExplainPrompt,
  createValidateUsagePrompt,
  createCheckErrorHandlingPrompt,
  createSuggestSignaturePrompt,
  createIsAppropriateForPrompt,
} from './prompts.ts';

export type { AppropriateResult } from '../../shared/types.ts';

/** Result of analyzing side effects */
export interface AnalyzeSideEffectsResult {
  hasSideEffects: boolean;
  effects: string[];
  pure: boolean;
}

/** Result of checking if function should return a value */
export interface ShouldReturnValueResult {
  shouldReturn: boolean;
  reason: string;
  suggestedType?: string;
}

/** Result of validating void function usage */
export interface ValidateUsageResult {
  appropriate: boolean;
  reason: string;
  suggestion?: string;
}

/** Result of checking error handling */
export interface CheckErrorHandlingResult {
  hasErrorHandling: boolean;
  risks: string[];
  recommendation: string;
}

/** Result of suggesting improved signature */
export interface SuggestSignatureResult {
  current: string;
  suggested: string;
  reason: string;
}

/** Type for void-returning functions */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VoidFunction = (...args: any[]) => void;

/**
 * Get the source code of a function as a string
 */
function getFunctionSource(fn: VoidFunction): string {
  return fn.toString();
}

/**
 * SemanticVoid - Void with LLM-powered semantic understanding
 *
 * Unlike plain void that only represents absence of return,
 * SemanticVoid provides tools to analyze void functions,
 * understand their side effects, and validate proper usage.
 *
 * All methods are static since void cannot be instantiated.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SemanticVoid {
  /**
   * Analyze a void-returning function for its side effects.
   *
   * @param fn - Function to analyze
   * @param client - Optional LLM client for dependency injection
   * @returns Side effect analysis
   *
   * @example
   * await SemanticVoid.analyzeSideEffects(saveToDatabase)
   * // {
   * //   hasSideEffects: true,
   * //   effects: ["database write", "logging"],
   * //   pure: false
   * // }
   */
  static async analyzeSideEffects(
    fn: VoidFunction,
    client?: LLMClient
  ): Promise<AnalyzeSideEffectsResult> {
    const llmClient = client ?? getClient();
    const fnSource = getFunctionSource(fn);
    const prompt = createAnalyzeSideEffectsPrompt(fnSource);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AnalyzeSideEffectsResult;
  }

  /**
   * Check if a function should actually return a value.
   *
   * @param fn - Function to analyze
   * @param context - Context about the function's purpose
   * @param client - Optional LLM client for dependency injection
   * @returns Analysis with recommendation
   *
   * @example
   * await SemanticVoid.shouldReturnValue(processData, "data processing function")
   * // {
   * //   shouldReturn: true,
   * //   reason: "Processing functions typically return the processed result",
   * //   suggestedType: "ProcessedData"
   * // }
   */
  static async shouldReturnValue(
    fn: VoidFunction,
    context?: string,
    client?: LLMClient
  ): Promise<ShouldReturnValueResult> {
    const llmClient = client ?? getClient();
    const fnSource = getFunctionSource(fn);
    const prompt = createShouldReturnValuePrompt(fnSource, context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ShouldReturnValueResult;
  }

  /**
   * Explain what a void function does.
   *
   * @param fn - Function to explain
   * @param client - Optional LLM client for dependency injection
   * @returns Human-readable explanation
   *
   * @example
   * await SemanticVoid.explain(sendNotification)
   * // "Sends a notification to the user without returning a result. Side effects: network request, logging."
   */
  static async explain(
    fn: VoidFunction,
    client?: LLMClient
  ): Promise<string> {
    const llmClient = client ?? getClient();
    const fnSource = getFunctionSource(fn);
    const prompt = createExplainPrompt(fnSource);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Validate that a void function is used appropriately.
   *
   * @param fn - Function to validate
   * @param usage - How the function is being used
   * @param client - Optional LLM client for dependency injection
   * @returns Validation result
   *
   * @example
   * await SemanticVoid.validateUsage(logError, "in array.map()")
   * // {
   * //   appropriate: false,
   * //   reason: "Void functions in map() lose return value, use forEach() instead"
   * // }
   */
  static async validateUsage(
    fn: VoidFunction,
    usage: string,
    client?: LLMClient
  ): Promise<ValidateUsageResult> {
    const llmClient = client ?? getClient();
    const fnSource = getFunctionSource(fn);
    const prompt = createValidateUsagePrompt(fnSource, usage);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateUsageResult;
  }

  /**
   * Detect if a void function is missing error handling.
   *
   * @param fn - Function to analyze
   * @param client - Optional LLM client for dependency injection
   * @returns Error handling assessment
   *
   * @example
   * await SemanticVoid.checkErrorHandling(saveData)
   * // {
   * //   hasErrorHandling: false,
   * //   risks: ["Database errors will be silently ignored"],
   * //   recommendation: "Add try-catch or return Promise to propagate errors"
   * // }
   */
  static async checkErrorHandling(
    fn: VoidFunction,
    client?: LLMClient
  ): Promise<CheckErrorHandlingResult> {
    const llmClient = client ?? getClient();
    const fnSource = getFunctionSource(fn);
    const prompt = createCheckErrorHandlingPrompt(fnSource);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as CheckErrorHandlingResult;
  }

  /**
   * Suggest a better signature for a void function.
   *
   * @param fn - Function to analyze
   * @param client - Optional LLM client for dependency injection
   * @returns Suggested improvements
   *
   * @example
   * await SemanticVoid.suggestSignature(updateUser)
   * // {
   * //   current: "(user: User) => void",
   * //   suggested: "(user: User) => Promise<void>",
   * //   reason: "Async operations should return Promise for error handling"
   * // }
   */
  static async suggestSignature(
    fn: VoidFunction,
    client?: LLMClient
  ): Promise<SuggestSignatureResult> {
    const llmClient = client ?? getClient();
    const fnSource = getFunctionSource(fn);
    const prompt = createSuggestSignaturePrompt(fnSource);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SuggestSignatureResult;
  }

  /**
   * List common patterns where void is appropriate.
   *
   * @returns List of appropriate void patterns
   *
   * @example
   * SemanticVoid.appropriatePatterns()
   * // ["event handlers", "cleanup functions", "logging", "side-effect-only callbacks"]
   */
  static appropriatePatterns(): string[] {
    return [
      'event handlers',
      'cleanup functions',
      'logging and debugging',
      'side-effect-only callbacks',
      'initialization routines',
      'notification dispatchers',
      'DOM manipulation',
      'state mutations',
      'fire-and-forget operations',
      'teardown and disposal',
    ];
  }

  /**
   * Check if void is the correct return type for a function name.
   *
   * @param fnName - Function name to analyze
   * @param client - Optional LLM client for dependency injection
   * @returns Appropriateness assessment
   *
   * @example
   * await SemanticVoid.isAppropriateFor("calculateTotal")
   * // { appropriate: false, reason: "Functions starting with 'calculate' should return a value" }
   *
   * await SemanticVoid.isAppropriateFor("logMessage")
   * // { appropriate: true, reason: "Logging functions are typically void" }
   */
  static async isAppropriateFor(
    fnName: string,
    client?: LLMClient
  ): Promise<AppropriateResult> {
    const llmClient = client ?? getClient();
    const prompt = createIsAppropriateForPrompt(fnName);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AppropriateResult;
  }
}
