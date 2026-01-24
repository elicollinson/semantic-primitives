# SemanticURL

## Overview

The `SemanticURL` type extends the native JavaScript URL with LLM-powered semantic understanding. It enables intelligent URL parsing, validation, and classification based on context and purpose.

**Core Principle**: URLs represent web addresses with intent - semantic operations should understand what URLs point to, their purpose, and how to validate them.

---

## Interface

```typescript
interface SemanticURL extends URL {
  /**
   * Create a SemanticURL from a string, handling various formats.
   *
   * @param input - URL string, potentially incomplete or malformed
   * @param base - Optional base URL
   * @returns SemanticURL instance
   *
   * @example
   * SemanticURL.from("example.com") // Adds https://
   * SemanticURL.from("/path", "https://example.com")
   */
  static from(input: string, base?: string): SemanticURL;

  /**
   * Check if two URLs are semantically equivalent.
   * Considers trailing slashes, default ports, www prefix, etc.
   *
   * @param other - URL to compare
   * @returns Equivalence result
   *
   * @example
   * SemanticURL.from("https://example.com").semanticallyEquals("https://www.example.com/")
   * // { equivalent: true, differences: ["www prefix", "trailing slash"] }
   */
  semanticallyEquals(other: string | URL): {
    equivalent: boolean;
    differences: string[];
    confidence: number;
  };

  /**
   * Classify the URL by type and purpose.
   *
   * @returns URL classification
   *
   * @example
   * url.classify()
   * // {
   * //   type: "api-endpoint",
   * //   category: "rest-api",
   * //   resource: "users",
   * //   action: "list"
   * // }
   */
  classify(): {
    type: string;
    category?: string;
    resource?: string;
    action?: string;
    confidence: number;
  };

  /**
   * Validate the URL for a specific purpose.
   *
   * @param purpose - Intended purpose of the URL
   * @returns Validation result
   *
   * @example
   * url.validateFor("public website")
   * // { valid: true, warnings: ["Uses HTTP instead of HTTPS"] }
   *
   * url.validateFor("API endpoint")
   * // { valid: false, reason: "Missing API path prefix" }
   */
  validateFor(purpose: string): {
    valid: boolean;
    reason?: string;
    warnings: string[];
  };

  /**
   * Explain what this URL points to.
   *
   * @returns Human-readable description
   *
   * @example
   * SemanticURL.from("https://api.github.com/users/octocat").explain()
   * // "GitHub API endpoint to fetch the user profile for 'octocat'"
   */
  explain(): string;

  /**
   * Extract semantic information from URL components.
   *
   * @returns Extracted information
   *
   * @example
   * url.extractInfo()
   * // {
   * //   service: "GitHub",
   * //   resourceType: "user-profile",
   * //   identifier: "octocat"
   * // }
   */
  extractInfo(): Record<string, string | undefined>;

  /**
   * Check if the URL is safe to visit/request.
   *
   * @returns Safety assessment
   *
   * @example
   * url.isSafe()
   * // { safe: false, reason: "Known phishing domain", severity: "high" }
   */
  isSafe(): {
    safe: boolean;
    reason?: string;
    severity?: "low" | "medium" | "high";
  };

  /**
   * Suggest the canonical form of this URL.
   *
   * @returns Canonical URL
   *
   * @example
   * SemanticURL.from("HTTP://EXAMPLE.COM:80/path/").canonical()
   * // "https://example.com/path"
   */
  canonical(): SemanticURL;

  /**
   * Generate variations of this URL.
   *
   * @returns URL variations
   *
   * @example
   * url.variations()
   * // ["https://example.com", "https://www.example.com", "http://example.com"]
   */
  variations(): string[];

  /**
   * Parse query parameters with semantic understanding.
   *
   * @returns Parsed parameters with meanings
   *
   * @example
   * SemanticURL.from("https://api.example.com/search?q=test&limit=10").parseQuery()
   * // { q: { value: "test", meaning: "search query" }, limit: { value: 10, meaning: "results limit" } }
   */
  parseQuery(): Record<string, { value: string; meaning: string }>;

  /**
   * Suggest related URLs based on patterns.
   *
   * @returns Related URLs
   *
   * @example
   * url.suggestRelated()
   * // [{ url: "/users/octocat/repos", reason: "User's repositories" }]
   */
  suggestRelated(): Array<{ url: string; reason: string }>;

  /**
   * Check if URL matches a pattern description.
   *
   * @param pattern - Pattern description
   * @returns Match result
   *
   * @example
   * url.matches("API endpoint")
   * url.matches("image URL")
   */
  matches(pattern: string): boolean;
}
```
