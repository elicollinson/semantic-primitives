#!/usr/bin/env bun
/**
 * LLM-as-Judge Evaluation Runner
 *
 * Dynamically discovers and runs evaluation datasets for semantic primitives.
 *
 * Usage:
 *   bun run evaluation/runner.ts [options]
 *
 * Options:
 *   --runs <n>           Number of runs per case (default: 1)
 *   --type <name>        Only evaluate specific type (e.g., SemanticString)
 *   --method <name>      Only evaluate specific method (e.g., semanticallyEquals)
 *   --tags <list>        Only include cases with these tags (comma-separated)
 *   --exclude-tags <list> Exclude cases with these tags (comma-separated)
 *   --difficulty <list>  Only include these difficulties (easy,medium,hard)
 *   --json               Output JSON format
 *   --verbose            Verbose output
 *   --save               Save results to file
 *   --output <path>      Output file path
 *   --help               Show help
 */

import { Glob } from 'bun';
import type {
  EvalConfig,
  EvalDataset,
  EvalCase,
  EvalCaseResult,
  EvalDatasetResult,
  EvalRunResult,
  EvalRunSummary,
  DiscoveredDataset,
  Difficulty,
  CaseMetrics,
  EvalSummary,
  CategoryStats,
} from './types.ts';
import { defaultConfig, classRegistry, evalScanPaths } from './config.ts';
import {
  LLMJudge,
  checkStructuralMatch,
  calculateConsistency,
  calculateScoreStdDev,
} from './judge.ts';
import { printReport, toJSON } from './reporter.ts';

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<EvalConfig> & {
  type?: string;
  method?: string;
  json?: boolean;
  help?: boolean;
  output?: string;
} {
  const args = process.argv.slice(2);
  const config: ReturnType<typeof parseArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--runs':
        config.runs = parseInt(nextArg, 10);
        i++;
        break;
      case '--type':
        config.type = nextArg;
        i++;
        break;
      case '--method':
        config.method = nextArg;
        i++;
        break;
      case '--tags':
        config.includeTags = nextArg.split(',').map((t) => t.trim());
        i++;
        break;
      case '--exclude-tags':
        config.excludeTags = nextArg.split(',').map((t) => t.trim());
        i++;
        break;
      case '--difficulty':
        config.difficulties = nextArg.split(',').map((d) => d.trim()) as Difficulty[];
        i++;
        break;
      case '--json':
        config.json = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--save':
        config.saveResults = true;
        break;
      case '--output':
        config.output = nextArg;
        config.saveResults = true;
        i++;
        break;
      case '--help':
        config.help = true;
        break;
    }
  }

  return config;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
LLM-as-Judge Evaluation Runner

Usage:
  bun run evaluation/runner.ts [options]

Options:
  --runs <n>            Number of runs per case (default: 1)
  --type <name>         Only evaluate specific type (e.g., SemanticString)
  --method <name>       Only evaluate specific method
  --tags <list>         Only include cases with these tags (comma-separated)
  --exclude-tags <list> Exclude cases with these tags (comma-separated)
  --difficulty <list>   Only include these difficulties (easy,medium,hard)
  --json                Output JSON format
  --verbose             Verbose output
  --save                Save results to file
  --output <path>       Output file path
  --help                Show this help

Examples:
  bun run evaluation/runner.ts --runs 5
  bun run evaluation/runner.ts --type SemanticString --method semanticallyEquals
  bun run evaluation/runner.ts --tags synonyms,basic --verbose
  bun run evaluation/runner.ts --json --save --output results/run.json
`);
}

/**
 * Discover all evaluation datasets
 */
async function discoverDatasets(
  typeFilter?: string,
  methodFilter?: string
): Promise<DiscoveredDataset[]> {
  const discovered: DiscoveredDataset[] = [];

  for (const scanPath of evalScanPaths) {
    const glob = new Glob(scanPath);

    for await (const filePath of glob.scan({ cwd: process.cwd() })) {
      try {
        const fullPath = `${process.cwd()}/${filePath}`;
        const module = await import(fullPath);

        for (const [exportName, value] of Object.entries(module)) {
          if (isEvalDataset(value)) {
            const dataset = value as EvalDataset;

            // Apply filters
            if (typeFilter && dataset.targetClass !== typeFilter) {
              continue;
            }
            if (methodFilter && dataset.targetMethod !== methodFilter) {
              continue;
            }

            discovered.push({
              filePath,
              exportName,
              dataset,
            });
          }
        }
      } catch (error) {
        // Skip files that can't be imported
        console.warn(`Warning: Could not load ${filePath}: ${error}`);
      }
    }
  }

  return discovered;
}

/**
 * Type guard for EvalDataset
 */
function isEvalDataset(value: unknown): value is EvalDataset {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.targetClass === 'string' &&
    typeof obj.targetMethod === 'string' &&
    Array.isArray(obj.cases)
  );
}

/**
 * Filter cases based on configuration
 */
function filterCases(cases: EvalCase[], config: EvalConfig): EvalCase[] {
  return cases.filter((c) => {
    // Skip if marked
    if (c.skip) return false;

    // Filter by tags
    if (config.includeTags && config.includeTags.length > 0) {
      const caseTags = c.tags || [];
      if (!config.includeTags.some((t) => caseTags.includes(t))) {
        return false;
      }
    }

    if (config.excludeTags && config.excludeTags.length > 0) {
      const caseTags = c.tags || [];
      if (config.excludeTags.some((t) => caseTags.includes(t))) {
        return false;
      }
    }

    // Filter by difficulty
    if (config.difficulties && config.difficulties.length > 0) {
      const caseDifficulty = c.difficulty || 'medium';
      if (!config.difficulties.includes(caseDifficulty)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Dynamically load and instantiate a semantic class
 */
async function loadSemanticClass(
  className: string
): Promise<new (...args: unknown[]) => unknown> {
  const registry = classRegistry[className];
  if (!registry) {
    throw new Error(`Unknown class: ${className}. Add it to config.ts classRegistry.`);
  }

  const modulePath = `${process.cwd()}/${registry.module.replace(/^\.\.\//, '')}`;
  const module = await import(modulePath);
  const Class = module[registry.className];

  if (!Class) {
    throw new Error(`Class ${className} not found in module ${modulePath}`);
  }

  return Class;
}

/**
 * Run a single evaluation case
 */
async function runCase(
  evalCase: EvalCase,
  dataset: EvalDataset,
  config: EvalConfig,
  judge: LLMJudge
): Promise<EvalCaseResult> {
  const runs: EvalRunResult[] = [];

  // Load the class
  const SemanticClass = await loadSemanticClass(dataset.targetClass);

  for (let runNumber = 1; runNumber <= config.runs; runNumber++) {
    const startTime = performance.now();

    try {
      // Create instance
      let instance: unknown;
      const factoryMethod = dataset.factoryMethod || 'from';

      if (dataset.isStaticMethod) {
        // For static methods, call directly on the class
        const method = (SemanticClass as Record<string, unknown>)[
          dataset.targetMethod
        ] as (...args: unknown[]) => unknown | Promise<unknown>;

        if (!method) {
          throw new Error(
            `Static method ${dataset.targetMethod} not found on ${dataset.targetClass}`
          );
        }

        const methodArgs = [evalCase.input.value, ...(evalCase.input.args || [])];
        if (evalCase.input.options) {
          methodArgs.push(evalCase.input.options);
        }

        const result = method.apply(SemanticClass, methodArgs);
        instance = result instanceof Promise ? await result : result;
      } else {
        // Create instance via factory method
        const factory = (SemanticClass as Record<string, unknown>)[factoryMethod] as (
          ...args: unknown[]
        ) => unknown | Promise<unknown>;

        if (!factory) {
          throw new Error(
            `Factory method ${factoryMethod} not found on ${dataset.targetClass}`
          );
        }

        const factoryArgs = [evalCase.input.value];
        const factoryResult = factory.apply(SemanticClass, factoryArgs);
        instance =
          dataset.factoryAsync !== false && factoryResult instanceof Promise
            ? await factoryResult
            : factoryResult;

        // Call the target method
        const method = (instance as Record<string, unknown>)[dataset.targetMethod];
        if (typeof method !== 'function') {
          throw new Error(
            `Method ${dataset.targetMethod} not found on ${dataset.targetClass} instance`
          );
        }

        const methodArgs = evalCase.input.args || [];
        if (evalCase.input.options) {
          methodArgs.push(evalCase.input.options);
        }

        const methodResult = method.apply(instance, methodArgs);
        instance = methodResult instanceof Promise ? await methodResult : methodResult;
      }

      const latencyMs = performance.now() - startTime;

      // Check structural match
      const structuralMatch = checkStructuralMatch(instance, evalCase.expected);

      // Get judge evaluation
      const judgeEvaluation = await judge.evaluate({
        description: evalCase.description,
        input: evalCase.input,
        expected: evalCase.expected,
        actual: instance,
        criteria: evalCase.criteria,
      });

      runs.push({
        caseId: evalCase.id,
        runNumber,
        output: instance,
        latencyMs,
        structuralMatch,
        judgeEvaluation,
      });
    } catch (error) {
      const latencyMs = performance.now() - startTime;

      runs.push({
        caseId: evalCase.id,
        runNumber,
        output: null,
        latencyMs,
        structuralMatch: false,
        judgeEvaluation: {
          score: 0,
          passed: false,
          reasoning: `Error during execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
          criteriaScores: {},
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  // Calculate metrics
  const outputs = runs.filter((r) => !r.error).map((r) => r.output);
  const scores = runs.map((r) => r.judgeEvaluation.score);
  const passedRuns = runs.filter((r) => r.judgeEvaluation.passed).length;

  const metrics: CaseMetrics = {
    passRate: passedRuns / runs.length,
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    avgLatencyMs: runs.reduce((a, b) => a + b.latencyMs, 0) / runs.length,
    consistency: calculateConsistency(outputs),
    structuralMatchRate:
      runs.filter((r) => r.structuralMatch).length / runs.length,
    scoreStdDev: calculateScoreStdDev(scores),
  };

  // Case passes if average score meets threshold and majority of runs passed
  const passed =
    metrics.avgScore >= config.passThreshold && metrics.passRate >= 0.5;

  return {
    case: evalCase,
    runs,
    metrics,
    passed,
  };
}

/**
 * Run evaluation for a single dataset
 */
async function runDataset(
  discovered: DiscoveredDataset,
  config: EvalConfig,
  judge: LLMJudge
): Promise<EvalDatasetResult> {
  const { dataset } = discovered;
  const filteredCases = filterCases(dataset.cases, config);
  const results: EvalCaseResult[] = [];

  // Run cases with concurrency control
  const runBatch = async (cases: EvalCase[]) => {
    return Promise.all(
      cases.map((c) => runCase(c, dataset, config, judge))
    );
  };

  // Process in batches based on concurrency
  for (let i = 0; i < filteredCases.length; i += config.concurrency) {
    const batch = filteredCases.slice(i, i + config.concurrency);
    const batchResults = await runBatch(batch);
    results.push(...batchResults);

    if (config.verbose && !config.json) {
      console.log(
        `  Completed ${Math.min(i + config.concurrency, filteredCases.length)}/${filteredCases.length} cases`
      );
    }
  }

  // Include skipped cases
  const skippedCases = dataset.cases
    .filter((c) => c.skip)
    .map((c) => ({
      case: c,
      runs: [],
      metrics: {
        passRate: 0,
        avgScore: 0,
        avgLatencyMs: 0,
        consistency: 0,
        structuralMatchRate: 0,
        scoreStdDev: 0,
      },
      passed: false,
    }));

  const allCases = [...results, ...skippedCases];

  // Calculate summary
  const summary = calculateSummary(results, dataset.cases);

  return {
    dataset,
    cases: allCases,
    summary,
    timestamp: new Date().toISOString(),
    config,
  };
}

/**
 * Calculate summary statistics for a dataset
 */
function calculateSummary(
  results: EvalCaseResult[],
  allCases: EvalCase[]
): EvalSummary {
  const totalCases = results.length;
  const passedCases = results.filter((r) => r.passed).length;
  const failedCases = totalCases - passedCases;
  const skippedCases = allCases.filter((c) => c.skip).length;

  const avgScore =
    results.length > 0
      ? results.reduce((a, b) => a + b.metrics.avgScore, 0) / results.length
      : 0;

  const avgLatencyMs =
    results.length > 0
      ? results.reduce((a, b) => a + b.metrics.avgLatencyMs, 0) / results.length
      : 0;

  // By difficulty
  const byDifficulty: Record<Difficulty, CategoryStats> = {
    easy: { count: 0, passRate: 0, avgScore: 0 },
    medium: { count: 0, passRate: 0, avgScore: 0 },
    hard: { count: 0, passRate: 0, avgScore: 0 },
  };

  for (const result of results) {
    const difficulty = result.case.difficulty || 'medium';
    byDifficulty[difficulty].count++;
    if (result.passed) {
      byDifficulty[difficulty].passRate++;
    }
    byDifficulty[difficulty].avgScore += result.metrics.avgScore;
  }

  // Normalize
  for (const diff of ['easy', 'medium', 'hard'] as Difficulty[]) {
    if (byDifficulty[diff].count > 0) {
      byDifficulty[diff].passRate /= byDifficulty[diff].count;
      byDifficulty[diff].avgScore /= byDifficulty[diff].count;
    }
  }

  // By tag
  const byTag: Record<string, CategoryStats> = {};
  for (const result of results) {
    const tags = result.case.tags || [];
    for (const tag of tags) {
      if (!byTag[tag]) {
        byTag[tag] = { count: 0, passRate: 0, avgScore: 0 };
      }
      byTag[tag].count++;
      if (result.passed) {
        byTag[tag].passRate++;
      }
      byTag[tag].avgScore += result.metrics.avgScore;
    }
  }

  // Normalize
  for (const tag of Object.keys(byTag)) {
    if (byTag[tag].count > 0) {
      byTag[tag].passRate /= byTag[tag].count;
      byTag[tag].avgScore /= byTag[tag].count;
    }
  }

  return {
    totalCases,
    passedCases,
    failedCases,
    skippedCases,
    avgScore,
    avgLatencyMs,
    byDifficulty,
    byTag,
  };
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const startTime = performance.now();

  // Parse arguments and merge with defaults
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const config: EvalConfig = {
    ...defaultConfig,
    ...args,
  };

  if (!args.json && config.verbose) {
    console.log('Starting LLM-as-Judge Evaluation...');
    console.log(`Configuration: ${JSON.stringify(config, null, 2)}`);
  }

  // Discover datasets
  const discovered = await discoverDatasets(args.type, args.method);

  if (discovered.length === 0) {
    if (args.json) {
      console.log(JSON.stringify({ error: 'No evaluation datasets found' }));
    } else {
      console.log('No evaluation datasets found.');
      console.log('Create evals/ directories with .evals.ts files in your semantic type folders.');
      console.log('See evaluation/SPEC.md for the expected format.');
    }
    process.exit(1);
  }

  if (!args.json) {
    console.log(`Found ${discovered.length} evaluation dataset(s)`);
  }

  // Initialize judge
  const judge = new LLMJudge(config);

  // Run all datasets
  const datasetResults: EvalDatasetResult[] = [];

  for (const disc of discovered) {
    if (!args.json && config.verbose) {
      console.log(`\nEvaluating: ${disc.dataset.name}`);
    }

    const result = await runDataset(disc, config, judge);
    datasetResults.push(result);
  }

  const durationMs = performance.now() - startTime;

  // Calculate overall summary
  const totalCases = datasetResults.reduce(
    (a, b) => a + b.summary.totalCases,
    0
  );
  const passedCases = datasetResults.reduce(
    (a, b) => a + b.summary.passedCases,
    0
  );
  const failedCases = datasetResults.reduce(
    (a, b) => a + b.summary.failedCases,
    0
  );
  const skippedCases = datasetResults.reduce(
    (a, b) => a + b.summary.skippedCases,
    0
  );

  const runSummary: EvalRunSummary = {
    datasets: datasetResults,
    overallSummary: {
      totalDatasets: datasetResults.length,
      totalCases,
      passedCases,
      failedCases,
      skippedCases,
      passRate: totalCases > 0 ? passedCases / totalCases : 0,
      avgScore:
        datasetResults.length > 0
          ? datasetResults.reduce((a, b) => a + b.summary.avgScore, 0) /
            datasetResults.length
          : 0,
      avgLatencyMs:
        datasetResults.length > 0
          ? datasetResults.reduce((a, b) => a + b.summary.avgLatencyMs, 0) /
            datasetResults.length
          : 0,
    },
    config,
    timestamp: new Date().toISOString(),
    durationMs,
  };

  // Output results
  if (args.json) {
    console.log(toJSON(runSummary));
  } else {
    printReport(runSummary, config.verbose);
  }

  // Save results if configured
  if (config.saveResults) {
    const outputPath =
      args.output ||
      `${config.resultsDir}/eval-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    await Bun.write(outputPath, toJSON(runSummary));

    if (!args.json) {
      console.log(`\nResults saved to: ${outputPath}`);
    }
  }

  // Exit with appropriate code
  const passThreshold = 0.8;
  if (runSummary.overallSummary.passRate < passThreshold) {
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error('Evaluation failed:', error);
  process.exit(1);
});
