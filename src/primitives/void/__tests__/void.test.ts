/**
 * Unit tests for SemanticVoid
 */

import { describe, test, expect } from 'bun:test';
import { SemanticVoid } from '../void.ts';
import {
  createMockLLMClient,
  mockHasSideEffectsResponse,
  mockPureFunctionResponse,
  mockConsoleLoggingResponse,
  mockDomManipulationResponse,
  mockShouldReturnResponse,
  mockShouldNotReturnResponse,
  mockShouldReturnStatusResponse,
  mockExplainSideEffectResponse,
  mockExplainEventHandlerResponse,
  mockExplainLoggingResponse,
  mockInappropriateMapUsageResponse,
  mockAppropriateForEachUsageResponse,
  mockAppropriateEventHandlerUsageResponse,
  mockInappropriatePromiseUsageResponse,
  mockNoErrorHandlingResponse,
  mockHasErrorHandlingResponse,
  mockPartialErrorHandlingResponse,
  mockSuggestPromiseSignatureResponse,
  mockSuggestNoChangeResponse,
  mockSuggestReturnTypeResponse,
  mockNotAppropriateCalculateResponse,
  mockAppropriateLogResponse,
  mockAppropriateHandleResponse,
  mockNotAppropriateGetResponse,
  mockAppropriateSetResponse,
} from './mocks.ts';

describe('SemanticVoid', () => {
  describe('analyzeSideEffects', () => {
    test('detects side effects in database operations', async () => {
      const client = createMockLLMClient(mockHasSideEffectsResponse);
      function saveToDatabase(data: unknown) {
        console.log('Saving:', data);
      }
      const result = await SemanticVoid.analyzeSideEffects(saveToDatabase, client);

      expect(result.hasSideEffects).toBe(true);
      expect(result.effects).toContain('database write');
      expect(result.effects).toContain('logging');
      expect(result.pure).toBe(false);
    });

    test('identifies pure functions', async () => {
      const client = createMockLLMClient(mockPureFunctionResponse);
      function noOp() {
        // Does nothing
      }
      const result = await SemanticVoid.analyzeSideEffects(noOp, client);

      expect(result.hasSideEffects).toBe(false);
      expect(result.effects).toEqual([]);
      expect(result.pure).toBe(true);
    });

    test('detects console logging as side effect', async () => {
      const client = createMockLLMClient(mockConsoleLoggingResponse);
      function logMessage(msg: string) {
        console.log(msg);
      }
      const result = await SemanticVoid.analyzeSideEffects(logMessage, client);

      expect(result.hasSideEffects).toBe(true);
      expect(result.effects).toContain('console output');
      expect(result.pure).toBe(false);
    });

    test('detects DOM manipulation as side effect', async () => {
      const client = createMockLLMClient(mockDomManipulationResponse);
      function updateElement(id: string, value: string) {
        const el = { id, value };
        el.value = value;
      }
      const result = await SemanticVoid.analyzeSideEffects(updateElement, client);

      expect(result.hasSideEffects).toBe(true);
      expect(result.effects).toContain('DOM manipulation');
      expect(result.pure).toBe(false);
    });
  });

  describe('shouldReturnValue', () => {
    test('recommends returning value for processing functions', async () => {
      const client = createMockLLMClient(mockShouldReturnResponse);
      function processData(data: unknown) {
        // Process the data
        const processed = data;
        console.log(processed);
      }
      const result = await SemanticVoid.shouldReturnValue(
        processData,
        'data processing function',
        client
      );

      expect(result.shouldReturn).toBe(true);
      expect(result.reason).toContain('Processing functions');
      expect(result.suggestedType).toBe('ProcessedData');
    });

    test('recommends not returning for pure side-effect handlers', async () => {
      const client = createMockLLMClient(mockShouldNotReturnResponse);
      function sendNotification(msg: string) {
        console.log('Notification:', msg);
      }
      const result = await SemanticVoid.shouldReturnValue(sendNotification, undefined, client);

      expect(result.shouldReturn).toBe(false);
      expect(result.reason).toContain('side-effect');
    });

    test('recommends returning status for verification', async () => {
      const client = createMockLLMClient(mockShouldReturnStatusResponse);
      function saveData(data: unknown) {
        // Save operation
        console.log('Saved:', data);
      }
      const result = await SemanticVoid.shouldReturnValue(
        saveData,
        'persistence operation',
        client
      );

      expect(result.shouldReturn).toBe(true);
      expect(result.suggestedType).toBe('boolean');
    });

    test('works without context parameter', async () => {
      const client = createMockLLMClient(mockShouldNotReturnResponse);
      function logError(err: Error) {
        console.error(err);
      }
      const result = await SemanticVoid.shouldReturnValue(logError, undefined, client);

      expect(result.shouldReturn).toBe(false);
    });
  });

  describe('explain', () => {
    test('explains side-effect function', async () => {
      const client = createMockLLMClient(mockExplainSideEffectResponse);
      function sendNotification(userId: string, message: string) {
        console.log(`Sending to ${userId}: ${message}`);
      }
      const result = await SemanticVoid.explain(sendNotification, client);

      expect(result).toContain('notification');
      expect(result).toContain('Side effects');
    });

    test('explains event handler', async () => {
      const client = createMockLLMClient(mockExplainEventHandlerResponse);
      function handleClick(event: unknown) {
        console.log('Clicked:', event);
      }
      const result = await SemanticVoid.explain(handleClick, client);

      expect(result).toContain('click');
      expect(result).toContain('event');
    });

    test('explains logging function', async () => {
      const client = createMockLLMClient(mockExplainLoggingResponse);
      function logDebug(message: string) {
        console.log('[DEBUG]', message);
      }
      const result = await SemanticVoid.explain(logDebug, client);

      expect(result).toContain('Logs');
      expect(result).toContain('console');
    });
  });

  describe('validateUsage', () => {
    test('flags void function in map() as inappropriate', async () => {
      const client = createMockLLMClient(mockInappropriateMapUsageResponse);
      function logError(err: Error) {
        console.error(err);
      }
      const result = await SemanticVoid.validateUsage(logError, 'in array.map()', client);

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('map()');
      expect(result.suggestion).toContain('forEach');
    });

    test('approves void function in forEach()', async () => {
      const client = createMockLLMClient(mockAppropriateForEachUsageResponse);
      function logItem(item: unknown) {
        console.log(item);
      }
      const result = await SemanticVoid.validateUsage(logItem, 'in array.forEach()', client);

      expect(result.appropriate).toBe(true);
      expect(result.reason).toContain('forEach');
    });

    test('approves void function as event handler', async () => {
      const client = createMockLLMClient(mockAppropriateEventHandlerUsageResponse);
      function onClick(event: unknown) {
        console.log('Click:', event);
      }
      const result = await SemanticVoid.validateUsage(
        onClick,
        'as button click handler',
        client
      );

      expect(result.appropriate).toBe(true);
      expect(result.reason).toContain('Event handler');
    });

    test('flags void function in Promise.then() as inappropriate', async () => {
      const client = createMockLLMClient(mockInappropriatePromiseUsageResponse);
      function processResult(result: unknown) {
        console.log('Result:', result);
      }
      const result = await SemanticVoid.validateUsage(
        processResult,
        'in Promise.then()',
        client
      );

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('Promise');
    });
  });

  describe('checkErrorHandling', () => {
    test('detects missing error handling', async () => {
      const client = createMockLLMClient(mockNoErrorHandlingResponse);
      function saveData(data: unknown) {
        // No try-catch
        console.log('Saving:', data);
      }
      const result = await SemanticVoid.checkErrorHandling(saveData, client);

      expect(result.hasErrorHandling).toBe(false);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.recommendation).toContain('try-catch');
    });

    test('approves function with error handling', async () => {
      const client = createMockLLMClient(mockHasErrorHandlingResponse);
      function safeOperation() {
        try {
          console.log('Operation');
        } catch (e) {
          console.error(e);
        }
      }
      const result = await SemanticVoid.checkErrorHandling(safeOperation, client);

      expect(result.hasErrorHandling).toBe(true);
      expect(result.risks).toEqual([]);
    });

    test('identifies partial error handling', async () => {
      const client = createMockLLMClient(mockPartialErrorHandlingResponse);
      // Function that looks like it has partial error handling
      // Note: This function is analyzed via toString() by the LLM
      function partialHandler() {
        try {
          console.log('Main operation');
        } catch (e) {
          console.error(e);
        }
        // Comment: Fire-and-forget operation without error handling
        setTimeout(() => console.log('delayed operation'), 100);
      }
      const result = await SemanticVoid.checkErrorHandling(partialHandler, client);

      expect(result.hasErrorHandling).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
    });
  });

  describe('suggestSignature', () => {
    test('suggests Promise<void> for async operations', async () => {
      const client = createMockLLMClient(mockSuggestPromiseSignatureResponse);
      // Function that performs async-like operations
      // Note: This function is analyzed via toString() by the LLM
      function updateUser(user: unknown) {
        // Contains async operation pattern - db.save() would be async
        const db = { save: (data: unknown) => console.log('Saving:', data) };
        db.save(user);
        console.log('Updating:', user);
      }
      const result = await SemanticVoid.suggestSignature(updateUser, client);

      expect(result.current).toContain('void');
      expect(result.suggested).toContain('Promise<void>');
      expect(result.reason).toContain('Async');
    });

    test('suggests no change for appropriate signatures', async () => {
      const client = createMockLLMClient(mockSuggestNoChangeResponse);
      function logMessage(message: string) {
        console.log(message);
      }
      const result = await SemanticVoid.suggestSignature(logMessage, client);

      expect(result.current).toBe(result.suggested);
      expect(result.reason).toContain('appropriate');
    });

    test('suggests adding return type', async () => {
      const client = createMockLLMClient(mockSuggestReturnTypeResponse);
      function processData(data: unknown) {
        console.log('Processing:', data);
      }
      const result = await SemanticVoid.suggestSignature(processData, client);

      expect(result.current).toContain('void');
      expect(result.suggested).toContain('boolean');
      expect(result.reason).toContain('status');
    });
  });

  describe('appropriatePatterns', () => {
    test('returns list of appropriate void patterns', () => {
      const patterns = SemanticVoid.appropriatePatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns).toContain('event handlers');
      expect(patterns).toContain('cleanup functions');
      expect(patterns).toContain('logging and debugging');
    });

    test('includes common void use cases', () => {
      const patterns = SemanticVoid.appropriatePatterns();

      expect(patterns).toContain('side-effect-only callbacks');
      expect(patterns).toContain('initialization routines');
      expect(patterns).toContain('notification dispatchers');
    });

    test('returns consistent results', () => {
      const patterns1 = SemanticVoid.appropriatePatterns();
      const patterns2 = SemanticVoid.appropriatePatterns();

      expect(patterns1).toEqual(patterns2);
    });
  });

  describe('isAppropriateFor', () => {
    test('returns not appropriate for calculate* functions', async () => {
      const client = createMockLLMClient(mockNotAppropriateCalculateResponse);
      const result = await SemanticVoid.isAppropriateFor('calculateTotal', client);

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('calculate');
    });

    test('returns appropriate for log* functions', async () => {
      const client = createMockLLMClient(mockAppropriateLogResponse);
      const result = await SemanticVoid.isAppropriateFor('logMessage', client);

      expect(result.appropriate).toBe(true);
      expect(result.reason).toContain('Logging');
    });

    test('returns appropriate for handle* functions', async () => {
      const client = createMockLLMClient(mockAppropriateHandleResponse);
      const result = await SemanticVoid.isAppropriateFor('handleClick', client);

      expect(result.appropriate).toBe(true);
      expect(result.reason).toContain('Event handler');
    });

    test('returns not appropriate for get* functions', async () => {
      const client = createMockLLMClient(mockNotAppropriateGetResponse);
      const result = await SemanticVoid.isAppropriateFor('getUserData', client);

      expect(result.appropriate).toBe(false);
      expect(result.reason).toContain('get');
    });

    test('returns appropriate for set* functions', async () => {
      const client = createMockLLMClient(mockAppropriateSetResponse);
      const result = await SemanticVoid.isAppropriateFor('setUserName', client);

      expect(result.appropriate).toBe(true);
      expect(result.reason).toContain('Setter');
    });
  });
});

describe('SemanticVoid prompts', () => {
  test('createAnalyzeSideEffectsPrompt includes function source', async () => {
    const { createAnalyzeSideEffectsPrompt } = await import('../prompts.ts');
    const fnSource = 'function test() { console.log("hello"); }';
    const prompt = createAnalyzeSideEffectsPrompt(fnSource);

    expect(prompt).toContain(fnSource);
    expect(prompt).toContain('side effects');
  });

  test('createShouldReturnValuePrompt includes context when provided', async () => {
    const { createShouldReturnValuePrompt } = await import('../prompts.ts');
    const fnSource = 'function process(data) {}';
    const context = 'data transformation';
    const prompt = createShouldReturnValuePrompt(fnSource, context);

    expect(prompt).toContain(fnSource);
    expect(prompt).toContain(context);
  });

  test('createShouldReturnValuePrompt works without context', async () => {
    const { createShouldReturnValuePrompt } = await import('../prompts.ts');
    const fnSource = 'function log(msg) { console.log(msg); }';
    const prompt = createShouldReturnValuePrompt(fnSource);

    expect(prompt).toContain(fnSource);
    expect(prompt).not.toContain('Context:');
  });

  test('createExplainPrompt includes function source', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const fnSource = 'function notify() {}';
    const prompt = createExplainPrompt(fnSource);

    expect(prompt).toContain(fnSource);
    expect(prompt).toContain('explanation');
  });

  test('createValidateUsagePrompt includes function and usage', async () => {
    const { createValidateUsagePrompt } = await import('../prompts.ts');
    const fnSource = 'function log(x) {}';
    const usage = 'in array.map()';
    const prompt = createValidateUsagePrompt(fnSource, usage);

    expect(prompt).toContain(fnSource);
    expect(prompt).toContain(usage);
  });

  test('createCheckErrorHandlingPrompt includes function source', async () => {
    const { createCheckErrorHandlingPrompt } = await import('../prompts.ts');
    const fnSource = 'function save(data) { db.save(data); }';
    const prompt = createCheckErrorHandlingPrompt(fnSource);

    expect(prompt).toContain(fnSource);
    expect(prompt).toContain('error handling');
  });

  test('createSuggestSignaturePrompt includes function source', async () => {
    const { createSuggestSignaturePrompt } = await import('../prompts.ts');
    const fnSource = 'async function update(user) {}';
    const prompt = createSuggestSignaturePrompt(fnSource);

    expect(prompt).toContain(fnSource);
    expect(prompt).toContain('signature');
  });

  test('createIsAppropriateForPrompt includes function name', async () => {
    const { createIsAppropriateForPrompt } = await import('../prompts.ts');
    const fnName = 'calculateTotal';
    const prompt = createIsAppropriateForPrompt(fnName);

    expect(prompt).toContain(fnName);
    expect(prompt).toContain('appropriate');
  });
});
