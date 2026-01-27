/**
 * Mock utilities for SemanticTuple testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// MOCK RESPONSES FOR SEMANTIC EQUALS
// =============================================================================

/** Mock response for equivalent tuples */
export const mockEquivalentResponse = {
  equivalent: true,
  confidence: 0.92,
  reason: 'Tuples contain semantically equivalent elements at corresponding positions',
};

/** Mock response for non-equivalent tuples (different arity) */
export const mockDifferentArityResponse = {
  equivalent: false,
  confidence: 0.98,
  reason: 'Different arity (2 vs 3)',
};

/** Mock response for non-equivalent tuples (different values) */
export const mockDifferentValuesResponse = {
  equivalent: false,
  confidence: 0.85,
  reason: 'Elements at corresponding positions have different semantic meanings',
};

/** Mock response for coordinate equivalence */
export const mockCoordinateEquivalentResponse = {
  equivalent: true,
  confidence: 0.95,
  reason: 'Both tuples represent the same geographic coordinate',
};

// =============================================================================
// MOCK RESPONSES FOR INFER POSITIONAL MEANING
// =============================================================================

/** Mock response for coordinate tuple */
export const mockCoordinateMeaningResponse = {
  positions: {
    0: { meaning: 'latitude', confidence: 0.95 },
    1: { meaning: 'longitude', confidence: 0.95 },
  },
  overallConfidence: 0.95,
};

/** Mock response for 3D coordinate */
export const mock3DCoordinateMeaningResponse = {
  positions: {
    0: { meaning: 'x coordinate', confidence: 0.9 },
    1: { meaning: 'y coordinate', confidence: 0.9 },
    2: { meaning: 'z coordinate', confidence: 0.9 },
  },
  overallConfidence: 0.9,
};

/** Mock response for RGB tuple */
export const mockRGBMeaningResponse = {
  positions: {
    0: { meaning: 'red channel (0-255)', confidence: 0.95 },
    1: { meaning: 'green channel (0-255)', confidence: 0.95 },
    2: { meaning: 'blue channel (0-255)', confidence: 0.95 },
  },
  overallConfidence: 0.95,
};

/** Mock response for range tuple */
export const mockRangeMeaningResponse = {
  positions: {
    0: { meaning: 'start value', confidence: 0.92 },
    1: { meaning: 'end value', confidence: 0.92 },
  },
  overallConfidence: 0.92,
};

/** Mock response for HTTP status tuple */
export const mockHttpStatusMeaningResponse = {
  positions: {
    0: { meaning: 'HTTP status code', confidence: 0.98 },
    1: { meaning: 'HTTP status message', confidence: 0.98 },
  },
  overallConfidence: 0.98,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE RELATIONSHIP
// =============================================================================

/** Mock response for valid relationship */
export const mockValidRelationshipResponse = {
  valid: true,
  violations: [],
};

/** Mock response for invalid relationship - end before start */
export const mockInvalidEndBeforeStartResponse = {
  valid: false,
  violations: ['end value should be greater than start value'],
};

/** Mock response for invalid RGB range */
export const mockInvalidRGBRangeResponse = {
  valid: false,
  violations: ['red channel value exceeds maximum (255)'],
};

// =============================================================================
// MOCK RESPONSES FOR DETECT PATTERN
// =============================================================================

/** Mock response for RGB color pattern */
export const mockRGBPatternResponse = {
  pattern: 'RGB color',
  confidence: 0.95,
  suggestedType: 'Color',
};

/** Mock response for coordinate pattern */
export const mockCoordinatePatternResponse = {
  pattern: 'Geographic coordinate (latitude, longitude)',
  confidence: 0.92,
  suggestedType: 'GeoPoint',
};

/** Mock response for range pattern */
export const mockRangePatternResponse = {
  pattern: 'Numeric range (start, end)',
  confidence: 0.88,
  suggestedType: 'Range',
};

/** Mock response for HTTP status pattern */
export const mockHttpStatusPatternResponse = {
  pattern: 'HTTP status (code, message)',
  confidence: 0.96,
  suggestedType: 'HttpStatus',
};

/** Mock response for key-value pattern */
export const mockKeyValuePatternResponse = {
  pattern: 'Key-value pair',
  confidence: 0.85,
  suggestedType: 'Entry',
};

/** Mock response for version pattern */
export const mockVersionPatternResponse = {
  pattern: 'Semantic version (major, minor, patch)',
  confidence: 0.94,
  suggestedType: 'SemanticVersion',
};

// =============================================================================
// MOCK RESPONSES FOR TO OBJECT
// =============================================================================

/** Mock response for coordinate to object */
export const mockCoordinateToObjectResponse = {
  object: { latitude: 37.7749, longitude: -122.4194 },
  labelsUsed: ['latitude', 'longitude'],
  confidence: 0.95,
};

/** Mock response for RGB to object */
export const mockRGBToObjectResponse = {
  object: { red: 255, green: 128, blue: 0 },
  labelsUsed: ['red', 'green', 'blue'],
  confidence: 0.95,
};

/** Mock response for range to object */
export const mockRangeToObjectResponse = {
  object: { start: 0, end: 100 },
  labelsUsed: ['start', 'end'],
  confidence: 0.9,
};

// =============================================================================
// MOCK RESPONSES FOR GET BY LABEL
// =============================================================================

/** Mock response for matching latitude */
export const mockMatchLatitudeResponse = {
  matchedPosition: 0,
  confidence: 0.98,
};

/** Mock response for matching longitude */
export const mockMatchLongitudeResponse = {
  matchedPosition: 1,
  confidence: 0.98,
};

/** Mock response for no match */
export const mockNoMatchResponse = {
  matchedPosition: null,
  confidence: 0.95,
};

/** Mock response for matching by synonym (lat -> latitude) */
export const mockMatchSynonymResponse = {
  matchedPosition: 0,
  confidence: 0.92,
};

// =============================================================================
// MOCK RESPONSES FOR VALIDATE STRUCTURE
// =============================================================================

/** Mock response for valid structure */
export const mockValidStructureResponse = {
  valid: true,
  issues: [],
};

/** Mock response for invalid structure - type mismatch */
export const mockInvalidTypeResponse = {
  valid: false,
  issues: [{ position: 1, expected: 'number', actual: 'string' }],
};

/** Mock response for multiple structure issues */
export const mockMultipleIssuesResponse = {
  valid: false,
  issues: [
    { position: 0, expected: 'string', actual: 'number' },
    { position: 2, expected: 'boolean', actual: 'string' },
  ],
};

// =============================================================================
// MOCK RESPONSES FOR EXPLAIN
// =============================================================================

/** Mock response for coordinate explanation */
export const mockCoordinateExplanationResponse = {
  explanation:
    'Geographic coordinate representing a location in San Francisco, CA with latitude 37.7749°N and longitude 122.4194°W.',
  confidence: 0.94,
};

/** Mock response for HTTP status explanation */
export const mockHttpStatusExplanationResponse = {
  explanation: "HTTP status response: status code 200 with message 'OK', indicating a successful request.",
  confidence: 0.97,
};

/** Mock response for RGB explanation */
export const mockRGBExplanationResponse = {
  explanation:
    'RGB color value representing orange (255 red, 128 green, 0 blue). This is a warm, saturated color commonly used for highlights or warnings.',
  confidence: 0.93,
};

/** Mock response for range explanation */
export const mockRangeExplanationResponse = {
  explanation: 'Numeric range from 0 to 100, commonly used for percentages or progress indicators.',
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
