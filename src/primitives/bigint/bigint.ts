/**
 * SemanticBigInt
 * A BigInt type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<bigint> - Base semantic wrapper
 * - Comparable<bigint | SemanticBigInt> - Semantic equality comparison
 * - ContextValidatable - Domain-specific validation
 * - Describable - Human-readable descriptions
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResult,
  ReasonableResult,
  InferDomainResult,
} from '../../shared/types.ts';
import type {
  Semantic,
  Comparable,
  ContextValidatable,
  Describable,
} from '../../shared/interfaces.ts';
import {
  BIGINT_SYSTEM_PROMPT,
  createFromPrompt,
  createSemanticallyEqualsPrompt,
  createIsReasonablePrompt,
  createFormatPrompt,
  createDescribePrompt,
  createInferDomainPrompt,
  createMatchesPatternPrompt,
} from './prompts.ts';

export type { SemanticEqualsResult, ReasonableResult, InferDomainResult } from '../../shared/types.ts';

/** Format style options for BigInt display */
export type FormatStyle = 'words' | 'compact' | 'scientific' | 'full';

/** Options for formatting BigInt values */
export interface FormatOptions {
  style?: FormatStyle;
  locale?: string;
}

/** Result of scale/magnitude analysis */
export interface ScaleResult {
  magnitude: number;
  name: string;
  scientificNotation: string;
}

/** Common mathematical patterns */
export type MatchPattern =
  | 'power-of-two'
  | 'prime'
  | 'perfect-square'
  | 'factorial'
  | 'fibonacci'
  | 'even'
  | 'odd';

/** Scale names by magnitude */
const SCALE_NAMES: Record<number, string> = {
  0: 'ones',
  3: 'thousand',
  6: 'million',
  9: 'billion',
  12: 'trillion',
  15: 'quadrillion',
  18: 'quintillion',
  21: 'sextillion',
  24: 'septillion',
};

/**
 * SemanticBigInt - BigInt with LLM-powered semantic understanding
 *
 * Unlike traditional BigInts that are just large integers,
 * semantic BigInts can interpret natural language, understand domain context,
 * and provide human-readable representations.
 */
export class SemanticBigInt
  implements
    Semantic<bigint>,
    Comparable<bigint | SemanticBigInt>,
    ContextValidatable,
    Describable
{
  private readonly _value: bigint;
  private readonly client: LLMClient;

  private constructor(value: bigint, client?: LLMClient) {
    this._value = value;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticBigInt from a raw bigint value
   */
  static fromBigInt(value: bigint, client?: LLMClient): SemanticBigInt {
    return new SemanticBigInt(value, client);
  }

  /**
   * Create a SemanticBigInt from a number
   */
  static fromNumber(value: number, client?: LLMClient): SemanticBigInt {
    return new SemanticBigInt(BigInt(Math.trunc(value)), client);
  }

  /**
   * Parse a BigInt from natural language or formatted string.
   * Understands scientific notation, word forms, and abbreviations.
   *
   * @param input - Natural language or formatted BigInt string, number, or bigint
   * @param client - Optional LLM client to use
   * @returns Promise resolving to SemanticBigInt instance
   *
   * @example
   * await SemanticBigInt.from("1 trillion") // 1000000000000n
   * await SemanticBigInt.from("10^18") // 1000000000000000000n
   * await SemanticBigInt.from("5.2e15") // 5200000000000000n
   */
  static async from(
    input: string | number | bigint,
    client?: LLMClient
  ): Promise<SemanticBigInt> {
    const llmClient = client ?? getClient();

    // Handle bigint directly
    if (typeof input === 'bigint') {
      return new SemanticBigInt(input, llmClient);
    }

    // Handle number directly
    if (typeof input === 'number') {
      return new SemanticBigInt(BigInt(Math.trunc(input)), llmClient);
    }

    // Try parsing as a simple bigint literal first
    const trimmed = input.trim();
    try {
      // Handle bigint literal with 'n' suffix
      if (trimmed.endsWith('n')) {
        return new SemanticBigInt(BigInt(trimmed.slice(0, -1)), llmClient);
      }
      // Try parsing as a plain integer string
      if (/^-?\d+$/.test(trimmed)) {
        return new SemanticBigInt(BigInt(trimmed), llmClient);
      }
    } catch {
      // Fall through to LLM parsing
    }

    // Use LLM for complex parsing
    const prompt = createFromPrompt(input);

    const response = await llmClient.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      value: string;
      confidence: number;
    };

    return new SemanticBigInt(BigInt(result.value), llmClient);
  }

  /**
   * Check if two BigInts are semantically equivalent.
   * Considers approximate values for very large numbers.
   *
   * @param other - BigInt to compare with
   * @param options - Comparison options
   * @returns Promise resolving to equivalence result with confidence
   *
   * @example
   * const trillion = await SemanticBigInt.from("1 trillion");
   * await trillion.semanticallyEquals(1000000000000n)
   * // { equivalent: true, confidence: 1.0 }
   */
  async semanticallyEquals(
    other: bigint | SemanticBigInt,
    options?: { tolerance?: 'exact' | 'approximate' }
  ): Promise<SemanticEqualsResult> {
    const otherValue = other instanceof SemanticBigInt ? other.valueOf() : other;
    const tolerance = options?.tolerance ?? 'exact';

    // For exact comparison, do it locally
    if (tolerance === 'exact') {
      return {
        equivalent: this._value === otherValue,
        confidence: 1.0,
      };
    }

    // For approximate comparison, use LLM
    const prompt = createSemanticallyEqualsPrompt(
      this._value.toString(),
      otherValue.toString(),
      tolerance
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Validate if the BigInt is reasonable for a given domain.
   *
   * @param domain - Domain context (e.g., "database-id", "cryptocurrency-amount")
   * @returns Promise resolving to validation result with explanation
   *
   * @example
   * const negative = SemanticBigInt.fromBigInt(-1n);
   * await negative.isReasonable("database-id")
   * // { reasonable: false, explanation: "Database IDs are typically positive" }
   */
  async isReasonable(domain: string): Promise<ReasonableResult> {
    const prompt = createIsReasonablePrompt(this._value.toString(), domain);

    const response = await this.client.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ReasonableResult;
  }

  /**
   * Format the BigInt in a human-readable way.
   *
   * @param options - Formatting options
   * @returns Promise resolving to formatted string
   *
   * @example
   * const big = SemanticBigInt.fromBigInt(1234567890123n);
   * await big.format({ style: "words" }) // "1.23 trillion"
   * await big.format({ style: "scientific" }) // "1.23 × 10^12"
   */
  async format(options?: FormatOptions): Promise<string> {
    const style = options?.style ?? 'words';

    // Handle simple cases locally for efficiency
    if (style === 'full') {
      return this.formatFull();
    }

    // Use LLM for more complex formatting
    const prompt = createFormatPrompt(
      this._value.toString(),
      style,
      options?.locale
    );

    const response = await this.client.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as { formatted: string };
    return result.formatted;
  }

  /**
   * Format with thousands separators (full style)
   */
  private formatFull(): string {
    const str = this._value.toString();
    const isNegative = str.startsWith('-');
    const digits = isNegative ? str.slice(1) : str;
    const parts: string[] = [];

    for (let i = digits.length; i > 0; i -= 3) {
      const start = Math.max(0, i - 3);
      parts.unshift(digits.slice(start, i));
    }

    return (isNegative ? '-' : '') + parts.join(',');
  }

  /**
   * Generate a human-readable explanation of this BigInt.
   * Implements Explainable interface.
   *
   * @param context - Optional context for more relevant explanation
   * @returns Promise resolving to human-readable explanation
   *
   * @example
   * const big = SemanticBigInt.fromBigInt(1000000000000n);
   * await big.explain() // "A 12-digit number in the trillions"
   */
  async explain(context?: string): Promise<string> {
    const scaleInfo = this.scale();
    const baseExplanation = `A ${scaleInfo.magnitude + 1}-digit number in the ${scaleInfo.name}s (${scaleInfo.scientificNotation})`;

    if (!context) {
      return baseExplanation;
    }

    // Use describe for context-aware explanation
    return this.describe(context);
  }

  /**
   * Get a human-friendly description of the magnitude.
   *
   * @param context - Optional context for more relevant comparison
   * @returns Promise resolving to human-readable description with relatable comparisons
   *
   * @example
   * const population = SemanticBigInt.fromBigInt(7900000000n);
   * await population.describe("population")
   * // "about 7.9 billion (roughly the world population)"
   */
  async describe(context?: string): Promise<string> {
    const prompt = createDescribePrompt(this._value.toString(), context);

    const response = await this.client.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as { description: string };
    return result.description;
  }

  /**
   * Infer what domain or type this BigInt likely represents.
   *
   * @returns Promise resolving to inferred domain with confidence
   *
   * @example
   * const timestamp = SemanticBigInt.fromBigInt(1609459200000n);
   * await timestamp.inferDomain()
   * // { domain: "unix-timestamp-ms", confidence: 0.87 }
   */
  async inferDomain(): Promise<InferDomainResult> {
    const prompt = createInferDomainPrompt(this._value.toString());

    const response = await this.client.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferDomainResult;
  }

  /**
   * Check if this BigInt matches common patterns.
   * Uses local computation for efficiency when possible.
   *
   * @param pattern - Pattern to check
   * @returns Promise resolving to whether the BigInt matches the pattern
   *
   * @example
   * const power = SemanticBigInt.fromBigInt(1024n);
   * await power.matches("power-of-two") // true
   * const prime = SemanticBigInt.fromBigInt(13n);
   * await prime.matches("prime") // true
   */
  async matches(pattern: string): Promise<boolean> {
    // Handle simple patterns locally
    switch (pattern) {
      case 'even':
        return this._value % 2n === 0n;
      case 'odd':
        return this._value % 2n !== 0n;
      case 'power-of-two':
        return this.isPowerOfTwo();
      case 'perfect-square':
        return this.isPerfectSquare();
      case 'prime':
        // For small primes, compute locally
        if (this._value <= 1000000n) {
          return this.isPrimeLocal();
        }
        // For larger primes, use LLM heuristics
        break;
      case 'fibonacci':
      case 'factorial':
        // These require LLM for large numbers
        break;
      default:
        // Unknown pattern, use LLM
        break;
    }

    // Use LLM for complex patterns
    const prompt = createMatchesPatternPrompt(this._value.toString(), pattern);

    const response = await this.client.complete({
      prompt,
      systemPrompt: BIGINT_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matches: boolean;
      confidence: number;
    };
    return result.matches;
  }

  /**
   * Check if value is a power of two (local computation)
   */
  private isPowerOfTwo(): boolean {
    return this._value > 0n && (this._value & (this._value - 1n)) === 0n;
  }

  /**
   * Check if value is a perfect square (local computation)
   */
  private isPerfectSquare(): boolean {
    if (this._value < 0n) return false;
    if (this._value === 0n) return true;

    // Newton's method for integer square root
    let x = this._value;
    let y = (x + 1n) / 2n;
    while (y < x) {
      x = y;
      y = (x + this._value / x) / 2n;
    }
    return x * x === this._value;
  }

  /**
   * Check if value is prime (local computation for small numbers)
   */
  private isPrimeLocal(): boolean {
    if (this._value <= 1n) return false;
    if (this._value <= 3n) return true;
    if (this._value % 2n === 0n || this._value % 3n === 0n) return false;

    let i = 5n;
    while (i * i <= this._value) {
      if (this._value % i === 0n || this._value % (i + 2n) === 0n) {
        return false;
      }
      i += 6n;
    }
    return true;
  }

  /**
   * Get the scale/order of magnitude.
   *
   * @returns Scale description with magnitude, name, and scientific notation
   *
   * @example
   * const trillion = SemanticBigInt.fromBigInt(1000000000000n);
   * trillion.scale()
   * // { magnitude: 12, name: "trillion", scientificNotation: "10^12" }
   */
  scale(): ScaleResult {
    const absValue = this._value < 0n ? -this._value : this._value;
    const str = absValue.toString();
    const magnitude = str.length - 1;

    // Find the appropriate scale name
    let scaleName = 'ones';
    for (const [mag, name] of Object.entries(SCALE_NAMES).sort(
      (a, b) => Number(b[0]) - Number(a[0])
    )) {
      if (magnitude >= Number(mag)) {
        scaleName = name;
        break;
      }
    }

    return {
      magnitude,
      name: scaleName,
      scientificNotation: `10^${magnitude}`,
    };
  }

  /**
   * Get the raw BigInt value.
   *
   * @returns The underlying BigInt
   */
  valueOf(): bigint {
    return this._value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { value: string; scale: ScaleResult } {
    return {
      value: this._value.toString(),
      scale: this.scale(),
    };
  }
}
