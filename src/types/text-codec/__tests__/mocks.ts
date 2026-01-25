/**
 * Mock utilities for SemanticTextCodec testing
 */

import { mock } from 'bun:test';
import type { TextCodecLLMClientInterface } from '../text-codec.ts';
import type { Message } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES
// =============================================================================

/** Mock response for detectEncoding - UTF-8 */
export const mockDetectEncodingUtf8Response = {
  encoding: 'utf-8',
  confidence: 0.95,
  alternatives: ['windows-1252', 'iso-8859-1'],
};

/** Mock response for detectEncoding - Shift-JIS */
export const mockDetectEncodingShiftJisResponse = {
  encoding: 'shift-jis',
  confidence: 0.88,
  alternatives: ['euc-jp', 'utf-8'],
};

/** Mock response for repairMojibake - needs repair */
export const mockRepairMojibakeResponse = {
  repaired: 'été',
  corruptionPath: ['utf-8 -> windows-1252 -> utf-8'],
  confidence: 0.92,
};

/** Mock response for repairMojibake - no corruption */
export const mockRepairMojibakeNoCorruptionResponse = {
  repaired: 'Hello World',
  corruptionPath: [],
  confidence: 1.0,
};

/** Mock response for canEncode - can encode */
export const mockCanEncodeSuccessResponse = {
  canEncode: true,
  problematicChars: [],
  suggestedEncoding: undefined,
};

/** Mock response for canEncode - cannot encode */
export const mockCanEncodeFailureResponse = {
  canEncode: false,
  problematicChars: ['世', '界'],
  suggestedEncoding: 'utf-8',
};

/** Mock response for areEquivalent - equivalent */
export const mockAreEquivalentTrueResponse = {
  equivalent: true,
  note: 'Same text content, different encoding representations',
  confidence: 0.95,
};

/** Mock response for areEquivalent - not equivalent */
export const mockAreEquivalentFalseResponse = {
  equivalent: false,
  note: 'Different text content',
  confidence: 0.98,
};

/** Mock response for validateEncoding - valid */
export const mockValidateEncodingValidResponse = {
  valid: true,
  issues: [],
};

/** Mock response for validateEncoding - invalid */
export const mockValidateEncodingInvalidResponse = {
  valid: false,
  issues: [
    { position: 45, issue: 'Invalid UTF-8 sequence at position 45' },
    { position: 89, issue: 'Truncated multi-byte character' },
  ],
};

/** Mock response for suggestEncoding - UTF-8 */
export const mockSuggestEncodingUtf8Response = {
  encoding: 'utf-8',
  reason: 'Universal encoding that supports all characters in the text',
  alternatives: ['utf-16', 'windows-1252'],
};

/** Mock response for suggestEncoding - legacy */
export const mockSuggestEncodingLegacyResponse = {
  encoding: 'windows-1252',
  reason: 'Supports required characters with legacy compatibility',
  alternatives: ['iso-8859-1', 'utf-8'],
};

/** Mock response for explainError */
export const mockExplainErrorResponse = {
  explanation: 'The text appears to be Shift-JIS encoded but was decoded as UTF-8, causing the Japanese characters to appear as garbled text.',
  likelyCause: 'Encoding mismatch between source and decoder',
  solution: 'Re-decode the original bytes using Shift-JIS encoding instead of UTF-8.',
};

/** Mock response for decodeWithAnalysis - no issues */
export const mockDecodeWithAnalysisCleanResponse = {
  issues: [],
  needsRepair: false,
  suggestedFix: null,
};

/** Mock response for decodeWithAnalysis - has issues */
export const mockDecodeWithAnalysisIssuesResponse = {
  issues: ['Replacement character (U+FFFD) found at position 12', 'Possible mojibake detected'],
  needsRepair: true,
  suggestedFix: 'Try decoding with windows-1252 encoding',
};

/** Mock response for encodeWithAnalysis */
export const mockEncodeWithAnalysisResponse = {
  warnings: ['Text contains non-ASCII characters'],
  hasNonAscii: true,
  potentialIssues: [],
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object | string): TextCodecLLMClientInterface {
  const content = typeof responseContent === 'string'
    ? responseContent
    : JSON.stringify(responseContent);

  return {
    chat: mock((_options: { messages: Message[]; systemPrompt?: string }) => {
      return Promise.resolve({
        content,
      });
    }),
  };
}

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(
  responses: (object | string)[]
): TextCodecLLMClientInterface {
  let callIndex = 0;

  return {
    chat: mock((_options: { messages: Message[]; systemPrompt?: string }) => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      const content = typeof response === 'string'
        ? response
        : JSON.stringify(response);
      return Promise.resolve({
        content,
      });
    }),
  };
}

/**
 * Create a mock LLM client that returns responses based on keywords in the message
 */
export function createKeywordMockLLMClient(
  keywordResponses: Record<string, object | string>
): TextCodecLLMClientInterface {
  return {
    chat: mock((options: { messages: Message[]; systemPrompt?: string }) => {
      // Search for matching keyword in messages or system prompt
      for (const [keyword, response] of Object.entries(keywordResponses)) {
        const messageContent = options.messages.map((m) => m.content).join(' ');
        const fullContent = `${options.systemPrompt || ''} ${messageContent}`;

        if (fullContent.toLowerCase().includes(keyword.toLowerCase())) {
          const content = typeof response === 'string'
            ? response
            : JSON.stringify(response);
          return Promise.resolve({ content });
        }
      }

      // Default response
      return Promise.resolve({
        content: JSON.stringify({ error: 'No matching mock response found' }),
      });
    }),
  };
}

/**
 * Create a mock LLM client that fails with an error
 */
export function createFailingMockLLMClient(error: Error): TextCodecLLMClientInterface {
  return {
    chat: mock((_options: { messages: Message[]; systemPrompt?: string }) => {
      return Promise.reject(error);
    }),
  };
}
