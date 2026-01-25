/**
 * Prompts for SemanticEventEmitter LLM operations
 * These prompts enable intelligent event handling, pattern detection, and event flow analysis
 */

/**
 * System prompt for event emitter analysis tasks
 */
export const EVENT_EMITTER_SYSTEM_PROMPT = `You are an expert at analyzing event-driven architectures, understanding event emitter patterns, and providing semantic insights about pub/sub communication.

You must respond with valid JSON only, no additional text or explanation.

Guidelines:
- Analyze event names, patterns, and flows to understand their semantics
- Consider common event-driven patterns in Node.js and browser environments
- Provide meaningful, contextual responses about event handling
- Be precise with classifications and recommendations`;

/**
 * Prompt template for classifying an event based on its name
 */
export function createClassifyEventPrompt(
  eventName: string,
  context?: string,
  registeredEvents?: string[]
): string {
  return `Classify this event based on its name and context.

Event Name: "${eventName}"
${context ? `Emitter Context: "${context}"` : ''}
${registeredEvents?.length ? `Other Registered Events: ${registeredEvents.join(', ')}` : ''}

Determine:
- The category (e.g., lifecycle, error, data, user-action, system, network, state-change)
- The severity level for error-related events
- Whether the event represents something recoverable

Common event patterns:
- "error", "exception", "failure" → error category
- "connect", "disconnect", "open", "close" → lifecycle category
- "data", "message", "update" → data category
- "click", "input", "submit" → user-action category
- "ready", "init", "start", "stop" → lifecycle category

Respond with JSON in this exact format:
{
  "category": "the event category",
  "severity": "low" | "medium" | "high" | null,
  "recoverable": true | false | null
}`;
}

/**
 * Prompt template for matching events against semantic criteria
 */
export function createMatchEventCriteriaPrompt(
  eventName: string,
  criteria: string,
  eventData?: unknown
): string {
  return `Determine if this event matches the given semantic criteria.

Event Name: "${eventName}"
Criteria: "${criteria}"
${eventData !== undefined ? `Event Data: ${JSON.stringify(eventData, null, 2)}` : ''}

Examples of criteria matching:
- "any error event" matches: "error", "connectionError", "parseError", "uncaughtException"
- "user interaction" matches: "click", "keypress", "submit", "focus"
- "network related" matches: "connect", "disconnect", "timeout", "request", "response"
- "data updates" matches: "dataChange", "update", "sync", "refresh"

Respond with JSON in this exact format:
{
  "matches": true | false,
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation"
}`;
}

/**
 * Prompt template for validating event handlers
 */
export function createValidateHandlersPrompt(
  registeredEvents: string[],
  listenerCounts: Record<string, number>,
  context?: string
): string {
  return `Validate the event handler setup for this emitter.

${context ? `Emitter Context: "${context}"` : 'Emitter Context: unknown'}
Registered Events: ${registeredEvents.length > 0 ? registeredEvents.join(', ') : 'none'}
Listener Counts: ${JSON.stringify(listenerCounts)}

Check for:
1. Missing error handlers (critical - unhandled errors crash Node.js)
2. Events with no listeners that typically need handling
3. Potential memory leaks from too many listeners
4. Events that usually come in pairs (open/close, connect/disconnect)

Respond with JSON in this exact format:
{
  "valid": true | false,
  "issues": ["array of identified issues"],
  "suggestions": ["array of suggestions to improve handler setup"]
}`;
}

/**
 * Prompt template for suggesting event handlers
 */
export function createSuggestHandlersPrompt(
  registeredEvents: string[],
  existingHandlers: string[],
  context?: string
): string {
  return `Suggest event handlers that should be added to this emitter.

${context ? `Emitter Context: "${context}"` : 'Emitter Context: unknown'}
Registered Events: ${registeredEvents.length > 0 ? registeredEvents.join(', ') : 'none'}
Events With Handlers: ${existingHandlers.length > 0 ? existingHandlers.join(', ') : 'none'}

Consider:
1. Critical handlers (especially "error" for any emitter)
2. Lifecycle handlers based on context
3. Data flow handlers
4. Cleanup and resource management handlers

Provide practical code examples for each suggestion.

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "event": "event name to handle",
      "reason": "why this handler is needed",
      "example": "example code snippet"
    }
  ]
}`;
}

/**
 * Prompt template for validating event names
 */
export function createValidateEventNamePrompt(
  eventName: string,
  existingEvents?: string[]
): string {
  return `Validate this event name against common naming conventions.

Event Name: "${eventName}"
${existingEvents?.length ? `Existing Events in System: ${existingEvents.join(', ')}` : ''}

Check for:
1. Naming convention consistency (camelCase, snake_case, kebab-case, SCREAMING_SNAKE_CASE)
2. Descriptive and clear naming
3. Consistency with existing event names
4. Reserved or problematic names
5. Length and complexity

Respond with JSON in this exact format:
{
  "valid": true | false,
  "suggestions": ["array of improvement suggestions"]
}`;
}

/**
 * Prompt template for generating event documentation
 */
export function createGenerateDocsPrompt(
  registeredEvents: string[],
  listenerCounts: Record<string, number>,
  context?: string
): string {
  return `Generate documentation for this event emitter's events.

${context ? `Emitter Context: "${context}"` : 'Emitter Context: unknown'}
Registered Events: ${registeredEvents.join(', ')}
Listener Counts: ${JSON.stringify(listenerCounts)}

Generate clear, concise documentation that includes:
1. A description of each event
2. When it's typically emitted
3. Expected payload type (inferred from event name)
4. Usage example

Format as markdown documentation.

Respond with JSON in this exact format:
{
  "documentation": "markdown formatted documentation string"
}`;
}

/**
 * Prompt template for explaining what the emitter handles
 */
export function createExplainEmitterPrompt(
  registeredEvents: string[],
  listenerCounts: Record<string, number>,
  context?: string
): string {
  return `Explain what this event emitter handles in a human-readable way.

${context ? `Emitter Context: "${context}"` : 'Emitter Context: unknown'}
Registered Events: ${registeredEvents.join(', ')}
Listener Counts: ${JSON.stringify(listenerCounts)}

Provide a concise, clear explanation that:
1. Summarizes the purpose of this emitter
2. Groups related events logically
3. Highlights key events and their roles

Respond with JSON in this exact format:
{
  "explanation": "human-readable explanation string"
}`;
}

/**
 * Prompt template for analyzing event flow patterns
 */
export function createAnalyzeFlowPrompt(
  eventCounts: Record<string, number>,
  eventSequence: { event: string; timestamp: number }[],
  duration: number,
  context?: string
): string {
  // Calculate some basic statistics
  const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
  const avgEventsPerSecond = totalEvents / (duration / 1000);

  return `Analyze the event flow patterns from this monitoring data.

${context ? `Emitter Context: "${context}"` : 'Emitter Context: unknown'}
Monitoring Duration: ${duration}ms (${(duration / 1000).toFixed(1)} seconds)
Total Events: ${totalEvents}
Average Events/Second: ${avgEventsPerSecond.toFixed(2)}

Event Counts:
${JSON.stringify(eventCounts, null, 2)}

Recent Event Sequence (last 50):
${JSON.stringify(eventSequence.slice(-50).map(e => ({
  event: e.event,
  relativeTime: e.timestamp
})), null, 2)}

Analyze for:
1. Recurring patterns (e.g., "request always followed by response")
2. Unusual spikes or anomalies
3. Missing expected events
4. Performance concerns
5. Error patterns

Respond with JSON in this exact format:
{
  "events": ${JSON.stringify(eventCounts)},
  "patterns": ["array of detected patterns"],
  "anomalies": ["array of detected anomalies or issues"]
}`;
}

/**
 * Prompt template for detecting monitoring issues
 */
export function createDetectIssuePrompt(
  event: string,
  eventCounts: Record<string, number>,
  recentEvents: { event: string; timestamp: number }[],
  context?: string
): string {
  return `Check if this event indicates any issues worth reporting.

Event: "${event}"
${context ? `Emitter Context: "${context}"` : ''}
Current Event Counts: ${JSON.stringify(eventCounts)}
Recent Events: ${JSON.stringify(recentEvents.slice(-10))}

Check for:
1. Error events that need attention
2. Unusual event frequency
3. Missing paired events (e.g., open without close)
4. Potential memory or resource issues

Respond with JSON in this exact format:
{
  "hasIssue": true | false,
  "issue": "description of the issue or null",
  "severity": "low" | "medium" | "high" | null
}`;
}
