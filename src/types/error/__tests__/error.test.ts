/**
 * Unit tests for SemanticError
 */

import { describe, test, expect } from 'bun:test';
import { SemanticError } from '../error.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockClassifyNetworkResponse,
  mockClassifyDatabaseResponse,
  mockClassifyValidationResponse,
  mockExplainEndUserResponse,
  mockExplainDeveloperResponse,
  mockExplainSupportResponse,
  mockSuggestFixesResponse,
  mockInferRootCauseResponse,
  mockMatchesTrueResponse,
  mockMatchesFalseResponse,
  mockGetResourcesResponse,
  mockShouldReportTrueResponse,
  mockShouldReportFalseResponse,
  mockRecoveryStrategyRetryResponse,
  mockRecoveryStrategyFallbackResponse,
  mockRecoveryStrategyAbortResponse,
  mockGetSeverityCriticalResponse,
  mockGetSeverityErrorResponse,
  mockGetSeverityWarningResponse,
  mockGetSeverityInfoResponse,
} from './mocks.ts';

describe('SemanticError', () => {
  describe('from', () => {
    test('creates SemanticError from Error object', () => {
      const originalError = new Error('Connection failed');
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const semanticError = SemanticError.from(originalError, undefined, client);

      expect(semanticError).toBeInstanceOf(SemanticError);
      expect(semanticError.message).toBe('Connection failed');
      expect(semanticError.name).toBe('SemanticError');
    });

    test('creates SemanticError from string', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const semanticError = SemanticError.from('Something went wrong', undefined, client);

      expect(semanticError).toBeInstanceOf(SemanticError);
      expect(semanticError.message).toBe('Something went wrong');
    });

    test('creates SemanticError with context', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const context = { service: 'database', operation: 'connect' };
      const semanticError = SemanticError.from('Connection failed', context, client);

      expect(semanticError.getContext()).toEqual(context);
    });

    test('returns same SemanticError if already a SemanticError', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const original = SemanticError.from('Test error', undefined, client);
      const result = SemanticError.from(original);

      expect(result).toBe(original);
    });

    test('creates SemanticError from unknown type', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const semanticError = SemanticError.from({ message: 'Custom error' }, undefined, client);

      expect(semanticError).toBeInstanceOf(SemanticError);
      expect(semanticError.message).toBe('Custom error');
    });

    test('handles non-object unknown type', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const semanticError = SemanticError.from(42, undefined, client);

      expect(semanticError).toBeInstanceOf(SemanticError);
      expect(semanticError.message).toBe('42');
    });

    test('preserves original error stack trace', () => {
      const originalError = new Error('Test error');
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const semanticError = SemanticError.from(originalError, undefined, client);

      expect(semanticError.stack).toBe(originalError.stack);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for similar errors', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const error1 = SemanticError.from('Connection timeout', undefined, client);
      const error2 = SemanticError.from('Request timed out', undefined, client);

      const result = await error1.semanticallyEquals(error2);

      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBe(0.92);
      expect(result.reason).toContain('timeout');
    });

    test('returns not equivalent for different errors', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const error1 = SemanticError.from('Network error', undefined, client);
      const error2 = SemanticError.from('Invalid credentials', undefined, client);

      const result = await error1.semanticallyEquals(error2);

      expect(result.equivalent).toBe(false);
      expect(result.confidence).toBe(0.88);
    });
  });

  describe('classify', () => {
    test('classifies network error', async () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const error = SemanticError.from('ECONNREFUSED', undefined, client);

      const result = await error.classify();

      expect(result.category).toBe('network');
      expect(result.subcategory).toBe('timeout');
      expect(result.severity).toBe('recoverable');
      expect(result.retryable).toBe(true);
    });

    test('classifies database error', async () => {
      const client = createMockLLMClient(mockClassifyDatabaseResponse);
      const error = SemanticError.from('Database connection failed', undefined, client);

      const result = await error.classify();

      expect(result.category).toBe('database');
      expect(result.subcategory).toBe('connection');
      expect(result.severity).toBe('critical');
      expect(result.retryable).toBe(false);
    });

    test('classifies validation error', async () => {
      const client = createMockLLMClient(mockClassifyValidationResponse);
      const error = SemanticError.from('Invalid email format', undefined, client);

      const result = await error.classify();

      expect(result.category).toBe('validation');
      expect(result.subcategory).toBe('format');
      expect(result.severity).toBe('warning');
    });

    test('caches classification result', async () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const error = SemanticError.from('Network error', undefined, client);

      const result1 = await error.classify();
      const result2 = await error.classify();

      expect(result1).toBe(result2);
      expect((client.complete as ReturnType<typeof import('bun:test').mock>).mock.calls.length).toBe(1);
    });
  });

  describe('explain', () => {
    test('explains for end-user audience', async () => {
      const client = createMockLLMClient(mockExplainEndUserResponse);
      const error = SemanticError.from('ECONNREFUSED', undefined, client);

      const explanation = await error.explain('end-user');

      expect(explanation).toContain('trouble connecting');
      expect(explanation).toContain('try again');
    });

    test('explains for developer audience', async () => {
      const client = createMockLLMClient(mockExplainDeveloperResponse);
      const error = SemanticError.from('ECONNREFUSED', undefined, client);

      const explanation = await error.explain('developer');

      expect(explanation).toContain('ECONNREFUSED');
      expect(explanation).toContain('PostgreSQL');
    });

    test('explains for support audience', async () => {
      const client = createMockLLMClient(mockExplainSupportResponse);
      const error = SemanticError.from('ECONNREFUSED', undefined, client);

      const explanation = await error.explain('support');

      expect(explanation).toContain('Database connection error');
    });

    test('defaults to developer audience', async () => {
      const client = createMockLLMClient(mockExplainDeveloperResponse);
      const error = SemanticError.from('ECONNREFUSED', undefined, client);

      const explanation = await error.explain();

      expect(explanation).toContain('ECONNREFUSED');
    });
  });

  describe('suggestFixes', () => {
    test('suggests fixes with confidence and code', async () => {
      const client = createMockLLMClient(mockSuggestFixesResponse);
      const error = SemanticError.from('Database connection failed', undefined, client);

      const fixes = await error.suggestFixes();

      expect(fixes).toHaveLength(3);
      const firstFix = fixes[0];
      expect(firstFix).toBeDefined();
      expect(firstFix?.fix).toContain('database service');
      expect(firstFix?.confidence).toBe(0.95);
      expect(firstFix?.code).toContain('systemctl');
    });

    test('handles fixes without code', async () => {
      const client = createMockLLMClient(mockSuggestFixesResponse);
      const error = SemanticError.from('Connection failed', undefined, client);

      const fixes = await error.suggestFixes();

      const secondFix = fixes[1];
      expect(secondFix).toBeDefined();
      expect(secondFix?.code).toBeNull();
    });
  });

  describe('inferRootCause', () => {
    test('infers root cause with confidence', async () => {
      const client = createMockLLMClient(mockInferRootCauseResponse);
      const error = SemanticError.from('ECONNREFUSED on port 5432', undefined, client);

      const result = await error.inferRootCause();

      expect(result.cause).toContain('PostgreSQL');
      expect(result.cause).toContain('not running');
      expect(result.confidence).toBe(0.87);
    });
  });

  describe('matches', () => {
    test('returns true for matching pattern', async () => {
      const client = createMockLLMClient(mockMatchesTrueResponse);
      const error = SemanticError.from('Connection timed out', undefined, client);

      const result = await error.matches('network-related');

      expect(result).toBe(true);
    });

    test('returns false for non-matching pattern', async () => {
      const client = createMockLLMClient(mockMatchesFalseResponse);
      const error = SemanticError.from('Invalid email format', undefined, client);

      const result = await error.matches('network-related');

      expect(result).toBe(false);
    });
  });

  describe('getResources', () => {
    test('returns relevant resources', async () => {
      const client = createMockLLMClient(mockGetResourcesResponse);
      const error = SemanticError.from('Database connection failed', undefined, client);

      const resources = await error.getResources();

      expect(resources).toHaveLength(2);
      const firstResource = resources[0];
      const secondResource = resources[1];
      expect(firstResource).toBeDefined();
      expect(secondResource).toBeDefined();
      expect(firstResource?.title).toContain('PostgreSQL');
      expect(firstResource?.type).toBe('docs');
      expect(secondResource?.type).toBe('troubleshooting');
    });
  });

  describe('shouldReport', () => {
    test('recommends reporting for unexpected errors', async () => {
      const client = createMockLLMClient(mockShouldReportTrueResponse);
      const error = SemanticError.from('Unexpected database failure', undefined, client);

      const result = await error.shouldReport();

      expect(result.report).toBe(true);
      expect(result.reason).toContain('unexpected');
      expect(result.priority).toBe('high');
    });

    test('does not recommend reporting for expected errors', async () => {
      const client = createMockLLMClient(mockShouldReportFalseResponse);
      const error = SemanticError.from('Invalid input format', undefined, client);

      const result = await error.shouldReport();

      expect(result.report).toBe(false);
      expect(result.reason).toContain('validation');
    });
  });

  describe('recoveryStrategy', () => {
    test('suggests retry strategy with backoff', async () => {
      const client = createSequentialMockLLMClient([
        mockClassifyNetworkResponse,
        mockRecoveryStrategyRetryResponse,
      ]);
      const error = SemanticError.from('Network timeout', undefined, client);

      const strategy = await error.recoveryStrategy();

      expect(strategy.strategy).toBe('retry');
      expect(strategy.maxAttempts).toBe(3);
      expect(strategy.backoff).toBe('exponential');
    });

    test('suggests fallback strategy', async () => {
      const client = createSequentialMockLLMClient([
        mockClassifyDatabaseResponse,
        mockRecoveryStrategyFallbackResponse,
      ]);
      const error = SemanticError.from('Primary service unavailable', undefined, client);

      const strategy = await error.recoveryStrategy();

      expect(strategy.strategy).toBe('fallback');
    });

    test('suggests abort strategy for critical errors', async () => {
      const client = createSequentialMockLLMClient([
        mockClassifyDatabaseResponse,
        mockRecoveryStrategyAbortResponse,
      ]);
      const error = SemanticError.from('Data corruption detected', undefined, client);

      const strategy = await error.recoveryStrategy();

      expect(strategy.strategy).toBe('abort');
    });
  });

  describe('getSeverity', () => {
    test('returns critical severity', async () => {
      const client = createMockLLMClient(mockGetSeverityCriticalResponse);
      const error = SemanticError.from('Data loss detected', undefined, client);

      const severity = await error.getSeverity();

      expect(severity).toBe('critical');
    });

    test('returns error severity', async () => {
      const client = createMockLLMClient(mockGetSeverityErrorResponse);
      const error = SemanticError.from('Operation failed', undefined, client);

      const severity = await error.getSeverity();

      expect(severity).toBe('error');
    });

    test('returns warning severity', async () => {
      const client = createMockLLMClient(mockGetSeverityWarningResponse);
      const error = SemanticError.from('Deprecated API used', undefined, client);

      const severity = await error.getSeverity();

      expect(severity).toBe('warning');
    });

    test('returns info severity', async () => {
      const client = createMockLLMClient(mockGetSeverityInfoResponse);
      const error = SemanticError.from('Optional feature disabled', undefined, client);

      const severity = await error.getSeverity();

      expect(severity).toBe('info');
    });
  });

  describe('getContext', () => {
    test('returns empty context by default', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const error = SemanticError.from('Error', undefined, client);

      expect(error.getContext()).toEqual({});
    });

    test('returns provided context', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const context = { service: 'api', endpoint: '/users' };
      const error = SemanticError.from('Request failed', context, client);

      expect(error.getContext()).toEqual(context);
    });

    test('returns copy of context', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const context = { service: 'api' };
      const error = SemanticError.from('Error', context, client);

      const retrieved = error.getContext();
      retrieved.modified = true;

      expect(error.getContext()).not.toHaveProperty('modified');
    });
  });

  describe('toJSON', () => {
    test('returns JSON representation', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const context = { service: 'database' };
      const error = SemanticError.from('Connection failed', context, client);

      const json = error.toJSON();

      expect(json.name).toBe('SemanticError');
      expect(json.message).toBe('Connection failed');
      expect(json.context).toEqual(context);
      expect(json.stack).toBeDefined();
    });
  });

  describe('Error inheritance', () => {
    test('is instanceof Error', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const error = SemanticError.from('Test error', undefined, client);

      expect(error).toBeInstanceOf(Error);
    });

    test('has stack trace', () => {
      const client = createMockLLMClient(mockClassifyNetworkResponse);
      const error = SemanticError.from('Test error', undefined, client);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('SemanticError');
    });
  });
});

describe('SemanticError prompts', () => {
  test('createClassifyPrompt includes error message', async () => {
    const { createClassifyPrompt } = await import('../prompts.ts');
    const prompt = createClassifyPrompt('Connection failed', undefined);

    expect(prompt).toContain('Error Message: "Connection failed"');
  });

  test('createClassifyPrompt includes stack trace', async () => {
    const { createClassifyPrompt } = await import('../prompts.ts');
    const prompt = createClassifyPrompt('Error', 'at line 42');

    expect(prompt).toContain('Stack Trace: at line 42');
  });

  test('createClassifyPrompt includes context', async () => {
    const { createClassifyPrompt } = await import('../prompts.ts');
    const prompt = createClassifyPrompt('Error', undefined, { service: 'api' });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('service');
  });

  test('createExplainPrompt includes audience guidelines', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('Error', undefined, 'end-user');

    expect(prompt).toContain('end-user');
    expect(prompt).toContain('simple, non-technical');
  });

  test('createSuggestFixesPrompt includes context', async () => {
    const { createSuggestFixesPrompt } = await import('../prompts.ts');
    const prompt = createSuggestFixesPrompt('Error', undefined, {
      operation: 'connect',
    });

    expect(prompt).toContain('operation');
  });

  test('createMatchesPatternPrompt includes pattern', async () => {
    const { createMatchesPatternPrompt } = await import('../prompts.ts');
    const prompt = createMatchesPatternPrompt('Error', undefined, 'network-related');

    expect(prompt).toContain('Pattern to match: "network-related"');
  });

  test('createRecoveryStrategyPrompt includes category', async () => {
    const { createRecoveryStrategyPrompt } = await import('../prompts.ts');
    const prompt = createRecoveryStrategyPrompt('Error', undefined, 'network');

    expect(prompt).toContain('Error Category: network');
  });
});
