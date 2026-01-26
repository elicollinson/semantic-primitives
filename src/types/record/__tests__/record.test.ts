/**
 * Unit tests for SemanticRecord
 */

import { describe, test, expect } from 'bun:test';
import { SemanticRecord } from '../record.ts';
import {
  createMockLLMClient,
  mockEquivalentRecordsResponse,
  mockNotEquivalentRecordsResponse,
  mockValidKeysResponse,
  mockInvalidKeysResponse,
  mockValidValuesResponse,
  mockInvalidValuesResponse,
  mockInferExchangeRatesPurposeResponse,
  mockInferConfigPurposeResponse,
  mockSemanticGetGBPResponse,
  mockSemanticGetNoMatchResponse,
  mockSemanticFilterSecurityResponse,
  mockSemanticFilterNoMatchResponse,
  mockSuggestMissingCurrenciesResponse,
  mockNoSuggestionsResponse,
  mockGroupByCategoryResponse,
  mockExchangeRatesSummaryResponse,
  mockConfigSummaryResponse,
} from './mocks.ts';

describe('SemanticRecord', () => {
  describe('static factory methods', () => {
    test('from() creates record from plain object', () => {
      const source = { USD: 1.0, EUR: 0.85, GBP: 0.73 };
      const record = SemanticRecord.from(source);

      expect(record.valueOf()).toEqual(source);
      expect(record.size).toBe(3);
    });

    test('from() creates record with context', () => {
      const source = { USD: 1.0, EUR: 0.85 };
      const record = SemanticRecord.from(source, 'exchange rates');

      expect(record.valueOf()).toEqual(source);
    });

    test('empty() creates empty record', () => {
      const record = SemanticRecord.empty<string, number>();

      expect(record.valueOf()).toEqual({});
      expect(record.size).toBe(0);
    });

    test('from() creates a copy of the input object', () => {
      const original = { key: 'value' };
      const record = SemanticRecord.from(original);
      original.key = 'modified';

      expect(record.get('key')).toBe('value');
    });
  });

  describe('valueOf', () => {
    test('returns Record with same entries', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const value = record.valueOf();

      expect(value).toEqual({ a: 1, b: 2 });
    });

    test('returns a copy, not the internal record', () => {
      const record = SemanticRecord.from({ a: 1 });
      const value = record.valueOf();
      (value as Record<string, number>).b = 2;

      expect(record.has('b' as 'a')).toBe(false);
    });
  });

  describe('size', () => {
    test('returns record size', () => {
      const record = SemanticRecord.from({ a: 1, b: 2, c: 3 });
      expect(record.size).toBe(3);
    });

    test('returns 0 for empty record', () => {
      const record = SemanticRecord.empty();
      expect(record.size).toBe(0);
    });
  });

  describe('get', () => {
    test('returns value for existing key', () => {
      const record = SemanticRecord.from({ name: 'John', age: 30 });

      expect(record.get('name')).toBe('John');
      expect(record.get('age')).toBe(30);
    });

    test('returns undefined for non-existing key', () => {
      const record = SemanticRecord.from({ a: 1 });

      expect(record.get('b' as 'a')).toBeUndefined();
    });
  });

  describe('has', () => {
    test('returns true for existing key', () => {
      const record = SemanticRecord.from({ key: 'value' });

      expect(record.has('key')).toBe(true);
    });

    test('returns false for non-existing key', () => {
      const record = SemanticRecord.from({ a: 1 });

      expect(record.has('b' as 'a')).toBe(false);
    });
  });

  describe('set', () => {
    test('returns new record with added entry', () => {
      const record = SemanticRecord.from<string, number>({ a: 1 });
      const newRecord = record.set('b', 2);

      expect(newRecord.get('b')).toBe(2);
      expect(newRecord.size).toBe(2);
    });

    test('does not modify original record', () => {
      const record = SemanticRecord.from<string, number>({ a: 1 });
      record.set('b', 2);

      expect(record.has('b')).toBe(false);
    });

    test('overwrites existing key', () => {
      const record = SemanticRecord.from<string, number>({ a: 1 });
      const newRecord = record.set('a', 100);

      expect(newRecord.get('a')).toBe(100);
      expect(record.get('a')).toBe(1);
    });
  });

  describe('delete', () => {
    test('returns new record without deleted key', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const newRecord = record.delete('a');

      expect(newRecord.has('a')).toBe(false);
      expect(newRecord.size).toBe(1);
    });

    test('does not modify original record', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      record.delete('a');

      expect(record.has('a')).toBe(true);
    });
  });

  describe('keys, values, entries', () => {
    test('keys() returns all keys', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const keys = record.keys();

      expect(keys).toEqual(['a', 'b']);
    });

    test('values() returns all values', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const values = record.values();

      expect(values).toEqual([1, 2]);
    });

    test('entries() returns all entries', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const entries = record.entries();

      expect(entries).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for semantically similar records', async () => {
      const client = createMockLLMClient(mockEquivalentRecordsResponse);
      const record1 = SemanticRecord.from<string, number>(
        { US_DOLLAR: 1.0, EURO: 0.85 },
        'exchange rates',
        client
      );
      const record2 = { USD: 1.0, EUR: 0.85 };

      const result = await record1.semanticallyEquals(record2);

      expect(result.equivalent).toBe(true);
      expect(result.mappings).toEqual({ US_DOLLAR: 'USD', EURO: 'EUR' });
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different records', async () => {
      const client = createMockLLMClient(mockNotEquivalentRecordsResponse);
      const record1 = SemanticRecord.from<string, string | number>({ color: 'red' }, undefined, client);
      const record2 = { price: 100 };

      const result = await record1.semanticallyEquals(record2);

      expect(result.equivalent).toBe(false);
    });

    test('accepts SemanticRecord as parameter', async () => {
      const client = createMockLLMClient(mockEquivalentRecordsResponse);
      const record1 = SemanticRecord.from({ key: 'value' }, undefined, client);
      const record2 = SemanticRecord.from({ key: 'value' }, undefined, client);

      const result = await record1.semanticallyEquals(record2);

      expect(result.equivalent).toBe(true);
    });

    test('returns equivalent for two empty records', async () => {
      const record1 = SemanticRecord.empty<string, string>();
      const record2 = {};

      const result = await record1.semanticallyEquals(record2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('validateKeys', () => {
    test('returns valid for compliant keys', async () => {
      const client = createMockLLMClient(mockValidKeysResponse);
      const record = SemanticRecord.from(
        { API_KEY: 'key-123', DB_HOST: 'localhost' },
        undefined,
        client
      );

      const result = await record.validateKeys(['should be SCREAMING_SNAKE_CASE']);

      expect(result.valid).toBe(true);
      expect(result.invalidKeys).toEqual([]);
    });

    test('returns issues for non-compliant keys', async () => {
      const client = createMockLLMClient(mockInvalidKeysResponse);
      const record = SemanticRecord.from(
        { myKey: 'value', anotherKey: 'value2' },
        undefined,
        client
      );

      const result = await record.validateKeys(['should be SCREAMING_SNAKE_CASE']);

      expect(result.valid).toBe(false);
      expect(result.invalidKeys).toContain('myKey');
      expect(result.reasons.length).toBe(2);
    });

    test('returns valid for empty record', async () => {
      const record = SemanticRecord.empty<string, string>();

      const result = await record.validateKeys(['any rule']);

      expect(result.valid).toBe(true);
      expect(result.invalidKeys).toEqual([]);
    });
  });

  describe('validateValues', () => {
    test('returns valid for compliant values', async () => {
      const client = createMockLLMClient(mockValidValuesResponse);
      const record = SemanticRecord.from(
        { price1: 100, price2: 50 },
        undefined,
        client
      );

      const result = await record.validateValues(['must be positive numbers']);

      expect(result.valid).toBe(true);
      expect(result.invalidEntries).toEqual([]);
    });

    test('returns issues for non-compliant values', async () => {
      const client = createMockLLMClient(mockInvalidValuesResponse);
      const record = SemanticRecord.from(
        { price1: -10, price2: 999999 },
        undefined,
        client
      );

      const result = await record.validateValues([
        'must be positive numbers',
        'should be reasonable prices',
      ]);

      expect(result.valid).toBe(false);
      expect(result.invalidEntries.length).toBe(2);
      expect(result.invalidEntries[0]?.reason).toContain('positive');
    });

    test('returns valid for empty record', async () => {
      const record = SemanticRecord.empty<string, number>();

      const result = await record.validateValues(['any rule']);

      expect(result.valid).toBe(true);
      expect(result.invalidEntries).toEqual([]);
    });
  });

  describe('inferPurpose', () => {
    test('infers exchange rates purpose', async () => {
      const client = createMockLLMClient(mockInferExchangeRatesPurposeResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73 },
        undefined,
        client
      );

      const result = await record.inferPurpose();

      expect(result.purpose).toBe('currency-exchange-rates');
      expect(result.keyType).toBe('currency-code');
      expect(result.valueType).toBe('exchange-rate');
      expect(result.confidence).toBe(0.95);
    });

    test('infers configuration purpose', async () => {
      const client = createMockLLMClient(mockInferConfigPurposeResponse);
      const record = SemanticRecord.from(
        { DB_HOST: 'localhost', DB_PORT: '5432' },
        undefined,
        client
      );

      const result = await record.inferPurpose();

      expect(result.purpose).toBe('configuration');
    });

    test('returns empty purpose for empty record', async () => {
      const record = SemanticRecord.empty<string, string>();

      const result = await record.inferPurpose();

      expect(result.purpose).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('semanticGet', () => {
    test('finds semantically matching key', async () => {
      const client = createMockLLMClient(mockSemanticGetGBPResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73 },
        'exchange rates',
        client
      );

      const result = await record.semanticGet('British Pound');

      expect(result.matchedKey).toBe('GBP');
      expect(result.value).toBe(0.73);
      expect(result.confidence).toBe(0.95);
    });

    test('returns undefined when no match found', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const record = SemanticRecord.from(
        { color: 'red', size: 'large' },
        undefined,
        client
      );

      const result = await record.semanticGet('database connection');

      expect(result.matchedKey).toBeUndefined();
      expect(result.value).toBeUndefined();
    });

    test('returns undefined for empty record', async () => {
      const record = SemanticRecord.empty<string, number>();

      const result = await record.semanticGet('any query');

      expect(result.value).toBeUndefined();
      expect(result.confidence).toBe(1.0);
    });

    test('accepts context parameter', async () => {
      const client = createMockLLMClient(mockSemanticGetGBPResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73 },
        undefined,
        client
      );

      const result = await record.semanticGet('pound', { region: 'UK' });

      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('semanticFilter', () => {
    test('filters entries by criteria', async () => {
      const client = createMockLLMClient(mockSemanticFilterSecurityResponse);
      const record = SemanticRecord.from(
        {
          API_KEY: 'key-123',
          APP_NAME: 'MyApp',
          DB_HOST: 'localhost',
          AUTH_TOKEN: 'token-456',
        },
        undefined,
        client
      );

      const filtered = await record.semanticFilter('security-related settings');

      expect(filtered.size).toBe(2);
    });

    test('returns empty record when no matches', async () => {
      const client = createMockLLMClient(mockSemanticFilterNoMatchResponse);
      const record = SemanticRecord.from(
        { color: 'red', size: 'large' },
        undefined,
        client
      );

      const filtered = await record.semanticFilter('database settings');

      expect(filtered.size).toBe(0);
    });

    test('returns empty record for empty input', async () => {
      const record = SemanticRecord.empty<string, string>();

      const filtered = await record.semanticFilter('any criteria');

      expect(filtered.size).toBe(0);
    });
  });

  describe('suggestMissingKeys', () => {
    test('suggests missing keys based on patterns', async () => {
      const client = createMockLLMClient(mockSuggestMissingCurrenciesResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85 },
        'exchange rates',
        client
      );

      const suggestions = await record.suggestMissingKeys();

      expect(suggestions.length).toBe(2);
      expect(suggestions[0]?.key).toBe('GBP');
      expect(suggestions[0]?.reason).toContain('currency');
    });

    test('returns empty array when no suggestions', async () => {
      const client = createMockLLMClient(mockNoSuggestionsResponse);
      const record = SemanticRecord.from({ complete: 'data' }, undefined, client);

      const suggestions = await record.suggestMissingKeys();

      expect(suggestions).toEqual([]);
    });

    test('returns empty array for empty record', async () => {
      const record = SemanticRecord.empty<string, string>();

      const suggestions = await record.suggestMissingKeys();

      expect(suggestions).toEqual([]);
    });
  });

  describe('groupBy', () => {
    test('groups entries by criteria', async () => {
      const client = createMockLLMClient(mockGroupByCategoryResponse);
      const record = SemanticRecord.from(
        {
          DB_HOST: 'localhost',
          DB_PORT: '5432',
          AUTH_SECRET: 'secret',
          AUTH_TIMEOUT: '3600',
          LOG_LEVEL: 'info',
        },
        undefined,
        client
      );

      const groups = await record.groupBy('by category');

      expect(Object.keys(groups).length).toBe(3);
      expect(groups.database).toBeDefined();
      expect(groups.authentication).toBeDefined();
      expect(groups.logging).toBeDefined();
      expect(groups.database?.size).toBe(2);
    });

    test('returns empty object for empty record', async () => {
      const record = SemanticRecord.empty<string, string>();

      const groups = await record.groupBy('any criteria');

      expect(Object.keys(groups).length).toBe(0);
    });
  });

  describe('summarize', () => {
    test('returns human-readable summary for exchange rates', async () => {
      const client = createMockLLMClient(mockExchangeRatesSummaryResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73, JPY: 149.5, CAD: 1.35 },
        'exchange rates',
        client
      );

      const summary = await record.summarize();

      expect(summary).toContain('currency');
      expect(summary).toContain('exchange');
    });

    test('returns human-readable summary for config', async () => {
      const client = createMockLLMClient(mockConfigSummaryResponse);
      const record = SemanticRecord.from(
        { DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'key-123' },
        undefined,
        client
      );

      const summary = await record.summarize();

      expect(summary).toContain('configuration');
    });

    test('returns message for empty record', async () => {
      const record = SemanticRecord.empty<string, string>();

      const summary = await record.summarize();

      expect(summary).toBe('Empty record with no entries.');
    });
  });

  describe('forEach', () => {
    test('executes callback for each entry', () => {
      const record = SemanticRecord.from({ a: 1, b: 2, c: 3 });
      const results: [string, number][] = [];

      record.forEach((value, key) => {
        results.push([key, value]);
      });

      expect(results).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });
  });

  describe('map', () => {
    test('transforms values', () => {
      const record = SemanticRecord.from({ a: 1, b: 2, c: 3 });
      const mapped = record.map(v => v * 2);

      expect(mapped.get('a')).toBe(2);
      expect(mapped.get('b')).toBe(4);
      expect(mapped.get('c')).toBe(6);
    });

    test('does not modify original record', () => {
      const record = SemanticRecord.from({ a: 1 });
      record.map(v => v * 2);

      expect(record.get('a')).toBe(1);
    });
  });

  describe('filter', () => {
    test('filters entries with predicate', () => {
      const record = SemanticRecord.from({ a: 1, b: 2, c: 3, d: 4 });
      const filtered = record.filter(v => v > 2);

      expect(filtered.size).toBe(2);
      expect(filtered.has('c')).toBe(true);
      expect(filtered.has('d')).toBe(true);
      expect(filtered.has('a')).toBe(false);
    });

    test('does not modify original record', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      record.filter(v => v > 1);

      expect(record.size).toBe(2);
    });
  });

  describe('clear', () => {
    test('returns empty record', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const cleared = record.clear();

      expect(cleared.size).toBe(0);
    });

    test('does not modify original record', () => {
      const record = SemanticRecord.from({ a: 1 });
      record.clear();

      expect(record.size).toBe(1);
    });
  });

  describe('iterator', () => {
    test('supports for...of iteration', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const results: [string, number][] = [];

      for (const entry of record) {
        results.push(entry);
      }

      expect(results).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });

    test('supports spread operator', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const entries = [...record];

      expect(entries).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });
  });

  describe('toString', () => {
    test('returns string representation', () => {
      const record = SemanticRecord.from({ name: 'John', age: 30 });
      const str = record.toString();

      expect(str).toContain('SemanticRecord(2)');
      expect(str).toContain('name: "John"');
      expect(str).toContain('age: 30');
    });

    test('handles empty record', () => {
      const record = SemanticRecord.empty<string, string>();
      const str = record.toString();

      expect(str).toBe('SemanticRecord(0) {  }');
    });
  });

  describe('toJSON', () => {
    test('returns object for JSON serialization', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const json = record.toJSON();

      expect(json).toEqual({ a: 1, b: 2 });
    });

    test('works with JSON.stringify', () => {
      const record = SemanticRecord.from({ name: 'John', age: 30 });
      const str = JSON.stringify(record);

      expect(str).toBe('{"name":"John","age":30}');
    });
  });
});

describe('SemanticRecord prompts', () => {
  test('createSemanticallyEqualsPrompt includes both records', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      [['USD', 1.0]],
      [['US_DOLLAR', 1.0]]
    );

    expect(prompt).toContain('Record 1 entries:');
    expect(prompt).toContain('Record 2 entries:');
    expect(prompt).toContain('USD');
    expect(prompt).toContain('US_DOLLAR');
  });

  test('createValidateKeysPrompt includes keys and rules', async () => {
    const { createValidateKeysPrompt } = await import('../prompts.ts');
    const prompt = createValidateKeysPrompt(
      ['API_KEY', 'myKey'],
      ['should be SCREAMING_SNAKE_CASE']
    );

    expect(prompt).toContain('API_KEY');
    expect(prompt).toContain('myKey');
    expect(prompt).toContain('SCREAMING_SNAKE_CASE');
  });

  test('createInferPurposePrompt includes entries', async () => {
    const { createInferPurposePrompt } = await import('../prompts.ts');
    const prompt = createInferPurposePrompt([
      ['USD', 1.0],
      ['EUR', 0.85],
    ]);

    expect(prompt).toContain('USD');
    expect(prompt).toContain('EUR');
    expect(prompt).toContain('purpose');
  });

  test('createSemanticGetPrompt includes keys and query', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt(
      ['USD', 'EUR', 'GBP'],
      'British Pound'
    );

    expect(prompt).toContain('USD');
    expect(prompt).toContain('GBP');
    expect(prompt).toContain('British Pound');
  });

  test('createSemanticGetPrompt includes context when provided', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt(['USD'], 'dollar', {
      region: 'US',
    });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('"region":"US"');
  });

  test('createGroupByPrompt includes criteria', async () => {
    const { createGroupByPrompt } = await import('../prompts.ts');
    const prompt = createGroupByPrompt([['key', 'value']], 'by category');

    expect(prompt).toContain('by category');
  });

  test('createSummarizePrompt includes context when provided', async () => {
    const { createSummarizePrompt } = await import('../prompts.ts');
    const prompt = createSummarizePrompt(
      [['USD', 1.0]],
      1,
      'exchange rates'
    );

    expect(prompt).toContain('exchange rates');
  });
});
