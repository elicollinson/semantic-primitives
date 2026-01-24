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
