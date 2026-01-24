# SemanticNumber

## Overview

The `SemanticNumber` type extends the native JavaScript number with LLM-powered semantic understanding. It can interpret numbers in context, understand approximate values, and validate numeric reasonableness.

**Core Principle**: Numbers represent quantities with meaning - semantic operations should understand context, units, and reasonableness through LLM intelligence.

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

```
src/primitives/number/
├── index.ts              # Module exports
├── number.ts             # SemanticNumber class implementation
├── number.prompts.ts     # LLM prompt templates
└── __tests__/
    └── number.test.ts    # Comprehensive tests with mocked LLM
```

- **Export**: Re-exported from `src/primitives/index.ts` and `src/index.ts`

### Design Decisions

1. **LLM-Only Operations**: All semantic operations use LLM for maximum intelligence and context understanding. This keeps the implementation focused on leveraging AI capabilities rather than reimplementing standard utilities.

2. **Dependency Injection for LLM Client**: The `SemanticNumber` class accepts an optional `LLMClientInterface` for dependency injection, enabling easy mocking in tests without actual LLM calls.

3. **Prompt Organization**: All LLM prompts are centralized in `number.prompts.ts` with:
   - System prompts for each operation type
   - User prompt template functions
   - Structured JSON response formats

4. **Folder-Based Organization**: Each primitive type has its own folder containing implementation, prompts, and tests. This mirrors the structure used by other primitives like SemanticString.

### LLM Operations

All methods use LLM calls for semantic understanding:
- `SemanticNumber.from()` - Parse natural language to numbers
- `semanticallyEquals()` - Context-aware numeric comparison
- `isReasonable()` - Validate numbers against domain knowledge
- `inferUnit()` - Infer units from context
- `convert()` - Semantic unit conversion
- `describe()` - Human-friendly magnitude descriptions

### Test Coverage

61 tests covering:
- Constructor and basic operations
- LLM-based parsing with mocked responses
- Semantic equality with various tolerances
- Reasonableness validation
- Unit inference and conversion
- Human-friendly descriptions
- Edge cases (negative numbers, decimals, zero)

### Future Considerations

1. **Caching**: Consider adding response caching for repeated LLM calls with the same parameters
2. **Streaming**: For large descriptions, consider streaming responses
3. **Batch Operations**: Add batch methods for processing multiple numbers efficiently
4. **Context Chaining**: Allow context to be passed between operations for more coherent results
