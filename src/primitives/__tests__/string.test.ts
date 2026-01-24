/**
 * Tests for SemanticString
 *
 * These tests mock the LLM client to avoid actual API calls.
 * Each test verifies the correct prompt is sent and response is parsed.
 */

import { describe, test, expect, mock } from 'bun:test';
import {
  SemanticString,
  type SemanticEqualsResult,
  type ClassifyResult,
  type ValidateResult,
  type DetectIntentResult,
  type DetectLanguageResult,
  type ContainsSensitiveResult,
  type Correction,
} from '../string.ts';
import type { LLMClient } from '../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../llm/types.ts';

/** Mock function type for tracking calls */
type MockCompleteFn = ReturnType<typeof mock<(options: CompletionOptions) => Promise<LLMResponse>>>;

/** Mock client with typed complete function */
interface MockLLMClient extends LLMClient {
  complete: MockCompleteFn;
}

/** Create a mock LLM client that returns a specified response */
function createMockClient(responseContent: string): MockLLMClient {
  const mockResponse: LLMResponse = {
    content: responseContent,
    provider: 'google',
    model: 'gemini-2.0-flash-lite',
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
  };

  const completeMock = mock(() => Promise.resolve(mockResponse));

  return {
    complete: completeMock,
    chat: mock(() => Promise.resolve(mockResponse)),
    withProvider: mock(() => ({}) as LLMClient),
  } as unknown as MockLLMClient;
}

/** Helper to get the first call's arguments safely */
function getFirstCallArgs(mockFn: MockCompleteFn): CompletionOptions {
  const calls = mockFn.mock.calls;
  if (!calls || calls.length === 0 || !calls[0]) {
    throw new Error('Mock was not called');
  }
  const firstCall = calls[0];
  if (!firstCall[0]) {
    throw new Error('Mock call has no arguments');
  }
  return firstCall[0];
}

describe('SemanticString', () => {
  describe('factory and basic methods', () => {
    test('from() creates a SemanticString instance', () => {
      const str = SemanticString.from('hello');
      expect(str).toBeInstanceOf(SemanticString);
    });

    test('toString() returns the underlying value', () => {
      const str = SemanticString.from('hello world');
      expect(str.toString()).toBe('hello world');
    });

    test('valueOf() returns the underlying value', () => {
      const str = SemanticString.from('hello world');
      expect(str.valueOf()).toBe('hello world');
    });

    test('length returns the string length', () => {
      const str = SemanticString.from('hello');
      expect(str.length).toBe(5);
    });
  });

  describe('semanticallyEquals()', () => {
    test('returns equivalence result for similar strings', async () => {
      const mockResponse: SemanticEqualsResult = {
        equivalent: true,
        confidence: 0.95,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('purchase', client);

      const result = await str.semanticallyEquals('buy');

      expect(result).toEqual({ equivalent: true, confidence: 0.95 });
      expect(client.complete.mock.calls.length).toBe(1);
    });

    test('returns non-equivalence for different meanings', async () => {
      const mockResponse: SemanticEqualsResult = {
        equivalent: false,
        confidence: 0.88,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('happy', client);

      const result = await str.semanticallyEquals('sad');

      expect(result).toEqual({ equivalent: false, confidence: 0.88 });
    });

    test('accepts SemanticString as argument', async () => {
      const mockResponse: SemanticEqualsResult = {
        equivalent: true,
        confidence: 0.92,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str1 = SemanticString.from('The meeting is cancelled', client);
      const str2 = SemanticString.from('Meeting has been called off', client);

      const result = await str1.semanticallyEquals(str2);

      expect(result.equivalent).toBe(true);
    });

    test('applies threshold option', async () => {
      const mockResponse: SemanticEqualsResult = {
        equivalent: true,
        confidence: 0.7,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('hello', client);

      const result = await str.semanticallyEquals('hi', { threshold: 0.8 });

      expect(result.equivalent).toBe(false); // 0.7 < 0.8 threshold
      expect(result.confidence).toBe(0.7);
    });

    test('passes context to prompt', async () => {
      const mockResponse: SemanticEqualsResult = {
        equivalent: true,
        confidence: 0.9,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('bank', client);

      await str.semanticallyEquals('financial institution', {
        context: 'financial discussion',
      });

      expect(client.complete.mock.calls.length).toBe(1);
      const callArgs = getFirstCallArgs(client.complete);
      expect(callArgs.prompt).toContain('financial discussion');
    });
  });

  describe('classify()', () => {
    test('classifies text into correct category', async () => {
      const mockResponse: ClassifyResult = {
        category: 'account',
        confidence: 0.89,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from("I can't log in to my account", client);

      const result = await str.classify(['billing', 'technical', 'account', 'general']);

      expect(result).toEqual({ category: 'account', confidence: 0.89 });
    });

    test('handles context parameter', async () => {
      const mockResponse: ClassifyResult = {
        category: 'technical',
        confidence: 0.85,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('The system is down', client);

      const result = await str.classify(
        ['billing', 'technical', 'general'],
        'customer support tickets'
      );

      expect(result.category).toBe('technical');
      const callArgs = getFirstCallArgs(client.complete);
      expect(callArgs.prompt).toContain('customer support tickets');
    });

    test('returns confidence score', async () => {
      const mockResponse: ClassifyResult = {
        category: 'general',
        confidence: 0.45,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('ambiguous text', client);

      const result = await str.classify(['a', 'b', 'general']);

      expect(result.confidence).toBe(0.45);
    });
  });

  describe('extract()', () => {
    test('extracts multiple entity types', async () => {
      const mockResponse = {
        email: 'john@example.com',
        name: 'John',
        date: 'Friday',
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'Contact John at john@example.com by Friday',
        client
      );

      const result = await str.extract(['email', 'name', 'date']);

      expect(result).toEqual({
        email: 'john@example.com',
        name: 'John',
        date: 'Friday',
      });
    });

    test('returns null for missing entities', async () => {
      const mockResponse = {
        email: null,
        phone: '555-1234',
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Call me at 555-1234', client);

      const result = await str.extract(['email', 'phone']);

      expect(result.email).toBeNull();
      expect(result.phone).toBe('555-1234');
    });

    test('handles array values for multiple entities', async () => {
      const mockResponse = {
        name: ['John', 'Jane'],
        company: 'Acme Corp',
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'John and Jane work at Acme Corp',
        client
      );

      const result = await str.extract(['name', 'company']);

      expect(result.name).toEqual(['John', 'Jane']);
      expect(result.company).toBe('Acme Corp');
    });
  });

  describe('validate()', () => {
    test('returns valid for passing rules', async () => {
      const mockResponse: ValidateResult = {
        valid: true,
        issues: [],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'Please contact us for assistance.',
        client
      );

      const result = await str.validate([
        'should be professional',
        'no excessive punctuation',
      ]);

      expect(result).toEqual({ valid: true, issues: [] });
    });

    test('returns invalid with issues for failing rules', async () => {
      const mockResponse: ValidateResult = {
        valid: false,
        issues: ['excessive punctuation (!!!)'],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Buy now!!!', client);

      const result = await str.validate([
        'should be professional',
        'no excessive punctuation',
      ]);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('excessive punctuation (!!!)');
    });

    test('handles multiple issues', async () => {
      const mockResponse: ValidateResult = {
        valid: false,
        issues: ['contains profanity', 'uses all caps', 'too aggressive'],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('THIS IS BAD!!!', client);

      const result = await str.validate([
        'no profanity',
        'no all caps',
        'be polite',
      ]);

      expect(result.issues.length).toBe(3);
    });
  });

  describe('detectIntent()', () => {
    test('detects question intent', async () => {
      const mockResponse: DetectIntentResult = {
        intent: 'question',
        subtype: 'how-to',
        topic: 'password-reset',
        confidence: 0.94,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('How do I reset my password?', client);

      const result = await str.detectIntent();

      expect(result).toEqual({
        intent: 'question',
        subtype: 'how-to',
        topic: 'password-reset',
        confidence: 0.94,
      });
    });

    test('detects command intent', async () => {
      const mockResponse: DetectIntentResult = {
        intent: 'command',
        subtype: 'action',
        topic: 'account-deletion',
        confidence: 0.91,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Delete my account immediately', client);

      const result = await str.detectIntent();

      expect(result.intent).toBe('command');
    });

    test('handles missing optional fields', async () => {
      const mockResponse: DetectIntentResult = {
        intent: 'greeting',
        confidence: 0.99,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Hello!', client);

      const result = await str.detectIntent();

      expect(result.intent).toBe('greeting');
      expect(result.subtype).toBeUndefined();
      expect(result.topic).toBeUndefined();
    });
  });

  describe('detectLanguage()', () => {
    test('detects French', async () => {
      const mockResponse: DetectLanguageResult = {
        language: 'fr',
        confidence: 0.98,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Bonjour le monde', client);

      const result = await str.detectLanguage();

      expect(result).toEqual({ language: 'fr', confidence: 0.98 });
    });

    test('detects English', async () => {
      const mockResponse: DetectLanguageResult = {
        language: 'en',
        confidence: 0.99,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Hello world', client);

      const result = await str.detectLanguage();

      expect(result.language).toBe('en');
    });

    test('detects Spanish', async () => {
      const mockResponse: DetectLanguageResult = {
        language: 'es',
        confidence: 0.97,
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('Hola mundo', client);

      const result = await str.detectLanguage();

      expect(result.language).toBe('es');
    });
  });

  describe('containsSensitive()', () => {
    test('detects SSN', async () => {
      const mockResponse: ContainsSensitiveResult = {
        hasSensitive: true,
        types: ['ssn'],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('My SSN is 123-45-6789', client);

      const result = await str.containsSensitive();

      expect(result).toEqual({ hasSensitive: true, types: ['ssn'] });
    });

    test('detects multiple sensitive types', async () => {
      const mockResponse: ContainsSensitiveResult = {
        hasSensitive: true,
        types: ['email', 'phone', 'ssn'],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'Contact john@test.com at 555-1234, SSN: 123-45-6789',
        client
      );

      const result = await str.containsSensitive();

      expect(result.hasSensitive).toBe(true);
      expect(result.types).toContain('email');
      expect(result.types).toContain('phone');
      expect(result.types).toContain('ssn');
    });

    test('returns false for non-sensitive text', async () => {
      const mockResponse: ContainsSensitiveResult = {
        hasSensitive: false,
        types: [],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('The weather is nice today', client);

      const result = await str.containsSensitive();

      expect(result).toEqual({ hasSensitive: false, types: [] });
    });
  });

  describe('similarity()', () => {
    test('returns high similarity for synonyms', async () => {
      const mockResponse = { similarity: 0.85 };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('happy', client);

      const result = await str.similarity('joyful');

      expect(result).toBe(0.85);
    });

    test('returns low similarity for antonyms', async () => {
      const mockResponse = { similarity: 0.15 };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('happy', client);

      const result = await str.similarity('sad');

      expect(result).toBe(0.15);
    });

    test('returns high similarity for identical meaning', async () => {
      const mockResponse = { similarity: 0.98 };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('The car is red', client);

      const result = await str.similarity('The automobile is red');

      expect(result).toBeGreaterThan(0.9);
    });

    test('accepts SemanticString as argument', async () => {
      const mockResponse = { similarity: 0.8 };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str1 = SemanticString.from('hello', client);
      const str2 = SemanticString.from('hi', client);

      const result = await str1.similarity(str2);

      expect(result).toBe(0.8);
    });
  });

  describe('summarize()', () => {
    test('summarizes to target length', async () => {
      const mockResponse = { summary: 'A pangram about a fox and dog.' };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'The quick brown fox jumps over the lazy dog. This is a common pangram used for testing.',
        client
      );

      const result = await str.summarize(50);

      expect(result).toBe('A pangram about a fox and dog.');
      expect(result.length).toBeLessThanOrEqual(50);
    });

    test('preserves key information', async () => {
      const mockResponse = {
        summary: 'Meeting scheduled for Tuesday at 3pm.',
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'We are planning to have our quarterly meeting on Tuesday at 3pm in conference room B. Please make sure to bring your reports.',
        client
      );

      const result = await str.summarize(60);

      expect(result).toContain('Tuesday');
      expect(result).toContain('3pm');
    });

    test('passes maxLength to prompt', async () => {
      const mockResponse = { summary: 'Short.' };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('A long text that needs shortening', client);

      await str.summarize(100);

      const callArgs = getFirstCallArgs(client.complete);
      expect(callArgs.prompt).toContain('100');
    });
  });

  describe('suggestCorrections()', () => {
    test('suggests spelling corrections', async () => {
      const mockResponse = {
        corrections: [
          { original: 'tommorow', suggestion: 'tomorrow', reason: 'spelling' },
        ],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('See you tommorow', client);

      const result = await str.suggestCorrections();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        original: 'tommorow',
        suggestion: 'tomorrow',
        reason: 'spelling',
      });
    });

    test('suggests grammar corrections', async () => {
      const mockResponse: { corrections: Correction[] } = {
        corrections: [
          {
            original: 'Their',
            suggestion: "They're",
            reason: 'word confusion: their vs they\'re',
          },
          {
            original: 'tommorow',
            suggestion: 'tomorrow',
            reason: 'spelling error',
          },
        ],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'Their going to the store tommorow',
        client
      );

      const result = await str.suggestCorrections();

      expect(result).toHaveLength(2);
      const firstCorrection = result[0];
      expect(firstCorrection).toBeDefined();
      expect(firstCorrection?.original).toBe('Their');
      expect(firstCorrection?.suggestion).toBe("They're");
    });

    test('returns empty array for correct text', async () => {
      const mockResponse = { corrections: [] };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from(
        'This sentence is grammatically correct.',
        client
      );

      const result = await str.suggestCorrections();

      expect(result).toEqual([]);
    });

    test('handles optional reason field', async () => {
      const mockResponse = {
        corrections: [{ original: 'teh', suggestion: 'the' }],
      };
      const client = createMockClient(JSON.stringify(mockResponse));
      const str = SemanticString.from('teh cat', client);

      const result = await str.suggestCorrections();

      const firstCorrection = result[0];
      expect(firstCorrection).toBeDefined();
      expect(firstCorrection?.original).toBe('teh');
      expect(firstCorrection?.suggestion).toBe('the');
      expect(firstCorrection?.reason).toBeUndefined();
    });
  });
});

describe('SemanticString prompts', () => {
  test('prompts request JSON output', async () => {
    const mockResponse = { equivalent: true, confidence: 0.9 };
    const client = createMockClient(JSON.stringify(mockResponse));
    const str = SemanticString.from('test', client);

    await str.semanticallyEquals('test');

    const callArgs = getFirstCallArgs(client.complete);
    expect(callArgs.prompt).toContain('JSON');
  });

  test('prompts use low temperature for consistency', async () => {
    const mockResponse = { equivalent: true, confidence: 0.9 };
    const client = createMockClient(JSON.stringify(mockResponse));
    const str = SemanticString.from('test', client);

    await str.semanticallyEquals('test');

    const callArgs = getFirstCallArgs(client.complete);
    expect(callArgs.temperature).toBeLessThanOrEqual(0.3);
  });
});
