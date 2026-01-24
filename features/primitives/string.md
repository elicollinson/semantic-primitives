# SemanticString

## Overview

The `SemanticString` type extends the native JavaScript string with LLM-powered semantic understanding. It enables meaning-aware comparisons, intelligent text classification, and context-aware validation beyond simple character matching.

**Core Principle**: Strings represent text with meaning - semantic operations should understand synonyms, intent, and context.

---

## Interface

```typescript
interface SemanticString {
  /**
   * Check if two strings are semantically equivalent (same meaning).
   * Understands synonyms, paraphrases, and different phrasings.
   *
   * @param other - String to compare with
   * @param options - Comparison options
   * @returns Equivalence result with confidence and explanation
   *
   * @example
   * SemanticString.from("purchase").semanticallyEquals("buy")
   * // { equivalent: true, confidence: 0.95 }
   *
   * SemanticString.from("The meeting is cancelled").semanticallyEquals("Meeting has been called off")
   * // { equivalent: true, confidence: 0.92 }
   */
  semanticallyEquals(
    other: string | SemanticString,
    options?: { threshold?: number; context?: string }
  ): { equivalent: boolean; confidence: number };

  /**
   * Classify the string into one of the provided categories.
   * Uses semantic understanding to match meaning, not just keywords.
   *
   * @param categories - Array of category names to classify into
   * @param context - Optional context to improve classification
   * @returns Best matching category with confidence
   *
   * @example
   * SemanticString.from("I can't log in to my account").classify(
   *   ["billing", "technical", "account", "general"]
   * )
   * // { category: "account", confidence: 0.89 }
   */
  classify(
    categories: string[],
    context?: string
  ): { category: string; confidence: number };

  /**
   * Extract specific types of information from the string.
   *
   * @param types - Types of entities to extract (e.g., "email", "date", "name")
   * @returns Object mapping types to extracted values
   *
   * @example
   * SemanticString.from("Contact John at john@example.com by Friday").extract(["email", "name", "date"])
   * // { email: "john@example.com", name: "John", date: "Friday" }
   */
  extract(types: string[]): Record<string, string | string[] | null>;

  /**
   * Validate the string against semantic rules (not just regex).
   *
   * @param rules - Natural language validation rules
   * @returns Validation result with issues if any
   *
   * @example
   * SemanticString.from("Buy now!!!").validate([
   *   "should be professional",
   *   "no excessive punctuation"
   * ])
   * // { valid: false, issues: ["excessive punctuation (!!!)"] }
   */
  validate(rules: string[]): { valid: boolean; issues: string[] };

  /**
   * Determine the likely intent or purpose of the string.
   *
   * @returns Intent classification with confidence
   *
   * @example
   * SemanticString.from("How do I reset my password?").detectIntent()
   * // { intent: "question", subtype: "how-to", topic: "password-reset", confidence: 0.94 }
   */
  detectIntent(): {
    intent: string;
    subtype?: string;
    topic?: string;
    confidence: number;
  };

  /**
   * Detect the language of the string.
   *
   * @returns Detected language code with confidence
   *
   * @example
   * SemanticString.from("Bonjour le monde").detectLanguage()
   * // { language: "fr", confidence: 0.98 }
   */
  detectLanguage(): { language: string; confidence: number };

  /**
   * Check if the string contains sensitive information (PII, secrets, etc.).
   *
   * @returns Detection result with types of sensitive data found
   *
   * @example
   * SemanticString.from("My SSN is 123-45-6789").containsSensitive()
   * // { hasSensitive: true, types: ["ssn"], positions: [10-21] }
   */
  containsSensitive(): {
    hasSensitive: boolean;
    types: string[];
  };

  /**
   * Get a semantic similarity score with another string (0-1).
   *
   * @param other - String to compare with
   * @returns Similarity score from 0 (unrelated) to 1 (identical meaning)
   *
   * @example
   * SemanticString.from("happy").similarity("joyful") // 0.85
   * SemanticString.from("happy").similarity("sad") // 0.15
   */
  similarity(other: string): number;

  /**
   * Summarize the string to a target length while preserving meaning.
   *
   * @param maxLength - Maximum character length for summary
   * @returns Summarized string
   *
   * @example
   * SemanticString.from("The quick brown fox jumps over the lazy dog. This is a common pangram used for testing.").summarize(50)
   * // "A pangram about a fox jumping over a lazy dog."
   */
  summarize(maxLength: number): string;

  /**
   * Suggest corrections for spelling, grammar, or style issues.
   *
   * @returns Array of suggested corrections
   *
   * @example
   * SemanticString.from("Their going to the store tommorow").suggestCorrections()
   * // [{ original: "Their", suggestion: "They're" }, { original: "tommorow", suggestion: "tomorrow" }]
   */
  suggestCorrections(): Array<{ original: string; suggestion: string; reason?: string }>;
}
```
