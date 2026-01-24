# SemanticTuple

## Overview

The `SemanticTuple` type wraps TypeScript tuples with LLM-powered semantic understanding. It enables position-aware operations, meaning extraction, and validation of fixed-length heterogeneous arrays.

**Core Principle**: Tuples represent fixed-length sequences with positional meaning - semantic operations should understand what each position represents.

---

## Interface

```typescript
interface SemanticTuple<T extends unknown[]> {
  /**
   * Create a SemanticTuple with optional position labels.
   *
   * @param values - Tuple values
   * @param labels - Optional labels for each position
   * @returns SemanticTuple instance
   *
   * @example
   * SemanticTuple.from([37.7749, -122.4194], ["latitude", "longitude"])
   * SemanticTuple.from(["John", 30, true], ["name", "age", "active"])
   */
  static from<T extends unknown[]>(
    values: T,
    labels?: string[]
  ): SemanticTuple<T>;

  /**
   * Check if two tuples are semantically equivalent.
   * Considers position meanings, not just values.
   *
   * @param other - Tuple to compare
   * @returns Equivalence result
   *
   * @example
   * SemanticTuple.from([lat, lng]).semanticallyEquals([lat, lng, alt])
   * // { equivalent: false, reason: "Different arity (2 vs 3)" }
   */
  semanticallyEquals(other: unknown[]): {
    equivalent: boolean;
    reason?: string;
    confidence: number;
  };

  /**
   * Infer the meaning of each position in the tuple.
   *
   * @param context - Optional context to improve inference
   * @returns Position meanings
   *
   * @example
   * SemanticTuple.from([37.7749, -122.4194]).inferPositionalMeaning()
   * // {
   * //   0: { meaning: "latitude", confidence: 0.9 },
   * //   1: { meaning: "longitude", confidence: 0.9 }
   * // }
   */
  inferPositionalMeaning(context?: string): Record<number, {
    meaning: string;
    confidence: number;
  }>;

  /**
   * Validate relationships between tuple elements.
   *
   * @param rules - Validation rules
   * @returns Validation result
   *
   * @example
   * SemanticTuple.from([start, end]).validateRelationship([
   *   "end should be after start"
   * ])
   * // { valid: true }
   */
  validateRelationship(rules: string[]): {
    valid: boolean;
    violations: string[];
  };

  /**
   * Detect what type of tuple this is (coordinate, range, RGB, etc.).
   *
   * @returns Detected tuple pattern
   *
   * @example
   * SemanticTuple.from([255, 128, 0]).detectPattern()
   * // { pattern: "RGB color", confidence: 0.95 }
   */
  detectPattern(): {
    pattern: string;
    confidence: number;
    suggestedType?: string;
  };

  /**
   * Convert tuple to a labeled object.
   *
   * @param labels - Optional custom labels (uses inferred if not provided)
   * @returns Object with labeled properties
   *
   * @example
   * SemanticTuple.from([37.7749, -122.4194]).toObject()
   * // { latitude: 37.7749, longitude: -122.4194 }
   */
  toObject(labels?: string[]): Record<string, unknown>;

  /**
   * Access an element by semantic label instead of index.
   *
   * @param label - Semantic label for the position
   * @returns Value at that position
   *
   * @example
   * coords.getByLabel("latitude") // 37.7749
   */
  getByLabel(label: string): T[number] | undefined;

  /**
   * Validate that the tuple matches expected structure.
   *
   * @param expectedTypes - Expected type for each position
   * @returns Validation result
   *
   * @example
   * tuple.validateStructure(["string", "number", "boolean"])
   * // { valid: true }
   */
  validateStructure(expectedTypes: string[]): {
    valid: boolean;
    issues: Array<{ position: number; expected: string; actual: string }>;
  };

  /**
   * Explain what this tuple represents.
   *
   * @returns Human-readable explanation
   *
   * @example
   * SemanticTuple.from([200, "OK"]).explain()
   * // "HTTP status response: status code 200 with message 'OK'"
   */
  explain(): string;

  /**
   * Get the tuple values as an array.
   *
   * @returns The tuple values
   */
  valueOf(): T;

  /**
   * Get the length of the tuple.
   *
   * @returns Number of elements
   */
  length: number;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; reason?: string; confidence: number }` | `SemanticEqualsResultWithReason` |
| `detectPattern()` | `{ pattern: string; confidence: number; suggestedType?: string }` | `DetectPatternResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResultWithReason,
  DetectPatternResult
} from '../../shared/types.ts';
```
