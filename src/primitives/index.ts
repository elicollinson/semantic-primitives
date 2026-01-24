/**
 * Semantic Primitives
 * LLM-enhanced primitive types with semantic understanding
 */

// Shared types
export { type SemanticEqualsResult } from '../shared/types.ts';

// SemanticNumber
export {
  SemanticNumber,
  type ReasonableResult,
  type InferUnitResult,
  type SemanticEqualsOptions,
  type LLMClientInterface,
} from './number/index.ts';

// SemanticBoolean
export { SemanticBoolean, type FromOptions, type BooleanCategory } from './boolean/index.ts';

// SemanticString
export {
  SemanticString,
  type ClassifyResult,
  type ValidateResult,
  type DetectIntentResult,
  type DetectLanguageResult,
  type ContainsSensitiveResult,
  type Correction,
} from './string/index.ts';

// SemanticSymbol
export {
  SemanticSymbol,
  type SymbolClassifyResult,
  type SemanticEqualsResultWithReason,
  type ValidateResultWithWarnings,
  type AppropriateResult,
  type Suggestion,
} from './symbol/index.ts';

// SemanticBigInt
export {
  SemanticBigInt,
  type FormatStyle,
  type FormatOptions,
  type ScaleResult,
  type MatchPattern,
  type InferDomainResult,
} from './bigint/index.ts';
