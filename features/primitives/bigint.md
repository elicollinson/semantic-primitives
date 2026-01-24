# SemanticBigInt

## Overview

The `SemanticBigInt` type extends the native JavaScript BigInt with LLM-powered semantic understanding. It handles very large integers with context awareness, human-readable formatting, and domain-specific validation.

**Core Principle**: BigInts represent large integers with meaning - semantic operations should understand scale, domain context, and provide human-readable representations.

---

## Interface

```typescript
interface SemanticBigInt {
  /**
   * Parse a BigInt from natural language or formatted string.
   * Understands scientific notation, word forms, and abbreviations.
   *
   * @param input - Natural language or formatted BigInt string
   * @returns SemanticBigInt instance
   *
   * @example
   * SemanticBigInt.from("1 trillion") // 1000000000000n
   * SemanticBigInt.from("10^18") // 1000000000000000000n
   * SemanticBigInt.from("5.2e15") // 5200000000000000n
   */
  static from(input: string | number | bigint): SemanticBigInt;

  /**
   * Check if two BigInts are semantically equivalent.
   * Considers approximate values for very large numbers.
   *
   * @param other - BigInt to compare with
   * @param options - Comparison options
   * @returns Equivalence result with confidence
   *
   * @example
   * SemanticBigInt.from("1 trillion").semanticallyEquals(1000000000000n)
   * // { equivalent: true, confidence: 1.0 }
   */
  semanticallyEquals(
    other: bigint | SemanticBigInt,
    options?: { tolerance?: "exact" | "approximate" }
  ): { equivalent: boolean; confidence: number };

  /**
   * Validate if the BigInt is reasonable for a given domain.
   *
   * @param domain - Domain context (e.g., "database-id", "cryptocurrency-amount")
   * @returns Validation result with explanation
   *
   * @example
   * SemanticBigInt.from(-1n).isReasonable("database-id")
   * // { reasonable: false, explanation: "Database IDs are typically positive" }
   */
  isReasonable(domain: string): { reasonable: boolean; explanation: string };

  /**
   * Format the BigInt in a human-readable way.
   *
   * @param options - Formatting options
   * @returns Formatted string
   *
   * @example
   * SemanticBigInt.from(1234567890123n).format({ style: "words" })
   * // "1.23 trillion"
   *
   * SemanticBigInt.from(1234567890123n).format({ style: "scientific" })
   * // "1.23 × 10^12"
   */
  format(options?: {
    style?: "words" | "compact" | "scientific" | "full";
    locale?: string;
  }): string;

  /**
   * Get a human-friendly description of the magnitude.
   *
   * @param context - Optional context for more relevant comparison
   * @returns Human-readable description with relatable comparisons
   *
   * @example
   * SemanticBigInt.from(7900000000n).describe("population")
   * // "about 7.9 billion (roughly the world population)"
   */
  describe(context?: string): string;

  /**
   * Infer what domain or type this BigInt likely represents.
   *
   * @returns Inferred domain with confidence
   *
   * @example
   * SemanticBigInt.from(1609459200000n).inferDomain()
   * // { domain: "unix-timestamp-ms", confidence: 0.87 }
   */
  inferDomain(): { domain: string; confidence: number };

  /**
   * Check if this BigInt matches common patterns.
   *
   * @param pattern - Pattern to check
   * @returns Whether the BigInt matches the pattern
   *
   * @example
   * SemanticBigInt.from(1024n).matches("power-of-two") // true
   * SemanticBigInt.from(13n).matches("prime") // true
   */
  matches(pattern: string): boolean;

  /**
   * Get the scale/order of magnitude.
   *
   * @returns Scale description
   *
   * @example
   * SemanticBigInt.from(1000000000000n).scale()
   * // { magnitude: 12, name: "trillion", scientificNotation: "10^12" }
   */
  scale(): { magnitude: number; name: string; scientificNotation: string };

  /**
   * Get the raw BigInt value.
   *
   * @returns The underlying BigInt
   */
  valueOf(): bigint;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number }` | `SemanticEqualsResult` |
| `isReasonable()` | `{ reasonable: boolean; explanation: string }` | `ReasonableResult` |
| `inferDomain()` | `{ domain: string; confidence: number }` | `InferDomainResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  ReasonableResult,
  InferDomainResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### File Structure

```
src/primitives/bigint/
├── index.ts              # Module exports
├── bigint.ts             # Main SemanticBigInt class implementation
├── prompts.ts            # LLM prompt templates
└── __tests__/
    ├── bigint.test.ts    # Comprehensive unit tests
    └── mocks.ts          # Mock LLM client utilities
```

### Interfaces Implemented

- `Semantic<bigint>` - Base wrapper providing `valueOf()`
- `Comparable<bigint | SemanticBigInt>` - Semantic equality via `semanticallyEquals()`
- `ContextValidatable` - Domain validation via `isReasonable()`
- `Describable` (extends `Explainable`) - Human-readable output via `explain()` and `describe()`

### Local vs LLM Operations

The implementation optimizes performance by using local computation where possible:

**Local (no LLM call):**
- `valueOf()`, `toString()`, `toJSON()` - Basic accessors
- `scale()` - Magnitude calculation using string length
- `format({ style: 'full' })` - Thousands separator formatting
- `matches('even')`, `matches('odd')` - Modulo operations
- `matches('power-of-two')` - Bitwise check `(n & (n-1)) === 0n`
- `matches('perfect-square')` - Newton's method for integer square root
- `matches('prime')` for values ≤ 1,000,000 - Trial division
- `semanticallyEquals(other, { tolerance: 'exact' })` - Direct equality
- `explain()` without context - Returns computed scale description

**LLM-powered:**
- `from(string)` for natural language (e.g., "1 trillion", "10^18")
- `format({ style: 'words' | 'compact' | 'scientific' })` - Human-readable formatting
- `describe(context?)` - Context-aware descriptions with comparisons
- `explain(context)` - Delegates to `describe()` when context provided
- `isReasonable(domain)` - Domain-specific validation
- `inferDomain()` - Domain inference from value patterns
- `matches('prime')` for large values - Heuristic analysis
- `matches('fibonacci' | 'factorial' | custom)` - Pattern recognition
- `semanticallyEquals(other, { tolerance: 'approximate' })` - Fuzzy comparison

### Design Decisions

1. **Private constructor with factory methods**: Follows existing primitive patterns, enabling both sync (`fromBigInt`, `fromNumber`) and async (`from`) creation paths.

2. **Scale names**: Supports ones through septillions (10^24). Larger values show the correct magnitude but use the highest available name.

3. **Prime checking threshold**: Values ≤ 1,000,000 use efficient local trial division; larger values use LLM heuristics since primality testing for arbitrary precision integers is computationally expensive.

4. **Perfect square via Newton's method**: Efficient O(log n) integer square root algorithm suitable for BigInt values of any size.

5. **Temperature settings**:
   - 0.1 for deterministic operations (parsing, comparison, validation)
   - 0.3 for `describe()` to allow more creative comparisons

### Test Coverage

- 65 unit tests covering all public methods
- Mock LLM client utilities for isolated testing
- Tests for edge cases: zero, negative values, boundary conditions
- Prompt template tests to verify correct formatting
