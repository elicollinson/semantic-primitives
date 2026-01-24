/**
 * Tests for SemanticURL
 */

import { describe, test, expect } from 'bun:test';
import { SemanticURL } from '../url.ts';
import {
  createMockLLMClient,
  mockParseResponse,
  mockEquivalentResponse,
  mockNotEquivalentResponse,
  mockApiClassifyResponse,
  mockValidForResponse,
  mockInvalidForResponse,
  mockExplainResponse,
  mockExtractInfoResponse,
  mockSafeResponse,
  mockUnsafeResponse,
  mockCanonicalResponse,
  mockVariationsResponse,
  mockParseQueryResponse,
  mockSuggestRelatedResponse,
  mockMatchesTrueResponse,
  mockMatchesFalseResponse,
} from './mocks.ts';

describe('SemanticURL', () => {
  // ===========================================================================
  // CREATION TESTS
  // ===========================================================================

  describe('fromString()', () => {
    test('creates SemanticURL from string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com/path', undefined, client);

      expect(url).toBeInstanceOf(SemanticURL);
      expect(url.href).toBe('https://example.com/path');
    });

    test('creates SemanticURL with base', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('/path', 'https://example.com', client);

      expect(url.href).toBe('https://example.com/path');
    });
  });

  describe('fromURL()', () => {
    test('creates SemanticURL from URL object', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const nativeUrl = new URL('https://example.com');
      const url = SemanticURL.fromURL(nativeUrl, client);

      expect(url).toBeInstanceOf(SemanticURL);
      expect(url.href).toBe('https://example.com/');
    });
  });

  describe('from()', () => {
    test('creates from complete URL', async () => {
      const client = createMockLLMClient(mockParseResponse);
      const url = await SemanticURL.from('https://example.com', undefined, client);

      expect(url).toBeInstanceOf(SemanticURL);
    });

    test('creates from incomplete URL with LLM', async () => {
      const client = createMockLLMClient(mockParseResponse);
      const url = await SemanticURL.from('example.com', undefined, client);

      expect(url).toBeInstanceOf(SemanticURL);
    });
  });

  // ===========================================================================
  // STANDARD URL PROPERTIES TESTS
  // ===========================================================================

  describe('URL properties', () => {
    test('href returns full URL', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com/path?q=test#hash', undefined, client);

      expect(url.href).toBe('https://example.com/path?q=test#hash');
    });

    test('origin returns origin', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com:8080/path', undefined, client);

      expect(url.origin).toBe('https://example.com:8080');
    });

    test('protocol returns protocol', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      expect(url.protocol).toBe('https:');
    });

    test('hostname returns hostname', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com/path', undefined, client);

      expect(url.hostname).toBe('example.com');
    });

    test('pathname returns pathname', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com/path/to/resource', undefined, client);

      expect(url.pathname).toBe('/path/to/resource');
    });

    test('search returns search string', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com?q=test&limit=10', undefined, client);

      expect(url.search).toBe('?q=test&limit=10');
    });

    test('searchParams returns URLSearchParams', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com?q=test', undefined, client);

      expect(url.searchParams.get('q')).toBe('test');
    });

    test('hash returns hash', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com#section', undefined, client);

      expect(url.hash).toBe('#section');
    });
  });

  // ===========================================================================
  // SEMANTIC EQUALS TESTS
  // ===========================================================================

  describe('semanticallyEquals()', () => {
    test('returns true for equivalent URLs', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const result = await url.semanticallyEquals('https://www.example.com/');
      expect(result.equivalent).toBe(true);
      expect(result.differences).toBeDefined();
    });

    test('returns false for different URLs', async () => {
      const client = createMockLLMClient(mockNotEquivalentResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const result = await url.semanticallyEquals('https://other.com');
      expect(result.equivalent).toBe(false);
    });

    test('compares with URL object', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const result = await url.semanticallyEquals(new URL('https://www.example.com'));
      expect(result.equivalent).toBe(true);
    });

    test('compares with SemanticURL', async () => {
      const client = createMockLLMClient(mockEquivalentResponse);
      const url1 = SemanticURL.fromString('https://example.com', undefined, client);
      const url2 = SemanticURL.fromString('https://www.example.com', undefined, client);

      const result = await url1.semanticallyEquals(url2);
      expect(result.equivalent).toBe(true);
    });
  });

  // ===========================================================================
  // CLASSIFY TESTS
  // ===========================================================================

  describe('classify()', () => {
    test('classifies API endpoint', async () => {
      const client = createMockLLMClient(mockApiClassifyResponse);
      const url = SemanticURL.fromString('https://api.example.com/users', undefined, client);

      const result = await url.classify();
      expect(result.type).toBe('api-endpoint');
      expect(result.category).toBe('rest-api');
      expect(result.resource).toBe('users');
    });
  });

  // ===========================================================================
  // VALIDATE FOR TESTS
  // ===========================================================================

  describe('validateFor()', () => {
    test('returns valid for appropriate URL', async () => {
      const client = createMockLLMClient(mockValidForResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const result = await url.validateFor('public website');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('returns invalid with reason', async () => {
      const client = createMockLLMClient(mockInvalidForResponse);
      const url = SemanticURL.fromString('http://example.com/data', undefined, client);

      const result = await url.validateFor('API endpoint');
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // ===========================================================================
  // EXPLAIN TESTS
  // ===========================================================================

  describe('explain()', () => {
    test('returns explanation', async () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://api.github.com/users/octocat', undefined, client);

      const explanation = await url.explain();
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // EXTRACT INFO TESTS
  // ===========================================================================

  describe('extractInfo()', () => {
    test('extracts semantic information', async () => {
      const client = createMockLLMClient(mockExtractInfoResponse);
      const url = SemanticURL.fromString('https://api.github.com/users/octocat', undefined, client);

      const info = await url.extractInfo();
      expect(info.service).toBe('GitHub');
      expect(info.resourceType).toBe('user-profile');
      expect(info.identifier).toBe('octocat');
    });
  });

  // ===========================================================================
  // IS SAFE TESTS
  // ===========================================================================

  describe('isSafe()', () => {
    test('returns safe for legitimate URL', async () => {
      const client = createMockLLMClient(mockSafeResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const result = await url.isSafe();
      expect(result.safe).toBe(true);
    });

    test('returns unsafe with reason', async () => {
      const client = createMockLLMClient(mockUnsafeResponse);
      const url = SemanticURL.fromString('https://suspicious-site.com', undefined, client);

      const result = await url.isSafe();
      expect(result.safe).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.severity).toBe('high');
    });
  });

  // ===========================================================================
  // CANONICAL TESTS
  // ===========================================================================

  describe('canonical()', () => {
    test('returns canonical URL', async () => {
      const client = createMockLLMClient(mockCanonicalResponse);
      const url = SemanticURL.fromString('HTTP://EXAMPLE.COM:80/path/', undefined, client);

      const canonical = await url.canonical();
      expect(canonical).toBeInstanceOf(SemanticURL);
    });
  });

  // ===========================================================================
  // VARIATIONS TESTS
  // ===========================================================================

  describe('variations()', () => {
    test('returns URL variations', async () => {
      const client = createMockLLMClient(mockVariationsResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const variations = await url.variations();
      expect(variations).toBeInstanceOf(Array);
      expect(variations.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // PARSE QUERY TESTS
  // ===========================================================================

  describe('parseQuery()', () => {
    test('parses query parameters with meaning', async () => {
      const client = createMockLLMClient(mockParseQueryResponse);
      const url = SemanticURL.fromString('https://example.com/search?q=test&limit=10', undefined, client);

      const params = await url.parseQuery();
      expect(params.q).toBeDefined();
      if (params.q) {
        expect(params.q.value).toBe('test');
        expect(params.q.meaning).toBe('search query');
      }
    });

    test('returns empty for URL without query', async () => {
      const client = createMockLLMClient(mockParseQueryResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const params = await url.parseQuery();
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  // ===========================================================================
  // SUGGEST RELATED TESTS
  // ===========================================================================

  describe('suggestRelated()', () => {
    test('returns related URLs', async () => {
      const client = createMockLLMClient(mockSuggestRelatedResponse);
      const url = SemanticURL.fromString('https://api.github.com/users/octocat', undefined, client);

      const suggestions = await url.suggestRelated();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('url');
      expect(suggestions[0]).toHaveProperty('reason');
    });
  });

  // ===========================================================================
  // MATCHES TESTS
  // ===========================================================================

  describe('matches()', () => {
    test('returns true for matching pattern', async () => {
      const client = createMockLLMClient(mockMatchesTrueResponse);
      const url = SemanticURL.fromString('https://api.example.com/users', undefined, client);

      const result = await url.matches('API endpoint');
      expect(result).toBe(true);
    });

    test('returns false for non-matching pattern', async () => {
      const client = createMockLLMClient(mockMatchesFalseResponse);
      const url = SemanticURL.fromString('https://example.com/image.jpg', undefined, client);

      const result = await url.matches('API endpoint');
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // UTILITY METHOD TESTS
  // ===========================================================================

  describe('utility methods', () => {
    test('valueOf returns URL', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com', undefined, client);

      const underlying = url.valueOf();
      expect(underlying).toBeInstanceOf(URL);
    });

    test('toString returns href', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com/path', undefined, client);

      expect(url.toString()).toBe('https://example.com/path');
    });

    test('toJSON returns href', () => {
      const client = createMockLLMClient(mockExplainResponse);
      const url = SemanticURL.fromString('https://example.com/path', undefined, client);

      expect(url.toJSON()).toBe('https://example.com/path');
    });
  });
});
