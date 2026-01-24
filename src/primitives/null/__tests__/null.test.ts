/**
 * Unit tests for SemanticNull
 */

import { describe, test, expect } from 'bun:test';
import { SemanticNull } from '../null.ts';
import {
  createMockLLMClient,
  mockEquivalentReasonsResponse,
  mockNotEquivalentReasonsResponse,
  mockSimilarReasonsResponse,
  mockInferReasonNotSetResponse,
  mockInferReasonNotApplicableResponse,
  mockInferReasonUnknownResponse,
  mockSuggestDefaultNullResponse,
  mockSuggestDefaultNumberResponse,
  mockSuggestDefaultStringResponse,
  mockSuggestDefaultBooleanResponse,
  mockNotAppropriateRequiredResponse,
  mockAppropriateOptionalResponse,
  mockAppropriateContextualResponse,
  mockClassifyNotSetResponse,
  mockClassifyNotApplicableResponse,
  mockClassifyUnknownResponse,
  mockExplainWithReasonResponse,
  mockExplainWithoutReasonResponse,
  mockExplainNotApplicableResponse,
} from './mocks.ts';

describe('SemanticNull', () => {
  describe('because', () => {
    test('creates SemanticNull with reason', () => {
      const sn = SemanticNull.because('user has not set a phone number');
      expect(sn.getReason()).toBe('user has not set a phone number');
      expect(sn.valueOf()).toBe(null);
      expect(sn.isNull()).toBe(true);
    });

    test('accepts custom LLM client', () => {
      const client = createMockLLMClient({});
      const sn = SemanticNull.because('test reason', client);
      expect(sn.getReason()).toBe('test reason');
    });
  });

  describe('create', () => {
    test('creates SemanticNull without reason', () => {
      const sn = SemanticNull.create();
      expect(sn.getReason()).toBe(undefined);
      expect(sn.valueOf()).toBe(null);
      expect(sn.isNull()).toBe(true);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for identical reasons', async () => {
      const client = createMockLLMClient(mockEquivalentReasonsResponse);
      const sn1 = SemanticNull.because('not set', client);
      const sn2 = SemanticNull.because('empty', client);
      const result = await sn1.semanticallyEquals(sn2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.85);
    });

    test('returns not equivalent for different reasons', async () => {
      const client = createMockLLMClient(mockNotEquivalentReasonsResponse);
      const sn1 = SemanticNull.because('user skipped', client);
      const sn2 = SemanticNull.because('field not applicable', client);
      const result = await sn1.semanticallyEquals(sn2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.9);
    });

    test('returns equivalent with high confidence for nulls without reasons', async () => {
      const sn1 = SemanticNull.create();
      const sn2 = SemanticNull.create();
      const result = await sn1.semanticallyEquals(sn2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('returns not equivalent when only one has reason', async () => {
      const sn1 = SemanticNull.because('user skipped');
      const sn2 = SemanticNull.create();
      const result = await sn1.semanticallyEquals(sn2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.7);
    });

    test('returns similar for semantically close reasons', async () => {
      const client = createMockLLMClient(mockSimilarReasonsResponse);
      const sn1 = SemanticNull.because('not provided', client);
      const sn2 = SemanticNull.because('left blank', client);
      const result = await sn1.semanticallyEquals(sn2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.75);
    });
  });

  describe('inferReason', () => {
    test('infers not-set type for optional fields', async () => {
      const client = createMockLLMClient(mockInferReasonNotSetResponse);
      const result = await SemanticNull.inferReason('middleName', undefined, client);

      expect(result.reason).toBe('User has not provided this value yet');
      expect(result.type).toBe('not-set');
    });

    test('infers not-applicable type based on context', async () => {
      const client = createMockLLMClient(mockInferReasonNotApplicableResponse);
      const result = await SemanticNull.inferReason(
        'deletedAt',
        { status: 'active' },
        client
      );

      expect(result.reason).toBe('Record has not been deleted');
      expect(result.type).toBe('not-applicable');
    });

    test('infers unknown type when context is unclear', async () => {
      const client = createMockLLMClient(mockInferReasonUnknownResponse);
      const result = await SemanticNull.inferReason('customField', undefined, client);

      expect(result.reason).toBe('Unable to determine why this field is null');
      expect(result.type).toBe('unknown');
    });

    test('passes context to LLM', async () => {
      const client = createMockLLMClient(mockInferReasonNotApplicableResponse);
      const result = await SemanticNull.inferReason(
        'deletedAt',
        { status: 'active', createdAt: '2024-01-01' },
        client
      );

      // Verify LLM was called by checking we got a valid result
      expect(result.reason).toBeDefined();
      expect(result.type).toBe('not-applicable');
    });
  });

  describe('suggestDefault', () => {
    test('suggests null for sensitive fields', async () => {
      const client = createMockLLMClient(mockSuggestDefaultNullResponse);
      const result = await SemanticNull.suggestDefault(
        'phoneNumber',
        { type: 'string', format: 'phone' },
        client
      );

      expect(result.default).toBe(null);
      expect(result.explanation).toBe('Phone numbers should not have a default; require user input');
    });

    test('suggests 0 for count fields', async () => {
      const client = createMockLLMClient(mockSuggestDefaultNumberResponse);
      const result = await SemanticNull.suggestDefault(
        'retryCount',
        { type: 'number' },
        client
      );

      expect(result.default).toBe(0);
      expect(result.explanation).toBe('Retry count should start at 0');
    });

    test('suggests empty string for optional text fields', async () => {
      const client = createMockLLMClient(mockSuggestDefaultStringResponse);
      const result = await SemanticNull.suggestDefault(
        'bio',
        { type: 'string' },
        client
      );

      expect(result.default).toBe('');
      expect(result.explanation).toBe('Empty string is appropriate for optional text fields');
    });

    test('suggests boolean default', async () => {
      const client = createMockLLMClient(mockSuggestDefaultBooleanResponse);
      const result = await SemanticNull.suggestDefault(
        'isEnabled',
        { type: 'boolean' },
        client
      );

      expect(result.default).toBe(false);
      expect(result.explanation).toBe('Disabled by default for security');
    });

    test('works without schema', async () => {
      const client = createMockLLMClient(mockSuggestDefaultNumberResponse);
      const result = await SemanticNull.suggestDefault('count', undefined, client);

      expect(result.default).toBe(0);
    });
  });

  describe('isAppropriate', () => {
    test('returns not appropriate for required fields', async () => {
      const client = createMockLLMClient(mockNotAppropriateRequiredResponse);
      const result = await SemanticNull.isAppropriate(
        'email',
        { required: true },
        client
      );

      expect(result.appropriate).toBe(false);
      expect(result.reason).toBe('Email is a required field');
    });

    test('returns appropriate for optional fields', async () => {
      const client = createMockLLMClient(mockAppropriateOptionalResponse);
      const result = await SemanticNull.isAppropriate(
        'middleName',
        { required: false },
        client
      );

      expect(result.appropriate).toBe(true);
      expect(result.reason).toBe('Middle name is optional and can be null');
    });

    test('considers context for appropriateness', async () => {
      const client = createMockLLMClient(mockAppropriateContextualResponse);
      const result = await SemanticNull.isAppropriate(
        'deactivatedAt',
        { schema: { type: 'date', nullable: true } },
        client
      );

      expect(result.appropriate).toBe(true);
      expect(result.reason).toBe('This field only applies when status is active');
    });

    test('works without context', async () => {
      const client = createMockLLMClient(mockAppropriateOptionalResponse);
      const result = await SemanticNull.isAppropriate('optionalField', undefined, client);

      expect(result.appropriate).toBe(true);
    });
  });

  describe('classify', () => {
    test('classifies as not-set when value can be provided', async () => {
      const client = createMockLLMClient(mockClassifyNotSetResponse);
      const sn = SemanticNull.because('user has not entered a value', client);
      const result = await sn.classify();

      expect(result.type).toBe('not-set');
      expect(result.canBeProvided).toBe(true);
    });

    test('classifies as not-applicable when value does not apply', async () => {
      const client = createMockLLMClient(mockClassifyNotApplicableResponse);
      const sn = SemanticNull.because('user is single, no spouse', client);
      const result = await sn.classify();

      expect(result.type).toBe('not-applicable');
      expect(result.canBeProvided).toBe(false);
    });

    test('returns unknown when no reason is provided', async () => {
      const sn = SemanticNull.create();
      const result = await sn.classify();

      expect(result.type).toBe('unknown');
      expect(result.canBeProvided).toBe(true);
    });

    test('classifies unknown when reason is unclear', async () => {
      const client = createMockLLMClient(mockClassifyUnknownResponse);
      const sn = SemanticNull.because('data issue', client);
      const result = await sn.classify();

      expect(result.type).toBe('unknown');
      expect(result.canBeProvided).toBe(true);
    });
  });

  describe('explain', () => {
    test('generates explanation with reason', async () => {
      const client = createMockLLMClient(mockExplainWithReasonResponse);
      const sn = SemanticNull.because('user skipped', client);
      const result = await sn.explain('middleName');

      expect(result).toBe('Middle name was not provided by the user');
    });

    test('generates explanation without reason', async () => {
      const client = createMockLLMClient(mockExplainWithoutReasonResponse);
      const sn = SemanticNull.create(client);
      const result = await sn.explain('phoneNumber');

      expect(result).toBe('The phone number field has not been set');
    });

    test('generates explanation for not-applicable case', async () => {
      const client = createMockLLMClient(mockExplainNotApplicableResponse);
      const sn = SemanticNull.because('user is single', client);
      const result = await sn.explain('spouseName');

      expect(result).toBe('Spouse name does not apply to single individuals');
    });
  });

  describe('getReason', () => {
    test('returns reason when provided', () => {
      const sn = SemanticNull.because('test reason');
      expect(sn.getReason()).toBe('test reason');
    });

    test('returns undefined when no reason', () => {
      const sn = SemanticNull.create();
      expect(sn.getReason()).toBe(undefined);
    });
  });

  describe('isNull', () => {
    test('always returns true', () => {
      const snWithReason = SemanticNull.because('any reason');
      const snWithoutReason = SemanticNull.create();

      expect(snWithReason.isNull()).toBe(true);
      expect(snWithoutReason.isNull()).toBe(true);
    });
  });

  describe('valueOf', () => {
    test('always returns null', () => {
      const snWithReason = SemanticNull.because('any reason');
      const snWithoutReason = SemanticNull.create();

      expect(snWithReason.valueOf()).toBe(null);
      expect(snWithoutReason.valueOf()).toBe(null);
    });
  });

  describe('toString', () => {
    test('returns null with reason in parentheses', () => {
      const sn = SemanticNull.because('user skipped');
      expect(sn.toString()).toBe('null (user skipped)');
    });

    test('returns plain null without reason', () => {
      const sn = SemanticNull.create();
      expect(sn.toString()).toBe('null');
    });
  });

  describe('toJSON', () => {
    test('returns JSON with value and reason', () => {
      const sn = SemanticNull.because('user skipped');
      const json = sn.toJSON();

      expect(json).toEqual({
        value: null,
        reason: 'user skipped',
      });
    });

    test('returns JSON with only value when no reason', () => {
      const sn = SemanticNull.create();
      const json = sn.toJSON();

      expect(json).toEqual({
        value: null,
      });
    });
  });
});

describe('SemanticNull prompts', () => {
  test('createSemanticallyEqualsPrompt includes both reasons', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt('not set', 'empty');

    expect(prompt).toContain('Reason 1: "not set"');
    expect(prompt).toContain('Reason 2: "empty"');
  });

  test('createInferReasonPrompt includes field name', async () => {
    const { createInferReasonPrompt } = await import('../prompts.ts');
    const prompt = createInferReasonPrompt('deletedAt');

    expect(prompt).toContain('Field name: "deletedAt"');
  });

  test('createInferReasonPrompt includes context when provided', async () => {
    const { createInferReasonPrompt } = await import('../prompts.ts');
    const prompt = createInferReasonPrompt('deletedAt', { status: 'active' });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('"status": "active"');
  });

  test('createSuggestDefaultPrompt includes field name and schema', async () => {
    const { createSuggestDefaultPrompt } = await import('../prompts.ts');
    const prompt = createSuggestDefaultPrompt('retryCount', { type: 'number' });

    expect(prompt).toContain('Field name: "retryCount"');
    expect(prompt).toContain('"type":"number"');
  });

  test('createIsAppropriatePrompt includes required flag', async () => {
    const { createIsAppropriatePrompt } = await import('../prompts.ts');
    const prompt = createIsAppropriatePrompt('email', { required: true });

    expect(prompt).toContain('Field name: "email"');
    expect(prompt).toContain('Required: true');
  });

  test('createClassifyPrompt includes reason', async () => {
    const { createClassifyPrompt } = await import('../prompts.ts');
    const prompt = createClassifyPrompt('user has not entered a value');

    expect(prompt).toContain('Reason: "user has not entered a value"');
  });

  test('createExplainPrompt includes field name and reason', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('middleName', 'user skipped');

    expect(prompt).toContain('Field name: "middleName"');
    expect(prompt).toContain('Reason context: "user skipped"');
  });
});
