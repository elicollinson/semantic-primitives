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

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number }` | `SemanticEqualsResult` |
| `durationTo()` | `{ description: string; days: number; businessDays?: number }` | `DurationResult` |
| `isReasonable()` | `{ reasonable: boolean; reason?: string }` | `ReasonableResult` |
| `inferMeaning()` | `{ meaning: string; type: string; confidence: number }` | `InferMeaningResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  DurationResult,
  ReasonableResult,
  InferMeaningResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure
The implementation follows the project structure guidelines:
```
src/types/date/
├── index.ts        # Re-exports public API
├── date.ts         # Main SemanticDate class (600+ lines)
├── prompts.ts      # LLM prompt templates (200+ lines)
└── __tests__/
    └── date.test.ts  # Unit tests with mocked LLM (700+ lines)
```

### Interface Compatibility
To comply with the shared `Comparable` and `Describable` interfaces from `src/shared/interfaces.ts`:

1. **`semanticallyEquals()`** accepts `options?: Record<string, unknown>` with a `precision` property instead of a direct precision parameter:
   ```typescript
   // Interface-compliant signature
   semanticallyEquals(other: Date | SemanticDate, options?: Record<string, unknown>): Promise<SemanticEqualsResult>

   // Usage
   date.semanticallyEquals(otherDate, { precision: 'day' })
   ```

2. **`describe()`** accepts `context?: string` instead of options object. Style is inferred from context:
   ```typescript
   // Interface-compliant signature
   describe(context?: string): Promise<string>

   // Usage - pass 'relative', 'absolute', or any context string
   date.describe('relative')  // Uses relative style
   date.describe('absolute')  // Uses absolute style
   date.describe()            // Uses 'smart' style by default
   ```

### Naming Conventions
To avoid export conflicts with primitives module:
- `DateLLMClientInterface` instead of `LLMClientInterface`
- `DateSemanticEqualsOptions` instead of `SemanticEqualsOptions`

### Immutability
- The constructor creates a defensive copy of the input Date
- `valueOf()` returns a copy of the internal Date to prevent mutation
- All mutation operations (`add()`, `next()`, `previous()`) return new SemanticDate instances

### Date Delegation
SemanticDate wraps but does not extend Date. Common Date methods are delegated:
- `getTime()`, `getFullYear()`, `getMonth()`, `getDate()`, `getDay()`
- `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()`
- `toISOString()`, `toString()`, `toJSON()`

### Async Operations
All LLM-powered operations are async:
- `from()` (static) - natural language parsing
- `semanticallyEquals()` - semantic comparison
- `describe()` - natural language description
- `formatFor()` - context-aware formatting
- `isIn()` - period membership
- `next()` / `previous()` - occurrence finding
- `durationTo()` - duration calculation
- `isReasonable()` - reasonableness validation
- `add()` - semantic duration addition
- `inferMeaning()` - meaning inference
- `explain()` - human-readable explanation

### Test Coverage
56 unit tests covering:
- Constructor and immutability
- Static `from()` with Date and string inputs
- All semantic methods with mocked LLM responses
- Date method delegation
- Error handling for unparseable inputs
