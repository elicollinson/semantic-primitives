/**
 * Mock utilities for SemanticTuple testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent coordinate tuples */
export const mockCoordinatesEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
  reason: 'Both tuples represent geographic coordinates with matching latitude and longitude values',
};

/** Mock response for non-equivalent tuples (different arity) */
export const mockDifferentArityResponse = {
  equivalent: false,
  confidence: 0.98,
  reason: 'Different arity (2 vs 3): first tuple has 2 elements, second has 3 elements',
};

/** Mock response for non-equivalent tuples (different meaning) */
export const mockDifferentMeaningResponse = {
  equivalent: false,
  confidence: 0.92,
  reason: 'Tuples have different positional meanings: first is a coordinate pair, second is an RGB color',
};

/** Mock response for semantically equivalent tuples with different values */
export const mockSamePatternDifferentValuesResponse = {
  equivalent: false,
  confidence: 0.88,
  reason: 'Same pattern (both are coordinates) but different values',
};

// =============================================================================
// MOCK RESPONSES FOR INFER POSITIONAL MEANING
// =============================================================================

/** Mock response for coordinate tuple meaning */
export const mockCoordinateMeaningResponse = {
  positions: {
    '0': { meaning: 'latitude', confidence: 0.95 },
    '1': { meaning: 'longitude', confidence: 0.95 },
  },
  overallPattern: 'geographic coordinates',
};

/** Mock response for RGB color tuple meaning */
export const mockRGBMeaningResponse = {
  positions: {
    '0': { meaning: 'red channel (0-255)', confidence: 0.92 },
    '1': { meaning: 'green channel (0-255)', confidence: 0.92 },
    '2': { meaning: 'blue channel (0-255)', confidence: 0.92 },
  },
  overallPattern: 'RGB color',
};

/** Mock response for range tuple meaning */
export const mockRangeMeaningResponse = {
  positions: {
    '0': { meaning: 'start value', confidence: 0.88 },
    '1': { meaning: 'end value', confidence: 0.88 },
  },
  overallPattern: 'numeric range',
};

/** Mock response for HTTP status tuple meaning */
export const mockHTTPStatusMeaningResponse = {
  positions: {
    '0': { meaning: 'HTTP status code', confidence: 0.95 },
    '1': { meaning: 'status message', confidence: 0.95 },
  },
  overallPattern: 'HTTP status response',
};

/** Mock response for record tuple meaning */
export const mockRecordMeaningResponse = {
  positions: {
    '0': { meaning: 'name', confidence: 0.90 },
    '1': { meaning: 'age', confidence: 0.90 },
    '2': { meaning: 'active status', confidence: 0.85 },
  },
  overallPattern: 'user record',
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE RELATIONSHIP
// =============================================================================

/** Mock response for valid relationship */
export const mockValidRelationshipResponse = {
  valid: true,
  violations: [],
  confidence: 0.95,
};

/** Mock response for invalid relationship (end before start) */
export const mockInvalidRangeRelationshipResponse = {
  valid: false,
  violations: ['end value (5) is less than start value (10)'],
  confidence: 0.98,
};

/** Mock response for invalid RGB values */
export const mockInvalidRGBRelationshipResponse = {
  valid: false,
  violations: ['red channel value (300) exceeds maximum of 255'],
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR DETECT PATTERN
// =============================================================================

/** Mock response for coordinate pattern */
export const mockCoordinatePatternResponse = {
  pattern: 'coordinate',
  confidence: 0.95,
  suggestedType: '[latitude: number, longitude: number]',
};

/** Mock response for RGB pattern */
export const mockRGBPatternResponse = {
  pattern: 'RGB',
  confidence: 0.92,
  suggestedType: '[red: number, green: number, blue: number]',
};

/** Mock response for range pattern */
export const mockRangePatternResponse = {
  pattern: 'range',
  confidence: 0.88,
  suggestedType: '[start: number, end: number]',
};

/** Mock response for HTTP status pattern */
export const mockHTTPStatusPatternResponse = {
  pattern: 'httpStatus',
  confidence: 0.95,
  suggestedType: '[statusCode: number, message: string]',
};

/** Mock response for key-value pattern */
export const mockKeyValuePatternResponse = {
  pattern: 'keyValue',
  confidence: 0.85,
  suggestedType: '[key: string, value: unknown]',
};

/** Mock response for version pattern */
export const mockVersionPatternResponse = {
  pattern: 'version',
  confidence: 0.90,
  suggestedType: '[major: number, minor: number, patch: number]',
};

// =============================================================================
// MOCK RESPONSES FOR TO OBJECT
// =============================================================================

/** Mock response for coordinate to object */
export const mockCoordinateToObjectResponse = {
  labels: ['latitude', 'longitude'],
  object: { latitude: 37.7749, longitude: -122.4194 },
  confidence: 0.95,
};

/** Mock response for RGB to object */
export const mockRGBToObjectResponse = {
  labels: ['red', 'green', 'blue'],
  object: { red: 255, green: 128, blue: 0 },
  confidence: 0.92,
};

/** Mock response for HTTP status to object */
export const mockHTTPStatusToObjectResponse = {
  labels: ['statusCode', 'message'],
  object: { statusCode: 200, message: 'OK' },
  confidence: 0.95,
};

// =============================================================================
// MOCK RESPONSES FOR GET BY LABEL
// =============================================================================

/** Mock response for matching latitude */
export const mockGetLatitudeResponse = {
  index: 0,
  matchedLabel: 'latitude',
  confidence: 0.98,
};

/** Mock response for matching longitude with alias */
export const mockGetLngResponse = {
  index: 1,
  matchedLabel: 'longitude',
  confidence: 0.95,
};

/** Mock response for matching red channel */
export const mockGetRedResponse = {
  index: 0,
  matchedLabel: 'red',
  confidence: 0.95,
};

/** Mock response for not found */
export const mockGetNotFoundResponse = {
  index: null,
  matchedLabel: null,
  confidence: 0.1,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE STRUCTURE
// =============================================================================

/** Mock response for valid structure */
export const mockValidStructureResponse = {
  valid: true,
  issues: [],
  confidence: 0.98,
};

/** Mock response for invalid structure (type mismatch) */
export const mockInvalidStructureResponse = {
  valid: false,
  issues: [
    { position: 1, expected: 'string', actual: 'number' },
  ],
  confidence: 0.95,
};

/** Mock response for multiple structure issues */
export const mockMultipleStructureIssuesResponse = {
  valid: false,
  issues: [
    { position: 0, expected: 'number', actual: 'string' },
    { position: 2, expected: 'boolean', actual: 'string' },
  ],
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for coordinate explanation */
export const mockCoordinateExplanationResponse = {
  explanation: 'Geographic coordinates representing a location: latitude 37.7749 (north) and longitude -122.4194 (west), which corresponds to San Francisco, California.',
  confidence: 0.95,
};

/** Mock response for RGB explanation */
export const mockRGBExplanationResponse = {
  explanation: 'RGB color value with red: 255, green: 128, blue: 0, representing an orange color.',
  confidence: 0.92,
};

/** Mock response for HTTP status explanation */
export const mockHTTPStatusExplanationResponse = {
  explanation: 'HTTP status response: status code 200 with message "OK", indicating a successful request.',
  confidence: 0.98,
};

/** Mock response for range explanation */
export const mockRangeExplanationResponse = {
  explanation: 'Numeric range from 10 to 50, representing a bounded interval.',
  confidence: 0.88,
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.resolve({
      content: JSON.stringify(responseContent),
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
  });

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

  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      content: JSON.stringify(response),
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    });
  });

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
 * Create a mock LLM client that fails with an error
 */
export function createFailingMockLLMClient(error: Error): LLMClient {
  const mockComplete = mock((_options: CompletionOptions): Promise<LLMResponse> => {
    return Promise.reject(error);
  });

  return {
    complete: mockComplete,
    chat: mock(() => Promise.reject(error)),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}
