import { describe, expect, test, mock } from 'bun:test';
import { SemanticNumber, type LLMClientInterface } from '../number.ts';
import type { Message } from '../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): LLMClientInterface {
  return {
    chat: mock(({ messages, systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
      // Find matching response based on system prompt or message content
      for (const [key, value] of Object.entries(responses)) {
        if (systemPrompt?.includes(key) || messages.some((m) => m.content.includes(key))) {
          return Promise.resolve({ content: value });
        }
      }
      // Default response
      return Promise.resolve({ content: '{"error": "No mock response found"}' });
    }),
  };
}

describe('SemanticNumber', () => {
  describe('constructor', () => {
    test('creates instance with numeric value', () => {
      const num = new SemanticNumber(42);
      expect(num.valueOf()).toBe(42);
    });

    test('creates instance with zero', () => {
      const num = new SemanticNumber(0);
      expect(num.valueOf()).toBe(0);
    });

    test('creates instance with negative value', () => {
      const num = new SemanticNumber(-10);
      expect(num.valueOf()).toBe(-10);
    });

    test('creates instance with decimal value', () => {
      const num = new SemanticNumber(3.14159);
      expect(num.valueOf()).toBe(3.14159);
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const num = new SemanticNumber(42, mockClient);
      expect(num.valueOf()).toBe(42);
    });
  });

  describe('static from()', () => {
    describe('simple parsing (no LLM)', () => {
      test('parses plain numbers', async () => {
        const num = await SemanticNumber.from('42');
        expect(num.valueOf()).toBe(42);
      });

      test('parses decimal numbers', async () => {
        const num = await SemanticNumber.from('3.14');
        expect(num.valueOf()).toBe(3.14);
      });

      test('parses negative numbers', async () => {
        const num = await SemanticNumber.from('-100');
        expect(num.valueOf()).toBe(-100);
      });

      test('parses currency format (USD)', async () => {
        const num = await SemanticNumber.from('$1,234.56');
        expect(num.valueOf()).toBe(1234.56);
      });

      test('parses thousands with commas', async () => {
        const num = await SemanticNumber.from('1,000,000');
        expect(num.valueOf()).toBe(1000000);
      });

      test('parses k suffix (thousands)', async () => {
        const num = await SemanticNumber.from('2.5k');
        expect(num.valueOf()).toBe(2500);
      });

      test('parses K suffix (thousands)', async () => {
        const num = await SemanticNumber.from('10K');
        expect(num.valueOf()).toBe(10000);
      });

      test('parses m suffix (millions)', async () => {
        const num = await SemanticNumber.from('1.5m');
        expect(num.valueOf()).toBe(1500000);
      });

      test('parses M suffix (millions)', async () => {
        const num = await SemanticNumber.from('2M');
        expect(num.valueOf()).toBe(2000000);
      });

      test('parses b suffix (billions)', async () => {
        const num = await SemanticNumber.from('1b');
        expect(num.valueOf()).toBe(1000000000);
      });
    });

    describe('LLM parsing', () => {
      test('parses word numbers using LLM', async () => {
        const mockClient = createMockLLMClient({
          'number parsing': JSON.stringify({
            value: 25,
            confidence: 0.99,
            interpretation: 'Parsed "twenty-five" as 25',
          }),
        });

        const num = await SemanticNumber.from('twenty-five', undefined, mockClient);
        expect(num.valueOf()).toBe(25);
      });

      test('parses approximate terms using LLM', async () => {
        const mockClient = createMockLLMClient({
          'number parsing': JSON.stringify({
            value: 12,
            confidence: 0.95,
            interpretation: 'Interpreted "about a dozen" as approximately 12',
          }),
        });

        const num = await SemanticNumber.from('about a dozen', undefined, mockClient);
        expect(num.valueOf()).toBe(12);
      });

      test('throws error when parsing fails', async () => {
        const mockClient = createMockLLMClient({
          'number parsing': JSON.stringify({
            value: null,
            confidence: 0,
            interpretation: 'Cannot parse "hello world" as a number',
          }),
        });

        try {
          await SemanticNumber.from('hello world', undefined, mockClient);
          expect(true).toBe(false); // Should not reach here
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Unable to parse');
        }
      });
    });
  });

  describe('semanticallyEquals()', () => {
    test('returns true for exact match with exact tolerance', async () => {
      const num = new SemanticNumber(100);
      const result = await num.semanticallyEquals(100, { tolerance: 'exact' });
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('returns false for different values with exact tolerance', async () => {
      const num = new SemanticNumber(100);
      const result = await num.semanticallyEquals(101, { tolerance: 'exact' });
      expect(result.equivalent).toBe(false);
    });

    test('uses numeric tolerance correctly', async () => {
      const num = new SemanticNumber(100);

      const withinTolerance = await num.semanticallyEquals(99, { tolerance: 2 });
      expect(withinTolerance.equivalent).toBe(true);

      const outsideTolerance = await num.semanticallyEquals(97, { tolerance: 2 });
      expect(outsideTolerance.equivalent).toBe(false);
    });

    test('compares with SemanticNumber instances', async () => {
      const num1 = new SemanticNumber(100);
      const num2 = new SemanticNumber(100);
      const result = await num1.semanticallyEquals(num2, { tolerance: 'exact' });
      expect(result.equivalent).toBe(true);
    });

    test('uses LLM for approximate tolerance', async () => {
      const mockClient = createMockLLMClient({
        'number comparison': JSON.stringify({
          equivalent: true,
          confidence: 0.95,
          reasoning: '100 and 99 are approximately equal',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.semanticallyEquals(99, { tolerance: 'approximate' });
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('isReasonable()', () => {
    test('validates reasonable human age', async () => {
      const mockClient = createMockLLMClient({
        validation: JSON.stringify({
          reasonable: true,
          explanation: '45 is a typical human age',
        }),
      });

      const num = new SemanticNumber(45, mockClient);
      const result = await num.isReasonable('human age');
      expect(result.reasonable).toBe(true);
    });

    test('validates unreasonable human age', async () => {
      const mockClient = createMockLLMClient({
        validation: JSON.stringify({
          reasonable: false,
          explanation: 'Human age rarely exceeds 120 years',
        }),
      });

      const num = new SemanticNumber(150, mockClient);
      const result = await num.isReasonable('human age');
      expect(result.reasonable).toBe(false);
      expect(result.explanation).toContain('120');
    });

    test('validates negative quantity', async () => {
      const mockClient = createMockLLMClient({
        validation: JSON.stringify({
          reasonable: false,
          explanation: 'Quantity cannot be negative',
        }),
      });

      const num = new SemanticNumber(-5, mockClient);
      const result = await num.isReasonable('quantity of items');
      expect(result.reasonable).toBe(false);
    });
  });

  describe('inferUnit()', () => {
    test('infers temperature unit', async () => {
      const mockClient = createMockLLMClient({
        'unit inference': JSON.stringify({
          unit: 'fahrenheit',
          confidence: 0.85,
          reasoning: '72 is typical room temperature in Fahrenheit',
        }),
      });

      const num = new SemanticNumber(72, mockClient);
      const result = await num.inferUnit('body temperature');
      expect(result.unit).toBe('fahrenheit');
      expect(result.confidence).toBe(0.85);
    });

    test('infers speed unit for Europe', async () => {
      const mockClient = createMockLLMClient({
        'unit inference': JSON.stringify({
          unit: 'km/h',
          confidence: 0.92,
          reasoning: 'European speed limits are measured in km/h',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.inferUnit('speed limit in Europe');
      expect(result.unit).toBe('km/h');
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('convert()', () => {
    test('converts temperature from Fahrenheit to Celsius', async () => {
      const mockClient = createMockLLMClient({
        'unit conversion': JSON.stringify({
          value: 37.78,
          fromUnit: 'fahrenheit',
          toUnit: 'celsius',
          formula: '(F - 32) * 5/9',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.convert('celsius', 'fahrenheit');
      expect(result.valueOf()).toBeCloseTo(37.78, 1);
    });

    test('converts distance from miles to kilometers', async () => {
      const mockClient = createMockLLMClient({
        'unit conversion': JSON.stringify({
          value: 160.934,
          fromUnit: 'miles',
          toUnit: 'kilometers',
          formula: 'miles * 1.60934',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.convert('kilometers', 'miles');
      expect(result.valueOf()).toBeCloseTo(160.934, 1);
    });
  });

  describe('format()', () => {
    test('formats with compact notation', () => {
      const num = new SemanticNumber(1234567);
      const formatted = num.format({ style: 'compact' });
      expect(formatted).toMatch(/1\.2M|1,2M/); // Locale-dependent
    });

    test('formats as percentage', () => {
      const num = new SemanticNumber(0.156);
      const formatted = num.format({ style: 'percent' });
      expect(formatted).toContain('16'); // Should be ~16%
    });

    test('formats as currency', () => {
      const num = new SemanticNumber(1234.56);
      const formatted = num.format({ style: 'currency', currency: 'USD' });
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });

    test('formats with full notation (default)', () => {
      const num = new SemanticNumber(1234567);
      const formatted = num.format();
      expect(formatted).toBe('1,234,567');
    });

    test('formats with different locale', () => {
      const num = new SemanticNumber(1234.56);
      const formatted = num.format({ style: 'full', locale: 'de-DE' });
      expect(formatted).toContain('1.234'); // German uses . for thousands
    });
  });

  describe('isOutlier()', () => {
    test('detects extreme outlier', () => {
      const num = new SemanticNumber(1000);
      const result = num.isOutlier([10, 12, 11, 13, 9]);
      expect(result.isOutlier).toBe(true);
      expect(result.severity).toBe('extreme');
      expect(result.zscore).toBeGreaterThan(4);
    });

    test('detects moderate outlier', () => {
      const num = new SemanticNumber(25);
      const result = num.isOutlier([10, 11, 12, 13, 14, 15]);
      expect(result.isOutlier).toBe(true);
      expect(result.severity).toBeDefined();
    });

    test('returns false for non-outlier', () => {
      const num = new SemanticNumber(12);
      const result = num.isOutlier([10, 11, 12, 13, 14]);
      expect(result.isOutlier).toBe(false);
    });

    test('handles empty dataset', () => {
      const num = new SemanticNumber(100);
      const result = num.isOutlier([]);
      expect(result.isOutlier).toBe(false);
    });

    test('handles dataset with identical values', () => {
      const num = new SemanticNumber(10);
      const result = num.isOutlier([5, 5, 5, 5, 5]);
      expect(result.isOutlier).toBe(true);
      expect(result.severity).toBe('extreme');
    });

    test('returns false when value matches identical dataset', () => {
      const num = new SemanticNumber(5);
      const result = num.isOutlier([5, 5, 5, 5, 5]);
      expect(result.isOutlier).toBe(false);
    });
  });

  describe('describe()', () => {
    test('describes large number', async () => {
      const mockClient = createMockLLMClient({
        'number description': JSON.stringify({
          description: 'one million',
          magnitude: 'millions',
        }),
      });

      const num = new SemanticNumber(1000000, mockClient);
      const result = await num.describe();
      expect(result).toBe('one million');
    });

    test('describes number with context', async () => {
      const mockClient = createMockLLMClient({
        'number description': JSON.stringify({
          description: 'one day (86,400 seconds)',
          magnitude: 'tens of thousands',
        }),
      });

      const num = new SemanticNumber(86400, mockClient);
      const result = await num.describe('seconds');
      expect(result).toContain('day');
    });
  });

  describe('matches()', () => {
    describe('even pattern', () => {
      test('returns true for even numbers', () => {
        expect(new SemanticNumber(2).matches('even')).toBe(true);
        expect(new SemanticNumber(100).matches('even')).toBe(true);
        expect(new SemanticNumber(0).matches('even')).toBe(true);
        expect(new SemanticNumber(-4).matches('even')).toBe(true);
      });

      test('returns false for odd numbers', () => {
        expect(new SemanticNumber(1).matches('even')).toBe(false);
        expect(new SemanticNumber(99).matches('even')).toBe(false);
      });

      test('returns false for non-integers', () => {
        expect(new SemanticNumber(2.5).matches('even')).toBe(false);
      });
    });

    describe('odd pattern', () => {
      test('returns true for odd numbers', () => {
        expect(new SemanticNumber(1).matches('odd')).toBe(true);
        expect(new SemanticNumber(99).matches('odd')).toBe(true);
        expect(new SemanticNumber(-3).matches('odd')).toBe(true);
      });

      test('returns false for even numbers', () => {
        expect(new SemanticNumber(2).matches('odd')).toBe(false);
      });
    });

    describe('prime pattern', () => {
      test('returns true for prime numbers', () => {
        expect(new SemanticNumber(2).matches('prime')).toBe(true);
        expect(new SemanticNumber(3).matches('prime')).toBe(true);
        expect(new SemanticNumber(7).matches('prime')).toBe(true);
        expect(new SemanticNumber(97).matches('prime')).toBe(true);
      });

      test('returns false for non-prime numbers', () => {
        expect(new SemanticNumber(1).matches('prime')).toBe(false);
        expect(new SemanticNumber(4).matches('prime')).toBe(false);
        expect(new SemanticNumber(100).matches('prime')).toBe(false);
      });

      test('returns false for negative numbers', () => {
        expect(new SemanticNumber(-7).matches('prime')).toBe(false);
      });
    });

    describe('power-of-two pattern', () => {
      test('returns true for powers of two', () => {
        expect(new SemanticNumber(1).matches('power-of-two')).toBe(true);
        expect(new SemanticNumber(2).matches('power-of-two')).toBe(true);
        expect(new SemanticNumber(16).matches('power-of-two')).toBe(true);
        expect(new SemanticNumber(1024).matches('power-of-two')).toBe(true);
      });

      test('returns false for non-powers of two', () => {
        expect(new SemanticNumber(3).matches('power-of-two')).toBe(false);
        expect(new SemanticNumber(100).matches('power-of-two')).toBe(false);
      });

      test('returns false for zero and negative numbers', () => {
        expect(new SemanticNumber(0).matches('power-of-two')).toBe(false);
        expect(new SemanticNumber(-2).matches('power-of-two')).toBe(false);
      });
    });

    describe('positive/negative/zero patterns', () => {
      test('matches positive correctly', () => {
        expect(new SemanticNumber(1).matches('positive')).toBe(true);
        expect(new SemanticNumber(0).matches('positive')).toBe(false);
        expect(new SemanticNumber(-1).matches('positive')).toBe(false);
      });

      test('matches negative correctly', () => {
        expect(new SemanticNumber(-1).matches('negative')).toBe(true);
        expect(new SemanticNumber(0).matches('negative')).toBe(false);
        expect(new SemanticNumber(1).matches('negative')).toBe(false);
      });

      test('matches zero correctly', () => {
        expect(new SemanticNumber(0).matches('zero')).toBe(true);
        expect(new SemanticNumber(1).matches('zero')).toBe(false);
      });
    });

    describe('integer/decimal patterns', () => {
      test('matches integer correctly', () => {
        expect(new SemanticNumber(42).matches('integer')).toBe(true);
        expect(new SemanticNumber(3.14).matches('integer')).toBe(false);
      });

      test('matches decimal correctly', () => {
        expect(new SemanticNumber(3.14).matches('decimal')).toBe(true);
        expect(new SemanticNumber(42).matches('decimal')).toBe(false);
      });

      test('matches float correctly', () => {
        expect(new SemanticNumber(3.14).matches('float')).toBe(true);
        expect(new SemanticNumber(42).matches('float')).toBe(false);
      });
    });

    describe('perfect-square pattern', () => {
      test('returns true for perfect squares', () => {
        expect(new SemanticNumber(0).matches('perfect-square')).toBe(true);
        expect(new SemanticNumber(1).matches('perfect-square')).toBe(true);
        expect(new SemanticNumber(4).matches('perfect-square')).toBe(true);
        expect(new SemanticNumber(16).matches('perfect-square')).toBe(true);
        expect(new SemanticNumber(100).matches('perfect-square')).toBe(true);
      });

      test('returns false for non-perfect squares', () => {
        expect(new SemanticNumber(2).matches('perfect-square')).toBe(false);
        expect(new SemanticNumber(3).matches('perfect-square')).toBe(false);
        expect(new SemanticNumber(-4).matches('perfect-square')).toBe(false);
      });
    });

    describe('fibonacci pattern', () => {
      test('returns true for fibonacci numbers', () => {
        expect(new SemanticNumber(0).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(1).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(2).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(3).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(5).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(8).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(13).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(21).matches('fibonacci')).toBe(true);
        expect(new SemanticNumber(144).matches('fibonacci')).toBe(true);
      });

      test('returns false for non-fibonacci numbers', () => {
        expect(new SemanticNumber(4).matches('fibonacci')).toBe(false);
        expect(new SemanticNumber(6).matches('fibonacci')).toBe(false);
        expect(new SemanticNumber(7).matches('fibonacci')).toBe(false);
      });
    });

    describe('pattern normalization', () => {
      test('handles different case', () => {
        expect(new SemanticNumber(16).matches('Power-Of-Two')).toBe(true);
        expect(new SemanticNumber(16).matches('POWER-OF-TWO')).toBe(true);
      });

      test('handles underscores', () => {
        expect(new SemanticNumber(16).matches('power_of_two')).toBe(true);
      });

      test('handles spaces', () => {
        expect(new SemanticNumber(16).matches('power of two')).toBe(true);
      });
    });

    test('throws error for unknown pattern', () => {
      expect(() => new SemanticNumber(5).matches('unknown-pattern')).toThrow('Unknown pattern');
    });
  });

  describe('valueOf()', () => {
    test('returns underlying number value', () => {
      expect(new SemanticNumber(42).valueOf()).toBe(42);
      expect(new SemanticNumber(-3.14).valueOf()).toBe(-3.14);
      expect(new SemanticNumber(0).valueOf()).toBe(0);
    });
  });

  describe('toString()', () => {
    test('returns string representation', () => {
      expect(new SemanticNumber(42).toString()).toBe('42');
      expect(new SemanticNumber(3.14).toString()).toBe('3.14');
    });
  });

  describe('toJSON()', () => {
    test('returns number for JSON serialization', () => {
      const num = new SemanticNumber(42);
      expect(JSON.stringify({ value: num })).toBe('{"value":42}');
    });
  });
});
