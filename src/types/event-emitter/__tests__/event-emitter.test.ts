/**
 * Unit tests for SemanticEventEmitter
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { EventEmitter } from 'events';
import { SemanticEventEmitter } from '../event-emitter.ts';
import {
  createMockLLMClient,
  createErrorMockLLMClient,
  mockClassifyErrorResponse,
  mockClassifyLifecycleResponse,
  mockClassifyDataResponse,
  mockMatchEventTrueResponse,
  mockValidateHandlersValidResponse,
  mockValidateHandlersInvalidResponse,
  mockSuggestHandlersResponse,
  mockSuggestHandlersEmptyResponse,
  mockValidateEventNameValidResponse,
  mockValidateEventNameSuggestionsResponse,
  mockGenerateDocsResponse,
  mockExplainResponse,
  mockAnalyzeFlowResponse,
  mockAnalyzeFlowCleanResponse,
} from './mocks.ts';

describe('SemanticEventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('from', () => {
    test('creates SemanticEventEmitter from regular EventEmitter', () => {
      const semanticEmitter = SemanticEventEmitter.from(emitter);

      expect(semanticEmitter).toBeInstanceOf(SemanticEventEmitter);
      expect(semanticEmitter.emitter).toBe(emitter);
    });

    test('creates SemanticEventEmitter with context', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(
        emitter,
        'HTTP server events',
        client
      );

      expect(semanticEmitter.context).toBe('HTTP server events');
    });

    test('returns same SemanticEventEmitter if already wrapped', () => {
      const semanticEmitter = SemanticEventEmitter.from(emitter);
      const rewrapped = SemanticEventEmitter.from(semanticEmitter as unknown as EventEmitter);

      expect(rewrapped).toBe(semanticEmitter);
    });
  });

  describe('basic EventEmitter functionality', () => {
    test('on adds listener', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      let called = false;

      semanticEmitter.on('test', () => {
        called = true;
      });
      semanticEmitter.emit('test');

      expect(called).toBe(true);
    });

    test('once adds one-time listener', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      let callCount = 0;

      semanticEmitter.once('test', () => {
        callCount++;
      });
      semanticEmitter.emit('test');
      semanticEmitter.emit('test');

      expect(callCount).toBe(1);
    });

    test('off removes listener', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      let called = false;
      const listener = () => {
        called = true;
      };

      semanticEmitter.on('test', listener);
      semanticEmitter.off('test', listener);
      semanticEmitter.emit('test');

      expect(called).toBe(false);
    });

    test('removeListener removes listener', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      let called = false;
      const listener = () => {
        called = true;
      };

      semanticEmitter.on('test', listener);
      semanticEmitter.removeListener('test', listener);
      semanticEmitter.emit('test');

      expect(called).toBe(false);
    });

    test('removeAllListeners removes all listeners for event', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      let count = 0;

      semanticEmitter.on('test', () => count++);
      semanticEmitter.on('test', () => count++);
      semanticEmitter.removeAllListeners('test');
      semanticEmitter.emit('test');

      expect(count).toBe(0);
    });

    test('eventNames returns registered events', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('connect', () => {});
      semanticEmitter.on('data', () => {});
      semanticEmitter.on('error', () => {});

      const names = semanticEmitter.eventNames();
      expect(names).toContain('connect');
      expect(names).toContain('data');
      expect(names).toContain('error');
    });

    test('listenerCount returns correct count', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('test', () => {});
      semanticEmitter.on('test', () => {});

      expect(semanticEmitter.listenerCount('test')).toBe(2);
    });

    test('emit returns true when listeners exist', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('test', () => {});

      expect(semanticEmitter.emit('test')).toBe(true);
    });

    test('emit returns false when no listeners', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      expect(semanticEmitter.emit('test')).toBe(false);
    });
  });

  describe('classifyEvent', () => {
    test('classifies error events', () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.classifyEvent('connectionError');

      expect(result.category).toBe('error');
      expect(result.severity).toBeDefined();
      expect(result.recoverable).toBeDefined();
    });

    test('classifies lifecycle events', () => {
      const client = createMockLLMClient(mockClassifyLifecycleResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.classifyEvent('connect');

      expect(result.category).toBe('lifecycle');
    });

    test('classifies data events', () => {
      const client = createMockLLMClient(mockClassifyDataResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.classifyEvent('data');

      expect(result.category).toBe('data');
    });

    test('classifies user action events', () => {
      const client = createMockLLMClient(mockClassifyDataResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.classifyEvent('click');

      expect(result.category).toBe('user-action');
    });

    test('returns unknown for unrecognized events', () => {
      const client = createMockLLMClient(mockClassifyDataResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.classifyEvent('xyz123');

      expect(result.category).toBe('unknown');
    });
  });

  describe('classifyEventAsync', () => {
    test('classifies event using LLM', async () => {
      const client = createMockLLMClient(mockClassifyErrorResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = await semanticEmitter.classifyEventAsync('connection_error');

      expect(result.category).toBe('error');
      expect(result.severity).toBe('high');
      expect(result.recoverable).toBe(true);
    });

    test('falls back to sync classification on LLM error', async () => {
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = await semanticEmitter.classifyEventAsync('connectionError');

      expect(result.category).toBe('error');
    });
  });

  describe('validateHandlers', () => {
    test('returns valid when error handler exists', () => {
      const client = createMockLLMClient(mockValidateHandlersValidResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('error', () => {});
      const result = semanticEmitter.validateHandlers();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('returns invalid when error handler missing', () => {
      const client = createMockLLMClient(mockValidateHandlersInvalidResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('data', () => {});
      const result = semanticEmitter.validateHandlers();

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('error');
    });

    test('warns about too many listeners', () => {
      const client = createMockLLMClient(mockValidateHandlersInvalidResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      // Add many listeners to trigger warning
      emitter.setMaxListeners(5);
      for (let i = 0; i < 5; i++) {
        semanticEmitter.on('data', () => {});
      }

      const result = semanticEmitter.validateHandlers();
      expect(result.issues.some((issue) => issue.includes('listeners'))).toBe(true);
    });
  });

  describe('validateHandlersAsync', () => {
    test('validates handlers using LLM', async () => {
      const client = createMockLLMClient(mockValidateHandlersValidResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('error', () => {});
      const result = await semanticEmitter.validateHandlersAsync();

      expect(result.valid).toBe(true);
    });

    test('falls back to sync validation on LLM error', async () => {
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = await semanticEmitter.validateHandlersAsync();

      expect(result.valid).toBe(false);
    });
  });

  describe('suggestHandlers', () => {
    test('suggests error handler when missing', () => {
      const client = createMockLLMClient(mockSuggestHandlersResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('data', () => {});
      const suggestions = semanticEmitter.suggestHandlers();

      expect(suggestions.length).toBeGreaterThan(0);
      const firstSuggestion = suggestions[0];
      expect(firstSuggestion).toBeDefined();
      expect(firstSuggestion?.event).toBe('error');
      expect(firstSuggestion?.reason).toContain('crash');
    });

    test('suggests close handler when open exists', () => {
      const client = createMockLLMClient(mockSuggestHandlersResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('open', () => {});
      semanticEmitter.on('error', () => {});
      const suggestions = semanticEmitter.suggestHandlers();

      expect(suggestions.some((s) => s.event === 'close')).toBe(true);
    });

    test('returns empty when all handlers present', () => {
      const client = createMockLLMClient(mockSuggestHandlersEmptyResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('error', () => {});
      semanticEmitter.on('close', () => {});
      const suggestions = semanticEmitter.suggestHandlers();

      expect(suggestions.length).toBe(0);
    });
  });

  describe('suggestHandlersAsync', () => {
    test('suggests handlers using LLM', async () => {
      const client = createMockLLMClient(mockSuggestHandlersResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const suggestions = await semanticEmitter.suggestHandlersAsync();

      expect(suggestions.length).toBeGreaterThan(0);
      const firstSuggestion = suggestions[0];
      expect(firstSuggestion).toBeDefined();
      expect(firstSuggestion?.event).toBeDefined();
      expect(firstSuggestion?.reason).toBeDefined();
      expect(firstSuggestion?.example).toBeDefined();
    });
  });

  describe('validateEventName', () => {
    test('validates camelCase names', () => {
      const client = createMockLLMClient(mockValidateEventNameValidResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.validateEventName('userLoggedIn');

      expect(result.valid).toBe(true);
    });

    test('suggests camelCase for SCREAMING_SNAKE_CASE', () => {
      const client = createMockLLMClient(mockValidateEventNameSuggestionsResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.validateEventName('USER_LOGIN');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('camelCase');
    });

    test('suggests matching existing convention', () => {
      const client = createMockLLMClient(mockValidateEventNameSuggestionsResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('userLogin', () => {});
      semanticEmitter.on('userLogout', () => {});

      const result = semanticEmitter.validateEventName('data_received');

      // Should suggest matching the existing camelCase convention
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('validateEventNameAsync', () => {
    test('validates event name using LLM', async () => {
      const client = createMockLLMClient(mockValidateEventNameValidResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = await semanticEmitter.validateEventNameAsync('userLoggedIn');

      expect(result.valid).toBe(true);
    });
  });

  describe('explain', () => {
    test('returns explanation with context', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const semanticEmitter = SemanticEventEmitter.from(
        emitter,
        'HTTP server events',
        client
      );

      semanticEmitter.on('request', () => {});
      semanticEmitter.on('response', () => {});
      const explanation = semanticEmitter.explain();

      expect(explanation).toContain('HTTP server events');
    });

    test('returns explanation without context', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('request', () => {});
      const explanation = semanticEmitter.explain();

      expect(explanation).toContain('EventEmitter');
      expect(explanation).toContain('request');
    });

    test('handles no events', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const explanation = semanticEmitter.explain();

      expect(explanation).toContain('no registered events');
    });

    test('truncates long event list', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      for (let i = 0; i < 10; i++) {
        semanticEmitter.on(`event${i}`, () => {});
      }

      const explanation = semanticEmitter.explain();
      expect(explanation).toContain('more');
    });
  });

  describe('explainAsync', () => {
    test('explains using LLM', async () => {
      const client = createMockLLMClient(mockExplainResponse);
      const semanticEmitter = SemanticEventEmitter.from(
        emitter,
        'HTTP server events',
        client
      );

      semanticEmitter.on('connect', () => {});
      const explanation = await semanticEmitter.explainAsync();

      expect(explanation).toContain('HTTP server');
    });
  });

  describe('generateDocs', () => {
    test('generates markdown documentation', () => {
      const client = createMockLLMClient(mockGenerateDocsResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('connect', () => {});
      semanticEmitter.on('data', () => {});
      semanticEmitter.on('error', () => {});

      const docs = semanticEmitter.generateDocs();

      expect(docs).toContain('# Events');
      expect(docs).toContain('`connect`');
      expect(docs).toContain('`data`');
      expect(docs).toContain('`error`');
    });

    test('includes context in docs', () => {
      const client = createMockLLMClient(mockGenerateDocsResponse);
      const semanticEmitter = SemanticEventEmitter.from(
        emitter,
        'Socket connection',
        client
      );

      semanticEmitter.on('connect', () => {});
      const docs = semanticEmitter.generateDocs();

      expect(docs).toContain('Socket connection');
    });

    test('handles no events', () => {
      const client = createMockLLMClient(mockGenerateDocsResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const docs = semanticEmitter.generateDocs();

      expect(docs).toContain('No events registered');
    });
  });

  describe('generateDocsAsync', () => {
    test('generates docs using LLM', async () => {
      const client = createMockLLMClient(mockGenerateDocsResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('connect', () => {});
      const docs = await semanticEmitter.generateDocsAsync();

      expect(docs).toContain('# Events');
    });
  });

  describe('analyzeFlow', () => {
    test('analyzes event flow over duration', async () => {
      const client = createMockLLMClient(mockAnalyzeFlowResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('request', () => {});
      semanticEmitter.on('response', () => {});

      // Start analysis and emit some events
      const analysisPromise = semanticEmitter.analyzeFlow(100);

      // Emit events during analysis
      setTimeout(() => {
        semanticEmitter.emit('request', { id: 1 });
        semanticEmitter.emit('response', { id: 1 });
        semanticEmitter.emit('request', { id: 2 });
        semanticEmitter.emit('response', { id: 2 });
      }, 10);

      const result = await analysisPromise;

      expect(result.events).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.anomalies).toBeDefined();
    });

    test('returns empty patterns on LLM error', async () => {
      const client = createErrorMockLLMClient(new Error('LLM error'));
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      semanticEmitter.on('test', () => {});

      const result = await semanticEmitter.analyzeFlow(50);

      expect(result.events).toBeDefined();
      expect(result.patterns).toEqual([]);
      expect(result.anomalies).toEqual([]);
    });
  });

  describe('monitor', () => {
    test('monitors events and reports issues', async () => {
      const client = createMockLLMClient(mockAnalyzeFlowCleanResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      const issues: string[] = [];

      semanticEmitter.on('error', () => {});

      const cleanup = semanticEmitter.monitor({
        reportInterval: 50,
        onIssue: (issue) => issues.push(issue),
      });

      // Emit an error event
      semanticEmitter.emit('error', new Error('test error'));

      // Wait for monitoring to detect
      await new Promise((resolve) => setTimeout(resolve, 20));

      cleanup();

      expect(issues.some((i) => i.includes('error'))).toBe(true);
    });

    test('cleanup stops monitoring', async () => {
      const client = createMockLLMClient(mockAnalyzeFlowCleanResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      let issueCount = 0;

      semanticEmitter.on('error', () => {});

      const cleanup = semanticEmitter.monitor({
        reportInterval: 20,
        onIssue: () => issueCount++,
      });

      cleanup();

      // Emit after cleanup
      semanticEmitter.emit('error', new Error('test'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not have increased after cleanup
      const countAfterCleanup = issueCount;
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(issueCount).toBe(countAfterCleanup);
    });
  });

  describe('onSemantic', () => {
    test('adds semantic handler', () => {
      const client = createMockLLMClient(mockMatchEventTrueResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);

      const result = semanticEmitter.onSemantic('any error event', () => {});

      expect(result).toBe(semanticEmitter);
    });

    test('offSemantic removes semantic handler', () => {
      const client = createMockLLMClient(mockMatchEventTrueResponse);
      const semanticEmitter = SemanticEventEmitter.from(emitter, undefined, client);
      const handler = () => {};

      semanticEmitter.onSemantic('any error event', handler);
      const result = semanticEmitter.offSemantic('any error event', handler);

      expect(result).toBe(semanticEmitter);
    });
  });
});

describe('SemanticEventEmitter prompts', () => {
  test('createClassifyEventPrompt includes event name', async () => {
    const { createClassifyEventPrompt } = await import('../prompts.ts');
    const prompt = createClassifyEventPrompt('connectionError', 'server');

    expect(prompt).toContain('connectionError');
    expect(prompt).toContain('server');
  });

  test('createMatchEventCriteriaPrompt includes criteria', async () => {
    const { createMatchEventCriteriaPrompt } = await import('../prompts.ts');
    const prompt = createMatchEventCriteriaPrompt('error', 'any error event', { code: 500 });

    expect(prompt).toContain('error');
    expect(prompt).toContain('any error event');
    expect(prompt).toContain('500');
  });

  test('createValidateHandlersPrompt includes events', async () => {
    const { createValidateHandlersPrompt } = await import('../prompts.ts');
    const prompt = createValidateHandlersPrompt(
      ['connect', 'data', 'error'],
      { connect: 1, data: 2, error: 1 },
      'WebSocket server'
    );

    expect(prompt).toContain('connect');
    expect(prompt).toContain('WebSocket server');
  });

  test('createSuggestHandlersPrompt includes context', async () => {
    const { createSuggestHandlersPrompt } = await import('../prompts.ts');
    const prompt = createSuggestHandlersPrompt(
      ['connect', 'data'],
      ['connect'],
      'TCP server'
    );

    expect(prompt).toContain('TCP server');
    expect(prompt).toContain('connect');
  });

  test('createValidateEventNamePrompt includes event name', async () => {
    const { createValidateEventNamePrompt } = await import('../prompts.ts');
    const prompt = createValidateEventNamePrompt('USER_LOGIN', ['userLogout', 'userUpdate']);

    expect(prompt).toContain('USER_LOGIN');
    expect(prompt).toContain('userLogout');
  });

  test('createGenerateDocsPrompt includes events', async () => {
    const { createGenerateDocsPrompt } = await import('../prompts.ts');
    const prompt = createGenerateDocsPrompt(
      ['connect', 'data', 'close'],
      { connect: 1, data: 3, close: 1 },
      'Database connection'
    );

    expect(prompt).toContain('connect');
    expect(prompt).toContain('Database connection');
  });

  test('createExplainEmitterPrompt includes context', async () => {
    const { createExplainEmitterPrompt } = await import('../prompts.ts');
    const prompt = createExplainEmitterPrompt(
      ['request', 'response'],
      { request: 10, response: 10 },
      'HTTP server'
    );

    expect(prompt).toContain('HTTP server');
    expect(prompt).toContain('request');
  });

  test('createAnalyzeFlowPrompt includes duration', async () => {
    const { createAnalyzeFlowPrompt } = await import('../prompts.ts');
    const prompt = createAnalyzeFlowPrompt(
      { request: 100, response: 98 },
      [
        { event: 'request', timestamp: 0 },
        { event: 'response', timestamp: 10 },
      ],
      60000,
      'API server'
    );

    expect(prompt).toContain('60000');
    expect(prompt).toContain('API server');
    expect(prompt).toContain('request');
  });

  test('createDetectIssuePrompt includes event', async () => {
    const { createDetectIssuePrompt } = await import('../prompts.ts');
    const prompt = createDetectIssuePrompt(
      'error',
      { error: 5, data: 100 },
      [{ event: 'error', timestamp: 1000 }],
      'Worker process'
    );

    expect(prompt).toContain('error');
    expect(prompt).toContain('Worker process');
  });
});
