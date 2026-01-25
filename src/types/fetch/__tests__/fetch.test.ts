import { describe, expect, test } from 'bun:test';
import { SemanticRequest } from '../request.ts';
import { SemanticResponse } from '../response.ts';
import { SemanticHeaders } from '../headers.ts';
import {
  createMockLLMClient,
  createKeywordMockLLMClient,
  mockRequestEquivalentResponse,
  mockRequestNotEquivalentResponse,
  mockAnalyzeIntentReadResponse,
  mockAnalyzeIntentCreateResponse,
  mockRequestValidResponse,
  mockRequestInvalidResponse,
  mockRequestExplainTechnicalResponse,
  mockRequestExplainNonTechnicalResponse,
  mockRequestSecuritySafeResponse,
  mockRequestSecurityUnsafeResponse,
  mockResponseEquivalentResponse,
  mockResponseNotEquivalentResponse,
  mockAnalyzeCollectionResponse,
  mockAnalyzeSingleResponse,
  mockSummarizeSuccessResponse,
  mockContractValidResponse,
  mockContractInvalidResponse,
  mockInterpretAuthErrorResponse,
  mockInterpretNotFoundErrorResponse,
  mockHeadersEquivalentResponse,
  mockHeadersNotEquivalentResponse,
  mockHeadersValidResponse,
  mockHeadersInvalidResponse,
  mockHeadersSuggestApiResponse,
  mockHeadersExplainResponse,
} from './mocks.ts';

// =============================================================================
// SEMANTIC REQUEST TESTS
// =============================================================================

describe('SemanticRequest', () => {
  describe('constructor', () => {
    test('creates instance from Request', () => {
      const request = new Request('https://api.example.com/users');
      const semanticRequest = new SemanticRequest(request);
      expect(semanticRequest.url).toBe('https://api.example.com/users');
      expect(semanticRequest.method).toBe('GET');
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const request = new Request('https://api.example.com/users');
      const semanticRequest = new SemanticRequest(request, mockClient);
      expect(semanticRequest.url).toBe('https://api.example.com/users');
    });
  });

  describe('static from()', () => {
    test('creates SemanticRequest from URL string', () => {
      const semanticRequest = SemanticRequest.from('https://api.example.com/users');
      expect(semanticRequest.url).toBe('https://api.example.com/users');
      expect(semanticRequest.method).toBe('GET');
    });

    test('creates SemanticRequest with RequestInit options', () => {
      const semanticRequest = SemanticRequest.from('https://api.example.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John' }),
      });
      expect(semanticRequest.method).toBe('POST');
      expect(semanticRequest.headers.get('Content-Type')).toBe('application/json');
    });

    test('creates SemanticRequest from existing Request', () => {
      const original = new Request('https://api.example.com/users', { method: 'DELETE' });
      const semanticRequest = SemanticRequest.from(original);
      expect(semanticRequest.method).toBe('DELETE');
    });

    test('creates SemanticRequest from URL object', () => {
      const url = new URL('https://api.example.com/users?page=1');
      const semanticRequest = SemanticRequest.from(url);
      expect(semanticRequest.url).toBe('https://api.example.com/users?page=1');
    });
  });

  describe('semanticallyEquals()', () => {
    test('identifies equivalent requests', async () => {
      const mockClient = createMockLLMClient(mockRequestEquivalentResponse);
      const req1 = SemanticRequest.from('https://api.example.com/users?a=1&b=2', undefined, mockClient);
      const req2 = new Request('https://api.example.com/users?b=2&a=1');

      const result = await req1.semanticallyEquals(req2);
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('identifies non-equivalent requests', async () => {
      const mockClient = createMockLLMClient(mockRequestNotEquivalentResponse);
      const req1 = SemanticRequest.from('https://api.example.com/users', { method: 'GET' }, mockClient);
      const req2 = new Request('https://api.example.com/users', { method: 'POST' });

      const result = await req1.semanticallyEquals(req2);
      expect(result.equivalent).toBe(false);
      expect(result.note).toContain('method');
    });

    test('compares with SemanticRequest', async () => {
      const mockClient = createMockLLMClient(mockRequestEquivalentResponse);
      const req1 = SemanticRequest.from('https://api.example.com/users', undefined, mockClient);
      const req2 = SemanticRequest.from('https://api.example.com/users', undefined, mockClient);

      const result = await req1.semanticallyEquals(req2);
      expect(result.equivalent).toBe(true);
    });
  });

  describe('analyzeIntent()', () => {
    test('analyzes READ operation intent', async () => {
      const mockClient = createMockLLMClient(mockAnalyzeIntentReadResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users?role=admin',
        { method: 'GET' },
        mockClient
      );

      const result = await request.analyzeIntent();
      expect(result.operation).toBe('READ');
      expect(result.resource).toBe('users');
      expect(result.filters).toBeDefined();
      expect(result.filters?.[0]?.field).toBe('role');
    });

    test('analyzes CREATE operation intent', async () => {
      const mockClient = createMockLLMClient(mockAnalyzeIntentCreateResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
        },
        mockClient
      );

      const result = await request.analyzeIntent();
      expect(result.operation).toBe('CREATE');
      expect(result.resource).toBe('users');
    });
  });

  describe('validate()', () => {
    test('validates request against default rules', async () => {
      const mockClient = createMockLLMClient(mockRequestValidResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John' }),
        },
        mockClient
      );

      const result = await request.validate();
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('validates request against custom rules', async () => {
      const mockClient = createMockLLMClient(mockRequestInvalidResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'John' }),
        },
        mockClient
      );

      const result = await request.validate(['body must have Content-Type header']);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('explain()', () => {
    test('explains request for technical audience', async () => {
      const mockClient = createMockLLMClient(mockRequestExplainTechnicalResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users?role=admin',
        { method: 'GET' },
        mockClient
      );

      const result = await request.explain('technical');
      expect(result).toContain('GET');
      expect(result).toContain('admin');
    });

    test('explains request for non-technical audience', async () => {
      const mockClient = createMockLLMClient(mockRequestExplainNonTechnicalResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users?role=admin',
        { method: 'GET' },
        mockClient
      );

      const result = await request.explain('non-technical');
      expect(result).toContain('admin users');
    });
  });

  describe('validateSecurity()', () => {
    test('validates secure request', async () => {
      const mockClient = createMockLLMClient(mockRequestSecuritySafeResponse);
      const request = SemanticRequest.from(
        'https://api.example.com/users',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer token123' },
        },
        mockClient
      );

      const result = await request.validateSecurity();
      expect(result.safe).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('identifies security issues', async () => {
      const mockClient = createMockLLMClient(mockRequestSecurityUnsafeResponse);
      const request = SemanticRequest.from(
        'http://api.example.com/users?token=secret123',
        { method: 'GET' },
        mockClient
      );

      const result = await request.validateSecurity();
      expect(result.safe).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('native Request properties', () => {
    test('exposes method property', () => {
      const request = SemanticRequest.from('https://api.example.com', { method: 'PUT' });
      expect(request.method).toBe('PUT');
    });

    test('exposes url property', () => {
      const request = SemanticRequest.from('https://api.example.com/path?q=test');
      expect(request.url).toBe('https://api.example.com/path?q=test');
    });

    test('exposes headers property', () => {
      const request = SemanticRequest.from('https://api.example.com', {
        headers: { 'X-Custom': 'value' },
      });
      expect(request.headers.get('X-Custom')).toBe('value');
    });

    test('clone() returns new SemanticRequest', () => {
      const original = SemanticRequest.from('https://api.example.com', { method: 'POST' });
      const cloned = original.clone();
      expect(cloned).toBeInstanceOf(SemanticRequest);
      expect(cloned.method).toBe('POST');
    });

    test('valueOf() returns Request', () => {
      const semanticRequest = SemanticRequest.from('https://api.example.com');
      const value = semanticRequest.valueOf();
      expect(value).toBeInstanceOf(Request);
    });

    test('text() returns body as text', async () => {
      const request = SemanticRequest.from('https://api.example.com', {
        method: 'POST',
        body: 'Hello World',
      });
      const text = await request.text();
      expect(text).toBe('Hello World');
    });

    test('json() returns body as JSON', async () => {
      const request = SemanticRequest.from('https://api.example.com', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      });
      const json = await request.json();
      expect(json).toEqual({ message: 'Hello' });
    });

    test('toString() returns string representation', () => {
      const request = SemanticRequest.from('https://api.example.com/users', { method: 'GET' });
      expect(request.toString()).toContain('SemanticRequest');
      expect(request.toString()).toContain('GET');
    });
  });
});

// =============================================================================
// SEMANTIC RESPONSE TESTS
// =============================================================================

describe('SemanticResponse', () => {
  describe('constructor', () => {
    test('creates instance from Response', () => {
      const response = new Response('{"data": "test"}', { status: 200 });
      const semanticResponse = new SemanticResponse(response);
      expect(semanticResponse.status).toBe(200);
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const response = new Response('test', { status: 200 });
      const semanticResponse = new SemanticResponse(response, mockClient);
      expect(semanticResponse.status).toBe(200);
    });
  });

  describe('static from()', () => {
    test('creates SemanticResponse from Response', () => {
      const response = new Response('test', { status: 201 });
      const semanticResponse = SemanticResponse.from(response);
      expect(semanticResponse.status).toBe(201);
    });
  });

  describe('semanticallyEquals()', () => {
    test('identifies equivalent responses', async () => {
      const mockClient = createMockLLMClient(mockResponseEquivalentResponse);
      const resp1 = SemanticResponse.from(
        new Response(JSON.stringify({ users: [] }), { status: 200 }),
        mockClient
      );
      const resp2 = new Response(JSON.stringify({ users: [] }), { status: 200 });

      const result = await resp1.semanticallyEquals(resp2);
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('identifies non-equivalent responses', async () => {
      const mockClient = createMockLLMClient(mockResponseNotEquivalentResponse);
      const resp1 = SemanticResponse.from(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
        mockClient
      );
      const resp2 = new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

      const result = await resp1.semanticallyEquals(resp2);
      expect(result.equivalent).toBe(false);
    });
  });

  describe('analyze()', () => {
    test('analyzes collection response', async () => {
      const mockClient = createMockLLMClient(mockAnalyzeCollectionResponse);
      const response = SemanticResponse.from(
        new Response(
          JSON.stringify({
            data: Array(25).fill({ id: 1, name: 'User' }),
            hasMore: true,
          }),
          { status: 200 }
        ),
        mockClient
      );

      const result = await response.analyze();
      expect(result.dataType).toBe('collection');
      expect(result.entityType).toBe('User');
      expect(result.count).toBe(25);
      expect(result.pagination?.hasMore).toBe(true);
    });

    test('analyzes single entity response', async () => {
      const mockClient = createMockLLMClient(mockAnalyzeSingleResponse);
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ id: 1, name: 'John', email: 'john@example.com' }), {
          status: 200,
        }),
        mockClient
      );

      const result = await response.analyze();
      expect(result.dataType).toBe('single');
      expect(result.entityType).toBe('User');
    });
  });

  describe('summarize()', () => {
    test('summarizes success response', async () => {
      const mockClient = createMockLLMClient(mockSummarizeSuccessResponse);
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ users: Array(25).fill({}) }), { status: 200 }),
        mockClient
      );

      const result = await response.summarize();
      expect(result).toContain('25');
      expect(result).toContain('user');
    });
  });

  describe('validateContract()', () => {
    test('validates response matching contract', async () => {
      const mockClient = createMockLLMClient(mockContractValidResponse);
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'X-Request-ID': '123' },
        }),
        mockClient
      );

      const result = await response.validateContract({
        status: [200],
        requiredHeaders: ['X-Request-ID'],
        schema: 'object with data array',
      });
      expect(result.valid).toBe(true);
    });

    test('identifies contract violations', async () => {
      const mockClient = createMockLLMClient(mockContractInvalidResponse);
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ data: [] }), { status: 201 }),
        mockClient
      );

      const result = await response.validateContract({
        status: [200],
        requiredHeaders: ['X-Request-ID'],
      });
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('interpretError()', () => {
    test('interprets authentication error', async () => {
      const mockClient = createMockLLMClient(mockInterpretAuthErrorResponse);
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
        mockClient
      );

      const result = await response.interpretError();
      expect(result.category).toBe('authentication');
      expect(result.retryable).toBe(true);
      expect(result.suggestedAction).toContain('token');
    });

    test('interprets not found error', async () => {
      const mockClient = createMockLLMClient(mockInterpretNotFoundErrorResponse);
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
        mockClient
      );

      const result = await response.interpretError();
      expect(result.category).toBe('not_found');
      expect(result.retryable).toBe(false);
    });
  });

  describe('native Response properties', () => {
    test('exposes status property', () => {
      const response = SemanticResponse.from(new Response('', { status: 204 }));
      expect(response.status).toBe(204);
    });

    test('exposes statusText property', () => {
      const response = SemanticResponse.from(new Response('', { status: 200, statusText: 'OK' }));
      expect(response.statusText).toBe('OK');
    });

    test('exposes ok property', () => {
      const okResponse = SemanticResponse.from(new Response('', { status: 200 }));
      const errorResponse = SemanticResponse.from(new Response('', { status: 500 }));
      expect(okResponse.ok).toBe(true);
      expect(errorResponse.ok).toBe(false);
    });

    test('exposes headers property', () => {
      const response = SemanticResponse.from(
        new Response('', { headers: { 'X-Custom': 'value' } })
      );
      expect(response.headers.get('X-Custom')).toBe('value');
    });

    test('clone() returns new SemanticResponse', () => {
      const original = SemanticResponse.from(new Response('test', { status: 200 }));
      const cloned = original.clone();
      expect(cloned).toBeInstanceOf(SemanticResponse);
      expect(cloned.status).toBe(200);
    });

    test('valueOf() returns Response', () => {
      const semanticResponse = SemanticResponse.from(new Response('test'));
      const value = semanticResponse.valueOf();
      expect(value).toBeInstanceOf(Response);
    });

    test('text() returns body as text', async () => {
      const response = SemanticResponse.from(new Response('Hello World'));
      const text = await response.text();
      expect(text).toBe('Hello World');
    });

    test('json() returns body as JSON', async () => {
      const response = SemanticResponse.from(
        new Response(JSON.stringify({ message: 'Hello' }))
      );
      const json = await response.json();
      expect(json).toEqual({ message: 'Hello' });
    });

    test('toString() returns string representation', () => {
      const response = SemanticResponse.from(
        new Response('', { status: 200 })
      );
      expect(response.toString()).toContain('SemanticResponse');
      expect(response.toString()).toContain('200');
    });
  });
});

// =============================================================================
// SEMANTIC HEADERS TESTS
// =============================================================================

describe('SemanticHeaders', () => {
  describe('constructor', () => {
    test('creates instance from Headers', () => {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const semanticHeaders = new SemanticHeaders(headers);
      expect(semanticHeaders.get('Content-Type')).toBe('application/json');
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const headers = new Headers();
      const semanticHeaders = new SemanticHeaders(headers, mockClient);
      expect(semanticHeaders).toBeInstanceOf(SemanticHeaders);
    });
  });

  describe('static from()', () => {
    test('creates SemanticHeaders from object', () => {
      const semanticHeaders = SemanticHeaders.from({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });
      expect(semanticHeaders.get('Content-Type')).toBe('application/json');
      expect(semanticHeaders.get('Authorization')).toBe('Bearer token');
    });

    test('creates SemanticHeaders from array', () => {
      const semanticHeaders = SemanticHeaders.from([
        ['Content-Type', 'application/json'],
        ['Accept', 'application/json'],
      ]);
      expect(semanticHeaders.get('Content-Type')).toBe('application/json');
      expect(semanticHeaders.get('Accept')).toBe('application/json');
    });

    test('creates SemanticHeaders from Headers', () => {
      const original = new Headers({ 'X-Custom': 'value' });
      const semanticHeaders = SemanticHeaders.from(original);
      expect(semanticHeaders.get('X-Custom')).toBe('value');
    });
  });

  describe('semanticallyEquals()', () => {
    test('identifies equivalent headers', async () => {
      const mockClient = createMockLLMClient(mockHeadersEquivalentResponse);
      const headers1 = SemanticHeaders.from(
        { 'Content-Type': 'application/json', Accept: 'application/json' },
        mockClient
      );
      const headers2 = new Headers({
        'content-type': 'application/json',
        accept: 'application/json',
      });

      const result = await headers1.semanticallyEquals(headers2);
      expect(result.equivalent).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    test('identifies non-equivalent headers', async () => {
      const mockClient = createMockLLMClient(mockHeadersNotEquivalentResponse);
      const headers1 = SemanticHeaders.from(
        { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
        mockClient
      );
      const headers2 = new Headers({ 'Content-Type': 'text/plain' });

      const result = await headers1.semanticallyEquals(headers2);
      expect(result.equivalent).toBe(false);
      expect(result.differences.length).toBeGreaterThan(0);
    });
  });

  describe('validate()', () => {
    test('validates correct headers', async () => {
      const mockClient = createMockLLMClient(mockHeadersValidResponse);
      const headers = SemanticHeaders.from(
        {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mockClient
      );

      const result = await headers.validate();
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('identifies header issues', async () => {
      const mockClient = createMockLLMClient(mockHeadersInvalidResponse);
      const headers = SemanticHeaders.from(
        {
          'Content-Type': 'invalid/type',
          'Cache-Control': 'no-cache, max-age=3600',
        },
        mockClient
      );

      const result = await headers.validate();
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]?.header).toBeDefined();
    });
  });

  describe('suggest()', () => {
    test('suggests headers for API context', async () => {
      const mockClient = createMockLLMClient(mockHeadersSuggestApiResponse);
      const headers = SemanticHeaders.from(
        { 'Content-Type': 'application/json' },
        mockClient
      );

      const result = await headers.suggest('API request');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.header).toBeDefined();
      expect(result[0]?.value).toBeDefined();
      expect(result[0]?.reason).toBeDefined();
    });

    test('suggests headers without context', async () => {
      const mockClient = createMockLLMClient(mockHeadersSuggestApiResponse);
      const headers = SemanticHeaders.from({}, mockClient);

      const result = await headers.suggest();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('explain()', () => {
    test('explains headers', async () => {
      const mockClient = createMockLLMClient(mockHeadersExplainResponse);
      const headers = SemanticHeaders.from(
        {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'Cache-Control': 'no-cache',
        },
        mockClient
      );

      const result = await headers.explain();
      expect(result).toContain('JSON');
      expect(result).toContain('authentication');
    });
  });

  describe('native Headers methods', () => {
    test('get() returns header value', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('NonExistent')).toBeNull();
    });

    test('set() sets header value', () => {
      const headers = SemanticHeaders.from({});
      headers.set('X-Custom', 'value');
      expect(headers.get('X-Custom')).toBe('value');
    });

    test('append() appends to header', () => {
      const headers = SemanticHeaders.from({ Accept: 'application/json' });
      headers.append('Accept', 'text/plain');
      expect(headers.get('Accept')).toContain('application/json');
    });

    test('has() checks header existence', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      expect(headers.has('Content-Type')).toBe(true);
      expect(headers.has('NonExistent')).toBe(false);
    });

    test('delete() removes header', () => {
      const headers = SemanticHeaders.from({ 'X-Custom': 'value' });
      headers.delete('X-Custom');
      expect(headers.has('X-Custom')).toBe(false);
    });

    test('forEach() iterates over headers', () => {
      const headers = SemanticHeaders.from({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });
      const entries: [string, string][] = [];
      headers.forEach((value, key) => {
        entries.push([key, value]);
      });
      expect(entries.length).toBe(2);
    });

    test('entries() returns iterator', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      const entries: [string, string][] = [];
      for (const entry of headers.entries()) {
        entries.push(entry);
      }
      expect(entries.length).toBe(1);
      expect(entries[0]).toEqual(['content-type', 'application/json']);
    });

    test('keys() returns key iterator', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      const keys: string[] = [];
      for (const key of headers.keys()) {
        keys.push(key);
      }
      expect(keys).toContain('content-type');
    });

    test('values() returns value iterator', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      const values: string[] = [];
      for (const value of headers.values()) {
        values.push(value);
      }
      expect(values).toContain('application/json');
    });

    test('is iterable with for...of', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      const entries: [string, string][] = [];
      for (const entry of headers) {
        entries.push(entry);
      }
      expect(entries.length).toBe(1);
    });

    test('valueOf() returns Headers', () => {
      const semanticHeaders = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      const value = semanticHeaders.valueOf();
      expect(value).toBeInstanceOf(Headers);
    });

    test('toObject() returns plain object', () => {
      const headers = SemanticHeaders.from({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });
      const obj = headers.toObject();
      expect(obj['content-type']).toBe('application/json');
      expect(obj['accept']).toBe('application/json');
    });

    test('toString() returns string representation', () => {
      const headers = SemanticHeaders.from({ 'Content-Type': 'application/json' });
      const str = headers.toString();
      expect(str).toContain('SemanticHeaders');
      expect(str).toContain('content-type');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration', () => {
  test('SemanticRequest can extract SemanticHeaders', () => {
    const request = SemanticRequest.from('https://api.example.com', {
      headers: { 'Content-Type': 'application/json' },
    });
    const headers = SemanticHeaders.from(request.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  test('SemanticResponse can extract SemanticHeaders', () => {
    const response = SemanticResponse.from(
      new Response('', { headers: { 'Content-Type': 'application/json' } })
    );
    const headers = SemanticHeaders.from(response.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  test('workflow: create request, analyze, validate', async () => {
    const mockClient = createKeywordMockLLMClient({
      'intent': mockAnalyzeIntentReadResponse,
      'validate': mockRequestValidResponse,
      'security': mockRequestSecuritySafeResponse,
    });

    const request = SemanticRequest.from(
      'https://api.example.com/users?role=admin',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer token123' },
      },
      mockClient
    );

    const intent = await request.analyzeIntent();
    expect(intent.operation).toBe('READ');

    const validation = await request.validate();
    expect(validation.valid).toBe(true);

    const security = await request.validateSecurity();
    expect(security.safe).toBe(true);
  });

  test('workflow: receive response, analyze, interpret error', async () => {
    const mockClient = createKeywordMockLLMClient({
      'analyze': mockAnalyzeCollectionResponse,
      'summarize': mockSummarizeSuccessResponse,
    });

    const response = SemanticResponse.from(
      new Response(JSON.stringify({ users: Array(25).fill({}) }), { status: 200 }),
      mockClient
    );

    const analysis = await response.analyze();
    expect(analysis.dataType).toBe('collection');

    const summary = await response.summarize();
    expect(summary).toContain('user');
  });
});
