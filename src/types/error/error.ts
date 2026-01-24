/**
 * SemanticError
 * An error type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Comparable<Error, SemanticEqualsResultWithReason> - Semantic equality comparison
 * - Explainable - Human-readable explanations
 * - Classifiable - Error classification
 * - SemanticErrorType - Error-specific methods
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithReason,
  ClassifyResult,
  RootCauseResult,
  SuggestedFix,
  RecoveryStrategy,
  ErrorSeverityLevel,
} from '../../shared/types.ts';
import type {
  Comparable,
  Explainable,
  Classifiable,
  SemanticErrorType,
} from '../../shared/interfaces.ts';
import {
  ERROR_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createClassifyPrompt,
  createExplainPrompt,
  createSuggestFixesPrompt,
  createInferRootCausePrompt,
  createMatchesPatternPrompt,
  createGetResourcesPrompt,
  createShouldReportPrompt,
  createRecoveryStrategyPrompt,
  createGetSeverityPrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithReason,
  ClassifyResult,
  RootCauseResult,
  SuggestedFix,
  RecoveryStrategy,
  ErrorSeverityLevel,
} from '../../shared/types.ts';

/** Result of error classification with extended fields */
export interface ErrorClassifyResult extends ClassifyResult {
  subcategory?: string;
  severity: 'critical' | 'recoverable' | 'warning';
  retryable: boolean;
}

/** Resource suggestion */
export interface ResourceSuggestion {
  title: string;
  type: string;
  url?: string;
}

/** Report recommendation */
export interface ReportRecommendation {
  report: boolean;
  reason: string;
  priority?: string;
}

/**
 * SemanticError - Error with LLM-powered semantic understanding
 *
 * Extends the native JavaScript Error with intelligent error classification,
 * fix suggestions, and human-readable explanations.
 *
 * Implements:
 * - Comparable<Error, SemanticEqualsResultWithReason> - semanticallyEquals() for comparison
 * - Explainable - explain() for human-readable explanations
 * - Classifiable<ErrorClassifyResult> - classify() for categorization
 * - SemanticErrorType - Full error-specific interface
 */
export class SemanticError
  extends Error
  implements
    Comparable<Error, SemanticEqualsResultWithReason>,
    Explainable,
    Classifiable<ErrorClassifyResult>,
    SemanticErrorType
{
  private readonly client: LLMClient;
  private readonly context: Record<string, unknown>;
  private cachedClassification?: ErrorClassifyResult;

  private constructor(
    message: string,
    options?: { cause?: unknown; context?: Record<string, unknown> },
    client?: LLMClient
  ) {
    super(message, { cause: options?.cause });
    this.name = 'SemanticError';
    this.client = client ?? getClient();
    this.context = options?.context ?? {};

    // Capture stack trace
    Error.captureStackTrace(this, SemanticError);
  }

  /**
   * Create a SemanticError from any error-like value.
   *
   * @param error - Error object, string, or unknown value
   * @param context - Additional context
   * @param client - Optional LLM client
   * @returns SemanticError instance
   *
   * @example
   * SemanticError.from(caughtError)
   * SemanticError.from("Connection failed", { service: "database" })
   */
  static from(
    error: unknown,
    context?: Record<string, unknown>,
    client?: LLMClient
  ): SemanticError {
    if (error instanceof SemanticError) {
      return error;
    }

    if (error instanceof Error) {
      const semanticError = new SemanticError(
        error.message,
        { cause: error.cause, context },
        client
      );
      semanticError.stack = error.stack;
      return semanticError;
    }

    if (typeof error === 'string') {
      return new SemanticError(error, { context }, client);
    }

    // Handle unknown error types
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return new SemanticError(message, { context }, client);
  }

  /**
   * Check if two errors are semantically equivalent.
   * Same root cause despite different messages.
   *
   * @param other - Error to compare
   * @returns Equivalence result
   *
   * @example
   * error1.semanticallyEquals(error2)
   * // { equivalent: true, reason: "Both are network timeout errors", confidence: 0.85 }
   */
  async semanticallyEquals(
    other: Error
  ): Promise<SemanticEqualsResultWithReason> {
    const prompt = createSemanticallyEqualsPrompt(
      this.message,
      this.stack,
      other.message,
      other.stack
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithReason;
  }

  /**
   * Classify the error into a category.
   *
   * @returns Error classification
   *
   * @example
   * error.classify()
   * // {
   * //   category: "network",
   * //   subcategory: "timeout",
   * //   severity: "recoverable",
   * //   retryable: true,
   * //   confidence: 0.9
   * // }
   */
  async classify(): Promise<ErrorClassifyResult> {
    if (this.cachedClassification) {
      return this.cachedClassification;
    }

    const prompt = createClassifyPrompt(this.message, this.stack, this.context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      category: string;
      subcategory?: string;
      severity: 'critical' | 'recoverable' | 'warning';
      retryable: boolean;
    };

    this.cachedClassification = {
      ...result,
      confidence: 0.85, // Default confidence for classification
    };

    return this.cachedClassification;
  }

  /**
   * Explain the error in plain language.
   *
   * @param audience - Target audience
   * @returns Human-readable explanation
   *
   * @example
   * error.explain("end-user")
   * // "We couldn't connect to the server. Please check your internet connection."
   *
   * error.explain("developer")
   * // "ECONNREFUSED on port 5432. The PostgreSQL server may not be running."
   */
  async explain(
    audience: 'end-user' | 'developer' | 'support' = 'developer'
  ): Promise<string> {
    const prompt = createExplainPrompt(this.message, this.stack, audience);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    return response.content;
  }

  /**
   * Suggest fixes for the error.
   *
   * @returns Suggested fixes
   *
   * @example
   * error.suggestFixes()
   * // [
   * //   { fix: "Check database connection string", confidence: 0.9 },
   * //   { fix: "Ensure PostgreSQL service is running", confidence: 0.85 }
   * // ]
   */
  async suggestFixes(): Promise<SuggestedFix[]> {
    const prompt = createSuggestFixesPrompt(
      this.message,
      this.stack,
      this.context
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as {
      fixes: { fix: string; confidence: number; code?: string }[];
    };

    return result.fixes;
  }

  /**
   * Infer the root cause of the error.
   *
   * @returns Root cause analysis
   *
   * @example
   * error.inferRootCause()
   * // { cause: "Database connection pool exhausted", confidence: 0.87 }
   */
  async inferRootCause(): Promise<RootCauseResult> {
    const prompt = createInferRootCausePrompt(
      this.message,
      this.stack,
      this.context
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as RootCauseResult;
  }

  /**
   * Check if this error matches a known pattern.
   *
   * @param pattern - Error pattern to check
   * @returns Match result
   *
   * @example
   * error.matches("network-related") // true
   * error.matches("authentication-failure") // false
   */
  async matches(pattern: string): Promise<boolean> {
    const prompt = createMatchesPatternPrompt(
      this.message,
      this.stack,
      pattern
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { matches: boolean };
    return result.matches;
  }

  /**
   * Get related documentation or resources.
   *
   * @returns Related resources
   *
   * @example
   * error.getResources()
   * // [{ title: "Troubleshooting Connection Issues", type: "docs" }]
   */
  async getResources(): Promise<ResourceSuggestion[]> {
    const prompt = createGetResourcesPrompt(this.message, this.stack);

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      resources: ResourceSuggestion[];
    };
    return result.resources;
  }

  /**
   * Determine if this error should be reported/logged.
   *
   * @returns Reporting recommendation
   *
   * @example
   * error.shouldReport()
   * // { report: true, reason: "Unexpected server error", priority: "high" }
   */
  async shouldReport(): Promise<ReportRecommendation> {
    const prompt = createShouldReportPrompt(
      this.message,
      this.stack,
      this.context
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ReportRecommendation;
  }

  /**
   * Get a recovery strategy for this error.
   *
   * @returns Recovery strategy
   *
   * @example
   * error.recoveryStrategy()
   * // { strategy: "retry", maxAttempts: 3, backoff: "exponential" }
   */
  async recoveryStrategy(): Promise<RecoveryStrategy> {
    const classification = await this.classify();
    const prompt = createRecoveryStrategyPrompt(
      this.message,
      this.stack,
      classification.category
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as RecoveryStrategy;
  }

  /**
   * Get the semantic severity level.
   *
   * @returns Severity assessment
   */
  async getSeverity(): Promise<ErrorSeverityLevel> {
    const prompt = createGetSeverityPrompt(
      this.message,
      this.stack,
      this.context
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: ERROR_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      severity: ErrorSeverityLevel;
    };
    return result.severity;
  }

  /**
   * Get the context associated with this error.
   *
   * @returns Error context
   */
  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): {
    name: string;
    message: string;
    stack?: string;
    context: Record<string, unknown>;
  } {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      context: this.context,
    };
  }
}
