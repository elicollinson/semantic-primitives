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
