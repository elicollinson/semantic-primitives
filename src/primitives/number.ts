/**
 * SemanticNumber - LLM-enhanced number type with semantic understanding
 *
 * Extends the native JavaScript number with semantic operations including:
 * - Natural language parsing
 * - Context-aware equality comparison
 * - Reasonableness validation
 * - Unit inference and conversion
 * - Pattern matching
 * - Outlier detection
 */

import { chat } from '../llm/index.ts';
import type { LLMConfig, Message } from '../llm/types.ts';
import {
  PARSE_NUMBER_SYSTEM,
  parseNumberPrompt,
  SEMANTIC_EQUALS_SYSTEM,
  semanticEqualsPrompt,
  IS_REASONABLE_SYSTEM,
  isReasonablePrompt,
  INFER_UNIT_SYSTEM,
  inferUnitPrompt,
  CONVERT_UNIT_SYSTEM,
  convertUnitPrompt,
  DESCRIBE_NUMBER_SYSTEM,
  describeNumberPrompt,
} from './number.prompts.ts';

/** Result of semantic equality comparison */
export interface SemanticEqualsResult {
  equivalent: boolean;
  confidence: number;
  reasoning?: string;
}

/** Result of reasonableness validation */
export interface ReasonableResult {
  reasonable: boolean;
  explanation: string;
}

/** Result of unit inference */
export interface InferUnitResult {
  unit: string;
  confidence: number;
  reasoning?: string;
}

/** Result of outlier detection */
export interface OutlierResult {
  isOutlier: boolean;
  severity?: 'mild' | 'moderate' | 'extreme';
  zscore?: number;
}

/** Options for semantic equality comparison */
export interface SemanticEqualsOptions {
  tolerance?: 'exact' | 'approximate' | number;
}

/** Options for formatting numbers */
export interface FormatOptions {
  style?: 'compact' | 'full' | 'percent' | 'currency';
  locale?: string;
  currency?: string;
}

/** LLM client interface for dependency injection */
export interface LLMClientInterface {
  chat(options: { messages: Message[]; systemPrompt?: string } & LLMConfig): Promise<{ content: string }>;
}

/**
 * SemanticNumber class
 * Wraps a numeric value with LLM-powered semantic operations
 */
export class SemanticNumber {
  private readonly _value: number;
  private readonly _llmClient: LLMClientInterface;
  private readonly _llmConfig?: LLMConfig;

  /**
   * Create a SemanticNumber instance
   * @param value - The numeric value to wrap
   * @param llmClient - Optional LLM client for dependency injection (useful for testing)
   * @param llmConfig - Optional LLM configuration
   */
  constructor(
    value: number,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ) {
    this._value = value;
    this._llmClient = llmClient || { chat };
    this._llmConfig = llmConfig;
  }

  /**
   * Parse a number from natural language or formatted string
   * Understands words, abbreviations, and localized formats
   *
   * @param input - Natural language or formatted number string
   * @param context - Optional context for interpretation
   * @param llmClient - Optional LLM client for dependency injection
   * @param llmConfig - Optional LLM configuration
   * @returns SemanticNumber instance
   *
   * @example
   * SemanticNumber.from("twenty-five") // 25
   * SemanticNumber.from("2.5k") // 2500
   * SemanticNumber.from("$1,234.56") // 1234.56
   * SemanticNumber.from("about a dozen") // 12
   */
  static async from(
    input: string,
    context?: string,
    llmClient?: LLMClientInterface,
    llmConfig?: LLMConfig
  ): Promise<SemanticNumber> {
    // Try to parse simple numeric formats first (no LLM needed)
    const simpleValue = SemanticNumber.parseSimple(input);
    if (simpleValue !== null) {
      return new SemanticNumber(simpleValue, llmClient, llmConfig);
    }

    // Use LLM for complex parsing
    const client = llmClient || { chat };
    const messages: Message[] = [
      { role: 'user', content: parseNumberPrompt(input, context) },
    ];

    const response = await client.chat({
      messages,
      systemPrompt: PARSE_NUMBER_SYSTEM,
      ...llmConfig,
    });

    const result = JSON.parse(response.content) as {
      value: number | null;
      confidence: number;
      interpretation: string;
    };

    if (result.value === null) {
      throw new Error(`Unable to parse "${input}" as a number: ${result.interpretation}`);
    }

    return new SemanticNumber(result.value, llmClient, llmConfig);
  }

  /**
   * Attempt to parse simple numeric formats without LLM
   * Handles common patterns like "2.5k", "$1,234.56", etc.
   */
  private static parseSimple(input: string): number | null {
    const trimmed = input.trim();

    // Try direct number parsing
    const direct = Number(trimmed);
    if (!isNaN(direct)) {
      return direct;
    }

    // Remove currency symbols and thousand separators
    const cleaned = trimmed
      .replace(/^\$/, '')
      .replace(/,/g, '');
    const cleanedNum = Number(cleaned);
    if (!isNaN(cleanedNum)) {
      return cleanedNum;
    }

    // Handle k/K suffix (thousands)
    const kRegex = /^([\d.]+)\s*[kK]$/;
    const kMatch = kRegex.exec(trimmed);
    if (kMatch?.[1]) {
      const num = Number(kMatch[1]);
      if (!isNaN(num)) return num * 1000;
    }

    // Handle m/M suffix (millions)
    const mRegex = /^([\d.]+)\s*[mM]$/;
    const mMatch = mRegex.exec(trimmed);
    if (mMatch?.[1]) {
      const num = Number(mMatch[1]);
      if (!isNaN(num)) return num * 1_000_000;
    }

    // Handle b/B suffix (billions)
    const bRegex = /^([\d.]+)\s*[bB]$/;
    const bMatch = bRegex.exec(trimmed);
    if (bMatch?.[1]) {
      const num = Number(bMatch[1]);
      if (!isNaN(num)) return num * 1_000_000_000;
    }

    return null;
  }

  /**
   * Check if two numbers are semantically equivalent
   * Considers approximate values and contextual equivalence
   *
   * @param other - Number to compare with
   * @param options - Comparison options including tolerance
   * @returns Equivalence result with confidence
   *
   * @example
   * SemanticNumber.from(100).semanticallyEquals(99, { tolerance: "approximate" })
   * // { equivalent: true, confidence: 0.95 }
   */
  async semanticallyEquals(
    other: number | SemanticNumber,
    options?: SemanticEqualsOptions
  ): Promise<SemanticEqualsResult> {
    const otherValue = other instanceof SemanticNumber ? other.valueOf() : other;
    const tolerance = options?.tolerance ?? 'exact';

    // Handle exact tolerance without LLM
    if (tolerance === 'exact') {
      const equivalent = this._value === otherValue;
      return {
        equivalent,
        confidence: 1.0,
        reasoning: equivalent ? 'Exact numeric match' : 'Values are not exactly equal',
      };
    }

    // Handle numeric tolerance without LLM
    if (typeof tolerance === 'number') {
      const diff = Math.abs(this._value - otherValue);
      const equivalent = diff <= tolerance;
      return {
        equivalent,
        confidence: equivalent ? 1.0 : 0.0,
        reasoning: `Difference of ${diff} is ${equivalent ? 'within' : 'outside'} tolerance of ${tolerance}`,
      };
    }

    // Use LLM for semantic comparison
    const messages: Message[] = [
      { role: 'user', content: semanticEqualsPrompt(this._value, otherValue, tolerance) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: SEMANTIC_EQUALS_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as SemanticEqualsResult;
  }

  /**
   * Validate if the number is reasonable for a given context
   *
   * @param context - What this number represents
   * @returns Validation result with explanation
   *
   * @example
   * SemanticNumber.from(150).isReasonable("human age")
   * // { reasonable: false, explanation: "Human age rarely exceeds 120 years" }
   */
  async isReasonable(context: string): Promise<ReasonableResult> {
    const messages: Message[] = [
      { role: 'user', content: isReasonablePrompt(this._value, context) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: IS_REASONABLE_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as ReasonableResult;
  }

  /**
   * Infer the likely unit for this number based on context
   *
   * @param context - Context describing what this number represents
   * @returns Inferred unit with confidence
   *
   * @example
   * SemanticNumber.from(72).inferUnit("body temperature")
   * // { unit: "fahrenheit", confidence: 0.85 }
   */
  async inferUnit(context: string): Promise<InferUnitResult> {
    const messages: Message[] = [
      { role: 'user', content: inferUnitPrompt(this._value, context) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: INFER_UNIT_SYSTEM,
      ...this._llmConfig,
    });

    return JSON.parse(response.content) as InferUnitResult;
  }

  /**
   * Convert to a different unit with semantic understanding
   *
   * @param toUnit - Target unit
   * @param fromUnit - Source unit (optional, can be inferred)
   * @returns Converted number
   *
   * @example
   * SemanticNumber.from(100).convert("celsius", "fahrenheit")
   * // SemanticNumber(37.78)
   */
  async convert(toUnit: string, fromUnit?: string): Promise<SemanticNumber> {
    // If fromUnit is not provided, we need to infer it
    const sourceUnit = fromUnit || 'unknown';

    const messages: Message[] = [
      { role: 'user', content: convertUnitPrompt(this._value, sourceUnit, toUnit) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: CONVERT_UNIT_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as {
      value: number;
      fromUnit: string;
      toUnit: string;
      formula: string;
    };

    return new SemanticNumber(result.value, this._llmClient, this._llmConfig);
  }

  /**
   * Format the number in a human-readable way based on context
   *
   * @param options - Formatting options
   * @returns Formatted string
   *
   * @example
   * SemanticNumber.from(1234567).format({ style: "compact" })
   * // "1.2M"
   */
  format(options?: FormatOptions): string {
    const style = options?.style ?? 'full';
    const locale = options?.locale ?? 'en-US';

    switch (style) {
      case 'compact':
        return new Intl.NumberFormat(locale, { notation: 'compact' }).format(this._value);
      case 'percent':
        return new Intl.NumberFormat(locale, { style: 'percent' }).format(this._value);
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: options?.currency ?? 'USD',
        }).format(this._value);
      case 'full':
      default:
        return new Intl.NumberFormat(locale).format(this._value);
    }
  }

  /**
   * Detect if this number is an outlier compared to a dataset
   *
   * @param dataset - Array of numbers to compare against
   * @returns Outlier detection result
   *
   * @example
   * SemanticNumber.from(1000).isOutlier([10, 12, 11, 13, 9])
   * // { isOutlier: true, severity: "extreme", zscore: 8.5 }
   */
  isOutlier(dataset: number[]): OutlierResult {
    if (dataset.length === 0) {
      return { isOutlier: false };
    }

    // Calculate mean
    const mean = dataset.reduce((sum, val) => sum + val, 0) / dataset.length;

    // Calculate standard deviation
    const squaredDiffs = dataset.map((val) => (val - mean) ** 2);
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / dataset.length;
    const stdDev = Math.sqrt(variance);

    // Handle edge case where all values are the same
    if (stdDev === 0) {
      const isOutlier = this._value !== mean;
      return {
        isOutlier,
        severity: isOutlier ? 'extreme' : undefined,
        zscore: isOutlier ? Infinity : 0,
      };
    }

    // Calculate z-score
    const zscore = Math.abs((this._value - mean) / stdDev);

    // Determine if outlier and severity
    if (zscore < 2) {
      return { isOutlier: false, zscore };
    }

    let severity: 'mild' | 'moderate' | 'extreme';
    if (zscore < 3) {
      severity = 'mild';
    } else if (zscore < 4) {
      severity = 'moderate';
    } else {
      severity = 'extreme';
    }

    return { isOutlier: true, severity, zscore };
  }

  /**
   * Get a human-friendly description of the number's magnitude
   *
   * @param context - Optional context for more relevant description
   * @returns Human-readable description
   *
   * @example
   * SemanticNumber.from(1000000).describe()
   * // "one million"
   */
  async describe(context?: string): Promise<string> {
    const messages: Message[] = [
      { role: 'user', content: describeNumberPrompt(this._value, context) },
    ];

    const response = await this._llmClient.chat({
      messages,
      systemPrompt: DESCRIBE_NUMBER_SYSTEM,
      ...this._llmConfig,
    });

    const result = JSON.parse(response.content) as {
      description: string;
      magnitude: string;
    };

    return result.description;
  }

  /**
   * Check if the number matches a common pattern or category
   *
   * @param pattern - Pattern to check (e.g., "even", "prime", "power-of-two")
   * @returns Whether the number matches the pattern
   *
   * @example
   * SemanticNumber.from(16).matches("power-of-two") // true
   * SemanticNumber.from(7).matches("prime") // true
   */
  matches(pattern: string): boolean {
    const value = this._value;
    const normalizedPattern = pattern.toLowerCase().replace(/[-_\s]/g, '');

    switch (normalizedPattern) {
      case 'even':
        return Number.isInteger(value) && value % 2 === 0;

      case 'odd':
        return Number.isInteger(value) && value % 2 !== 0;

      case 'prime':
        return this.isPrime();

      case 'poweroftwo':
        return value > 0 && Number.isInteger(value) && (value & (value - 1)) === 0;

      case 'positive':
        return value > 0;

      case 'negative':
        return value < 0;

      case 'zero':
        return value === 0;

      case 'integer':
        return Number.isInteger(value);

      case 'decimal':
      case 'float':
        return !Number.isInteger(value);

      case 'perfectsquare': {
        if (value < 0 || !Number.isInteger(value)) return false;
        const sqrt = Math.sqrt(value);
        return Number.isInteger(sqrt);
      }

      case 'fibonacci':
        return this.isFibonacci();

      default:
        throw new Error(`Unknown pattern: ${pattern}`);
    }
  }

  /**
   * Check if the value is a prime number
   */
  private isPrime(): boolean {
    const n = this._value;
    if (!Number.isInteger(n) || n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  /**
   * Check if the value is a Fibonacci number
   */
  private isFibonacci(): boolean {
    const n = this._value;
    if (!Number.isInteger(n) || n < 0) return false;

    // A number is Fibonacci if one of (5*n*n + 4) or (5*n*n - 4) is a perfect square
    const isPerfectSquare = (x: number): boolean => {
      const s = Math.sqrt(x);
      return s === Math.floor(s);
    };

    return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
  }

  /**
   * Get the raw numeric value
   * @returns The underlying number
   */
  valueOf(): number {
    return this._value;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return String(this._value);
  }

  /**
   * Convert to JSON
   */
  toJSON(): number {
    return this._value;
  }
}
