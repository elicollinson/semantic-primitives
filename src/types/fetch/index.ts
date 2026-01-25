/**
 * SemanticFetch Module
 * LLM-enhanced Request, Response, and Headers types with semantic understanding
 */

// SemanticRequest
export {
  SemanticRequest,
  type RequestSemanticEqualsResult,
  type RequestFilter,
  type RequestIntentResult,
  type RequestSecurityResult,
  type RequestLLMClientInterface,
} from './request.ts';

// SemanticResponse
export {
  SemanticResponse,
  type ResponseAnalysisResult,
  type ResponseContract,
  type ErrorInterpretationResult,
  type ResponseLLMClientInterface,
} from './response.ts';

// SemanticHeaders
export {
  SemanticHeaders,
  type HeadersSemanticEqualsResult,
  type HeaderIssue,
  type HeadersValidateResult,
  type HeaderSuggestion,
  type HeadersLLMClientInterface,
} from './headers.ts';

// Re-export shared types used by this module
export type {
  SemanticEqualsResult,
  ValidateResult,
} from '../../shared/types.ts';
