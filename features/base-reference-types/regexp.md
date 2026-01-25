# SemanticRegExp

## Overview

The `SemanticRegExp` type extends the native JavaScript RegExp with LLM-powered semantic understanding. It enables natural language pattern creation, regex explanation, and intelligent pattern matching.

**Core Principle**: Regular expressions represent text patterns - semantic operations should help create, understand, and improve patterns using natural language.

---

## Interface

```typescript
interface SemanticRegExp extends RegExp {
  /**
   * Create a regex from natural language description.
   *
   * @param description - Natural language pattern description
   * @param options - Creation options
   * @returns SemanticRegExp instance
   *
   * @example
   * SemanticRegExp.from("email addresses")
   * SemanticRegExp.from("phone numbers in US format")
   * SemanticRegExp.from("URLs starting with https")
   */
  static from(
    description: string,
    options?: { flags?: string; strict?: boolean }
  ): SemanticRegExp;

  /**
   * Check if two regexes match the same patterns semantically.
   *
   * @param other - RegExp to compare
   * @param testStrings - Strings to test against
   * @returns Equivalence result
   *
   * @example
   * regex1.semanticallyEquals(regex2)
   * // { equivalent: true, confidence: 0.9 }
   */
  semanticallyEquals(
    other: RegExp,
    testStrings?: string[]
  ): { equivalent: boolean; confidence: number };

  /**
   * Explain what the regex matches in plain language.
   *
   * @returns Human-readable explanation
   *
   * @example
   * /^\d{3}-\d{4}$/.explain()
   * // "Matches a string starting with 3 digits, followed by a hyphen, and ending with 4 digits (e.g., phone number format)"
   */
  explain(): string;

  /**
   * Test a string and explain why it matched or didn't.
   *
   * @param input - String to test
   * @returns Match result with explanation
   *
   * @example
   * emailRegex.testWithExplanation("not-an-email")
   * // { matches: false, reason: "Missing @ symbol required for email format" }
   */
  testWithExplanation(input: string): {
    matches: boolean;
    reason: string;
    matchedPart?: string;
  };

  /**
   * Suggest improvements to the regex.
   *
   * @returns Suggested improvements
   *
   * @example
   * regex.suggestImprovements()
   * // [{ suggestion: "Add start/end anchors", reason: "Prevent partial matches" }]
   */
  suggestImprovements(): Array<{
    suggestion: string;
    reason: string;
    improved?: string;
  }>;

  /**
   * Generate test cases for the regex.
   *
   * @returns Test cases
   *
   * @example
   * emailRegex.generateTestCases()
   * // {
   * //   shouldMatch: ["test@example.com", "user.name@domain.org"],
   * //   shouldNotMatch: ["invalid", "@missing-local.com"]
   * // }
   */
  generateTestCases(): {
    shouldMatch: string[];
    shouldNotMatch: string[];
  };

  /**
   * Validate the regex for common issues.
   *
   * @returns Validation result
   *
   * @example
   * regex.validate()
   * // { valid: true, warnings: ["Regex may be slow due to nested quantifiers"] }
   */
  validate(): {
    valid: boolean;
    warnings: string[];
    issues: string[];
  };

  /**
   * Convert to a more readable format.
   *
   * @returns Readable regex string
   *
   * @example
   * /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.toReadable()
   * // "email: [local-part]@[domain].[tld]"
   */
  toReadable(): string;

  /**
   * Find similar patterns that might also be needed.
   *
   * @returns Related patterns
   *
   * @example
   * emailRegex.suggestRelated()
   * // [{ pattern: "phone number", reason: "Often collected with email" }]
   */
  suggestRelated(): Array<{ pattern: string; reason: string; regex?: string }>;

  /**
   * Detect what type of data this regex is designed to match.
   *
   * @returns Inferred data type
   *
   * @example
   * regex.inferDataType()
   * // { type: "email", confidence: 0.95 }
   */
  inferDataType(): { type: string; confidence: number };

  /**
   * Simplify the regex if possible.
   *
   * @returns Simplified version if applicable
   *
   * @example
   * /[0-9][0-9][0-9]/.simplify()
   * // /\d{3}/ with explanation "Use quantifier instead of repetition"
   */
  simplify(): { regex: SemanticRegExp; explanation: string } | null;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; confidence: number }` | `SemanticEqualsResult` |
| `suggestImprovements()` | `Array<{ suggestion: string; reason: string; improved?: string }>` | `ImprovementSuggestion[]` |
| `generateTestCases()` | `{ shouldMatch: string[]; shouldNotMatch: string[] }` | `RegExpTestCases` |
| `validate()` | `{ valid: boolean; warnings: string[]; issues: string[] }` | `ValidateResultWithWarnings` (extended) |
| `suggestRelated()` | `Array<{ pattern: string; reason: string; regex?: string }>` | `RelatedSuggestion[]` (extended) |
| `inferDataType()` | `{ type: string; confidence: number }` | `InferTypeResult` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  ImprovementSuggestion,
  RegExpTestCases,
  ValidateResultWithWarnings,
  RelatedSuggestion,
  InferTypeResult
} from '../../shared/types.ts';
```

---

## Implementation Notes

### Directory Structure

The implementation follows the library's standard structure:

```
src/types/regexp/
├── index.ts              # Re-exports public APIs
├── regexp.ts             # Main SemanticRegExp class
├── prompts.ts            # LLM prompt templates
└── __tests__/
    ├── regexp.test.ts    # Comprehensive test suite (40 tests)
    └── mocks.ts          # Mock LLM client utilities
```

### Factory Methods

The class provides three factory methods:

1. **`SemanticRegExp.from(description, options?, client?)`** - Creates regex from natural language using LLM (async)
2. **`SemanticRegExp.fromRegExp(regex, client?)`** - Wraps an existing RegExp (sync)
3. **`SemanticRegExp.fromPattern(pattern, flags?, client?)`** - Creates from pattern string (sync)

### Interface Implementation

The class implements the following shared interfaces:
- `Semantic<RegExp>` - Provides `valueOf()` for unwrapping
- `Explainable` - Provides `explain()` method
- `TypeInferable` - Provides `inferType()` method

Note: Some spec-defined method signatures differ from the shared interfaces (e.g., `semanticallyEquals` uses `testStrings?: string[]` instead of `options?: Record<string, unknown>`). These methods are implemented as specified but don't use the shared interface types to maintain API compatibility.

### Async vs Sync Methods

All LLM-powered methods are async and return Promises:
- `from()`, `semanticallyEquals()`, `explain()`, `testWithExplanation()`
- `suggestImprovements()`, `generateTestCases()`, `validate()`
- `toReadable()`, `suggestRelated()`, `inferDataType()`, `inferType()`, `simplify()`

Core RegExp operations are synchronous:
- `test()`, `exec()`, `valueOf()`, `toString()`
- `source` and `flags` getters

### Testing

Tests use mock LLM clients that return predefined responses. The mock utilities support:
- Single response mocking via `createMockLLMClient(response)`
- Sequential response mocking via `createSequentialMockLLMClient(responses[])`
- Error simulation via `createFailingMockLLMClient(error)`

### Exported Types

The module exports the following types:
- `SemanticRegExp` - Main class
- `FromOptions` - Options for `from()` method
- `TestWithExplanationResult` - Result of `testWithExplanation()`
- `SimplifyResult` - Result of `simplify()` (non-null case)
- Re-exports shared types: `SemanticEqualsResult`, `ImprovementSuggestion`, `RegExpTestCases`, `ValidateResultWithWarnings`, `RelatedSuggestion`, `InferTypeResult`
