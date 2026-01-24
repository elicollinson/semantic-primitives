/**
 * Shared types used across semantic primitives
 */

/** Result of semantic equality comparison */
export interface SemanticEqualsResult {
  equivalent: boolean;
  confidence: number;
}

/** Result of semantic validation */
export interface ValidateResult {
  valid: boolean;
  issues: string[];
}

/** Result of classification operations */
export interface ClassifyResult {
  category: string;
  confidence: number;
}

/** Result of type inference operations */
export interface InferTypeResult {
  type: string;
  confidence: number;
}
