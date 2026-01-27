/**
 * SemanticNever
 * A semantic wrapper for TypeScript's never type with LLM-powered analysis
 *
 * Since 'never' represents values that never occur, this class provides
 * static methods for analyzing unreachable code, exhaustiveness checking,
 * and explaining the never type's semantics.
 *
 * Note: SemanticNever has no instances - all methods are static because
 * 'never' is the bottom type with no values.
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
  getAppropriatePatterns,
} from './prompts.ts';

/** Unreachability type classification */
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

/** Result of should-return-never analysis */
export interface ShouldReturnNeverResult {
  shouldReturn: boolean;
  reason: string;
}

/** Result of type intersection analysis */
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
 * This class provides LLM-powered analysis of:
 * - Exhaustiveness checking for discriminated unions
 * - Dead code detection
 * - Unreachability explanation
 * - Type intersection analysis
 *
 * All methods are static because 'never' has no values to instantiate.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- never has no instances by design
export class SemanticNever {
  /**
   * Private constructor - SemanticNever cannot be instantiated
   * The never type represents values that never occur, so there can be no instances.
   */
  private constructor() {
    // This constructor should never be called
    throw new Error('SemanticNever cannot be instantiated - never has no values');
  }

  /**
   * Check if a switch statement or conditional is exhaustive.
   *
   * @param type - The union type being checked (e.g., "Status", "Result")
   * @param handledCases - Array of cases that are handled
   * @param client - Optional LLM client for dependency injection
   * @returns Exhaustiveness check result with any missing cases
   *
   * @example
   * await SemanticNever.isExhaustive("Status", ["pending", "active"])
   * // { exhaustive: false, missing: ["completed"] }
   *
   * await SemanticNever.isExhaustive("Direction", ["up", "down", "left", "right"])
   * // { exhaustive: true, missing: [] }
   */
  static async isExhaustive(
    type: string,
    handledCases: string[],
    client?: LLMClient
  ): Promise<ExhaustiveResult> {
    const llmClient = client ?? getClient();
    const prompt = createIsExhaustivePrompt(type, handledCases);

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
   * @param context - The code context to analyze
   * @param client - Optional LLM client for dependency injection
   * @returns Explanation with type classification and suggestion
   *
   * @example
   * await SemanticNever.explainUnreachability("after throw statement")
   * // {
   * //   reason: "Code after a throw statement cannot execute",
   * //   type: "control-flow",
   * //   suggestion: "Remove dead code after throw"
   * // }
   */
  static async explainUnreachability(
    context: string,
    client?: LLMClient
  ): Promise<UnreachabilityResult> {
    const llmClient = client ?? getClient();
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
   * @param code - Code snippet or description to analyze
   * @param context - Optional surrounding context
   * @param client - Optional LLM client for dependency injection
   * @returns Dead code analysis with removal safety
   *
   * @example
   * await SemanticNever.isDeadCode("return statement after return")
   * // { isDead: true, reason: "First return already exits the function", safeToRemove: true }
   */
  static async isDeadCode(
    code: string,
    context?: string,
    client?: LLMClient
  ): Promise<DeadCodeResult> {
    const llmClient = client ?? getClient();
    const prompt = createIsDeadCodePrompt(code, context);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as DeadCodeResult;
  }

  /**
   * Suggest an exhaustive switch handler (assertNever pattern).
   *
   * @param typeName - The discriminated union type name
   * @param client - Optional LLM client for dependency injection
   * @returns Suggested code and usage example
   *
   * @example
   * await SemanticNever.suggestExhaustiveHandler("Status")
   * // {
   * //   code: "function assertNever(x: never): never { throw new Error(`Unexpected value: ${x}`); }",
   * //   usage: "default: return assertNever(status);"
   * // }
   */
  static async suggestExhaustiveHandler(
    typeName: string,
    client?: LLMClient
  ): Promise<ExhaustiveHandlerResult> {
    const llmClient = client ?? getClient();
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
   * @param fnCode - Function code to validate
   * @param client - Optional LLM client for dependency injection
   * @returns Validation result with covered cases and suggestions
   *
   * @example
   * await SemanticNever.validateExhaustivenessCheck(`
   *   function handleStatus(status: Status) {
   *     switch (status) {
   *       case "pending": return "Waiting...";
   *       case "active": return "In progress";
   *       case "completed": return "Done!";
   *       default: return assertNever(status);
   *     }
   *   }
   * `)
   * // { valid: true, covers: ["pending", "active", "completed"] }
   */
  static async validateExhaustivenessCheck(
    fnCode: string,
    client?: LLMClient
  ): Promise<ValidateExhaustivenessResult> {
    const llmClient = client ?? getClient();
    const prompt = createValidateExhaustivenessCheckPrompt(fnCode);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: NEVER_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ValidateExhaustivenessResult;
  }

  /**
   * Identify if a function should return never based on its behavior.
   *
   * @param fnName - Function name
   * @param behavior - Description of function behavior
   * @param client - Optional LLM client for dependency injection
   * @returns Analysis with recommendation
   *
   * @example
   * await SemanticNever.shouldReturnNever("throwError", "always throws an exception")
   * // { shouldReturn: true, reason: "Function always throws, never returns normally" }
   *
   * await SemanticNever.shouldReturnNever("maybeThrow", "throws on invalid input")
   * // { shouldReturn: false, reason: "Function may return normally with valid input" }
   */
  static async shouldReturnNever(
    fnName: string,
    behavior: string,
    client?: LLMClient
  ): Promise<ShouldReturnNeverResult> {
    const llmClient = client ?? getClient();
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
   * @param context - Optional usage context for tailored explanation
   * @param client - Optional LLM client for dependency injection
   * @returns Educational explanation string
   *
   * @example
   * await SemanticNever.explain()
   * // "The 'never' type represents values that never occur..."
   *
   * await SemanticNever.explain("in function return type")
   * // "A function returning 'never' will never complete normally..."
   */
  static async explain(context?: string, client?: LLMClient): Promise<string> {
    const llmClient = client ?? getClient();
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
   * Detect if type intersection results in never.
   *
   * @param types - Array of type names to intersect
   * @param client - Optional LLM client for dependency injection
   * @returns Analysis of whether intersection is never
   *
   * @example
   * await SemanticNever.analyzeIntersection(["string", "number"])
   * // { resultsInNever: true, reason: "A value cannot be both string and number" }
   *
   * await SemanticNever.analyzeIntersection(["{ name: string }", "{ age: number }"])
   * // { resultsInNever: false, reason: "Object types can be merged" }
   */
  static async analyzeIntersection(
    types: string[],
    client?: LLMClient
  ): Promise<IntersectionAnalysisResult> {
    const llmClient = client ?? getClient();
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
   * This is a static list - no LLM call required.
   *
   * @returns List of appropriate never patterns with examples
   *
   * @example
   * SemanticNever.appropriatePatterns()
   * // [
   * //   { pattern: "Exhaustive switch handler", description: "...", example: "..." },
   * //   { pattern: "Functions that never return", description: "...", example: "..." },
   * //   ...
   * // ]
   */
  static appropriatePatterns(): NeverPattern[] {
    return getAppropriatePatterns();
  }
}
