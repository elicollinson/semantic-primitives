/**
 * Unit tests for SemanticTuple
 */

import { describe, test, expect } from 'bun:test';
import { SemanticTuple } from '../tuple.ts';
import {
  createMockLLMClient,
  mockEquivalentResponse,
  mockDifferentArityResponse,
  mockDifferentValuesResponse,
  mockCoordinateEquivalentResponse,
  mockCoordinateMeaningResponse,
  mock3DCoordinateMeaningResponse,
  mockRGBMeaningResponse,
  mockRangeMeaningResponse,
  mockHttpStatusMeaningResponse,
  mockValidRelationshipResponse,
  mockInvalidEndBeforeStartResponse,
  mockInvalidRGBRangeResponse,
  mockRGBPatternResponse,
  mockCoordinatePatternResponse,
  mockRangePatternResponse,
  mockHttpStatusPatternResponse,
  mockKeyValuePatternResponse,
  mockVersionPatternResponse,
  mockCoordinateToObjectResponse,
  mockRGBToObjectResponse,
  mockRangeToObjectResponse,
  mockMatchLatitudeResponse,
  mockNoMatchResponse,
  mockMatchSynonymResponse,
  mockValidStructureResponse,
  mockInvalidTypeResponse,
  mockMultipleIssuesResponse,
  mockCoordinateExplanationResponse,
  mockHttpStatusExplanationResponse,
  mockRGBExplanationResponse,
  mockRangeExplanationResponse,
} from './mocks.ts';

describe('SemanticTuple', () => {
  describe('static factory methods', () => {
    test('from() creates tuple from values', () => {
      const tuple = SemanticTuple.from([1, 2, 3]);
      expect(tuple.valueOf()).toEqual([1, 2, 3]);
      expect(tuple.length).toBe(3);
    });

    test('from() creates tuple with labels', () => {
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude']);
      expect(tuple.valueOf()).toEqual([37.7749, -122.4194]);
      expect(tuple.getLabels()).toEqual(['latitude', 'longitude']);
    });

    test('empty() creates empty tuple', () => {
      const tuple = SemanticTuple.empty();
      expect(tuple.valueOf()).toEqual([]);
      expect(tuple.length).toBe(0);
    });

    test('from() creates a copy of the input array', () => {
      const original = [1, 2, 3];
      const tuple = SemanticTuple.from(original);
      original.push(4);
      expect(tuple.valueOf()).toEqual([1, 2, 3]);
    });

    test('from() creates a copy of the labels array', () => {
      const labels = ['a', 'b'];
      const tuple = SemanticTuple.from([1, 2], labels);
      labels.push('c');
      expect(tuple.getLabels()).toEqual(['a', 'b']);
    });
  });

  describe('valueOf', () => {
    test('returns tuple elements', () => {
      const tuple = SemanticTuple.from(['hello', 42, true]);
      expect(tuple.valueOf()).toEqual(['hello', 42, true]);
    });

    test('returns a copy, not the internal array', () => {
      const tuple = SemanticTuple.from([1, 2]);
      const value = tuple.valueOf();
      value.push(3);
      expect(tuple.valueOf()).toEqual([1, 2]);
    });
  });

  describe('length', () => {
    test('returns tuple length', () => {
      const tuple = SemanticTuple.from([1, 2, 3, 4, 5]);
      expect(tuple.length).toBe(5);
    });

    test('returns 0 for empty tuple', () => {
      const tuple = SemanticTuple.empty();
      expect(tuple.length).toBe(0);
    });
  });

  describe('at', () => {
    test('returns element at positive index', () => {
      const tuple = SemanticTuple.from(['a', 'b', 'c']);
      expect(tuple.at(1)).toBe('b');
    });

    test('returns element at negative index', () => {
      const tuple = SemanticTuple.from(['a', 'b', 'c']);
      expect(tuple.at(-1)).toBe('c');
    });

    test('returns undefined for out of bounds', () => {
      const tuple = SemanticTuple.from(['a', 'b']);
      expect(tuple.at(5)).toBeUndefined();
    });
  });

  describe('getLabels', () => {
    test('returns labels when provided', () => {
      const tuple = SemanticTuple.from([1, 2], ['x', 'y']);
      expect(tuple.getLabels()).toEqual(['x', 'y']);
    });

    test('returns undefined when no labels', () => {
      const tuple = SemanticTuple.from([1, 2]);
      expect(tuple.getLabels()).toBeUndefined();
    });

    test('returns a copy of labels', () => {
      const tuple = SemanticTuple.from([1, 2], ['x', 'y']);
      const labels = tuple.getLabels();
      labels?.push('z');
      expect(tuple.getLabels()).toEqual(['x', 'y']);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for semantically similar tuples', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const tuple1 = SemanticTuple.from([37.7749, -122.4194], undefined, client);
      const tuple2 = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple1.semanticallyEquals(tuple2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.92);
    });

    test('returns not equivalent for different arity', async () => {
      const client = createMockLLMClient(mockDifferentArityResponse);
      const tuple1 = SemanticTuple.from([1, 2], undefined, client);
      const tuple2 = SemanticTuple.from([1, 2, 3], undefined, client);

      const result = await tuple1.semanticallyEquals(tuple2);

      expect(result.equivalent).toBe(false);
      expect(result.reason).toContain('arity');
    });

    test('returns not equivalent for different values', async () => {
      const client = createMockLLMClient(mockDifferentValuesResponse);
      const tuple1 = SemanticTuple.from(['red', 'blue'], undefined, client);
      const tuple2 = SemanticTuple.from(['apple', 'banana'], undefined, client);

      const result = await tuple1.semanticallyEquals(tuple2);

      expect(result.equivalent).toBe(false);
    });

    test('accepts raw array as parameter', async () => {
      const client = createMockLLMClient(mockCoordinateEquivalentResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.semanticallyEquals([37.7749, -122.4194]);

      expect(result.equivalent).toBe(true);
    });

    test('considers labels in comparison', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const tuple1 = SemanticTuple.from([1, 2], ['x', 'y'], client);
      const tuple2 = SemanticTuple.from([1, 2], ['a', 'b'], client);

      const result = await tuple1.semanticallyEquals(tuple2);

      expect(result).toHaveProperty('equivalent');
      expect(result).toHaveProperty('confidence');
    });
  });

  describe('inferPositionalMeaning', () => {
    test('infers coordinate meanings', async () => {
      const client = createMockLLMClient(mockCoordinateMeaningResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toBe('latitude');
      expect(result.positions[1]?.meaning).toBe('longitude');
      expect(result.overallConfidence).toBe(0.95);
    });

    test('infers 3D coordinate meanings', async () => {
      const client = createMockLLMClient(mock3DCoordinateMeaningResponse);
      const tuple = SemanticTuple.from([10, 20, 30], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toContain('x');
      expect(result.positions[1]?.meaning).toContain('y');
      expect(result.positions[2]?.meaning).toContain('z');
    });

    test('infers RGB meanings', async () => {
      const client = createMockLLMClient(mockRGBMeaningResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toContain('red');
      expect(result.positions[1]?.meaning).toContain('green');
      expect(result.positions[2]?.meaning).toContain('blue');
    });

    test('infers range meanings', async () => {
      const client = createMockLLMClient(mockRangeMeaningResponse);
      const tuple = SemanticTuple.from([0, 100], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toContain('start');
      expect(result.positions[1]?.meaning).toContain('end');
    });

    test('infers HTTP status meanings', async () => {
      const client = createMockLLMClient(mockHttpStatusMeaningResponse);
      const tuple = SemanticTuple.from([200, 'OK'], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toContain('status code');
      expect(result.positions[1]?.meaning).toContain('status message');
    });

    test('accepts context parameter', async () => {
      const client = createMockLLMClient(mockCoordinateMeaningResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.inferPositionalMeaning('geographic location');

      expect(result).toHaveProperty('positions');
    });

    test('returns empty for empty tuple', async () => {
      const tuple = SemanticTuple.empty();

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions).toEqual({});
      expect(result.overallConfidence).toBe(1.0);
    });
  });

  describe('validateRelationship', () => {
    test('returns valid for compliant relationship', async () => {
      const client = createMockLLMClient(mockValidRelationshipResponse);
      const tuple = SemanticTuple.from([0, 100], undefined, client);

      const result = await tuple.validateRelationship(['end should be greater than start']);

      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    test('returns violations for invalid relationship', async () => {
      const client = createMockLLMClient(mockInvalidEndBeforeStartResponse);
      const tuple = SemanticTuple.from([100, 0], undefined, client);

      const result = await tuple.validateRelationship(['end should be greater than start']);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('validates RGB range constraints', async () => {
      const client = createMockLLMClient(mockInvalidRGBRangeResponse);
      const tuple = SemanticTuple.from([300, 128, 0], undefined, client);

      const result = await tuple.validateRelationship(['all values should be between 0 and 255']);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('returns valid for empty tuple', async () => {
      const tuple = SemanticTuple.empty();

      const result = await tuple.validateRelationship(['any rule']);

      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    test('returns valid for empty rules', async () => {
      const tuple = SemanticTuple.from([1, 2, 3]);

      const result = await tuple.validateRelationship([]);

      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });

  describe('detectPattern', () => {
    test('detects RGB color pattern', async () => {
      const client = createMockLLMClient(mockRGBPatternResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toContain('RGB');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.suggestedType).toBe('Color');
    });

    test('detects coordinate pattern', async () => {
      const client = createMockLLMClient(mockCoordinatePatternResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toContain('coordinate');
      expect(result.suggestedType).toBe('GeoPoint');
    });

    test('detects range pattern', async () => {
      const client = createMockLLMClient(mockRangePatternResponse);
      const tuple = SemanticTuple.from([0, 100], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toContain('range');
      expect(result.suggestedType).toBe('Range');
    });

    test('detects HTTP status pattern', async () => {
      const client = createMockLLMClient(mockHttpStatusPatternResponse);
      const tuple = SemanticTuple.from([200, 'OK'], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toContain('HTTP');
      expect(result.suggestedType).toBe('HttpStatus');
    });

    test('detects key-value pattern', async () => {
      const client = createMockLLMClient(mockKeyValuePatternResponse);
      const tuple = SemanticTuple.from(['name', 'John'], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toContain('Key-value');
    });

    test('detects version pattern', async () => {
      const client = createMockLLMClient(mockVersionPatternResponse);
      const tuple = SemanticTuple.from([1, 2, 3], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toContain('version');
      expect(result.suggestedType).toBe('SemanticVersion');
    });

    test('returns empty pattern for empty tuple', async () => {
      const tuple = SemanticTuple.empty();

      const result = await tuple.detectPattern();

      expect(result.pattern).toBe('empty tuple');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('toObject', () => {
    test('converts to object with provided labels', async () => {
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude']);

      const result = await tuple.toObject();

      expect(result.object).toEqual({ latitude: 37.7749, longitude: -122.4194 });
      expect(result.labelsUsed).toEqual(['latitude', 'longitude']);
      expect(result.confidence).toBe(1.0);
    });

    test('converts to object with custom labels', async () => {
      const tuple = SemanticTuple.from([37.7749, -122.4194]);

      const result = await tuple.toObject(['lat', 'lng']);

      expect(result.object).toEqual({ lat: 37.7749, lng: -122.4194 });
      expect(result.labelsUsed).toEqual(['lat', 'lng']);
    });

    test('infers labels using LLM when not provided', async () => {
      const client = createMockLLMClient(mockCoordinateToObjectResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.toObject();

      expect(result.object).toEqual({ latitude: 37.7749, longitude: -122.4194 });
      expect(result.labelsUsed).toEqual(['latitude', 'longitude']);
    });

    test('infers RGB labels', async () => {
      const client = createMockLLMClient(mockRGBToObjectResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const result = await tuple.toObject();

      expect(result.object).toEqual({ red: 255, green: 128, blue: 0 });
    });

    test('infers range labels', async () => {
      const client = createMockLLMClient(mockRangeToObjectResponse);
      const tuple = SemanticTuple.from([0, 100], undefined, client);

      const result = await tuple.toObject();

      expect(result.object).toEqual({ start: 0, end: 100 });
    });

    test('returns empty object for empty tuple', async () => {
      const tuple = SemanticTuple.empty();

      const result = await tuple.toObject();

      expect(result.object).toEqual({});
      expect(result.labelsUsed).toEqual([]);
    });
  });

  describe('getByLabel', () => {
    test('gets by exact label match', async () => {
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude']);

      const result = await tuple.getByLabel('latitude');

      expect(result.value).toBe(37.7749);
      expect(result.matchedPosition).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    test('gets by case-insensitive label match', async () => {
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude']);

      const result = await tuple.getByLabel('LATITUDE');

      expect(result.value).toBe(37.7749);
      expect(result.matchedPosition).toBe(0);
    });

    test('uses LLM for semantic label matching', async () => {
      const client = createMockLLMClient(mockMatchLatitudeResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.getByLabel('lat');

      expect(result.value).toBe(37.7749);
      expect(result.matchedPosition).toBe(0);
    });

    test('matches synonym using LLM', async () => {
      const client = createMockLLMClient(mockMatchSynonymResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.getByLabel('y-coordinate');

      expect(result.matchedPosition).toBe(0);
    });

    test('returns undefined for no match', async () => {
      const client = createMockLLMClient(mockNoMatchResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.getByLabel('altitude');

      expect(result.value).toBeUndefined();
      expect(result.matchedPosition).toBeUndefined();
    });

    test('returns undefined for empty tuple', async () => {
      const tuple = SemanticTuple.empty();

      const result = await tuple.getByLabel('anything');

      expect(result.value).toBeUndefined();
      expect(result.matchedPosition).toBeUndefined();
    });
  });

  describe('validateStructure', () => {
    test('validates correct structure', async () => {
      const client = createMockLLMClient(mockValidStructureResponse);
      const tuple = SemanticTuple.from(['John', 30, true], undefined, client);

      const result = await tuple.validateStructure(['string', 'number', 'boolean']);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    test('reports type mismatch', async () => {
      const client = createMockLLMClient(mockInvalidTypeResponse);
      const tuple = SemanticTuple.from(['John', 'thirty', true], undefined, client);

      const result = await tuple.validateStructure(['string', 'number', 'boolean']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0]?.position).toBe(1);
      expect(result.issues[0]?.expected).toBe('number');
    });

    test('reports multiple issues', async () => {
      const client = createMockLLMClient(mockMultipleIssuesResponse);
      const tuple = SemanticTuple.from([123, 'text', 'not-bool'], undefined, client);

      const result = await tuple.validateStructure(['string', 'number', 'boolean']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
    });

    test('fails for length mismatch', async () => {
      const tuple = SemanticTuple.from([1, 2]);

      const result = await tuple.validateStructure(['number', 'number', 'number']);

      expect(result.valid).toBe(false);
      expect(result.issues[0]?.expected).toContain('3 elements');
      expect(result.issues[0]?.actual).toContain('2 elements');
    });

    test('passes for empty tuple with empty expected', async () => {
      const tuple = SemanticTuple.empty();

      const result = await tuple.validateStructure([]);

      expect(result.valid).toBe(true);
    });
  });

  describe('explain', () => {
    test('explains coordinate tuple', async () => {
      const client = createMockLLMClient(mockCoordinateExplanationResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('coordinate');
      expect(explanation).toContain('San Francisco');
    });

    test('explains HTTP status tuple', async () => {
      const client = createMockLLMClient(mockHttpStatusExplanationResponse);
      const tuple = SemanticTuple.from([200, 'OK'], undefined, client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('HTTP');
      expect(explanation).toContain('200');
      expect(explanation).toContain('OK');
    });

    test('explains RGB tuple', async () => {
      const client = createMockLLMClient(mockRGBExplanationResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('RGB');
      expect(explanation).toContain('orange');
    });

    test('explains range tuple', async () => {
      const client = createMockLLMClient(mockRangeExplanationResponse);
      const tuple = SemanticTuple.from([0, 100], undefined, client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('range');
    });

    test('accepts context parameter', async () => {
      const client = createMockLLMClient(mockCoordinateExplanationResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const explanation = await tuple.explain('geographic data');

      expect(typeof explanation).toBe('string');
    });

    test('returns message for empty tuple', async () => {
      const tuple = SemanticTuple.empty();

      const explanation = await tuple.explain();

      expect(explanation).toBe('Empty tuple with no elements.');
    });
  });

  describe('standard tuple/array methods', () => {
    describe('map', () => {
      test('maps elements and returns SemanticTuple', () => {
        const tuple = SemanticTuple.from([1, 2, 3]);
        const mapped = tuple.map((x) => x * 2);

        expect(mapped).toBeInstanceOf(SemanticTuple);
        expect(mapped.valueOf()).toEqual([2, 4, 6]);
      });

      test('preserves labels', () => {
        const tuple = SemanticTuple.from([1, 2], ['a', 'b']);
        const mapped = tuple.map((x) => x * 2);

        expect(mapped.getLabels()).toEqual(['a', 'b']);
      });
    });

    describe('forEach', () => {
      test('executes function for each element', () => {
        const tuple = SemanticTuple.from([1, 2, 3]);
        const results: number[] = [];
        tuple.forEach((x) => results.push(x * 2));

        expect(results).toEqual([2, 4, 6]);
      });
    });

    describe('some', () => {
      test('returns true if any element matches', () => {
        const tuple = SemanticTuple.from([1, 2, 3]);
        expect(tuple.some((x) => x > 2)).toBe(true);
      });

      test('returns false if no element matches', () => {
        const tuple = SemanticTuple.from([1, 2, 3]);
        expect(tuple.some((x) => x > 5)).toBe(false);
      });
    });

    describe('every', () => {
      test('returns true if all elements match', () => {
        const tuple = SemanticTuple.from([2, 4, 6]);
        expect(tuple.every((x) => x % 2 === 0)).toBe(true);
      });

      test('returns false if any element does not match', () => {
        const tuple = SemanticTuple.from([2, 3, 4]);
        expect(tuple.every((x) => x % 2 === 0)).toBe(false);
      });
    });

    describe('reduce', () => {
      test('reduces to single value', () => {
        const tuple = SemanticTuple.from([1, 2, 3, 4]);
        const sum = tuple.reduce((acc, x) => acc + x, 0);

        expect(sum).toBe(10);
      });
    });

    describe('iterator', () => {
      test('supports for...of iteration', () => {
        const tuple = SemanticTuple.from([1, 2, 3]);
        const results: number[] = [];

        for (const item of tuple) {
          results.push(item);
        }

        expect(results).toEqual([1, 2, 3]);
      });

      test('supports spread operator', () => {
        const tuple = SemanticTuple.from([1, 2, 3]);
        const spread = [...tuple];

        expect(spread).toEqual([1, 2, 3]);
      });
    });
  });

  describe('toString', () => {
    test('returns tuple-like string representation', () => {
      const tuple = SemanticTuple.from([1, 2, 3]);
      expect(tuple.toString()).toBe('(1, 2, 3)');
    });

    test('handles mixed types', () => {
      const tuple = SemanticTuple.from(['hello', 42, true]);
      expect(tuple.toString()).toBe('(hello, 42, true)');
    });
  });

  describe('toJSON', () => {
    test('returns array for JSON serialization', () => {
      const tuple = SemanticTuple.from([1, 2, 3]);
      expect(tuple.toJSON()).toEqual([1, 2, 3]);
    });

    test('works with JSON.stringify', () => {
      const tuple = SemanticTuple.from([1, 2, 3]);
      expect(JSON.stringify(tuple)).toBe('[1,2,3]');
    });

    test('handles complex types', () => {
      const tuple = SemanticTuple.from([{ a: 1 }, { b: 2 }]);
      expect(JSON.stringify(tuple)).toBe('[{"a":1},{"b":2}]');
    });
  });
});

describe('SemanticTuple prompts', () => {
  test('createSemanticallyEqualsPrompt includes tuples', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt([1, 2], [2, 1]);

    expect(prompt).toContain('Tuple 1:');
    expect(prompt).toContain('Tuple 2:');
  });

  test('createSemanticallyEqualsPrompt includes labels', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt([1, 2], [1, 2], ['x', 'y'], ['a', 'b']);

    expect(prompt).toContain('Tuple 1 labels:');
    expect(prompt).toContain('Tuple 2 labels:');
  });

  test('createInferPositionalMeaningPrompt includes context', async () => {
    const { createInferPositionalMeaningPrompt } = await import('../prompts.ts');
    const prompt = createInferPositionalMeaningPrompt([1, 2], undefined, 'geographic data');

    expect(prompt).toContain('Context: "geographic data"');
  });

  test('createDetectPatternPrompt includes common patterns', async () => {
    const { createDetectPatternPrompt } = await import('../prompts.ts');
    const prompt = createDetectPatternPrompt([255, 128, 0]);

    expect(prompt).toContain('RGB color');
    expect(prompt).toContain('Geographic coordinate');
    expect(prompt).toContain('Range');
  });

  test('createValidateStructurePrompt includes expected types', async () => {
    const { createValidateStructurePrompt } = await import('../prompts.ts');
    const prompt = createValidateStructurePrompt([1, 'text'], ['number', 'string']);

    expect(prompt).toContain('Expected types:');
    expect(prompt).toContain('["number","string"]');
  });

  test('createExplainPrompt includes labels when provided', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt([1, 2], ['x', 'y']);

    expect(prompt).toContain('Labels:');
    expect(prompt).toContain('["x","y"]');
  });
});
