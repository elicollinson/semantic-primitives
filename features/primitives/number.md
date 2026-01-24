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

---

## Implementation Notes

### File Structure

- **Implementation**: `src/primitives/number.ts`
- **Prompts**: `src/primitives/number.prompts.ts`
- **Tests**: `src/primitives/__tests__/number.test.ts`
- **Export**: Re-exported from `src/primitives/index.ts` and `src/index.ts`

### Design Decisions

1. **Dependency Injection for LLM Client**: The `SemanticNumber` class accepts an optional `LLMClientInterface` for dependency injection, enabling easy mocking in tests without actual LLM calls.

2. **Optimized Parsing**: The `from()` method first attempts simple parsing (numeric strings, currency formats, k/M/B suffixes) before falling back to LLM-based parsing. This reduces unnecessary LLM calls for common formats.

3. **Non-LLM Operations**: Several methods operate without LLM calls when possible:
   - `semanticallyEquals()` with `exact` or numeric tolerance
   - `format()` uses Intl.NumberFormat
   - `isOutlier()` uses z-score calculation
   - `matches()` uses mathematical algorithms for patterns

4. **Pattern Matching**: Supports the following patterns in `matches()`:
   - `even`, `odd`, `prime`, `power-of-two`
   - `positive`, `negative`, `zero`
   - `integer`, `decimal`/`float`
   - `perfect-square`, `fibonacci`
   - Patterns are case-insensitive and accept hyphens, underscores, or spaces

5. **Prompt Organization**: All LLM prompts are centralized in `number.prompts.ts` with:
   - System prompts for each operation type
   - User prompt template functions
   - Structured JSON response formats

### Test Coverage

102 tests covering:
- Constructor and basic operations
- Simple parsing (no LLM)
- LLM-based parsing with mocked responses
- Semantic equality with various tolerances
- Reasonableness validation
- Unit inference and conversion
- Number formatting
- Outlier detection with z-score
- Pattern matching for all supported patterns
- Edge cases (empty datasets, negative numbers, decimals)

### Async Operations

The following methods require LLM calls and are async:
- `SemanticNumber.from()` (for complex inputs)
- `semanticallyEquals()` (with `approximate` tolerance)
- `isReasonable()`
- `inferUnit()`
- `convert()`
- `describe()`

### Future Considerations

1. **Caching**: Consider adding response caching for repeated LLM calls with the same parameters
2. **Streaming**: For large descriptions, consider streaming responses
3. **Batch Operations**: Add batch methods for processing multiple numbers efficiently
4. **Currency Support**: Enhanced currency detection and real-time conversion rates
