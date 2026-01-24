/**
 * Unit tests for SemanticBigInt
 */

import { describe, test, expect } from 'bun:test';
import { SemanticBigInt } from '../bigint.ts';
import {
  createMockLLMClient,
  mockFromTrillionResponse,
  mockFromScientificResponse,
  mockFromWordsResponse,
  mockFromAbbreviatedResponse,
  mockApproximateEquivalentResponse,
  mockReasonableDatabaseIdResponse,
  mockUnreasonableNegativeIdResponse,
  mockReasonableTimestampResponse,
  mockFormatWordsResponse,
  mockFormatCompactResponse,
  mockFormatScientificResponse,
  mockDescribePopulationResponse,
  mockDescribeGenericResponse,
  mockInferDomainTimestampMsResponse,
  mockInferDomainDatabaseIdResponse,
  mockMatchesPrimeResponse,
  mockMatchesFibonacciResponse,
  mockMatchesNoMatchResponse,
} from './mocks.ts';

describe('SemanticBigInt', () => {
  describe('fromBigInt', () => {
    test('creates SemanticBigInt from positive bigint', () => {
      const sb = SemanticBigInt.fromBigInt(1234567890123456789n);
      expect(sb.valueOf()).toBe(1234567890123456789n);
    });

    test('creates SemanticBigInt from negative bigint', () => {
      const sb = SemanticBigInt.fromBigInt(-9876543210n);
      expect(sb.valueOf()).toBe(-9876543210n);
    });

    test('creates SemanticBigInt from zero', () => {
      const sb = SemanticBigInt.fromBigInt(0n);
      expect(sb.valueOf()).toBe(0n);
    });
  });

  describe('fromNumber', () => {
    test('creates SemanticBigInt from number', () => {
      const sb = SemanticBigInt.fromNumber(1234567890);
      expect(sb.valueOf()).toBe(1234567890n);
    });

    test('truncates decimal numbers', () => {
      const sb = SemanticBigInt.fromNumber(123.999);
      expect(sb.valueOf()).toBe(123n);
    });

    test('handles negative numbers', () => {
      const sb = SemanticBigInt.fromNumber(-42);
      expect(sb.valueOf()).toBe(-42n);
    });
  });

  describe('from', () => {
    test('handles bigint input directly', async () => {
      const sb = await SemanticBigInt.from(1000000000000n);
      expect(sb.valueOf()).toBe(1000000000000n);
    });

    test('handles number input directly', async () => {
      const sb = await SemanticBigInt.from(1000000);
      expect(sb.valueOf()).toBe(1000000n);
    });

    test('parses simple integer string', async () => {
      const sb = await SemanticBigInt.from('1234567890123456789');
      expect(sb.valueOf()).toBe(1234567890123456789n);
    });

    test('parses bigint literal with n suffix', async () => {
      const sb = await SemanticBigInt.from('123456789n');
      expect(sb.valueOf()).toBe(123456789n);
    });

    test('parses negative integer string', async () => {
      const sb = await SemanticBigInt.from('-9876543210');
      expect(sb.valueOf()).toBe(-9876543210n);
    });

    test('parses natural language "1 trillion" via LLM', async () => {
      const client = createMockLLMClient(mockFromTrillionResponse);
      const sb = await SemanticBigInt.from('1 trillion', client);
      expect(sb.valueOf()).toBe(1000000000000n);
    });

    test('parses scientific notation "10^18" via LLM', async () => {
      const client = createMockLLMClient(mockFromScientificResponse);
      const sb = await SemanticBigInt.from('10^18', client);
      expect(sb.valueOf()).toBe(1000000000000000000n);
    });

    test('parses word form "five billion" via LLM', async () => {
      const client = createMockLLMClient(mockFromWordsResponse);
      const sb = await SemanticBigInt.from('five billion', client);
      expect(sb.valueOf()).toBe(5000000000n);
    });

    test('parses abbreviated form "2.5M" via LLM', async () => {
      const client = createMockLLMClient(mockFromAbbreviatedResponse);
      const sb = await SemanticBigInt.from('2.5M', client);
      expect(sb.valueOf()).toBe(2500000n);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for identical bigint values (exact)', async () => {
      const sb = SemanticBigInt.fromBigInt(1000000000000n);
      const result = await sb.semanticallyEquals(1000000000000n);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('returns not equivalent for different bigint values (exact)', async () => {
      const sb = SemanticBigInt.fromBigInt(1000000000000n);
      const result = await sb.semanticallyEquals(999999999999n);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(1.0);
    });

    test('compares with SemanticBigInt instance', async () => {
      const sb1 = SemanticBigInt.fromBigInt(1234567890n);
      const sb2 = SemanticBigInt.fromBigInt(1234567890n);
      const result = await sb1.semanticallyEquals(sb2);

      expect(result.equivalent).toBe(true);
    });

    test('uses LLM for approximate comparison', async () => {
      const client = createMockLLMClient(mockApproximateEquivalentResponse);
      const sb = SemanticBigInt.fromBigInt(1000000000000n, client);
      const result = await sb.semanticallyEquals(1000000000001n, {
        tolerance: 'approximate',
      });

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeCloseTo(0.92);
    });
  });

  describe('isReasonable', () => {
    test('validates positive database ID as reasonable', async () => {
      const client = createMockLLMClient(mockReasonableDatabaseIdResponse);
      const sb = SemanticBigInt.fromBigInt(12345n, client);
      const result = await sb.isReasonable('database-id');

      expect(result.reasonable).toBe(true);
      expect(result.explanation).toContain('positive');
    });

    test('validates negative ID as unreasonable for database-id', async () => {
      const client = createMockLLMClient(mockUnreasonableNegativeIdResponse);
      const sb = SemanticBigInt.fromBigInt(-1n, client);
      const result = await sb.isReasonable('database-id');

      expect(result.reasonable).toBe(false);
      expect(result.explanation).toContain('positive');
    });

    test('validates unix timestamp as reasonable', async () => {
      const client = createMockLLMClient(mockReasonableTimestampResponse);
      const sb = SemanticBigInt.fromBigInt(1609459200n, client);
      const result = await sb.isReasonable('unix-timestamp');

      expect(result.reasonable).toBe(true);
    });
  });

  describe('format', () => {
    test('formats as words via LLM', async () => {
      const client = createMockLLMClient(mockFormatWordsResponse);
      const sb = SemanticBigInt.fromBigInt(1234567890123n, client);
      const formatted = await sb.format({ style: 'words' });

      expect(formatted).toBe('1.23 trillion');
    });

    test('formats as compact via LLM', async () => {
      const client = createMockLLMClient(mockFormatCompactResponse);
      const sb = SemanticBigInt.fromBigInt(1234567890123n, client);
      const formatted = await sb.format({ style: 'compact' });

      expect(formatted).toBe('1.23T');
    });

    test('formats as scientific via LLM', async () => {
      const client = createMockLLMClient(mockFormatScientificResponse);
      const sb = SemanticBigInt.fromBigInt(1234567890123n, client);
      const formatted = await sb.format({ style: 'scientific' });

      expect(formatted).toBe('1.23 × 10^12');
    });

    test('formats as full locally without LLM', async () => {
      const sb = SemanticBigInt.fromBigInt(1234567890123n);
      const formatted = await sb.format({ style: 'full' });

      expect(formatted).toBe('1,234,567,890,123');
    });

    test('formats negative numbers with full style', async () => {
      const sb = SemanticBigInt.fromBigInt(-9876543210n);
      const formatted = await sb.format({ style: 'full' });

      expect(formatted).toBe('-9,876,543,210');
    });

    test('uses words style by default', async () => {
      const client = createMockLLMClient(mockFormatWordsResponse);
      const sb = SemanticBigInt.fromBigInt(1234567890123n, client);
      const formatted = await sb.format();

      expect(formatted).toBe('1.23 trillion');
    });
  });

  describe('explain', () => {
    test('explains without context using local computation', async () => {
      const sb = SemanticBigInt.fromBigInt(1000000000000n);
      const explanation = await sb.explain();

      expect(explanation).toContain('13-digit');
      expect(explanation).toContain('trillion');
      expect(explanation).toContain('10^12');
    });

    test('explains with context using describe', async () => {
      const client = createMockLLMClient(mockDescribePopulationResponse);
      const sb = SemanticBigInt.fromBigInt(7900000000n, client);
      const explanation = await sb.explain('population');

      expect(explanation).toContain('world population');
    });
  });

  describe('describe', () => {
    test('describes with population context', async () => {
      const client = createMockLLMClient(mockDescribePopulationResponse);
      const sb = SemanticBigInt.fromBigInt(7900000000n, client);
      const description = await sb.describe('population');

      expect(description).toContain('world population');
    });

    test('describes without context', async () => {
      const client = createMockLLMClient(mockDescribeGenericResponse);
      const sb = SemanticBigInt.fromBigInt(1000000000000n, client);
      const description = await sb.describe();

      expect(description).toContain('trillion');
    });
  });

  describe('inferDomain', () => {
    test('infers unix-timestamp-ms domain', async () => {
      const client = createMockLLMClient(mockInferDomainTimestampMsResponse);
      const sb = SemanticBigInt.fromBigInt(1609459200000n, client);
      const result = await sb.inferDomain();

      expect(result.domain).toBe('unix-timestamp-ms');
      expect(result.confidence).toBeCloseTo(0.87);
    });

    test('infers database-id domain', async () => {
      const client = createMockLLMClient(mockInferDomainDatabaseIdResponse);
      const sb = SemanticBigInt.fromBigInt(12345n, client);
      const result = await sb.inferDomain();

      expect(result.domain).toBe('database-id');
    });
  });

  describe('matches', () => {
    describe('local patterns', () => {
      test('matches even pattern', async () => {
        const sb = SemanticBigInt.fromBigInt(1024n);
        expect(await sb.matches('even')).toBe(true);
      });

      test('matches odd pattern', async () => {
        const sb = SemanticBigInt.fromBigInt(1025n);
        expect(await sb.matches('odd')).toBe(true);
      });

      test('matches power-of-two pattern', async () => {
        const sb = SemanticBigInt.fromBigInt(1024n);
        expect(await sb.matches('power-of-two')).toBe(true);
      });

      test('does not match power-of-two for non-power', async () => {
        const sb = SemanticBigInt.fromBigInt(1000n);
        expect(await sb.matches('power-of-two')).toBe(false);
      });

      test('matches perfect-square pattern', async () => {
        const sb = SemanticBigInt.fromBigInt(144n);
        expect(await sb.matches('perfect-square')).toBe(true);
      });

      test('does not match perfect-square for non-square', async () => {
        const sb = SemanticBigInt.fromBigInt(143n);
        expect(await sb.matches('perfect-square')).toBe(false);
      });

      test('matches prime pattern for small prime', async () => {
        const sb = SemanticBigInt.fromBigInt(13n);
        expect(await sb.matches('prime')).toBe(true);
      });

      test('does not match prime for composite', async () => {
        const sb = SemanticBigInt.fromBigInt(15n);
        expect(await sb.matches('prime')).toBe(false);
      });

      test('handles edge cases for prime', async () => {
        expect(await SemanticBigInt.fromBigInt(0n).matches('prime')).toBe(false);
        expect(await SemanticBigInt.fromBigInt(1n).matches('prime')).toBe(false);
        expect(await SemanticBigInt.fromBigInt(2n).matches('prime')).toBe(true);
        expect(await SemanticBigInt.fromBigInt(3n).matches('prime')).toBe(true);
      });
    });

    describe('LLM patterns', () => {
      test('uses LLM for large prime', async () => {
        const client = createMockLLMClient(mockMatchesPrimeResponse);
        const sb = SemanticBigInt.fromBigInt(10000000019n, client);
        const result = await sb.matches('prime');

        expect(result).toBe(true);
      });

      test('uses LLM for fibonacci pattern', async () => {
        const client = createMockLLMClient(mockMatchesFibonacciResponse);
        const sb = SemanticBigInt.fromBigInt(13n, client);
        const result = await sb.matches('fibonacci');

        expect(result).toBe(true);
      });

      test('uses LLM for unknown pattern', async () => {
        const client = createMockLLMClient(mockMatchesNoMatchResponse);
        const sb = SemanticBigInt.fromBigInt(42n, client);
        const result = await sb.matches('triangular');

        expect(result).toBe(false);
      });
    });
  });

  describe('scale', () => {
    test('returns correct scale for trillion', () => {
      const sb = SemanticBigInt.fromBigInt(1000000000000n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(12);
      expect(scale.name).toBe('trillion');
      expect(scale.scientificNotation).toBe('10^12');
    });

    test('returns correct scale for billion', () => {
      const sb = SemanticBigInt.fromBigInt(5000000000n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(9);
      expect(scale.name).toBe('billion');
      expect(scale.scientificNotation).toBe('10^9');
    });

    test('returns correct scale for million', () => {
      const sb = SemanticBigInt.fromBigInt(1234567n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(6);
      expect(scale.name).toBe('million');
    });

    test('returns correct scale for thousand', () => {
      const sb = SemanticBigInt.fromBigInt(5000n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(3);
      expect(scale.name).toBe('thousand');
    });

    test('returns correct scale for small numbers', () => {
      const sb = SemanticBigInt.fromBigInt(42n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(1);
      expect(scale.name).toBe('ones');
    });

    test('returns correct scale for single digit', () => {
      const sb = SemanticBigInt.fromBigInt(5n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(0);
      expect(scale.name).toBe('ones');
    });

    test('handles negative numbers correctly', () => {
      const sb = SemanticBigInt.fromBigInt(-1000000000n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(9);
      expect(scale.name).toBe('billion');
    });

    test('returns correct scale for quadrillion', () => {
      const sb = SemanticBigInt.fromBigInt(1000000000000000n);
      const scale = sb.scale();

      expect(scale.magnitude).toBe(15);
      expect(scale.name).toBe('quadrillion');
    });
  });

  describe('valueOf', () => {
    test('returns the underlying bigint', () => {
      const sb = SemanticBigInt.fromBigInt(9876543210n);
      expect(sb.valueOf()).toBe(9876543210n);
    });
  });

  describe('toString', () => {
    test('returns string representation', () => {
      const sb = SemanticBigInt.fromBigInt(1234567890n);
      expect(sb.toString()).toBe('1234567890');
    });

    test('handles negative numbers', () => {
      const sb = SemanticBigInt.fromBigInt(-42n);
      expect(sb.toString()).toBe('-42');
    });
  });

  describe('toJSON', () => {
    test('returns JSON representation with value and scale', () => {
      const sb = SemanticBigInt.fromBigInt(1000000000000n);
      const json = sb.toJSON();

      expect(json.value).toBe('1000000000000');
      expect(json.scale.magnitude).toBe(12);
      expect(json.scale.name).toBe('trillion');
    });
  });
});

describe('SemanticBigInt prompts', () => {
  test('createFromPrompt includes input', async () => {
    const { createFromPrompt } = await import('../prompts.ts');
    const prompt = createFromPrompt('1 trillion');
    expect(prompt).toContain('Input: "1 trillion"');
  });

  test('createSemanticallyEqualsPrompt includes both values and tolerance', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt('1000', '1001', 'approximate');
    expect(prompt).toContain('Value 1: 1000');
    expect(prompt).toContain('Value 2: 1001');
    expect(prompt).toContain('Tolerance: approximate');
  });

  test('createIsReasonablePrompt includes value and domain', async () => {
    const { createIsReasonablePrompt } = await import('../prompts.ts');
    const prompt = createIsReasonablePrompt('12345', 'database-id');
    expect(prompt).toContain('Value: 12345');
    expect(prompt).toContain('Domain: "database-id"');
  });

  test('createFormatPrompt includes style and optional locale', async () => {
    const { createFormatPrompt } = await import('../prompts.ts');
    const prompt = createFormatPrompt('1000000', 'words', 'en-US');
    expect(prompt).toContain('Style: words');
    expect(prompt).toContain('Locale: en-US');
  });

  test('createDescribePrompt includes optional context', async () => {
    const { createDescribePrompt } = await import('../prompts.ts');
    const prompt = createDescribePrompt('7900000000', 'population');
    expect(prompt).toContain('Context: "population"');
  });

  test('createInferDomainPrompt includes value', async () => {
    const { createInferDomainPrompt } = await import('../prompts.ts');
    const prompt = createInferDomainPrompt('1609459200000');
    expect(prompt).toContain('Value: 1609459200000');
  });

  test('createMatchesPatternPrompt includes value and pattern', async () => {
    const { createMatchesPatternPrompt } = await import('../prompts.ts');
    const prompt = createMatchesPatternPrompt('1024', 'power-of-two');
    expect(prompt).toContain('Value: 1024');
    expect(prompt).toContain('Pattern: "power-of-two"');
  });
});
