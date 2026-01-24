/**
 * Unit tests for SemanticSymbol
 */

import { describe, test, expect } from 'bun:test';
import { SemanticSymbol } from '../symbol.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockSamePurposeResponse,
  mockSuggestBetterNameResponse,
  mockNoSuggestionNeededResponse,
  mockSingleCharSuggestionResponse,
  mockClassifyEventResponse,
  mockClassifyConfigResponse,
  mockClassifyIdentifierResponse,
  mockClassifyLifecycleResponse,
  mockClassifyInternalResponse,
  mockValidResponse,
  mockValidWithWarningsResponse,
  mockInvalidResponse,
  mockAbbreviationWarningResponse,
  mockDescribePurposeCacheKeyResponse,
  mockDescribePurposeAuthTokenResponse,
  mockDescribePurposeEventResponse,
  mockAppropriateResponse,
  mockNotAppropriateResponse,
  mockAppropriateForConfigResponse,
} from './mocks.ts';

describe('SemanticSymbol', () => {
  describe('create', () => {
    test('creates SemanticSymbol with description', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.create('userAuthToken', client);

      expect(ss.description()).toBe('userAuthToken');
      expect(typeof ss.valueOf()).toBe('symbol');
    });

    test('creates unique symbols for same description', () => {
      const client = createMockLLMClient({});
      const ss1 = SemanticSymbol.create('userId', client);
      const ss2 = SemanticSymbol.create('userId', client);

      expect(ss1.valueOf()).not.toBe(ss2.valueOf());
      expect(ss1.description()).toBe(ss2.description());
    });

    test('toString returns symbol string representation', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.create('testSymbol', client);

      expect(ss.toString()).toBe('Symbol(testSymbol)');
    });
  });

  describe('for', () => {
    test('creates global symbol from registry', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.for('app.config.database', client);

      expect(ss.description()).toBe('app.config.database');
      expect(typeof ss.valueOf()).toBe('symbol');
    });

    test('returns same instance for same key', () => {
      const client = createMockLLMClient({});
      const ss1 = SemanticSymbol.for('test.singleton.key', client);
      const ss2 = SemanticSymbol.for('test.singleton.key', client);

      expect(ss1).toBe(ss2);
      expect(ss1.valueOf()).toBe(ss2.valueOf());
    });

    test('uses Symbol.for under the hood', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.for('global.test.key', client);

      expect(ss.valueOf()).toBe(Symbol.for('global.test.key'));
    });
  });

  describe('fromSymbol', () => {
    test('wraps existing symbol', () => {
      const client = createMockLLMClient({});
      const nativeSymbol = Symbol('existingSymbol');
      const ss = SemanticSymbol.fromSymbol(nativeSymbol, client);

      expect(ss.valueOf()).toBe(nativeSymbol);
      expect(ss.description()).toBe('existingSymbol');
    });

    test('handles symbol without description', () => {
      const client = createMockLLMClient({});
      const nativeSymbol = Symbol();
      const ss = SemanticSymbol.fromSymbol(nativeSymbol, client);

      expect(ss.valueOf()).toBe(nativeSymbol);
      expect(ss.description()).toBeUndefined();
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for same concept different naming', async () => {
      const client = createSequentialMockLLMClient([mockEquivalentResponse]);
      const ss1 = SemanticSymbol.create('userId', client);
      const ss2 = SemanticSymbol.create('user_id', client);

      const result = await ss1.semanticallyEquals(ss2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.note).toBe('Same concept, different naming convention');
    });

    test('returns not equivalent for different concepts', async () => {
      const client = createSequentialMockLLMClient([mockNotEquivalentResponse]);
      const ss1 = SemanticSymbol.create('userId', client);
      const ss2 = SemanticSymbol.create('productPrice', client);

      const result = await ss1.semanticallyEquals(ss2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.9);
    });

    test('works with native symbol', async () => {
      const client = createSequentialMockLLMClient([mockSamePurposeResponse]);
      const ss = SemanticSymbol.create('userId', client);
      const nativeSymbol = Symbol('user_identifier');

      const result = await ss.semanticallyEquals(nativeSymbol);

      expect(result.equivalent).toBe(true);
    });

    test('handles symbols without descriptions', async () => {
      const client = createMockLLMClient({});
      const ss1 = SemanticSymbol.fromSymbol(Symbol(), client);
      const ss2 = SemanticSymbol.fromSymbol(Symbol(), client);

      const result = await ss1.semanticallyEquals(ss2);

      expect(result.equivalent).toBe(false);
      expect(result.note).toContain('Cannot compare');
    });

    test('handles same symbol instance', async () => {
      const client = createMockLLMClient({});
      const nativeSymbol = Symbol();
      const ss1 = SemanticSymbol.fromSymbol(nativeSymbol, client);

      const result = await ss1.semanticallyEquals(nativeSymbol);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.note).toBe('Same symbol instance');
    });

    test('handles one symbol without description', async () => {
      const client = createMockLLMClient({});
      const ss1 = SemanticSymbol.create('userId', client);
      const ss2 = SemanticSymbol.fromSymbol(Symbol(), client);

      const result = await ss1.semanticallyEquals(ss2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('suggestBetterName', () => {
    test('suggests better name for abbreviation', async () => {
      const client = createMockLLMClient(mockSuggestBetterNameResponse);
      const ss = SemanticSymbol.create('usrid', client);

      const result = await ss.suggestBetterName();

      expect(result.suggestion).toBe('userId');
      expect(result.reason).toContain('camelCase');
    });

    test('returns null when name is already good', async () => {
      const client = createMockLLMClient(mockNoSuggestionNeededResponse);
      const ss = SemanticSymbol.create('userAuthToken', client);

      const result = await ss.suggestBetterName();

      expect(result.suggestion).toBeNull();
      expect(result.reason).toContain('already clear');
    });

    test('handles single character names', async () => {
      const client = createMockLLMClient(mockSingleCharSuggestionResponse);
      const ss = SemanticSymbol.create('x', client);

      const result = await ss.suggestBetterName();

      expect(result.suggestion).toBeNull();
      expect(result.reason).toContain('more context');
    });

    test('handles symbol without description', async () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      const result = await ss.suggestBetterName();

      expect(result.suggestion).toBeNull();
      expect(result.reason).toBe('Symbol has no description to analyze');
    });
  });

  describe('classify', () => {
    test('classifies event symbol', async () => {
      const client = createMockLLMClient(mockClassifyEventResponse);
      const ss = SemanticSymbol.create('onUserLogin', client);

      const result = await ss.classify();

      expect(result.category).toBe('event');
      expect(result.subcategory).toBe('lifecycle');
    });

    test('classifies configuration symbol', async () => {
      const client = createMockLLMClient(mockClassifyConfigResponse);
      const ss = SemanticSymbol.create('API_SECRET_KEY', client);

      const result = await ss.classify();

      expect(result.category).toBe('configuration');
      expect(result.subcategory).toBe('secrets');
    });

    test('classifies identifier symbol', async () => {
      const client = createMockLLMClient(mockClassifyIdentifierResponse);
      const ss = SemanticSymbol.create('userId', client);

      const result = await ss.classify();

      expect(result.category).toBe('identifier');
      expect(result.subcategory).toBe('user');
    });

    test('classifies lifecycle symbol', async () => {
      const client = createMockLLMClient(mockClassifyLifecycleResponse);
      const ss = SemanticSymbol.create('init', client);

      const result = await ss.classify();

      expect(result.category).toBe('lifecycle');
      expect(result.subcategory).toBe('initialization');
    });

    test('classifies internal symbol', async () => {
      const client = createMockLLMClient(mockClassifyInternalResponse);
      const ss = SemanticSymbol.create('_internal', client);

      const result = await ss.classify();

      expect(result.category).toBe('internal');
    });

    test('returns unknown for symbol without description', async () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      const result = await ss.classify();

      expect(result.category).toBe('unknown');
      expect(result.subcategory).toBeUndefined();
    });
  });

  describe('validate', () => {
    test('validates symbol with good name', async () => {
      const client = createMockLLMClient(mockValidResponse);
      const ss = SemanticSymbol.create('userAuthToken', client);

      const result = await ss.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.issues).toEqual([]);
    });

    test('validates symbol with warnings', async () => {
      const client = createMockLLMClient(mockValidWithWarningsResponse);
      const ss = SemanticSymbol.create('_private_internal', client);

      const result = await ss.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Underscore prefix');
    });

    test('validates with custom conventions', async () => {
      const client = createMockLLMClient(mockAbbreviationWarningResponse);
      const ss = SemanticSymbol.create('usrId', client);

      const result = await ss.validate(['Always use full words']);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Avoid abbreviations like "usr" - use "user" instead');
    });

    test('returns invalid for poor names', async () => {
      const client = createMockLLMClient(mockInvalidResponse);
      const ss = SemanticSymbol.create('x', client);

      const result = await ss.validate();

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('handles symbol without description', async () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      const result = await ss.validate();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Symbol has no description to validate');
    });
  });

  describe('describePurpose', () => {
    test('describes cache key purpose', async () => {
      const client = createMockLLMClient(mockDescribePurposeCacheKeyResponse);
      const ss = SemanticSymbol.create('cacheKey', client);

      const purpose = await ss.describePurpose();

      expect(purpose).toContain('cache');
      expect(purpose).toContain('identifier');
    });

    test('describes auth token purpose', async () => {
      const client = createMockLLMClient(mockDescribePurposeAuthTokenResponse);
      const ss = SemanticSymbol.create('userAuthToken', client);

      const purpose = await ss.describePurpose();

      expect(purpose).toContain('Authentication');
    });

    test('describes event handler purpose', async () => {
      const client = createMockLLMClient(mockDescribePurposeEventResponse);
      const ss = SemanticSymbol.create('onUserLogin', client);

      const purpose = await ss.describePurpose();

      expect(purpose).toContain('Event handler');
    });

    test('handles symbol without description', async () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      const purpose = await ss.describePurpose();

      expect(purpose).toBe('Unknown purpose - symbol has no description');
    });
  });

  describe('isAppropriateFor', () => {
    test('returns appropriate for matching use case', async () => {
      const client = createMockLLMClient(mockAppropriateResponse);
      const ss = SemanticSymbol.create('userId', client);

      const result = await ss.isAppropriateFor('user identification');

      expect(result.appropriate).toBe(true);
    });

    test('returns not appropriate for mismatched use case', async () => {
      const client = createMockLLMClient(mockNotAppropriateResponse);
      const ss = SemanticSymbol.create('tempId', client);

      const result = await ss.isAppropriateFor('database primary key');

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('Temporary');
    });

    test('validates config symbol for secrets', async () => {
      const client = createMockLLMClient(mockAppropriateForConfigResponse);
      const ss = SemanticSymbol.create('API_SECRET_KEY', client);

      const result = await ss.isAppropriateFor('configuration secrets');

      expect(result.appropriate).toBe(true);
    });

    test('handles symbol without description', async () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      const result = await ss.isAppropriateFor('any use case');

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('Cannot assess');
    });
  });

  describe('valueOf', () => {
    test('returns the underlying symbol', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.create('testSymbol', client);
      const value = ss.valueOf();

      expect(typeof value).toBe('symbol');
      expect(value.description).toBe('testSymbol');
    });
  });

  describe('description', () => {
    test('returns the symbol description', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.create('myDescription', client);

      expect(ss.description()).toBe('myDescription');
    });

    test('returns undefined for symbol without description', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      expect(ss.description()).toBeUndefined();
    });
  });

  describe('toString', () => {
    test('returns symbol string representation', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.create('testSymbol', client);

      expect(ss.toString()).toBe('Symbol(testSymbol)');
    });
  });

  describe('toJSON', () => {
    test('returns JSON representation', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.create('jsonTest', client);

      const json = ss.toJSON();

      expect(json).toEqual({
        description: 'jsonTest',
      });
    });

    test('handles undefined description', () => {
      const client = createMockLLMClient({});
      const ss = SemanticSymbol.fromSymbol(Symbol(), client);

      const json = ss.toJSON();

      expect(json).toEqual({
        description: undefined,
      });
    });
  });
});

describe('SemanticSymbol prompts', () => {
  test('createSemanticallyEqualsPrompt includes both descriptions', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt('userId', 'user_id');

    expect(prompt).toContain('Symbol 1 description: "userId"');
    expect(prompt).toContain('Symbol 2 description: "user_id"');
  });

  test('createSuggestBetterNamePrompt includes description', async () => {
    const { createSuggestBetterNamePrompt } = await import('../prompts.ts');
    const prompt = createSuggestBetterNamePrompt('usrid');

    expect(prompt).toContain('Symbol description: "usrid"');
  });

  test('createClassifyPrompt includes description', async () => {
    const { createClassifyPrompt } = await import('../prompts.ts');
    const prompt = createClassifyPrompt('onUserLogin');

    expect(prompt).toContain('Symbol description: "onUserLogin"');
    expect(prompt).toContain('event');
    expect(prompt).toContain('configuration');
  });

  test('createValidatePrompt includes description and conventions', async () => {
    const { createValidatePrompt } = await import('../prompts.ts');
    const prompt = createValidatePrompt('testSymbol', ['Use camelCase', 'No abbreviations']);

    expect(prompt).toContain('Symbol description: "testSymbol"');
    expect(prompt).toContain('Use camelCase');
    expect(prompt).toContain('No abbreviations');
  });

  test('createValidatePrompt works without conventions', async () => {
    const { createValidatePrompt } = await import('../prompts.ts');
    const prompt = createValidatePrompt('testSymbol');

    expect(prompt).toContain('Symbol description: "testSymbol"');
    expect(prompt).not.toContain('Additional conventions');
  });

  test('createDescribePurposePrompt includes description', async () => {
    const { createDescribePurposePrompt } = await import('../prompts.ts');
    const prompt = createDescribePurposePrompt('cacheKey');

    expect(prompt).toContain('Symbol description: "cacheKey"');
  });

  test('createIsAppropriateForPrompt includes description and use case', async () => {
    const { createIsAppropriateForPrompt } = await import('../prompts.ts');
    const prompt = createIsAppropriateForPrompt('tempId', 'database primary key');

    expect(prompt).toContain('Symbol description: "tempId"');
    expect(prompt).toContain('Intended use case: "database primary key"');
  });
});
