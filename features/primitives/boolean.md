# SemanticBoolean

## Overview

The `SemanticBoolean` type extends the native JavaScript boolean with LLM-powered semantic understanding. Unlike traditional booleans that only understand `true`/`false`, semantic booleans can interpret natural language, handle ambiguity, and bridge the gap between human communication and binary logic.

**Core Principle**: Booleans are for evaluation - determining truth values from ambiguous human expressions.

---

## Interface

```typescript
interface SemanticBoolean {
  /**
   * Parse natural language into a boolean value.
   * Understands affirmatives, negatives, and contextual expressions.
   *
   * @param input - Natural language text to interpret
   * @param options - Optional locale and context settings
   * @returns SemanticBoolean instance
   *
   * @example
   * SemanticBoolean.from("yes") // true
   * SemanticBoolean.from("absolutely") // true
   * SemanticBoolean.from("nope") // false
   * SemanticBoolean.from("hai", { locale: "ja" }) // true (Japanese yes)
   */
  static from(input: string, options?: { locale?: string; context?: string }): SemanticBoolean;

  /**
   * Infer boolean value from an implication or statement.
   * Analyzes statements that imply success/failure, presence/absence.
   *
   * @param statement - A declarative statement to analyze
   * @returns SemanticBoolean with inferred value
   *
   * @example
   * SemanticBoolean.fromImplication("The test passed") // true
   * SemanticBoolean.fromImplication("We encountered errors") // false
   * SemanticBoolean.fromImplication("No issues found") // true
   */
  static fromImplication(statement: string): SemanticBoolean;

  /**
   * Check if two boolean expressions are semantically equivalent.
   * Considers synonyms, cultural variations, and context.
   *
   * @param other - Another SemanticBoolean to compare
   * @returns Equivalence result with confidence score
   *
   * @example
   * SemanticBoolean.from("yes").semanticallyEquals(SemanticBoolean.from("absolutely"))
   * // { equivalent: true, confidence: 0.95 }
   */
  semanticallyEquals(other: SemanticBoolean): { equivalent: boolean; confidence: number };

  /**
   * Compare the strength/emphasis of two boolean expressions.
   * Returns negative if this is weaker, positive if stronger.
   *
   * @param other - Another SemanticBoolean to compare strength with
   * @returns Number from -1 to 1 indicating relative strength
   *
   * @example
   * SemanticBoolean.from("I guess so").compareStrength(SemanticBoolean.from("Absolutely!"))
   * // -0.6 (weaker)
   */
  compareStrength(other: SemanticBoolean): number;

  /**
   * Check if the expression is affirmative (yes, sure, absolutely, etc.).
   *
   * @returns true if the expression indicates agreement/yes
   *
   * @example
   * SemanticBoolean.from("sure thing").isAffirmative() // true
   * SemanticBoolean.from("I guess so").isAffirmative() // true
   */
  isAffirmative(): boolean;

  /**
   * Check if the expression is negative (no, nope, never, etc.).
   *
   * @returns true if the expression indicates disagreement/no
   *
   * @example
   * SemanticBoolean.from("no way").isNegative() // true
   * SemanticBoolean.from("I'd rather not").isNegative() // true
   */
  isNegative(): boolean;

  /**
   * Check if the expression indicates uncertainty (maybe, perhaps, etc.).
   *
   * @returns true if the expression is ambiguous or uncertain
   *
   * @example
   * SemanticBoolean.from("maybe").isUncertain() // true
   * SemanticBoolean.from("it depends").isUncertain() // true
   */
  isUncertain(): boolean;

  /**
   * Check if the expression is conditional (yes, but...; if...; etc.).
   *
   * @returns true if the response depends on conditions
   *
   * @example
   * SemanticBoolean.from("yes, if the price is right").isConditional() // true
   */
  isConditional(): boolean;

  /**
   * Extract conditions from a conditional boolean expression.
   *
   * @returns Array of condition strings, empty if not conditional
   *
   * @example
   * SemanticBoolean.from("yes, if you can deliver by Friday").extractConditions()
   * // ["deliver by Friday"]
   */
  extractConditions(): string[];

  /**
   * Get the raw boolean value.
   *
   * @returns The resolved true/false value
   */
  valueOf(): boolean;

  /**
   * Get the confidence level of the interpretation.
   *
   * @returns Number from 0 to 1 indicating interpretation confidence
   */
  confidence(): number;
}
```

---

## Implementation Notes

### File Structure

- `src/primitives/boolean.ts` - Main SemanticBoolean class implementation
- `src/primitives/boolean.prompts.ts` - LLM prompt templates for boolean operations
- `src/primitives/index.ts` - Module exports
- `src/primitives/__tests__/boolean.test.ts` - Unit tests (68 tests)
- `src/primitives/__tests__/mocks.ts` - Mock utilities for testing

### Key Design Decisions

1. **Async API**: All methods that require LLM calls (`from`, `fromImplication`, `semanticallyEquals`, `compareStrength`, `extractConditions`) are async and return Promises. This is necessary because LLM calls are inherently asynchronous.

2. **Client Injection**: All static factory methods accept an optional `LLMClient` parameter for dependency injection, enabling easy testing with mocks.

3. **Category-Based Classification**: Boolean expressions are classified into four categories:
   - `affirmative` - Clear positive responses (yes, sure, absolutely)
   - `negative` - Clear negative responses (no, nope, never)
   - `uncertain` - Ambiguous responses (maybe, perhaps, it depends)
   - `conditional` - Qualified responses (yes, if...)

4. **Low Temperature**: All LLM calls use `temperature: 0.1` for consistent, deterministic results.

5. **Lazy Condition Extraction**: Conditions parsed during `from()` are cached. `extractConditions()` only makes an additional LLM call if conditions weren't parsed initially.

6. **Helper Methods**: Convenience method `fromBoolean()` creates a SemanticBoolean from a raw boolean with 100% confidence, useful for testing and interop.

### Exported Types

- `SemanticBoolean` - The main class
- `FromOptions` - Options for `from()` method (locale, context)
- `SemanticEqualsResult` - Return type for `semanticallyEquals()`
- `BooleanCategory` - Union type for expression categories

### Testing Strategy

Unit tests use mocked LLM clients to avoid actual API calls. Tests cover:
- All public methods
- Category detection (affirmative, negative, uncertain, conditional)
- Condition extraction
- Strength comparison
- Semantic equality
- JSON serialization
