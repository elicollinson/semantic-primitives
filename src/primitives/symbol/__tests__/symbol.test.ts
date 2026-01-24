import { describe, expect, test, mock } from 'bun:test';
import { SemanticSymbol, type LLMClientInterface } from '../symbol.ts';
import type { Message } from '../../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): LLMClientInterface {
  return {
    chat: mock(({ messages, systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
      // Find matching response based on system prompt or message content
      for (const [key, value] of Object.entries(responses)) {
        if (systemPrompt?.includes(key) || messages.some((m) => m.content.includes(key))) {
          return Promise.resolve({ content: value });
        }
      }
      // Default response
      return Promise.resolve({ content: '{"error": "No mock response found"}' });
    }),
  };
}

describe('SemanticSymbol', () => {
  describe('static create()', () => {
    test('creates a SemanticSymbol with a description', () => {
      const sym = SemanticSymbol.create('userAuthToken');
      expect(sym.description()).toBe('userAuthToken');
      expect(typeof sym.valueOf()).toBe('symbol');
    });

    test('creates unique symbols for each call', () => {
      const sym1 = SemanticSymbol.create('test');
      const sym2 = SemanticSymbol.create('test');
      expect(sym1.valueOf()).not.toBe(sym2.valueOf());
    });

    test('accepts custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const sym = SemanticSymbol.create('test', mockClient);
      expect(sym.description()).toBe('test');
    });
  });

  describe('static for()', () => {
    test('creates a global SemanticSymbol', () => {
      const sym = SemanticSymbol.for('app.config.database');
      expect(sym.description()).toBe('app.config.database');
    });

    test('returns same instance for same key', () => {
      const sym1 = SemanticSymbol.for('test.global.key');
      const sym2 = SemanticSymbol.for('test.global.key');
      expect(sym1).toBe(sym2);
      expect(sym1.valueOf()).toBe(sym2.valueOf());
    });

    test('returns different instances for different keys', () => {
      const sym1 = SemanticSymbol.for('test.key.one');
      const sym2 = SemanticSymbol.for('test.key.two');
      expect(sym1).not.toBe(sym2);
      expect(sym1.valueOf()).not.toBe(sym2.valueOf());
    });
  });

  describe('static from()', () => {
    test('wraps an existing symbol', () => {
      const nativeSymbol = Symbol('nativeTest');
      const sym = SemanticSymbol.from(nativeSymbol);
      expect(sym.valueOf()).toBe(nativeSymbol);
      expect(sym.description()).toBe('nativeTest');
    });

    test('wraps symbol without description', () => {
      const nativeSymbol = Symbol();
      const sym = SemanticSymbol.from(nativeSymbol);
      expect(sym.valueOf()).toBe(nativeSymbol);
      expect(sym.description()).toBeUndefined();
    });
  });

  describe('semanticallyEquals()', () => {
    test('compares symbols with same naming convention', async () => {
      const mockClient = createMockLLMClient({
        'symbol naming': JSON.stringify({
          equivalent: true,
          confidence: 0.98,
          note: 'Identical descriptions',
        }),
      });

      const sym1 = SemanticSymbol.create('userId', mockClient);
      const sym2 = SemanticSymbol.create('userId', mockClient);
      const result = await sym1.semanticallyEquals(sym2);
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('compares symbols with different naming conventions', async () => {
      const mockClient = createMockLLMClient({
        'symbol naming': JSON.stringify({
          equivalent: true,
          confidence: 0.95,
          note: 'Same concept, different naming convention (camelCase vs snake_case)',
        }),
      });

      const sym1 = SemanticSymbol.create('userId', mockClient);
      const sym2 = SemanticSymbol.create('user_id', mockClient);
      const result = await sym1.semanticallyEquals(sym2);
      expect(result.equivalent).toBe(true);
      expect(result.note).toContain('naming convention');
    });

    test('compares with native symbol', async () => {
      const mockClient = createMockLLMClient({
        'symbol naming': JSON.stringify({
          equivalent: true,
          confidence: 0.9,
          note: 'Same concept',
        }),
      });

      const sym = SemanticSymbol.create('userId', mockClient);
      const nativeSymbol = Symbol('userId');
      const result = await sym.semanticallyEquals(nativeSymbol);
      expect(result.equivalent).toBe(true);
    });

    test('returns false for semantically different symbols', async () => {
      const mockClient = createMockLLMClient({
        'symbol naming': JSON.stringify({
          equivalent: false,
          confidence: 0.95,
          note: 'Different concepts - user identifier vs product identifier',
        }),
      });

      const sym1 = SemanticSymbol.create('userId', mockClient);
      const sym2 = SemanticSymbol.create('productId', mockClient);
      const result = await sym1.semanticallyEquals(sym2);
      expect(result.equivalent).toBe(false);
    });

    test('handles symbols without descriptions', async () => {
      const sym1 = SemanticSymbol.from(Symbol());
      const sym2 = SemanticSymbol.from(Symbol());
      const result = await sym1.semanticallyEquals(sym2);
      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(1.0);
    });

    test('same symbol instance returns equivalent', async () => {
      const nativeSymbol = Symbol();
      const sym1 = SemanticSymbol.from(nativeSymbol);
      const result = await sym1.semanticallyEquals(nativeSymbol);
      expect(result.equivalent).toBe(true);
      expect(result.note).toContain('Same symbol instance');
    });
  });

  describe('suggestBetterName()', () => {
    test('suggests better name for abbreviation', async () => {
      const mockClient = createMockLLMClient({
        'code naming': JSON.stringify({
          suggestion: 'userId',
          reason: 'Expand abbreviations for clarity',
        }),
      });

      const sym = SemanticSymbol.create('usrid', mockClient);
      const result = await sym.suggestBetterName();
      expect(result.suggestion).toBe('userId');
      expect(result.reason).toContain('abbreviation');
    });

    test('returns null suggestion for good name', async () => {
      const mockClient = createMockLLMClient({
        'code naming': JSON.stringify({
          suggestion: null,
          reason: 'Name follows camelCase convention and is descriptive',
        }),
      });

      const sym = SemanticSymbol.create('userAuthToken', mockClient);
      const result = await sym.suggestBetterName();
      expect(result.suggestion).toBeUndefined();
      expect(result.reason).toContain('descriptive');
    });

    test('handles symbol without description', async () => {
      const sym = SemanticSymbol.from(Symbol());
      const result = await sym.suggestBetterName();
      expect(result.suggestion).toBeUndefined();
      expect(result.reason).toContain('without a description');
    });

    test('suggests for single letter names', async () => {
      const mockClient = createMockLLMClient({
        'code naming': JSON.stringify({
          suggestion: null,
          reason: 'Cannot suggest a meaningful name without context about what x represents',
        }),
      });

      const sym = SemanticSymbol.create('x', mockClient);
      const result = await sym.suggestBetterName();
      expect(result.reason).toBeDefined();
    });
  });

  describe('classify()', () => {
    test('classifies event handler symbol', async () => {
      const mockClient = createMockLLMClient({
        'code analysis': JSON.stringify({
          category: 'event',
          subcategory: 'lifecycle',
        }),
      });

      const sym = SemanticSymbol.create('onUserLogin', mockClient);
      const result = await sym.classify();
      expect(result.category).toBe('event');
      expect(result.subcategory).toBe('lifecycle');
    });

    test('classifies configuration symbol', async () => {
      const mockClient = createMockLLMClient({
        'code analysis': JSON.stringify({
          category: 'configuration',
          subcategory: 'secrets',
        }),
      });

      const sym = SemanticSymbol.create('API_SECRET_KEY', mockClient);
      const result = await sym.classify();
      expect(result.category).toBe('configuration');
      expect(result.subcategory).toBe('secrets');
    });

    test('classifies identifier symbol', async () => {
      const mockClient = createMockLLMClient({
        'code analysis': JSON.stringify({
          category: 'identifier',
          subcategory: 'cache',
        }),
      });

      const sym = SemanticSymbol.create('cacheKey', mockClient);
      const result = await sym.classify();
      expect(result.category).toBe('identifier');
    });

    test('returns unknown for symbol without description', async () => {
      const sym = SemanticSymbol.from(Symbol());
      const result = await sym.classify();
      expect(result.category).toBe('unknown');
    });

    test('classifies action symbol', async () => {
      const mockClient = createMockLLMClient({
        'code analysis': JSON.stringify({
          category: 'action',
          subcategory: 'validation',
        }),
      });

      const sym = SemanticSymbol.create('validateInput', mockClient);
      const result = await sym.classify();
      expect(result.category).toBe('action');
    });
  });

  describe('validate()', () => {
    test('validates good symbol name', async () => {
      const mockClient = createMockLLMClient({
        'code review': JSON.stringify({
          valid: true,
          warnings: [],
        }),
      });

      const sym = SemanticSymbol.create('userAuthToken', mockClient);
      const result = await sym.validate();
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('validates with warnings for underscore prefix', async () => {
      const mockClient = createMockLLMClient({
        'code review': JSON.stringify({
          valid: true,
          warnings: ['Underscore prefix suggests private; consider using # for true privacy'],
        }),
      });

      const sym = SemanticSymbol.create('_privateInternal', mockClient);
      const result = await sym.validate();
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Underscore');
    });

    test('validates with custom conventions', async () => {
      const mockClient = createMockLLMClient({
        'code review': JSON.stringify({
          valid: false,
          warnings: ['Does not follow required SCREAMING_CASE convention'],
        }),
      });

      const sym = SemanticSymbol.create('myConstant', mockClient);
      const result = await sym.validate(['Constants must use SCREAMING_CASE']);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('returns invalid for symbol without description', async () => {
      const sym = SemanticSymbol.from(Symbol());
      const result = await sym.validate();
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Symbol has no description');
    });

    test('validates short name', async () => {
      const mockClient = createMockLLMClient({
        'code review': JSON.stringify({
          valid: false,
          warnings: ['Name is too short; use a more descriptive name'],
        }),
      });

      const sym = SemanticSymbol.create('x', mockClient);
      const result = await sym.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe('describePurpose()', () => {
    test('describes purpose of cache key', async () => {
      const mockClient = createMockLLMClient({
        'documentation': JSON.stringify({
          purpose: 'Unique identifier for cache entries',
        }),
      });

      const sym = SemanticSymbol.create('cacheKey', mockClient);
      const result = await sym.describePurpose();
      expect(result).toBe('Unique identifier for cache entries');
    });

    test('describes purpose of event handler', async () => {
      const mockClient = createMockLLMClient({
        'documentation': JSON.stringify({
          purpose: 'Event handler triggered when a user logs in to the system',
        }),
      });

      const sym = SemanticSymbol.create('onUserLogin', mockClient);
      const result = await sym.describePurpose();
      expect(result).toContain('user logs in');
    });

    test('returns unknown for symbol without description', async () => {
      const sym = SemanticSymbol.from(Symbol());
      const result = await sym.describePurpose();
      expect(result).toContain('Unknown purpose');
    });
  });

  describe('isAppropriateFor()', () => {
    test('tempId is not appropriate for database primary key', async () => {
      const mockClient = createMockLLMClient({
        'software design': JSON.stringify({
          appropriate: false,
          reason: 'Temporary identifiers should not be used as permanent keys',
        }),
      });

      const sym = SemanticSymbol.create('tempId', mockClient);
      const result = await sym.isAppropriateFor('database primary key');
      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('Temporary');
    });

    test('userId is appropriate for user identification', async () => {
      const mockClient = createMockLLMClient({
        'software design': JSON.stringify({
          appropriate: true,
          reason: 'userId is a clear and appropriate identifier for user-related operations',
        }),
      });

      const sym = SemanticSymbol.create('userId', mockClient);
      const result = await sym.isAppropriateFor('user identification');
      expect(result.appropriate).toBe(true);
    });

    test('returns not appropriate for symbol without description', async () => {
      const sym = SemanticSymbol.from(Symbol());
      const result = await sym.isAppropriateFor('any use case');
      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('without a description');
    });

    test('cacheInvalidationKey is appropriate for cache management', async () => {
      const mockClient = createMockLLMClient({
        'software design': JSON.stringify({
          appropriate: true,
          reason: 'The name clearly indicates its purpose for managing cache invalidation',
        }),
      });

      const sym = SemanticSymbol.create('cacheInvalidationKey', mockClient);
      const result = await sym.isAppropriateFor('cache management');
      expect(result.appropriate).toBe(true);
    });
  });

  describe('valueOf()', () => {
    test('returns the underlying symbol', () => {
      const sym = SemanticSymbol.create('test');
      expect(typeof sym.valueOf()).toBe('symbol');
    });

    test('returns same symbol from from()', () => {
      const nativeSymbol = Symbol('native');
      const sym = SemanticSymbol.from(nativeSymbol);
      expect(sym.valueOf()).toBe(nativeSymbol);
    });
  });

  describe('description()', () => {
    test('returns the description', () => {
      const sym = SemanticSymbol.create('testDescription');
      expect(sym.description()).toBe('testDescription');
    });

    test('returns undefined for symbol without description', () => {
      const sym = SemanticSymbol.from(Symbol());
      expect(sym.description()).toBeUndefined();
    });
  });

  describe('toString()', () => {
    test('returns string representation', () => {
      const sym = SemanticSymbol.create('test');
      expect(sym.toString()).toBe('Symbol(test)');
    });

    test('returns Symbol() for symbol without description', () => {
      const sym = SemanticSymbol.from(Symbol());
      expect(sym.toString()).toBe('Symbol()');
    });
  });

  describe('toJSON()', () => {
    test('returns description for JSON serialization', () => {
      const sym = SemanticSymbol.create('test');
      expect(sym.toJSON()).toBe('test');
    });

    test('returns undefined for symbol without description', () => {
      const sym = SemanticSymbol.from(Symbol());
      expect(sym.toJSON()).toBeUndefined();
    });

    test('works with JSON.stringify', () => {
      const sym = SemanticSymbol.create('testKey');
      expect(JSON.stringify({ symbol: sym })).toBe('{"symbol":"testKey"}');
    });
  });
});
