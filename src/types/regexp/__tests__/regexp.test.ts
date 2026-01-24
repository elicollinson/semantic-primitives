/**
 * Tests for SemanticRegExp
 */

import { describe, test, expect } from 'bun:test';
import { SemanticRegExp } from '../regexp.ts';
import {
  createMockLLMClient,
  mockEmailPatternResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockExplainResponse,
  mockMatchingTestResponse,
  mockNonMatchingTestResponse,
  mockImprovementsResponse,
  mockNoImprovementsResponse,
  mockTestCasesResponse,
  mockValidRegexResponse,
  mockRegexWithIssuesResponse,
  mockReadableResponse,
  mockRelatedPatternsResponse,
  mockEmailTypeResponse,
  mockSimplifyResponse,
  mockCannotSimplifyResponse,
} from './mocks.ts';

describe('SemanticRegExp', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('fromPattern()', () => {
    test('creates SemanticRegExp from pattern string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', 'g', client);

      expect(regex).toBeInstanceOf(SemanticRegExp);
      expect(regex.source).toBe('\\d+');
      expect(regex.flags).toBe('g');
    });

    test('creates SemanticRegExp from RegExp', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern(/\w+/gi, undefined, client);

      expect(regex.source).toBe('\\w+');
      expect(regex.flags).toBe('gi');
    });
  });

  describe('from()', () => {
    test('creates regex from natural language', async () => {
      const client = createMockLLMClient(mockEmailPatternResponse);
      const regex = await SemanticRegExp.from('email addresses', undefined, client);

      expect(regex).toBeInstanceOf(SemanticRegExp);
      expect(regex.source.length).toBeGreaterThan(0);
    });

    test('accepts options', async () => {
      const client = createMockLLMClient(mockEmailPatternResponse);
      const regex = await SemanticRegExp.from(
        'email addresses',
        { flags: 'gi', strict: true },
        client
      );

      expect(regex).toBeInstanceOf(SemanticRegExp);
    });
  });

  // ===========================================================================
  // STANDARD REGEXP OPERATIONS TESTS
  // ===========================================================================

  describe('standard regexp operations', () => {
    test('test returns true for matching string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', '', client);

      expect(regex.test('123')).toBe(true);
    });

    test('test returns false for non-matching string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', '', client);

      expect(regex.test('abc')).toBe(false);
    });

    test('exec returns match array', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('(\\d+)', '', client);

      const result = regex.exec('test 123 here');
      expect(result).not.toBeNull();
      if (result) {
        expect(result[0]).toBe('123');
      }
    });

    test('exec returns null for no match', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', '', client);

      const result = regex.exec('no numbers');
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // PROPERTIES TESTS
  // ===========================================================================

  describe('properties', () => {
    test('source returns pattern source', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('test', '', client);

      expect(regex.source).toBe('test');
    });

    test('flags returns flags', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('test', 'gi', client);

      expect(regex.flags).toBe('gi');
    });

    test('global returns global flag', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('test', 'g', client);

      expect(regex.global).toBe(true);
    });

    test('ignoreCase returns ignoreCase flag', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('test', 'i', client);

      expect(regex.ignoreCase).toBe(true);
    });

    test('multiline returns multiline flag', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('test', 'm', client);

      expect(regex.multiline).toBe(true);
    });
  });

  // ===========================================================================
  // SEMANTIC EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent regexes', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const regex1 = SemanticRegExp.fromPattern('\\d{3}', '', client);
      const regex2 = /[0-9]{3}/;

      const result = await regex1.semanticallyEquals(regex2);
      expect(result.equivalent).toBe(true);
    });

    test('returns false for different regexes', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const regex1 = SemanticRegExp.fromPattern('\\d+', '', client);
      const regex2 = /[a-z]+/;

      const result = await regex1.semanticallyEquals(regex2);
      expect(result.equivalent).toBe(false);
    });

    test('compares with another SemanticRegExp', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const regex1 = SemanticRegExp.fromPattern('\\d+', '', client);
      const regex2 = SemanticRegExp.fromPattern('[0-9]+', '', client);

      const result = await regex1.semanticallyEquals(regex2);
      expect(result.equivalent).toBe(true);
    });

    test('accepts test strings', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const regex1 = SemanticRegExp.fromPattern('\\d+', '', client);
      const regex2 = /[0-9]+/;

      const result = await regex1.semanticallyEquals(regex2, ['123', 'abc', '456']);
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // EXPLAIN TESTS
  // ===========================================================================

  describe('explain()', () => {
    test('returns explanation', async () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d{3}-\\d{4}', '', client);

      const explanation = await regex.explain();
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // TEST WITH EXPLANATION TESTS
  // ===========================================================================

  describe('testWithExplanation()', () => {
    test('returns match with explanation', async () => {
      const client = createMockLLMClient(mockMatchingTestResponse);
      const regex = SemanticRegExp.fromPattern('[\\w.]+@[\\w.]+', '', client);

      const result = await regex.testWithExplanation('test@example.com');
      expect(result.matches).toBe(true);
      expect(result.reason).toBeDefined();
      expect(result.matchedPart).toBeDefined();
    });

    test('returns non-match with explanation', async () => {
      const client = createMockLLMClient(mockNonMatchingTestResponse);
      const regex = SemanticRegExp.fromPattern('[\\w.]+@[\\w.]+', '', client);

      const result = await regex.testWithExplanation('not-an-email');
      expect(result.matches).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // ===========================================================================
  // SUGGEST IMPROVEMENTS TESTS
  // ===========================================================================

  describe('suggestImprovements()', () => {
    test('returns improvement suggestions', async () => {
      const client = createMockLLMClient(mockImprovementsResponse);
      const regex = SemanticRegExp.fromPattern('\\d{3}-\\d{4}', '', client);

      const suggestions = await regex.suggestImprovements();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('suggestion');
      expect(suggestions[0]).toHaveProperty('reason');
    });

    test('returns empty array when no improvements', async () => {
      const client = createMockLLMClient(mockNoImprovementsResponse);
      const regex = SemanticRegExp.fromPattern('^\\d+$', '', client);

      const suggestions = await regex.suggestImprovements();
      expect(suggestions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // GENERATE TEST CASES TESTS
  // ===========================================================================

  describe('generateTestCases()', () => {
    test('returns test cases', async () => {
      const client = createMockLLMClient(mockTestCasesResponse);
      const regex = SemanticRegExp.fromPattern('[\\w.]+@[\\w.]+', '', client);

      const testCases = await regex.generateTestCases();
      expect(testCases.shouldMatch).toBeInstanceOf(Array);
      expect(testCases.shouldNotMatch).toBeInstanceOf(Array);
      expect(testCases.shouldMatch.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // VALIDATE TESTS
  // ===========================================================================

  describe('validate()', () => {
    test('returns valid for good regex', async () => {
      const client = createMockLLMClient(mockValidRegexResponse);
      const regex = SemanticRegExp.fromPattern('^\\d+$', '', client);

      const result = await regex.validate();
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });

    test('returns warnings for problematic regex', async () => {
      const client = createMockLLMClient(mockRegexWithIssuesResponse);
      const regex = SemanticRegExp.fromPattern('(a+)+', '', client);

      const result = await regex.validate();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // TO READABLE TESTS
  // ===========================================================================

  describe('toReadable()', () => {
    test('returns readable format', async () => {
      const client = createMockLLMClient(mockReadableResponse);
      const regex = SemanticRegExp.fromPattern('[\\w.]+@[\\w.]+\\.[a-z]+', '', client);

      const readable = await regex.toReadable();
      expect(typeof readable).toBe('string');
      expect(readable.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // SUGGEST RELATED TESTS
  // ===========================================================================

  describe('suggestRelated()', () => {
    test('returns related patterns', async () => {
      const client = createMockLLMClient(mockRelatedPatternsResponse);
      const regex = SemanticRegExp.fromPattern('[\\w.]+@[\\w.]+', '', client);

      const suggestions = await regex.suggestRelated();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('pattern');
      expect(suggestions[0]).toHaveProperty('reason');
    });
  });

  // ===========================================================================
  // INFER DATA TYPE TESTS
  // ===========================================================================

  describe('inferDataType()', () => {
    test('infers email type', async () => {
      const client = createMockLLMClient(mockEmailTypeResponse);
      const regex = SemanticRegExp.fromPattern('[\\w.]+@[\\w.]+\\.[a-z]+', '', client);

      const result = await regex.inferDataType();
      expect(result.type).toBe('email');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  // ===========================================================================
  // SIMPLIFY TESTS
  // ===========================================================================

  describe('simplify()', () => {
    test('returns simplified regex', async () => {
      const client = createMockLLMClient(mockSimplifyResponse);
      const regex = SemanticRegExp.fromPattern('[0-9][0-9][0-9]', '', client);

      const result = await regex.simplify();
      expect(result).not.toBeNull();
      if (result) {
        expect(result.regex).toBeInstanceOf(SemanticRegExp);
        expect(result.explanation).toBeDefined();
      }
    });

    test('returns null when cannot simplify', async () => {
      const client = createMockLLMClient(mockCannotSimplifyResponse);
      const regex = SemanticRegExp.fromPattern('\\d{3}', '', client);

      const result = await regex.simplify();
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('valueOf returns RegExp', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', 'g', client);

      const underlying = regex.valueOf();
      expect(underlying).toBeInstanceOf(RegExp);
      expect(underlying.source).toBe('\\d+');
    });

    test('toString returns regex string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', 'g', client);

      expect(regex.toString()).toBe('/\\d+/g');
    });

    test('toJSON returns object', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const regex = SemanticRegExp.fromPattern('\\d+', 'gi', client);

      const json = regex.toJSON();
      expect(json).toEqual({ source: '\\d+', flags: 'gi' });
    });
  });
});
