/**
 * SemanticVoid
 * A utility class with LLM-powered semantic understanding for void functions
 *
 * Helps analyze void-returning functions, understand side effects,
 * and validate proper usage.
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
  createAppropriatePatternsPrompt,
} from './prompts.ts';

export type { AppropriateResult } from '../../shared/types.ts';

/** Result of side effects analysis */
export interface AnalyzeSideEffectsResult {
  hasSideEffects: boolean;
  effects: string[];
  pure: boolean;
}

/** Result of should return value analysis */
export interface ShouldReturnValueResult {
  shouldReturn: boolean;
  reason: string;
  suggestedType?: string;
}

/** Result of validate usage */
export interface ValidateUsageResult {
  appropriate: boolean;
  reason: string;
  suggestion?: string;
}

/** Result of error handling check */
export interface CheckErrorHandlingResult {
  hasErrorHandling: boolean;
  risks: string[];
  recommendation: string;
}

/** Result of signature suggestion */
export interface SuggestSignatureResult {
  current: string;
  suggested: string;
  reason: string;
}

/**
 * SemanticVoid - Static utilities for void function analysis
 *
 * Unlike other semantic types that wrap values, SemanticVoid is primarily
 * a collection of static methods for analyzing void-returning functions,
 * their side effects, and appropriate usage patterns.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SemanticVoid {
  private static defaultClient: LLMClient | undefined;

  /**
   * Set a default LLM client for all SemanticVoid operations.
   */
  static setClient(client: LLMClient): void {
    SemanticVoid.defaultClient = client;
  }

  /**
   * Get the LLM client to use.
   */
  private static getClientInstance(client?: LLMClient): LLMClient {
    return client ?? SemanticVoid.defaultClient ?? getClient();
  }

  /**
   * Convert a function to a string description for analysis.
   */
  private static getFunctionDescription(// eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void): string {
    const fnString = fn.toString();
    const name = fn.name || 'anonymous';
    return `Function ${name}: ${fnString.slice(0, 500)}`;
  }

  /**
   * Analyze a void-returning function for its side effects.
   *
   * @param fn - Function to analyze
   * @param client - Optional LLM client
   * @returns Side effect analysis
   */
  static async analyzeSideEffects(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void,
    client?: LLMClient
  ): Promise<AnalyzeSideEffectsResult> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const fnDescription = SemanticVoid.getFunctionDescription(fn);
    const prompt = createAnalyzeSideEffectsPrompt(fnDescription);

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
   * @param client - Optional LLM client
   * @returns Analysis with recommendation
   */
  static async shouldReturnValue(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void,
    context?: string,
    client?: LLMClient
  ): Promise<ShouldReturnValueResult> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const fnDescription = SemanticVoid.getFunctionDescription(fn);
    const prompt = createShouldReturnValuePrompt(fnDescription, context);

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
   * @param client - Optional LLM client
   * @returns Human-readable explanation
   */
  static async explain(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void,
    client?: LLMClient
  ): Promise<string> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const fnDescription = SemanticVoid.getFunctionDescription(fn);
    const prompt = createExplainPrompt(fnDescription);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Validate that a void function is used appropriately.
   *
   * @param fn - Function to validate
   * @param usage - How the function is being used
   * @param client - Optional LLM client
   * @returns Validation result
   */
  static async validateUsage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void,
    usage: string,
    client?: LLMClient
  ): Promise<ValidateUsageResult> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const fnDescription = SemanticVoid.getFunctionDescription(fn);
    const prompt = createValidateUsagePrompt(fnDescription, usage);

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
   * @param client - Optional LLM client
   * @returns Error handling assessment
   */
  static async checkErrorHandling(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void,
    client?: LLMClient
  ): Promise<CheckErrorHandlingResult> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const fnDescription = SemanticVoid.getFunctionDescription(fn);
    const prompt = createCheckErrorHandlingPrompt(fnDescription);

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
   * @param client - Optional LLM client
   * @returns Suggested improvements
   */
  static async suggestSignature(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => void,
    client?: LLMClient
  ): Promise<SuggestSignatureResult> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const fnDescription = SemanticVoid.getFunctionDescription(fn);
    const prompt = createSuggestSignaturePrompt(fnDescription);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as SuggestSignatureResult;
  }

  /**
   * List common patterns where void is appropriate.
   *
   * @param client - Optional LLM client
   * @returns List of appropriate void patterns
   */
  static async appropriatePatterns(client?: LLMClient): Promise<string[]> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const prompt = createAppropriatePatternsPrompt();

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { patterns: string[] };
    return result.patterns;
  }

  /**
   * Check if void is the correct return type for a function name.
   *
   * @param fnName - Function name to analyze
   * @param client - Optional LLM client
   * @returns Appropriateness assessment
   */
  static async isAppropriateFor(
    fnName: string,
    client?: LLMClient
  ): Promise<AppropriateResult> {
    const llmClient = SemanticVoid.getClientInstance(client);
    const prompt = createIsAppropriateForPrompt(fnName);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: VOID_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as AppropriateResult;
  }
}
