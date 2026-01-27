/**
 * Type definitions for evaluation data files
 *
 * These types are used by evaluation datasets in src/primitives/<type>/evals/
 * and src/types/<type>/evals/ directories.
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
