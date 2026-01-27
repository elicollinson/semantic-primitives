/**
 * Default configuration for the evaluation system
 */

import type { EvalConfig, SemanticClassRegistry } from './types.ts';

/**
 * Default evaluation configuration
 */
export const defaultConfig: EvalConfig = {
  runs: 1,
  passThreshold: 0.7,
  concurrency: 5,
  timeoutMs: 30000,
  judgeProvider: 'anthropic',
  judgeModel: 'claude-sonnet-4-20250514',
  saveResults: false,
  resultsDir: './evaluation/results',
  verbose: false,
};

/**
 * Registry mapping class names to their module paths
 * Used for dynamic class instantiation
 */
export const classRegistry: SemanticClassRegistry = {
  // Primitives
  SemanticString: {
    module: '../src/primitives/string/index.ts',
    className: 'SemanticString',
  },
  SemanticNumber: {
    module: '../src/primitives/number/index.ts',
    className: 'SemanticNumber',
  },
  SemanticBoolean: {
    module: '../src/primitives/boolean/index.ts',
    className: 'SemanticBoolean',
  },
  SemanticBigInt: {
    module: '../src/primitives/bigint/index.ts',
    className: 'SemanticBigInt',
  },
  SemanticSymbol: {
    module: '../src/primitives/symbol/index.ts',
    className: 'SemanticSymbol',
  },
  SemanticNull: {
    module: '../src/primitives/null/index.ts',
    className: 'SemanticNull',
  },
  SemanticUndefined: {
    module: '../src/primitives/undefined/index.ts',
    className: 'SemanticUndefined',
  },
  SemanticVoid: {
    module: '../src/primitives/void/index.ts',
    className: 'SemanticVoid',
  },

  // Types
  SemanticArray: {
    module: '../src/types/array/index.ts',
    className: 'SemanticArray',
  },
  SemanticObject: {
    module: '../src/types/object/index.ts',
    className: 'SemanticObject',
  },
  SemanticMap: {
    module: '../src/types/map/index.ts',
    className: 'SemanticMap',
  },
  SemanticSet: {
    module: '../src/types/set/index.ts',
    className: 'SemanticSet',
  },
  SemanticDate: {
    module: '../src/types/date/index.ts',
    className: 'SemanticDate',
  },
  SemanticError: {
    module: '../src/types/error/index.ts',
    className: 'SemanticError',
  },
  SemanticURL: {
    module: '../src/types/url/index.ts',
    className: 'SemanticURL',
  },
  SemanticRegExp: {
    module: '../src/types/regexp/index.ts',
    className: 'SemanticRegExp',
  },
  SemanticPromise: {
    module: '../src/types/promise/index.ts',
    className: 'SemanticPromise',
  },
  SemanticCallable: {
    module: '../src/types/callable/index.ts',
    className: 'SemanticCallable',
  },
  SemanticConstructable: {
    module: '../src/types/constructable/index.ts',
    className: 'SemanticConstructable',
  },
  SemanticRecord: {
    module: '../src/types/record/index.ts',
    className: 'SemanticRecord',
  },
  SemanticTuple: {
    module: '../src/types/tuple/index.ts',
    className: 'SemanticTuple',
  },
  SemanticObjectLiteral: {
    module: '../src/types/object-literal/index.ts',
    className: 'SemanticObjectLiteral',
  },
  SemanticNever: {
    module: '../src/types/never/index.ts',
    className: 'SemanticNever',
  },
  SemanticUnknown: {
    module: '../src/types/unknown/index.ts',
    className: 'SemanticUnknown',
  },
};

/**
 * Paths to scan for evaluation datasets
 */
export const evalScanPaths = [
  'src/primitives/**/evals/index.ts',
  'src/types/**/evals/index.ts',
];

/**
 * Default model per provider
 */
export const defaultModels: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-1.5-pro',
};
