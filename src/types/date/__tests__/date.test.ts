import { describe, expect, test, mock } from 'bun:test';
import { SemanticDate, type DateLLMClientInterface } from '../date.ts';
import type { Message } from '../../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): DateLLMClientInterface {
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

describe('SemanticDate', () => {
  describe('constructor', () => {
    test('creates instance with Date value', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date);
      expect(semanticDate.getTime()).toBe(date.getTime());
    });

    test('creates a copy of the input date (immutable)', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date);
      date.setFullYear(2025);
      expect(semanticDate.getFullYear()).toBe(2024);
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date, mockClient);
      expect(semanticDate.getTime()).toBe(date.getTime());
    });
  });

  describe('static from()', () => {
    test('wraps Date object directly', async () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = await SemanticDate.from(date);
      expect(semanticDate.getTime()).toBe(date.getTime());
    });

    test('parses natural language date using LLM', async () => {
      const mockClient = createMockLLMClient({
        'date parsing': JSON.stringify({
          date: '2024-01-19T00:00:00Z',
          confidence: 0.95,
          interpretation: 'Parsed "next Friday" relative to reference date',
        }),
      });

      const semanticDate = await SemanticDate.from(
        'next Friday',
        { referenceDate: new Date('2024-01-15T12:00:00Z') },
        mockClient
      );
      expect(semanticDate.toISOString()).toBe('2024-01-19T00:00:00.000Z');
    });

    test('parses relative expressions', async () => {
      const mockClient = createMockLLMClient({
        'date parsing': JSON.stringify({
          date: '2024-01-01T12:00:00Z',
          confidence: 0.98,
          interpretation: 'Parsed "two weeks ago" as 14 days before reference',
        }),
      });

      const semanticDate = await SemanticDate.from(
        'two weeks ago',
        { referenceDate: new Date('2024-01-15T12:00:00Z') },
        mockClient
      );
      expect(semanticDate.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    });

    test('parses quarter references', async () => {
      const mockClient = createMockLLMClient({
        'date parsing': JSON.stringify({
          date: '2024-10-01T00:00:00Z',
          confidence: 0.99,
          interpretation: 'Q4 2024 starts October 1, 2024',
        }),
      });

      const semanticDate = await SemanticDate.from('Q4 2024', undefined, mockClient);
      expect(semanticDate.getFullYear()).toBe(2024);
      expect(semanticDate.getMonth()).toBe(9); // October (0-indexed)
    });

    test('throws error when parsing fails', async () => {
      const mockClient = createMockLLMClient({
        'date parsing': JSON.stringify({
          date: null,
          confidence: 0,
          interpretation: 'Cannot parse "gibberish" as a date',
        }),
      });

      try {
        await SemanticDate.from('gibberish', undefined, mockClient);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Unable to parse');
      }
    });

    test('respects timezone option', async () => {
      const mockClient = createMockLLMClient({
        'date parsing': JSON.stringify({
          date: '2024-01-15T08:00:00Z',
          confidence: 0.95,
          interpretation: 'Noon in PST is 8pm UTC',
        }),
      });

      const semanticDate = await SemanticDate.from(
        'noon',
        { referenceDate: new Date('2024-01-15T00:00:00Z'), timezone: 'America/Los_Angeles' },
        mockClient
      );
      expect(semanticDate).toBeInstanceOf(SemanticDate);
    });
  });

  describe('semanticallyEquals()', () => {
    test('compares dates at day precision', async () => {
      const mockClient = createMockLLMClient({
        'date comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
        }),
      });

      const date1 = new SemanticDate(new Date('2024-01-15T10:00:00Z'), mockClient);
      const date2 = new Date('2024-01-15T20:00:00Z');
      const result = await date1.semanticallyEquals(date2, { precision: 'day' });
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('compares dates at exact precision', async () => {
      const mockClient = createMockLLMClient({
        'date comparison': JSON.stringify({
          equivalent: false,
          confidence: 1.0,
        }),
      });

      const date1 = new SemanticDate(new Date('2024-01-15T10:00:00Z'), mockClient);
      const date2 = new Date('2024-01-15T10:00:01Z');
      const result = await date1.semanticallyEquals(date2, { precision: 'exact' });
      expect(result.equivalent).toBe(false);
    });

    test('compares with SemanticDate instances', async () => {
      const mockClient = createMockLLMClient({
        'date comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
        }),
      });

      const date1 = new SemanticDate(new Date('2024-01-15T10:00:00Z'), mockClient);
      const date2 = new SemanticDate(new Date('2024-01-15T10:00:00Z'), mockClient);
      const result = await date1.semanticallyEquals(date2);
      expect(result.equivalent).toBe(true);
    });

    test('compares at year precision', async () => {
      const mockClient = createMockLLMClient({
        'date comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
        }),
      });

      const date1 = new SemanticDate(new Date('2024-01-15T10:00:00Z'), mockClient);
      const date2 = new Date('2024-12-31T23:59:59Z');
      const result = await date1.semanticallyEquals(date2, { precision: 'year' });
      expect(result.equivalent).toBe(true);
    });

    test('compares at month precision', async () => {
      const mockClient = createMockLLMClient({
        'date comparison': JSON.stringify({
          equivalent: true,
          confidence: 1.0,
        }),
      });

      const date1 = new SemanticDate(new Date('2024-01-01T00:00:00Z'), mockClient);
      const date2 = new Date('2024-01-31T23:59:59Z');
      const result = await date1.semanticallyEquals(date2, { precision: 'month' });
      expect(result.equivalent).toBe(true);
    });
  });

  describe('describe()', () => {
    test('describes date with smart style by default', async () => {
      const mockClient = createMockLLMClient({
        'date description': JSON.stringify({
          description: '3 days ago',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-12T12:00:00Z'), mockClient);
      const result = await date.describe();
      expect(result).toBe('3 days ago');
    });

    test('describes date with relative style', async () => {
      const mockClient = createMockLLMClient({
        'date description': JSON.stringify({
          description: 'in 2 weeks',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-29T12:00:00Z'), mockClient);
      const result = await date.describe('relative');
      expect(result).toBe('in 2 weeks');
    });

    test('describes date with absolute style', async () => {
      const mockClient = createMockLLMClient({
        'date description': JSON.stringify({
          description: 'January 15, 2024',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.describe('absolute');
      expect(result).toBe('January 15, 2024');
    });
  });

  describe('formatFor()', () => {
    test('formats for formal business document', async () => {
      const mockClient = createMockLLMClient({
        'date formatting': JSON.stringify({
          formatted: 'January 15, 2024',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.formatFor('formal business document');
      expect(result).toBe('January 15, 2024');
    });

    test('formats for casual chat', async () => {
      const mockClient = createMockLLMClient({
        'date formatting': JSON.stringify({
          formatted: 'Jan 15',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.formatFor('casual chat');
      expect(result).toBe('Jan 15');
    });

    test('formats for API response', async () => {
      const mockClient = createMockLLMClient({
        'date formatting': JSON.stringify({
          formatted: '2024-01-15T12:00:00.000Z',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.formatFor('API response');
      expect(result).toBe('2024-01-15T12:00:00.000Z');
    });
  });

  describe('isIn()', () => {
    test('checks if date is in "this week"', async () => {
      const mockClient = createMockLLMClient({
        'date period': JSON.stringify({
          inPeriod: true,
          confidence: 0.95,
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.isIn('this week');
      expect(result).toBe(true);
    });

    test('checks if date is in "business hours"', async () => {
      const mockClient = createMockLLMClient({
        'date period': JSON.stringify({
          inPeriod: true,
          confidence: 0.90,
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T14:00:00Z'), mockClient);
      const result = await date.isIn('business hours');
      expect(result).toBe(true);
    });

    test('checks if date is in "holiday season"', async () => {
      const mockClient = createMockLLMClient({
        'date period': JSON.stringify({
          inPeriod: true,
          confidence: 0.88,
        }),
      });

      const date = new SemanticDate(new Date('2024-12-25T12:00:00Z'), mockClient);
      const result = await date.isIn('holiday season');
      expect(result).toBe(true);
    });

    test('returns false when date is not in period', async () => {
      const mockClient = createMockLLMClient({
        'date period': JSON.stringify({
          inPeriod: false,
          confidence: 0.95,
        }),
      });

      const date = new SemanticDate(new Date('2024-07-15T12:00:00Z'), mockClient);
      const result = await date.isIn('holiday season');
      expect(result).toBe(false);
    });
  });

  describe('next()', () => {
    test('finds next Monday', async () => {
      const mockClient = createMockLLMClient({
        'next occurrence': JSON.stringify({
          date: '2024-01-22T00:00:00Z',
          description: 'Next Monday after January 15, 2024',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.next('Monday');
      expect(result).toBeInstanceOf(SemanticDate);
      expect(result.getDay()).toBe(1); // Monday
    });

    test('finds next business day', async () => {
      const mockClient = createMockLLMClient({
        'next occurrence': JSON.stringify({
          date: '2024-01-15T00:00:00Z',
          description: 'Next business day is Monday, January 15',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-13T12:00:00Z'), mockClient); // Saturday
      const result = await date.next('business day');
      expect(result).toBeInstanceOf(SemanticDate);
    });

    test('finds next end of month', async () => {
      const mockClient = createMockLLMClient({
        'next occurrence': JSON.stringify({
          date: '2024-01-31T23:59:59Z',
          description: 'End of January 2024',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.next('end of month');
      expect(result).toBeInstanceOf(SemanticDate);
      expect(result.getDate()).toBe(31);
    });
  });

  describe('previous()', () => {
    test('finds previous payday', async () => {
      const mockClient = createMockLLMClient({
        'previous occurrence': JSON.stringify({
          date: '2024-01-01T00:00:00Z',
          description: 'Previous payday (1st of month)',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.previous('payday');
      expect(result).toBeInstanceOf(SemanticDate);
    });

    test('finds previous quarter start', async () => {
      const mockClient = createMockLLMClient({
        'previous occurrence': JSON.stringify({
          date: '2024-01-01T00:00:00Z',
          description: 'Start of Q1 2024',
        }),
      });

      const date = new SemanticDate(new Date('2024-02-15T12:00:00Z'), mockClient);
      const result = await date.previous('quarter start');
      expect(result).toBeInstanceOf(SemanticDate);
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('durationTo()', () => {
    test('calculates duration between dates', async () => {
      const mockClient = createMockLLMClient({
        'duration calculation': JSON.stringify({
          description: 'about 2 weeks',
          days: 14,
          businessDays: 10,
        }),
      });

      const startDate = new SemanticDate(new Date('2024-01-01T12:00:00Z'), mockClient);
      const endDate = new Date('2024-01-15T12:00:00Z');
      const result = await startDate.durationTo(endDate);
      expect(result.description).toBe('about 2 weeks');
      expect(result.days).toBe(14);
      expect(result.businessDays).toBe(10);
    });

    test('calculates duration to SemanticDate', async () => {
      const mockClient = createMockLLMClient({
        'duration calculation': JSON.stringify({
          description: '1 month',
          days: 31,
          businessDays: 23,
        }),
      });

      const startDate = new SemanticDate(new Date('2024-01-01T12:00:00Z'), mockClient);
      const endDate = new SemanticDate(new Date('2024-02-01T12:00:00Z'), mockClient);
      const result = await startDate.durationTo(endDate);
      expect(result.description).toBe('1 month');
      expect(result.days).toBe(31);
    });
  });

  describe('isReasonable()', () => {
    test('validates reasonable birth date', async () => {
      const mockClient = createMockLLMClient({
        'date validation': JSON.stringify({
          reasonable: true,
          reason: null,
        }),
      });

      const date = new SemanticDate(new Date('1990-05-15T12:00:00Z'), mockClient);
      const result = await date.isReasonable('birth date');
      expect(result.reasonable).toBe(true);
    });

    test('validates unreasonable future birth date', async () => {
      const mockClient = createMockLLMClient({
        'date validation': JSON.stringify({
          reasonable: false,
          reason: 'Date is in the future',
        }),
      });

      const date = new SemanticDate(new Date('2030-01-15T12:00:00Z'), mockClient);
      const result = await date.isReasonable('birth date');
      expect(result.reasonable).toBe(false);
      expect(result.reason).toContain('future');
    });

    test('validates unreasonable ancient birth date', async () => {
      const mockClient = createMockLLMClient({
        'date validation': JSON.stringify({
          reasonable: false,
          reason: 'Date is too far in the past for a living person',
        }),
      });

      const date = new SemanticDate(new Date('1800-01-15T12:00:00Z'), mockClient);
      const result = await date.isReasonable('birth date');
      expect(result.reasonable).toBe(false);
    });
  });

  describe('add()', () => {
    test('adds business days', async () => {
      const mockClient = createMockLLMClient({
        'date arithmetic': JSON.stringify({
          date: '2024-01-17T12:00:00Z',
          interpretation: 'Added 2 business days, skipping weekend',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.add('2 business days');
      expect(result).toBeInstanceOf(SemanticDate);
    });

    test('adds 1 quarter', async () => {
      const mockClient = createMockLLMClient({
        'date arithmetic': JSON.stringify({
          date: '2024-04-15T12:00:00Z',
          interpretation: 'Added 1 quarter (3 months)',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.add('1 quarter');
      expect(result).toBeInstanceOf(SemanticDate);
      expect(result.getMonth()).toBe(3); // April
    });

    test('adds standard duration', async () => {
      const mockClient = createMockLLMClient({
        'date arithmetic': JSON.stringify({
          date: '2024-01-22T12:00:00Z',
          interpretation: 'Added 1 week',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.add('1 week');
      expect(result).toBeInstanceOf(SemanticDate);
    });
  });

  describe('inferMeaning()', () => {
    test('infers Christmas Day', async () => {
      const mockClient = createMockLLMClient({
        'date meaning': JSON.stringify({
          meaning: 'Christmas Day',
          type: 'holiday',
          confidence: 0.98,
        }),
      });

      const date = new SemanticDate(new Date('2024-12-25T12:00:00Z'), mockClient);
      const result = await date.inferMeaning();
      expect(result.meaning).toBe('Christmas Day');
      expect(result.type).toBe('holiday');
      expect(result.confidence).toBe(0.98);
    });

    test('infers New Years Day', async () => {
      const mockClient = createMockLLMClient({
        'date meaning': JSON.stringify({
          meaning: "New Year's Day",
          type: 'holiday',
          confidence: 0.99,
        }),
      });

      const date = new SemanticDate(new Date('2024-01-01T12:00:00Z'), mockClient);
      const result = await date.inferMeaning();
      expect(result.meaning).toBe("New Year's Day");
      expect(result.type).toBe('holiday');
    });

    test('infers meaning with context', async () => {
      const mockClient = createMockLLMClient({
        'date meaning': JSON.stringify({
          meaning: 'Tax Day',
          type: 'business',
          confidence: 0.85,
        }),
      });

      const date = new SemanticDate(new Date('2024-04-15T12:00:00Z'), mockClient);
      const result = await date.inferMeaning('US tax calendar');
      expect(result.meaning).toBe('Tax Day');
      expect(result.type).toBe('business');
    });
  });

  describe('valueOf()', () => {
    test('returns a Date object', () => {
      const originalDate = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(originalDate);
      const value = semanticDate.valueOf();
      expect(value).toBeInstanceOf(Date);
      expect(value.getTime()).toBe(originalDate.getTime());
    });

    test('returns a copy (immutable)', () => {
      const originalDate = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(originalDate);
      const value = semanticDate.valueOf();
      value.setFullYear(2025);
      expect(semanticDate.getFullYear()).toBe(2024);
    });
  });

  describe('Date methods', () => {
    test('getTime() returns milliseconds', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date);
      expect(semanticDate.getTime()).toBe(date.getTime());
    });

    test('toISOString() returns ISO format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date);
      expect(semanticDate.toISOString()).toBe('2024-01-15T12:00:00.000Z');
    });

    test('toString() returns string representation', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date);
      expect(semanticDate.toString()).toBe(date.toString());
    });

    test('toJSON() returns ISO string', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const semanticDate = new SemanticDate(date);
      expect(JSON.stringify({ date: semanticDate })).toBe('{"date":"2024-01-15T12:00:00.000Z"}');
    });

    test('getFullYear() returns year', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:00Z'));
      expect(semanticDate.getFullYear()).toBe(2024);
    });

    test('getMonth() returns month (0-indexed)', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:00Z'));
      expect(semanticDate.getMonth()).toBe(0);
    });

    test('getDate() returns day of month', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:00Z'));
      expect(semanticDate.getDate()).toBe(15);
    });

    test('getDay() returns day of week', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:00Z'));
      expect(semanticDate.getDay()).toBe(1); // Monday
    });

    test('getHours() returns hours', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:00Z'));
      expect(semanticDate.getHours()).toBe(12);
    });

    test('getMinutes() returns minutes', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:30:00Z'));
      expect(semanticDate.getMinutes()).toBe(30);
    });

    test('getSeconds() returns seconds', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:45Z'));
      expect(semanticDate.getSeconds()).toBe(45);
    });

    test('getMilliseconds() returns milliseconds', () => {
      const semanticDate = new SemanticDate(new Date('2024-01-15T12:00:00.123Z'));
      expect(semanticDate.getMilliseconds()).toBe(123);
    });
  });

  describe('explain()', () => {
    test('explains date without context', async () => {
      const mockClient = createMockLLMClient({
        'date description': JSON.stringify({
          description: 'January 15, 2024',
        }),
      });

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.explain();
      expect(result).toBe('January 15, 2024');
    });

    test('explains date with context', async () => {
      const callOrder: string[] = [];
      const mockClient: DateLLMClientInterface = {
        chat: mock(({ systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
          if (systemPrompt?.includes('date description')) {
            callOrder.push('describe');
            return Promise.resolve({ content: JSON.stringify({ description: 'next Monday' }) });
          }
          if (systemPrompt?.includes('date meaning')) {
            callOrder.push('meaning');
            return Promise.resolve({
              content: JSON.stringify({
                meaning: 'MLK Day',
                type: 'holiday',
                confidence: 0.9,
              }),
            });
          }
          return Promise.resolve({ content: '{}' });
        }),
      };

      const date = new SemanticDate(new Date('2024-01-15T12:00:00Z'), mockClient);
      const result = await date.explain('US holidays');
      expect(result).toContain('MLK Day');
      expect(callOrder).toContain('meaning');
    });
  });
});
