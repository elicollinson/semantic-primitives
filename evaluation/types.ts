/**
 * Type definitions for the LLM-as-Judge evaluation system
 */

/**
 * Numeric range for flexible matching of expected values
 */
export interface NumericRange {
  min?: number;
  max?: number;
  exact?: number;
}

/**
 * Expected value can be exact, a range, or nested structures
 */
export type ExpectedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | NumericRange
  | ExpectedValue[]
  | { [key: string]: ExpectedValue };

/**
 * Difficulty levels for test cases
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Input configuration for a test case
 */
export interface EvalInput {
  /** Primary value to instantiate the semantic type */
  value: unknown;
  /** Arguments to pass to the method being tested */
  args?: unknown[];
  /** Options/context to pass to the method */
  options?: Record<string, unknown>;
}

/**
 * A single test case in an evaluation dataset
 */
export interface EvalCase {
  /** Unique identifier for the test case */
  id: string;
  /** Human-readable description of what's being tested */
  description: string;
  /** Input configuration */
  input: EvalInput;
  /** Expected output - can be exact values or ranges */
  expected: Record<string, ExpectedValue>;
  /** Criteria for LLM judge evaluation */
  criteria: string[];
  /** Tags for filtering and grouping */
  tags?: string[];
  /** Difficulty level (affects scoring weight) */
  difficulty?: Difficulty;
  /** Skip this case (for WIP or known issues) */
  skip?: boolean;
  /** Reason for skipping */
  skipReason?: string;
}

/**
 * Complete evaluation dataset for a semantic operation
 */
export interface EvalDataset {
  /** Dataset name (e.g., 'SemanticString.semanticallyEquals') */
  name: string;
  /** Description of what's being tested */
  description: string;
  /** Version for tracking changes */
  version: string;
  /** Target class name (e.g., 'SemanticString') */
  targetClass: string;
  /** Target method name (e.g., 'semanticallyEquals') */
  targetMethod: string;
  /** Whether the method is static (e.g., 'from') */
  isStaticMethod?: boolean;
  /** Factory method to create instance (defaults to 'from') */
  factoryMethod?: string;
  /** Whether factory method is async */
  factoryAsync?: boolean;
  /** All test cases */
  cases: EvalCase[];
}

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
