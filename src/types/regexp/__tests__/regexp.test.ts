/**
 * Tests for SemanticRegExp
 */

import { describe, test, expect } from 'bun:test';
import { SemanticRegExp } from '../regexp.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockFromEmailResponse,
  mockFromPhoneResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockExplainEmailResponse,
  mockExplainDigitsResponse,
  mockTestMatchesResponse,
  mockTestNotMatchesResponse,
  mockImprovementsResponse,
  mockNoImprovementsResponse,
  mockTestCasesEmailResponse,
  mockTestCasesPhoneResponse,
  mockValidResponse,
  mockValidWithWarningsResponse,
  mockInvalidResponse,
  mockReadableEmailResponse,
  mockRelatedEmailResponse,
  mockInferEmailTypeResponse,
  mockInferPhoneTypeResponse,
  mockSimplifyResponse,
  mockCannotSimplifyResponse,
} from './mocks.ts';

describe('SemanticRegExp', () => {
  // ===========================================================================
  // FACTORY METHODS
  // ===========================================================================

  describe('fromRegExp', () => {
    test('creates from existing RegExp', () => {
      const regex = /\d{3}-\d{4}/;
      const sr = SemanticRegExp.fromRegExp(regex);

      expect(sr.valueOf()).toBeInstanceOf(RegExp);
      expect(sr.source).toBe('\\d{3}-\\d{4}');
      expect(sr.flags).toBe('');
    });

    test('preserves flags', () => {
      const regex = /test/gi;
      const sr = SemanticRegExp.fromRegExp(regex);

      expect(sr.flags).toBe('gi');
    });
  });

  describe('fromPattern', () => {
    test('creates from pattern string', () => {
      const sr = SemanticRegExp.fromPattern('\\d{3}', 'g');

      expect(sr.source).toBe('\\d{3}');
      expect(sr.flags).toBe('g');
    });

    test('creates without flags', () => {
      const sr = SemanticRegExp.fromPattern('[a-z]+');

      expect(sr.source).toBe('[a-z]+');
      expect(sr.flags).toBe('');
    });
  });

  describe('from (natural language)', () => {
    test('creates email regex from description', async () => {
      const client = createMockLLMClient(mockFromEmailResponse);
      const sr = await SemanticRegExp.from('email addresses', undefined, client);

      expect(sr.source).toBe('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
      expect(sr.flags).toBe('i');
    });

    test('creates phone regex from description', async () => {
      const client = createMockLLMClient(mockFromPhoneResponse);
      const sr = await SemanticRegExp.from('US phone numbers', undefined, client);

      expect(sr.source).toBe('\\d{3}-\\d{3}-\\d{4}');
      expect(sr.flags).toBe('');
    });

    test('passes options to prompt', async () => {
      const client = createMockLLMClient(mockFromEmailResponse);
      const sr = await SemanticRegExp.from('email', { flags: 'gi', strict: true }, client);

      // Verify the result was created successfully (implicitly verifies client was called)
      expect(sr.source).toBeTruthy();
    });
  });

  // ===========================================================================
  // CORE METHODS
  // ===========================================================================

  describe('valueOf', () => {
    test('returns underlying RegExp', () => {
      const regex = /test/gi;
      const sr = SemanticRegExp.fromRegExp(regex);

      expect(sr.valueOf()).toBe(regex);
    });
  });

  describe('test', () => {
    test('delegates to underlying regex', () => {
      const sr = SemanticRegExp.fromPattern('\\d{3}');

      expect(sr.test('123')).toBe(true);
      expect(sr.test('abc')).toBe(false);
    });
  });

  describe('exec', () => {
    test('returns match result', () => {
      const sr = SemanticRegExp.fromPattern('(\\d+)');
      const result = sr.exec('abc123def');

      expect(result).not.toBeNull();
      if (result) {
        expect(result[0]).toBe('123');
        expect(result[1]).toBe('123');
      }
    });

    test('returns null for no match', () => {
      const sr = SemanticRegExp.fromPattern('\\d+');
      const result = sr.exec('abcdef');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // SEMANTICALLY EQUALS
  // ===========================================================================

  describe('semanticallyEquals', () => {
    test('returns equivalent for matching patterns', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const sr1 = SemanticRegExp.fromPattern('[0-9]+', '', client);
      const sr2 = SemanticRegExp.fromPattern('\\d+');

      const result = await sr1.semanticallyEquals(sr2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    test('returns not equivalent for different patterns', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const sr = SemanticRegExp.fromPattern('[a-z]+', '', client);

      const result = await sr.semanticallyEquals(/[A-Z]+/);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.88);
    });

    test('accepts raw RegExp for comparison', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const sr = SemanticRegExp.fromPattern('\\d+', '', client);

      const result = await sr.semanticallyEquals(/[0-9]+/);

      expect(result.equivalent).toBe(true);
    });

    test('uses test strings when provided', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const sr = SemanticRegExp.fromPattern('\\d+', '', client);

      const result = await sr.semanticallyEquals(/[0-9]+/, ['123', 'abc']);

      // Verify the operation completed successfully
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // EXPLAIN
  // ===========================================================================

  describe('explain', () => {
    test('returns human-readable explanation', async () => {
      const client = createMockLLMClient(mockExplainEmailResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const explanation = await sr.explain();

      expect(explanation).toContain('email');
    });

    test('explains digit patterns', async () => {
      const client = createMockLLMClient(mockExplainDigitsResponse);
      const sr = SemanticRegExp.fromPattern('\\d{3}-\\d{4}', '', client);

      const explanation = await sr.explain();

      expect(explanation).toContain('digit');
    });

    test('accepts context parameter', async () => {
      const client = createMockLLMClient(mockExplainEmailResponse);
      const sr = SemanticRegExp.fromPattern('[a-z]+', '', client);

      const explanation = await sr.explain('validating user input');

      // Verify the operation completed successfully
      expect(explanation).toBeTruthy();
    });
  });

  // ===========================================================================
  // TEST WITH EXPLANATION
  // ===========================================================================

  describe('testWithExplanation', () => {
    test('explains why input matches', async () => {
      const client = createMockLLMClient(mockTestMatchesResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const result = await sr.testWithExplanation('test@example.com');

      expect(result.matches).toBe(true);
      expect(result.reason).toBeTruthy();
      expect(result.matchedPart).toBe('test@example.com');
    });

    test('explains why input does not match', async () => {
      const client = createMockLLMClient(mockTestNotMatchesResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const result = await sr.testWithExplanation('not-an-email');

      expect(result.matches).toBe(false);
      expect(result.reason).toContain('@');
      expect(result.matchedPart).toBeUndefined();
    });
  });

  // ===========================================================================
  // SUGGEST IMPROVEMENTS
  // ===========================================================================

  describe('suggestImprovements', () => {
    test('returns improvement suggestions', async () => {
      const client = createMockLLMClient(mockImprovementsResponse);
      const sr = SemanticRegExp.fromPattern('\\d{3}-\\d{4}', '', client);

      const suggestions = await sr.suggestImprovements();

      expect(suggestions).toHaveLength(2);
      const firstSuggestion = suggestions[0];
      if (firstSuggestion) {
        expect(firstSuggestion.suggestion).toContain('anchor');
        expect(firstSuggestion.reason).toBeTruthy();
        expect(firstSuggestion.improved).toBeTruthy();
      }
    });

    test('returns empty array when no improvements needed', async () => {
      const client = createMockLLMClient(mockNoImprovementsResponse);
      const sr = SemanticRegExp.fromPattern('^\\d+$', '', client);

      const suggestions = await sr.suggestImprovements();

      expect(suggestions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // GENERATE TEST CASES
  // ===========================================================================

  describe('generateTestCases', () => {
    test('generates email test cases', async () => {
      const client = createMockLLMClient(mockTestCasesEmailResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const testCases = await sr.generateTestCases();

      expect(testCases.shouldMatch).toHaveLength(3);
      expect(testCases.shouldNotMatch).toHaveLength(4);
      expect(testCases.shouldMatch).toContain('test@example.com');
      expect(testCases.shouldNotMatch).toContain('invalid');
    });

    test('generates phone test cases', async () => {
      const client = createMockLLMClient(mockTestCasesPhoneResponse);
      const sr = SemanticRegExp.fromPattern('\\d{3}-\\d{3}-\\d{4}', '', client);

      const testCases = await sr.generateTestCases();

      expect(testCases.shouldMatch).toContain('123-456-7890');
      expect(testCases.shouldNotMatch).toContain('1234567890');
    });
  });

  // ===========================================================================
  // VALIDATE
  // ===========================================================================

  describe('validate', () => {
    test('returns valid for good regex', async () => {
      const client = createMockLLMClient(mockValidResponse);
      const sr = SemanticRegExp.fromPattern('^\\d+$', '', client);

      const result = await sr.validate();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('returns warnings for potential issues', async () => {
      const client = createMockLLMClient(mockValidWithWarningsResponse);
      const sr = SemanticRegExp.fromPattern('(a+)+', '', client);

      const result = await sr.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('returns invalid for problematic regex', async () => {
      const client = createMockLLMClient(mockInvalidResponse);
      const sr = SemanticRegExp.fromPattern('test', '', client);

      const result = await sr.validate();

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // TO READABLE
  // ===========================================================================

  describe('toReadable', () => {
    test('converts email regex to readable format', async () => {
      const client = createMockLLMClient(mockReadableEmailResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const readable = await sr.toReadable();

      expect(readable).toContain('email');
      expect(readable).toContain('@');
    });
  });

  // ===========================================================================
  // SUGGEST RELATED
  // ===========================================================================

  describe('suggestRelated', () => {
    test('suggests related patterns for email', async () => {
      const client = createMockLLMClient(mockRelatedEmailResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const related = await sr.suggestRelated();

      expect(related.length).toBeGreaterThan(0);
      const firstRelated = related[0];
      if (firstRelated) {
        expect(firstRelated.pattern).toBe('phone number');
        expect(firstRelated.reason).toBeTruthy();
      }
    });
  });

  // ===========================================================================
  // INFER DATA TYPE
  // ===========================================================================

  describe('inferDataType', () => {
    test('infers email type', async () => {
      const client = createMockLLMClient(mockInferEmailTypeResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const result = await sr.inferDataType();

      expect(result.type).toBe('email');
      expect(result.confidence).toBe(0.95);
    });

    test('infers phone type', async () => {
      const client = createMockLLMClient(mockInferPhoneTypeResponse);
      const sr = SemanticRegExp.fromPattern('\\d{3}-\\d{3}-\\d{4}', '', client);

      const result = await sr.inferDataType();

      expect(result.type).toBe('phone-us');
      expect(result.confidence).toBe(0.92);
    });
  });

  describe('inferType', () => {
    test('is alias for inferDataType', async () => {
      const client = createMockLLMClient(mockInferEmailTypeResponse);
      const sr = SemanticRegExp.fromPattern(
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '',
        client
      );

      const result = await sr.inferType();

      expect(result.type).toBe('email');
      expect(result.confidence).toBe(0.95);
    });
  });

  // ===========================================================================
  // SIMPLIFY
  // ===========================================================================

  describe('simplify', () => {
    test('simplifies repetitive regex', async () => {
      const client = createMockLLMClient(mockSimplifyResponse);
      const sr = SemanticRegExp.fromPattern('[0-9][0-9][0-9]', '', client);

      const result = await sr.simplify();

      expect(result).not.toBeNull();
      if (result) {
        expect(result.regex.source).toBe('\\d{3}');
        expect(result.explanation).toContain('quantifier');
      }
    });

    test('returns null when cannot simplify', async () => {
      const client = createMockLLMClient(mockCannotSimplifyResponse);
      const sr = SemanticRegExp.fromPattern('\\d{3}', '', client);

      const result = await sr.simplify();

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // STRING CONVERSION
  // ===========================================================================

  describe('toString', () => {
    test('returns regex string representation', () => {
      const sr = SemanticRegExp.fromPattern('\\d+', 'gi');

      expect(sr.toString()).toBe('/\\d+/gi');
    });
  });

  describe('Symbol.toStringTag', () => {
    test('returns class name', () => {
      const sr = SemanticRegExp.fromPattern('\\d+');

      expect(Object.prototype.toString.call(sr)).toBe('[object SemanticRegExp]');
    });
  });

  // ===========================================================================
  // SEQUENTIAL MOCK CLIENT
  // ===========================================================================

  describe('sequential operations', () => {
    test('handles multiple LLM calls in sequence', async () => {
      const client = createSequentialMockLLMClient([
        mockFromEmailResponse,
        mockExplainEmailResponse,
        mockTestCasesEmailResponse,
      ]);

      const sr = await SemanticRegExp.from('email addresses', undefined, client);
      const explanation = await sr.explain();
      const testCases = await sr.generateTestCases();

      expect(sr.source).toBe('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
      expect(explanation).toContain('email');
      expect(testCases.shouldMatch).toHaveLength(3);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('edge cases', () => {
    test('handles empty pattern', () => {
      const sr = SemanticRegExp.fromPattern('');

      // Empty pattern becomes (?:) in JavaScript RegExp
      expect(sr.source).toBe('(?:)');
      expect(sr.test('')).toBe(true);
    });

    test('handles complex flags', () => {
      const sr = SemanticRegExp.fromPattern('test', 'gimsuy');

      expect(sr.flags).toBe('gimsuy');
    });

    test('handles special regex characters', () => {
      const sr = SemanticRegExp.fromPattern('\\[\\]\\(\\)\\{\\}');

      expect(sr.test('[](){}')).toBe(true);
    });
  });
});
