/**
 * SemanticNever
 * A utility class with LLM-powered semantic understanding for the never type
 *
 * Helps analyze unreachable code, validate exhaustive switches,
 * and explain why code paths are impossible.
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import {
  NEVER_SYSTEM_PROMPT,
  createIsExhaustivePrompt,
  createExplainUnreachabilityPrompt,
  createIsDeadCodePrompt,
  createSuggestExhaustiveHandlerPrompt,
  createValidateExhaustivenessCheckPrompt,
  createShouldReturnNeverPrompt,
  createExplainPrompt,
  createAnalyzeIntersectionPrompt,
  createAppropriatePatternsPrompt,
} from './prompts.ts';

/** Type of unreachability */
export type UnreachabilityType =
  | 'control-flow'
  | 'type-narrowing'
  | 'exhaustive-check'
  | 'impossible-state';

/** Result of exhaustiveness check */
export interface ExhaustiveResult {
  exhaustive: boolean;
  missing: string[];
}

/** Result of unreachability explanation */
export interface UnreachabilityResult {
  reason: string;
  type: UnreachabilityType;
  suggestion: string;
}

/** Result of dead code analysis */
export interface DeadCodeResult {
  isDead: boolean;
  reason: string;
  safeToRemove: boolean;
}

/** Result of exhaustive handler suggestion */
export interface ExhaustiveHandlerResult {
  code: string;
  usage: string;
}

/** Result of exhaustiveness validation */
export interface ValidateExhaustivenessResult {
  valid: boolean;
  covers: string[];
  missing?: string[];
  suggestion?: string;
}

/** Result of should return never analysis */
export interface ShouldReturnNeverResult {
  shouldReturn: boolean;
  reason: string;
}

/** Result of intersection analysis */
export interface IntersectionAnalysisResult {
  resultsInNever: boolean;
  reason: string;
}

/** Pattern where never is appropriate */
export interface NeverPattern {
  pattern: string;
  description: string;
  example: string;
}

/**
 * SemanticNever - Static utilities for never type analysis
 *
 * Unlike other semantic types that wrap values, SemanticNever is primarily
 * a collection of static methods for analyzing code patterns involving
 * the never type, exhaustiveness checks, and unreachable code.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SemanticNever {
  private static defaultClient: LLMClient | undefined;

  /**
   * Set a default LLM client for all SemanticNever operations.
   *
   * @param client - LLM client to use
   */
  static setClient(client: LLMClient): void {
    SemanticNever.defaultClient = client;
  }

  /**
   * Get the LLM client to use.
   */
  private static getClientInstance(client?: LLMClient): LLMClient {
    return client ?? SemanticNever.defaultClient ?? getClient();
  }

  /**
   * Check if a switch statement or conditional is exhaustive.
   *
   * @param typeName - The union type being checked
   * @param handledCases - Cases that are handled
   * @param client - Optional LLM client
   * @returns Exhaustiveness check result
   */
  static async isExhaustive(
    typeName: string,
    handledCases: string[],
    client?: LLMClient
  ): Promise<ExhaustiveResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createIsExhaustivePrompt(typeName, handledCases);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ExhaustiveResult;
  }

  /**
   * Explain why a code path is unreachable (never).
   *
   * @param context - The code context
   * @param client - Optional LLM client
   * @returns Explanation of unreachability
   */
  static async explainUnreachability(
    context: string,
    client?: LLMClient
  ): Promise<UnreachabilityResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createExplainUnreachabilityPrompt(context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as UnreachabilityResult;
  }

  /**
   * Check if a code path is actually dead code.
   *
   * @param code - Code snippet or description
   * @param context - Surrounding context
   * @param client - Optional LLM client
   * @returns Dead code analysis
   */
  static async isDeadCode(
    code: string,
    context?: string,
    client?: LLMClient
  ): Promise<DeadCodeResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createIsDeadCodePrompt(code, context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as DeadCodeResult;
  }

  /**
   * Suggest an exhaustive switch handler.
   *
   * @param typeName - The discriminated union type
   * @param client - Optional LLM client
   * @returns Suggested code
   */
  static async suggestExhaustiveHandler(
    typeName: string,
    client?: LLMClient
  ): Promise<ExhaustiveHandlerResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createSuggestExhaustiveHandlerPrompt(typeName);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ExhaustiveHandlerResult;
  }

  /**
   * Validate that a function properly uses never for exhaustiveness.
   *
   * @param fnCode - Function code or description
   * @param client - Optional LLM client
   * @returns Validation result
   */
  static async validateExhaustivenessCheck(
    fnCode: string,
    client?: LLMClient
  ): Promise<ValidateExhaustivenessResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createValidateExhaustivenessCheckPrompt(fnCode);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateExhaustivenessResult;
  }

  /**
   * Identify if a function should return never.
   *
   * @param fnName - Function name
   * @param behavior - Function behavior description
   * @param client - Optional LLM client
   * @returns Analysis
   */
  static async shouldReturnNever(
    fnName: string,
    behavior: string,
    client?: LLMClient
  ): Promise<ShouldReturnNeverResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createShouldReturnNeverPrompt(fnName, behavior);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ShouldReturnNeverResult;
  }

  /**
   * Explain the never type to developers.
   *
   * @param context - Usage context
   * @param client - Optional LLM client
   * @returns Educational explanation
   */
  static async explain(context?: string, client?: LLMClient): Promise<string> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createExplainPrompt(context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { explanation: string };
    return result.explanation;
  }

  /**
   * Detect impossible type intersections that result in never.
   *
   * @param types - Types being intersected
   * @param client - Optional LLM client
   * @returns Analysis of the intersection
   */
  static async analyzeIntersection(
    types: string[],
    client?: LLMClient
  ): Promise<IntersectionAnalysisResult> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createAnalyzeIntersectionPrompt(types);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as IntersectionAnalysisResult;
  }

  /**
   * Get common patterns where never is appropriate.
   *
   * @param client - Optional LLM client
   * @returns List of appropriate never patterns
   */
  static async appropriatePatterns(client?: LLMClient): Promise<NeverPattern[]> {
    const llmClient = SemanticNever.getClientInstance(client);
    const prompt = createAppropriatePatternsPrompt();

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { patterns: NeverPattern[] };
    return result.patterns;
  }

  /**
   * Assert that a value is never (for exhaustiveness checks).
   * This is a runtime utility, not an LLM operation.
   *
   * @param value - Value that should be never
   * @throws Error if reached
   */
  static assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
  }
}
