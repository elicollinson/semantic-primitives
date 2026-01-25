# SemanticEventEmitter

## Overview

The `SemanticEventEmitter` type wraps Node.js EventEmitter with LLM-powered semantic understanding. It enables intelligent event handling, pattern detection, and event flow analysis.

**Core Principle**: EventEmitters represent pub/sub communication - semantic operations should understand event purposes, detect patterns, and validate event flows.

---

## Interface

```typescript
interface SemanticEventEmitter extends EventEmitter {
  /**
   * Wrap an EventEmitter with semantic capabilities.
   *
   * @param emitter - EventEmitter to wrap
   * @param context - Context about the emitter's purpose
   * @returns SemanticEventEmitter instance
   *
   * @example
   * SemanticEventEmitter.from(server, "HTTP server events")
   */
  static from(emitter: EventEmitter, context?: string): SemanticEventEmitter;

  /**
   * Listen for events matching semantic criteria.
   *
   * @param criteria - Natural language description of events to listen for
   * @param handler - Event handler
   * @returns this (for chaining)
   *
   * @example
   * emitter.onSemantic("any error event", (event, data) => console.log(data))
   */
  onSemantic(criteria: string, handler: (event: string, data: unknown) => void): this;

  /**
   * Analyze the event flow of this emitter.
   *
   * @param duration - Time to analyze (ms)
   * @returns Event flow analysis
   *
   * @example
   * emitter.analyzeFlow(60000)
   * // {
   * //   events: { "request": 150, "error": 3 },
   * //   patterns: ["request always followed by response"],
   * //   anomalies: ["error spike at minute 3"]
   * // }
   */
  analyzeFlow(duration: number): Promise<{
    events: Record<string, number>;
    patterns: string[];
    anomalies: string[];
  }>;

  /**
   * Validate event handlers are properly set up.
   *
   * @returns Validation result
   *
   * @example
   * emitter.validateHandlers()
   * // { valid: false, issues: ["error event has no handler"] }
   */
  validateHandlers(): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  };

  /**
   * Explain what events this emitter handles.
   *
   * @returns Human-readable explanation
   *
   * @example
   * emitter.explain()
   * // "HTTP server emitter with request, response, error, and close events"
   */
  explain(): string;

  /**
   * Detect the category/purpose of an event.
   *
   * @param eventName - Event name to analyze
   * @returns Event classification
   *
   * @example
   * emitter.classifyEvent("connection_error")
   * // { category: "error", severity: "high", recoverable: true }
   */
  classifyEvent(eventName: string): {
    category: string;
    severity?: "low" | "medium" | "high";
    recoverable?: boolean;
  };

  /**
   * Suggest event handlers based on registered events.
   *
   * @returns Suggested handlers
   *
   * @example
   * emitter.suggestHandlers()
   * // [{ event: "error", reason: "Unhandled errors will crash the process" }]
   */
  suggestHandlers(): Array<{
    event: string;
    reason: string;
    example: string;
  }>;

  /**
   * Check if an event name follows naming conventions.
   *
   * @param eventName - Event name to validate
   * @returns Validation result
   *
   * @example
   * emitter.validateEventName("USER_LOGIN")
   * // { valid: true, suggestions: ["Consider using camelCase: userLogin"] }
   */
  validateEventName(eventName: string): {
    valid: boolean;
    suggestions: string[];
  };

  /**
   * Generate documentation for all registered events.
   *
   * @returns Event documentation
   */
  generateDocs(): string;

  /**
   * Monitor events and report issues.
   *
   * @param options - Monitoring options
   * @returns Cleanup function
   */
  monitor(options?: {
    reportInterval?: number;
    onIssue?: (issue: string) => void;
  }): () => void;
}
```

---

## Implementation Notes

### Architecture

The `SemanticEventEmitter` uses a **composition pattern** rather than inheritance to wrap the native Node.js `EventEmitter`. This approach was chosen because:

1. `EventEmitter` doesn't extend classes easily in TypeScript
2. Composition allows adding semantic capabilities without modifying the underlying emitter behavior
3. The wrapped emitter remains accessible via the `.emitter` property for direct manipulation when needed

### Sync vs Async Methods

Most methods have both synchronous and asynchronous variants:

| Method | Sync | Async |
|--------|------|-------|
| `classifyEvent` | Pattern-based | LLM-powered with `classifyEventAsync` |
| `validateHandlers` | Common issue detection | LLM analysis with `validateHandlersAsync` |
| `suggestHandlers` | Basic suggestions | LLM-powered with `suggestHandlersAsync` |
| `validateEventName` | Convention checks | LLM analysis with `validateEventNameAsync` |
| `explain` | Simple description | LLM-powered with `explainAsync` |
| `generateDocs` | Basic markdown | LLM-powered with `generateDocsAsync` |

Synchronous methods provide fast, deterministic responses based on common patterns, while async methods leverage LLM for deeper semantic understanding.

### Event Tracking

The implementation tracks events internally for flow analysis:
- Events are recorded with timestamps for pattern detection
- A rolling buffer of 1000 events is maintained to prevent memory issues
- The `analyzeFlow()` method sets up temporary listeners during the analysis window

### Semantic Event Matching (`onSemantic`)

The `onSemantic` method uses LLM to match events against natural language criteria:
- Falls back to simple string matching if LLM fails
- Requires confidence >= 0.7 for a match
- Handlers are stored in a Map keyed by criteria for cleanup support

### Monitoring

The `monitor()` method provides real-time event monitoring:
- Tracks event counts across all registered events
- Detects common issues (error events, high error rates)
- Returns a cleanup function to stop monitoring and remove all listeners

### File Structure

```
src/types/event-emitter/
├── index.ts              # Module exports
├── event-emitter.ts      # Main SemanticEventEmitter class
├── prompts.ts            # LLM prompt templates
└── __tests__/
    ├── event-emitter.test.ts  # Unit tests (56 tests)
    └── mocks.ts               # Mock LLM clients and responses
```

### Exported Types

- `SemanticEventEmitter` - Main class
- `EventClassifyResult` - Result of event classification
- `ValidateHandlersResult` - Result of handler validation
- `ValidateEventNameResult` - Result of event name validation
- `HandlerSuggestion` - Suggested handler information
- `AnalyzeFlowResult` - Result of flow analysis
- `MonitorOptions` - Options for the monitor method
