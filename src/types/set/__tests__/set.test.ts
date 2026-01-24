/**
 * Tests for SemanticSet
 */

import { describe, test, expect } from 'bun:test';
import { SemanticSet } from '../set.ts';
import {
  createMockLLMClient,
  mockSemanticHasTrueResponse,
  mockSemanticHasFalseResponse,
  mockShouldAddResponse,
  mockShouldNotAddResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockIntersectionResponse,
  mockEmptyIntersectionResponse,
  mockUnionResponse,
  mockDifferenceResponse,
  mockFilterResponse,
  mockEmptyFilterResponse,
  mockGroupByResponse,
  mockSummaryResponse,
  mockSuggestRelatedResponse,
  mockValidSetResponse,
  mockInvalidSetResponse,
  mockProgrammingThemeResponse,
} from './mocks.ts';

describe('SemanticSet', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('from()', () => {
    test('creates SemanticSet from array', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b', 'c'], client);

      expect(set).toBeInstanceOf(SemanticSet);
      expect(set.size).toBe(3);
    });

    test('creates SemanticSet from Set', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const sourceSet = new Set([1, 2, 3]);
      const set = SemanticSet.from(sourceSet, client);

      expect(set.size).toBe(3);
      expect(set.has(1)).toBe(true);
    });

    test('creates empty SemanticSet', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.empty<string>(client);

      expect(set.size).toBe(0);
    });

    test('creates SemanticSet with of()', () => {
      const set = SemanticSet.of('a', 'b', 'c');

      expect(set.size).toBe(3);
    });
  });

  // ===========================================================================
  // STANDARD SET OPERATIONS TESTS
  // ===========================================================================

  describe('standard set operations', () => {
    test('add adds value', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.empty<string>(client);

      set.add('value');
      expect(set.has('value')).toBe(true);
      expect(set.size).toBe(1);
    });

    test('has returns true for existing value', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      expect(set.has('a')).toBe(true);
    });

    test('has returns false for non-existing value', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      expect(set.has('c')).toBe(false);
    });

    test('delete removes value', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      expect(set.delete('a')).toBe(true);
      expect(set.size).toBe(1);
      expect(set.has('a')).toBe(false);
    });

    test('clear removes all values', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b', 'c'], client);

      set.clear();
      expect(set.size).toBe(0);
    });

    test('values returns all values', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      const values = Array.from(set.values());
      expect(values).toContain('a');
      expect(values).toContain('b');
    });

    test('forEach iterates over values', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      const collected: string[] = [];
      set.forEach((value) => collected.push(value));

      expect(collected).toHaveLength(2);
    });

    test('is iterable', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      const values = [...set];
      expect(values).toHaveLength(2);
    });
  });

  // ===========================================================================
  // SEMANTIC HAS TESTS
  // ===========================================================================

  describe('semanticHas()', () => {
    test('returns true for semantic match', async () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['red', 'blue', 'green'], client);

      const result = await set.semanticHas('crimson');
      expect(result).toBe(true);
    });

    test('returns false for no match', async () => {
      const client = createMockLLMClient(mockSemanticHasFalseResponse);
      const set = SemanticSet.from(['red', 'blue', 'green'], client);

      const result = await set.semanticHas('elephant');
      expect(result).toBe(false);
    });

    test('returns false for empty set', async () => {
      const client = createMockLLMClient(mockSemanticHasFalseResponse);
      const set = SemanticSet.empty<string>(client);

      const result = await set.semanticHas('anything');
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // SEMANTIC ADD TESTS
  // ===========================================================================

  describe('semanticAdd()', () => {
    test('adds unique value', async () => {
      const client = createMockLLMClient(mockShouldAddResponse);
      const set = SemanticSet.from(['JavaScript', 'Python'], client);

      const added = await set.semanticAdd('Ruby');
      expect(added).toBe(true);
      expect(set.has('Ruby')).toBe(true);
    });

    test('does not add semantic duplicate', async () => {
      const client = createMockLLMClient(mockShouldNotAddResponse);
      const set = SemanticSet.from(['machine learning', 'data science'], client);

      const added = await set.semanticAdd('ML');
      expect(added).toBe(false);
    });

    test('adds to empty set', async () => {
      const client = createMockLLMClient(mockShouldAddResponse);
      const set = SemanticSet.empty<string>(client);

      const added = await set.semanticAdd('first');
      expect(added).toBe(true);
      expect(set.size).toBe(1);
    });
  });

  // ===========================================================================
  // SEMANTICALLY EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent sets', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const set1 = SemanticSet.from(['red', 'blue'], client);
      const set2 = new Set(['crimson', 'azure']);

      const result = await set1.semanticallyEquals(set2);
      expect(result.equivalent).toBe(true);
      expect(result.mappings).toBeDefined();
    });

    test('returns false for non-equivalent sets', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const set1 = SemanticSet.from(['red', 'blue'], client);
      const set2 = new Set(['cat', 'dog']);

      const result = await set1.semanticallyEquals(set2);
      expect(result.equivalent).toBe(false);
    });

    test('compares with another SemanticSet', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const set1 = SemanticSet.from(['red', 'blue'], client);
      const set2 = SemanticSet.from(['crimson', 'azure'], client);

      const result = await set1.semanticallyEquals(set2);
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // SEMANTIC INTERSECTION TESTS
  // ===========================================================================

  describe('semanticIntersection()', () => {
    test('returns intersection with semantic matching', async () => {
      const client = createMockLLMClient(mockIntersectionResponse);
      const set1 = SemanticSet.from(['JavaScript', 'Python', 'Ruby'], client);
      const set2 = new Set(['JS', 'Python', 'Go']);

      const result = await set1.semanticIntersection(set2);
      expect(result).toBeInstanceOf(SemanticSet);
      expect(result.size).toBeGreaterThan(0);
    });

    test('returns empty for no intersection', async () => {
      const client = createMockLLMClient(mockEmptyIntersectionResponse);
      const set1 = SemanticSet.from(['a', 'b'], client);
      const set2 = new Set(['x', 'y']);

      const result = await set1.semanticIntersection(set2);
      expect(result.size).toBe(0);
    });

    test('handles empty source set', async () => {
      const client = createMockLLMClient(mockEmptyIntersectionResponse);
      const set1 = SemanticSet.empty<string>(client);
      const set2 = new Set(['a', 'b']);

      const result = await set1.semanticIntersection(set2);
      expect(result.size).toBe(0);
    });
  });

  // ===========================================================================
  // SEMANTIC UNION TESTS
  // ===========================================================================

  describe('semanticUnion()', () => {
    test('returns union with deduplication', async () => {
      const client = createMockLLMClient(mockUnionResponse);
      const set1 = SemanticSet.from(['JavaScript', 'Python'], client);
      const set2 = new Set(['JS', 'TypeScript', 'Ruby']);

      const result = await set1.semanticUnion(set2);
      expect(result).toBeInstanceOf(SemanticSet);
      expect(result.size).toBeGreaterThan(0);
    });

    test('handles empty first set', async () => {
      const client = createMockLLMClient(mockUnionResponse);
      const set1 = SemanticSet.empty<string>(client);
      const set2 = new Set(['a', 'b']);

      const result = await set1.semanticUnion(set2);
      expect(result.size).toBe(2);
    });

    test('handles empty second set', async () => {
      const client = createMockLLMClient(mockUnionResponse);
      const set1 = SemanticSet.from(['a', 'b'], client);
      const set2 = new Set<string>();

      const result = await set1.semanticUnion(set2);
      expect(result.size).toBe(2);
    });
  });

  // ===========================================================================
  // SEMANTIC DIFFERENCE TESTS
  // ===========================================================================

  describe('semanticDifference()', () => {
    test('returns semantic difference', async () => {
      const client = createMockLLMClient(mockDifferenceResponse);
      const set1 = SemanticSet.from(['JavaScript', 'TypeScript', 'Ruby'], client);
      const set2 = new Set(['JS', 'Python']);

      const result = await set1.semanticDifference(set2);
      expect(result).toBeInstanceOf(SemanticSet);
    });

    test('handles empty first set', async () => {
      const client = createMockLLMClient(mockDifferenceResponse);
      const set1 = SemanticSet.empty<string>(client);
      const set2 = new Set(['a', 'b']);

      const result = await set1.semanticDifference(set2);
      expect(result.size).toBe(0);
    });

    test('handles empty second set', async () => {
      const client = createMockLLMClient(mockDifferenceResponse);
      const set1 = SemanticSet.from(['a', 'b'], client);
      const set2 = new Set<string>();

      const result = await set1.semanticDifference(set2);
      expect(result.size).toBe(2);
    });
  });

  // ===========================================================================
  // SEMANTIC FILTER TESTS
  // ===========================================================================

  describe('semanticFilter()', () => {
    test('filters by criteria', async () => {
      const client = createMockLLMClient(mockFilterResponse);
      const set = SemanticSet.from([
        'Node.js', 'React', 'PostgreSQL', 'Redis', 'Vue'
      ], client);

      const result = await set.semanticFilter('backend technologies');
      expect(result).toBeInstanceOf(SemanticSet);
      expect(result.size).toBeGreaterThan(0);
    });

    test('returns empty for no matches', async () => {
      const client = createMockLLMClient(mockEmptyFilterResponse);
      const set = SemanticSet.from(['a', 'b', 'c'], client);

      const result = await set.semanticFilter('unmatched criteria');
      expect(result.size).toBe(0);
    });

    test('handles empty set', async () => {
      const client = createMockLLMClient(mockEmptyFilterResponse);
      const set = SemanticSet.empty<string>(client);

      const result = await set.semanticFilter('any criteria');
      expect(result.size).toBe(0);
    });
  });

  // ===========================================================================
  // GROUP BY TESTS
  // ===========================================================================

  describe('groupBy()', () => {
    test('groups values by criteria', async () => {
      const client = createMockLLMClient(mockGroupByResponse);
      const set = SemanticSet.from([
        'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Go'
      ], client);

      const groups = await set.groupBy('technology area');
      expect(groups).toBeInstanceOf(Map);
      expect(groups.size).toBeGreaterThan(0);
    });

    test('handles empty set', async () => {
      const client = createMockLLMClient(mockGroupByResponse);
      const set = SemanticSet.empty<string>(client);

      const groups = await set.groupBy('any criteria');
      expect(groups.size).toBe(0);
    });
  });

  // ===========================================================================
  // SUMMARIZE TESTS
  // ===========================================================================

  describe('summarize()', () => {
    test('returns summary', async () => {
      const client = createMockLLMClient(mockSummaryResponse);
      const set = SemanticSet.from(['JavaScript', 'Python', 'Go'], client);

      const summary = await set.summarize();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    test('handles empty set', async () => {
      const client = createMockLLMClient(mockSummaryResponse);
      const set = SemanticSet.empty<string>(client);

      const summary = await set.summarize();
      expect(summary).toContain('Empty');
    });
  });

  // ===========================================================================
  // SUGGEST RELATED TESTS
  // ===========================================================================

  describe('suggestRelated()', () => {
    test('suggests related values', async () => {
      const client = createMockLLMClient(mockSuggestRelatedResponse);
      const set = SemanticSet.from(['JavaScript', 'Node.js'], client);

      const suggestions = await set.suggestRelated();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('value');
      expect(suggestions[0]).toHaveProperty('reason');
    });

    test('handles empty set', async () => {
      const client = createMockLLMClient(mockSuggestRelatedResponse);
      const set = SemanticSet.empty<string>(client);

      const suggestions = await set.suggestRelated();
      expect(suggestions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // VALIDATE TESTS
  // ===========================================================================

  describe('validate()', () => {
    test('returns valid for valid set', async () => {
      const client = createMockLLMClient(mockValidSetResponse);
      const set = SemanticSet.from(['javascript', 'python'], client);

      const result = await set.validate(['must be lowercase']);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('returns issues for invalid set', async () => {
      const client = createMockLLMClient(mockInvalidSetResponse);
      const set = SemanticSet.from(['ABC', 'test!'], client);

      const result = await set.validate(['must be lowercase', 'no special characters']);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('handles empty set', async () => {
      const client = createMockLLMClient(mockValidSetResponse);
      const set = SemanticSet.empty<string>(client);

      const result = await set.validate(['any rule']);
      expect(result.valid).toBe(true);
    });
  });

  // ===========================================================================
  // INFER THEME TESTS
  // ===========================================================================

  describe('inferTheme()', () => {
    test('infers programming theme', async () => {
      const client = createMockLLMClient(mockProgrammingThemeResponse);
      const set = SemanticSet.from(['JavaScript', 'Python', 'Go'], client);

      const result = await set.inferTheme();
      expect(result.theme).toBe('programming languages');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('handles empty set', async () => {
      const client = createMockLLMClient(mockProgrammingThemeResponse);
      const set = SemanticSet.empty<string>(client);

      const result = await set.inferTheme();
      expect(result.theme).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('valueOf returns Set copy', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      const underlying = set.valueOf();
      expect(underlying).toBeInstanceOf(Set);
      expect(underlying.has('a')).toBe(true);
    });

    test('toArray returns array', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      const arr = set.toArray();
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(2);
    });

    test('toJSON returns array', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      const json = set.toJSON();
      expect(Array.isArray(json)).toBe(true);
    });

    test('toString returns description', () => {
      const client = createMockLLMClient(mockSemanticHasTrueResponse);
      const set = SemanticSet.from(['a', 'b'], client);

      expect(set.toString()).toBe('SemanticSet(2)');
    });
  });
});
