/**
 * Type definitions for the LLM-as-Judge evaluation system
 *
 * Core data types (EvalDataset, EvalCase, etc.) are defined in
 * src/shared/eval-types.ts for use by evaluation data files within src/.
 */

// Re-export core types from shared location
export type {
  NumericRange,
  ExpectedValue,
  Difficulty,
  EvalInput,
  EvalCase,
  EvalDataset,
} from '../src/shared/eval-types.ts';

// Import for use in this file
import type {
  Difficulty,
  EvalInput,
  ExpectedValue,
  EvalCase,
  EvalDataset,
} from '../src/shared/eval-types.ts';

/**
 * LLM judge evaluation result for a single criterion
 */
export interface CriterionScore {
  criterion: string;
  score: number;
  notes?: string;
}

/**
 * LLM judge evaluation result
 */
export interface JudgeEvaluation {
  /** Overall score from 0-1 */
  score: number;
  /** Whether the case passed */
  passed: boolean;
  /** Detailed reasoning from the judge */
  reasoning: string;
  /** Individual criterion scores */
  criteriaScores: Record<string, number>;
}

/**
 * Result of a single evaluation run
 */
export interface EvalRunResult {
  /** Case ID this run belongs to */
  caseId: string;
  /** Run number (1-indexed) */
  runNumber: number;
  /** Actual output from the method */
  output: unknown;
  /** Raw LLM response before parsing (if available) */
  rawResponse?: string;
  /** Time taken in milliseconds */
  latencyMs: number;
  /** Whether output structurally matched expected */
  structuralMatch: boolean;
  /** LLM judge evaluation */
  judgeEvaluation: JudgeEvaluation;
  /** Error message if the run failed */
  error?: string;
  /** Stack trace for errors */
  errorStack?: string;
}

/**
 * Aggregated metrics for an evaluation case
 */
export interface CaseMetrics {
  /** Percentage of runs that passed */
  passRate: number;
  /** Average judge score across runs */
  avgScore: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Consistency score (0-1) - how similar results were across runs */
  consistency: number;
  /** Percentage of runs with structural match */
  structuralMatchRate: number;
  /** Standard deviation of scores */
  scoreStdDev: number;
}

/**
 * Aggregated results for a single evaluation case
 */
export interface EvalCaseResult {
  /** The original case definition */
  case: EvalCase;
  /** Results from all runs */
  runs: EvalRunResult[];
  /** Aggregated metrics */
  metrics: CaseMetrics;
  /** Whether the case passed overall */
  passed: boolean;
}

/**
 * Summary statistics by category
 */
export interface CategoryStats {
  count: number;
  passRate: number;
  avgScore: number;
}

/**
 * Summary of evaluation results
 */
export interface EvalSummary {
  /** Total number of cases evaluated */
  totalCases: number;
  /** Number of cases that passed */
  passedCases: number;
  /** Number of cases that failed */
  failedCases: number;
  /** Number of cases skipped */
  skippedCases: number;
  /** Average score across all cases */
  avgScore: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Stats grouped by difficulty */
  byDifficulty: Record<Difficulty, CategoryStats>;
  /** Stats grouped by tag */
  byTag: Record<string, CategoryStats>;
}

/**
 * Complete results for an evaluation dataset
 */
export interface EvalDatasetResult {
  /** The original dataset definition */
  dataset: EvalDataset;
  /** Results for each case */
  cases: EvalCaseResult[];
  /** Summary statistics */
  summary: EvalSummary;
  /** ISO timestamp of when evaluation was run */
  timestamp: string;
  /** Configuration used for this evaluation */
  config: EvalConfig;
}

/**
 * Supported LLM providers for the judge
 */
export type JudgeProvider = 'anthropic' | 'openai' | 'google';

/**
 * Configuration for evaluation runs
 */
export interface EvalConfig {
  /** Number of runs per case (default: 1) */
  runs: number;
  /** Pass threshold score (0-1, default: 0.7) */
  passThreshold: number;
  /** Tags to include (empty = all) */
  includeTags?: string[];
  /** Tags to exclude */
  excludeTags?: string[];
  /** Difficulty levels to include (default: all) */
  difficulties?: Difficulty[];
  /** Maximum concurrent evaluations (default: 5) */
  concurrency: number;
  /** Timeout per case in milliseconds (default: 30000) */
  timeoutMs: number;
  /** LLM provider for the judge */
  judgeProvider: JudgeProvider;
  /** Specific model for the judge (provider default if not set) */
  judgeModel?: string;
  /** Whether to save results to file */
  saveResults: boolean;
  /** Directory for saving results */
  resultsDir: string;
  /** Verbose output */
  verbose: boolean;
}

/**
 * CLI arguments for the evaluation runner
 */
export interface EvalCliArgs {
  /** Number of runs per case */
  runs?: number;
  /** Specific type to evaluate (e.g., 'SemanticString') */
  type?: string;
  /** Specific method to evaluate */
  method?: string;
  /** Tags to include (comma-separated) */
  tags?: string;
  /** Tags to exclude (comma-separated) */
  excludeTags?: string;
  /** Difficulty levels (comma-separated) */
  difficulty?: string;
  /** Output JSON format */
  json?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Save results */
  save?: boolean;
  /** Output file path */
  output?: string;
  /** Show help */
  help?: boolean;
}

/**
 * Discovered dataset with its file path
 */
export interface DiscoveredDataset {
  /** File path where the dataset was found */
  filePath: string;
  /** Export name in the module */
  exportName: string;
  /** The dataset itself */
  dataset: EvalDataset;
}

/**
 * Overall evaluation run result
 */
export interface EvalRunSummary {
  /** All dataset results */
  datasets: EvalDatasetResult[];
  /** Overall summary across all datasets */
  overallSummary: {
    totalDatasets: number;
    totalCases: number;
    passedCases: number;
    failedCases: number;
    skippedCases: number;
    passRate: number;
    avgScore: number;
    avgLatencyMs: number;
  };
  /** Configuration used */
  config: EvalConfig;
  /** ISO timestamp */
  timestamp: string;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Interface for custom judge implementations
 */
export interface JudgeImplementation {
  /** Unique name for this judge */
  name: string;
  /** System prompt for the judge */
  systemPrompt: string;
  /** Create the evaluation prompt */
  createPrompt(params: {
    description: string;
    input: EvalInput;
    expected: Record<string, ExpectedValue>;
    actual: unknown;
    criteria: string[];
  }): string;
  /** Parse the judge's response */
  parseResponse(response: string): JudgeEvaluation;
}

/**
 * Registry of available semantic classes for dynamic instantiation
 */
export type SemanticClassRegistry = Record<
  string,
  {
    module: string;
    className: string;
  }
>;
