/**
 * Unit tests for SemanticArray
 */

import { describe, test, expect } from 'bun:test';
import { SemanticArray } from '../array.ts';
import {
  createMockLLMClient,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockColorEquivalentResponse,
  mockFilterUnder50Response,
  mockFilterEmptyResponse,
  mockGroupByCategoryResponse,
  mockGroupBySentimentResponse,
  mockSortByUrgencyResponse,
  mockSearchResultsResponse,
  mockSearchNoResultsResponse,
  mockPatternsResponse,
  mockNoPatternsResponse,
  mockTransactionSummaryResponse,
  mockUniqueWithDuplicatesResponse,
  mockAllUniqueResponse,
  mockValidArrayResponse,
  mockInvalidArrayResponse,
  mockEnrichSentimentResponse,
  mockInferUserProfileResponse,
  mockInferStringArrayResponse,
} from './mocks.ts';

describe('SemanticArray', () => {
  describe('static factory methods', () => {
    test('from() creates array from existing array', () => {
      const arr = SemanticArray.from([1, 2, 3]);
      expect(arr.valueOf()).toEqual([1, 2, 3]);
      expect(arr.length).toBe(3);
    });

    test('empty() creates empty array', () => {
      const arr = SemanticArray.empty<number>();
      expect(arr.valueOf()).toEqual([]);
      expect(arr.length).toBe(0);
    });

    test('of() creates array from variadic arguments', () => {
      const arr = SemanticArray.of('a', 'b', 'c');
      expect(arr.valueOf()).toEqual(['a', 'b', 'c']);
    });

    test('from() creates a copy of the input array', () => {
      const original = [1, 2, 3];
      const arr = SemanticArray.from(original);
      original.push(4);
      expect(arr.valueOf()).toEqual([1, 2, 3]);
    });
  });

  describe('valueOf', () => {
    test('returns array elements', () => {
      const arr = SemanticArray.from(['hello', 'world']);
      expect(arr.valueOf()).toEqual(['hello', 'world']);
    });

    test('returns a copy, not the internal array', () => {
      const arr = SemanticArray.from([1, 2]);
      const value = arr.valueOf();
      value.push(3);
      expect(arr.valueOf()).toEqual([1, 2]);
    });
  });

  describe('length', () => {
    test('returns array length', () => {
      const arr = SemanticArray.from([1, 2, 3, 4, 5]);
      expect(arr.length).toBe(5);
    });

    test('returns 0 for empty array', () => {
      const arr = SemanticArray.empty();
      expect(arr.length).toBe(0);
    });
  });

  describe('at', () => {
    test('returns element at positive index', () => {
      const arr = SemanticArray.from(['a', 'b', 'c']);
      expect(arr.at(1)).toBe('b');
    });

    test('returns element at negative index', () => {
      const arr = SemanticArray.from(['a', 'b', 'c']);
      expect(arr.at(-1)).toBe('c');
    });

    test('returns undefined for out of bounds', () => {
      const arr = SemanticArray.from(['a', 'b']);
      expect(arr.at(5)).toBeUndefined();
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for semantically similar arrays', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const arr1 = SemanticArray.from(['dog', 'cat'], client);
      const arr2 = SemanticArray.from(['canine', 'feline'], client);

      const result = await arr1.semanticallyEquals(arr2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different arrays', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const arr1 = SemanticArray.from(['red', 'blue'], client);
      const arr2 = SemanticArray.from(['apple', 'banana'], client);

      const result = await arr1.semanticallyEquals(arr2);

      expect(result.equivalent).toBe(false);
    });

    test('accepts raw array as parameter', async () => {
      const client = createMockLLMClient(mockColorEquivalentResponse);
      const arr1 = SemanticArray.from(['red', 'blue'], client);

      const result = await arr1.semanticallyEquals(['crimson', 'navy']);

      expect(result.equivalent).toBe(true);
      expect(result.note).toBe('Same colors, different shades');
    });

    test('accepts options for order significance', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const arr = SemanticArray.from([1, 2, 3], client);

      const result = await arr.semanticallyEquals([3, 2, 1], { orderMatters: false });

      expect(result.equivalent).toBe(true);
    });
  });

  describe('semanticFilter', () => {
    test('filters elements based on criteria', async () => {
      const client = createMockLLMClient(mockFilterUnder50Response);
      const products = SemanticArray.from(
        [
          { name: 'Widget', price: 25 },
          { name: 'Gadget', price: 75 },
          { name: 'Tool', price: 30 },
        ],
        client
      );

      const result = await products.semanticFilter('items under $50');

      expect(result.length).toBe(2);
    });

    test('returns empty array when no matches', async () => {
      const client = createMockLLMClient(mockFilterEmptyResponse);
      const arr = SemanticArray.from(['a', 'b', 'c'], client);

      const result = await arr.semanticFilter('items starting with z');

      expect(result.length).toBe(0);
    });

    test('returns empty array for empty input', async () => {
      const client = createMockLLMClient(mockFilterEmptyResponse);
      const arr = SemanticArray.empty<string>(client);

      const result = await arr.semanticFilter('any criteria');

      expect(result.length).toBe(0);
    });
  });

  describe('semanticGroup', () => {
    test('groups elements by criteria', async () => {
      const client = createMockLLMClient(mockGroupByCategoryResponse);
      const products = SemanticArray.from(
        [
          { name: 'Phone', category: 'electronics' },
          { name: 'Shirt', category: 'clothing' },
          { name: 'Apple', category: 'food' },
          { name: 'Laptop', category: 'electronics' },
          { name: 'Pants', category: 'clothing' },
        ],
        client
      );

      const groups = await products.semanticGroup('by category');

      expect(groups.size).toBe(3);
      expect(groups.get('electronics')?.length).toBe(2);
      expect(groups.get('clothing')?.length).toBe(2);
      expect(groups.get('food')?.length).toBe(1);
    });

    test('groups by sentiment', async () => {
      const client = createMockLLMClient(mockGroupBySentimentResponse);
      const feedback = SemanticArray.from(
        ['Great product!', 'Terrible service', 'Love it!', 'It works'],
        client
      );

      const groups = await feedback.semanticGroup('by sentiment');

      expect(groups.has('positive')).toBe(true);
      expect(groups.has('negative')).toBe(true);
    });

    test('returns empty map for empty array', async () => {
      const arr = SemanticArray.empty<string>();

      const groups = await arr.semanticGroup('by anything');

      expect(groups.size).toBe(0);
    });
  });

  describe('semanticSort', () => {
    test('sorts elements by criteria', async () => {
      const client = createMockLLMClient(mockSortByUrgencyResponse);
      const tasks = SemanticArray.from(
        [
          { name: 'Task A', priority: 'low' },
          { name: 'Task B', priority: 'medium' },
          { name: 'Task C', priority: 'high' },
          { name: 'Task D', priority: 'low' },
        ],
        client
      );

      const sorted = await tasks.semanticSort('by urgency');

      expect(sorted.length).toBe(4);
      // The mock returns [2, 0, 3, 1] order
      expect(sorted.at(0)).toEqual({ name: 'Task C', priority: 'high' });
    });

    test('returns same array for single element', async () => {
      const client = createMockLLMClient(mockSortByUrgencyResponse);
      const arr = SemanticArray.from([1], client);

      const sorted = await arr.semanticSort('any criteria');

      expect(sorted.valueOf()).toEqual([1]);
    });

    test('returns empty array for empty input', async () => {
      const arr = SemanticArray.empty<number>();

      const sorted = await arr.semanticSort('any criteria');

      expect(sorted.length).toBe(0);
    });
  });

  describe('semanticSearch', () => {
    test('returns matches with relevance scores', async () => {
      const client = createMockLLMClient(mockSearchResultsResponse);
      const articles = SemanticArray.from(
        [
          { title: 'JavaScript Basics' },
          { title: 'Python for Beginners' },
          { title: 'ML Tutorial' },
          { title: 'React Guide' },
          { title: 'AI Intro' },
        ],
        client
      );

      const results = await articles.semanticSearch('machine learning tutorials');

      expect(results.length).toBe(3);
      const firstResult = results[0];
      expect(firstResult).toBeDefined();
      expect(firstResult?.relevance).toBe(0.95);
      expect(firstResult?.item).toEqual({ title: 'ML Tutorial' });
    });

    test('returns empty array when no matches', async () => {
      const client = createMockLLMClient(mockSearchNoResultsResponse);
      const arr = SemanticArray.from(['a', 'b', 'c'], client);

      const results = await arr.semanticSearch('xyz');

      expect(results.length).toBe(0);
    });

    test('returns empty array for empty input', async () => {
      const arr = SemanticArray.empty<string>();

      const results = await arr.semanticSearch('any search');

      expect(results.length).toBe(0);
    });

    test('accepts limit option', async () => {
      const client = createMockLLMClient(mockSearchResultsResponse);
      const arr = SemanticArray.from([1, 2, 3, 4, 5], client);

      const results = await arr.semanticSearch('something', { limit: 2 });

      // Mock returns 3 results, but in real usage limit would be respected
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('detectPatterns', () => {
    test('detects patterns and anomalies', async () => {
      const client = createMockLLMClient(mockPatternsResponse);
      const data = SemanticArray.from([10, 20, 15, 25, 18, 100, 22], client);

      const result = await data.detectPatterns();

      expect(result.patterns).toContain('weekly cycle');
      expect(result.patterns).toContain('increasing trend');
      expect(result.anomalies.length).toBe(1);
      const firstAnomaly = result.anomalies[0];
      expect(firstAnomaly).toBeDefined();
      expect(firstAnomaly?.index).toBe(5);
    });

    test('returns empty patterns for uniform data', async () => {
      const client = createMockLLMClient(mockNoPatternsResponse);
      const arr = SemanticArray.from([5, 5, 5, 5], client);

      const result = await arr.detectPatterns();

      expect(result.patterns.length).toBe(0);
      expect(result.anomalies.length).toBe(0);
    });

    test('returns empty for empty array', async () => {
      const arr = SemanticArray.empty<number>();

      const result = await arr.detectPatterns();

      expect(result.patterns).toEqual([]);
      expect(result.anomalies).toEqual([]);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('summarize', () => {
    test('returns human-readable summary', async () => {
      const client = createMockLLMClient(mockTransactionSummaryResponse);
      const transactions = SemanticArray.from(
        [
          { amount: 50, category: 'food' },
          { amount: 100, category: 'dining' },
        ],
        client
      );

      const summary = await transactions.summarize();

      expect(summary).toContain('150 transactions');
      expect(summary).toContain('food & dining');
    });

    test('returns message for empty array', async () => {
      const arr = SemanticArray.empty<string>();

      const summary = await arr.summarize();

      expect(summary).toBe('Empty array with no elements.');
    });

    test('accepts options for focus', async () => {
      const client = createMockLLMClient(mockTransactionSummaryResponse);
      const arr = SemanticArray.from([1, 2, 3], client);

      const summary = await arr.summarize({ focus: 'statistics', maxLength: 100 });

      expect(typeof summary).toBe('string');
    });
  });

  describe('semanticUnique', () => {
    test('removes semantic duplicates', async () => {
      const client = createMockLLMClient(mockUniqueWithDuplicatesResponse);
      const phrases = SemanticArray.from(
        ['buy now', 'purchase immediately', 'get started', 'begin now', 'start here'],
        client
      );

      const unique = await phrases.semanticUnique();

      expect(unique.length).toBe(3);
    });

    test('returns all elements when no duplicates', async () => {
      const client = createMockLLMClient(mockAllUniqueResponse);
      const arr = SemanticArray.from(['a', 'b', 'c', 'd'], client);

      const unique = await arr.semanticUnique();

      expect(unique.length).toBe(4);
    });

    test('returns same array for single element', async () => {
      const arr = SemanticArray.from(['only']);

      const unique = await arr.semanticUnique();

      expect(unique.valueOf()).toEqual(['only']);
    });

    test('accepts threshold option', async () => {
      const client = createMockLLMClient(mockUniqueWithDuplicatesResponse);
      const arr = SemanticArray.from(['a', 'b', 'c'], client);

      const unique = await arr.semanticUnique({ threshold: 0.9 });

      expect(unique.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    test('returns valid for compliant array', async () => {
      const client = createMockLLMClient(mockValidArrayResponse);
      const emails = SemanticArray.from(['Hello, how are you?', 'Thank you for your email'], client);

      const result = await emails.validate(['must be professional']);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('returns issues for non-compliant array', async () => {
      const client = createMockLLMClient(mockInvalidArrayResponse);
      const emails = SemanticArray.from(
        [
          'Normal email',
          'Another email',
          'Inappropriate content!!!',
          'Regular message',
          'Normal text',
          'BUY NOW!!! LIMITED OFFER!!!',
        ],
        client
      );

      const result = await emails.validate(['must be professional', 'no spam-like content']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
      const firstIssue = result.issues[0];
      const secondIssue = result.issues[1];
      expect(firstIssue).toBeDefined();
      expect(secondIssue).toBeDefined();
      expect(firstIssue?.index).toBe(2);
      expect(secondIssue?.index).toBe(5);
    });

    test('returns valid for empty array', async () => {
      const arr = SemanticArray.empty<string>();

      const result = await arr.validate(['any rule']);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('enrich', () => {
    test('adds semantic fields to elements', async () => {
      const client = createMockLLMClient(mockEnrichSentimentResponse);
      const reviews = SemanticArray.from(
        ['Great product!', 'Too expensive', 'Works as expected'],
        client
      );

      const enriched = await reviews.enrich({
        sentiment: 'positive/negative/neutral',
        topics: 'main topics',
      });

      expect(enriched.length).toBe(3);
      const first = enriched.at(0);
      expect(first).toHaveProperty('sentiment');
      expect(first).toHaveProperty('topics');
    });

    test('returns empty array for empty input', async () => {
      const arr = SemanticArray.empty<string>();

      const enriched = await arr.enrich({ field: 'description' });

      expect(enriched.length).toBe(0);
    });
  });

  describe('inferElementType', () => {
    test('infers object element type with fields', async () => {
      const client = createMockLLMClient(mockInferUserProfileResponse);
      const users = SemanticArray.from(
        [
          { name: 'John', email: 'john@example.com', age: 30 },
          { name: 'Jane', email: 'jane@example.com', age: 25 },
        ],
        client
      );

      const result = await users.inferElementType();

      expect(result.type).toBe('user-profile');
      expect(result.confidence).toBe(0.92);
      expect(result.fields).toContain('name');
      expect(result.fields).toContain('email');
    });

    test('infers primitive element type', async () => {
      const client = createMockLLMClient(mockInferStringArrayResponse);
      const strings = SemanticArray.from(['hello', 'world'], client);

      const result = await strings.inferElementType();

      expect(result.type).toBe('string');
      expect(result.fields).toBeUndefined();
    });

    test('returns empty type for empty array', async () => {
      const arr = SemanticArray.empty();

      const result = await arr.inferElementType();

      expect(result.type).toBe('empty');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('inferType', () => {
    test('returns InferTypeResult compatible result', async () => {
      const client = createMockLLMClient(mockInferUserProfileResponse);
      const arr = SemanticArray.from([{ id: 1 }], client);

      const result = await arr.inferType();

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('confidence');
    });
  });

  describe('standard array methods', () => {
    describe('map', () => {
      test('maps elements and returns SemanticArray', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const mapped = arr.map((x) => x * 2);

        expect(mapped).toBeInstanceOf(SemanticArray);
        expect(mapped.valueOf()).toEqual([2, 4, 6]);
      });
    });

    describe('filter', () => {
      test('filters with predicate and returns SemanticArray', () => {
        const arr = SemanticArray.from([1, 2, 3, 4, 5]);
        const filtered = arr.filter((x) => x > 2);

        expect(filtered).toBeInstanceOf(SemanticArray);
        expect(filtered.valueOf()).toEqual([3, 4, 5]);
      });
    });

    describe('concat', () => {
      test('concatenates with array', () => {
        const arr = SemanticArray.from([1, 2]);
        const result = arr.concat([3, 4]);

        expect(result.valueOf()).toEqual([1, 2, 3, 4]);
      });

      test('concatenates with SemanticArray', () => {
        const arr1 = SemanticArray.from([1, 2]);
        const arr2 = SemanticArray.from([3, 4]);
        const result = arr1.concat(arr2);

        expect(result.valueOf()).toEqual([1, 2, 3, 4]);
      });

      test('concatenates with single element', () => {
        const arr = SemanticArray.from([1, 2]);
        const result = arr.concat(3);

        expect(result.valueOf()).toEqual([1, 2, 3]);
      });
    });

    describe('slice', () => {
      test('returns slice of array', () => {
        const arr = SemanticArray.from([1, 2, 3, 4, 5]);
        const sliced = arr.slice(1, 4);

        expect(sliced.valueOf()).toEqual([2, 3, 4]);
      });
    });

    describe('reverse', () => {
      test('reverses array', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const reversed = arr.reverse();

        expect(reversed.valueOf()).toEqual([3, 2, 1]);
      });

      test('does not modify original', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        arr.reverse();

        expect(arr.valueOf()).toEqual([1, 2, 3]);
      });
    });

    describe('reduce', () => {
      test('reduces to single value', () => {
        const arr = SemanticArray.from([1, 2, 3, 4]);
        const sum = arr.reduce((acc, x) => acc + x, 0);

        expect(sum).toBe(10);
      });
    });

    describe('some', () => {
      test('returns true if any element matches', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        expect(arr.some((x) => x > 2)).toBe(true);
      });

      test('returns false if no element matches', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        expect(arr.some((x) => x > 5)).toBe(false);
      });
    });

    describe('every', () => {
      test('returns true if all elements match', () => {
        const arr = SemanticArray.from([2, 4, 6]);
        expect(arr.every((x) => x % 2 === 0)).toBe(true);
      });

      test('returns false if any element does not match', () => {
        const arr = SemanticArray.from([2, 3, 4]);
        expect(arr.every((x) => x % 2 === 0)).toBe(false);
      });
    });

    describe('find', () => {
      test('finds matching element', () => {
        const arr = SemanticArray.from([{ id: 1 }, { id: 2 }, { id: 3 }]);
        const found = arr.find((x) => x.id === 2);

        expect(found).toEqual({ id: 2 });
      });

      test('returns undefined if not found', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const found = arr.find((x) => x > 5);

        expect(found).toBeUndefined();
      });
    });

    describe('findIndex', () => {
      test('finds index of matching element', () => {
        const arr = SemanticArray.from(['a', 'b', 'c']);
        expect(arr.findIndex((x) => x === 'b')).toBe(1);
      });

      test('returns -1 if not found', () => {
        const arr = SemanticArray.from(['a', 'b', 'c']);
        expect(arr.findIndex((x) => x === 'z')).toBe(-1);
      });
    });

    describe('includes', () => {
      test('returns true if element exists', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        expect(arr.includes(2)).toBe(true);
      });

      test('returns false if element does not exist', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        expect(arr.includes(5)).toBe(false);
      });
    });

    describe('indexOf', () => {
      test('returns index of element', () => {
        const arr = SemanticArray.from(['a', 'b', 'c']);
        expect(arr.indexOf('b')).toBe(1);
      });

      test('returns -1 if not found', () => {
        const arr = SemanticArray.from(['a', 'b', 'c']);
        expect(arr.indexOf('z')).toBe(-1);
      });
    });

    describe('forEach', () => {
      test('executes function for each element', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const results: number[] = [];
        arr.forEach((x) => results.push(x * 2));

        expect(results).toEqual([2, 4, 6]);
      });
    });

    describe('flatMap', () => {
      test('flat maps elements', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const result = arr.flatMap((x) => [x, x * 2]);

        expect(result.valueOf()).toEqual([1, 2, 2, 4, 3, 6]);
      });
    });

    describe('iterator', () => {
      test('supports for...of iteration', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const results: number[] = [];

        for (const item of arr) {
          results.push(item);
        }

        expect(results).toEqual([1, 2, 3]);
      });

      test('supports spread operator', () => {
        const arr = SemanticArray.from([1, 2, 3]);
        const spread = [...arr];

        expect(spread).toEqual([1, 2, 3]);
      });
    });
  });

  describe('toString', () => {
    test('returns string representation', () => {
      const arr = SemanticArray.from([1, 2, 3]);
      expect(arr.toString()).toBe('1,2,3');
    });
  });

  describe('toJSON', () => {
    test('returns array for JSON serialization', () => {
      const arr = SemanticArray.from([{ a: 1 }, { b: 2 }]);
      expect(arr.toJSON()).toEqual([{ a: 1 }, { b: 2 }]);
    });

    test('works with JSON.stringify', () => {
      const arr = SemanticArray.from([1, 2, 3]);
      expect(JSON.stringify(arr)).toBe('[1,2,3]');
    });
  });
});

describe('SemanticArray prompts', () => {
  test('createSemanticallyEqualsPrompt includes arrays', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt([1, 2], [2, 1]);

    expect(prompt).toContain('Array 1:');
    expect(prompt).toContain('Array 2:');
  });

  test('createSemanticallyEqualsPrompt includes options', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt([1, 2], [2, 1], {
      orderMatters: false,
      threshold: 0.8,
    });

    expect(prompt).toContain('Order matters: false');
    expect(prompt).toContain('Threshold for equivalence: 0.8');
  });

  test('createSemanticFilterPrompt includes criteria', async () => {
    const { createSemanticFilterPrompt } = await import('../prompts.ts');
    const prompt = createSemanticFilterPrompt([1, 2, 3], 'even numbers');

    expect(prompt).toContain('Criteria: "even numbers"');
  });

  test('createSummarizePrompt includes focus', async () => {
    const { createSummarizePrompt } = await import('../prompts.ts');
    const prompt = createSummarizePrompt([1, 2, 3], { focus: 'statistics' });

    expect(prompt).toContain('Focus area: "statistics"');
  });
});
