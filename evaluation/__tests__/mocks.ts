/**
 * Mock implementations for evaluation tests
 */

import { mock } from 'bun:test';

/**
 * Mock LLM client that returns predefined responses
 */
export function createMockLLMClient(responseContent: object) {
  return {
    complete: mock(() =>
      Promise.resolve({
        content: JSON.stringify(responseContent),
        provider: 'mock',
        model: 'mock-model',
      })
    ),
  };
}

/**
 * Mock LLM client that returns sequential responses
 */
export function createSequentialMockLLMClient(responses: object[]) {
  let callIndex = 0;
  return {
    complete: mock(() =>
      Promise.resolve({
        content: JSON.stringify(responses[callIndex++] || responses[responses.length - 1]),
        provider: 'mock',
        model: 'mock-model',
      })
    ),
  };
}

/**
 * Mock judge evaluation response
 */
export const mockJudgeEvaluation = {
  criteriaScores: {
    criterion_1: 0.9,
    criterion_2: 0.85,
  },
  score: 0.875,
  passed: true,
  reasoning: 'All criteria met successfully with high confidence.',
};

/**
 * Mock failed judge evaluation
 */
export const mockFailedJudgeEvaluation = {
  criteriaScores: {
    criterion_1: 0.3,
    criterion_2: 0.2,
  },
  score: 0.25,
  passed: false,
  reasoning: 'Failed to meet criteria. Output did not match expected behavior.',
};
