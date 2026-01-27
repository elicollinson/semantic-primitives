/**
 * LLM-as-Judge implementation for evaluating semantic operation outputs
 */

import type {
  EvalInput,
  ExpectedValue,
  JudgeEvaluation,
  JudgeImplementation,
  EvalConfig,
  NumericRange,
} from './types.ts';
import { getClient, type LLMClient } from '../src/llm/client.ts';

/**
 * System prompt for the evaluation judge
 */
export const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator for LLM-powered semantic operations.
Your task is to evaluate whether an output correctly satisfies the evaluation criteria.

You must be:
- Objective: Base judgments only on evidence in the output
- Precise: Score each criterion independently from 0.0 to 1.0
- Consistent: Apply the same standards across all evaluations
- Thorough: Consider edge cases and subtle issues

Scoring Guidelines:
- 1.0: Perfect match, criterion fully satisfied
- 0.8-0.99: Minor issues but essentially correct
- 0.5-0.79: Partially correct with notable issues
- 0.1-0.49: Significant problems, mostly incorrect
- 0.0: Complete failure or opposite of expected

Always respond with valid JSON only. No markdown, no explanation text outside the JSON.`;

/**
 * Create the evaluation prompt for the judge
 */
export function createJudgePrompt(params: {
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
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Instructions
1. Score each criterion from 0.0 to 1.0 based on how well the actual output satisfies it
2. Calculate an overall score (weighted average, with hard failures pulling down the score)
3. Determine if the output passes (overall score >= 0.7 AND no criterion scores 0.0)
4. Provide clear reasoning for your evaluation

Respond with this exact JSON structure:
{
  "criteriaScores": {
    "criterion_1": <score>,
    "criterion_2": <score>
  },
  "score": <overall_score_0_to_1>,
  "passed": <boolean>,
  "reasoning": "<detailed explanation of the evaluation>"
}`;
}

/**
 * Format expected values for the judge prompt
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
 * Type guard for NumericRange
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
 * Parse the judge's response into a structured evaluation
 */
export function parseJudgeResponse(response: string): JudgeEvaluation {
  try {
    // Try to extract JSON from the response
    let jsonStr = response.trim();

    // Handle markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
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
    // Return a failure evaluation if parsing fails
    return {
      score: 0,
      passed: false,
      reasoning: `Failed to parse judge response: ${error instanceof Error ? error.message : 'Unknown error'}. Raw response: ${response.slice(0, 500)}`,
      criteriaScores: {},
    };
  }
}

/**
 * Check if actual output structurally matches expected
 */
export function checkStructuralMatch(
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
 * Check if a single value matches the expected value
 */
function matchesExpected(actual: unknown, expected: ExpectedValue): boolean {
  // Handle null/undefined
  if (expected === null) return actual === null;
  if (expected === undefined) return actual === undefined;

  // Handle numeric ranges
  if (isNumericRange(expected)) {
    if (typeof actual !== 'number') return false;
    if (expected.exact !== undefined) {
      return Math.abs(actual - expected.exact) < 0.0001;
    }
    if (expected.min !== undefined && actual < expected.min) return false;
    if (expected.max !== undefined && actual > expected.max) return false;
    return true;
  }

  // Handle arrays
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (actual.length !== expected.length) return false;
    return expected.every((exp, i) => matchesExpected(actual[i], exp));
  }

  // Handle objects
  if (typeof expected === 'object') {
    if (typeof actual !== 'object' || actual === null) return false;
    const actualObj = actual as Record<string, unknown>;
    const expectedObj = expected as Record<string, ExpectedValue>;
    return Object.entries(expectedObj).every(([key, value]) =>
      matchesExpected(actualObj[key], value)
    );
  }

  // Handle primitives (string, number, boolean)
  return actual === expected;
}

/**
 * The LLM-based judge for evaluating semantic operation outputs
 */
export class LLMJudge implements JudgeImplementation {
  name = 'default';
  systemPrompt = JUDGE_SYSTEM_PROMPT;

  private client: LLMClient;
  private config: Partial<EvalConfig>;

  constructor(config?: Partial<EvalConfig>, client?: LLMClient) {
    this.config = config || {};
    this.client = client || getClient();
  }

  createPrompt(params: {
    description: string;
    input: EvalInput;
    expected: Record<string, ExpectedValue>;
    actual: unknown;
    criteria: string[];
  }): string {
    return createJudgePrompt(params);
  }

  parseResponse(response: string): JudgeEvaluation {
    return parseJudgeResponse(response);
  }

  /**
   * Evaluate an output against expected criteria
   */
  async evaluate(params: {
    description: string;
    input: EvalInput;
    expected: Record<string, ExpectedValue>;
    actual: unknown;
    criteria: string[];
  }): Promise<JudgeEvaluation> {
    const prompt = this.createPrompt(params);

    try {
      const response = await this.client.complete({
        prompt,
        systemPrompt: this.systemPrompt,
        temperature: 0.1, // Low temperature for consistent evaluation
      });

      return this.parseResponse(response.content);
    } catch (error) {
      return {
        score: 0,
        passed: false,
        reasoning: `Judge evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        criteriaScores: {},
      };
    }
  }
}

/**
 * Calculate consistency score across multiple outputs
 * Returns a score from 0-1 indicating how similar the outputs were
 */
export function calculateConsistency(outputs: unknown[]): number {
  if (outputs.length <= 1) return 1;

  // Convert outputs to normalized strings for comparison
  const normalized = outputs.map((o) => JSON.stringify(o, null, 0));

  // Count how many outputs match the most common output
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
export function calculateScoreStdDev(scores: number[]): number {
  if (scores.length <= 1) return 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;

  return Math.sqrt(avgSquaredDiff);
}
