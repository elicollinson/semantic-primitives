/**
 * Unit tests for SemanticBoolean
 */

import { describe, test, expect } from 'bun:test';
import { SemanticBoolean } from '../boolean.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockFromAffirmativeResponse,
  mockFromNegativeResponse,
  mockFromUncertainResponse,
  mockFromConditionalResponse,
  mockFromConditionalNoParsedConditionsResponse,
  mockImplicationPositiveResponse,
  mockImplicationNegativeResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockCompareStrengthWeakerResponse,
  mockCompareStrengthStrongerResponse,
  mockCompareStrengthEqualResponse,
  mockExtractConditionsResponse,
} from './mocks.ts';

describe('SemanticBoolean', () => {
  describe('fromBoolean', () => {
    test('creates SemanticBoolean from true', () => {
      const sb = SemanticBoolean.fromBoolean(true);
      expect(sb.valueOf()).toBe(true);
      expect(sb.confidence()).toBe(1.0);
      expect(sb.isAffirmative()).toBe(true);
      expect(sb.isNegative()).toBe(false);
    });

    test('creates SemanticBoolean from false', () => {
      const sb = SemanticBoolean.fromBoolean(false);
      expect(sb.valueOf()).toBe(false);
      expect(sb.confidence()).toBe(1.0);
      expect(sb.isAffirmative()).toBe(false);
      expect(sb.isNegative()).toBe(true);
    });

    test('stores original expression as string value', () => {
      const sb = SemanticBoolean.fromBoolean(true);
      expect(sb.getOriginalExpression()).toBe('true');
    });
  });

  describe('from', () => {
    test('parses affirmative expression', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);

      expect(sb.valueOf()).toBe(true);
      expect(sb.confidence()).toBe(0.95);
      expect(sb.isAffirmative()).toBe(true);
      expect(sb.getOriginalExpression()).toBe('yes');
    });

    test('parses negative expression', async () => {
      const client = createMockLLMClient(mockFromNegativeResponse);
      const sb = await SemanticBoolean.from('nope', undefined, client);

      expect(sb.valueOf()).toBe(false);
      expect(sb.confidence()).toBe(0.92);
      expect(sb.isNegative()).toBe(true);
    });

    test('parses uncertain expression', async () => {
      const client = createMockLLMClient(mockFromUncertainResponse);
      const sb = await SemanticBoolean.from('maybe', undefined, client);

      expect(sb.isUncertain()).toBe(true);
      expect(sb.confidence()).toBe(0.55);
    });

    test('parses conditional expression', async () => {
      const client = createMockLLMClient(mockFromConditionalResponse);
      const sb = await SemanticBoolean.from(
        'yes, if you can deliver by Friday',
        undefined,
        client
      );

      expect(sb.valueOf()).toBe(true);
      expect(sb.isConditional()).toBe(true);
    });

    test('accepts locale option', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('hai', { locale: 'ja' }, client);

      expect(sb.valueOf()).toBe(true);
    });

    test('accepts context option', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from(
        'sure',
        { context: 'informal conversation' },
        client
      );

      expect(sb.valueOf()).toBe(true);
    });
  });

  describe('fromImplication', () => {
    test('infers true from positive statement', async () => {
      const client = createMockLLMClient(mockImplicationPositiveResponse);
      const sb = await SemanticBoolean.fromImplication('The test passed', client);

      expect(sb.valueOf()).toBe(true);
      expect(sb.confidence()).toBe(0.9);
    });

    test('infers false from negative statement', async () => {
      const client = createMockLLMClient(mockImplicationNegativeResponse);
      const sb = await SemanticBoolean.fromImplication(
        'We encountered errors',
        client
      );

      expect(sb.valueOf()).toBe(false);
      expect(sb.confidence()).toBe(0.85);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for synonymous expressions', async () => {
      const client = createSequentialMockLLMClient([
        mockFromAffirmativeResponse,
        mockFromAffirmativeResponse,
        mockEquivalentResponse,
      ]);

      const sb1 = await SemanticBoolean.from('yes', undefined, client);
      const sb2 = await SemanticBoolean.from('absolutely', undefined, client);
      const result = await sb1.semanticallyEquals(sb2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    test('returns not equivalent for opposite expressions', async () => {
      const client = createSequentialMockLLMClient([
        mockFromAffirmativeResponse,
        mockFromNegativeResponse,
        mockNotEquivalentResponse,
      ]);

      const sb1 = await SemanticBoolean.from('yes', undefined, client);
      const sb2 = await SemanticBoolean.from('no', undefined, client);
      const result = await sb1.semanticallyEquals(sb2);

      expect(result.equivalent).toBe(false);
    });
  });

  describe('compareStrength', () => {
    test('returns negative when first is weaker', async () => {
      const client = createSequentialMockLLMClient([
        mockFromUncertainResponse,
        mockFromAffirmativeResponse,
        mockCompareStrengthWeakerResponse,
      ]);

      const weak = await SemanticBoolean.from('I guess so', undefined, client);
      const strong = await SemanticBoolean.from('Absolutely!', undefined, client);
      const result = await weak.compareStrength(strong);

      expect(result).toBe(-0.6);
    });

    test('returns positive when first is stronger', async () => {
      const client = createSequentialMockLLMClient([
        mockFromAffirmativeResponse,
        mockFromUncertainResponse,
        mockCompareStrengthStrongerResponse,
      ]);

      const strong = await SemanticBoolean.from('Definitely!', undefined, client);
      const weak = await SemanticBoolean.from('maybe', undefined, client);
      const result = await strong.compareStrength(weak);

      expect(result).toBe(0.7);
    });

    test('returns zero when equal strength', async () => {
      const client = createSequentialMockLLMClient([
        mockFromAffirmativeResponse,
        mockFromAffirmativeResponse,
        mockCompareStrengthEqualResponse,
      ]);

      const sb1 = await SemanticBoolean.from('yes', undefined, client);
      const sb2 = await SemanticBoolean.from('sure', undefined, client);
      const result = await sb1.compareStrength(sb2);

      expect(result).toBe(0);
    });
  });

  describe('isAffirmative', () => {
    test('returns true for affirmative category', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);
      expect(sb.isAffirmative()).toBe(true);
    });

    test('returns false for negative category', async () => {
      const client = createMockLLMClient(mockFromNegativeResponse);
      const sb = await SemanticBoolean.from('no', undefined, client);
      expect(sb.isAffirmative()).toBe(false);
    });
  });

  describe('isNegative', () => {
    test('returns true for negative category', async () => {
      const client = createMockLLMClient(mockFromNegativeResponse);
      const sb = await SemanticBoolean.from('no', undefined, client);
      expect(sb.isNegative()).toBe(true);
    });

    test('returns false for affirmative category', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);
      expect(sb.isNegative()).toBe(false);
    });
  });

  describe('isUncertain', () => {
    test('returns true for uncertain category', async () => {
      const client = createMockLLMClient(mockFromUncertainResponse);
      const sb = await SemanticBoolean.from('maybe', undefined, client);
      expect(sb.isUncertain()).toBe(true);
    });

    test('returns false for certain categories', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);
      expect(sb.isUncertain()).toBe(false);
    });
  });

  describe('isConditional', () => {
    test('returns true for conditional category', async () => {
      const client = createMockLLMClient(mockFromConditionalResponse);
      const sb = await SemanticBoolean.from(
        'yes, if you can deliver by Friday',
        undefined,
        client
      );
      expect(sb.isConditional()).toBe(true);
    });

    test('returns false for non-conditional categories', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);
      expect(sb.isConditional()).toBe(false);
    });
  });

  describe('extractConditions', () => {
    test('returns conditions from conditional expression via LLM', async () => {
      const client = createSequentialMockLLMClient([
        mockFromConditionalNoParsedConditionsResponse,
        mockExtractConditionsResponse,
      ]);

      const sb = await SemanticBoolean.from(
        'yes, if you can deliver by Friday and the price is reasonable',
        undefined,
        client
      );

      const conditions = await sb.extractConditions();
      expect(conditions).toEqual(['deliver by Friday', 'price is reasonable']);
    });

    test('returns pre-parsed conditions if available', async () => {
      const client = createMockLLMClient(mockFromConditionalResponse);

      const sb = await SemanticBoolean.from(
        'yes, if you can deliver by Friday',
        undefined,
        client
      );

      const conditions = await sb.extractConditions();
      expect(conditions).toEqual(['deliver by Friday']);
    });

    test('returns empty array for non-conditional expressions', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);

      const conditions = await sb.extractConditions();
      expect(conditions).toEqual([]);
    });
  });

  describe('valueOf', () => {
    test('returns the boolean value', async () => {
      const trueClient = createMockLLMClient(mockFromAffirmativeResponse);
      const sbTrue = await SemanticBoolean.from('yes', undefined, trueClient);
      expect(sbTrue.valueOf()).toBe(true);

      const falseClient = createMockLLMClient(mockFromNegativeResponse);
      const sbFalse = await SemanticBoolean.from('no', undefined, falseClient);
      expect(sbFalse.valueOf()).toBe(false);
    });
  });

  describe('confidence', () => {
    test('returns the confidence score', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);
      expect(sb.confidence()).toBe(0.95);
    });
  });

  describe('getOriginalExpression', () => {
    test('returns the original input expression', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('absolutely', undefined, client);
      expect(sb.getOriginalExpression()).toBe('absolutely');
    });
  });

  describe('getCategory', () => {
    test('returns the correct category', async () => {
      const affirmativeClient = createMockLLMClient(mockFromAffirmativeResponse);
      const sbAff = await SemanticBoolean.from('yes', undefined, affirmativeClient);
      expect(sbAff.getCategory()).toBe('affirmative');

      const negativeClient = createMockLLMClient(mockFromNegativeResponse);
      const sbNeg = await SemanticBoolean.from('no', undefined, negativeClient);
      expect(sbNeg.getCategory()).toBe('negative');

      const uncertainClient = createMockLLMClient(mockFromUncertainResponse);
      const sbUnc = await SemanticBoolean.from('maybe', undefined, uncertainClient);
      expect(sbUnc.getCategory()).toBe('uncertain');

      const conditionalClient = createMockLLMClient(mockFromConditionalResponse);
      const sbCond = await SemanticBoolean.from('if...', undefined, conditionalClient);
      expect(sbCond.getCategory()).toBe('conditional');
    });
  });

  describe('toString', () => {
    test('returns string representation of the value', () => {
      const sbTrue = SemanticBoolean.fromBoolean(true);
      expect(sbTrue.toString()).toBe('true');

      const sbFalse = SemanticBoolean.fromBoolean(false);
      expect(sbFalse.toString()).toBe('false');
    });
  });

  describe('toJSON', () => {
    test('returns JSON representation', async () => {
      const client = createMockLLMClient(mockFromAffirmativeResponse);
      const sb = await SemanticBoolean.from('yes', undefined, client);

      const json = sb.toJSON();
      expect(json).toEqual({
        value: true,
        confidence: 0.95,
        category: 'affirmative',
      });
    });
  });
});

describe('SemanticBoolean prompts', () => {
  test('createFromPrompt includes locale', async () => {
    const { createFromPrompt } = await import('../prompts.ts');
    const prompt = createFromPrompt('oui', 'fr');
    expect(prompt).toContain('Locale: fr');
  });

  test('createFromPrompt includes context', async () => {
    const { createFromPrompt } = await import('../prompts.ts');
    const prompt = createFromPrompt('sure', undefined, 'business meeting');
    expect(prompt).toContain('Context: business meeting');
  });

  test('createFromPrompt includes input expression', async () => {
    const { createFromPrompt } = await import('../prompts.ts');
    const prompt = createFromPrompt('absolutely');
    expect(prompt).toContain('Expression: "absolutely"');
  });

  test('createFromImplicationPrompt includes statement', async () => {
    const { createFromImplicationPrompt } = await import('../prompts.ts');
    const prompt = createFromImplicationPrompt('The test passed');
    expect(prompt).toContain('Statement: "The test passed"');
  });
});
