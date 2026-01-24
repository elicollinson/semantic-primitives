import { describe, expect, test, mock } from 'bun:test';
import { SemanticNumber, type LLMClientInterface } from '../number.ts';
import type { Message } from '../../../llm/types.ts';

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
    test('parses plain numbers using LLM', async () => {
      const mockClient = createMockLLMClient({
        'number parsing': JSON.stringify({
          value: 42,
          confidence: 1.0,
          interpretation: 'Parsed "42" as numeric value 42',
        }),
      });

      const num = await SemanticNumber.from('42', undefined, mockClient);
      expect(num.valueOf()).toBe(42);
    });

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

    test('parses formatted currency using LLM', async () => {
      const mockClient = createMockLLMClient({
        'number parsing': JSON.stringify({
          value: 1234.56,
          confidence: 1.0,
          interpretation: 'Parsed currency format "$1,234.56" as 1234.56',
        }),
      });

      const num = await SemanticNumber.from('$1,234.56', undefined, mockClient);
      expect(num.valueOf()).toBe(1234.56);
    });

    test('parses abbreviations using LLM', async () => {
      const mockClient = createMockLLMClient({
        'number parsing': JSON.stringify({
          value: 2500,
          confidence: 1.0,
          interpretation: 'Parsed "2.5k" as 2500',
        }),
      });

      const num = await SemanticNumber.from('2.5k', undefined, mockClient);
      expect(num.valueOf()).toBe(2500);
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

  describe('semanticallyEquals()', () => {
    test('uses LLM for semantic comparison', async () => {
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

    test('compares with exact tolerance using LLM', async () => {
      const mockClient = createMockLLMClient({
        'number comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
          reasoning: 'Exact numeric match',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.semanticallyEquals(100, { tolerance: 'exact' });
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('returns false for different values with exact tolerance', async () => {
      const mockClient = createMockLLMClient({
        'number comparison': JSON.stringify({
          equivalent: false,
          confidence: 1.0,
          reasoning: 'Values 100 and 101 are not exactly equal',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.semanticallyEquals(101, { tolerance: 'exact' });
      expect(result.equivalent).toBe(false);
    });

    test('compares with numeric tolerance using LLM', async () => {
      const mockClient = createMockLLMClient({
        'number comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
          reasoning: 'Difference of 1 is within tolerance of 2',
        }),
      });

      const num = new SemanticNumber(100, mockClient);
      const result = await num.semanticallyEquals(99, { tolerance: 2 });
      expect(result.equivalent).toBe(true);
    });

    test('compares with SemanticNumber instances', async () => {
      const mockClient = createMockLLMClient({
        'number comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
          reasoning: 'Exact numeric match',
        }),
      });

      const num1 = new SemanticNumber(100, mockClient);
      const num2 = new SemanticNumber(100, mockClient);
      const result = await num1.semanticallyEquals(num2);
      expect(result.equivalent).toBe(true);
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

    test('converts with inferred source unit', async () => {
      const mockClient = createMockLLMClient({
        'unit conversion': JSON.stringify({
          value: 32,
          fromUnit: 'unknown',
          toUnit: 'fahrenheit',
          formula: 'C * 9/5 + 32',
        }),
      });

      const num = new SemanticNumber(0, mockClient);
      const result = await num.convert('fahrenheit');
      expect(result.valueOf()).toBe(32);
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

    test('describes small number', async () => {
      const mockClient = createMockLLMClient({
        'number description': JSON.stringify({
          description: 'three point one four',
          magnitude: 'ones',
        }),
      });

      const num = new SemanticNumber(3.14, mockClient);
      const result = await num.describe();
      expect(result).toBe('three point one four');
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
