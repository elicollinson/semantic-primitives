/**
 * Mock utilities for SemanticBigInt testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR "from" METHOD
// =============================================================================

/** Mock response for parsing "1 trillion" */
export const mockFromTrillionResponse = {
  value: '1000000000000',
  confidence: 0.95,
};

/** Mock response for parsing "10^18" */
export const mockFromScientificResponse = {
  value: '1000000000000000000',
  confidence: 0.92,
};

/** Mock response for parsing "5.2e15" */
export const mockFromExponentResponse = {
  value: '5200000000000000',
  confidence: 0.90,
};

/** Mock response for parsing "five billion" */
export const mockFromWordsResponse = {
  value: '5000000000',
  confidence: 0.88,
};

/** Mock response for parsing "2.5M" */
export const mockFromAbbreviatedResponse = {
  value: '2500000',
  confidence: 0.85,
};

// =============================================================================
// MOCK RESPONSES FOR "semanticallyEquals" METHOD
// =============================================================================

/** Mock response for equivalent values */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 1.0,
};

/** Mock response for not equivalent values */
export const mockNotEquivalentResponse = {
  equivalent: false,
  confidence: 1.0,
};

/** Mock response for approximate equivalence */
export const mockApproximateEquivalentResponse = {
  equivalent: true,
  confidence: 0.92,
};

/** Mock response for approximate not equivalent */
export const mockApproximateNotEquivalentResponse = {
  equivalent: false,
  confidence: 0.88,
};

// =============================================================================
// MOCK RESPONSES FOR "isReasonable" METHOD
// =============================================================================

/** Mock response for reasonable database ID */
export const mockReasonableDatabaseIdResponse = {
  reasonable: true,
  explanation: 'Value is within typical database ID range and is positive',
};

/** Mock response for unreasonable database ID (negative) */
export const mockUnreasonableNegativeIdResponse = {
  reasonable: false,
  explanation: 'Database IDs are typically positive',
};

/** Mock response for reasonable timestamp */
export const mockReasonableTimestampResponse = {
  reasonable: true,
  explanation: 'Value represents a valid Unix timestamp in the expected range',
};

/** Mock response for unreasonable timestamp */
export const mockUnreasonableTimestampResponse = {
  reasonable: false,
  explanation: 'Value is outside the valid Unix timestamp range',
};

/** Mock response for reasonable cryptocurrency amount */
export const mockReasonableCryptoResponse = {
  reasonable: true,
  explanation: 'Amount is within valid cryptocurrency transaction range',
};

// =============================================================================
// MOCK RESPONSES FOR "format" METHOD
// =============================================================================

/** Mock response for words format */
export const mockFormatWordsResponse = {
  formatted: '1.23 trillion',
};

/** Mock response for compact format */
export const mockFormatCompactResponse = {
  formatted: '1.23T',
};

/** Mock response for scientific format */
export const mockFormatScientificResponse = {
  formatted: '1.23 × 10^12',
};

/** Mock response for full format */
export const mockFormatFullResponse = {
  formatted: '1,234,567,890,123',
};

// =============================================================================
// MOCK RESPONSES FOR "describe" METHOD
// =============================================================================

/** Mock response for population context */
export const mockDescribePopulationResponse = {
  description: 'about 7.9 billion (roughly the world population)',
};

/** Mock response for generic large number */
export const mockDescribeGenericResponse = {
  description: 'approximately 1 trillion, about the GDP of a medium-sized country',
};

/** Mock response for timestamp description */
export const mockDescribeTimestampResponse = {
  description: 'a timestamp representing January 1, 2021 00:00:00 UTC',
};

// =============================================================================
// MOCK RESPONSES FOR "inferDomain" METHOD
// =============================================================================

/** Mock response for timestamp milliseconds */
export const mockInferDomainTimestampMsResponse = {
  domain: 'unix-timestamp-ms',
  confidence: 0.87,
};

/** Mock response for database ID */
export const mockInferDomainDatabaseIdResponse = {
  domain: 'database-id',
  confidence: 0.75,
};

/** Mock response for cryptocurrency amount */
export const mockInferDomainCryptoResponse = {
  domain: 'cryptocurrency-amount',
  confidence: 0.82,
};

/** Mock response for arbitrary precision */
export const mockInferDomainArbitraryResponse = {
  domain: 'arbitrary-precision',
  confidence: 0.60,
};

// =============================================================================
// MOCK RESPONSES FOR "matches" METHOD
// =============================================================================

/** Mock response for power-of-two match */
export const mockMatchesPowerOfTwoResponse = {
  matches: true,
  confidence: 1.0,
};

/** Mock response for prime match */
export const mockMatchesPrimeResponse = {
  matches: true,
  confidence: 0.95,
};

/** Mock response for not prime */
export const mockMatchesNotPrimeResponse = {
  matches: false,
  confidence: 0.98,
};

/** Mock response for fibonacci match */
export const mockMatchesFibonacciResponse = {
  matches: true,
  confidence: 0.90,
};

/** Mock response for factorial match */
export const mockMatchesFactorialResponse = {
  matches: true,
  confidence: 0.88,
};

/** Mock response for no match */
export const mockMatchesNoMatchResponse = {
  matches: false,
  confidence: 0.92,
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object): LLMClient {
  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.resolve({
        content: JSON.stringify(responseContent),
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(responses: object[]): LLMClient {
  let callIndex = 0;

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      return Promise.resolve({
        content: JSON.stringify(response),
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that selects response based on prompt content
 */
export function createPromptBasedMockLLMClient(
  responseMap: Record<string, object>
): LLMClient {
  const mockComplete = mock(
    (options: CompletionOptions): Promise<LLMResponse> => {
      const prompt = options.prompt;
      for (const [key, response] of Object.entries(responseMap)) {
        if (prompt.includes(key)) {
          return Promise.resolve({
            content: JSON.stringify(response),
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          });
        }
      }
      // Default response if no match
      return Promise.resolve({
        content: JSON.stringify({ error: 'No matching response' }),
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}
