/**
 * SemanticPromise
 * A Promise type with LLM-powered semantic understanding
 *
 * Wraps JavaScript Promises with semantic capabilities including:
 * - Semantic equality comparison
 * - Intelligent timeout messages
 * - Semantic error handling
 * - Operation inference
 * - Result validation
 * - Semantic retry and fallback
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type { SemanticEqualsResult } from '../../shared/types.ts';
import {
  PROMISE_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createInferOperationPrompt,
  createValidateResultPrompt,
  createTransformPrompt,
  createShouldRetryPrompt,
  createShouldFallbackPrompt,
} from './prompts.ts';

export type { SemanticEqualsResult } from '../../shared/types.ts';

/** Status of the promise */
export interface PromiseStatus {
  state: 'pending' | 'fulfilled' | 'rejected';
  description: string;
  elapsed?: string;
}

/** Options for retry */
export interface RetryOptions {
  maxAttempts: number;
  when?: string;
  backoff?: 'linear' | 'exponential' | 'fixed';
  delayMs?: number;
}

/** Result of operation inference */
export interface InferOperationResult {
  operation: string;
  resource?: string;
  action?: string;
}

/**
 * SemanticPromise - Promise with LLM-powered semantic understanding
 *
 * Extends Promise capabilities with semantic operations for
 * better error handling, timeouts, and result processing.
 *
 * @template T - The type of the resolved value
 */
export class SemanticPromise<T> implements PromiseLike<T> {
  private readonly promise: Promise<T>;
  private readonly promiseDescription: string;
  private readonly client: LLMClient;
  private readonly startTime: number;
  private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';

  private constructor(
    promise: Promise<T>,
    description = 'async operation',
    client?: LLMClient
  ) {
    this.promise = promise;
    this.promiseDescription = description;
    this.client = client ?? getClient();
    this.startTime = Date.now();

    // Track state
    this.promise
      .then((value) => {
        this.state = 'fulfilled';
        return value;
      })
      .catch(() => {
        this.state = 'rejected';
      });
  }

  /**
   * Create a SemanticPromise from a regular Promise
   */
  static from<T>(
    promise: Promise<T>,
    description?: string,
    client?: LLMClient
  ): SemanticPromise<T> {
    return new SemanticPromise(promise, description, client);
  }

  /**
   * Create an already resolved SemanticPromise
   */
  static resolve<T>(value: T, description?: string, client?: LLMClient): SemanticPromise<T> {
    return new SemanticPromise(Promise.resolve(value), description, client);
  }

  /**
   * Create an already rejected SemanticPromise
   */
  static reject<T = never>(
    reason: unknown,
    description?: string,
    client?: LLMClient
  ): SemanticPromise<T> {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return new SemanticPromise(Promise.reject(reason), description, client);
  }

  /**
   * Implement PromiseLike interface
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): SemanticPromise<TResult1 | TResult2> {
    const newPromise = this.promise.then(onfulfilled, onrejected);
    return new SemanticPromise(
      newPromise,
      this.promiseDescription,
      this.client
    );
  }

  /**
   * Catch errors
   */
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): SemanticPromise<T | TResult> {
    const newPromise = this.promise.catch(onrejected);
    return new SemanticPromise(
      newPromise,
      this.promiseDescription,
      this.client
    );
  }

  /**
   * Finally handler
   */
  finally(onfinally?: (() => void) | null): SemanticPromise<T> {
    const newPromise = this.promise.finally(onfinally);
    return new SemanticPromise(
      newPromise,
      this.promiseDescription,
      this.client
    );
  }

  /**
   * Get the underlying Promise
   */
  valueOf(): Promise<T> {
    return this.promise;
  }

  // ===========================================================================
  // SEMANTIC OPERATIONS
  // ===========================================================================

  /**
   * Check if two promises resolve to semantically equivalent values
   */
  async semanticallyEquals(other: Promise<unknown>): Promise<SemanticEqualsResult> {
    const [thisValue, otherValue] = await Promise.all([this.promise, other]);

    const prompt = createSemanticallyEqualsPrompt(thisValue, otherValue);

    const response = await this.client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Add timeout with meaningful error message
   */
  timeout(ms: number, context?: string): SemanticPromise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const ctx = context ?? this.promiseDescription;
        reject(new Error(`${ctx} timed out after ${ms / 1000} seconds`));
      }, ms);
    });

    const racedPromise = Promise.race([this.promise, timeoutPromise]);
    return new SemanticPromise(
      racedPromise,
      this.promiseDescription,
      this.client
    );
  }

  /**
   * Explain what operation this promise represents
   */
  explain(): string {
    return this.promiseDescription;
  }

  /**
   * Get the current status with semantic description
   */
  status(): PromiseStatus {
    const elapsed = Date.now() - this.startTime;
    const elapsedStr = elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`;

    const descriptions: Record<'pending' | 'fulfilled' | 'rejected', string> = {
      pending: `Waiting for ${this.promiseDescription}`,
      fulfilled: `Completed: ${this.promiseDescription}`,
      rejected: `Failed: ${this.promiseDescription}`,
    };

    return {
      state: this.state,
      description: descriptions[this.state],
      elapsed: elapsedStr,
    };
  }

  /**
   * Add semantic retry logic
   */
  retry(options: RetryOptions): SemanticPromise<T> {
    const { maxAttempts, when, backoff = 'exponential', delayMs = 1000 } = options;

    const retryFn = async (): Promise<T> => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await this.promise;
        } catch (error) {
          lastError = error;

          // Check if we should retry based on the 'when' condition
          if (when && attempt < maxAttempts) {
            const shouldRetry = await this.shouldRetry(error, when);
            if (!shouldRetry) {
              throw error;
            }
          }

          if (attempt < maxAttempts) {
            const delay = this.calculateDelay(attempt, backoff, delayMs);
            await this.sleep(delay);
          }
        }
      }

      throw lastError;
    };

    return new SemanticPromise(retryFn(), this.promiseDescription, this.client);
  }

  private async shouldRetry(error: unknown, condition: string): Promise<boolean> {
    const errorStr = error instanceof Error ? error.message : String(error);
    const prompt = createShouldRetryPrompt(errorStr, condition);

    const response = await this.client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { shouldRetry: boolean };
    return result.shouldRetry;
  }

  private calculateDelay(attempt: number, backoff: string, baseDelay: number): number {
    switch (backoff) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      case 'linear':
        return baseDelay * attempt;
      case 'fixed':
      default:
        return baseDelay;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Transform the result with semantic understanding
   */
  async transform<U>(instruction: string): Promise<SemanticPromise<U>> {
    const value = await this.promise;
    const prompt = createTransformPrompt(value, instruction);

    const response = await this.client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as { transformed: U };
    return SemanticPromise.resolve(
      result.transformed,
      `transformed: ${instruction}`,
      this.client
    );
  }

  /**
   * Validate the result against semantic rules
   */
  validateResult(rules: string[]): SemanticPromise<T> {
    const validateFn = async (): Promise<T> => {
      const value = await this.promise;
      const prompt = createValidateResultPrompt(value, rules);

      const response = await this.client.complete({
        prompt,
        systemPrompt: PROMISE_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      const result = JSON.parse(response.content) as { valid: boolean; issues: string[] };

      if (!result.valid) {
        throw new Error(`Validation failed: ${result.issues.join(', ')}`);
      }

      return value;
    };

    return new SemanticPromise(validateFn(), this.promiseDescription, this.client);
  }

  /**
   * Provide a fallback with semantic matching
   */
  fallback<U>(fallbackValue: U | (() => U), when?: string): SemanticPromise<T | U> {
    const fallbackFn = async (): Promise<T | U> => {
      try {
        return await this.promise;
      } catch (error) {
        // If no condition specified, always use fallback
        if (!when) {
          return typeof fallbackValue === 'function'
            ? (fallbackValue as () => U)()
            : fallbackValue;
        }

        // Check if error matches the fallback condition
        const shouldFallback = await this.shouldFallback(error, when);
        if (shouldFallback) {
          return typeof fallbackValue === 'function'
            ? (fallbackValue as () => U)()
            : fallbackValue;
        }

        throw error;
      }
    };

    return new SemanticPromise(
      fallbackFn(),
      this.promiseDescription,
      this.client
    );
  }

  private async shouldFallback(error: unknown, condition: string): Promise<boolean> {
    const errorStr = error instanceof Error ? error.message : String(error);
    const prompt = createShouldFallbackPrompt(errorStr, condition);

    const response = await this.client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { shouldFallback: boolean };
    return result.shouldFallback;
  }

  /**
   * Log progress with semantic descriptions
   */
  withLogging(logger: (message: string) => void): SemanticPromise<T> {
    logger(`Starting: ${this.promiseDescription}`);

    const loggedPromise = this.promise
      .then((value) => {
        const elapsed = Date.now() - this.startTime;
        logger(`Completed: ${this.promiseDescription} (${elapsed}ms)`);
        return value;
      })
      .catch((error: unknown) => {
        const elapsed = Date.now() - this.startTime;
        logger(`Failed: ${this.promiseDescription} (${elapsed}ms) - ${String(error)}`);
        throw error;
      });

    return new SemanticPromise(
      loggedPromise,
      this.promiseDescription,
      this.client
    );
  }

  /**
   * Infer what this promise is likely doing
   */
  async inferOperation(): Promise<InferOperationResult> {
    const prompt = createInferOperationPrompt(this.promiseDescription);

    const response = await this.client.complete({
      prompt,
      systemPrompt: PROMISE_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    const result = JSON.parse(response.content) as InferOperationResult & { confidence: number };
    return {
      operation: result.operation,
      resource: result.resource,
      action: result.action,
    };
  }

  /**
   * Get the description
   */
  get description(): string {
    return this.promiseDescription;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return `SemanticPromise(${this.promiseDescription})`;
  }

  /**
   * Enable await directly
   */
  [Symbol.toStringTag] = 'SemanticPromise';
}
