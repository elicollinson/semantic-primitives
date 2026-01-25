/**
 * SemanticTextCodec module exports
 *
 * Provides LLM-enhanced text encoding/decoding capabilities:
 * - SemanticTextEncoder: Enhanced TextEncoder with analysis
 * - SemanticTextDecoder: Enhanced TextDecoder with detection and repair
 * - SemanticTextCodec: Static utility methods for encoding operations
 */

// Main classes
export {
  SemanticTextEncoder,
  SemanticTextDecoder,
  SemanticTextCodec,
} from './text-codec.ts';

// Type exports
export type {
  TextCodecLLMClientInterface,
  EncodeWithAnalysisResult,
  CanEncodeResult,
  DetectEncodingResult,
  DecodeWithAnalysisResult,
  RepairMojibakeResult,
  AreEquivalentResult,
  TranscodeResult,
  EncodingIssue,
  ValidateEncodingResult,
  SuggestEncodingResult,
  ExplainErrorResult,
} from './text-codec.ts';

// Re-export shared types used by this module
export type { ConfidenceResult } from '../../shared/types.ts';
