/**
 * Tests for SemanticFunction
 */

import { describe, test, expect } from 'bun:test';
import { SemanticFunction } from '../function.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockExplainResponse,
  mockComplexExplainResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockValidArgsResponse,
  mockInvalidArgsResponse,
  mockMathPurposeResponse,
  mockTransformPurposeResponse,
  mockJSDocResponse,
  mockMarkdownDocResponse,
  mockImprovementsResponse,
  mockNoImprovementsResponse,
  mockIssuesResponse,
  mockNoIssuesResponse,
  mockTestCasesResponse,
  mockSafeResponse,
  mockNotSafeResponse,
} from './mocks.ts';

// Sample functions for testing
const add = (a: number, b: number) => a + b;
const multiply = (a: number, b: number) => a * b;
const sum = (x: number, y: number) => x + y;
const filterPositive = (arr: number[]) => arr.filter((n) => n > 0);

describe('SemanticFunction', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('from()', () => {
    test('creates SemanticFunction from function', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      expect(fn).toBeInstanceOf(SemanticFunction);
      expect(fn.valueOf()).toBe(add);
    });

    test('creates SemanticFunction with description', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, 'Adds two numbers', client);

      expect(fn.description).toBe('Adds two numbers');
    });

    test('preserves function name', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      expect(fn.name).toBe('add');
    });

    test('preserves function length', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      expect(fn.length).toBe(2);
    });
  });

  // ===========================================================================
  // CALL TESTS
  // ===========================================================================

  describe('call()', () => {
    test('calls underlying function', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = fn.call(2, 3);
      expect(result).toBe(5);
    });

    test('calls function with different arguments', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(multiply, undefined, client);

      expect(fn.call(3, 4)).toBe(12);
      expect(fn.call(0, 5)).toBe(0);
    });

    test('handles array functions', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(filterPositive, undefined, client);

      const result = fn.call([-1, 0, 1, 2]);
      expect(result).toEqual([1, 2]);
    });
  });

  // ===========================================================================
  // EXPLAIN TESTS
  // ===========================================================================

  describe('explain()', () => {
    test('returns explanation for simple function', async () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const explanation = await fn.explain();
      expect(explanation).toContain('two numbers');
      expect(explanation).toContain('sum');
    });

    test('returns explanation for complex function', async () => {
      const client = createMockLLMClient(mockComplexExplainResponse);
      const fn = SemanticFunction.from(filterPositive, undefined, client);

      const explanation = await fn.explain();
      expect(explanation).toContain('filter');
      expect(explanation).toContain('array');
    });
  });

  // ===========================================================================
  // SEMANTICALLY EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent functions', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const fn1 = SemanticFunction.from(add, undefined, client);

      const result = await fn1.semanticallyEquals(sum);
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('returns false for different functions', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const fn1 = SemanticFunction.from(add, undefined, client);

      const result = await fn1.semanticallyEquals(multiply);
      expect(result.equivalent).toBe(false);
    });

    test('compares with another SemanticFunction', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const fn1 = SemanticFunction.from(add, undefined, client);
      const fn2 = SemanticFunction.from(sum, undefined, client);

      const result = await fn1.semanticallyEquals(fn2);
      expect(result.equivalent).toBe(true);
    });

    test('accepts test inputs for comparison', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = await fn.semanticallyEquals(sum, { testInputs: [[1, 2], [5, 10], [0, 0]] });
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // VALIDATE ARGS TESTS
  // ===========================================================================

  describe('validateArgs()', () => {
    test('returns valid for correct arguments', async () => {
      const client = createMockLLMClient(mockValidArgsResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = await fn.validateArgs([1, 2]);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('returns issues for invalid arguments', async () => {
      const client = createMockLLMClient(mockInvalidArgsResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = await fn.validateArgs(['not a number', -5]);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('validates with custom rules', async () => {
      const client = createMockLLMClient(mockValidArgsResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = await fn.validateArgs([1, 2], [
        'first argument must be positive',
        'second argument must be less than 10',
      ]);
      expect(result.valid).toBe(true);
    });
  });

  // ===========================================================================
  // INFER PURPOSE TESTS
  // ===========================================================================

  describe('inferPurpose()', () => {
    test('infers math purpose for arithmetic function', async () => {
      const client = createMockLLMClient(mockMathPurposeResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = await fn.inferPurpose();
      expect(result.purpose).toBe('calculation');
      expect(result.category).toBe('math');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('infers transformation purpose for filter function', async () => {
      const client = createMockLLMClient(mockTransformPurposeResponse);
      const fn = SemanticFunction.from(filterPositive, undefined, client);

      const result = await fn.inferPurpose();
      expect(result.purpose).toBe('data-transformation');
      expect(result.category).toBe('array-manipulation');
    });
  });

  // ===========================================================================
  // GENERATE DOCS TESTS
  // ===========================================================================

  describe('generateDocs()', () => {
    test('generates JSDoc by default', async () => {
      const client = createMockLLMClient(mockJSDocResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const docs = await fn.generateDocs();
      expect(docs).toContain('@param');
      expect(docs).toContain('@returns');
    });

    test('generates JSDoc format', async () => {
      const client = createMockLLMClient(mockJSDocResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const docs = await fn.generateDocs('jsdoc');
      expect(docs).toContain('/**');
      expect(docs).toContain('*/');
    });

    test('generates Markdown format', async () => {
      const client = createMockLLMClient(mockMarkdownDocResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const docs = await fn.generateDocs('markdown');
      expect(docs).toContain('##');
      expect(docs).toContain('Parameters');
    });
  });

  // ===========================================================================
  // SUGGEST IMPROVEMENTS TESTS
  // ===========================================================================

  describe('suggestImprovements()', () => {
    test('returns improvement suggestions', async () => {
      const client = createMockLLMClient(mockImprovementsResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const suggestions = await fn.suggestImprovements();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('suggestion');
      expect(suggestions[0]).toHaveProperty('reason');
    });

    test('returns empty array when no improvements needed', async () => {
      const client = createMockLLMClient(mockNoImprovementsResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const suggestions = await fn.suggestImprovements();
      expect(suggestions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // DETECT ISSUES TESTS
  // ===========================================================================

  describe('detectIssues()', () => {
    test('detects issues in function', async () => {
      const client = createMockLLMClient(mockIssuesResponse);
      const divide = (a: number, b: number) => a / b;
      const fn = SemanticFunction.from(divide, undefined, client);

      const issues = await fn.detectIssues();
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty('issue');
      expect(issues[0]).toHaveProperty('severity');
    });

    test('returns empty array when no issues found', async () => {
      const client = createMockLLMClient(mockNoIssuesResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const issues = await fn.detectIssues();
      expect(issues).toHaveLength(0);
    });

    test('includes severity levels', async () => {
      const client = createMockLLMClient(mockIssuesResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const issues = await fn.detectIssues();
      const severities = issues.map((i) => i.severity);
      expect(severities.every((s) => ['info', 'warning', 'error'].includes(s))).toBe(true);
    });
  });

  // ===========================================================================
  // GENERATE TESTS TESTS
  // ===========================================================================

  describe('generateTests()', () => {
    test('generates test cases', async () => {
      const client = createMockLLMClient(mockTestCasesResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const testCases = await fn.generateTests();
      expect(testCases.length).toBeGreaterThan(0);
      expect(testCases[0]).toHaveProperty('input');
      expect(testCases[0]).toHaveProperty('expectedOutput');
      expect(testCases[0]).toHaveProperty('description');
    });

    test('includes edge cases in generated tests', async () => {
      const client = createMockLLMClient(mockTestCasesResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const testCases = await fn.generateTests();
      const descriptions = testCases.map((t) => t.description.toLowerCase());
      expect(descriptions.some((d) => d.includes('zero') || d.includes('negative'))).toBe(true);
    });
  });

  // ===========================================================================
  // IS SAFE TO CALL TESTS
  // ===========================================================================

  describe('isSafeToCall()', () => {
    test('returns safe for valid arguments', async () => {
      const client = createMockLLMClient(mockSafeResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const result = await fn.isSafeToCall([1, 2]);
      expect(result.safe).toBe(true);
    });

    test('returns not safe for dangerous arguments', async () => {
      const client = createMockLLMClient(mockNotSafeResponse);
      const evalFn = (code: string) => code;
      const fn = SemanticFunction.from(evalFn, undefined, client);

      const result = await fn.isSafeToCall(['<script>alert("xss")</script>']);
      expect(result.safe).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('toString returns function string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const str = fn.toString();
      expect(str).toContain('a + b');
    });

    test('toJSON returns function string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      const json = fn.toJSON();
      expect(json).toContain('a + b');
    });

    test('valueOf returns original function', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const fn = SemanticFunction.from(add, undefined, client);

      expect(fn.valueOf()).toBe(add);
    });
  });

  // ===========================================================================
  // SEQUENTIAL OPERATIONS TESTS
  // ===========================================================================

  describe('sequential operations', () => {
    test('multiple operations use same client', async () => {
      const client = createSequentialMockLLMClient([
        mockExplainResponse,
        mockMathPurposeResponse,
        mockTestCasesResponse,
      ]);
      const fn = SemanticFunction.from(add, undefined, client);

      const explanation = await fn.explain();
      expect(explanation).toContain('sum');

      const purpose = await fn.inferPurpose();
      expect(purpose.purpose).toBe('calculation');

      const tests = await fn.generateTests();
      expect(tests.length).toBeGreaterThan(0);
    });
  });
});
