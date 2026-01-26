/**
 * SemanticObjectLiteral
 * An object literal type with LLM-powered semantic understanding
 *
 * Implements shared interfaces for:
 * - Semantic equality comparison with property mappings
 * - Schema inference
 * - Domain detection
 * - Semantic property search
 * - Sensitive data detection
 * - Key transformation
 * - Interface generation
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  SensitiveResult,
} from '../../shared/types.ts';
import {
  OBJECT_LITERAL_SYSTEM_PROMPT,
  createSemanticallyEqualsPrompt,
  createInferSchemaPrompt,
  createValidateWithRulesPrompt,
  createDetectDomainPrompt,
  createFindPropertiesPrompt,
  createSuggestMissingPropertiesPrompt,
  createIsSensitivePrompt,
  createTransformKeysPrompt,
  createGenerateInterfacePrompt,
  createSummarizePrompt,
} from './prompts.ts';

export type {
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  SensitiveResult,
} from '../../shared/types.ts';

/** Result of validation against semantic rules */
export interface ObjectLiteralValidateResult {
  valid: boolean;
  violations: { rule: string; field?: string; reason: string }[];
}

/** Result of domain detection */
export interface DetectDomainResult {
  domain: string;
  confidence: number;
  suggestedInterface?: string;
}

/** Result of property search */
export interface PropertySearchResult {
  key: string;
  value: unknown;
  relevance: number;
}

/** Suggestion for missing property */
export interface MissingPropertySuggestion {
  property: string;
  type: string;
  reason: string;
}

/** Key naming conventions */
export type KeyConvention = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';

/**
 * SemanticObjectLiteral - Object literal with LLM-powered semantic understanding
 *
 * Unlike SemanticObject which wraps general objects, SemanticObjectLiteral
 * focuses on ad-hoc data shapes with schema inference and domain detection.
 *
 * @template T - The type of the underlying object
 */
export class SemanticObjectLiteral<T extends object = object> {
  private readonly data: T;
  private readonly context?: string;
  private readonly client: LLMClient;

  private constructor(data: T, context?: string, client?: LLMClient) {
    this.data = { ...data };
    this.context = context;
    this.client = client ?? getClient();
  }

  /**
   * Create a SemanticObjectLiteral from a plain object.
   *
   * @param obj - Object literal
   * @param context - Optional context about the object's purpose
   * @returns SemanticObjectLiteral instance
   *
   * @example
   * SemanticObjectLiteral.from({ name: "John", age: 30 }, "user data")
   */
  static from<T extends object>(
    obj: T,
    context?: string,
    client?: LLMClient
  ): SemanticObjectLiteral<T> {
    return new SemanticObjectLiteral(obj, context, client);
  }

  /**
   * Get the underlying object value.
   *
   * @returns Plain object
   */
  valueOf(): T {
    return { ...this.data };
  }

  /**
   * Check if two object literals are semantically equivalent.
   * Handles property name synonyms and structural variations.
   *
   * @param other - Object to compare
   * @returns Equivalence result with property mappings
   *
   * @example
   * obj1.semanticallyEquals({ firstName: "John" })
   * // { equivalent: true, mappings: { "name": "firstName" }, confidence: 0.9 }
   */
  async semanticallyEquals(
    other: SemanticObjectLiteral<T> | object
  ): Promise<SemanticEqualsResultWithMappings> {
    const otherObj = other instanceof SemanticObjectLiteral ? other.valueOf() : other;

    // Handle empty objects
    const thisKeys = Object.keys(this.data);
    const otherKeys = Object.keys(otherObj);
    if (thisKeys.length === 0 && otherKeys.length === 0) {
      return { equivalent: true, mappings: {}, confidence: 1.0 };
    }

    const prompt = createSemanticallyEqualsPrompt(this.data, otherObj);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as SemanticEqualsResultWithMappings;
  }

  /**
   * Infer the schema/type of this object.
   *
   * @returns Inferred schema with name, properties, required/optional fields
   *
   * @example
   * obj.inferSchema()
   * // {
   * //   name: "User",
   * //   properties: { name: "string", age: "number" },
   * //   required: ["name"],
   * //   optional: ["age"],
   * //   confidence: 0.92
   * // }
   */
  async inferSchema(): Promise<InferSchemaResult> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return {
        name: 'Empty',
        properties: {},
        required: [],
        optional: [],
        confidence: 1.0,
      };
    }

    const prompt = createInferSchemaPrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as InferSchemaResult;
  }

  /**
   * Validate the object against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result with violations
   *
   * @example
   * user.validateWithRules([
   *   "email must be valid",
   *   "age must be reasonable for a human"
   * ])
   */
  async validateWithRules(rules: string[]): Promise<ObjectLiteralValidateResult> {
    if (rules.length === 0) {
      return { valid: true, violations: [] };
    }

    const prompt = createValidateWithRulesPrompt(this.data, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    return JSON.parse(response.content) as ObjectLiteralValidateResult;
  }

  /**
   * Detect what domain/entity this object represents.
   *
   * @returns Domain detection result
   *
   * @example
   * obj.detectDomain()
   * // { domain: "user-profile", confidence: 0.92, suggestedInterface: "interface User { ... }" }
   */
  async detectDomain(): Promise<DetectDomainResult> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return { domain: 'empty', confidence: 1.0 };
    }

    const prompt = createDetectDomainPrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      domain: string;
      confidence: number;
      suggestedInterface: string | null;
    };

    return {
      domain: result.domain,
      confidence: result.confidence,
      suggestedInterface: result.suggestedInterface ?? undefined,
    };
  }

  /**
   * Find properties matching a semantic description.
   *
   * @param description - What to look for
   * @returns Matching properties with relevance scores
   *
   * @example
   * obj.findProperties("contact information")
   * // [{ key: "email", value: "...", relevance: 0.95 }]
   */
  async findProperties(description: string): Promise<PropertySearchResult[]> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return [];
    }

    const prompt = createFindPropertiesPrompt(this.data, description);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      matches: PropertySearchResult[];
    };

    return result.matches;
  }

  /**
   * Suggest missing properties based on the object's apparent purpose.
   *
   * @returns Suggested properties
   *
   * @example
   * user.suggestMissingProperties()
   * // [{ property: "createdAt", type: "Date", reason: "Common in user records" }]
   */
  async suggestMissingProperties(): Promise<MissingPropertySuggestion[]> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return [];
    }

    const prompt = createSuggestMissingPropertiesPrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      suggestions: MissingPropertySuggestion[];
    };

    return result.suggestions;
  }

  /**
   * Check if a property contains sensitive data.
   *
   * @param propertyPath - Property to check
   * @returns Sensitivity assessment
   *
   * @example
   * obj.isSensitive("ssn")
   * // { sensitive: true, type: "PII", recommendation: "encrypt" }
   */
  async isSensitive(propertyPath: string): Promise<SensitiveResult> {
    // Check if property exists (supports dot notation for nested paths)
    const value = this.getNestedValue(propertyPath);
    if (value === undefined) {
      return { sensitive: false };
    }

    const prompt = createIsSensitivePrompt(this.data, propertyPath);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      sensitive: boolean;
      type: string | null;
      recommendation: string | null;
    };

    return {
      sensitive: result.sensitive,
      type: result.type ?? undefined,
      recommendation: result.recommendation ?? undefined,
    };
  }

  /**
   * Transform property names to a naming convention.
   *
   * @param convention - Target convention
   * @returns Transformed object literal
   *
   * @example
   * obj.transformKeys("snake_case")
   */
  async transformKeys(
    convention: KeyConvention
  ): Promise<SemanticObjectLiteral> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return SemanticObjectLiteral.from({}, this.context, this.client);
    }

    const prompt = createTransformKeysPrompt(this.data, convention);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      transformed: object;
    };

    return SemanticObjectLiteral.from(result.transformed, this.context, this.client);
  }

  /**
   * Generate a TypeScript interface for this object.
   *
   * @param name - Interface name
   * @returns TypeScript interface code
   *
   * @example
   * obj.generateInterface("User")
   * // "interface User { name: string; age?: number; }"
   */
  async generateInterface(name: string): Promise<string> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return `interface ${name} {}`;
    }

    const prompt = createGenerateInterfacePrompt(this.data, name);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      interface: string;
    };

    return result.interface;
  }

  /**
   * Summarize the object contents.
   *
   * @returns Human-readable summary
   */
  async summarize(): Promise<string> {
    const keys = Object.keys(this.data);
    if (keys.length === 0) {
      return 'Empty object with no properties.';
    }

    const prompt = createSummarizePrompt(this.data);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    const result = JSON.parse(response.content) as {
      summary: string;
    };

    return result.summary;
  }

  /**
   * Get all keys of the object
   */
  keys(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Get all values of the object
   */
  values(): unknown[] {
    return Object.values(this.data);
  }

  /**
   * Get all entries of the object
   */
  entries(): [string, unknown][] {
    return Object.entries(this.data);
  }

  /**
   * Check if object has a property (exact match)
   */
  has(key: string): boolean {
    return key in this.data;
  }

  /**
   * Get a property value (exact match)
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  /**
   * Get the context string if provided
   */
  getContext(): string | undefined {
    return this.context;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return JSON.stringify(this.data);
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.valueOf();
  }

  /**
   * Helper to get nested value by dot-notation path
   */
  private getNestedValue(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}
