/**
 * Unit tests for SemanticTuple
 */

import { describe, test, expect } from 'bun:test';
import { SemanticTuple } from '../tuple.ts';
import {
  createMockLLMClient,
  mockCoordinatesEquivalentResponse,
  mockDifferentArityResponse,
  mockDifferentMeaningResponse,
  mockCoordinateMeaningResponse,
  mockRGBMeaningResponse,
  mockHTTPStatusMeaningResponse,
  mockValidRelationshipResponse,
  mockInvalidRangeRelationshipResponse,
  mockCoordinatePatternResponse,
  mockRGBPatternResponse,
  mockHTTPStatusPatternResponse,
  mockVersionPatternResponse,
  mockCoordinateToObjectResponse,
  mockRGBToObjectResponse,
  mockGetLatitudeResponse,
  mockGetLngResponse,
  mockGetNotFoundResponse,
  mockValidStructureResponse,
  mockInvalidStructureResponse,
  mockMultipleStructureIssuesResponse,
  mockCoordinateExplanationResponse,
  mockRGBExplanationResponse,
  mockHTTPStatusExplanationResponse,
} from './mocks.ts';

// Create a default mock client for tests that don't need specific responses
const defaultMockClient = createMockLLMClient({});

describe('SemanticTuple', () => {
  describe('static factory methods', () => {
    test('from() creates tuple from array', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      expect(tuple.valueOf()).toEqual([1, 2, 3]);
      expect(tuple.length).toBe(3);
    });

    test('from() creates tuple with labels', () => {
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], defaultMockClient);
      expect(tuple.valueOf()).toEqual([37.7749, -122.4194]);
      expect(tuple.getLabels()).toEqual(['latitude', 'longitude']);
    });

    test('from() creates a copy of the input array', () => {
      const original = [1, 2, 3] as [number, number, number];
      const tuple = SemanticTuple.from(original, undefined, defaultMockClient);
      original.push(4);
      expect(tuple.valueOf()).toEqual([1, 2, 3]);
    });
  });

  describe('valueOf', () => {
    test('returns tuple elements', () => {
      const tuple = SemanticTuple.from(['hello', 42], undefined, defaultMockClient);
      expect(tuple.valueOf()).toEqual(['hello', 42]);
    });

    test('returns a copy, not the internal array', () => {
      const tuple = SemanticTuple.from([1, 2], undefined, defaultMockClient);
      const value = tuple.valueOf();
      value.push(3);
      expect(tuple.valueOf()).toEqual([1, 2]);
    });
  });

  describe('length', () => {
    test('returns tuple length', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      expect(tuple.length).toBe(3);
    });

    test('returns 0 for empty tuple', () => {
      const tuple = SemanticTuple.from([], undefined, defaultMockClient);
      expect(tuple.length).toBe(0);
    });
  });

  describe('at', () => {
    test('returns element at positive index', () => {
      const tuple = SemanticTuple.from(['a', 'b', 'c'], undefined, defaultMockClient);
      expect(tuple.at(1)).toBe('b');
    });

    test('returns element at negative index', () => {
      const tuple = SemanticTuple.from(['a', 'b', 'c'], undefined, defaultMockClient);
      expect(tuple.at(-1)).toBe('c');
    });

    test('returns undefined for out of bounds', () => {
      const tuple = SemanticTuple.from(['a', 'b'], undefined, defaultMockClient);
      expect(tuple.at(5)).toBeUndefined();
    });
  });

  describe('getLabels', () => {
    test('returns labels if set', () => {
      const tuple = SemanticTuple.from([1, 2], ['x', 'y'], defaultMockClient);
      expect(tuple.getLabels()).toEqual(['x', 'y']);
    });

    test('returns undefined if no labels set', () => {
      const tuple = SemanticTuple.from([1, 2], undefined, defaultMockClient);
      expect(tuple.getLabels()).toBeUndefined();
    });

    test('returns a copy of labels', () => {
      const tuple = SemanticTuple.from([1, 2], ['x', 'y'], defaultMockClient);
      const labels = tuple.getLabels();
      labels?.push('z');
      expect(tuple.getLabels()).toEqual(['x', 'y']);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for matching coordinate tuples', async () => {
      const client = createMockLLMClient(mockCoordinatesEquivalentResponse);
      const tuple1 = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);
      const tuple2 = SemanticTuple.from([37.7749, -122.4194], ['lat', 'lng'], client);

      const result = await tuple1.semanticallyEquals(tuple2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    test('returns not equivalent for different arity', async () => {
      const client = createMockLLMClient(mockDifferentArityResponse);
      const tuple1 = SemanticTuple.from([37.7749, -122.4194], undefined, client);
      const tuple2 = SemanticTuple.from([37.7749, -122.4194, 100], undefined, client);

      const result = await tuple1.semanticallyEquals(tuple2);

      expect(result.equivalent).toBe(false);
      expect(result.reason).toContain('Different arity');
    });

    test('returns not equivalent for different meanings', async () => {
      const client = createMockLLMClient(mockDifferentMeaningResponse);
      const coords = SemanticTuple.from([37.7749, -122.4194], ['lat', 'lng'], client);
      const color = SemanticTuple.from([255, 128], ['red', 'green'], client);

      const result = await coords.semanticallyEquals(color);

      expect(result.equivalent).toBe(false);
    });

    test('accepts raw array as parameter', async () => {
      const client = createMockLLMClient(mockCoordinatesEquivalentResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.semanticallyEquals([37.7749, -122.4194]);

      expect(result.equivalent).toBe(true);
    });
  });

  describe('inferPositionalMeaning', () => {
    test('infers coordinate meanings', async () => {
      const client = createMockLLMClient(mockCoordinateMeaningResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toBe('latitude');
      expect(result.positions[1]?.meaning).toBe('longitude');
      expect(result.overallPattern).toBe('geographic coordinates');
    });

    test('infers RGB color meanings', async () => {
      const client = createMockLLMClient(mockRGBMeaningResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toContain('red');
      expect(result.positions[1]?.meaning).toContain('green');
      expect(result.positions[2]?.meaning).toContain('blue');
      expect(result.overallPattern).toBe('RGB color');
    });

    test('infers HTTP status meanings', async () => {
      const client = createMockLLMClient(mockHTTPStatusMeaningResponse);
      const tuple = SemanticTuple.from([200, 'OK'], undefined, client);

      const result = await tuple.inferPositionalMeaning();

      expect(result.positions[0]?.meaning).toContain('status code');
      expect(result.positions[1]?.meaning).toContain('message');
    });

    test('accepts context for better inference', async () => {
      const client = createMockLLMClient(mockCoordinateMeaningResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.inferPositionalMeaning('GPS location data');

      expect(result.positions[0]?.meaning).toBe('latitude');
    });
  });

  describe('validateRelationship', () => {
    test('returns valid for correct relationships', async () => {
      const client = createMockLLMClient(mockValidRelationshipResponse);
      const tuple = SemanticTuple.from([10, 50], ['start', 'end'], client);

      const result = await tuple.validateRelationship(['end should be greater than start']);

      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('returns violations for invalid relationships', async () => {
      const client = createMockLLMClient(mockInvalidRangeRelationshipResponse);
      const tuple = SemanticTuple.from([10, 5], ['start', 'end'], client);

      const result = await tuple.validateRelationship(['end should be greater than start']);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('returns valid for empty rules', async () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);

      const result = await tuple.validateRelationship([]);

      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });
  });

  describe('detectPattern', () => {
    test('detects coordinate pattern', async () => {
      const client = createMockLLMClient(mockCoordinatePatternResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toBe('coordinate');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('detects RGB pattern', async () => {
      const client = createMockLLMClient(mockRGBPatternResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toBe('RGB');
    });

    test('detects HTTP status pattern', async () => {
      const client = createMockLLMClient(mockHTTPStatusPatternResponse);
      const tuple = SemanticTuple.from([200, 'OK'], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toBe('httpStatus');
    });

    test('detects version pattern', async () => {
      const client = createMockLLMClient(mockVersionPatternResponse);
      const tuple = SemanticTuple.from([1, 2, 3], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.pattern).toBe('version');
    });

    test('includes suggested type', async () => {
      const client = createMockLLMClient(mockCoordinatePatternResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const result = await tuple.detectPattern();

      expect(result.suggestedType).toBeDefined();
    });
  });

  describe('toObject', () => {
    test('converts tuple to object using existing labels', async () => {
      const client = createMockLLMClient(mockCoordinateToObjectResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);

      const obj = await tuple.toObject();

      expect(obj).toEqual({ latitude: 37.7749, longitude: -122.4194 });
    });

    test('converts tuple to object using provided labels', async () => {
      const client = createMockLLMClient(mockCoordinateToObjectResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], undefined, client);

      const obj = await tuple.toObject(['lat', 'lng']);

      expect(obj).toEqual({ lat: 37.7749, lng: -122.4194 });
    });

    test('infers labels when not provided', async () => {
      const client = createMockLLMClient(mockRGBToObjectResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const obj = await tuple.toObject();

      expect(obj).toHaveProperty('red');
      expect(obj).toHaveProperty('green');
      expect(obj).toHaveProperty('blue');
    });
  });

  describe('getByLabel', () => {
    test('returns element by exact label match', async () => {
      const client = createMockLLMClient(mockGetLatitudeResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);

      const value = await tuple.getByLabel('latitude');

      expect(value).toBe(37.7749);
    });

    test('returns element by case-insensitive label match', async () => {
      const client = createMockLLMClient(mockGetLatitudeResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);

      const value = await tuple.getByLabel('LATITUDE');

      expect(value).toBe(37.7749);
    });

    test('returns element by semantic label match (alias)', async () => {
      const client = createMockLLMClient(mockGetLngResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);

      const value = await tuple.getByLabel('lng');

      expect(value).toBe(-122.4194);
    });

    test('returns undefined for non-matching label', async () => {
      const client = createMockLLMClient(mockGetNotFoundResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);

      const value = await tuple.getByLabel('altitude');

      expect(value).toBeUndefined();
    });
  });

  describe('validateStructure', () => {
    test('returns valid for matching structure', async () => {
      const client = createMockLLMClient(mockValidStructureResponse);
      const tuple = SemanticTuple.from(['John', 30, true], undefined, client);

      const result = await tuple.validateStructure(['string', 'number', 'boolean']);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('returns issues for mismatched types', async () => {
      const client = createMockLLMClient(mockInvalidStructureResponse);
      const tuple = SemanticTuple.from(['John', 30], undefined, client);

      const result = await tuple.validateStructure(['string', 'string']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('returns invalid for length mismatch', async () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);

      const result = await tuple.validateStructure(['number', 'number']);

      expect(result.valid).toBe(false);
      expect(result.issues[0]?.expected).toContain('2 elements');
      expect(result.issues[0]?.actual).toContain('3 elements');
    });

    test('returns multiple issues', async () => {
      const client = createMockLLMClient(mockMultipleStructureIssuesResponse);
      const tuple = SemanticTuple.from(['John', 30, 'yes'], undefined, client);

      const result = await tuple.validateStructure(['number', 'number', 'boolean']);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
    });
  });

  describe('explain', () => {
    test('explains coordinate tuple', async () => {
      const client = createMockLLMClient(mockCoordinateExplanationResponse);
      const tuple = SemanticTuple.from([37.7749, -122.4194], ['latitude', 'longitude'], client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('latitude');
      expect(explanation).toContain('longitude');
    });

    test('explains RGB color tuple', async () => {
      const client = createMockLLMClient(mockRGBExplanationResponse);
      const tuple = SemanticTuple.from([255, 128, 0], undefined, client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('color');
    });

    test('explains HTTP status tuple', async () => {
      const client = createMockLLMClient(mockHTTPStatusExplanationResponse);
      const tuple = SemanticTuple.from([200, 'OK'], undefined, client);

      const explanation = await tuple.explain();

      expect(explanation).toContain('200');
      expect(explanation).toContain('OK');
    });
  });

  describe('withLabels', () => {
    test('creates new tuple with updated labels', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      const labeled = tuple.withLabels(['a', 'b', 'c']);

      expect(labeled.getLabels()).toEqual(['a', 'b', 'c']);
      expect(tuple.getLabels()).toBeUndefined(); // Original unchanged
    });

    test('preserves values', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      const labeled = tuple.withLabels(['x', 'y', 'z']);

      expect(labeled.valueOf()).toEqual([1, 2, 3]);
    });
  });

  describe('iterator', () => {
    test('supports for...of iteration', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      const results: number[] = [];

      for (const item of tuple) {
        results.push(item);
      }

      expect(results).toEqual([1, 2, 3]);
    });

    test('supports spread operator', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      const spread = [...tuple];

      expect(spread).toEqual([1, 2, 3]);
    });
  });

  describe('toString', () => {
    test('returns string representation', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      expect(tuple.toString()).toBe('[1, 2, 3]');
    });

    test('handles mixed types', () => {
      const tuple = SemanticTuple.from(['hello', 42, true], undefined, defaultMockClient);
      expect(tuple.toString()).toBe('[hello, 42, true]');
    });
  });

  describe('toJSON', () => {
    test('returns array for JSON serialization', () => {
      const tuple = SemanticTuple.from([1, 2, 3], undefined, defaultMockClient);
      expect(tuple.toJSON()).toEqual([1, 2, 3]);
    });

    test('works with JSON.stringify', () => {
      const tuple = SemanticTuple.from([1, 'hello', true], undefined, defaultMockClient);
      expect(JSON.stringify(tuple)).toBe('[1,"hello",true]');
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
    const prompt = createSemanticallyEqualsPrompt(
      [1, 2],
      [2, 1],
      ['x', 'y'],
      ['a', 'b']
    );

    expect(prompt).toContain('Tuple 1 Labels:');
    expect(prompt).toContain('Tuple 2 Labels:');
  });

  test('createInferPositionalMeaningPrompt includes context', async () => {
    const { createInferPositionalMeaningPrompt } = await import('../prompts.ts');
    const prompt = createInferPositionalMeaningPrompt([37.7, -122.4], 'GPS data');

    expect(prompt).toContain('Context: "GPS data"');
  });

  test('createDetectPatternPrompt includes labels', async () => {
    const { createDetectPatternPrompt } = await import('../prompts.ts');
    const prompt = createDetectPatternPrompt([255, 128, 0], ['r', 'g', 'b']);

    expect(prompt).toContain('Labels:');
  });

  test('createValidateStructurePrompt includes expected types', async () => {
    const { createValidateStructurePrompt } = await import('../prompts.ts');
    const prompt = createValidateStructurePrompt([1, 'hello'], ['number', 'string']);

    expect(prompt).toContain('Expected types:');
    expect(prompt).toContain('"number"');
    expect(prompt).toContain('"string"');
  });
});
