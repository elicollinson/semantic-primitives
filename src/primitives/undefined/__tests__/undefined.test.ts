/**
 * Unit tests for SemanticUndefined
 */

import { describe, test, expect } from 'bun:test';
import { SemanticUndefined } from '../undefined.ts';
import {
  createMockLLMClient,
  mockEquivalentContextsResponse,
  mockNotEquivalentContextsResponse,
  mockSimilarContextsResponse,
  mockInferReasonNotInitializedResponse,
  mockInferReasonOptionalUnsetResponse,
  mockInferReasonPropertyMissingResponse,
  mockInferReasonUnknownResponse,
  mockSuggestInitArrayResponse,
  mockSuggestInitObjectResponse,
  mockSuggestInitNumberResponse,
  mockSuggestInitStringResponse,
  mockSuggestInitBooleanResponse,
  mockSuggestInitNullResponse,
  mockAcceptableOptionalResponse,
  mockNotAcceptableReturnResponse,
  mockNotAcceptableRequiredResponse,
  mockAcceptableDestructuringResponse,
  mockCompareRecommendNullResponse,
  mockCompareRecommendUndefinedResponse,
  mockCompareRecommendNullDbResponse,
  mockClassifyNotInitializedResponse,
  mockClassifyOptionalUnsetResponse,
  mockClassifyPropertyMissingResponse,
  mockClassifyVoidReturnResponse,
  mockClassifyUnknownResponse,
  mockExplainWithContextResponse,
  mockExplainWithoutContextResponse,
  mockExplainOptionalResponse,
  mockExplainMissingPropertyResponse,
} from './mocks.ts';

describe('SemanticUndefined', () => {
  describe('because', () => {
    test('creates SemanticUndefined with context', () => {
      const su = SemanticUndefined.because('property not yet initialized');
      expect(su.getContext()).toBe('property not yet initialized');
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      expect(su.valueOf()).toBeUndefined();
      expect(su.isUndefined()).toBe(true);
    });

    test('accepts custom LLM client', () => {
      const client = createMockLLMClient({});
      const su = SemanticUndefined.because('test context', client);
      expect(su.getContext()).toBe('test context');
    });
  });

  describe('create', () => {
    test('creates SemanticUndefined without context', () => {
      const su = SemanticUndefined.create();
      expect(su.getContext()).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      expect(su.valueOf()).toBeUndefined();
      expect(su.isUndefined()).toBe(true);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for similar contexts', async () => {
      const client = createMockLLMClient(mockEquivalentContextsResponse);
      const su1 = SemanticUndefined.because('not initialized', client);
      const su2 = SemanticUndefined.because('unset', client);
      const result = await su1.semanticallyEquals(su2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.9);
    });

    test('returns not equivalent for different contexts', async () => {
      const client = createMockLLMClient(mockNotEquivalentContextsResponse);
      const su1 = SemanticUndefined.because('optional parameter', client);
      const su2 = SemanticUndefined.because('void return', client);
      const result = await su1.semanticallyEquals(su2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.85);
    });

    test('returns equivalent with high confidence for undefined without contexts', async () => {
      const su1 = SemanticUndefined.create();
      const su2 = SemanticUndefined.create();
      const result = await su1.semanticallyEquals(su2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    test('returns not equivalent when only one has context', async () => {
      const su1 = SemanticUndefined.because('not initialized');
      const su2 = SemanticUndefined.create();
      const result = await su1.semanticallyEquals(su2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.7);
    });

    test('returns similar for semantically close contexts', async () => {
      const client = createMockLLMClient(mockSimilarContextsResponse);
      const su1 = SemanticUndefined.because('not provided', client);
      const su2 = SemanticUndefined.because('left empty', client);
      const result = await su1.semanticallyEquals(su2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.75);
    });
  });

  describe('inferReason', () => {
    test('infers not-initialized type for variables', async () => {
      const client = createMockLLMClient(mockInferReasonNotInitializedResponse);
      const result = await SemanticUndefined.inferReason(
        'userSettings',
        undefined,
        client
      );

      expect(result.reason).toBe('Variable declared but not assigned a value');
      expect(result.type).toBe('not-initialized');
    });

    test('infers optional-unset type for optional properties', async () => {
      const client = createMockLLMClient(mockInferReasonOptionalUnsetResponse);
      const result = await SemanticUndefined.inferReason(
        'user.profile.avatar',
        { user: { profile: {} } },
        client
      );

      expect(result.reason).toBe('Optional property not set');
      expect(result.type).toBe('optional-unset');
    });

    test('infers property-missing type for non-existent properties', async () => {
      const client = createMockLLMClient(mockInferReasonPropertyMissingResponse);
      const result = await SemanticUndefined.inferReason(
        'config.missingKey',
        { config: {} },
        client
      );

      expect(result.reason).toBe('Property does not exist on the object');
      expect(result.type).toBe('property-missing');
    });

    test('infers unknown type when context is unclear', async () => {
      const client = createMockLLMClient(mockInferReasonUnknownResponse);
      const result = await SemanticUndefined.inferReason(
        'unknownField',
        undefined,
        client
      );

      expect(result.reason).toBe(
        'Unable to determine why this value is undefined'
      );
      expect(result.type).toBe('unknown');
    });

    test('passes context to LLM', async () => {
      const client = createMockLLMClient(mockInferReasonOptionalUnsetResponse);
      const result = await SemanticUndefined.inferReason(
        'user.avatar',
        { user: { name: 'John', email: 'john@example.com' } },
        client
      );

      expect(result.reason).toBeDefined();
      expect(result.type).toBe('optional-unset');
    });
  });

  describe('suggestInitialization', () => {
    test('suggests empty array for array types', async () => {
      const client = createMockLLMClient(mockSuggestInitArrayResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'items',
        { type: 'array' },
        client
      );

      expect(result.value).toEqual([]);
      expect(result.explanation).toBe(
        'Arrays should be initialized empty, not undefined'
      );
    });

    test('suggests empty object for object types', async () => {
      const client = createMockLLMClient(mockSuggestInitObjectResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'config',
        { type: 'object' },
        client
      );

      expect(result.value).toEqual({});
      expect(result.explanation).toBe('Objects should be initialized empty');
    });

    test('suggests 0 for count/number fields', async () => {
      const client = createMockLLMClient(mockSuggestInitNumberResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'retryCount',
        { type: 'number' },
        client
      );

      expect(result.value).toBe(0);
      expect(result.explanation).toBe('Count should start at 0');
    });

    test('suggests empty string for optional text fields', async () => {
      const client = createMockLLMClient(mockSuggestInitStringResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'nickname',
        { type: 'string' },
        client
      );

      expect(result.value).toBe('');
      expect(result.explanation).toBe(
        'Empty string is appropriate for optional text fields'
      );
    });

    test('suggests boolean default', async () => {
      const client = createMockLLMClient(mockSuggestInitBooleanResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'isEnabled',
        { type: 'boolean' },
        client
      );

      expect(result.value).toBe(false);
      expect(result.explanation).toBe('Default to false for safety');
    });

    test('suggests null for sensitive fields', async () => {
      const client = createMockLLMClient(mockSuggestInitNullResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'apiToken',
        { type: 'string' },
        client
      );

      expect(result.value).toBe(null);
      expect(result.explanation).toBe(
        'Sensitive fields should not have a default; require explicit input'
      );
    });

    test('works without type hint', async () => {
      const client = createMockLLMClient(mockSuggestInitNumberResponse);
      const result = await SemanticUndefined.suggestInitialization(
        'count',
        undefined,
        client
      );

      expect(result.value).toBe(0);
    });
  });

  describe('isAcceptable', () => {
    test('returns acceptable for optional parameters', async () => {
      const client = createMockLLMClient(mockAcceptableOptionalResponse);
      const result = await SemanticUndefined.isAcceptable(
        'optional parameter',
        { paramName: 'options' },
        client
      );

      expect(result.acceptable).toBe(true);
      expect(result.reason).toBe(
        'Undefined is acceptable for optional parameters'
      );
    });

    test('returns not acceptable for function return value', async () => {
      const client = createMockLLMClient(mockNotAcceptableReturnResponse);
      const result = await SemanticUndefined.isAcceptable(
        'return value',
        { functionName: 'getUserById' },
        client
      );

      expect(result.acceptable).toBe(false);
      expect(result.reason).toBe(
        'Function should return null for not found, not undefined'
      );
    });

    test('returns not acceptable for required fields', async () => {
      const client = createMockLLMClient(mockNotAcceptableRequiredResponse);
      const result = await SemanticUndefined.isAcceptable(
        'required field',
        { fieldName: 'email', required: true },
        client
      );

      expect(result.acceptable).toBe(false);
      expect(result.reason).toBe(
        'This field is required and should not be undefined'
      );
    });

    test('returns acceptable for destructuring defaults', async () => {
      const client = createMockLLMClient(mockAcceptableDestructuringResponse);
      const result = await SemanticUndefined.isAcceptable(
        'destructured optional property',
        { pattern: '{ name, optional }' },
        client
      );

      expect(result.acceptable).toBe(true);
      expect(result.reason).toBe(
        'Undefined is expected when destructuring optional properties'
      );
    });

    test('works without details', async () => {
      const client = createMockLLMClient(mockAcceptableOptionalResponse);
      const result = await SemanticUndefined.isAcceptable(
        'optional field',
        undefined,
        client
      );

      expect(result.acceptable).toBe(true);
    });
  });

  describe('compareToNull', () => {
    test('recommends null for intentional absence', async () => {
      const client = createMockLLMClient(mockCompareRecommendNullResponse);
      const result = await SemanticUndefined.compareToNull(
        'user.deletedAt',
        client
      );

      expect(result.recommendation).toBe('null');
      expect(result.explanation).toBe(
        'Use null for intentional absence (not deleted), undefined implies uninitialized'
      );
    });

    test('recommends undefined for optional parameters', async () => {
      const client = createMockLLMClient(mockCompareRecommendUndefinedResponse);
      const result = await SemanticUndefined.compareToNull(
        'function optional parameter',
        client
      );

      expect(result.recommendation).toBe('undefined');
      expect(result.explanation).toBe(
        'Optional parameters should use undefined when not provided'
      );
    });

    test('recommends null for database fields', async () => {
      const client = createMockLLMClient(mockCompareRecommendNullDbResponse);
      const result = await SemanticUndefined.compareToNull(
        'database.user.middleName',
        client
      );

      expect(result.recommendation).toBe('null');
      expect(result.explanation).toBe(
        'Database fields should use null to represent no value'
      );
    });
  });

  describe('classify', () => {
    test('classifies as not-initialized when variable not assigned', async () => {
      const client = createMockLLMClient(mockClassifyNotInitializedResponse);
      const su = SemanticUndefined.because(
        'variable declared but never assigned',
        client
      );
      const result = await su.classify();

      expect(result.type).toBe('not-initialized');
      expect(result.canBeInitialized).toBe(true);
    });

    test('classifies as optional-unset when optional parameter not provided', async () => {
      const client = createMockLLMClient(mockClassifyOptionalUnsetResponse);
      const su = SemanticUndefined.because(
        'optional callback not provided',
        client
      );
      const result = await su.classify();

      expect(result.type).toBe('optional-unset');
      expect(result.canBeInitialized).toBe(true);
    });

    test('classifies as property-missing when property does not exist', async () => {
      const client = createMockLLMClient(mockClassifyPropertyMissingResponse);
      const su = SemanticUndefined.because(
        'accessing non-existent property',
        client
      );
      const result = await su.classify();

      expect(result.type).toBe('property-missing');
      expect(result.canBeInitialized).toBe(true);
    });

    test('classifies as void-return when function has no return', async () => {
      const client = createMockLLMClient(mockClassifyVoidReturnResponse);
      const su = SemanticUndefined.because(
        'function does not return a value',
        client
      );
      const result = await su.classify();

      expect(result.type).toBe('void-return');
      expect(result.canBeInitialized).toBe(false);
    });

    test('returns unknown when no context is provided', async () => {
      const su = SemanticUndefined.create();
      const result = await su.classify();

      expect(result.type).toBe('unknown');
      expect(result.canBeInitialized).toBe(true);
    });

    test('classifies unknown when context is unclear', async () => {
      const client = createMockLLMClient(mockClassifyUnknownResponse);
      const su = SemanticUndefined.because('data issue', client);
      const result = await su.classify();

      expect(result.type).toBe('unknown');
      expect(result.canBeInitialized).toBe(true);
    });
  });

  describe('explain', () => {
    test('generates explanation with context', async () => {
      const client = createMockLLMClient(mockExplainWithContextResponse);
      const su = SemanticUndefined.because('not in response', client);
      const result = await su.explain('user.nickname');

      expect(result).toBe(
        'The nickname property was not included in the API response'
      );
    });

    test('generates explanation without context', async () => {
      const client = createMockLLMClient(mockExplainWithoutContextResponse);
      const su = SemanticUndefined.create(client);
      const result = await su.explain('value');

      expect(result).toBe('This value has not been initialized');
    });

    test('generates explanation for optional property', async () => {
      const client = createMockLLMClient(mockExplainOptionalResponse);
      const su = SemanticUndefined.because('optional not set', client);
      const result = await su.explain('user.profile.avatar');

      expect(result).toBe(
        'The avatar property is optional and has not been set by the user'
      );
    });

    test('generates explanation for missing property', async () => {
      const client = createMockLLMClient(mockExplainMissingPropertyResponse);
      const su = SemanticUndefined.because('property does not exist', client);
      const result = await su.explain('config.unknownKey');

      expect(result).toBe('The property does not exist on this object');
    });
  });

  describe('getContext', () => {
    test('returns context when provided', () => {
      const su = SemanticUndefined.because('test context');
      expect(su.getContext()).toBe('test context');
    });

    test('returns undefined when no context', () => {
      const su = SemanticUndefined.create();
      expect(su.getContext()).toBe(undefined);
    });
  });

  describe('getReason', () => {
    test('returns reason (alias for getContext) when provided', () => {
      const su = SemanticUndefined.because('test reason');
      expect(su.getReason()).toBe('test reason');
    });

    test('returns undefined when no reason', () => {
      const su = SemanticUndefined.create();
      expect(su.getReason()).toBe(undefined);
    });
  });

  describe('isUndefined', () => {
    test('always returns true', () => {
      const suWithContext = SemanticUndefined.because('any context');
      const suWithoutContext = SemanticUndefined.create();

      expect(suWithContext.isUndefined()).toBe(true);
      expect(suWithoutContext.isUndefined()).toBe(true);
    });
  });

  describe('valueOf', () => {
    test('always returns undefined', () => {
      const suWithContext = SemanticUndefined.because('any context');
      const suWithoutContext = SemanticUndefined.create();

      /* eslint-disable @typescript-eslint/no-confusing-void-expression */
      expect(suWithContext.valueOf()).toBeUndefined();
      expect(suWithoutContext.valueOf()).toBeUndefined();
      /* eslint-enable @typescript-eslint/no-confusing-void-expression */
    });
  });

  describe('toString', () => {
    test('returns undefined with context in parentheses', () => {
      const su = SemanticUndefined.because('not initialized');
      expect(su.toString()).toBe('undefined (not initialized)');
    });

    test('returns plain undefined without context', () => {
      const su = SemanticUndefined.create();
      expect(su.toString()).toBe('undefined');
    });
  });

  describe('toJSON', () => {
    test('returns JSON with value and context', () => {
      const su = SemanticUndefined.because('not initialized');
      const json = su.toJSON();

      expect(json).toEqual({
        value: undefined,
        context: 'not initialized',
      });
    });

    test('returns JSON with only value when no context', () => {
      const su = SemanticUndefined.create();
      const json = su.toJSON();

      expect(json).toEqual({
        value: undefined,
      });
    });
  });
});

describe('SemanticUndefined prompts', () => {
  test('createSemanticallyEqualsPrompt includes both contexts', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt('not initialized', 'unset');

    expect(prompt).toContain('Context 1: "not initialized"');
    expect(prompt).toContain('Context 2: "unset"');
  });

  test('createInferReasonPrompt includes property path', async () => {
    const { createInferReasonPrompt } = await import('../prompts.ts');
    const prompt = createInferReasonPrompt('user.profile.avatar');

    expect(prompt).toContain('Property path: "user.profile.avatar"');
  });

  test('createInferReasonPrompt includes context when provided', async () => {
    const { createInferReasonPrompt } = await import('../prompts.ts');
    const prompt = createInferReasonPrompt('user.avatar', {
      user: { name: 'John' },
    });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('"name": "John"');
  });

  test('createSuggestInitializationPrompt includes property name and type hint', async () => {
    const { createSuggestInitializationPrompt } = await import('../prompts.ts');
    const prompt = createSuggestInitializationPrompt('items', { type: 'array' });

    expect(prompt).toContain('Property name: "items"');
    expect(prompt).toContain('"type":"array"');
  });

  test('createIsAcceptablePrompt includes context and details', async () => {
    const { createIsAcceptablePrompt } = await import('../prompts.ts');
    const prompt = createIsAcceptablePrompt('return value', {
      functionName: 'getUserById',
    });

    expect(prompt).toContain('Context: "return value"');
    expect(prompt).toContain('"functionName": "getUserById"');
  });

  test('createCompareToNullPrompt includes context', async () => {
    const { createCompareToNullPrompt } = await import('../prompts.ts');
    const prompt = createCompareToNullPrompt('user.deletedAt');

    expect(prompt).toContain('user.deletedAt');
  });

  test('createClassifyPrompt includes context', async () => {
    const { createClassifyPrompt } = await import('../prompts.ts');
    const prompt = createClassifyPrompt('variable declared but never assigned');

    expect(prompt).toContain(
      'Context: "variable declared but never assigned"'
    );
  });

  test('createExplainPrompt includes property path and context', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('user.nickname', 'not in response');

    expect(prompt).toContain('Property path: "user.nickname"');
    expect(prompt).toContain('Context: "not in response"');
  });
});
