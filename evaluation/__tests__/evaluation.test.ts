/**
 * Unit tests for the LLM-as-Judge evaluation system
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import type {
  EvalDataset,
  EvalCase,
  EvalInput,
  NumericRange,
  ExpectedValue,
  JudgeEvaluation,
  EvalRunResult,
  EvalCaseResult,
  EvalConfig,
  Difficulty,
} from '../types.ts';
import { defaultConfig, classRegistry } from '../config.ts';
import { toJSON, generateCISummary } from '../reporter.ts';

// =============================================================================
// Helper functions extracted for testing without LLM dependencies
// =============================================================================

/**
 * Check if value is a NumericRange
 */
function isNumericRange(value: unknown): value is NumericRange {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    ('min' in obj || 'max' in obj || 'exact' in obj) &&
    (obj.min === undefined || typeof obj.min === 'number') &&
    (obj.max === undefined || typeof obj.max === 'number') &&
    (obj.exact === undefined || typeof obj.exact === 'number')
  );
}

/**
 * Check if a single value matches the expected value
 */
function matchesExpected(actual: unknown, expected: ExpectedValue): boolean {
  if (expected === null) return actual === null;
  if (expected === undefined) return actual === undefined;

  if (isNumericRange(expected)) {
    if (typeof actual !== 'number') return false;
    if (expected.exact !== undefined) {
      return Math.abs(actual - expected.exact) < 0.0001;
    }
    if (expected.min !== undefined && actual < expected.min) return false;
    if (expected.max !== undefined && actual > expected.max) return false;
    return true;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (actual.length !== expected.length) return false;
    return expected.every((exp, i) => matchesExpected(actual[i], exp));
  }

  if (typeof expected === 'object') {
    if (typeof actual !== 'object' || actual === null) return false;
    const actualObj = actual as Record<string, unknown>;
    const expectedObj = expected as Record<string, ExpectedValue>;
    return Object.entries(expectedObj).every(([key, value]) =>
      matchesExpected(actualObj[key], value)
    );
  }

  return actual === expected;
}

/**
 * Check if actual output structurally matches expected
 */
function checkStructuralMatch(
  actual: unknown,
  expected: Record<string, ExpectedValue>
): boolean {
  if (typeof actual !== 'object' || actual === null) {
    return false;
  }

  const actualObj = actual as Record<string, unknown>;

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actualObj[key];
    if (!matchesExpected(actualValue, expectedValue)) {
      return false;
    }
  }

  return true;
}

/**
 * Parse the judge's response into a structured evaluation
 */
function parseJudgeResponse(response: string): JudgeEvaluation {
  try {
    let jsonStr = response.trim();

    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.score !== 'number') {
      throw new Error('Missing or invalid score');
    }
    if (typeof parsed.passed !== 'boolean') {
      throw new Error('Missing or invalid passed field');
    }
    if (typeof parsed.reasoning !== 'string') {
      throw new Error('Missing or invalid reasoning');
    }
    if (
      typeof parsed.criteriaScores !== 'object' ||
      parsed.criteriaScores === null
    ) {
      throw new Error('Missing or invalid criteriaScores');
    }

    return {
      score: Math.max(0, Math.min(1, parsed.score)),
      passed: parsed.passed,
      reasoning: parsed.reasoning,
      criteriaScores: parsed.criteriaScores,
    };
  } catch (error) {
    return {
      score: 0,
      passed: false,
      reasoning: `Failed to parse judge response: ${error instanceof Error ? error.message : 'Unknown error'}. Raw response: ${response.slice(0, 500)}`,
      criteriaScores: {},
    };
  }
}

/**
 * Calculate consistency score across multiple outputs
 */
function calculateConsistency(outputs: unknown[]): number {
  if (outputs.length <= 1) return 1;

  const normalized = outputs.map((o) => JSON.stringify(o, null, 0));

  const counts = new Map<string, number>();
  for (const str of normalized) {
    counts.set(str, (counts.get(str) || 0) + 1);
  }

  const maxCount = Math.max(...counts.values());
  return maxCount / outputs.length;
}

/**
 * Calculate standard deviation of scores
 */
function calculateScoreStdDev(scores: number[]): number {
  if (scores.length <= 1) return 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;

  return Math.sqrt(avgSquaredDiff);
}

/**
 * Format expected values for judge prompt
 */
function formatExpected(expected: Record<string, ExpectedValue>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(expected)) {
    if (isNumericRange(value)) {
      if (value.exact !== undefined) {
        lines.push(`- ${key}: exactly ${value.exact}`);
      } else if (value.min !== undefined && value.max !== undefined) {
        lines.push(`- ${key}: between ${value.min} and ${value.max}`);
      } else if (value.min !== undefined) {
        lines.push(`- ${key}: at least ${value.min}`);
      } else if (value.max !== undefined) {
        lines.push(`- ${key}: at most ${value.max}`);
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Create judge prompt
 */
function createJudgePrompt(params: {
  description: string;
  input: EvalInput;
  expected: Record<string, ExpectedValue>;
  actual: unknown;
  criteria: string[];
}): string {
  const { description, input, expected, actual, criteria } = params;
  const expectedDescription = formatExpected(expected);

  return `Evaluate this semantic operation output.

## Test Case
Description: ${description}

## Input
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

## Expected Output
${expectedDescription}

## Actual Output
\`\`\`json
${JSON.stringify(actual, null, 2)}
\`\`\`

## Evaluation Criteria
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
}

// =============================================================================
// Type Validation Tests
// =============================================================================

describe('Type Definitions', () => {
  test('EvalCase has all required fields', () => {
    const validCase: EvalCase = {
      id: 'test-case-1',
      description: 'A test case',
      input: {
        value: 'test value',
        args: ['arg1'],
        options: { context: 'test' },
      },
      expected: {
        result: true,
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: ['Criterion 1', 'Criterion 2'],
      tags: ['tag1', 'tag2'],
      difficulty: 'medium',
    };

    expect(validCase.id).toBe('test-case-1');
    expect(validCase.input.value).toBe('test value');
    expect(validCase.criteria.length).toBe(2);
  });

  test('EvalDataset has all required fields', () => {
    const validDataset: EvalDataset = {
      name: 'Test.dataset',
      description: 'A test dataset',
      version: '1.0.0',
      targetClass: 'TestClass',
      targetMethod: 'testMethod',
      cases: [],
    };

    expect(validDataset.name).toBe('Test.dataset');
    expect(validDataset.targetClass).toBe('TestClass');
    expect(validDataset.cases).toEqual([]);
  });

  test('NumericRange supports all variants', () => {
    const exactRange: NumericRange = { exact: 0.5 };
    const minRange: NumericRange = { min: 0.5 };
    const maxRange: NumericRange = { max: 0.5 };
    const minMaxRange: NumericRange = { min: 0.3, max: 0.7 };

    expect(exactRange.exact).toBe(0.5);
    expect(minRange.min).toBe(0.5);
    expect(maxRange.max).toBe(0.5);
    expect(minMaxRange.min).toBe(0.3);
    expect(minMaxRange.max).toBe(0.7);
  });

  test('Difficulty type only allows valid values', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    expect(difficulties).toContain('easy');
    expect(difficulties).toContain('medium');
    expect(difficulties).toContain('hard');
  });
});

// =============================================================================
// Structural Match Tests
// =============================================================================

describe('checkStructuralMatch', () => {
  test('matches exact boolean values', () => {
    expect(checkStructuralMatch({ value: true }, { value: true })).toBe(true);
    expect(checkStructuralMatch({ value: false }, { value: false })).toBe(true);
    expect(checkStructuralMatch({ value: true }, { value: false })).toBe(false);
  });

  test('matches exact string values', () => {
    expect(checkStructuralMatch({ name: 'hello' }, { name: 'hello' })).toBe(true);
    expect(checkStructuralMatch({ name: 'hello' }, { name: 'world' })).toBe(false);
  });

  test('matches exact number values', () => {
    expect(checkStructuralMatch({ count: 42 }, { count: 42 })).toBe(true);
    expect(checkStructuralMatch({ count: 42 }, { count: 43 })).toBe(false);
  });

  test('matches numeric ranges with min only', () => {
    expect(
      checkStructuralMatch({ confidence: 0.8 }, { confidence: { min: 0.7 } })
    ).toBe(true);
    expect(
      checkStructuralMatch({ confidence: 0.6 }, { confidence: { min: 0.7 } })
    ).toBe(false);
  });

  test('matches numeric ranges with max only', () => {
    expect(
      checkStructuralMatch({ confidence: 0.5 }, { confidence: { max: 0.7 } })
    ).toBe(true);
    expect(
      checkStructuralMatch({ confidence: 0.9 }, { confidence: { max: 0.7 } })
    ).toBe(false);
  });

  test('matches numeric ranges with min and max', () => {
    expect(
      checkStructuralMatch(
        { confidence: 0.75 },
        { confidence: { min: 0.7, max: 0.9 } }
      )
    ).toBe(true);
    expect(
      checkStructuralMatch(
        { confidence: 0.5 },
        { confidence: { min: 0.7, max: 0.9 } }
      )
    ).toBe(false);
    expect(
      checkStructuralMatch(
        { confidence: 0.95 },
        { confidence: { min: 0.7, max: 0.9 } }
      )
    ).toBe(false);
  });

  test('matches numeric ranges with exact', () => {
    expect(
      checkStructuralMatch({ score: 0.5 }, { score: { exact: 0.5 } })
    ).toBe(true);
    expect(
      checkStructuralMatch({ score: 0.50001 }, { score: { exact: 0.5 } })
    ).toBe(true); // Within tolerance
    expect(
      checkStructuralMatch({ score: 0.6 }, { score: { exact: 0.5 } })
    ).toBe(false);
  });

  test('matches null values', () => {
    expect(checkStructuralMatch({ value: null }, { value: null })).toBe(true);
    expect(checkStructuralMatch({ value: 'test' }, { value: null })).toBe(false);
  });

  test('matches nested objects', () => {
    const actual = {
      result: {
        equivalent: true,
        confidence: 0.85,
      },
    };
    const expected = {
      result: {
        equivalent: true,
        confidence: { min: 0.8, max: 1.0 },
      },
    };
    expect(checkStructuralMatch(actual, expected)).toBe(true);
  });

  test('matches arrays', () => {
    expect(checkStructuralMatch({ items: [1, 2, 3] }, { items: [1, 2, 3] })).toBe(
      true
    );
    expect(checkStructuralMatch({ items: [1, 2, 3] }, { items: [1, 2] })).toBe(
      false
    );
    expect(checkStructuralMatch({ items: [1, 2] }, { items: [1, 2, 3] })).toBe(
      false
    );
  });

  test('returns false for non-object actual values', () => {
    expect(checkStructuralMatch(null, { value: true })).toBe(false);
    expect(checkStructuralMatch('string', { value: true })).toBe(false);
    expect(checkStructuralMatch(123, { value: true })).toBe(false);
  });

  test('handles missing keys in actual', () => {
    expect(checkStructuralMatch({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  test('ignores extra keys in actual', () => {
    expect(checkStructuralMatch({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBe(true);
  });
});

// =============================================================================
// Judge Response Parsing Tests
// =============================================================================

describe('parseJudgeResponse', () => {
  test('parses valid JSON response', () => {
    const response = JSON.stringify({
      criteriaScores: { criterion_1: 0.9, criterion_2: 0.8 },
      score: 0.85,
      passed: true,
      reasoning: 'All criteria met successfully',
    });

    const result = parseJudgeResponse(response);

    expect(result.score).toBe(0.85);
    expect(result.passed).toBe(true);
    expect(result.reasoning).toBe('All criteria met successfully');
    expect(result.criteriaScores['criterion_1']).toBe(0.9);
  });

  test('parses JSON wrapped in markdown code blocks', () => {
    const response = `\`\`\`json
{
  "criteriaScores": { "c1": 0.7 },
  "score": 0.7,
  "passed": true,
  "reasoning": "Good"
}
\`\`\``;

    const result = parseJudgeResponse(response);

    expect(result.score).toBe(0.7);
    expect(result.passed).toBe(true);
  });

  test('clamps score to 0-1 range', () => {
    const highScore = JSON.stringify({
      criteriaScores: {},
      score: 1.5,
      passed: true,
      reasoning: 'Test',
    });

    const lowScore = JSON.stringify({
      criteriaScores: {},
      score: -0.5,
      passed: false,
      reasoning: 'Test',
    });

    expect(parseJudgeResponse(highScore).score).toBe(1);
    expect(parseJudgeResponse(lowScore).score).toBe(0);
  });

  test('returns failure evaluation for invalid JSON', () => {
    const result = parseJudgeResponse('not valid json');

    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.reasoning).toContain('Failed to parse');
  });

  test('returns failure for missing required fields', () => {
    const missingScore = JSON.stringify({
      criteriaScores: {},
      passed: true,
      reasoning: 'Test',
    });

    const result = parseJudgeResponse(missingScore);

    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.reasoning).toContain('Missing or invalid score');
  });
});

// =============================================================================
// Consistency Calculation Tests
// =============================================================================

describe('calculateConsistency', () => {
  test('returns 1 for single output', () => {
    expect(calculateConsistency([{ value: true }])).toBe(1);
  });

  test('returns 1 for empty array', () => {
    expect(calculateConsistency([])).toBe(1);
  });

  test('returns 1 for all identical outputs', () => {
    const outputs = [
      { value: true, confidence: 0.9 },
      { value: true, confidence: 0.9 },
      { value: true, confidence: 0.9 },
    ];
    expect(calculateConsistency(outputs)).toBe(1);
  });

  test('returns correct ratio for mixed outputs', () => {
    const outputs = [
      { value: true },
      { value: true },
      { value: true },
      { value: false },
    ];
    expect(calculateConsistency(outputs)).toBe(0.75);
  });

  test('returns 0.5 for evenly split outputs', () => {
    const outputs = [{ value: true }, { value: false }];
    expect(calculateConsistency(outputs)).toBe(0.5);
  });
});

// =============================================================================
// Score Standard Deviation Tests
// =============================================================================

describe('calculateScoreStdDev', () => {
  test('returns 0 for single score', () => {
    expect(calculateScoreStdDev([0.8])).toBe(0);
  });

  test('returns 0 for empty array', () => {
    expect(calculateScoreStdDev([])).toBe(0);
  });

  test('returns 0 for identical scores', () => {
    expect(calculateScoreStdDev([0.8, 0.8, 0.8])).toBeCloseTo(0, 10);
  });

  test('calculates correct std dev for varied scores', () => {
    // Mean of [0.6, 0.8, 1.0] = 0.8
    // Variance = ((0.6-0.8)² + (0.8-0.8)² + (1.0-0.8)²) / 3 = 0.04 + 0 + 0.04 / 3 ≈ 0.0267
    // StdDev ≈ 0.163
    const result = calculateScoreStdDev([0.6, 0.8, 1.0]);
    expect(result).toBeCloseTo(0.163, 2);
  });
});

// =============================================================================
// Judge Prompt Creation Tests
// =============================================================================

describe('createJudgePrompt', () => {
  test('includes all required sections', () => {
    const prompt = createJudgePrompt({
      description: 'Test description',
      input: { value: 'test', args: ['arg1'] },
      expected: { result: true },
      actual: { result: true, extra: 'data' },
      criteria: ['Criterion 1', 'Criterion 2'],
    });

    expect(prompt).toContain('Test description');
    expect(prompt).toContain('"value": "test"');
    expect(prompt).toContain('result: true');
    expect(prompt).toContain('1. Criterion 1');
    expect(prompt).toContain('2. Criterion 2');
  });

  test('formats numeric ranges correctly', () => {
    const prompt = createJudgePrompt({
      description: 'Test',
      input: { value: 'test' },
      expected: {
        confidence: { min: 0.7, max: 1.0 },
        score: { exact: 0.5 },
        threshold: { min: 0.8 },
      },
      actual: {},
      criteria: ['Test'],
    });

    expect(prompt).toContain('between 0.7 and 1');
    expect(prompt).toContain('exactly 0.5');
    expect(prompt).toContain('at least 0.8');
  });
});

// =============================================================================
// Configuration Tests
// =============================================================================

describe('Configuration', () => {
  test('defaultConfig has all required fields', () => {
    expect(defaultConfig.runs).toBe(1);
    expect(defaultConfig.passThreshold).toBe(0.7);
    expect(defaultConfig.concurrency).toBe(5);
    expect(defaultConfig.timeoutMs).toBe(30000);
    expect(defaultConfig.judgeProvider).toBe('anthropic');
    expect(defaultConfig.saveResults).toBe(false);
  });

  test('classRegistry includes core semantic types', () => {
    expect(classRegistry['SemanticString']).toBeDefined();
    expect(classRegistry['SemanticNumber']).toBeDefined();
    expect(classRegistry['SemanticBoolean']).toBeDefined();
    expect(classRegistry['SemanticArray']).toBeDefined();
  });

  test('classRegistry entries have correct structure', () => {
    const entry = classRegistry['SemanticString'];
    expect(entry.module).toContain('string');
    expect(entry.className).toBe('SemanticString');
  });
});

// =============================================================================
// Reporter Tests
// =============================================================================

describe('Reporter', () => {
  const mockDatasetResult = {
    dataset: {
      name: 'Test.method',
      description: 'Test dataset',
      version: '1.0.0',
      targetClass: 'Test',
      targetMethod: 'method',
      cases: [],
    },
    cases: [
      {
        case: {
          id: 'case-1',
          description: 'Test case 1',
          input: { value: 'test' },
          expected: { result: true },
          criteria: ['Criterion 1'],
          difficulty: 'easy' as Difficulty,
          tags: ['tag1'],
        },
        runs: [],
        metrics: {
          passRate: 1.0,
          avgScore: 0.9,
          avgLatencyMs: 100,
          consistency: 1.0,
          structuralMatchRate: 1.0,
          scoreStdDev: 0,
        },
        passed: true,
      },
    ],
    summary: {
      totalCases: 1,
      passedCases: 1,
      failedCases: 0,
      skippedCases: 0,
      avgScore: 0.9,
      avgLatencyMs: 100,
      byDifficulty: {
        easy: { count: 1, passRate: 1.0, avgScore: 0.9 },
        medium: { count: 0, passRate: 0, avgScore: 0 },
        hard: { count: 0, passRate: 0, avgScore: 0 },
      },
      byTag: {
        tag1: { count: 1, passRate: 1.0, avgScore: 0.9 },
      },
    },
    timestamp: '2024-01-15T00:00:00Z',
    config: defaultConfig,
  };

  const mockRunSummary = {
    datasets: [mockDatasetResult],
    overallSummary: {
      totalDatasets: 1,
      totalCases: 1,
      passedCases: 1,
      failedCases: 0,
      skippedCases: 0,
      passRate: 1.0,
      avgScore: 0.9,
      avgLatencyMs: 100,
    },
    config: defaultConfig,
    timestamp: '2024-01-15T00:00:00Z',
    durationMs: 1000,
  };

  test('toJSON produces valid JSON output', () => {
    const json = toJSON(mockRunSummary);
    const parsed = JSON.parse(json);

    expect(parsed.summary.totalCases).toBe(1);
    expect(parsed.summary.passedCases).toBe(1);
    expect(parsed.datasets).toHaveLength(1);
  });

  test('generateCISummary produces markdown', () => {
    const summary = generateCISummary(mockRunSummary);

    expect(summary).toContain('## LLM Evaluation Results');
    expect(summary).toContain('| Total Cases | 1 |');
    expect(summary).toContain('| Passed | 1');
  });
});

// =============================================================================
// Eval Data Validation Tests
// =============================================================================

describe('EvalDataset Validation', () => {
  test('validates required dataset fields', () => {
    const dataset: EvalDataset = {
      name: 'Test.method',
      description: 'Test description',
      version: '1.0.0',
      targetClass: 'TestClass',
      targetMethod: 'testMethod',
      cases: [],
    };

    expect(dataset.name).toBeTruthy();
    expect(dataset.description).toBeTruthy();
    expect(dataset.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(dataset.targetClass).toBeTruthy();
    expect(dataset.targetMethod).toBeTruthy();
    expect(Array.isArray(dataset.cases)).toBe(true);
  });

  test('validates case structure', () => {
    const evalCase: EvalCase = {
      id: 'unique-id',
      description: 'Case description',
      input: {
        value: 'input value',
        args: [],
      },
      expected: {
        result: true,
      },
      criteria: ['At least one criterion'],
    };

    expect(evalCase.id).toBeTruthy();
    expect(evalCase.description).toBeTruthy();
    expect(evalCase.input).toBeDefined();
    expect(evalCase.input.value).toBeDefined();
    expect(evalCase.expected).toBeDefined();
    expect(evalCase.criteria.length).toBeGreaterThan(0);
  });

  test('validates optional case fields', () => {
    const fullCase: EvalCase = {
      id: 'full-case',
      description: 'Full case with all fields',
      input: {
        value: 'test',
        args: ['arg1', 'arg2'],
        options: { context: 'test context' },
      },
      expected: {
        result: true,
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: ['Criterion 1'],
      tags: ['tag1', 'tag2'],
      difficulty: 'hard',
      skip: false,
      skipReason: undefined,
    };

    expect(fullCase.tags).toHaveLength(2);
    expect(fullCase.difficulty).toBe('hard');
    expect(fullCase.skip).toBe(false);
  });
});

// =============================================================================
// Edge Case Tests
// =============================================================================

describe('Edge Cases', () => {
  test('handles empty expected object', () => {
    expect(checkStructuralMatch({ anything: 'value' }, {})).toBe(true);
  });

  test('handles deeply nested structures', () => {
    const actual = {
      level1: {
        level2: {
          level3: {
            value: 0.85,
          },
        },
      },
    };

    const expected = {
      level1: {
        level2: {
          level3: {
            value: { min: 0.8, max: 0.9 },
          },
        },
      },
    };

    expect(checkStructuralMatch(actual, expected)).toBe(true);
  });

  test('handles arrays with mixed types', () => {
    const actual = { items: [1, 'two', true, null] };
    const expected = { items: [1, 'two', true, null] };
    expect(checkStructuralMatch(actual, expected)).toBe(true);
  });

  test('handles special number values', () => {
    expect(
      checkStructuralMatch({ value: 0 }, { value: { min: -1, max: 1 } })
    ).toBe(true);
    expect(
      checkStructuralMatch({ value: 0 }, { value: { exact: 0 } })
    ).toBe(true);
  });

  test('handles empty strings', () => {
    expect(checkStructuralMatch({ text: '' }, { text: '' })).toBe(true);
    expect(checkStructuralMatch({ text: 'a' }, { text: '' })).toBe(false);
  });
});
