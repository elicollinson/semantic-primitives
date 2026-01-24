/**
 * SemanticDate - LLM-enhanced date type with semantic understanding
 *
 * Extends the native JavaScript Date with semantic operations including:
 * - Natural language date parsing
 * - Context-aware equality comparison
 * - Intelligent formatting for different contexts
 * - Period membership checking
 * - Semantic duration calculations
 * - Meaning inference
 *
 * Implements shared interfaces:
 * - Semantic<Date> - Base semantic wrapper
 * - Comparable<Date | SemanticDate> - Semantic equality comparison
 * - ContextValidatable - Reasonableness checks
 * - Describable - Human-friendly descriptions
 */

import { chat } from '../../llm/index.ts';
import type { LLMConfig, Message } from '../../llm/types.ts';
import type {
  SemanticEqualsResult,
  ReasonableResult,
  DurationResult,
  InferMeaningResult,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  ContextValidatable,
  Describable,
} from '../../shared/interfaces.ts';
import {
  PARSE_DATE_SYSTEM,
  parseDatePrompt,
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  DESCRIBE_DATE_SYSTEM,
  describeDatePrompt,
  FORMAT_DATE_SYSTEM,
  formatDatePrompt,
  IS_IN_PERIOD_SYSTEM,
  isInPeriodPrompt,
  NEXT_OCCURRENCE_SYSTEM,
  nextOccurrencePrompt,
  PREVIOUS_OCCURRENCE_SYSTEM,
  previousOccurrencePrompt,
  DURATION_SYSTEM,
  durationPrompt,
  IS_REASONABLE_SYSTEM,
  isReasonablePrompt,
  ADD_DURATION_SYSTEM,
  addDurationPrompt,
  INFER_MEANING_SYSTEM,
  inferMeaningPrompt,
} from './prompts.ts';

// Re-export shared types
export type {
  SemanticEqualsResult,
  ReasonableResult,
  DurationResult,
  InferMeaningResult,
} from '../../shared/types.ts';

/** Options for date parsing */
export interface ParseDateOptions {
  referenceDate?: Date;
  timezone?: string;
}

/** Precision levels for date comparison */
export type DatePrecision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'exact';

/** Options for semantic date equals comparison */
export interface DateSemanticEqualsOptions {
  precision?: DatePrecision;
}

/** LLM client interface for dependency injection */
export interface DateLLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticDate class
 * Wraps a Date value with LLM-powered semantic operations
 *
 * Implements:
 * - Semantic<Date> - valueOf() returns the date value
 * - Comparable<Date | SemanticDate> - semanticallyEquals() for comparison
 * - ContextValidatable - isReasonable() for context-aware validation
 * - Describable - describe() for human-friendly descriptions
 */
export class SemanticDate
  implements
    Semantic<Date>,
    Comparable<Date | SemanticDate>,
    ContextValidatable,
    Describable
{
  private readonly _value: Date;
  private readonly _llmClient: DateLLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticDate instance
   * @param value - The Date value to wrap
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    value: Date,
    llmClient?: DateLLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._value = new Date(value.getTime());
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Parse a date from natural language
   * Understands relative expressions, cultural references, and various formats
   *
   * @param input - Natural language date expression
   * @param options - Parsing options including reference date and timezone
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticDate instance
   *
   * @example
   * SemanticDate.from("next Friday")
   * SemanticDate.from("two weeks ago")
   * SemanticDate.from("the day after tomorrow")
   * SemanticDate.from("Q4 2024")
   */
  static async from(
    input: string | Date,
    options?: ParseDateOptions,
    llmClient?: DateLLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<SemanticDate> {
    // If input is already a Date, wrap it directly
    if (input instanceof Date) {
      return new SemanticDate(input, llmClient, llmConfig);
    }

    // Use LLM for parsing natural language
    const client = llmClient || { chat };
    const referenceDate = options?.referenceDate || new Date();
    const messages: Message[] = [
      {
        role: 'user',
        content: parseDatePrompt(
          input,
          referenceDate.toISOString(),
          options?.timezone
        ),
      },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: PARSE_DATE_SYSTEM,
      ...llmConfig,
    });

    const result = JSON.parse(response.content) as {
      date: string | null;
      confidence: number;
      interpretation: string;
    };

    if (result.date === null) {
      throw new Error(`Unable to parse "${input}" as a date: ${result.interpretation}`);
    }

    return new SemanticDate(new Date(result.date), llmClient, llmConfig);
  }

  /**
   * Check if two dates are semantically equivalent
   * Considers precision level (day vs exact time)
   *
   * @param other - Date to compare with
   * @param options - Comparison options with optional precision (default: "day")
   * @returns Equivalence result with confidence
   *
   * @example
   * date1.semanticallyEquals(date2, { precision: "day" })
   * // Same day regardless of time
   */
  async semanticallyEquals(
    other: Date | SemanticDate,
    options?: Record<string, unknown>
  ): Promise<SemanticEqualsResult> {
    const otherValue = other instanceof SemanticDate ? other.valueOf() : other;
    const precision: DatePrecision =
      options && 'precision' in options && options.precision
        ? (options.precision as DatePrecision)
        : 'day';

    const messages: Message[] = [
      {
        role: 'user',
        content: semanticEqualsPrompt(
          this._value.toISOString(),
          otherValue.toISOString(),
          precision
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Describe the date in natural language relative to now
   *
   * @param context - Optional context for description (e.g., "relative", "absolute", or custom context)
   * @returns Human-readable description
   *
   * @example
   * date.describe()
   * // "3 days ago" or "next Tuesday" or "in 2 weeks"
   */
  async describe(context?: string): Promise<string> {
    // If context is one of the known styles, use it; otherwise use "smart"
    const style = context === 'relative' || context === 'absolute' ? context : 'smart';
    const now = new Date();

    const messages: Message[] = [
      {
        role: 'user',
        content: describeDatePrompt(
          this._value.toISOString(),
          now.toISOString(),
          style
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DESCRIBE_DATE_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { description: string };
    return result.description;
  }

  /**
   * Format the date for a specific context or audience
   *
   * @param context - Formatting context
   * @returns Formatted date string
   *
   * @example
   * date.formatFor("formal business document") // "January 15, 2024"
   * date.formatFor("casual chat") // "Jan 15"
   * date.formatFor("API response") // "2024-01-15T00:00:00Z"
   */
  async formatFor(context: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'user',
        content: formatDatePrompt(this._value.toISOString(), context),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: FORMAT_DATE_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { formatted: string };
    return result.formatted;
  }

  /**
   * Check if the date falls within a semantic time period
   *
   * @param period - Natural language period description
   * @returns Whether date is in period
   *
   * @example
   * date.isIn("this week")
   * date.isIn("business hours")
   * date.isIn("holiday season")
   */
  async isIn(period: string): Promise<boolean> {
    const now = new Date();

    const messages: Message[] = [
      {
        role: 'user',
        content: isInPeriodPrompt(
          this._value.toISOString(),
          period,
          now.toISOString()
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: IS_IN_PERIOD_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { inPeriod: boolean; confidence: number };
    return result.inPeriod;
  }

  /**
   * Get the next occurrence of a semantic event
   *
   * @param event - Event description
   * @returns Next occurrence as SemanticDate
   *
   * @example
   * date.next("Monday")
   * date.next("business day")
   * date.next("end of month")
   */
  async next(event: string): Promise<SemanticDate> {
    const messages: Message[] = [
      {
        role: 'user',
        content: nextOccurrencePrompt(this._value.toISOString(), event),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: NEXT_OCCURRENCE_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { date: string; description: string };
    return new SemanticDate(new Date(result.date), this._llmClient, this._llmConfig);
  }

  /**
   * Get the previous occurrence of a semantic event
   *
   * @param event - Event description
   * @returns Previous occurrence as SemanticDate
   *
   * @example
   * date.previous("payday")
   * date.previous("quarter start")
   */
  async previous(event: string): Promise<SemanticDate> {
    const messages: Message[] = [
      {
        role: 'user',
        content: previousOccurrencePrompt(this._value.toISOString(), event),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: PREVIOUS_OCCURRENCE_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { date: string; description: string };
    return new SemanticDate(new Date(result.date), this._llmClient, this._llmConfig);
  }

  /**
   * Calculate semantic duration to another date
   *
   * @param other - Target date
   * @returns Human-readable duration with day counts
   *
   * @example
   * startDate.durationTo(endDate)
   * // { description: "about 2 weeks", days: 14, businessDays: 10 }
   */
  async durationTo(other: Date | SemanticDate): Promise<DurationResult> {
    const otherValue = other instanceof SemanticDate ? other.valueOf() : other;

    const messages: Message[] = [
      {
        role: 'user',
        content: durationPrompt(
          this._value.toISOString(),
          otherValue.toISOString()
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DURATION_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as DurationResult;
  }

  /**
   * Validate if the date is reasonable for a context
   *
   * @param context - Context for validation
   * @returns Validation result with reason
   *
   * @example
   * date.isReasonable("birth date")
   * // { reasonable: false, reason: "Date is in the future" }
   */
  async isReasonable(context: string): Promise<ReasonableResult> {
    const now = new Date();

    const messages: Message[] = [
      {
        role: 'user',
        content: isReasonablePrompt(
          this._value.toISOString(),
          context,
          now.toISOString()
        ),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: IS_REASONABLE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ReasonableResult;
  }

  /**
   * Add a semantic duration to the date
   *
   * @param duration - Natural language duration
   * @returns New SemanticDate
   *
   * @example
   * date.add("2 business days")
   * date.add("1 quarter")
   */
  async add(duration: string): Promise<SemanticDate> {
    const messages: Message[] = [
      {
        role: 'user',
        content: addDurationPrompt(this._value.toISOString(), duration),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: ADD_DURATION_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as { date: string; interpretation: string };
    return new SemanticDate(new Date(result.date), this._llmClient, this._llmConfig);
  }

  /**
   * Infer what this date likely represents
   *
   * @param context - Additional context
   * @returns Inferred meaning with type and confidence
   *
   * @example
   * SemanticDate.from("2024-12-25").inferMeaning()
   * // { meaning: "Christmas Day", type: "holiday", confidence: 0.98 }
   */
  async inferMeaning(context?: string): Promise<InferMeaningResult> {
    const messages: Message[] = [
      {
        role: 'user',
        content: inferMeaningPrompt(this._value.toISOString(), context),
      },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: INFER_MEANING_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as InferMeaningResult;
  }

  /**
   * Get the raw Date value
   * @returns The underlying Date
   */
  valueOf(): Date {
    return new Date(this._value.getTime());
  }

  /**
   * Explain the date in a human-readable way.
   * Implements Explainable interface.
   *
   * @param context - Optional context for the explanation
   * @returns Human-readable explanation
   */
  async explain(context?: string): Promise<string> {
    if (context) {
      const meaning = await this.inferMeaning(context);
      return `${await this.describe()}: ${meaning.meaning}`;
    }
    return this.describe();
  }

  /**
   * Get the underlying Date's getTime() value
   * @returns Milliseconds since epoch
   */
  getTime(): number {
    return this._value.getTime();
  }

  /**
   * Convert to ISO string
   */
  toISOString(): string {
    return this._value.toISOString();
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * Convert to JSON (ISO string)
   */
  toJSON(): string {
    return this._value.toISOString();
  }

  /**
   * Get the year
   */
  getFullYear(): number {
    return this._value.getFullYear();
  }

  /**
   * Get the month (0-11)
   */
  getMonth(): number {
    return this._value.getMonth();
  }

  /**
   * Get the day of month (1-31)
   */
  getDate(): number {
    return this._value.getDate();
  }

  /**
   * Get the day of week (0-6, Sunday = 0)
   */
  getDay(): number {
    return this._value.getDay();
  }

  /**
   * Get the hours (0-23)
   */
  getHours(): number {
    return this._value.getHours();
  }

  /**
   * Get the minutes (0-59)
   */
  getMinutes(): number {
    return this._value.getMinutes();
  }

  /**
   * Get the seconds (0-59)
   */
  getSeconds(): number {
    return this._value.getSeconds();
  }

  /**
   * Get the milliseconds (0-999)
   */
  getMilliseconds(): number {
    return this._value.getMilliseconds();
  }
}
