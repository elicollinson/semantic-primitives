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

// SemanticNull
export {
  SemanticNull,
  type NullType,
  type NullClassifyResult,
  type SuggestDefaultResult,
  type SchemaInfo,
  type AppropriateContext,
  type InferReasonResult,
  type AppropriateResult,
} from './null/index.ts';

// SemanticSymbol
export {
  SemanticSymbol,
  type SymbolClassifyResult,
  type SemanticEqualsResultWithReason,
  type ValidateResultWithWarnings,
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

// SemanticUndefined
export {
  SemanticUndefined,
  type UndefinedType,
  type UndefinedClassifyResult,
  type SuggestInitializationResult,
  type TypeHint,
  type AcceptableResult,
  type CompareToNullResult,
} from './undefined/index.ts';

// SemanticVoid
export {
  SemanticVoid,
  type VoidFunction,
  type AnalyzeSideEffectsResult,
  type ShouldReturnValueResult,
  type ValidateUsageResult,
  type CheckErrorHandlingResult,
  type SuggestSignatureResult,
} from './void/index.ts';
