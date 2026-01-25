/**
 * SemanticEventEmitter
 * An EventEmitter wrapper with LLM-powered semantic understanding
 *
 * Implements intelligent event handling, pattern detection, and event flow analysis.
 */

import { EventEmitter } from 'events';
import type { LLMClient } from '../../llm/client.ts';
import { getClient } from '../../llm/client.ts';
import {
  EVENT_EMITTER_SYSTEM_PROMPT,
  createClassifyEventPrompt,
  createMatchEventCriteriaPrompt,
  createValidateHandlersPrompt,
  createSuggestHandlersPrompt,
  createValidateEventNamePrompt,
  createGenerateDocsPrompt,
  createExplainEmitterPrompt,
  createAnalyzeFlowPrompt,
} from './prompts.ts';

/** Result of event classification */
export interface EventClassifyResult {
  category: string;
  severity?: 'low' | 'medium' | 'high';
  recoverable?: boolean;
}

/** Result of handler validation */
export interface ValidateHandlersResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

/** Result of event name validation */
export interface ValidateEventNameResult {
  valid: boolean;
  suggestions: string[];
}

/** Handler suggestion */
export interface HandlerSuggestion {
  event: string;
  reason: string;
  example: string;
}

/** Event flow analysis result */
export interface AnalyzeFlowResult {
  events: Record<string, number>;
  patterns: string[];
  anomalies: string[];
}

/** Monitoring options */
export interface MonitorOptions {
  reportInterval?: number;
  onIssue?: (issue: string) => void;
}

/** Internal event tracking for flow analysis */
interface EventRecord {
  event: string;
  timestamp: number;
}

/**
 * SemanticEventEmitter - EventEmitter with LLM-powered semantic understanding
 *
 * Wraps a native EventEmitter and adds intelligent event handling,
 * pattern detection, and event flow analysis capabilities.
 */
export class SemanticEventEmitter {
  readonly [Symbol.toStringTag] = 'SemanticEventEmitter';

  private readonly _emitter: EventEmitter;
  private readonly _context?: string;
  private readonly _client: LLMClient;
  private readonly _eventRecords: EventRecord[] = [];
  private readonly _semanticHandlers = new Map<string, Set<(event: string, data: unknown) => void>>();
  private _isMonitoring = false;

  private constructor(
    emitter: EventEmitter,
    context?: string,
    client?: LLMClient
  ) {
    this._emitter = emitter;
    this._context = context;
    this._client = client ?? getClient();
  }

  /**
   * Wrap an EventEmitter with semantic capabilities.
   *
   * @param emitter - EventEmitter to wrap
   * @param context - Context about the emitter's purpose
   * @param client - Optional LLM client
   * @returns SemanticEventEmitter instance
   *
   * @example
   * SemanticEventEmitter.from(server, "HTTP server events")
   */
  static from(
    emitter: EventEmitter,
    context?: string,
    client?: LLMClient
  ): SemanticEventEmitter {
    if (emitter instanceof SemanticEventEmitter) {
      return emitter;
    }
    return new SemanticEventEmitter(emitter, context, client);
  }

  /**
   * Get the underlying EventEmitter.
   */
  get emitter(): EventEmitter {
    return this._emitter;
  }

  /**
   * Get the context description.
   */
  get context(): string | undefined {
    return this._context;
  }

  /**
   * Get all event names that have listeners.
   */
  eventNames(): (string | symbol)[] {
    return this._emitter.eventNames();
  }

  /**
   * Get the listener count for an event.
   */
  listenerCount(eventName: string | symbol): number {
    return this._emitter.listenerCount(eventName);
  }

  /**
   * Add a listener for an event.
   */
  on(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    this._emitter.on(eventName, listener);
    return this;
  }

  /**
   * Add a one-time listener for an event.
   */
  once(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    this._emitter.once(eventName, listener);
    return this;
  }

  /**
   * Remove a listener for an event.
   */
  off(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    this._emitter.off(eventName, listener);
    return this;
  }

  /**
   * Remove a listener for an event (alias for off).
   */
  removeListener(eventName: string | symbol, listener: (...args: unknown[]) => void): this {
    this._emitter.removeListener(eventName, listener);
    return this;
  }

  /**
   * Remove all listeners for an event.
   */
  removeAllListeners(eventName?: string | symbol): this {
    this._emitter.removeAllListeners(eventName);
    return this;
  }

  /**
   * Emit an event.
   */
  emit(eventName: string | symbol, ...args: unknown[]): boolean {
    // Track event for flow analysis
    if (typeof eventName === 'string') {
      this._eventRecords.push({
        event: eventName,
        timestamp: Date.now(),
      });
      // Keep only last 1000 events
      if (this._eventRecords.length > 1000) {
        this._eventRecords.shift();
      }
    }
    return this._emitter.emit(eventName, ...args);
  }

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
  onSemantic(criteria: string, handler: (event: string, data: unknown) => void): this {
    // Store the handler
    if (!this._semanticHandlers.has(criteria)) {
      this._semanticHandlers.set(criteria, new Set());
    }
    const handlerSet = this._semanticHandlers.get(criteria);
    if (handlerSet) {
      handlerSet.add(handler);
    }

    // Create a wrapper that checks each event
    const wrappedListener = async (...args: unknown[]): Promise<void> => {
      const eventName = args[0] as string;
      const eventData = args[1];

      try {
        const prompt = createMatchEventCriteriaPrompt(eventName, criteria, eventData);
        const response = await this._client.complete({
          prompt,
          systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
          temperature: 0.1,
        });

        const result = JSON.parse(response.content) as { matches: boolean; confidence: number };
        if (result.matches && result.confidence >= 0.7) {
          handler(eventName, eventData);
        }
      } catch {
        // On LLM failure, fall back to simple string matching
        const normalizedCriteria = criteria.toLowerCase();
        const normalizedEvent = eventName.toLowerCase();
        if (
          normalizedEvent.includes('error') && normalizedCriteria.includes('error') ||
          normalizedEvent.includes('connect') && normalizedCriteria.includes('network') ||
          normalizedEvent.includes('data') && normalizedCriteria.includes('data')
        ) {
          handler(eventName, eventData);
        }
      }
    };

    // Hook into newListener to catch all events
    this._emitter.on('newListener', (event: string): void => {
      // Set up listener for each new event to evaluate against criteria
      this._emitter.on(event, (...eventArgs: unknown[]): void => {
        void wrappedListener(event, ...eventArgs);
      });
    });

    // Also set up listeners for existing events
    const existingEvents = this._emitter.eventNames();
    for (const event of existingEvents) {
      if (typeof event === 'string' && event !== 'newListener' && event !== 'removeListener') {
        this._emitter.on(event, (...eventArgs: unknown[]): void => {
          void wrappedListener(event, ...eventArgs);
        });
      }
    }

    return this;
  }

  /**
   * Remove a semantic handler.
   */
  offSemantic(criteria: string, handler: (event: string, data: unknown) => void): this {
    const handlers = this._semanticHandlers.get(criteria);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this._semanticHandlers.delete(criteria);
      }
    }
    return this;
  }

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
  async analyzeFlow(duration: number): Promise<AnalyzeFlowResult> {
    const startTime = Date.now();
    const eventCounts: Record<string, number> = {};
    const eventSequence: EventRecord[] = [];

    // Set up temporary listeners on all events
    const trackedEvents = new Set<string>();
    const trackingListeners = new Map<string, (...args: unknown[]) => void>();

    const setupTracker = (event: string): void => {
      if (trackedEvents.has(event)) return;
      trackedEvents.add(event);

      const listener = (): void => {
        eventCounts[event] = (eventCounts[event] || 0) + 1;
        eventSequence.push({
          event,
          timestamp: Date.now() - startTime,
        });
      };
      trackingListeners.set(event, listener);
      this._emitter.on(event, listener);
    };

    // Track existing events
    for (const event of this._emitter.eventNames()) {
      if (typeof event === 'string') {
        setupTracker(event);
      }
    }

    // Track new events as they're added
    const newListenerHandler = (event: string): void => {
      if (typeof event === 'string') {
        setupTracker(event);
      }
    };
    this._emitter.on('newListener', newListenerHandler);

    // Wait for the specified duration
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Clean up listeners
    this._emitter.off('newListener', newListenerHandler);
    for (const [event, listener] of trackingListeners) {
      this._emitter.off(event, listener);
    }

    // Analyze with LLM
    const prompt = createAnalyzeFlowPrompt(
      eventCounts,
      eventSequence,
      duration,
      this._context
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.2,
      });

      return JSON.parse(response.content) as AnalyzeFlowResult;
    } catch {
      // Return basic analysis on LLM failure
      return {
        events: eventCounts,
        patterns: [],
        anomalies: [],
      };
    }
  }

  /**
   * Validate event handlers are properly set up.
   *
   * @returns Validation result
   *
   * @example
   * emitter.validateHandlers()
   * // { valid: false, issues: ["error event has no handler"] }
   */
  validateHandlers(): ValidateHandlersResult {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );
    const listenerCounts: Record<string, number> = {};
    for (const event of registeredEvents) {
      listenerCounts[event] = this._emitter.listenerCount(event);
    }

    // Synchronous validation for common issues
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for missing error handler
    const hasErrorHandler = registeredEvents.includes('error') &&
      this._emitter.listenerCount('error') > 0;
    if (!hasErrorHandler) {
      issues.push('No error handler registered. Unhandled errors will crash the process.');
      suggestions.push('Add an error handler: emitter.on("error", (err) => { /* handle */ })');
    }

    // Check for too many listeners
    for (const event of registeredEvents) {
      const count = listenerCounts[event] ?? 0;
      const max = this._emitter.getMaxListeners();
      if (count > max * 0.8) {
        issues.push(`Event "${event}" has ${count} listeners, approaching max of ${max}.`);
        suggestions.push(`Consider consolidating listeners for "${event}" or increasing max listeners.`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Validate event handlers asynchronously with LLM analysis.
   */
  async validateHandlersAsync(): Promise<ValidateHandlersResult> {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );
    const listenerCounts: Record<string, number> = {};
    for (const event of registeredEvents) {
      listenerCounts[event] = this._emitter.listenerCount(event);
    }

    const prompt = createValidateHandlersPrompt(
      registeredEvents,
      listenerCounts,
      this._context
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      return JSON.parse(response.content) as ValidateHandlersResult;
    } catch {
      // Fall back to synchronous validation
      return this.validateHandlers();
    }
  }

  /**
   * Explain what events this emitter handles.
   *
   * @returns Human-readable explanation
   *
   * @example
   * emitter.explain()
   * // "HTTP server emitter with request, response, error, and close events"
   */
  explain(): string {
    const events = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );

    if (events.length === 0) {
      return this._context
        ? `${this._context} with no registered events`
        : 'EventEmitter with no registered events';
    }

    const eventList = events.slice(0, 5).join(', ');
    const suffix = events.length > 5 ? ` and ${events.length - 5} more` : '';

    return this._context
      ? `${this._context} handling: ${eventList}${suffix}`
      : `EventEmitter handling: ${eventList}${suffix}`;
  }

  /**
   * Explain with LLM-powered semantic analysis.
   */
  async explainAsync(): Promise<string> {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );
    const listenerCounts: Record<string, number> = {};
    for (const event of registeredEvents) {
      listenerCounts[event] = this._emitter.listenerCount(event);
    }

    if (registeredEvents.length === 0) {
      return this.explain();
    }

    const prompt = createExplainEmitterPrompt(
      registeredEvents,
      listenerCounts,
      this._context
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const result = JSON.parse(response.content) as { explanation: string };
      return result.explanation;
    } catch {
      return this.explain();
    }
  }

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
  classifyEvent(eventName: string): EventClassifyResult {
    // Synchronous classification based on common patterns
    const lowerName = eventName.toLowerCase();

    if (lowerName.includes('error') || lowerName.includes('fail') || lowerName.includes('exception')) {
      return {
        category: 'error',
        severity: lowerName.includes('fatal') || lowerName.includes('critical') ? 'high' : 'medium',
        recoverable: !lowerName.includes('fatal') && !lowerName.includes('unrecoverable'),
      };
    }

    if (lowerName.includes('connect') || lowerName.includes('open') || lowerName.includes('close') ||
        lowerName.includes('disconnect') || lowerName.includes('ready') || lowerName.includes('end')) {
      return {
        category: 'lifecycle',
        severity: undefined,
        recoverable: undefined,
      };
    }

    if (lowerName.includes('data') || lowerName.includes('message') || lowerName.includes('update')) {
      return {
        category: 'data',
        severity: undefined,
        recoverable: undefined,
      };
    }

    if (lowerName.includes('click') || lowerName.includes('press') || lowerName.includes('input') ||
        lowerName.includes('submit') || lowerName.includes('focus')) {
      return {
        category: 'user-action',
        severity: undefined,
        recoverable: undefined,
      };
    }

    return {
      category: 'unknown',
      severity: undefined,
      recoverable: undefined,
    };
  }

  /**
   * Classify event with LLM-powered semantic analysis.
   */
  async classifyEventAsync(eventName: string): Promise<EventClassifyResult> {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );

    const prompt = createClassifyEventPrompt(
      eventName,
      this._context,
      registeredEvents
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      return JSON.parse(response.content) as EventClassifyResult;
    } catch {
      return this.classifyEvent(eventName);
    }
  }

  /**
   * Suggest event handlers based on registered events.
   *
   * @returns Suggested handlers
   *
   * @example
   * emitter.suggestHandlers()
   * // [{ event: "error", reason: "Unhandled errors will crash the process" }]
   */
  suggestHandlers(): HandlerSuggestion[] {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );
    const existingHandlers = registeredEvents.filter(
      (e) => this._emitter.listenerCount(e) > 0
    );

    const suggestions: HandlerSuggestion[] = [];

    // Always suggest error handler if missing
    if (!existingHandlers.includes('error')) {
      suggestions.push({
        event: 'error',
        reason: 'Unhandled errors will crash the process in Node.js',
        example: 'emitter.on("error", (err) => console.error("Error:", err))',
      });
    }

    // Suggest close/end handler if there's open/connect
    if ((existingHandlers.includes('open') || existingHandlers.includes('connect')) &&
        !existingHandlers.includes('close') && !existingHandlers.includes('end')) {
      suggestions.push({
        event: 'close',
        reason: 'Resource cleanup is needed when connection closes',
        example: 'emitter.on("close", () => { /* cleanup resources */ })',
      });
    }

    return suggestions;
  }

  /**
   * Suggest handlers with LLM-powered analysis.
   */
  async suggestHandlersAsync(): Promise<HandlerSuggestion[]> {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );
    const existingHandlers = registeredEvents.filter(
      (e) => this._emitter.listenerCount(e) > 0
    );

    const prompt = createSuggestHandlersPrompt(
      registeredEvents,
      existingHandlers,
      this._context
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const result = JSON.parse(response.content) as { suggestions: HandlerSuggestion[] };
      return result.suggestions;
    } catch {
      return this.suggestHandlers();
    }
  }

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
  validateEventName(eventName: string): ValidateEventNameResult {
    const suggestions: string[] = [];

    // Check for valid characters
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(eventName) &&
        !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(eventName)) {
      suggestions.push('Event name contains unusual characters');
    }

    // Check naming convention
    const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(eventName);
    const isSnakeCase = /^[a-z][a-z0-9_]*$/.test(eventName);
    const isKebabCase = /^[a-z][a-z0-9-]*$/.test(eventName);
    const isScreamingSnake = /^[A-Z][A-Z0-9_]*$/.test(eventName);

    // Get existing event naming patterns
    const existingEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string' && e !== eventName
    );

    const existingCamelCase = existingEvents.filter((e) => /^[a-z][a-zA-Z0-9]*$/.test(e));
    const existingSnakeCase = existingEvents.filter((e) => /^[a-z][a-z0-9_]*$/.test(e));

    if (existingCamelCase.length > existingSnakeCase.length && !isCamelCase) {
      suggestions.push(`Consider using camelCase to match existing events: ${toCamelCase(eventName)}`);
    } else if (existingSnakeCase.length > existingCamelCase.length && !isSnakeCase) {
      suggestions.push(`Consider using snake_case to match existing events: ${toSnakeCase(eventName)}`);
    }

    // Suggest improvements for screaming snake case
    if (isScreamingSnake) {
      suggestions.push(`Consider using camelCase: ${toCamelCase(eventName)}`);
    }

    return {
      valid: suggestions.length === 0 || (isCamelCase || isSnakeCase || isKebabCase),
      suggestions,
    };
  }

  /**
   * Validate event name with LLM-powered analysis.
   */
  async validateEventNameAsync(eventName: string): Promise<ValidateEventNameResult> {
    const existingEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );

    const prompt = createValidateEventNamePrompt(eventName, existingEvents);

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.1,
      });

      return JSON.parse(response.content) as ValidateEventNameResult;
    } catch {
      return this.validateEventName(eventName);
    }
  }

  /**
   * Generate documentation for all registered events.
   *
   * @returns Event documentation
   */
  generateDocs(): string {
    const events = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );

    if (events.length === 0) {
      return '# Events\n\nNo events registered.';
    }

    let docs = `# Events\n\n`;
    if (this._context) {
      docs += `${this._context}\n\n`;
    }

    for (const event of events) {
      const listenerCount = this._emitter.listenerCount(event);
      const classification = this.classifyEvent(event);

      docs += `## \`${event}\`\n\n`;
      docs += `- **Category**: ${classification.category}\n`;
      if (classification.severity) {
        docs += `- **Severity**: ${classification.severity}\n`;
      }
      docs += `- **Listeners**: ${listenerCount}\n`;
      docs += `\n`;
    }

    return docs;
  }

  /**
   * Generate documentation with LLM-powered descriptions.
   */
  async generateDocsAsync(): Promise<string> {
    const registeredEvents = this._emitter.eventNames().filter(
      (e): e is string => typeof e === 'string'
    );
    const listenerCounts: Record<string, number> = {};
    for (const event of registeredEvents) {
      listenerCounts[event] = this._emitter.listenerCount(event);
    }

    if (registeredEvents.length === 0) {
      return this.generateDocs();
    }

    const prompt = createGenerateDocsPrompt(
      registeredEvents,
      listenerCounts,
      this._context
    );

    try {
      const response = await this._client.complete({
        prompt,
        systemPrompt: EVENT_EMITTER_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const result = JSON.parse(response.content) as { documentation: string };
      return result.documentation;
    } catch {
      return this.generateDocs();
    }
  }

  /**
   * Monitor events and report issues.
   *
   * @param options - Monitoring options
   * @returns Cleanup function
   */
  monitor(options?: MonitorOptions): () => void {
    const { reportInterval = 5000, onIssue } = options ?? {};
    this._isMonitoring = true;

    const eventCounts: Record<string, number> = {};
    const recentEvents: EventRecord[] = [];

    // Track all events
    const trackedEvents = new Set<string>();
    const listeners = new Map<string, (...args: unknown[]) => void>();

    const setupTracker = (event: string): void => {
      if (trackedEvents.has(event)) return;
      trackedEvents.add(event);

      const listener = (): void => {
        eventCounts[event] = (eventCounts[event] || 0) + 1;
        recentEvents.push({ event, timestamp: Date.now() });

        // Keep only recent events
        while (recentEvents.length > 100) {
          recentEvents.shift();
        }

        // Check for issues synchronously (common patterns)
        if (event.toLowerCase().includes('error') && onIssue) {
          onIssue(`Error event "${event}" occurred`);
        }
      };

      listeners.set(event, listener);
      this._emitter.on(event, listener);
    };

    // Track existing events
    for (const event of this._emitter.eventNames()) {
      if (typeof event === 'string') {
        setupTracker(event);
      }
    }

    // Track new events
    const newListenerHandler = (event: string): void => {
      if (typeof event === 'string') {
        setupTracker(event);
      }
    };
    this._emitter.on('newListener', newListenerHandler);

    // Periodic reporting with issue detection
    const intervalId = setInterval((): void => {
      if (!this._isMonitoring || !onIssue) return;

      // Check for anomalies
      const errorEvents = Object.entries(eventCounts)
        .filter(([event]) => event.toLowerCase().includes('error'))
        .map(([event, count]) => ({ event, count }));

      for (const { event, count } of errorEvents) {
        if (count > 10) {
          onIssue(`High error rate detected: ${event} occurred ${count} times`);
        }
      }
    }, reportInterval);

    // Return cleanup function
    return () => {
      this._isMonitoring = false;
      clearInterval(intervalId);
      this._emitter.off('newListener', newListenerHandler);
      for (const [event, listener] of listeners) {
        this._emitter.off(event, listener);
      }
    };
  }
}

// Helper functions for case conversion
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[_-](.)/g, (_match: string, char: string) => char.toUpperCase())
    .replace(/^(.)/, (_match: string, char: string) => char.toLowerCase());
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/-/g, '_');
}
