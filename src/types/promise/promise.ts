/**
 * SemanticPromise
 * A Promise type with LLM-powered semantic understanding
 *
 * Implements:
 * - Comparable<Promise<unknown>, SemanticEqualsResult> - Semantic equality comparison
 * - Explainable - Operation descriptions
 * - Extended Promise functionality with semantic retry, transform, validate, and fallback
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type { SemanticEqualsResult } from '../../shared/types.ts';
import { SemanticError } from '../error/error.ts';
import {
  PROMISE_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createTimeoutErrorPrompt,
  createCatchSemanticPrompt,
  createShouldRetryPrompt,
  createTransformPrompt,
  createValidateResultPrompt,
  createShouldUseFallbackPrompt,
  createInferOperationPrompt,
  createLoggingMessagePrompt,
} from './prompts.ts';

export type { SemanticEqualsResult } from '../../shared/types.ts';

/** Promise state */
export type PromiseState = 'pending' | 'fulfilled' | 'rejected';

/** Status information for a promise */
export interface PromiseStatus {
  state: PromiseState;
  description: string;
  elapsed?: string;
}

/** Inferred operation details */
export interface InferredOperation {
  operation: string;
  resource?: string;
  action?: string;
}

/** Retry options */
export interface RetryOptions {
  maxAttempts: number;
  when?: string;
  backoff?: 'linear' | 'exponential' | 'fixed';
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  violations: string[];
  confidence: number;
}

/** Semantic error analysis result */
export interface SemanticErrorAnalysis {
  explanation: string;
  rootCause: string;
  suggestedFixes: string[];
  isRetryable: boolean;
}

/**
 * SemanticPromise - Promise with LLM-powered semantic understanding
 *
 * Wraps a native Promise and adds intelligent error handling,
 * meaningful timeout messages, and operation descriptions.
 */
export class SemanticPromise<T> implements PromiseLike<T> {
  readonly [Symbol.toStringTag] = 'SemanticPromise';

  private readonly _promise: Promise<T>;
  private readonly _description?: string;
  private readonly _client: LLMClient;
  private readonly _startTime: number;
  private _state: PromiseState = 'pending';
  private _resolvedValue?: T;

  private constructor(
    promise: Promise<T>,
    description?: string,
    client?: LLMClient
  ) {
    this._promise = promise;
    this._description = description;
    this._client = client ?? getClient();
    this._startTime = Date.now();

    // Track state changes
    this._promise
      .then((value) => {
        this._state = 'fulfilled';
        this._resolvedValue = value;
        return value;
      })
      .catch(() => {
        this._state = 'rejected';
      });
  }

  /**
   * Create a SemanticPromise from a regular Promise.
   *
   * @param promise - Promise to wrap
   * @param description - Description of what the promise does
   * @param client - Optional LLM client
   * @returns SemanticPromise instance
   *
   * @example
   * SemanticPromise.from(fetch(url), "fetching user data")
   */
  static from<T>(
    promise: Promise<T>,
    description?: string,
    client?: LLMClient
  ): SemanticPromise<T> {
    if (promise instanceof SemanticPromise) {
      return promise as SemanticPromise<T>;
    }
    return new SemanticPromise(promise, description, client);
  }

  /**
   * Create a resolved SemanticPromise.
   *
   * @param value - Value to resolve with
   * @param description - Description of the value
   * @param client - Optional LLM client
   */
  static resolve<T>(
    value: T,
    description?: string,
    client?: LLMClient
  ): SemanticPromise<T> {
    return new SemanticPromise(Promise.resolve(value), description, client);
  }

  /**
   * Create a rejected SemanticPromise.
   *
   * @param reason - Rejection reason
   * @param description - Description of the operation
   * @param client - Optional LLM client
   */
  static reject<T = never>(
    reason: unknown,
    description?: string,
    client?: LLMClient
  ): SemanticPromise<T> {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    return new SemanticPromise(Promise.reject(error), description, client);
  }

  /**
   * Implementation of PromiseLike.then for compatibility with native Promise
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): SemanticPromise<TResult1 | TResult2> {
    const newPromise = this._promise.then(onfulfilled, onrejected);
    return new SemanticPromise(newPromise, this._description, this._client);
  }

  /**
   * Implementation of Promise.catch for compatibility
   */
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): SemanticPromise<T | TResult> {
    const newPromise = this._promise.catch(onrejected);
    return new SemanticPromise(newPromise, this._description, this._client);
  }

  /**
   * Implementation of Promise.finally for compatibility
   */
  finally(onfinally?: (() => void) | null): SemanticPromise<T> {
    const newPromise = this._promise.finally(onfinally);
    return new SemanticPromise(newPromise, this._description, this._client);
  }

  /**
   * Check if two promises resolve to semantically equivalent values.
   *
   * @param other - Promise to compare
   * @returns Equivalence result (after both resolve)
   *
   * @example
   * promise1.semanticallyEquals(promise2)
   * // { equivalent: true, confidence: 0.9 }
   */
  async semanticallyEquals(other: Promise<unknown>): Promise<SemanticEqualsResult> {
    const otherPromise = other instanceof SemanticPromise ? other._promise : other;
    const results = await Promise.all([this._promise, otherPromise] as const);
    const value1: unknown = results[0];
    const value2: unknown = results[1];

    const otherDescription = other instanceof SemanticPromise ? other._description : undefined;

    const prompt = createSemanticallyEqualsPrompt(
      value1,
      value2,
      this._description,
      otherDescription
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Add timeout with meaningful error message.
   *
   * @param ms - Timeout in milliseconds
   * @param context - Context for error message
   * @returns Promise that rejects with semantic error on timeout
   *
   * @example
   * apiCall.timeout(5000, "database connection")
   */
  timeout(ms: number, context?: string): SemanticPromise<T> {
    const generateTimeoutError = async (): Promise<Error> => {
      const prompt = createTimeoutErrorPrompt(ms, context, this._description);
      const response = await this._client.complete({
        prompt,
        systemPrompt: PROMISE_SYSTEM_PROMPT,
        temperature: 0.3,
      });
      const result = JSON.parse(response.content) as { message: string };
      const error = new Error(result.message);
      error.name = 'TimeoutError';
      return error;
    };

    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        generateTimeoutError().then(reject).catch(reject);
      }, ms);
    });

    const racedPromise = Promise.race([this._promise, timeoutPromise]);
    return new SemanticPromise(racedPromise, this._description, this._client);
  }

  /**
   * Handle errors with semantic understanding.
   *
   * @param handler - Error handler with semantic error
   * @returns Promise with error handling
   *
   * @example
   * promise.catchSemantic(async (error) => {
   *   console.log(error.explanation);
   *   return defaultValue;
   * })
   */
  catchSemantic<U>(
    handler: (error: SemanticError, analysis: SemanticErrorAnalysis) => U | Promise<U>
  ): SemanticPromise<T | U> {
    const newPromise = this._promise.catch(async (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      const semanticError = SemanticError.from(error);

      // Get semantic analysis
      const prompt = createCatchSemanticPrompt(error, this._description);
      const response = await this._client.complete({
        prompt,
        systemPrompt: PROMISE_SYSTEM_PROMPT,
        temperature: 0.2,
      });

      const analysis = JSON.parse(response.content) as SemanticErrorAnalysis;
      return handler(semanticError, analysis);
    });

    return new SemanticPromise(newPromise, this._description, this._client);
  }

  /**
   * Explain what operation this promise represents.
   *
   * @returns Operation description
   *
   * @example
   * promise.explain()
   * // "Fetching user profile from /api/users/123"
   */
  explain(): string {
    if (this._description) {
      return this._description;
    }
    return 'Async operation (no description provided)';
  }

  /**
   * Get the current status with semantic description.
   *
   * @returns Status information
   *
   * @example
   * promise.status()
   * // { state: "pending", description: "Waiting for API response", elapsed: "2.3s" }
   */
  status(): PromiseStatus {
    const elapsed = Date.now() - this._startTime;
    const elapsedStr = elapsed >= 1000 ? `${(elapsed / 1000).toFixed(1)}s` : `${elapsed}ms`;

    let description: string;
    switch (this._state) {
      case 'pending':
        description = this._description
          ? `Waiting: ${this._description}`
          : 'Waiting for operation to complete';
        break;
      case 'fulfilled':
        description = this._description
          ? `Completed: ${this._description}`
          : 'Operation completed successfully';
        break;
      case 'rejected':
        description = this._description
          ? `Failed: ${this._description}`
          : 'Operation failed';
        break;
    }

    return {
      state: this._state,
      description,
      elapsed: elapsedStr,
    };
  }

  /**
   * Add semantic retry logic.
   *
   * @param options - Retry options
   * @returns Promise with retry behavior
   *
   * @example
   * apiCall.retry({
   *   maxAttempts: 3,
   *   when: "network error or timeout",
   *   backoff: "exponential"
   * })
   */
  retry(options: RetryOptions): SemanticPromise<T> {
    const { maxAttempts, when, backoff = 'exponential' } = options;

    const retryPromise = this.executeWithRetry(
      () => this._promise,
      maxAttempts,
      when,
      backoff
    );

    return new SemanticPromise(retryPromise, this._description, this._client);
  }

  private async executeWithRetry(
    operation: () => Promise<T>,
    maxAttempts: number,
    when: string | undefined,
    backoff: 'linear' | 'exponential' | 'fixed'
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Check if we should retry
        if (when) {
          const prompt = createShouldRetryPrompt(lastError, when, attempt);
          const response = await this._client.complete({
            prompt,
            systemPrompt: PROMISE_SYSTEM_PROMPT,
            temperature: 0.1,
          });

          const result = JSON.parse(response.content) as { shouldRetry: boolean };
          if (!result.shouldRetry) {
            throw lastError;
          }
        }

        // Calculate backoff delay
        const baseDelay = 1000; // 1 second
        let delay: number;
        switch (backoff) {
          case 'linear':
            delay = baseDelay * attempt;
            break;
          case 'exponential':
            delay = baseDelay * Math.pow(2, attempt - 1);
            break;
          case 'fixed':
          default:
            delay = baseDelay;
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError ?? new Error('Retry failed');
  }

  /**
   * Transform the result with semantic understanding.
   *
   * @param instruction - Natural language transformation
   * @returns Transformed promise
   *
   * @example
   * userPromise.transform("extract just the name and email")
   */
  transform<U>(instruction: string): SemanticPromise<U> {
    const transformedPromise = this._promise.then(async (value) => {
      const prompt = createTransformPrompt(value, instruction);
      const response = await this._client.complete({
        prompt,
        systemPrompt: PROMISE_SYSTEM_PROMPT,
        temperature: 0.2,
      });

      const result = JSON.parse(response.content) as {
        result: U;
        success: boolean;
        explanation?: string;
      };

      if (!result.success) {
        throw new Error(result.explanation ?? 'Transformation failed');
      }

      return result.result;
    });

    const newDescription = this._description
      ? `${this._description} (transformed: ${instruction})`
      : `Transformed: ${instruction}`;

    return new SemanticPromise(transformedPromise, newDescription, this._client);
  }

  /**
   * Validate the result against semantic rules.
   *
   * @param rules - Validation rules
   * @returns Promise that rejects if validation fails
   *
   * @example
   * response.validateResult(["should contain user data", "email must be valid"])
   */
  validateResult(rules: string[]): SemanticPromise<T> {
    const validatedPromise = this._promise.then(async (value) => {
      const prompt = createValidateResultPrompt(value, rules);
      const response = await this._client.complete({
        prompt,
        systemPrompt: PROMISE_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      const result = JSON.parse(response.content) as ValidationResult;

      if (!result.valid) {
        const error = new Error(
          `Validation failed: ${result.violations.join('; ')}`
        );
        error.name = 'ValidationError';
        throw error;
      }

      return value;
    });

    return new SemanticPromise(validatedPromise, this._description, this._client);
  }

  /**
   * Provide a fallback with semantic matching.
   *
   * @param fallbackValue - Fallback value or function
   * @param when - When to use fallback
   * @returns Promise with fallback
   *
   * @example
   * userPromise.fallback(defaultUser, "when user not found")
   */
  fallback<U>(
    fallbackValue: U | (() => U),
    when?: string
  ): SemanticPromise<T | U> {
    const fallbackPromise = this._promise.catch(async (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));

      // If no condition specified, always use fallback
      if (!when) {
        return typeof fallbackValue === 'function'
          ? (fallbackValue as () => U)()
          : fallbackValue;
      }

      // Check if error matches fallback condition
      const prompt = createShouldUseFallbackPrompt(error, when);
      const response = await this._client.complete({
        prompt,
        systemPrompt: PROMISE_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      const result = JSON.parse(response.content) as { useFallback: boolean };

      if (result.useFallback) {
        return typeof fallbackValue === 'function'
          ? (fallbackValue as () => U)()
          : fallbackValue;
      }

      throw error;
    });

    return new SemanticPromise(fallbackPromise, this._description, this._client);
  }

  /**
   * Log progress with semantic descriptions.
   *
   * @param logger - Logger function
   * @returns Same promise with logging
   *
   * @example
   * promise.withLogging(console.log)
   * // Logs: "Starting: fetch user data"
   * // Logs: "Completed: fetch user data (245ms)"
   */
  withLogging(logger: (message: string) => void): SemanticPromise<T> {
    const startTime = Date.now();

    // Log start
    this.generateLogMessage('start').then(logger).catch(() => {
      // Fallback to simple message if LLM fails
      logger(`Starting: ${this._description ?? 'async operation'}`);
    });

    const loggedPromise = this._promise
      .then(async (value) => {
        const elapsed = Date.now() - startTime;
        const message = await this.generateLogMessage('complete', elapsed).catch(
          () => `Completed: ${this._description ?? 'async operation'} (${elapsed}ms)`
        );
        logger(message);
        return value;
      })
      .catch(async (err: unknown) => {
        const elapsed = Date.now() - startTime;
        const error = err instanceof Error ? err : new Error(String(err));
        const message = await this.generateLogMessage('error', elapsed, error).catch(
          () => `Error: ${this._description ?? 'async operation'} - ${error.message} (${elapsed}ms)`
        );
        logger(message);
        throw err;
      });

    return new SemanticPromise(loggedPromise, this._description, this._client);
  }

  private async generateLogMessage(
    phase: 'start' | 'complete' | 'error',
    elapsed?: number,
    error?: Error
  ): Promise<string> {
    const prompt = createLoggingMessagePrompt(
      phase,
      this._description,
      elapsed,
      error
    );

    const response = await this._client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { message: string };
    return result.message;
  }

  /**
   * Infer what this promise is likely doing.
   *
   * @returns Inferred operation type
   *
   * @example
   * promise.inferOperation()
   * // { operation: "api-call", resource: "user", action: "read" }
   */
  inferOperation(): InferredOperation {
    // For synchronous return, use description-based inference
    if (this._description) {
      return this.inferFromDescription(this._description);
    }

    // Default inference for unknown operations
    return {
      operation: 'unknown',
      resource: undefined,
      action: undefined,
    };
  }

  /**
   * Asynchronously infer operation with LLM assistance.
   */
  async inferOperationAsync(): Promise<InferredOperation> {
    // Wait for resolution if possible to get value info
    let resolvedValue: unknown;
    try {
      if (this._state === 'fulfilled') {
        resolvedValue = this._resolvedValue;
      }
    } catch {
      // Ignore - we'll infer without the value
    }

    const prompt = createInferOperationPrompt(this._description, resolvedValue);
    const response = await this._client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return JSON.parse(response.content) as InferredOperation;
  }

  private inferFromDescription(description: string): InferredOperation {
    const desc = description.toLowerCase();

    // Infer operation type
    let operation = 'unknown';
    if (desc.includes('fetch') || desc.includes('api') || desc.includes('request')) {
      operation = 'api-call';
    } else if (desc.includes('query') || desc.includes('database') || desc.includes('db')) {
      operation = 'database-query';
    } else if (desc.includes('file') || desc.includes('read') || desc.includes('write')) {
      operation = 'file-operation';
    } else if (desc.includes('compute') || desc.includes('calculate')) {
      operation = 'computation';
    }

    // Infer resource
    let resource: string | undefined;
    const resourcePatterns = [
      'user', 'product', 'order', 'item', 'data', 'file', 'record', 'profile',
    ];
    for (const pattern of resourcePatterns) {
      if (desc.includes(pattern)) {
        resource = pattern;
        break;
      }
    }

    // Infer action
    let action: string | undefined;
    if (desc.includes('get') || desc.includes('fetch') || desc.includes('read') || desc.includes('load')) {
      action = 'read';
    } else if (desc.includes('create') || desc.includes('add') || desc.includes('insert')) {
      action = 'create';
    } else if (desc.includes('update') || desc.includes('modify') || desc.includes('edit')) {
      action = 'update';
    } else if (desc.includes('delete') || desc.includes('remove')) {
      action = 'delete';
    }

    return { operation, resource, action };
  }

  /**
   * Get the underlying promise.
   */
  toPromise(): Promise<T> {
    return this._promise;
  }

  /**
   * Get the description of this promise.
   */
  getDescription(): string | undefined {
    return this._description;
  }
}
