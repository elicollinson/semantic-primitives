/**
 * Mock utilities for SemanticEventEmitter testing
 */

import { mock } from 'bun:test';
import type { LLMClient } from '../../../llm/client.ts';
import type { LLMResponse, CompletionOptions } from '../../../llm/types.ts';

// =============================================================================
// CLASSIFY EVENT RESPONSES
// =============================================================================

/** Mock response for classifyEvent - error event */
export const mockClassifyErrorResponse = {
  category: 'error',
  severity: 'high',
  recoverable: true,
};

/** Mock response for classifyEvent - lifecycle event */
export const mockClassifyLifecycleResponse = {
  category: 'lifecycle',
  severity: null,
  recoverable: null,
};

/** Mock response for classifyEvent - data event */
export const mockClassifyDataResponse = {
  category: 'data',
  severity: null,
  recoverable: null,
};

/** Mock response for classifyEvent - user action */
export const mockClassifyUserActionResponse = {
  category: 'user-action',
  severity: null,
  recoverable: null,
};

// =============================================================================
// MATCH EVENT CRITERIA RESPONSES
// =============================================================================

/** Mock response for semantic event matching - matches */
export const mockMatchEventTrueResponse = {
  matches: true,
  confidence: 0.95,
  reason: 'Event matches the specified criteria',
};

/** Mock response for semantic event matching - no match */
export const mockMatchEventFalseResponse = {
  matches: false,
  confidence: 0.88,
  reason: 'Event does not match the specified criteria',
};

// =============================================================================
// VALIDATE HANDLERS RESPONSES
// =============================================================================

/** Mock response for validateHandlers - valid */
export const mockValidateHandlersValidResponse = {
  valid: true,
  issues: [],
  suggestions: [],
};

/** Mock response for validateHandlers - invalid */
export const mockValidateHandlersInvalidResponse = {
  valid: false,
  issues: ['No error handler registered. Unhandled errors will crash the process.'],
  suggestions: ['Add an error handler: emitter.on("error", (err) => { /* handle */ })'],
};

/** Mock response for validateHandlers with multiple issues */
export const mockValidateHandlersMultipleIssuesResponse = {
  valid: false,
  issues: [
    'No error handler registered',
    'Event "data" has too many listeners (15), approaching max of 10',
  ],
  suggestions: [
    'Add an error handler',
    'Consider consolidating listeners for "data"',
  ],
};

// =============================================================================
// SUGGEST HANDLERS RESPONSES
// =============================================================================

/** Mock response for suggestHandlers */
export const mockSuggestHandlersResponse = {
  suggestions: [
    {
      event: 'error',
      reason: 'Unhandled errors will crash the process in Node.js',
      example: 'emitter.on("error", (err) => console.error("Error:", err))',
    },
    {
      event: 'close',
      reason: 'Resource cleanup is needed when connection closes',
      example: 'emitter.on("close", () => { /* cleanup resources */ })',
    },
  ],
};

/** Mock response for suggestHandlers - empty */
export const mockSuggestHandlersEmptyResponse = {
  suggestions: [],
};

// =============================================================================
// VALIDATE EVENT NAME RESPONSES
// =============================================================================

/** Mock response for validateEventName - valid */
export const mockValidateEventNameValidResponse = {
  valid: true,
  suggestions: [],
};

/** Mock response for validateEventName - with suggestions */
export const mockValidateEventNameSuggestionsResponse = {
  valid: true,
  suggestions: ['Consider using camelCase: userLogin'],
};

/** Mock response for validateEventName - invalid */
export const mockValidateEventNameInvalidResponse = {
  valid: false,
  suggestions: ['Event name contains unusual characters', 'Consider using camelCase'],
};

// =============================================================================
// GENERATE DOCS RESPONSES
// =============================================================================

/** Mock response for generateDocs */
export const mockGenerateDocsResponse = {
  documentation: `# Events

## \`connect\`

Emitted when a connection is established.

- **Category**: lifecycle
- **Payload**: Connection object

## \`data\`

Emitted when data is received.

- **Category**: data
- **Payload**: Buffer or string

## \`error\`

Emitted when an error occurs.

- **Category**: error
- **Severity**: high
- **Payload**: Error object
`,
};

// =============================================================================
// EXPLAIN EMITTER RESPONSES
// =============================================================================

/** Mock response for explain */
export const mockExplainResponse = {
  explanation: 'HTTP server emitter handling connection lifecycle (connect, disconnect), data transfer (data, message), and error handling (error).',
};

/** Mock response for explain - simple */
export const mockExplainSimpleResponse = {
  explanation: 'EventEmitter with basic event handling.',
};

// =============================================================================
// ANALYZE FLOW RESPONSES
// =============================================================================

/** Mock response for analyzeFlow */
export const mockAnalyzeFlowResponse = {
  events: { request: 150, response: 148, error: 2 },
  patterns: [
    'request events are typically followed by response events',
    'errors occur sporadically with no clear pattern',
  ],
  anomalies: [
    '2 missing responses for requests',
  ],
};

/** Mock response for analyzeFlow - clean */
export const mockAnalyzeFlowCleanResponse = {
  events: { connect: 10, data: 100, close: 10 },
  patterns: ['connect always paired with close', 'data events occur between connect and close'],
  anomalies: [],
};

// =============================================================================
// DETECT ISSUE RESPONSES
// =============================================================================

/** Mock response for detectIssue - has issue */
export const mockDetectIssueFoundResponse = {
  hasIssue: true,
  issue: 'High frequency of error events detected',
  severity: 'high',
};

/** Mock response for detectIssue - no issue */
export const mockDetectIssueNoneResponse = {
  hasIssue: false,
  issue: null,
  severity: null,
};

// =============================================================================
// MOCK CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock LLM client that returns the specified response
 */
export function createMockLLMClient(responseContent: object | string): LLMClient {
  const content =
    typeof responseContent === 'string'
      ? responseContent
      : JSON.stringify(responseContent);

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.resolve({
        content,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that returns different responses sequentially
 */
export function createSequentialMockLLMClient(
  responses: (object | string)[]
): LLMClient {
  let callIndex = 0;

  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      const content =
        typeof response === 'string' ? response : JSON.stringify(response);
      return Promise.resolve({
        content,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      });
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() =>
      Promise.resolve({
        content: '',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
      })
    ),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}

/**
 * Create a mock LLM client that throws an error
 */
export function createErrorMockLLMClient(error: Error): LLMClient {
  const mockComplete = mock(
    (_options: CompletionOptions): Promise<LLMResponse> => {
      return Promise.reject(error);
    }
  );

  return {
    complete: mockComplete,
    chat: mock(() => Promise.reject(error)),
    withProvider: mock(function (this: LLMClient) {
      return this;
    }),
  } as unknown as LLMClient;
}
