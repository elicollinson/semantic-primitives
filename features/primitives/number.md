# SemanticNumber

## Overview

The `SemanticNumber` type extends the native JavaScript number with LLM-powered semantic understanding. It can interpret numbers in context, understand approximate values, detect anomalies, and validate numeric reasonableness.

**Core Principle**: Numbers represent quantities with meaning - semantic operations should understand context, units, and reasonableness.

---

## Interface

```typescript
interface SemanticNumber {
  /**
   * Parse a number from natural language or formatted string.
   * Understands words, abbreviations, and localized formats.
   *
   * @param input - Natural language or formatted number string
   * @param context - Optional context for interpretation
   * @returns SemanticNumber instance
   *
   * @example
   * SemanticNumber.from("twenty-five") // 25
   * SemanticNumber.from("2.5k") // 2500
   * SemanticNumber.from("$1,234.56") // 1234.56
   * SemanticNumber.from("about a dozen") // 12
   */
  static from(input: string, context?: string): SemanticNumber;

  /**
   * Check if two numbers are semantically equivalent.
   * Considers approximate values and contextual equivalence.
   *
   * @param other - Number to compare with
   * @param options - Comparison options including tolerance
   * @returns Equivalence result with confidence
   *
   * @example
   * SemanticNumber.from(100).semanticallyEquals(99, { tolerance: "approximate" })
   * // { equivalent: true, confidence: 0.95 }
   *
   * SemanticNumber.from("a dozen").semanticallyEquals(12)
   * // { equivalent: true, confidence: 1.0 }
   */
  semanticallyEquals(
    other: number | SemanticNumber,
    options?: { tolerance?: "exact" | "approximate" | number }
  ): { equivalent: boolean; confidence: number };

  /**
   * Validate if the number is reasonable for a given context.
   *
   * @param context - What this number represents
   * @returns Validation result with explanation
   *
   * @example
   * SemanticNumber.from(150).isReasonable("human age")
   * // { reasonable: false, explanation: "Human age rarely exceeds 120 years" }
   *
   * SemanticNumber.from(-5).isReasonable("quantity of items")
   * // { reasonable: false, explanation: "Quantity cannot be negative" }
   */
  isReasonable(context: string): { reasonable: boolean; explanation: string };

  /**
   * Infer the likely unit for this number based on context.
   *
   * @param context - Context describing what this number represents
   * @returns Inferred unit with confidence
   *
   * @example
   * SemanticNumber.from(72).inferUnit("body temperature")
   * // { unit: "fahrenheit", confidence: 0.85 }
   *
   * SemanticNumber.from(100).inferUnit("speed limit in Europe")
   * // { unit: "km/h", confidence: 0.92 }
   */
  inferUnit(context: string): { unit: string; confidence: number };

  /**
   * Convert to a different unit with semantic understanding.
   *
   * @param toUnit - Target unit
   * @param fromUnit - Source unit (optional, can be inferred)
   * @returns Converted number
   *
   * @example
   * SemanticNumber.from(100).convert("celsius", "fahrenheit")
   * // SemanticNumber(37.78)
   */
  convert(toUnit: string, fromUnit?: string): SemanticNumber;

  /**
   * Format the number in a human-readable way based on context.
   *
   * @param options - Formatting options
   * @returns Formatted string
   *
   * @example
   * SemanticNumber.from(1234567).format({ style: "compact" })
   * // "1.2M"
   *
   * SemanticNumber.from(0.156).format({ style: "percent" })
   * // "15.6%"
   */
  format(options?: {
    style?: "compact" | "full" | "percent" | "currency";
    locale?: string;
    currency?: string;
  }): string;

  /**
   * Detect if this number is an outlier compared to a dataset.
   *
   * @param dataset - Array of numbers to compare against
   * @returns Outlier detection result
   *
   * @example
   * SemanticNumber.from(1000).isOutlier([10, 12, 11, 13, 9])
   * // { isOutlier: true, severity: "extreme", zscore: 8.5 }
   */
  isOutlier(dataset: number[]): { isOutlier: boolean; severity?: string; zscore?: number };

  /**
   * Get a human-friendly description of the number's magnitude.
   *
   * @param context - Optional context for more relevant description
   * @returns Human-readable description
   *
   * @example
   * SemanticNumber.from(1000000).describe()
   * // "one million"
   *
   * SemanticNumber.from(86400).describe("seconds")
   * // "one day (86,400 seconds)"
   */
  describe(context?: string): string;

  /**
   * Check if the number matches a common pattern or category.
   *
   * @param pattern - Pattern to check (e.g., "even", "prime", "power-of-two")
   * @returns Whether the number matches the pattern
   *
   * @example
   * SemanticNumber.from(16).matches("power-of-two") // true
   * SemanticNumber.from(7).matches("prime") // true
   */
  matches(pattern: string): boolean;

  /**
   * Get the raw numeric value.
   *
   * @returns The underlying number
   */
  valueOf(): number;
}
```
