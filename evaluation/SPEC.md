# LLM-as-Judge Evaluation System Specification

## Overview

This evaluation system provides a scalable, consistent way to test and optimize prompts across all semantic primitives. It uses an LLM-as-judge approach to evaluate the quality of outputs from semantic operations.

## Architecture

```
evaluation/
├── SPEC.md                    # This specification
├── runner.ts                  # Main evaluation script
├── judge.ts                   # LLM judge implementation
├── types.ts                   # TypeScript types for evaluation
├── reporter.ts                # Results reporting utilities
├── config.ts                  # Default configuration
└── results/                   # Stored evaluation results (gitignored)
```

Each semantic type folder can contain an `evals/` directory:

```
src/primitives/string/
├── string.prompts.ts
├── ...
└── evals/
    ├── index.ts               # Re-exports all eval datasets
    ├── semanticallyEquals.evals.ts
    ├── classify.evals.ts
    └── detectIntent.evals.ts
```

## Evaluation Data File Format

Each `.evals.ts` file exports an `EvalDataset` that maps method names to test cases.

### File Structure

```typescript
// src/primitives/string/evals/semanticallyEquals.evals.ts

import type { EvalDataset } from '../../../../evaluation/types.ts';

export const dataset: EvalDataset = {
  // Metadata
  name: 'SemanticString.semanticallyEquals',
  description: 'Evaluate semantic equality comparisons for strings',
  version: '1.0.0',

  // The method being tested (used for dynamic invocation)
  targetClass: 'SemanticString',
  targetMethod: 'semanticallyEquals',

  // Test cases
  cases: [
    {
      id: 'synonym-match-1',
      description: 'Should recognize "happy" and "joyful" as equivalent',
      input: {
        // Primary value (instantiates the class)
        value: 'I am happy',
        // Method arguments
        args: ['I am joyful'],
        // Optional context/options
        options: { context: 'emotional state' }
      },
      expected: {
        // Expected output shape - can be exact or criteria-based
        equivalent: true,
        // Use ranges for numeric values
        confidence: { min: 0.7, max: 1.0 }
      },
      // Evaluation criteria for the LLM judge
      criteria: [
        'Output correctly identifies semantic equivalence',
        'Confidence score is appropriately high (>0.7)',
        'Handles synonym recognition correctly'
      ],
      // Tags for filtering/grouping
      tags: ['synonyms', 'basic', 'high-confidence'],
      // Difficulty level (affects scoring weight)
      difficulty: 'easy'
    },
    {
      id: 'context-dependent-1',
      description: 'Bank (financial) vs bank (river) should not match',
      input: {
        value: 'I went to the bank',
        args: ['I sat by the river bank'],
        options: { context: 'financial transaction' }
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.6, max: 1.0 }
      },
      criteria: [
        'Correctly distinguishes homonyms based on context',
        'Uses context hint to determine meaning'
      ],
      tags: ['homonyms', 'context-sensitive', 'disambiguation'],
      difficulty: 'hard'
    }
  ]
};
```

### Dataset Index File

Each type's `evals/index.ts` exports all datasets:

```typescript
// src/primitives/string/evals/index.ts

export { dataset as semanticallyEquals } from './semanticallyEquals.evals.ts';
export { dataset as classify } from './classify.evals.ts';
export { dataset as detectIntent } from './detectIntent.evals.ts';
```

## Type Definitions

### Core Types

```typescript
// evaluation/types.ts

/** Numeric range for flexible matching */
export interface NumericRange {
  min?: number;
  max?: number;
  exact?: number;
}

/** Expected value can be exact or a range */
export type ExpectedValue =
  | string
  | number
  | boolean
  | null
  | NumericRange
  | ExpectedValue[]
  | { [key: string]: ExpectedValue };

/** Single test case */
export interface EvalCase {
  /** Unique identifier for the test case */
  id: string;
  /** Human-readable description */
  description: string;
  /** Input configuration */
  input: {
    /** Primary value to instantiate the semantic type */
    value: unknown;
    /** Arguments to pass to the method */
    args?: unknown[];
    /** Options/context to pass */
    options?: Record<string, unknown>;
  };
  /** Expected output (exact values or ranges) */
  expected: Record<string, ExpectedValue>;
  /** Criteria for LLM judge evaluation */
  criteria: string[];
  /** Tags for filtering */
  tags?: string[];
  /** Difficulty level */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Skip this case (for WIP) */
  skip?: boolean;
}

/** Complete evaluation dataset */
export interface EvalDataset {
  /** Dataset name */
  name: string;
  /** Description of what's being tested */
  description: string;
  /** Version for tracking changes */
  version: string;
  /** Target class name (e.g., 'SemanticString') */
  targetClass: string;
  /** Target method name (e.g., 'semanticallyEquals') */
  targetMethod: string;
  /** Whether method is static */
  isStaticMethod?: boolean;
  /** Factory method to create instance (defaults to 'from') */
  factoryMethod?: string;
  /** All test cases */
  cases: EvalCase[];
}

/** Single evaluation run result */
export interface EvalRunResult {
  caseId: string;
  runNumber: number;
  /** Actual output from the method */
  output: unknown;
  /** Raw LLM response (before parsing) */
  rawResponse?: string;
  /** Time taken in ms */
  latencyMs: number;
  /** Whether output matched expected (structural check) */
  structuralMatch: boolean;
  /** LLM judge evaluation */
  judgeEvaluation: {
    score: number;  // 0-1
    passed: boolean;
    reasoning: string;
    criteriaScores: Record<string, number>;
  };
  /** Error if any */
  error?: string;
}

/** Aggregated results for a case */
export interface EvalCaseResult {
  case: EvalCase;
  runs: EvalRunResult[];
  /** Aggregate metrics */
  metrics: {
    passRate: number;
    avgScore: number;
    avgLatencyMs: number;
    consistency: number;  // How consistent across runs (0-1)
    structuralMatchRate: number;
  };
}

/** Results for entire dataset */
export interface EvalDatasetResult {
  dataset: EvalDataset;
  cases: EvalCaseResult[];
  /** Aggregate metrics */
  summary: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    skippedCases: number;
    avgScore: number;
    avgLatencyMs: number;
    byDifficulty: Record<string, { count: number; passRate: number }>;
    byTag: Record<string, { count: number; passRate: number }>;
  };
  /** Timestamp */
  timestamp: string;
  /** Configuration used */
  config: EvalConfig;
}

/** Evaluation configuration */
export interface EvalConfig {
  /** Number of runs per case */
  runs: number;
  /** Pass threshold (0-1) */
  passThreshold: number;
  /** Tags to include (empty = all) */
  includeTags?: string[];
  /** Tags to exclude */
  excludeTags?: string[];
  /** Difficulty levels to include */
  difficulties?: ('easy' | 'medium' | 'hard')[];
  /** Maximum concurrent evaluations */
  concurrency: number;
  /** Timeout per case in ms */
  timeoutMs: number;
  /** LLM provider for judge */
  judgeProvider: 'anthropic' | 'openai' | 'google';
  /** Model for judge */
  judgeModel?: string;
  /** Whether to save results */
  saveResults: boolean;
  /** Results directory */
  resultsDir: string;
}
```

## Evaluation Runner

The runner script dynamically discovers and executes evaluations.

### Usage

```bash
# Run all evaluations with defaults (1 run each)
bun run evaluation/runner.ts

# Run with 5 iterations per case
bun run evaluation/runner.ts --runs 5

# Run specific type only
bun run evaluation/runner.ts --type SemanticString

# Run specific method only
bun run evaluation/runner.ts --type SemanticString --method semanticallyEquals

# Filter by tags
bun run evaluation/runner.ts --tags synonyms,basic

# Exclude tags
bun run evaluation/runner.ts --exclude-tags slow,experimental

# Filter by difficulty
bun run evaluation/runner.ts --difficulty easy,medium

# Verbose output
bun run evaluation/runner.ts --verbose

# Save results to file
bun run evaluation/runner.ts --save --output results/run-2024-01.json

# JSON output (for CI/CD)
bun run evaluation/runner.ts --json
```

### Discovery

The runner discovers evaluations by:

1. Scanning `src/primitives/**/evals/index.ts`
2. Scanning `src/types/**/evals/index.ts`
3. Loading each dataset export
4. Filtering based on CLI options

### Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Evaluation Runner                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Discover all eval datasets                               │
│ 2. Filter by CLI options (type, method, tags, difficulty)   │
│ 3. For each dataset:                                        │
│    a. Import the target class                               │
│    b. For each case (respecting concurrency):               │
│       i.   For each run (1..N):                             │
│            - Create instance via factory method             │
│            - Call target method with args                   │
│            - Measure latency                                │
│            - Check structural match                         │
│            - Send to LLM judge                              │
│            - Record result                                  │
│       ii.  Aggregate run results                            │
│    c. Aggregate case results                                │
│ 4. Generate report                                          │
│ 5. Save results (if configured)                             │
└─────────────────────────────────────────────────────────────┘
```

## LLM Judge

The LLM judge evaluates each output against the expected criteria.

### Judge Prompt Structure

```typescript
const judgeSystemPrompt = `You are an expert evaluator for LLM-powered semantic operations.
Your task is to evaluate whether an output correctly satisfies the evaluation criteria.

You must be:
- Objective: Base judgments only on evidence
- Precise: Score each criterion independently
- Consistent: Apply the same standards to all cases

Output JSON only.`;

function createJudgePrompt(params: {
  description: string;
  input: unknown;
  expected: Record<string, ExpectedValue>;
  actual: unknown;
  criteria: string[];
}): string {
  return `Evaluate this semantic operation output.

## Test Case
Description: ${params.description}

## Input
${JSON.stringify(params.input, null, 2)}

## Expected Output
${JSON.stringify(params.expected, null, 2)}

## Actual Output
${JSON.stringify(params.actual, null, 2)}

## Evaluation Criteria
${params.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Instructions
Score each criterion from 0.0 to 1.0, then provide an overall score and pass/fail judgment.

Respond with JSON:
{
  "criteriaScores": {
    "<criterion_1>": <score>,
    "<criterion_2>": <score>,
    ...
  },
  "score": <overall_score_0_to_1>,
  "passed": <boolean>,
  "reasoning": "<detailed explanation>"
}`;
}
```

### Scoring Guidelines

- **1.0**: Perfect match, criterion fully satisfied
- **0.8-0.99**: Minor issues but essentially correct
- **0.5-0.79**: Partially correct, some issues
- **0.1-0.49**: Significant problems
- **0.0**: Complete failure or opposite of expected

### Pass Criteria

A case passes when:
1. Overall score >= pass threshold (default 0.7)
2. No criterion scores 0.0
3. Structural match passes (if exact values specified)

## Reporter

The reporter generates human-readable and machine-readable outputs.

### Console Output (Default)

```
╔════════════════════════════════════════════════════════════╗
║  LLM-as-Judge Evaluation Results                          ║
║  Run: 2024-01-15 14:30:00 UTC                             ║
╠════════════════════════════════════════════════════════════╣

📦 SemanticString.semanticallyEquals (v1.0.0)
   "Evaluate semantic equality comparisons for strings"

   ✅ synonym-match-1 [easy] ........................ PASS (0.95)
      Runs: 5/5 passed, avg latency: 342ms

   ✅ antonym-detection-1 [medium] .................. PASS (0.88)
      Runs: 4/5 passed, avg latency: 389ms

   ❌ context-dependent-1 [hard] .................... FAIL (0.45)
      Runs: 1/5 passed, avg latency: 412ms
      Issues:
      - Failed to use context hint for disambiguation
      - Inconsistent results across runs (consistency: 0.4)

   Summary: 2/3 passed (66.7%)
   Avg Score: 0.76 | Avg Latency: 381ms

───────────────────────────────────────────────────────────────

📦 SemanticNumber.isReasonable (v1.0.0)
   ...

═══════════════════════════════════════════════════════════════
                      OVERALL SUMMARY
═══════════════════════════════════════════════════════════════

Total Cases:     45
Passed:          38 (84.4%)
Failed:          7  (15.6%)
Skipped:         0

By Difficulty:
  Easy:    20/22 (90.9%)
  Medium:  14/17 (82.4%)
  Hard:    4/6   (66.7%)

By Tag:
  synonyms:      8/8  (100%)
  homonyms:      3/5  (60%)
  context:       5/8  (62.5%)
  ...

Average Score:   0.82
Average Latency: 356ms

═══════════════════════════════════════════════════════════════
```

### JSON Output (for CI/CD)

```json
{
  "summary": {
    "totalCases": 45,
    "passedCases": 38,
    "failedCases": 7,
    "passRate": 0.844,
    "avgScore": 0.82,
    "avgLatencyMs": 356
  },
  "datasets": [...],
  "timestamp": "2024-01-15T14:30:00Z",
  "config": {...}
}
```

## Best Practices

### Writing Good Test Cases

1. **Unique IDs**: Use descriptive, unique IDs like `synonym-happy-joyful`
2. **Clear Descriptions**: Explain what's being tested and why
3. **Specific Criteria**: Write measurable criteria the judge can evaluate
4. **Appropriate Difficulty**: Label correctly to set expectations
5. **Useful Tags**: Use consistent tags for filtering

### Coverage Guidelines

Each semantic method should have cases covering:

- **Happy Path**: Basic expected behavior (easy)
- **Edge Cases**: Boundary conditions (medium)
- **Error Cases**: Invalid inputs, ambiguous cases (medium/hard)
- **Context Sensitivity**: How context affects output (hard)
- **Adversarial**: Tricky cases that might confuse the LLM (hard)

### Recommended Case Distribution

- 40% easy (basic functionality)
- 40% medium (edge cases, variations)
- 20% hard (adversarial, context-dependent)

### Versioning

- Increment version when cases change significantly
- Document changes in dataset description
- Keep historical results for comparison

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: LLM Evaluation

on:
  pull_request:
    paths:
      - 'src/**/prompts.ts'
      - 'src/**/evals/**'
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - run: bun install

      - name: Run Evaluations
        run: bun run evaluation/runner.ts --runs 3 --json > results.json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Check Pass Rate
        run: |
          PASS_RATE=$(jq '.summary.passRate' results.json)
          if (( $(echo "$PASS_RATE < 0.8" | bc -l) )); then
            echo "Pass rate $PASS_RATE is below threshold 0.8"
            exit 1
          fi

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: eval-results
          path: results.json
```

## Extending the System

### Adding New Evaluation Types

1. Create `evals/` directory in the type folder
2. Create `<method>.evals.ts` with dataset
3. Export from `evals/index.ts`
4. Run evaluation to verify

### Custom Judges

For specialized evaluation needs, create custom judge implementations:

```typescript
// evaluation/judges/code-quality.ts
export const codeQualityJudge: JudgeImplementation = {
  name: 'code-quality',
  systemPrompt: `You are a code quality evaluator...`,
  createPrompt: (params) => { ... },
  parseResponse: (response) => { ... }
};
```

### Metrics Extensions

Add custom metrics by extending the reporter:

```typescript
// evaluation/metrics/custom.ts
export function calculateCustomMetrics(results: EvalDatasetResult) {
  return {
    confidenceCalibration: calculateCalibration(results),
    semanticDrift: calculateDrift(results),
    ...
  };
}
```
