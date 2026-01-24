# SemanticDate

## Overview

The `SemanticDate` type extends the native JavaScript Date with LLM-powered semantic understanding. It enables natural language date parsing, intelligent date comparisons, and context-aware formatting.

**Core Principle**: Dates represent points in time with meaning - semantic operations should understand relative references, cultural formats, and temporal context.

---

## Interface

```typescript
interface SemanticDate extends Date {
  /**
   * Parse a date from natural language.
   *
   * @param input - Natural language date expression
   * @param options - Parsing options
   * @returns SemanticDate instance
   *
   * @example
   * SemanticDate.from("next Friday")
   * SemanticDate.from("two weeks ago")
   * SemanticDate.from("the day after tomorrow")
   * SemanticDate.from("Q4 2024")
   */
  static from(
    input: string,
    options?: { referenceDate?: Date; timezone?: string }
  ): SemanticDate;

  /**
   * Check if two dates are semantically equivalent.
   * Considers precision level (day vs exact time).
   *
   * @param other - Date to compare with
   * @param precision - Comparison precision
   * @returns Equivalence result
   *
   * @example
   * date1.semanticallyEquals(date2, "day")
   * // Same day regardless of time
   */
  semanticallyEquals(
    other: Date | SemanticDate,
    precision?: "year" | "month" | "day" | "hour" | "minute" | "exact"
  ): { equivalent: boolean; confidence: number };

  /**
   * Describe the date in natural language relative to now.
   *
   * @param options - Description options
   * @returns Human-readable description
   *
   * @example
   * date.describe()
   * // "3 days ago" or "next Tuesday" or "in 2 weeks"
   */
  describe(options?: { style?: "relative" | "absolute" | "smart" }): string;

  /**
   * Format the date for a specific context or audience.
   *
   * @param context - Formatting context
   * @returns Formatted date string
   *
   * @example
   * date.formatFor("formal business document") // "January 15, 2024"
   * date.formatFor("casual chat") // "Jan 15"
   * date.formatFor("API response") // "2024-01-15T00:00:00Z"
   */
  formatFor(context: string): string;

  /**
   * Check if the date falls within a semantic time period.
   *
   * @param period - Natural language period description
   * @returns Whether date is in period
   *
   * @example
   * date.isIn("this week")
   * date.isIn("business hours")
   * date.isIn("holiday season")
   */
  isIn(period: string): boolean;

  /**
   * Get the next occurrence of a semantic event.
   *
   * @param event - Event description
   * @returns Next occurrence
   *
   * @example
   * date.next("Monday")
   * date.next("business day")
   * date.next("end of month")
   */
  next(event: string): SemanticDate;

  /**
   * Get the previous occurrence of a semantic event.
   *
   * @param event - Event description
   * @returns Previous occurrence
   *
   * @example
   * date.previous("payday")
   * date.previous("quarter start")
   */
  previous(event: string): SemanticDate;

  /**
   * Calculate semantic duration to another date.
   *
   * @param other - Target date
   * @returns Human-readable duration
   *
   * @example
   * startDate.durationTo(endDate)
   * // { description: "about 2 weeks", days: 14, businessDays: 10 }
   */
  durationTo(other: Date): {
    description: string;
    days: number;
    businessDays?: number;
  };

  /**
   * Validate if the date is reasonable for a context.
   *
   * @param context - Context for validation
   * @returns Validation result
   *
   * @example
   * date.isReasonable("birth date")
   * // { reasonable: false, reason: "Date is in the future" }
   */
  isReasonable(context: string): { reasonable: boolean; reason?: string };

  /**
   * Add a semantic duration to the date.
   *
   * @param duration - Natural language duration
   * @returns New date
   *
   * @example
   * date.add("2 business days")
   * date.add("1 quarter")
   */
  add(duration: string): SemanticDate;

  /**
   * Infer what this date likely represents.
   *
   * @param context - Additional context
   * @returns Inferred meaning
   *
   * @example
   * SemanticDate.from("2024-12-25").inferMeaning()
   * // { meaning: "Christmas Day", type: "holiday", confidence: 0.98 }
   */
  inferMeaning(context?: string): { meaning: string; type: string; confidence: number };
}
```
