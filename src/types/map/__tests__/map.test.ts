/**
 * Unit tests for SemanticMap
 */

import { describe, test, expect } from 'bun:test';
import { SemanticMap } from '../map.ts';
import {
  createMockLLMClient,
  mockSemanticGetMatchResponse,
  mockSemanticGetDbConnectionResponse,
  mockSemanticGetNoMatchResponse,
  mockSemanticHasMatchResponse,
  mockSemanticHasNoMatchResponse,
  mockEquivalentMapsResponse,
  mockNotEquivalentMapsResponse,
  mockFindSecurityKeysResponse,
  mockFindNoKeysResponse,
  mockFindExpensiveValuesResponse,
  mockFindNoValuesResponse,
  mockMergePreferOtherResponse,
  mockMergePreferThisResponse,
  mockValidMapResponse,
  mockInvalidMapResponse,
  mockSuggestMissingKeysResponse,
  mockNoSuggestionsResponse,
  mockGroupByCategoryResponse,
  mockConfigSummaryResponse,
  mockInferConfigPurposeResponse,
  mockInferPreferencesPurposeResponse,
} from './mocks.ts';

describe('SemanticMap', () => {
  describe('static factory methods', () => {
    test('from() creates map from existing Map', () => {
      const source = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map = SemanticMap.from(source);

      expect(map.valueOf()).toEqual(source);
      expect(map.size).toBe(2);
    });

    test('from() creates map from entries iterable', () => {
      const entries: (readonly [string, number])[] = [
        ['x', 10],
        ['y', 20],
      ];
      const map = SemanticMap.from(entries);

      expect(map.get('x')).toBe(10);
      expect(map.get('y')).toBe(20);
    });

    test('empty() creates empty map', () => {
      const map = SemanticMap.empty<string, number>();

      expect(map.valueOf()).toEqual(new Map());
      expect(map.size).toBe(0);
    });

    test('of() creates map from variadic key-value pairs', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2], ['c', 3]);

      expect(map.size).toBe(3);
      expect(map.get('a')).toBe(1);
      expect(map.get('b')).toBe(2);
      expect(map.get('c')).toBe(3);
    });

    test('from() creates a copy of the input map', () => {
      const original = new Map([['key', 'value']]);
      const map = SemanticMap.from(original);
      original.set('newKey', 'newValue');

      expect(map.has('newKey')).toBe(false);
    });
  });

  describe('valueOf', () => {
    test('returns Map with same entries', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      const value = map.valueOf();

      expect(value).toBeInstanceOf(Map);
      expect(value.get('a')).toBe(1);
      expect(value.get('b')).toBe(2);
    });

    test('returns a copy, not the internal map', () => {
      const map = SemanticMap.of(['a', 1]);
      const value = map.valueOf();
      value.set('b', 2);

      expect(map.has('b')).toBe(false);
    });
  });

  describe('size', () => {
    test('returns map size', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2], ['c', 3]);
      expect(map.size).toBe(3);
    });

    test('returns 0 for empty map', () => {
      const map = SemanticMap.empty();
      expect(map.size).toBe(0);
    });
  });

  describe('get', () => {
    test('returns value for existing key', () => {
      const map = SemanticMap.of<string, string | number>(['name', 'John'], ['age', 30]);

      expect(map.get('name')).toBe('John');
      expect(map.get('age')).toBe(30);
    });

    test('returns undefined for non-existing key', () => {
      const map = SemanticMap.of(['a', 1]);

      expect(map.get('b')).toBeUndefined();
    });
  });

  describe('has', () => {
    test('returns true for existing key', () => {
      const map = SemanticMap.of(['key', 'value']);

      expect(map.has('key')).toBe(true);
    });

    test('returns false for non-existing key', () => {
      const map = SemanticMap.of(['a', 1]);

      expect(map.has('b')).toBe(false);
    });
  });

  describe('set', () => {
    test('returns new map with added entry', () => {
      const map = SemanticMap.of(['a', 1]);
      const newMap = map.set('b', 2);

      expect(newMap.get('b')).toBe(2);
      expect(newMap.size).toBe(2);
    });

    test('does not modify original map', () => {
      const map = SemanticMap.of(['a', 1]);
      map.set('b', 2);

      expect(map.has('b')).toBe(false);
    });

    test('overwrites existing key', () => {
      const map = SemanticMap.of(['a', 1]);
      const newMap = map.set('a', 100);

      expect(newMap.get('a')).toBe(100);
      expect(map.get('a')).toBe(1);
    });
  });

  describe('delete', () => {
    test('returns new map without deleted key', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      const newMap = map.delete('a');

      expect(newMap.has('a')).toBe(false);
      expect(newMap.size).toBe(1);
    });

    test('does not modify original map', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      map.delete('a');

      expect(map.has('a')).toBe(true);
    });
  });

  describe('keys, values, entries', () => {
    test('keys() returns all keys', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      const keys = Array.from(map.keys());

      expect(keys).toEqual(['a', 'b']);
    });

    test('values() returns all values', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      const values = Array.from(map.values());

      expect(values).toEqual([1, 2]);
    });

    test('entries() returns all entries', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      const entries = Array.from(map.entries());

      expect(entries).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });
  });

  describe('semanticGet', () => {
    test('finds semantically matching key', async () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from(
        new Map([
          ['userId', '123'],
          ['userName', 'John'],
        ]),
        client
      );

      const result = await map.semanticGet('user identifier');

      expect(result.matchedKey).toBe('userId');
      expect(result.value).toBe('123');
      expect(result.confidence).toBe(0.92);
    });

    test('finds DB_CONNECTION_URL for database connection string query', async () => {
      const client = createMockLLMClient(mockSemanticGetDbConnectionResponse);
      const map = SemanticMap.from(
        new Map([
          ['API_KEY', 'key-123'],
          ['APP_NAME', 'MyApp'],
          ['DB_CONNECTION_URL', 'postgres://localhost'],
        ]),
        client
      );

      const result = await map.semanticGet('database connection string');

      expect(result.matchedKey).toBe('DB_CONNECTION_URL');
      expect(result.value).toBe('postgres://localhost');
    });

    test('returns undefined when no match found', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const map = SemanticMap.from(
        new Map([
          ['color', 'red'],
          ['size', 'large'],
        ]),
        client
      );

      const result = await map.semanticGet('database settings');

      expect(result.matchedKey).toBeUndefined();
      expect(result.value).toBeUndefined();
    });

    test('returns undefined for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const result = await map.semanticGet('any query');

      expect(result.value).toBeUndefined();
      expect(result.confidence).toBe(1.0);
    });

    test('accepts context parameter', async () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from(
        new Map([
          ['greeting_en', 'Hello'],
          ['greeting_es', 'Hola'],
        ]),
        client
      );

      const result = await map.semanticGet('greeting', { language: 'es' });

      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('semanticHas', () => {
    test('returns true when semantically matching key exists', async () => {
      const client = createMockLLMClient(mockSemanticHasMatchResponse);
      const map = SemanticMap.from(
        new Map([
          ['userId', '123'],
          ['user_id', '456'],
        ]),
        client
      );

      const result = await map.semanticHas('user identifier');

      expect(result).toBe(true);
    });

    test('returns false when no matching key exists', async () => {
      const client = createMockLLMClient(mockSemanticHasNoMatchResponse);
      const map = SemanticMap.from(
        new Map([
          ['color', 'red'],
          ['size', 'large'],
        ]),
        client
      );

      const result = await map.semanticHas('database connection');

      expect(result).toBe(false);
    });

    test('returns false for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const result = await map.semanticHas('any query');

      expect(result).toBe(false);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for semantically similar maps', async () => {
      const client = createMockLLMClient(mockEquivalentMapsResponse);
      const map1 = SemanticMap.from(
        new Map([
          ['userId', '123'],
          ['userName', 'John'],
        ]),
        client
      );
      const map2 = new Map([
        ['user_id', '123'],
        ['user_name', 'John'],
      ]);

      const result = await map1.semanticallyEquals(map2);

      expect(result.equivalent).toBe(true);
      expect(result.keyMappings).toContainEqual(['userId', 'user_id']);
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different maps', async () => {
      const client = createMockLLMClient(mockNotEquivalentMapsResponse);
      const map1 = SemanticMap.from(
        new Map([
          ['color', 'red'],
          ['size', 'large'],
        ]),
        client
      );
      const map2 = new Map([
        ['price', '100'],
        ['quantity', '5'],
      ]);

      const result = await map1.semanticallyEquals(map2);

      expect(result.equivalent).toBe(false);
    });

    test('accepts SemanticMap as parameter', async () => {
      const client = createMockLLMClient(mockEquivalentMapsResponse);
      const map1 = SemanticMap.from(
        new Map([['key', 'value']]),
        client
      );
      const map2 = SemanticMap.from(new Map([['key', 'value']]), client);

      const result = await map1.semanticallyEquals(map2);

      expect(result.equivalent).toBe(true);
    });

    test('returns equivalent for two empty maps', async () => {
      const map1 = SemanticMap.empty<string, string>();
      const map2 = new Map<string, string>();

      const result = await map1.semanticallyEquals(map2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('findKeys', () => {
    test('finds keys matching criteria', async () => {
      const client = createMockLLMClient(mockFindSecurityKeysResponse);
      const map = SemanticMap.from(
        new Map([
          ['API_KEY', 'key-123'],
          ['APP_NAME', 'MyApp'],
          ['AUTH_TOKEN', 'token-456'],
        ]),
        client
      );

      const results = await map.findKeys('security related settings');

      expect(results.length).toBe(2);
      expect(results[0]?.key).toBe('API_KEY');
      expect(results[0]?.relevance).toBe(0.95);
    });

    test('returns empty array when no matches', async () => {
      const client = createMockLLMClient(mockFindNoKeysResponse);
      const map = SemanticMap.from(
        new Map([
          ['color', 'red'],
          ['size', 'large'],
        ]),
        client
      );

      const results = await map.findKeys('database settings');

      expect(results).toEqual([]);
    });

    test('returns empty array for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const results = await map.findKeys('any criteria');

      expect(results).toEqual([]);
    });
  });

  describe('findValues', () => {
    test('finds values matching criteria', async () => {
      const client = createMockLLMClient(mockFindExpensiveValuesResponse);
      const map = SemanticMap.from(
        new Map<string, object>([
          ['widget', { name: 'Widget', price: 25 }],
          ['laptop', { name: 'Laptop', price: 1200 }],
          ['pen', { name: 'Pen', price: 5 }],
          ['phone', { name: 'Phone', price: 800 }],
        ]),
        client
      );

      const results = await map.findValues('expensive items');

      expect(results.length).toBe(2);
      expect(results[0]?.key).toBe('laptop');
      expect(results[0]?.relevance).toBe(0.95);
    });

    test('returns empty array when no matches', async () => {
      const client = createMockLLMClient(mockFindNoValuesResponse);
      const map = SemanticMap.from(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        client
      );

      const results = await map.findValues('text content');

      expect(results).toEqual([]);
    });

    test('returns empty array for empty map', async () => {
      const map = SemanticMap.empty<string, number>();

      const results = await map.findValues('any criteria');

      expect(results).toEqual([]);
    });
  });

  describe('semanticMerge', () => {
    test('merges maps with prefer-other conflict resolution', async () => {
      const client = createMockLLMClient(mockMergePreferOtherResponse);
      const map1 = SemanticMap.from(
        new Map([
          ['userId', 'user-123'],
          ['userName', 'John'],
        ]),
        client
      );
      const map2 = new Map([
        ['user_id', 'user-456'],
        ['email', 'new@example.com'],
      ]);

      const merged = await map1.semanticMerge(map2, {
        conflictResolution: 'prefer-other',
      });

      expect(merged.size).toBe(3);
    });

    test('merges maps with prefer-this conflict resolution', async () => {
      const client = createMockLLMClient(mockMergePreferThisResponse);
      const map1 = SemanticMap.from(
        new Map([
          ['userId', 'user-123'],
          ['userName', 'John'],
        ]),
        client
      );
      const map2 = new Map([['userId', 'user-456']]);

      const merged = await map1.semanticMerge(map2, {
        conflictResolution: 'prefer-this',
      });

      expect(merged.get('userId')).toBe('user-123');
    });

    test('returns copy of other when this is empty', async () => {
      const client = createMockLLMClient(mockMergePreferOtherResponse);
      const map1 = SemanticMap.empty<string, string>(client);
      const map2 = new Map([['key', 'value']]);

      const merged = await map1.semanticMerge(map2);

      expect(merged.get('key')).toBe('value');
    });

    test('returns copy of this when other is empty', async () => {
      const client = createMockLLMClient(mockMergePreferOtherResponse);
      const map1 = SemanticMap.from(new Map([['key', 'value']]), client);
      const map2 = new Map<string, string>();

      const merged = await map1.semanticMerge(map2);

      expect(merged.get('key')).toBe('value');
    });
  });

  describe('validate', () => {
    test('returns valid for compliant map', async () => {
      const client = createMockLLMClient(mockValidMapResponse);
      const map = SemanticMap.from(
        new Map([
          ['API_KEY', 'key-123'],
          ['DB_HOST', 'localhost'],
        ]),
        client
      );

      const result = await map.validate({
        keys: 'should be SCREAMING_SNAKE_CASE',
      });

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    test('returns issues for non-compliant map', async () => {
      const client = createMockLLMClient(mockInvalidMapResponse);
      const map = SemanticMap.from(
        new Map([
          ['api_key', 'key-123'],
          ['password', 'secret123'],
        ]),
        client
      );

      const result = await map.validate({
        keys: 'should be SCREAMING_SNAKE_CASE',
        values: 'no sensitive data',
      });

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
    });

    test('returns valid for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const result = await map.validate({ keys: 'any rule' });

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('suggestMissingKeys', () => {
    test('suggests missing keys based on patterns', async () => {
      const client = createMockLLMClient(mockSuggestMissingKeysResponse);
      const map = SemanticMap.from(
        new Map([
          ['LOG_FILE', '/var/log/app.log'],
          ['LOG_FORMAT', 'json'],
          ['TIMEOUT_MS', '5000'],
        ]),
        client
      );

      const suggestions = await map.suggestMissingKeys();

      expect(suggestions.length).toBe(2);
      expect(suggestions[0]?.key).toBe('LOG_LEVEL');
      expect(suggestions[0]?.reason).toContain('logging');
    });

    test('returns empty array when no suggestions', async () => {
      const client = createMockLLMClient(mockNoSuggestionsResponse);
      const map = SemanticMap.from(new Map([['complete', 'data']]), client);

      const suggestions = await map.suggestMissingKeys();

      expect(suggestions).toEqual([]);
    });

    test('returns empty array for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const suggestions = await map.suggestMissingKeys();

      expect(suggestions).toEqual([]);
    });
  });

  describe('groupBy', () => {
    test('groups entries by criteria', async () => {
      const client = createMockLLMClient(mockGroupByCategoryResponse);
      const map = SemanticMap.from(
        new Map([
          ['DB_HOST', 'localhost'],
          ['DB_PORT', '5432'],
          ['AUTH_SECRET', 'secret'],
          ['AUTH_TIMEOUT', '3600'],
          ['LOG_LEVEL', 'info'],
        ]),
        client
      );

      const groups = await map.groupBy('by category');

      expect(groups.size).toBe(3);
      expect(groups.has('database')).toBe(true);
      expect(groups.has('authentication')).toBe(true);
      expect(groups.has('logging')).toBe(true);
      expect(groups.get('database')?.size).toBe(2);
    });

    test('returns empty map for empty input', async () => {
      const map = SemanticMap.empty<string, string>();

      const groups = await map.groupBy('any criteria');

      expect(groups.size).toBe(0);
    });
  });

  describe('summarize', () => {
    test('returns human-readable summary', async () => {
      const client = createMockLLMClient(mockConfigSummaryResponse);
      const map = SemanticMap.from(
        new Map([
          ['DB_HOST', 'localhost'],
          ['DB_PORT', '5432'],
          ['API_KEY', 'key-123'],
        ]),
        client
      );

      const summary = await map.summarize();

      expect(summary).toContain('configuration');
      expect(summary).toContain('Database');
    });

    test('returns message for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const summary = await map.summarize();

      expect(summary).toBe('Empty map with no entries.');
    });
  });

  describe('inferPurpose', () => {
    test('infers configuration purpose', async () => {
      const client = createMockLLMClient(mockInferConfigPurposeResponse);
      const map = SemanticMap.from(
        new Map([
          ['DB_HOST', 'localhost'],
          ['DB_PORT', '5432'],
          ['DB_NAME', 'myapp'],
        ]),
        client
      );

      const result = await map.inferPurpose();

      expect(result.purpose).toBe('configuration');
      expect(result.subcategory).toBe('database-settings');
      expect(result.confidence).toBe(0.92);
    });

    test('infers user preferences purpose', async () => {
      const client = createMockLLMClient(mockInferPreferencesPurposeResponse);
      const map = SemanticMap.from(
        new Map([
          ['theme', 'dark'],
          ['fontSize', '14px'],
          ['language', 'en'],
        ]),
        client
      );

      const result = await map.inferPurpose();

      expect(result.purpose).toBe('user-preferences');
    });

    test('returns empty purpose for empty map', async () => {
      const map = SemanticMap.empty<string, string>();

      const result = await map.inferPurpose();

      expect(result.purpose).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('standard map methods', () => {
    describe('forEach', () => {
      test('executes callback for each entry', () => {
        const map = SemanticMap.of(['a', 1], ['b', 2], ['c', 3]);
        const results: [string, number][] = [];

        map.forEach((value, key) => {
          results.push([key, value]);
        });

        expect(results).toEqual([
          ['a', 1],
          ['b', 2],
          ['c', 3],
        ]);
      });
    });

    describe('clear', () => {
      test('returns empty map', () => {
        const map = SemanticMap.of(['a', 1], ['b', 2]);
        const cleared = map.clear();

        expect(cleared.size).toBe(0);
      });

      test('does not modify original map', () => {
        const map = SemanticMap.of(['a', 1]);
        map.clear();

        expect(map.size).toBe(1);
      });
    });

    describe('iterator', () => {
      test('supports for...of iteration', () => {
        const map = SemanticMap.of(['a', 1], ['b', 2]);
        const results: [string, number][] = [];

        for (const entry of map) {
          results.push(entry);
        }

        expect(results).toEqual([
          ['a', 1],
          ['b', 2],
        ]);
      });

      test('supports spread operator', () => {
        const map = SemanticMap.of(['a', 1], ['b', 2]);
        const entries = [...map];

        expect(entries).toEqual([
          ['a', 1],
          ['b', 2],
        ]);
      });
    });
  });

  describe('toString', () => {
    test('returns string representation', () => {
      const map = SemanticMap.of<string, string | number>(['name', 'John'], ['age', 30]);
      const str = map.toString();

      expect(str).toContain('SemanticMap(2)');
      expect(str).toContain('name => "John"');
      expect(str).toContain('age => 30');
    });

    test('handles empty map', () => {
      const map = SemanticMap.empty<string, string>();
      const str = map.toString();

      expect(str).toBe('SemanticMap(0) {  }');
    });
  });

  describe('toJSON', () => {
    test('returns object for JSON serialization', () => {
      const map = SemanticMap.of(['a', 1], ['b', 2]);
      const json = map.toJSON();

      expect(json).toEqual({ a: 1, b: 2 });
    });

    test('works with JSON.stringify', () => {
      const map = SemanticMap.of<string, string | number>(['name', 'John'], ['age', 30]);
      const str = JSON.stringify(map);

      expect(str).toBe('{"name":"John","age":30}');
    });
  });
});

describe('SemanticMap prompts', () => {
  test('createSemanticGetPrompt includes keys and query', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt(
      ['userId', 'userName'],
      'user identifier'
    );

    expect(prompt).toContain('userId');
    expect(prompt).toContain('userName');
    expect(prompt).toContain('user identifier');
  });

  test('createSemanticGetPrompt includes context when provided', async () => {
    const { createSemanticGetPrompt } = await import('../prompts.ts');
    const prompt = createSemanticGetPrompt(['key'], 'query', {
      language: 'es',
    });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('"language":"es"');
  });

  test('createSemanticallyEqualsPrompt includes both maps', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      [['key1', 'value1']],
      [['key2', 'value2']]
    );

    expect(prompt).toContain('Map 1 entries:');
    expect(prompt).toContain('Map 2 entries:');
    expect(prompt).toContain('key1');
    expect(prompt).toContain('key2');
  });

  test('createValidatePrompt includes rules', async () => {
    const { createValidatePrompt } = await import('../prompts.ts');
    const prompt = createValidatePrompt([['KEY', 'value']], {
      keys: 'should be SCREAMING_SNAKE_CASE',
      values: 'no sensitive data',
    });

    expect(prompt).toContain('SCREAMING_SNAKE_CASE');
    expect(prompt).toContain('no sensitive data');
  });

  test('createGroupByPrompt includes criteria', async () => {
    const { createGroupByPrompt } = await import('../prompts.ts');
    const prompt = createGroupByPrompt([['key', 'value']], 'by category');

    expect(prompt).toContain('by category');
  });
});
