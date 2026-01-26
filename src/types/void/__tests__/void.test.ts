/**
 * Unit tests for SemanticVoid
 */

import { describe, test, expect } from 'bun:test';
import { SemanticVoid } from '../void.ts';
import {
  createMockLLMClient,
  mockSideEffectsWithEffects,
  mockSideEffectsPure,
  mockShouldReturnTrue,
  mockShouldReturnFalse,
  mockExplainSendNotification,
  mockValidateUsageInappropriate,
  mockValidateUsageAppropriate,
  mockErrorHandlingMissing,
  mockErrorHandlingPresent,
  mockSuggestSignatureAsync,
  mockAppropriatePatterns,
  mockIsAppropriateForVoid,
  mockIsNotAppropriateForVoid,
} from './mocks.ts';

describe('SemanticVoid', () => {
  describe('analyzeSideEffects', () => {
    test('identifies side effects', async () => {
      const client = createMockLLMClient(mockSideEffectsWithEffects);
       
      const fn = function saveToDatabase(_data: unknown) {
        // Database write
      };
      const result = await SemanticVoid.analyzeSideEffects(fn, client);

      expect(result.hasSideEffects).toBe(true);
      expect(result.effects).toContain('database write');
      expect(result.pure).toBe(false);
    });

    test('identifies pure function', async () => {
      const client = createMockLLMClient(mockSideEffectsPure);
      const fn = function pureCalc() {
        return;
      };
      const result = await SemanticVoid.analyzeSideEffects(fn, client);

      expect(result.hasSideEffects).toBe(false);
      expect(result.pure).toBe(true);
    });
  });

  describe('shouldReturnValue', () => {
    test('suggests return type for processing function', async () => {
      const client = createMockLLMClient(mockShouldReturnTrue);
       
      const fn = function processData(_data: unknown) {
        // Process data
      };
      const result = await SemanticVoid.shouldReturnValue(fn, 'data processing function', client);

      expect(result.shouldReturn).toBe(true);
      expect(result.suggestedType).toBe('ProcessedData');
    });

    test('confirms void for logging function', async () => {
      const client = createMockLLMClient(mockShouldReturnFalse);
       
      const fn = function logMessage(_msg: string) {
        console.log(_msg);
      };
      const result = await SemanticVoid.shouldReturnValue(fn, undefined, client);

      expect(result.shouldReturn).toBe(false);
    });
  });

  describe('explain', () => {
    test('explains void function', async () => {
      const client = createMockLLMClient(mockExplainSendNotification);
      const fn = function sendNotification() {
        // Send notification
      };
      const result = await SemanticVoid.explain(fn, client);

      expect(result).toContain('notification');
      expect(result).toContain('Side effects');
    });
  });

  describe('validateUsage', () => {
    test('identifies inappropriate usage in map', async () => {
      const client = createMockLLMClient(mockValidateUsageInappropriate);
       
      const fn = function logError(_err: unknown) {
        console.error(_err);
      };
      const result = await SemanticVoid.validateUsage(fn, 'in array.map()', client);

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('map()');
      expect(result.suggestion).toContain('forEach');
    });

    test('validates appropriate usage as event handler', async () => {
      const client = createMockLLMClient(mockValidateUsageAppropriate);
      const fn = function onClick() {
        // Handle click
      };
      const result = await SemanticVoid.validateUsage(fn, 'as click handler', client);

      expect(result.appropriate).toBe(true);
    });
  });

  describe('checkErrorHandling', () => {
    test('identifies missing error handling', async () => {
      const client = createMockLLMClient(mockErrorHandlingMissing);
       
      const fn = function saveData(_data: unknown) {
        // Save without try-catch
      };
      const result = await SemanticVoid.checkErrorHandling(fn, client);

      expect(result.hasErrorHandling).toBe(false);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.recommendation).toBeDefined();
    });

    test('confirms present error handling', async () => {
      const client = createMockLLMClient(mockErrorHandlingPresent);
      const fn = function safeOperation() {
        try {
          // Safe
        } catch {
          // Handle
        }
      };
      const result = await SemanticVoid.checkErrorHandling(fn, client);

      expect(result.hasErrorHandling).toBe(true);
    });
  });

  describe('suggestSignature', () => {
    test('suggests async signature', async () => {
      const client = createMockLLMClient(mockSuggestSignatureAsync);
       
      const fn = function updateUser(_user: unknown) {
        // Async update
      };
      const result = await SemanticVoid.suggestSignature(fn, client);

      expect(result.suggested).toContain('Promise<void>');
      expect(result.reason.toLowerCase()).toContain('async');
    });
  });

  describe('appropriatePatterns', () => {
    test('returns list of patterns', async () => {
      const client = createMockLLMClient(mockAppropriatePatterns);
      const result = await SemanticVoid.appropriatePatterns(client);

      expect(result).toContain('event handlers');
      expect(result).toContain('logging');
    });
  });

  describe('isAppropriateFor', () => {
    test('confirms void for logging function', async () => {
      const client = createMockLLMClient(mockIsAppropriateForVoid);
      const result = await SemanticVoid.isAppropriateFor('logMessage', client);

      expect(result.appropriate).toBe(true);
    });

    test('rejects void for calculate function', async () => {
      const client = createMockLLMClient(mockIsNotAppropriateForVoid);
      const result = await SemanticVoid.isAppropriateFor('calculateTotal', client);

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('return a value');
    });
  });
});

describe('SemanticVoid prompts', () => {
  test('createAnalyzeSideEffectsPrompt includes function description', async () => {
    const { createAnalyzeSideEffectsPrompt } = await import('../prompts.ts');
    const prompt = createAnalyzeSideEffectsPrompt('saveToDatabase: saves data');

    expect(prompt).toContain('saveToDatabase');
    expect(prompt).toContain('side effects');
  });

  test('createValidateUsagePrompt includes usage context', async () => {
    const { createValidateUsagePrompt } = await import('../prompts.ts');
    const prompt = createValidateUsagePrompt('logError', 'in array.map()');

    expect(prompt).toContain('logError');
    expect(prompt).toContain('array.map()');
  });

  test('createIsAppropriateForPrompt includes function name', async () => {
    const { createIsAppropriateForPrompt } = await import('../prompts.ts');
    const prompt = createIsAppropriateForPrompt('calculateTotal');

    expect(prompt).toContain('calculateTotal');
  });
});
