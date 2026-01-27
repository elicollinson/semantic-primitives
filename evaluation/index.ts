/**
 * LLM-as-Judge Evaluation System
 *
 * This module provides a scalable evaluation framework for testing
 * LLM-powered semantic operations across all semantic primitives.
 *
 * @example
 * ```bash
 * # Run all evaluations
 * bun run evaluation/runner.ts
 *
 * # Run with 5 iterations per case
 * bun run evaluation/runner.ts --runs 5
 *
 * # Run specific type
 * bun run evaluation/runner.ts --type SemanticString
 *
 * # Output JSON
 * bun run evaluation/runner.ts --json
 * ```
 *
 * @see SPEC.md for complete documentation
 */

// Types
export type {
  EvalDataset,
  EvalCase,
  EvalInput,
  EvalConfig,
  EvalRunResult,
  EvalCaseResult,
  EvalDatasetResult,
  EvalRunSummary,
  JudgeEvaluation,
  JudgeImplementation,
  NumericRange,
  ExpectedValue,
  Difficulty,
  DiscoveredDataset,
} from './types.ts';

// Judge
export {
  LLMJudge,
  JUDGE_SYSTEM_PROMPT,
  createJudgePrompt,
  parseJudgeResponse,
  checkStructuralMatch,
  calculateConsistency,
  calculateScoreStdDev,
} from './judge.ts';

// Reporter
export { printReport, toJSON, generateCISummary } from './reporter.ts';

// Config
export { defaultConfig, classRegistry, evalScanPaths } from './config.ts';
