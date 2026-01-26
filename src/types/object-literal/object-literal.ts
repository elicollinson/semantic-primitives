/**
 * SemanticObjectLiteral
 * An object literal type with LLM-powered semantic understanding
 *
 * Implements shared interfaces:
 * - Semantic<T> - Base semantic wrapper
 * - Comparable<SemanticObjectLiteral<T>> - Semantic equality comparison
 * - SchemaInferable - Schema inference
 * - Summarizable - Content summarization
 * - SensitivityDetectable - Sensitive data detection
 * - KeyTransformable - Key naming convention transformation
 */

import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import type {
  SemanticEqualsResultWithMappings,
  InferSchemaResult,
  SensitiveResult,
} from '../../shared/types.ts';
import type { Semantic, Comparable, SchemaInferable, Summarizable, SensitivityDetectable, KeyTransformable } from '../../shared/interfaces.ts';
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

/** Result of validateWithRules operation */
export interface ValidateWithRulesResult {
  valid: boolean;
  violations: { rule: string; field?: string; reason: string }[];
}

/** Result of detectDomain operation */
export interface DetectDomainResult {
  domain: string;
  confidence: number;
  suggestedInterface?: string;
}

/** Result of findProperties operation */
export interface FindPropertiesResult {
  key: string;
  value: unknown;
  relevance: number;
}

/** Suggested missing property */
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
 * Unlike SemanticObject which focuses on general object operations,
 * SemanticObjectLiteral specializes in shape analysis, schema inference,
 * and intelligent property operations for ad-hoc object structures.
 *
 * @template T - The type of the underlying object literal
 */
export class SemanticObjectLiteral<T extends object = object>
  implements
    Semantic<T>,
    Comparable<SemanticObjectLiteral<T> | object, SemanticEqualsResultWithMappings>,
    SchemaInferable,
    Summarizable,
    SensitivityDetectable,
    KeyTransformable<Promise<SemanticObjectLiteral>>
{
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
   * @param obj - Object literal to wrap
   * @param context - Optional context about the object's purpose
   * @param client - Optional LLM client for dependency injection
   * @returns SemanticObjectLiteral instance
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
   * Returns a copy to prevent mutation.
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
   * @returns Inferred schema with name, properties, required/optional arrays
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

    const result = JSON.parse(response.content) as {
      name: string;
      properties: Record<string, string>;
      required: string[];
      optional: string[];
      confidence: number;
    };

    return {
      name: result.name,
      properties: result.properties,
      required: result.required,
      optional: result.optional,
      confidence: result.confidence,
    };
  }

  /**
   * Validate the object against semantic rules.
   *
   * @param rules - Natural language validation rules
   * @returns Validation result with violations
   */
  async validateWithRules(rules: string[]): Promise<ValidateWithRulesResult> {
    if (rules.length === 0) {
      return { valid: true, violations: [] };
    }

    const prompt = createValidateWithRulesPrompt(this.data, rules);

    const response = await this.client.complete({
      prompt,
      systemPrompt: OBJECT_LITERAL_SYSTEM_PROMPT,
      temperature: 0.1,
    });

    const result = JSON.parse(response.content) as {
      valid: boolean;
      violations: { rule: string; field: string | null; reason: string }[];
    };

    return {
      valid: result.valid,
      violations: result.violations.map((v) => ({
        rule: v.rule,
        field: v.field ?? undefined,
        reason: v.reason,
      })),
    };
  }

  /**
   * Detect what domain/entity this object represents.
   *
   * @returns Domain detection result
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
   */
  async findProperties(description: string): Promise<FindPropertiesResult[]> {
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
      matches: { key: string; value: unknown; relevance: number }[];
    };

    return result.matches;
  }

  /**
   * Suggest missing properties based on the object's apparent purpose.
   *
   * @returns Suggested properties with types and reasons
   */
  async suggestMissingProperties(): Promise<MissingPropertySuggestion[]> {
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
   */
  async isSensitive(propertyPath: string): Promise<SensitiveResult> {
    // Check if property exists by traversing the path
    const pathParts = propertyPath.split('.');
    let current: unknown = this.data;

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return { sensitive: false };
      }
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
   * @returns Transformed object
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
      keyMappings: Record<string, string>;
    };

    return SemanticObjectLiteral.from(result.transformed, this.context, this.client);
  }

  /**
   * Generate a TypeScript interface for this object.
   *
   * @param name - Interface name
   * @returns TypeScript interface code
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
      notes?: string[];
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

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

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
   * Convert to string representation
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
}
