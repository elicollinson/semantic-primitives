/**
 * Semantic Primitives
 * LLM-enhanced primitive types with semantic understanding
 */

// SemanticBoolean
export {
  SemanticBoolean,
  type FromOptions,
  type SemanticEqualsResult,
  type BooleanCategory,
} from './boolean/index.ts';

// SemanticString
export {
  SemanticString,
  type SemanticEqualsResult as StringEqualsResult,
  type ClassifyResult,
  type ValidateResult,
  type DetectIntentResult,
  type DetectLanguageResult,
  type ContainsSensitiveResult,
  type Correction,
} from './string/index.ts';
