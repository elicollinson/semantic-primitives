/**
 * Unit tests for SemanticRecord
 */

import { describe, test, expect } from 'bun:test';
import { SemanticRecord } from '../record.ts';
import {
  createMockLLMClient,
  mockSemanticGetUsdResponse,
  mockSemanticGetGbpResponse,
  mockSemanticGetNoMatchResponse,
  mockEquivalentRecordsResponse,
  mockNotEquivalentRecordsResponse,
  mockValidKeysResponse,
  mockInvalidKeysResponse,
  mockValidValuesResponse,
  mockInvalidValuesResponse,
  mockInferExchangeRatesPurposeResponse,
  mockInferConfigPurposeResponse,
  mockFilterSecurityResponse,
  mockFilterNoMatchResponse,
  mockSuggestMissingKeysResponse,
  mockNoSuggestionsResponse,
  mockGroupByCategoryResponse,
  mockGroupByRegionResponse,
  mockExchangeRatesSummaryResponse,
  mockConfigSummaryResponse,
} from './mocks.ts';

describe('SemanticRecord', () => {
  describe('static factory methods', () => {
    test('from() creates record from existing object', () => {
      const source = { USD: 1.0, EUR: 0.85, GBP: 0.73 };
      const record = SemanticRecord.from(source);

      expect(record.valueOf()).toEqual(source);
      expect(record.size).toBe(3);
    });

    test('from() accepts context parameter', () => {
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
      const original: Record<string, string> = { key: 'value' };
      const record = SemanticRecord.from(original);
      original['newKey'] = 'newValue';

      expect(record.has('newKey')).toBe(false);
    });
  });

  describe('valueOf', () => {
    test('returns object with same entries', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const value = record.valueOf();

      expect(value).toEqual({ a: 1, b: 2 });
    });

    test('returns a copy, not the internal object', () => {
      const record = SemanticRecord.from<string, number>({ a: 1 });
      const value: Record<string, number> = record.valueOf();
      value['b'] = 2;

      expect(record.has('b')).toBe(false);
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

  describe('keys', () => {
    test('returns all keys', () => {
      const record = SemanticRecord.from({ USD: 1.0, EUR: 0.85, GBP: 0.73 });
      const keys = record.keys();

      expect(keys).toContain('USD');
      expect(keys).toContain('EUR');
      expect(keys).toContain('GBP');
      expect(keys.length).toBe(3);
    });

    test('returns empty array for empty record', () => {
      const record = SemanticRecord.empty();
      expect(record.keys()).toEqual([]);
    });
  });

  describe('values', () => {
    test('returns all values', () => {
      const record = SemanticRecord.from({ USD: 1.0, EUR: 0.85, GBP: 0.73 });
      const values = record.values();

      expect(values).toContain(1.0);
      expect(values).toContain(0.85);
      expect(values).toContain(0.73);
      expect(values.length).toBe(3);
    });

    test('returns empty array for empty record', () => {
      const record = SemanticRecord.empty();
      expect(record.values()).toEqual([]);
    });
  });

  describe('entries', () => {
    test('returns all entries', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const entries = record.entries();

      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
      expect(entries.length).toBe(2);
    });
  });

  describe('get', () => {
    test('returns value for existing key', () => {
      const record = SemanticRecord.from({ USD: 1.0, EUR: 0.85 });

      expect(record.get('USD')).toBe(1.0);
      expect(record.get('EUR')).toBe(0.85);
    });

    test('returns undefined for non-existing key', () => {
      const record = SemanticRecord.from({ USD: 1.0 });

      expect(record.get('GBP' as 'USD')).toBeUndefined();
    });
  });

  describe('has', () => {
    test('returns true for existing key', () => {
      const record = SemanticRecord.from({ USD: 1.0 });

      expect(record.has('USD')).toBe(true);
    });

    test('returns false for non-existing key', () => {
      const record = SemanticRecord.from({ USD: 1.0 });

      expect(record.has('GBP' as 'USD')).toBe(false);
    });
  });

  describe('semanticGet', () => {
    test('finds semantically matching key', async () => {
      const client = createMockLLMClient(mockSemanticGetUsdResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73 },
        'exchange rates',
        client
      );

      const result = await record.semanticGet('US Dollar');

      expect(result.matchedKey).toBe('USD');
      expect(result.value).toBe(1.0);
      expect(result.confidence).toBe(0.95);
    });

    test('finds British Pound for semantic query', async () => {
      const client = createMockLLMClient(mockSemanticGetGbpResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73 },
        'exchange rates',
        client
      );

      const result = await record.semanticGet('British Pound');

      expect(result.matchedKey).toBe('GBP');
      expect(result.value).toBe(0.73);
      expect(result.confidence).toBe(0.92);
    });

    test('returns undefined when no match found', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85 },
        undefined,
        client
      );

      const result = await record.semanticGet('Japanese Yen');

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
      const client = createMockLLMClient(mockSemanticGetUsdResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85 },
        undefined,
        client
      );

      const result = await record.semanticGet('dollar', { region: 'US' });

      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for semantically similar records', async () => {
      const client = createMockLLMClient(mockEquivalentRecordsResponse);
      const record1 = SemanticRecord.from<string, number>(
        { US_DOLLAR: 1.0, EURO: 0.85 },
        undefined,
        client
      );
      const record2: Record<string, number> = { USD: 1.0, EUR: 0.85 };

      const result = await record1.semanticallyEquals(record2);

      expect(result.equivalent).toBe(true);
      expect(result.keyMappings).toEqual({
        'US_DOLLAR': 'USD',
        'EURO': 'EUR',
      });
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different records', async () => {
      const client = createMockLLMClient(mockNotEquivalentRecordsResponse);
      const record1 = SemanticRecord.from<string, number>(
        { USD: 1.0, EUR: 0.85 },
        undefined,
        client
      );
      const record2: Record<string, number> = { temperature: 25, humidity: 60 };

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
      expect(result.reasons).toEqual([]);
    });

    test('returns invalid keys for non-compliant record', async () => {
      const client = createMockLLMClient(mockInvalidKeysResponse);
      const record = SemanticRecord.from(
        { myKey: 'value', anotherKey: 'value2' },
        undefined,
        client
      );

      const result = await record.validateKeys(['should be SCREAMING_SNAKE_CASE']);

      expect(result.valid).toBe(false);
      expect(result.invalidKeys).toContain('myKey');
      expect(result.invalidKeys).toContain('anotherKey');
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
        { USD: 1.0, EUR: 0.85, GBP: 0.73 },
        undefined,
        client
      );

      const result = await record.validateValues(['must be positive numbers']);

      expect(result.valid).toBe(true);
      expect(result.invalidEntries).toEqual([]);
    });

    test('returns invalid entries for non-compliant values', async () => {
      const client = createMockLLMClient(mockInvalidValuesResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, JPY: -5.0 },
        undefined,
        client
      );

      const result = await record.validateValues(['must be positive numbers']);

      expect(result.valid).toBe(false);
      expect(result.invalidEntries.length).toBe(1);
      expect(result.invalidEntries[0]?.key).toBe('JPY');
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
        { DB_HOST: 'localhost', DB_PORT: '5432', LOG_LEVEL: 'info' },
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

  describe('semanticFilter', () => {
    test('filters entries matching criteria', async () => {
      const client = createMockLLMClient(mockFilterSecurityResponse);
      const record = SemanticRecord.from(
        {
          API_KEY: 'key-123',
          APP_NAME: 'MyApp',
          AUTH_TOKEN: 'token-456',
        },
        undefined,
        client
      );

      const filtered = await record.semanticFilter('security-related settings');

      expect(filtered.size).toBe(2);
      expect(filtered.has('API_KEY')).toBe(true);
      expect(filtered.has('AUTH_TOKEN')).toBe(true);
    });

    test('returns empty record when no matches', async () => {
      const client = createMockLLMClient(mockFilterNoMatchResponse);
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
      const client = createMockLLMClient(mockSuggestMissingKeysResponse);
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
      expect(groups['database']).toBeDefined();
      expect(groups['authentication']).toBeDefined();
      expect(groups['logging']).toBeDefined();
      expect(groups['database']?.size).toBe(2);
    });

    test('groups currencies by region', async () => {
      const client = createMockLLMClient(mockGroupByRegionResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73, JPY: 149.5 },
        undefined,
        client
      );

      const groups = await record.groupBy('by geographic region');

      expect(groups['north-america']).toBeDefined();
      expect(groups['europe']).toBeDefined();
      expect(groups['asia']).toBeDefined();
    });

    test('returns empty object for empty record', async () => {
      const record = SemanticRecord.empty<string, string>();

      const groups = await record.groupBy('any criteria');

      expect(groups).toEqual({});
    });
  });

  describe('summarize', () => {
    test('returns human-readable summary for exchange rates', async () => {
      const client = createMockLLMClient(mockExchangeRatesSummaryResponse);
      const record = SemanticRecord.from(
        { USD: 1.0, EUR: 0.85, GBP: 0.73, JPY: 149.5 },
        'exchange rates',
        client
      );

      const summary = await record.summarize();

      expect(summary).toContain('currency');
      expect(summary).toContain('GBP');
    });

    test('returns human-readable summary for config', async () => {
      const client = createMockLLMClient(mockConfigSummaryResponse);
      const record = SemanticRecord.from(
        {
          DB_HOST: 'localhost',
          DB_PORT: '5432',
          AUTH_SECRET: 'secret',
        },
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

  describe('toString', () => {
    test('returns string representation', () => {
      const record = SemanticRecord.from({ USD: 1.0, EUR: 0.85 });
      const str = record.toString();

      expect(str).toContain('SemanticRecord(2)');
      expect(str).toContain('USD');
      expect(str).toContain('1');
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
      const record = SemanticRecord.from({ USD: 1.0, EUR: 0.85 });
      const str = JSON.stringify(record);

      expect(str).toBe('{"USD":1,"EUR":0.85}');
    });
  });

  describe('iterator', () => {
    test('supports for...of iteration', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const results: [string, number][] = [];

      for (const entry of record) {
        results.push(entry);
      }

      expect(results).toContainEqual(['a', 1]);
      expect(results).toContainEqual(['b', 2]);
    });

    test('supports spread operator', () => {
      const record = SemanticRecord.from({ a: 1, b: 2 });
      const entries = [...record];

      expect(entries.length).toBe(2);
    });
  });

  describe('forEach', () => {
    test('executes callback for each entry', () => {
      const record = SemanticRecord.from({ a: 1, b: 2, c: 3 });
      const results: [string, number][] = [];

      record.forEach((value, key) => {
        results.push([key, value]);
      });

      expect(results.length).toBe(3);
      expect(results).toContainEqual(['a', 1]);
      expect(results).toContainEqual(['b', 2]);
      expect(results).toContainEqual(['c', 3]);
    });
  });
});

describe('SemanticRecord prompts', () => {
  test('createSemanticGetPrompt includes keys and query', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt(
      ['USD', 'EUR', 'GBP'],
      'US Dollar'
    );

    expect(prompt).toContain('USD');
    expect(prompt).toContain('EUR');
    expect(prompt).toContain('GBP');
    expect(prompt).toContain('US Dollar');
  });

  test('createSemanticGetPrompt includes context when provided', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt(['key'], 'query', {
      region: 'US',
    });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('"region":"US"');
  });

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

  test('createValidateKeysPrompt includes rules', async () => {
    const { createValidateKeysPrompt } = await import('../prompts.ts');
    const prompt = createValidateKeysPrompt(
      ['API_KEY', 'db_host'],
      ['should be SCREAMING_SNAKE_CASE', 'should be valid env var names']
    );

    expect(prompt).toContain('SCREAMING_SNAKE_CASE');
    expect(prompt).toContain('valid env var names');
  });

  test('createValidateValuesPrompt includes rules', async () => {
    const { createValidateValuesPrompt } = await import('../prompts.ts');
    const prompt = createValidateValuesPrompt(
      [['USD', 1.0], ['EUR', 0.85]],
      ['must be positive numbers', 'should be reasonable prices']
    );

    expect(prompt).toContain('positive numbers');
    expect(prompt).toContain('reasonable prices');
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

  test('createGroupByPrompt includes criteria', async () => {
    const { createGroupByPrompt } = await import('../prompts.ts');
    const prompt = createGroupByPrompt(
      [['key', 'value']],
      'by category'
    );

    expect(prompt).toContain('by category');
  });

  test('createSuggestMissingKeysPrompt includes entries', async () => {
    const { createSuggestMissingKeysPrompt } = await import('../prompts.ts');
    const prompt = createSuggestMissingKeysPrompt([
      ['USD', 1.0],
      ['EUR', 0.85],
    ]);

    expect(prompt).toContain('USD');
    expect(prompt).toContain('EUR');
    expect(prompt).toContain('suggest');
  });
});
