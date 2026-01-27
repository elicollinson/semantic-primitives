/**
 * Reporting utilities for evaluation results
 */

import type {
  EvalDatasetResult,
  EvalCaseResult,
  EvalRunSummary,
  Difficulty,
  CategoryStats,
} from './types.ts';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

/**
 * Format a pass/fail status with color
 */
function formatStatus(passed: boolean): string {
  return passed
    ? `${colors.green}PASS${colors.reset}`
    : `${colors.red}FAIL${colors.reset}`;
}

/**
 * Format a score with appropriate color
 */
function formatScore(score: number): string {
  const formatted = score.toFixed(2);
  if (score >= 0.8) return `${colors.green}${formatted}${colors.reset}`;
  if (score >= 0.6) return `${colors.yellow}${formatted}${colors.reset}`;
  return `${colors.red}${formatted}${colors.reset}`;
}

/**
 * Format a percentage
 */
function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format difficulty badge
 */
function formatDifficulty(difficulty: Difficulty = 'medium'): string {
  const badges: Record<Difficulty, string> = {
    easy: `${colors.green}[easy]${colors.reset}`,
    medium: `${colors.yellow}[medium]${colors.reset}`,
    hard: `${colors.red}[hard]${colors.reset}`,
  };
  return badges[difficulty];
}

/**
 * Create a progress bar
 */
function progressBar(value: number, width: number = 20): string {
  const filled = Math.round(value * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  if (value >= 0.8) return `${colors.green}${bar}${colors.reset}`;
  if (value >= 0.6) return `${colors.yellow}${bar}${colors.reset}`;
  return `${colors.red}${bar}${colors.reset}`;
}

/**
 * Print a horizontal line
 */
function line(char: string = '─', width: number = 70): string {
  return char.repeat(width);
}

/**
 * Report results for a single case
 */
function reportCase(result: EvalCaseResult, verbose: boolean): void {
  const { case: evalCase, metrics, passed } = result;

  const status = passed ? '✅' : '❌';
  const difficulty = formatDifficulty(evalCase.difficulty);
  const score = formatScore(metrics.avgScore);

  console.log(
    `   ${status} ${evalCase.id} ${difficulty} ${'.'.repeat(Math.max(1, 40 - evalCase.id.length))} ${formatStatus(passed)} (${score})`
  );

  if (verbose || !passed) {
    console.log(
      `      Runs: ${Math.round(metrics.passRate * result.runs.length)}/${result.runs.length} passed, avg latency: ${Math.round(metrics.avgLatencyMs)}ms`
    );

    if (!passed) {
      console.log(`${colors.dim}      Issues:${colors.reset}`);

      // Show failing criteria
      const failedRun = result.runs.find((r) => !r.judgeEvaluation.passed);
      if (failedRun) {
        const lowScoreCriteria = Object.entries(
          failedRun.judgeEvaluation.criteriaScores
        )
          .filter(([, score]) => score < 0.7)
          .map(([criterion]) => criterion);

        for (const criterion of lowScoreCriteria.slice(0, 3)) {
          console.log(`${colors.dim}      - ${criterion}${colors.reset}`);
        }
      }

      // Show consistency issues
      if (metrics.consistency < 0.8) {
        console.log(
          `${colors.dim}      - Inconsistent results across runs (consistency: ${metrics.consistency.toFixed(2)})${colors.reset}`
        );
      }

      // Show reasoning from first failed run
      if (failedRun && verbose) {
        console.log(
          `${colors.dim}      Reasoning: ${failedRun.judgeEvaluation.reasoning.slice(0, 200)}...${colors.reset}`
        );
      }
    }
  }
}

/**
 * Report results for a single dataset
 */
function reportDataset(result: EvalDatasetResult, verbose: boolean): void {
  const { dataset, cases, summary } = result;

  console.log();
  console.log(
    `${colors.cyan}📦 ${dataset.name}${colors.reset} ${colors.dim}(v${dataset.version})${colors.reset}`
  );
  console.log(`${colors.dim}   "${dataset.description}"${colors.reset}`);
  console.log();

  // Report each case
  for (const caseResult of cases) {
    if (caseResult.case.skip) {
      console.log(
        `   ${colors.dim}⏭  ${caseResult.case.id} [skipped]${colors.reset}`
      );
      continue;
    }
    reportCase(caseResult, verbose);
  }

  // Dataset summary
  console.log();
  console.log(
    `   ${colors.bold}Summary:${colors.reset} ${summary.passedCases}/${summary.totalCases} passed (${formatPercent(summary.passedCases / summary.totalCases)})`
  );
  console.log(
    `   Avg Score: ${formatScore(summary.avgScore)} | Avg Latency: ${Math.round(summary.avgLatencyMs)}ms`
  );
}

/**
 * Report category statistics
 */
function reportCategoryStats(
  title: string,
  stats: Record<string, CategoryStats>
): void {
  console.log(`${colors.bold}${title}:${colors.reset}`);

  const entries = Object.entries(stats).sort((a, b) => b[1].passRate - a[1].passRate);

  for (const [category, { count, passRate, avgScore }] of entries) {
    const passCount = Math.round(count * passRate);
    console.log(
      `  ${category.padEnd(15)} ${passCount}/${count} ${progressBar(passRate, 15)} ${formatPercent(passRate)}`
    );
  }
}

/**
 * Report overall summary
 */
function reportOverallSummary(runSummary: EvalRunSummary): void {
  const { overallSummary, config, durationMs } = runSummary;

  console.log();
  console.log(colors.bold + '═'.repeat(70) + colors.reset);
  console.log(
    `${colors.bold}                      OVERALL SUMMARY${colors.reset}`
  );
  console.log(colors.bold + '═'.repeat(70) + colors.reset);
  console.log();

  console.log(`${colors.bold}Total Cases:${colors.reset}     ${overallSummary.totalCases}`);
  console.log(
    `${colors.bold}Passed:${colors.reset}          ${colors.green}${overallSummary.passedCases}${colors.reset} (${formatPercent(overallSummary.passRate)})`
  );
  console.log(
    `${colors.bold}Failed:${colors.reset}          ${colors.red}${overallSummary.failedCases}${colors.reset} (${formatPercent(1 - overallSummary.passRate)})`
  );
  console.log(
    `${colors.bold}Skipped:${colors.reset}         ${overallSummary.skippedCases}`
  );
  console.log();

  // Aggregate by difficulty
  const byDifficulty: Record<Difficulty, CategoryStats> = {
    easy: { count: 0, passRate: 0, avgScore: 0 },
    medium: { count: 0, passRate: 0, avgScore: 0 },
    hard: { count: 0, passRate: 0, avgScore: 0 },
  };

  const byTag: Record<string, CategoryStats> = {};

  for (const datasetResult of runSummary.datasets) {
    // Aggregate difficulty stats
    for (const [diff, stats] of Object.entries(datasetResult.summary.byDifficulty)) {
      const d = diff as Difficulty;
      byDifficulty[d].count += stats.count;
      byDifficulty[d].passRate += stats.passRate * stats.count;
      byDifficulty[d].avgScore += stats.avgScore * stats.count;
    }

    // Aggregate tag stats
    for (const [tag, stats] of Object.entries(datasetResult.summary.byTag)) {
      if (!byTag[tag]) {
        byTag[tag] = { count: 0, passRate: 0, avgScore: 0 };
      }
      byTag[tag].count += stats.count;
      byTag[tag].passRate += stats.passRate * stats.count;
      byTag[tag].avgScore += stats.avgScore * stats.count;
    }
  }

  // Normalize aggregated stats
  for (const diff of ['easy', 'medium', 'hard'] as Difficulty[]) {
    if (byDifficulty[diff].count > 0) {
      byDifficulty[diff].passRate /= byDifficulty[diff].count;
      byDifficulty[diff].avgScore /= byDifficulty[diff].count;
    }
  }

  for (const tag of Object.keys(byTag)) {
    if (byTag[tag].count > 0) {
      byTag[tag].passRate /= byTag[tag].count;
      byTag[tag].avgScore /= byTag[tag].count;
    }
  }

  reportCategoryStats('By Difficulty', byDifficulty);
  console.log();

  if (Object.keys(byTag).length > 0) {
    reportCategoryStats('By Tag', byTag);
    console.log();
  }

  console.log(`${colors.bold}Average Score:${colors.reset}   ${formatScore(overallSummary.avgScore)}`);
  console.log(
    `${colors.bold}Average Latency:${colors.reset} ${Math.round(overallSummary.avgLatencyMs)}ms`
  );
  console.log(
    `${colors.bold}Total Duration:${colors.reset}  ${(durationMs / 1000).toFixed(1)}s`
  );
  console.log(
    `${colors.bold}Runs per Case:${colors.reset}   ${config.runs}`
  );
  console.log();
  console.log(colors.bold + '═'.repeat(70) + colors.reset);
}

/**
 * Print evaluation results to console
 */
export function printReport(
  runSummary: EvalRunSummary,
  verbose: boolean = false
): void {
  console.log();
  console.log(colors.bold + '╔' + '═'.repeat(68) + '╗' + colors.reset);
  console.log(
    colors.bold +
      '║  LLM-as-Judge Evaluation Results' +
      ' '.repeat(34) +
      '║' +
      colors.reset
  );
  console.log(
    colors.bold +
      `║  Run: ${runSummary.timestamp}` +
      ' '.repeat(38 - runSummary.timestamp.length) +
      '║' +
      colors.reset
  );
  console.log(colors.bold + '╠' + '═'.repeat(68) + '╣' + colors.reset);

  for (const datasetResult of runSummary.datasets) {
    reportDataset(datasetResult, verbose);
    console.log(line());
  }

  reportOverallSummary(runSummary);
}

/**
 * Format results as JSON for machine consumption
 */
export function toJSON(runSummary: EvalRunSummary): string {
  return JSON.stringify(
    {
      summary: runSummary.overallSummary,
      datasets: runSummary.datasets.map((d) => ({
        name: d.dataset.name,
        version: d.dataset.version,
        summary: d.summary,
        cases: d.cases.map((c) => ({
          id: c.case.id,
          passed: c.passed,
          metrics: c.metrics,
        })),
      })),
      timestamp: runSummary.timestamp,
      config: runSummary.config,
      durationMs: runSummary.durationMs,
    },
    null,
    2
  );
}

/**
 * Generate a summary suitable for CI/CD output
 */
export function generateCISummary(runSummary: EvalRunSummary): string {
  const { overallSummary } = runSummary;

  const lines: string[] = [
    '## LLM Evaluation Results',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Cases | ${overallSummary.totalCases} |`,
    `| Passed | ${overallSummary.passedCases} (${formatPercent(overallSummary.passRate)}) |`,
    `| Failed | ${overallSummary.failedCases} |`,
    `| Avg Score | ${overallSummary.avgScore.toFixed(2)} |`,
    '',
  ];

  // Add failed cases
  const failedCases = runSummary.datasets
    .flatMap((d) => d.cases)
    .filter((c) => !c.passed && !c.case.skip);

  if (failedCases.length > 0) {
    lines.push('### Failed Cases');
    lines.push('');
    for (const c of failedCases.slice(0, 10)) {
      lines.push(`- **${c.case.id}**: ${c.case.description}`);
    }
    if (failedCases.length > 10) {
      lines.push(`- ... and ${failedCases.length - 10} more`);
    }
  }

  return lines.join('\n');
}
