/**
 * Tests for SemanticSet
 */

import { describe, test, expect } from 'bun:test';
import { SemanticSet } from '../set.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  createFailingMockLLMClient,
  mockSemanticHasExistsResponse,
  mockSemanticHasNotExistsResponse,
  mockSemanticHasAbbreviationResponse,
  mockSemanticAddShouldAddResponse,
  mockSemanticAddDuplicateResponse,
  mockSetsEquivalentResponse,
  mockSetsNotEquivalentResponse,
  mockSetsExactMatchResponse,
  mockIntersectionWithMatchesResponse,
  mockIntersectionEmptyResponse,
  mockUnionWithDeduplicationResponse,
  mockUnionNoOverlapResponse,
  mockDifferenceWithExcludedResponse,
  mockDifferenceAllKeptResponse,
  mockFilterBackendResponse,
  mockFilterEmptyResponse,
  mockGroupByTechAreaResponse,
  mockSkillsSummaryResponse,
  mockSuggestRelatedFrameworksResponse,
  mockSuggestRelatedLanguagesResponse,
  mockValidateValidResponse,
  mockValidateInvalidResponse,
  mockInferThemeProgrammingResponse,
  mockInferThemeColorsResponse,
} from './mocks.ts';

// =============================================================================
// FACTORY METHODS
// =============================================================================

describe('SemanticSet Factory Methods', () => {
  test('from() creates set from array', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    expect(set.size).toBe(3);
    expect(set.toArray()).toEqual(['a', 'b', 'c']);
  });

  test('from() creates set from Set', () => {
    const nativeSet = new Set(['x', 'y', 'z']);
    const set = SemanticSet.from(nativeSet);
    expect(set.size).toBe(3);
    expect(set.has('x')).toBe(true);
    expect(set.has('y')).toBe(true);
    expect(set.has('z')).toBe(true);
  });

  test('from() removes duplicates', () => {
    const set = SemanticSet.from(['a', 'b', 'a', 'c', 'b']);
    expect(set.size).toBe(3);
  });

  test('empty() creates empty set', () => {
    const set = SemanticSet.empty<string>();
    expect(set.size).toBe(0);
    expect(set.toArray()).toEqual([]);
  });

  test('of() creates set from variadic arguments', () => {
    const set = SemanticSet.of(1, 2, 3, 4);
    expect(set.size).toBe(4);
    expect(set.has(1)).toBe(true);
    expect(set.has(4)).toBe(true);
  });
});

// =============================================================================
// VALUE ACCESS
// =============================================================================

describe('SemanticSet Value Access', () => {
  test('valueOf() returns a new Set', () => {
    const original = SemanticSet.from(['a', 'b']);
    const value = original.valueOf();
    expect(value).toBeInstanceOf(Set);
    expect(value.size).toBe(2);
    // Ensure it's a copy
    value.add('c');
    expect(original.size).toBe(2);
  });

  test('toArray() returns array of values', () => {
    const set = SemanticSet.from(['x', 'y', 'z']);
    const arr = set.toArray();
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toEqual(['x', 'y', 'z']);
  });

  test('size returns correct count', () => {
    expect(SemanticSet.empty().size).toBe(0);
    expect(SemanticSet.of(1).size).toBe(1);
    expect(SemanticSet.from(['a', 'b', 'c']).size).toBe(3);
  });

  test('has() checks exact membership', () => {
    const set = SemanticSet.from(['apple', 'banana', 'cherry']);
    expect(set.has('apple')).toBe(true);
    expect(set.has('banana')).toBe(true);
    expect(set.has('orange')).toBe(false);
  });
});

// =============================================================================
// SEMANTIC HAS
// =============================================================================

describe('SemanticSet.semanticHas()', () => {
  test('returns true when semantic match exists', async () => {
    const mockClient = createMockLLMClient(mockSemanticHasExistsResponse);
    const set = SemanticSet.from(['red', 'blue', 'green'], mockClient);

    const result = await set.semanticHas('crimson');

    expect(result.exists).toBe(true);
    expect(result.matchedValue).toBe('red');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test('returns false when no semantic match exists', async () => {
    const mockClient = createMockLLMClient(mockSemanticHasNotExistsResponse);
    const set = SemanticSet.from(['apple', 'banana'], mockClient);

    const result = await set.semanticHas('car');

    expect(result.exists).toBe(false);
    expect(result.matchedValue).toBeNull();
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test('matches abbreviations', async () => {
    const mockClient = createMockLLMClient(mockSemanticHasAbbreviationResponse);
    const set = SemanticSet.from(['machine learning', 'deep learning'], mockClient);

    const result = await set.semanticHas('ML');

    expect(result.exists).toBe(true);
    expect(result.matchedValue).toBe('machine learning');
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();
    const result = await set.semanticHas('anything');

    expect(result.exists).toBe(false);
    expect(result.matchedValue).toBeNull();
    expect(result.confidence).toBe(1.0);
  });
});

// =============================================================================
// SEMANTIC ADD
// =============================================================================

describe('SemanticSet.semanticAdd()', () => {
  test('adds value when no semantic equivalent exists', async () => {
    const mockClient = createMockLLMClient(mockSemanticAddShouldAddResponse);
    const set = SemanticSet.from(['JavaScript', 'Python'], mockClient);

    const { result, set: newSet } = await set.semanticAdd('Go');

    expect(result.added).toBe(true);
    expect(result.existingEquivalent).toBeNull();
    expect(newSet.size).toBe(3);
    expect(newSet.has('Go')).toBe(true);
  });

  test('does not add value when semantic equivalent exists', async () => {
    const mockClient = createMockLLMClient(mockSemanticAddDuplicateResponse);
    const set = SemanticSet.from(['machine learning', 'deep learning'], mockClient);

    const { result, set: newSet } = await set.semanticAdd('ML');

    expect(result.added).toBe(false);
    expect(result.existingEquivalent).toBe('machine learning');
    expect(newSet.size).toBe(2);
    expect(newSet.has('ML')).toBe(false);
  });

  test('adds to empty set', async () => {
    const set = SemanticSet.empty<string>();

    const { result, set: newSet } = await set.semanticAdd('first');

    expect(result.added).toBe(true);
    expect(newSet.size).toBe(1);
    expect(newSet.has('first')).toBe(true);
  });

  test('returns same set instance when not added', async () => {
    const mockClient = createMockLLMClient(mockSemanticAddDuplicateResponse);
    const set = SemanticSet.from(['machine learning'], mockClient);

    const { set: newSet } = await set.semanticAdd('ML');

    expect(newSet).toBe(set);
  });
});

// =============================================================================
// SEMANTICALLY EQUALS
// =============================================================================

describe('SemanticSet.semanticallyEquals()', () => {
  test('returns true for semantically equivalent sets', async () => {
    const mockClient = createMockLLMClient(mockSetsEquivalentResponse);
    const set1 = SemanticSet.from(['red', 'blue'], mockClient);
    const set2 = new Set(['crimson', 'navy']);

    const result = await set1.semanticallyEquals(set2);

    expect(result.equivalent).toBe(true);
    expect(result.mappings).toEqual([
      ['red', 'crimson'],
      ['blue', 'navy'],
    ]);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('returns false for non-equivalent sets', async () => {
    const mockClient = createMockLLMClient(mockSetsNotEquivalentResponse);
    const set1 = SemanticSet.from(['apple', 'banana'], mockClient);
    const set2 = SemanticSet.from(['car', 'plane'], mockClient);

    const result = await set1.semanticallyEquals(set2);

    expect(result.equivalent).toBe(false);
    expect(result.mappings).toEqual([]);
  });

  test('returns true for exact match sets', async () => {
    const mockClient = createMockLLMClient(mockSetsExactMatchResponse);
    const set1 = SemanticSet.from(['JavaScript', 'Python'], mockClient);
    const set2 = SemanticSet.from(['JavaScript', 'Python'], mockClient);

    const result = await set1.semanticallyEquals(set2);

    expect(result.equivalent).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.95);
  });

  test('two empty sets are equivalent', async () => {
    const set1 = SemanticSet.empty<string>();
    const set2 = SemanticSet.empty<string>();

    const result = await set1.semanticallyEquals(set2);

    expect(result.equivalent).toBe(true);
    expect(result.confidence).toBe(1.0);
  });

  test('empty and non-empty sets are not equivalent', async () => {
    const set1 = SemanticSet.empty<string>();
    const set2 = SemanticSet.from(['something']);

    const result = await set1.semanticallyEquals(set2);

    expect(result.equivalent).toBe(false);
    expect(result.confidence).toBe(1.0);
  });
});

// =============================================================================
// SEMANTIC INTERSECTION
// =============================================================================

describe('SemanticSet.semanticIntersection()', () => {
  test('returns semantic intersection', async () => {
    const mockClient = createMockLLMClient(mockIntersectionWithMatchesResponse);
    const set1 = SemanticSet.from(['JavaScript', 'TypeScript', 'Python'], mockClient);
    const set2 = new Set(['JS', 'Ruby', 'Python']);

    const result = await set1.semanticIntersection(set2);

    expect(result.size).toBe(2);
    expect(result.toArray()).toEqual(['JavaScript', 'Python']);
  });

  test('returns empty for no overlap', async () => {
    const mockClient = createMockLLMClient(mockIntersectionEmptyResponse);
    const set1 = SemanticSet.from(['apple', 'banana'], mockClient);
    const set2 = new Set(['car', 'plane']);

    const result = await set1.semanticIntersection(set2);

    expect(result.size).toBe(0);
  });

  test('handles empty first set', async () => {
    const set1 = SemanticSet.empty<string>();
    const set2 = SemanticSet.from(['a', 'b']);

    const result = await set1.semanticIntersection(set2);

    expect(result.size).toBe(0);
  });

  test('handles empty second set', async () => {
    const set1 = SemanticSet.from(['a', 'b']);
    const set2 = SemanticSet.empty<string>();

    const result = await set1.semanticIntersection(set2);

    expect(result.size).toBe(0);
  });
});

// =============================================================================
// SEMANTIC UNION
// =============================================================================

describe('SemanticSet.semanticUnion()', () => {
  test('returns union with deduplication', async () => {
    const mockClient = createMockLLMClient(mockUnionWithDeduplicationResponse);
    const set1 = SemanticSet.from(['JavaScript', 'Python', 'ML'], mockClient);
    const set2 = new Set(['machine learning', 'Go']);

    const result = await set1.semanticUnion(set2);

    // Based on mock: unionIndicesSet1: [0, 1, 2], unionIndicesSet2: [1]
    expect(result.size).toBe(4);
    expect(result.has('JavaScript')).toBe(true);
    expect(result.has('Python')).toBe(true);
    expect(result.has('ML')).toBe(true);
    expect(result.has('Go')).toBe(true);
  });

  test('returns union without overlap', async () => {
    const mockClient = createMockLLMClient(mockUnionNoOverlapResponse);
    const set1 = SemanticSet.from(['apple', 'banana'], mockClient);
    const set2 = new Set(['car', 'plane']);

    const result = await set1.semanticUnion(set2);

    expect(result.size).toBe(4);
  });

  test('handles empty first set', async () => {
    const set1 = SemanticSet.empty<string>();
    const set2 = SemanticSet.from(['a', 'b']);

    const result = await set1.semanticUnion(set2);

    expect(result.size).toBe(2);
    expect(result.toArray()).toEqual(['a', 'b']);
  });

  test('handles empty second set', async () => {
    const set1 = SemanticSet.from(['a', 'b']);
    const set2 = SemanticSet.empty<string>();

    const result = await set1.semanticUnion(set2);

    expect(result.size).toBe(2);
    expect(result.toArray()).toEqual(['a', 'b']);
  });
});

// =============================================================================
// SEMANTIC DIFFERENCE
// =============================================================================

describe('SemanticSet.semanticDifference()', () => {
  test('returns semantic difference', async () => {
    const mockClient = createMockLLMClient(mockDifferenceWithExcludedResponse);
    const set1 = SemanticSet.from(['React', 'JS', 'Python'], mockClient);
    const set2 = new Set(['JavaScript', 'Ruby']);

    const result = await set1.semanticDifference(set2);

    // Based on mock: differenceIndices: [0, 2] (excludes JS which matches JavaScript)
    expect(result.size).toBe(2);
    expect(result.toArray()).toEqual(['React', 'Python']);
  });

  test('keeps all when no matches', async () => {
    const mockClient = createMockLLMClient(mockDifferenceAllKeptResponse);
    const set1 = SemanticSet.from(['apple', 'banana', 'cherry'], mockClient);
    const set2 = new Set(['car', 'plane']);

    const result = await set1.semanticDifference(set2);

    expect(result.size).toBe(3);
  });

  test('handles empty first set', async () => {
    const set1 = SemanticSet.empty<string>();
    const set2 = SemanticSet.from(['a', 'b']);

    const result = await set1.semanticDifference(set2);

    expect(result.size).toBe(0);
  });

  test('returns all from first when second is empty', async () => {
    const set1 = SemanticSet.from(['a', 'b', 'c']);
    const set2 = SemanticSet.empty<string>();

    const result = await set1.semanticDifference(set2);

    expect(result.size).toBe(3);
    expect(result.toArray()).toEqual(['a', 'b', 'c']);
  });
});

// =============================================================================
// SEMANTIC FILTER
// =============================================================================

describe('SemanticSet.semanticFilter()', () => {
  test('filters by criteria', async () => {
    const mockClient = createMockLLMClient(mockFilterBackendResponse);
    const set = SemanticSet.from(
      ['React', 'Node.js', 'PostgreSQL', 'Vue', 'Redis'],
      mockClient
    );

    const result = await set.semanticFilter('backend technologies');

    // Based on mock: matchingIndices: [1, 2, 4]
    expect(result.size).toBe(3);
    expect(result.toArray()).toEqual(['Node.js', 'PostgreSQL', 'Redis']);
  });

  test('returns empty when nothing matches', async () => {
    const mockClient = createMockLLMClient(mockFilterEmptyResponse);
    const set = SemanticSet.from(['apple', 'banana', 'cherry'], mockClient);

    const result = await set.semanticFilter('programming languages');

    expect(result.size).toBe(0);
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();

    const result = await set.semanticFilter('any criteria');

    expect(result.size).toBe(0);
  });
});

// =============================================================================
// GROUP BY
// =============================================================================

describe('SemanticSet.groupBy()', () => {
  test('groups by criteria', async () => {
    const mockClient = createMockLLMClient(mockGroupByTechAreaResponse);
    const set = SemanticSet.from(
      ['React', 'Node.js', 'PostgreSQL', 'Vue', 'Express'],
      mockClient
    );

    const groups = await set.groupBy('technology area');

    expect(groups.size).toBe(3);
    expect(groups.has('frontend')).toBe(true);
    expect(groups.has('backend')).toBe(true);
    expect(groups.has('database')).toBe(true);

    const frontend = groups.get('frontend');
    expect(frontend).toBeDefined();
    if (frontend) {
      expect(frontend.size).toBe(2);
    }
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();

    const groups = await set.groupBy('any criteria');

    expect(groups.size).toBe(0);
  });
});

// =============================================================================
// SUMMARIZE
// =============================================================================

describe('SemanticSet.summarize()', () => {
  test('summarizes set contents', async () => {
    const mockClient = createMockLLMClient(mockSkillsSummaryResponse);
    const set = SemanticSet.from(
      ['JavaScript', 'Python', 'React', 'Node.js', 'PostgreSQL', 'MongoDB', 'Go', 'Rust'],
      mockClient
    );

    const summary = await set.summarize();

    expect(summary).toContain('8');
    expect(summary).toContain('skill');
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();

    const summary = await set.summarize();

    expect(summary).toBe('Empty set with no elements.');
  });

  test('accepts options', async () => {
    const mockClient = createMockLLMClient(mockSkillsSummaryResponse);
    const set = SemanticSet.from(['JavaScript', 'Python'], mockClient);

    const summary = await set.summarize({ maxLength: 100, focus: 'backend' });

    expect(typeof summary).toBe('string');
  });
});

// =============================================================================
// SUGGEST RELATED
// =============================================================================

describe('SemanticSet.suggestRelated()', () => {
  test('suggests related frameworks', async () => {
    const mockClient = createMockLLMClient(mockSuggestRelatedFrameworksResponse);
    const set = SemanticSet.from(['React', 'Vue', 'Angular'], mockClient);

    const suggestions = await set.suggestRelated();

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toHaveProperty('value');
    expect(suggestions[0]).toHaveProperty('reason');
  });

  test('suggests related languages', async () => {
    const mockClient = createMockLLMClient(mockSuggestRelatedLanguagesResponse);
    const set = SemanticSet.from(['JavaScript', 'Python'], mockClient);

    const suggestions = await set.suggestRelated();

    expect(suggestions.length).toBe(2);
    expect(suggestions.some((s) => s.value === 'TypeScript')).toBe(true);
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();

    const suggestions = await set.suggestRelated();

    expect(suggestions).toEqual([]);
  });
});

// =============================================================================
// VALIDATE
// =============================================================================

describe('SemanticSet.validate()', () => {
  test('validates against rules successfully', async () => {
    const mockClient = createMockLLMClient(mockValidateValidResponse);
    const set = SemanticSet.from(['apple', 'banana', 'cherry'], mockClient);

    const result = await set.validate(['must be lowercase', 'no special characters']);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test('reports validation issues', async () => {
    const mockClient = createMockLLMClient(mockValidateInvalidResponse);
    const set = SemanticSet.from(['hello', 'HelloWorld', 'test@123'], mockClient);

    const result = await set.validate(['must be lowercase', 'no special characters']);

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBe(2);
    expect(result.issues[0]).toHaveProperty('value');
    expect(result.issues[0]).toHaveProperty('problems');
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();

    const result = await set.validate(['any rule']);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});

// =============================================================================
// INFER THEME
// =============================================================================

describe('SemanticSet.inferTheme()', () => {
  test('infers programming languages theme', async () => {
    const mockClient = createMockLLMClient(mockInferThemeProgrammingResponse);
    const set = SemanticSet.from(['JavaScript', 'Python', 'Go', 'Rust'], mockClient);

    const result = await set.inferTheme();

    expect(result.theme).toBe('programming languages');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test('infers colors theme', async () => {
    const mockClient = createMockLLMClient(mockInferThemeColorsResponse);
    const set = SemanticSet.from(['red', 'blue', 'green', 'yellow'], mockClient);

    const result = await set.inferTheme();

    expect(result.theme).toBe('colors');
  });

  test('handles empty set', async () => {
    const set = SemanticSet.empty<string>();

    const result = await set.inferTheme();

    expect(result.theme).toBe('empty');
    expect(result.confidence).toBe(1.0);
  });
});

// =============================================================================
// STANDARD SET METHODS
// =============================================================================

describe('SemanticSet Standard Methods', () => {
  test('add() returns new set with added value', () => {
    const set = SemanticSet.from(['a', 'b']);
    const newSet = set.add('c');

    expect(newSet.size).toBe(3);
    expect(newSet.has('c')).toBe(true);
    // Original unchanged
    expect(set.size).toBe(2);
    expect(set.has('c')).toBe(false);
  });

  test('add() does not duplicate existing value', () => {
    const set = SemanticSet.from(['a', 'b']);
    const newSet = set.add('a');

    expect(newSet.size).toBe(2);
  });

  test('delete() returns new set without value', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    const newSet = set.delete('b');

    expect(newSet.size).toBe(2);
    expect(newSet.has('b')).toBe(false);
    // Original unchanged
    expect(set.size).toBe(3);
    expect(set.has('b')).toBe(true);
  });

  test('clear() returns empty set', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    const cleared = set.clear();

    expect(cleared.size).toBe(0);
    // Original unchanged
    expect(set.size).toBe(3);
  });

  test('forEach() iterates over values', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    const values: string[] = [];

    set.forEach((value) => values.push(value));

    expect(values).toEqual(['a', 'b', 'c']);
  });

  test('values() returns iterator', () => {
    const set = SemanticSet.from(['a', 'b']);
    const values = Array.from(set.values());

    expect(values).toEqual(['a', 'b']);
  });

  test('keys() returns iterator (same as values)', () => {
    const set = SemanticSet.from(['a', 'b']);
    const keys = Array.from(set.keys());

    expect(keys).toEqual(['a', 'b']);
  });

  test('entries() returns iterator of pairs', () => {
    const set = SemanticSet.from(['a', 'b']);
    const entries = Array.from(set.entries());

    expect(entries).toEqual([
      ['a', 'a'],
      ['b', 'b'],
    ]);
  });

  test('[Symbol.iterator] enables for...of', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    const values: string[] = [];

    for (const value of set) {
      values.push(value);
    }

    expect(values).toEqual(['a', 'b', 'c']);
  });

  test('toString() returns readable representation', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    const str = set.toString();

    expect(str).toBe('SemanticSet(3) { a, b, c }');
  });

  test('toJSON() returns array', () => {
    const set = SemanticSet.from(['a', 'b', 'c']);
    const json = set.toJSON();

    expect(json).toEqual(['a', 'b', 'c']);
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

describe('SemanticSet Error Handling', () => {
  test('handles LLM failure gracefully', async () => {
    const mockClient = createFailingMockLLMClient(new Error('API Error'));
    const set = SemanticSet.from(['a', 'b', 'c'], mockClient);

    let caught = false;
    try {
      await set.semanticHas('test');
    } catch (e) {
      caught = true;
      expect((e as Error).message).toBe('API Error');
    }
    expect(caught).toBe(true);
  });

  test('handles malformed LLM response', async () => {
    const badClient = createMockLLMClient({ invalid: 'response' });
    // Override the complete method to return invalid JSON
    (badClient.complete as ReturnType<typeof import('bun:test').mock>).mockImplementation(() =>
      Promise.resolve({
        content: 'not valid json',
        provider: 'anthropic',
        model: 'test',
      })
    );

    const set = SemanticSet.from(['a', 'b'], badClient);

    let caught = false;
    try {
      await set.semanticHas('test');
    } catch {
      caught = true;
    }
    expect(caught).toBe(true);
  });
});

// =============================================================================
// CHAINING OPERATIONS
// =============================================================================

describe('SemanticSet Operation Chaining', () => {
  test('can chain filter and groupBy', async () => {
    const mockClient = createSequentialMockLLMClient([
      mockFilterBackendResponse,
      mockGroupByTechAreaResponse,
    ]);
    const set = SemanticSet.from(
      ['React', 'Node.js', 'PostgreSQL', 'Vue', 'Redis'],
      mockClient
    );

    const filtered = await set.semanticFilter('backend');
    const groups = await filtered.groupBy('type');

    expect(groups).toBeInstanceOf(Map);
  });

  test('can chain intersection and union', async () => {
    const mockClient = createSequentialMockLLMClient([
      mockIntersectionWithMatchesResponse,
      mockUnionNoOverlapResponse,
    ]);
    const set1 = SemanticSet.from(['a', 'b', 'c'], mockClient);
    const set2 = SemanticSet.from(['b', 'c', 'd']);
    const set3 = SemanticSet.from(['e', 'f']);

    const intersection = await set1.semanticIntersection(set2);
    const union = await intersection.semanticUnion(set3);

    expect(union).toBeInstanceOf(SemanticSet);
  });
});

// =============================================================================
// TYPE SAFETY
// =============================================================================

describe('SemanticSet Type Safety', () => {
  test('preserves generic type through operations', () => {
    const numSet = SemanticSet.from([1, 2, 3]);
    expect(numSet.has(1)).toBe(true);
    expect(numSet.toArray()).toEqual([1, 2, 3]);

    const addedSet = numSet.add(4);
    expect(addedSet.has(4)).toBe(true);
  });

  test('works with complex objects', () => {
    interface User {
      id: number;
      name: string;
    }

    const users = SemanticSet.from<User>([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);

    expect(users.size).toBe(2);
    const arr = users.toArray();
    expect(arr[0]?.name).toBe('Alice');
  });
});
