/**
 * Tests for SemanticMap
 */

import { describe, test, expect } from 'bun:test';
import { SemanticMap } from '../map.ts';
import {
  createMockLLMClient,
  mockSemanticGetMatchResponse,
  mockSemanticGetNoMatchResponse,
  mockSemanticHasTrueResponse,
  mockSemanticHasFalseResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockFindSecurityKeysResponse,
  mockFindNoKeysResponse,
  mockFindExpensiveResponse,
  mockMergeResponse,
  mockValidMapResponse,
  mockInvalidMapResponse,
  mockMissingKeysResponse,
  mockGroupByResponse,
  mockSummaryResponse,
  mockConfigPurposeResponse,
} from './mocks.ts';

describe('SemanticMap', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('from()', () => {
    test('creates SemanticMap from entries', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['key1', 'value1'], ['key2', 'value2']], client);

      expect(map).toBeInstanceOf(SemanticMap);
      expect(map.size).toBe(2);
    });

    test('creates SemanticMap from Map', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const sourceMap = new Map([['a', 1], ['b', 2]]);
      const map = SemanticMap.from(sourceMap, client);

      expect(map.size).toBe(2);
      expect(map.get('a')).toBe(1);
    });

    test('creates empty SemanticMap', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.empty<string, number>(client);

      expect(map.size).toBe(0);
    });
  });

  // ===========================================================================
  // STANDARD MAP OPERATIONS TESTS
  // ===========================================================================

  describe('standard map operations', () => {
    test('get returns value for existing key', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['userId', 123]], client);

      expect(map.get('userId')).toBe(123);
    });

    test('get returns undefined for non-existing key', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['userId', 123]], client);

      expect(map.get('nonexistent' as 'userId')).toBeUndefined();
    });

    test('set adds new entry', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from<string, number>([], client);

      map.set('key', 42);
      expect(map.get('key')).toBe(42);
      expect(map.size).toBe(1);
    });

    test('has returns true for existing key', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['key', 'value']], client);

      expect(map.has('key')).toBe(true);
    });

    test('has returns false for non-existing key', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['key', 'value']], client);

      expect(map.has('other' as 'key')).toBe(false);
    });

    test('delete removes entry', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['key', 'value']], client);

      expect(map.delete('key')).toBe(true);
      expect(map.size).toBe(0);
    });

    test('clear removes all entries', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      map.clear();
      expect(map.size).toBe(0);
    });

    test('keys returns all keys', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const keys = Array.from(map.keys());
      expect(keys).toContain('a');
      expect(keys).toContain('b');
    });

    test('values returns all values', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const values = Array.from(map.values());
      expect(values).toContain(1);
      expect(values).toContain(2);
    });

    test('entries returns all entries', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const entries = Array.from(map.entries());
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
    });

    test('forEach iterates over entries', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const collected: [string, number][] = [];
      map.forEach((value, key) => collected.push([key, value]));

      expect(collected).toHaveLength(2);
    });

    test('is iterable', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const entries = [...map];
      expect(entries).toHaveLength(2);
    });
  });

  // ===========================================================================
  // SEMANTIC GET TESTS
  // ===========================================================================

  describe('semanticGet()', () => {
    test('finds matching key semantically', async () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from<string, unknown>([
        ['userId', 123],
        ['email', 'test@example.com'],
      ], client);

      const result = await map.semanticGet('user identifier');
      expect(result.matchedKey).toBe('userId');
      expect(result.value).toBe(123);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('returns undefined when no match found', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const map = SemanticMap.from([['userId', 123]], client);

      const result = await map.semanticGet('completely unrelated');
      expect(result.matchedKey).toBeUndefined();
      expect(result.value).toBeUndefined();
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockSemanticGetNoMatchResponse);
      const map = SemanticMap.empty<string, number>(client);

      const result = await map.semanticGet('any query');
      expect(result.value).toBeUndefined();
      expect(result.confidence).toBe(1.0);
    });

    test('accepts context for lookup', async () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['userId', 123]], client);

      const result = await map.semanticGet('identifier', { language: 'en' });
      expect(result.matchedKey).toBeDefined();
    });
  });

  // ===========================================================================
  // SEMANTIC HAS TESTS
  // ===========================================================================

  describe('semanticHas()', () => {
    test('returns true for semantic match', async () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const map = SemanticMap.from([['email', 'test@example.com']], client);

      const result = await map.semanticHas('e-mail address');
      expect(result).toBe(true);
    });

    test('returns false for no match', async () => {
      const client = createMockLLMClient(mockSemanticHasFalseResponse);
      const map = SemanticMap.from([['email', 'test@example.com']], client);

      const result = await map.semanticHas('phone number');
      expect(result).toBe(false);
    });

    test('returns false for empty map', async () => {
      const client = createMockLLMClient(mockSemanticHasFalseResponse);
      const map = SemanticMap.empty<string, string>(client);

      const result = await map.semanticHas('any key');
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // SEMANTICALLY EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent maps', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const map1 = SemanticMap.from<string, unknown>([
        ['userId', 123],
        ['firstName', 'John'],
      ], client);
      const map2 = new Map([
        ['user_id', 123],
        ['first_name', 'John'],
      ] as [string, unknown][]);

      const result = await map1.semanticallyEquals(map2);
      expect(result.equivalent).toBe(true);
      expect(result.mappings).toBeDefined();
    });

    test('returns false for non-equivalent maps', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const map1 = SemanticMap.from([['userId', 123]], client);
      const map2 = new Map([['email', 'test@example.com']] as [string, string][]);

      const result = await map1.semanticallyEquals(map2 as Map<string, unknown>);
      expect(result.equivalent).toBe(false);
    });

    test('compares with another SemanticMap', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const map1 = SemanticMap.from([['userId', 123]], client);
      const map2 = SemanticMap.from([['user_id', 123]], client);

      const result = await map1.semanticallyEquals(map2);
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // FIND KEYS TESTS
  // ===========================================================================

  describe('findKeys()', () => {
    test('finds keys matching criteria', async () => {
      const client = createMockLLMClient(mockFindSecurityKeysResponse);
      const map = SemanticMap.from([
        ['API_KEY', 'secret'],
        ['AUTH_TOKEN', 'token123'],
        ['DB_HOST', 'localhost'],
      ], client);

      const results = await map.findKeys('security related settings');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('key');
      expect(results[0]).toHaveProperty('relevance');
    });

    test('returns empty array for no matches', async () => {
      const client = createMockLLMClient(mockFindNoKeysResponse);
      const map = SemanticMap.from([['key', 'value']], client);

      const results = await map.findKeys('nonexistent criteria');
      expect(results).toHaveLength(0);
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockFindNoKeysResponse);
      const map = SemanticMap.empty<string, string>(client);

      const results = await map.findKeys('any criteria');
      expect(results).toHaveLength(0);
    });
  });

  // ===========================================================================
  // FIND VALUES TESTS
  // ===========================================================================

  describe('findValues()', () => {
    test('finds entries with matching values', async () => {
      const client = createMockLLMClient(mockFindExpensiveResponse);
      const map = SemanticMap.from([
        ['laptop', { price: 1200 }],
        ['phone', { price: 800 }],
        ['cable', { price: 10 }],
      ], client);

      const results = await map.findValues('expensive items');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('key');
      expect(results[0]).toHaveProperty('value');
      expect(results[0]).toHaveProperty('relevance');
    });
  });

  // ===========================================================================
  // SEMANTIC MERGE TESTS
  // ===========================================================================

  describe('semanticMerge()', () => {
    test('merges maps with semantic key matching', async () => {
      const client = createMockLLMClient(mockMergeResponse);
      const map1 = SemanticMap.from<string, unknown>([
        ['userId', 123],
        ['email', 'user@example.com'],
      ], client);
      const map2 = new Map([
        ['firstName', 'John'],
        ['age', 30],
      ] as [string, unknown][]);

      const merged = await map1.semanticMerge(map2);
      expect(merged).toBeInstanceOf(SemanticMap);
      expect(merged.size).toBeGreaterThan(0);
    });

    test('accepts conflict resolution option', async () => {
      const client = createMockLLMClient(mockMergeResponse);
      const map1 = SemanticMap.from([['key', 'value1']], client);
      const map2 = new Map([['key', 'value2']] as [string, string][]);

      const merged = await map1.semanticMerge(map2 as Map<string, unknown>, {
        conflictResolution: 'prefer-other',
      });
      expect(merged).toBeInstanceOf(SemanticMap);
    });
  });

  // ===========================================================================
  // VALIDATE TESTS
  // ===========================================================================

  describe('validate()', () => {
    test('returns valid for valid map', async () => {
      const client = createMockLLMClient(mockValidMapResponse);
      const map = SemanticMap.from([
        ['API_KEY', 'abc123'],
        ['DB_HOST', 'localhost'],
      ], client);

      const result = await map.validate({
        keys: 'should be SCREAMING_SNAKE_CASE',
      });
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('returns issues for invalid map', async () => {
      const client = createMockLLMClient(mockInvalidMapResponse);
      const map = SemanticMap.from([
        ['api_key', 'secret-password-123'],
      ], client);

      const result = await map.validate({
        keys: 'should be SCREAMING_SNAKE_CASE',
        values: 'no sensitive data',
      });
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockValidMapResponse);
      const map = SemanticMap.empty<string, string>(client);

      const result = await map.validate({ keys: 'any rule' });
      expect(result.valid).toBe(true);
    });
  });

  // ===========================================================================
  // SUGGEST MISSING KEYS TESTS
  // ===========================================================================

  describe('suggestMissingKeys()', () => {
    test('suggests missing keys', async () => {
      const client = createMockLLMClient(mockMissingKeysResponse);
      const map = SemanticMap.from<string, unknown>([
        ['DB_HOST', 'localhost'],
        ['DB_PORT', 5432],
      ], client);

      const suggestions = await map.suggestMissingKeys();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('key');
      expect(suggestions[0]).toHaveProperty('reason');
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockMissingKeysResponse);
      const map = SemanticMap.empty<string, string>(client);

      const suggestions = await map.suggestMissingKeys();
      expect(suggestions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // GROUP BY TESTS
  // ===========================================================================

  describe('groupBy()', () => {
    test('groups entries by criteria', async () => {
      const client = createMockLLMClient(mockGroupByResponse);
      const map = SemanticMap.from<string, unknown>([
        ['DB_HOST', 'localhost'],
        ['DB_PORT', 5432],
        ['DB_NAME', 'mydb'],
        ['API_KEY', 'secret'],
        ['AUTH_TOKEN', 'token'],
      ], client);

      const groups = await map.groupBy('category');
      expect(groups).toBeInstanceOf(Map);
      expect(groups.size).toBeGreaterThan(0);
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockGroupByResponse);
      const map = SemanticMap.empty<string, string>(client);

      const groups = await map.groupBy('any criteria');
      expect(groups.size).toBe(0);
    });
  });

  // ===========================================================================
  // SUMMARIZE TESTS
  // ===========================================================================

  describe('summarize()', () => {
    test('returns summary of map contents', async () => {
      const client = createMockLLMClient(mockSummaryResponse);
      const map = SemanticMap.from<string, unknown>([
        ['theme', 'dark'],
        ['notifications', true],
        ['language', 'en-US'],
      ], client);

      const summary = await map.summarize();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockSummaryResponse);
      const map = SemanticMap.empty<string, string>(client);

      const summary = await map.summarize();
      expect(summary).toContain('Empty');
    });
  });

  // ===========================================================================
  // INFER PURPOSE TESTS
  // ===========================================================================

  describe('inferPurpose()', () => {
    test('infers configuration purpose', async () => {
      const client = createMockLLMClient(mockConfigPurposeResponse);
      const map = SemanticMap.from<string, unknown>([
        ['DB_HOST', 'localhost'],
        ['DB_PORT', 5432],
      ], client);

      const result = await map.inferPurpose();
      expect(result.purpose).toBe('configuration');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('handles empty map', async () => {
      const client = createMockLLMClient(mockConfigPurposeResponse);
      const map = SemanticMap.empty<string, string>(client);

      const result = await map.inferPurpose();
      expect(result.purpose).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('valueOf returns Map copy', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['key', 'value']], client);

      const underlying = map.valueOf();
      expect(underlying).toBeInstanceOf(Map);
      expect(underlying.get('key')).toBe('value');
    });

    test('toObject returns plain object', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const obj = map.toObject();
      expect(obj).toEqual({ a: 1, b: 2 });
    });

    test('toJSON returns plain object', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      const json = map.toJSON();
      expect(json).toEqual({ a: 1, b: 2 });
    });

    test('toString returns description', () => {
      const client = createMockLLMClient(mockSemanticGetMatchResponse);
      const map = SemanticMap.from([['a', 1], ['b', 2]], client);

      expect(map.toString()).toBe('SemanticMap(2)');
    });
  });
});
