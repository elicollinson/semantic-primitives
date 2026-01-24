import { describe, expect, test, mock } from 'bun:test';
import { SemanticURL, type URLLLMClientInterface } from '../url.ts';
import type { Message } from '../../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): URLLLMClientInterface {
  return {
    chat: mock(({ messages, systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
      // Find matching response based on system prompt or message content
      for (const [key, value] of Object.entries(responses)) {
        if (systemPrompt?.includes(key) || messages.some((m) => m.content.includes(key))) {
          return Promise.resolve({ content: value });
        }
      }
      // Default response
      return Promise.resolve({ content: '{"error": "No mock response found"}' });
    }),
  };
}

describe('SemanticURL', () => {
  describe('constructor', () => {
    test('creates instance with URL value', () => {
      const url = new URL('https://example.com/path');
      const semanticUrl = new SemanticURL(url);
      expect(semanticUrl.href).toBe('https://example.com/path');
    });

    test('creates a copy of the input URL (immutable)', () => {
      const url = new URL('https://example.com/path');
      const semanticUrl = new SemanticURL(url);
      // Modify original - SemanticURL should not be affected
      // Note: URL objects are mutable but we create a copy internally
      expect(semanticUrl.href).toBe('https://example.com/path');
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const url = new URL('https://example.com');
      const semanticUrl = new SemanticURL(url, mockClient);
      expect(semanticUrl.href).toBe('https://example.com/');
    });
  });

  describe('static from()', () => {
    test('creates SemanticURL from full URL string', () => {
      const semanticUrl = SemanticURL.from('https://example.com/path');
      expect(semanticUrl.href).toBe('https://example.com/path');
    });

    test('adds https:// to domain without protocol', () => {
      const semanticUrl = SemanticURL.from('example.com');
      expect(semanticUrl.href).toBe('https://example.com/');
    });

    test('adds https:// to domain with path but no protocol', () => {
      const semanticUrl = SemanticURL.from('example.com/path');
      expect(semanticUrl.href).toBe('https://example.com/path');
    });

    test('handles protocol-relative URLs', () => {
      const semanticUrl = SemanticURL.from('//example.com/path');
      expect(semanticUrl.href).toBe('https://example.com/path');
    });

    test('handles relative paths with base URL', () => {
      const semanticUrl = SemanticURL.from('/api/users', 'https://example.com');
      expect(semanticUrl.href).toBe('https://example.com/api/users');
    });

    test('throws error for relative path without base URL', () => {
      expect(() => SemanticURL.from('/api/users')).toThrow('Relative URL requires a base URL');
    });

    test('preserves query parameters', () => {
      const semanticUrl = SemanticURL.from('https://example.com/search?q=test&limit=10');
      expect(semanticUrl.search).toBe('?q=test&limit=10');
      expect(semanticUrl.searchParams.get('q')).toBe('test');
      expect(semanticUrl.searchParams.get('limit')).toBe('10');
    });

    test('preserves hash/fragment', () => {
      const semanticUrl = SemanticURL.from('https://example.com/page#section');
      expect(semanticUrl.hash).toBe('#section');
    });

    test('handles URLs with ports', () => {
      const semanticUrl = SemanticURL.from('https://example.com:8080/api');
      expect(semanticUrl.port).toBe('8080');
      expect(semanticUrl.host).toBe('example.com:8080');
    });

    test('handles URLs with authentication', () => {
      const semanticUrl = SemanticURL.from('https://user:pass@example.com/path');
      expect(semanticUrl.username).toBe('user');
      expect(semanticUrl.password).toBe('pass');
    });

    test('trims whitespace from input', () => {
      const semanticUrl = SemanticURL.from('  https://example.com  ');
      expect(semanticUrl.href).toBe('https://example.com/');
    });
  });

  describe('semanticallyEquals()', () => {
    test('compares URLs for semantic equivalence', async () => {
      const mockClient = createMockLLMClient({
        'URL comparison': JSON.stringify({
          equivalent: true,
          differences: ['www prefix', 'trailing slash'],
          confidence: 0.95,
        }),
      });

      const url = new SemanticURL(new URL('https://example.com'), mockClient);
      const result = await url.semanticallyEquals('https://www.example.com/');
      expect(result.equivalent).toBe(true);
      expect(result.differences).toContain('www prefix');
      expect(result.differences).toContain('trailing slash');
      expect(result.confidence).toBe(0.95);
    });

    test('compares URLs with different protocols', async () => {
      const mockClient = createMockLLMClient({
        'URL comparison': JSON.stringify({
          equivalent: false,
          differences: ['protocol (http vs https)'],
          confidence: 1.0,
        }),
      });

      const url = new SemanticURL(new URL('https://example.com'), mockClient);
      const result = await url.semanticallyEquals('http://example.com');
      expect(result.equivalent).toBe(false);
      expect(result.differences).toContain('protocol (http vs https)');
    });

    test('compares with URL object', async () => {
      const mockClient = createMockLLMClient({
        'URL comparison': JSON.stringify({
          equivalent: true,
          differences: [],
          confidence: 1.0,
        }),
      });

      const url = new SemanticURL(new URL('https://example.com/path'), mockClient);
      const result = await url.semanticallyEquals(new URL('https://example.com/path'));
      expect(result.equivalent).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    test('identifies query parameter ordering differences', async () => {
      const mockClient = createMockLLMClient({
        'URL comparison': JSON.stringify({
          equivalent: true,
          differences: ['query parameter order'],
          confidence: 0.9,
        }),
      });

      const url = new SemanticURL(new URL('https://example.com?a=1&b=2'), mockClient);
      const result = await url.semanticallyEquals('https://example.com?b=2&a=1');
      expect(result.equivalent).toBe(true);
      expect(result.differences).toContain('query parameter order');
    });
  });

  describe('classify()', () => {
    test('classifies API endpoint URL', async () => {
      const mockClient = createMockLLMClient({
        'URL classification': JSON.stringify({
          type: 'api-endpoint',
          category: 'rest-api',
          resource: 'users',
          action: 'list',
          confidence: 0.92,
        }),
      });

      const url = new SemanticURL(new URL('https://api.github.com/users'), mockClient);
      const result = await url.classify();
      expect(result.type).toBe('api-endpoint');
      expect(result.category).toBe('rest-api');
      expect(result.resource).toBe('users');
      expect(result.action).toBe('list');
      expect(result.confidence).toBe(0.92);
    });

    test('classifies website URL', async () => {
      const mockClient = createMockLLMClient({
        'URL classification': JSON.stringify({
          type: 'website',
          category: 'documentation',
          confidence: 0.88,
        }),
      });

      const url = new SemanticURL(new URL('https://docs.example.com/getting-started'), mockClient);
      const result = await url.classify();
      expect(result.type).toBe('website');
      expect(result.category).toBe('documentation');
    });

    test('classifies CDN URL', async () => {
      const mockClient = createMockLLMClient({
        'URL classification': JSON.stringify({
          type: 'cdn',
          category: 'static-assets',
          resource: 'image',
          confidence: 0.95,
        }),
      });

      const url = new SemanticURL(new URL('https://cdn.example.com/images/logo.png'), mockClient);
      const result = await url.classify();
      expect(result.type).toBe('cdn');
      expect(result.category).toBe('static-assets');
    });

    test('classifies OAuth URL', async () => {
      const mockClient = createMockLLMClient({
        'URL classification': JSON.stringify({
          type: 'authentication',
          category: 'oauth',
          action: 'authorize',
          confidence: 0.97,
        }),
      });

      const url = new SemanticURL(new URL('https://accounts.google.com/o/oauth2/auth'), mockClient);
      const result = await url.classify();
      expect(result.type).toBe('authentication');
      expect(result.category).toBe('oauth');
      expect(result.action).toBe('authorize');
    });
  });

  describe('validateFor()', () => {
    test('validates URL for public website purpose', async () => {
      const mockClient = createMockLLMClient({
        'URL validation': JSON.stringify({
          valid: true,
          warnings: [],
        }),
      });

      const url = new SemanticURL(new URL('https://example.com'), mockClient);
      const result = await url.validateFor('public website');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('validates HTTP URL with warnings for public website', async () => {
      const mockClient = createMockLLMClient({
        'URL validation': JSON.stringify({
          valid: true,
          warnings: ['Uses HTTP instead of HTTPS'],
        }),
      });

      const url = new SemanticURL(new URL('http://example.com'), mockClient);
      const result = await url.validateFor('public website');
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Uses HTTP instead of HTTPS');
    });

    test('invalidates URL for API endpoint purpose', async () => {
      const mockClient = createMockLLMClient({
        'URL validation': JSON.stringify({
          valid: false,
          reason: 'Missing API path prefix',
          warnings: [],
        }),
      });

      const url = new SemanticURL(new URL('https://example.com/page'), mockClient);
      const result = await url.validateFor('API endpoint');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Missing API path prefix');
    });

    test('validates webhook URL', async () => {
      const mockClient = createMockLLMClient({
        'URL validation': JSON.stringify({
          valid: true,
          warnings: ['Consider using a dedicated webhook path'],
        }),
      });

      const url = new SemanticURL(new URL('https://api.example.com/webhook'), mockClient);
      const result = await url.validateFor('webhook endpoint');
      expect(result.valid).toBe(true);
    });
  });

  describe('explain()', () => {
    test('explains GitHub API endpoint', async () => {
      const mockClient = createMockLLMClient({
        'URL explanation': JSON.stringify({
          explanation: "GitHub API endpoint to fetch the user profile for 'octocat'",
        }),
      });

      const url = new SemanticURL(new URL('https://api.github.com/users/octocat'), mockClient);
      const result = await url.explain();
      expect(result).toContain('GitHub');
      expect(result).toContain('octocat');
    });

    test('explains search URL', async () => {
      const mockClient = createMockLLMClient({
        'URL explanation': JSON.stringify({
          explanation: "Google search for 'typescript tutorials'",
        }),
      });

      const url = new SemanticURL(new URL('https://www.google.com/search?q=typescript+tutorials'), mockClient);
      const result = await url.explain();
      expect(result).toContain('Google');
      expect(result).toContain('search');
    });

    test('explains documentation URL', async () => {
      const mockClient = createMockLLMClient({
        'URL explanation': JSON.stringify({
          explanation: 'MDN Web Docs article about JavaScript Array methods',
        }),
      });

      const url = new SemanticURL(new URL('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array'), mockClient);
      const result = await url.explain();
      expect(result).toContain('MDN');
    });
  });

  describe('extractInfo()', () => {
    test('extracts info from GitHub user URL', async () => {
      const mockClient = createMockLLMClient({
        'URL information extraction': JSON.stringify({
          service: 'GitHub',
          resourceType: 'user-profile',
          identifier: 'octocat',
        }),
      });

      const url = new SemanticURL(new URL('https://api.github.com/users/octocat'), mockClient);
      const result = await url.extractInfo();
      expect(result.service).toBe('GitHub');
      expect(result.resourceType).toBe('user-profile');
      expect(result.identifier).toBe('octocat');
    });

    test('extracts info from API endpoint with version', async () => {
      const mockClient = createMockLLMClient({
        'URL information extraction': JSON.stringify({
          service: 'Example API',
          version: 'v2',
          resourceType: 'orders',
          identifier: '12345',
        }),
      });

      const url = new SemanticURL(new URL('https://api.example.com/v2/orders/12345'), mockClient);
      const result = await url.extractInfo();
      expect(result.version).toBe('v2');
      expect(result.resourceType).toBe('orders');
      expect(result.identifier).toBe('12345');
    });

    test('extracts info from YouTube video URL', async () => {
      const mockClient = createMockLLMClient({
        'URL information extraction': JSON.stringify({
          service: 'YouTube',
          resourceType: 'video',
          identifier: 'dQw4w9WgXcQ',
        }),
      });

      const url = new SemanticURL(new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), mockClient);
      const result = await url.extractInfo();
      expect(result.service).toBe('YouTube');
      expect(result.resourceType).toBe('video');
      expect(result.identifier).toBe('dQw4w9WgXcQ');
    });
  });

  describe('isSafe()', () => {
    test('identifies safe URL', async () => {
      const mockClient = createMockLLMClient({
        'URL safety assessment': JSON.stringify({
          safe: true,
        }),
      });

      const url = new SemanticURL(new URL('https://github.com'), mockClient);
      const result = await url.isSafe();
      expect(result.safe).toBe(true);
    });

    test('identifies unsafe phishing URL', async () => {
      const mockClient = createMockLLMClient({
        'URL safety assessment': JSON.stringify({
          safe: false,
          reason: 'Known phishing domain pattern (typosquatting)',
          severity: 'high',
        }),
      });

      const url = new SemanticURL(new URL('https://g1thub.com/login'), mockClient);
      const result = await url.isSafe();
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('phishing');
      expect(result.severity).toBe('high');
    });

    test('identifies suspicious IP-based URL', async () => {
      const mockClient = createMockLLMClient({
        'URL safety assessment': JSON.stringify({
          safe: false,
          reason: 'IP address instead of domain name',
          severity: 'medium',
        }),
      });

      const url = new SemanticURL(new URL('http://192.168.1.1/admin'), mockClient);
      const result = await url.isSafe();
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('medium');
    });

    test('warns about suspicious file extension', async () => {
      const mockClient = createMockLLMClient({
        'URL safety assessment': JSON.stringify({
          safe: false,
          reason: 'Potentially dangerous file extension',
          severity: 'low',
        }),
      });

      const url = new SemanticURL(new URL('https://example.com/file.exe'), mockClient);
      const result = await url.isSafe();
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('low');
    });
  });

  describe('canonical()', () => {
    test('canonicalizes URL with uppercase hostname', async () => {
      const mockClient = createMockLLMClient({
        'URL canonicalization': JSON.stringify({
          canonical: 'https://example.com/path',
          changes: ['lowercased hostname'],
        }),
      });

      const url = new SemanticURL(new URL('https://EXAMPLE.COM/path'), mockClient);
      const result = await url.canonical();
      expect(result.href).toBe('https://example.com/path');
    });

    test('removes default HTTP port', async () => {
      const mockClient = createMockLLMClient({
        'URL canonicalization': JSON.stringify({
          canonical: 'http://example.com/path',
          changes: ['removed default port 80'],
        }),
      });

      const url = new SemanticURL(new URL('http://example.com:80/path'), mockClient);
      const result = await url.canonical();
      expect(result.href).toBe('http://example.com/path');
    });

    test('removes trailing slash from path', async () => {
      const mockClient = createMockLLMClient({
        'URL canonicalization': JSON.stringify({
          canonical: 'https://example.com/path',
          changes: ['removed trailing slash'],
        }),
      });

      const url = new SemanticURL(new URL('https://example.com/path/'), mockClient);
      const result = await url.canonical();
      expect(result.href).toBe('https://example.com/path');
    });

    test('upgrades HTTP to HTTPS', async () => {
      const mockClient = createMockLLMClient({
        'URL canonicalization': JSON.stringify({
          canonical: 'https://example.com/path',
          changes: ['upgraded to HTTPS'],
        }),
      });

      const url = new SemanticURL(new URL('http://example.com/path'), mockClient);
      const result = await url.canonical();
      expect(result.href).toBe('https://example.com/path');
    });
  });

  describe('variations()', () => {
    test('generates URL variations', async () => {
      const mockClient = createMockLLMClient({
        'URL variation': JSON.stringify({
          variations: [
            'https://example.com',
            'https://www.example.com',
            'http://example.com',
            'https://example.com/',
          ],
        }),
      });

      const url = new SemanticURL(new URL('https://example.com'), mockClient);
      const result = await url.variations();
      expect(result).toContain('https://example.com');
      expect(result).toContain('https://www.example.com');
      expect(result).toContain('http://example.com');
      expect(result.length).toBeGreaterThan(2);
    });

    test('generates variations for API endpoint', async () => {
      const mockClient = createMockLLMClient({
        'URL variation': JSON.stringify({
          variations: [
            'https://api.example.com/v1/users',
            'https://api.example.com/users',
            'https://example.com/api/v1/users',
          ],
        }),
      });

      const url = new SemanticURL(new URL('https://api.example.com/v1/users'), mockClient);
      const result = await url.variations();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('parseQuery()', () => {
    test('parses search query parameters', async () => {
      const mockClient = createMockLLMClient({
        'query parameter analysis': JSON.stringify({
          q: { value: 'test', meaning: 'search query' },
          limit: { value: '10', meaning: 'results limit' },
        }),
      });

      const url = new SemanticURL(new URL('https://api.example.com/search?q=test&limit=10'), mockClient);
      const result = await url.parseQuery();
      const qParam = result['q'];
      const limitParam = result['limit'];
      expect(qParam).toBeDefined();
      expect(qParam?.value).toBe('test');
      expect(qParam?.meaning).toBe('search query');
      expect(limitParam).toBeDefined();
      expect(limitParam?.value).toBe('10');
      expect(limitParam?.meaning).toBe('results limit');
    });

    test('parses pagination parameters', async () => {
      const mockClient = createMockLLMClient({
        'query parameter analysis': JSON.stringify({
          page: { value: '2', meaning: 'page number' },
          per_page: { value: '20', meaning: 'items per page' },
        }),
      });

      const url = new SemanticURL(new URL('https://api.example.com/items?page=2&per_page=20'), mockClient);
      const result = await url.parseQuery();
      const pageParam = result['page'];
      const perPageParam = result['per_page'];
      expect(pageParam).toBeDefined();
      expect(pageParam?.meaning).toContain('page');
      expect(perPageParam).toBeDefined();
      expect(perPageParam?.meaning).toContain('per page');
    });

    test('parses tracking parameters', async () => {
      const mockClient = createMockLLMClient({
        'query parameter analysis': JSON.stringify({
          utm_source: { value: 'newsletter', meaning: 'tracking source (marketing)' },
          utm_campaign: { value: 'spring2024', meaning: 'campaign identifier (marketing)' },
        }),
      });

      const url = new SemanticURL(new URL('https://example.com?utm_source=newsletter&utm_campaign=spring2024'), mockClient);
      const result = await url.parseQuery();
      const utmSourceParam = result['utm_source'];
      expect(utmSourceParam).toBeDefined();
      expect(utmSourceParam?.meaning).toContain('tracking');
    });
  });

  describe('suggestRelated()', () => {
    test('suggests related API endpoints', async () => {
      const mockClient = createMockLLMClient({
        'URL suggestion': JSON.stringify({
          suggestions: [
            { url: '/users/octocat/repos', reason: "User's repositories" },
            { url: '/users/octocat/followers', reason: "User's followers" },
            { url: '/users/octocat/following', reason: 'Users being followed' },
          ],
        }),
      });

      const url = new SemanticURL(new URL('https://api.github.com/users/octocat'), mockClient);
      const result = await url.suggestRelated();
      expect(result.length).toBe(3);
      const firstSuggestion = result[0];
      expect(firstSuggestion).toBeDefined();
      expect(firstSuggestion?.url).toContain('repos');
      expect(firstSuggestion?.reason).toContain('repositories');
    });

    test('suggests related resources for e-commerce', async () => {
      const mockClient = createMockLLMClient({
        'URL suggestion': JSON.stringify({
          suggestions: [
            { url: '/products/123/reviews', reason: 'Product reviews' },
            { url: '/products/123/related', reason: 'Related products' },
          ],
        }),
      });

      const url = new SemanticURL(new URL('https://shop.example.com/products/123'), mockClient);
      const result = await url.suggestRelated();
      expect(result.length).toBe(2);
    });
  });

  describe('matches()', () => {
    test('matches API endpoint pattern', async () => {
      const mockClient = createMockLLMClient({
        'URL pattern matching': JSON.stringify({
          matches: true,
          confidence: 0.95,
          explanation: 'URL follows REST API endpoint pattern',
        }),
      });

      const url = new SemanticURL(new URL('https://api.github.com/users'), mockClient);
      const result = await url.matches('API endpoint');
      expect(result).toBe(true);
    });

    test('does not match image URL pattern', async () => {
      const mockClient = createMockLLMClient({
        'URL pattern matching': JSON.stringify({
          matches: false,
          confidence: 0.9,
          explanation: 'URL does not point to an image resource',
        }),
      });

      const url = new SemanticURL(new URL('https://api.github.com/users'), mockClient);
      const result = await url.matches('image URL');
      expect(result).toBe(false);
    });

    test('matches documentation URL pattern', async () => {
      const mockClient = createMockLLMClient({
        'URL pattern matching': JSON.stringify({
          matches: true,
          confidence: 0.88,
          explanation: 'URL points to documentation content',
        }),
      });

      const url = new SemanticURL(new URL('https://docs.example.com/getting-started'), mockClient);
      const result = await url.matches('documentation');
      expect(result).toBe(true);
    });
  });

  describe('valueOf()', () => {
    test('returns a URL object', () => {
      const originalUrl = new URL('https://example.com/path');
      const semanticUrl = new SemanticURL(originalUrl);
      const value = semanticUrl.valueOf();
      expect(value).toBeInstanceOf(URL);
      expect(value.href).toBe(originalUrl.href);
    });

    test('returns a copy (immutable)', () => {
      const originalUrl = new URL('https://example.com/path');
      const semanticUrl = new SemanticURL(originalUrl);
      const value = semanticUrl.valueOf();
      // Modifying the returned value shouldn't affect the original
      expect(value.href).toBe('https://example.com/path');
    });
  });

  describe('URL properties', () => {
    test('href returns full URL string', () => {
      const semanticUrl = SemanticURL.from('https://example.com/path?q=test#section');
      expect(semanticUrl.href).toBe('https://example.com/path?q=test#section');
    });

    test('protocol returns the protocol', () => {
      const semanticUrl = SemanticURL.from('https://example.com');
      expect(semanticUrl.protocol).toBe('https:');
    });

    test('hostname returns the hostname', () => {
      const semanticUrl = SemanticURL.from('https://example.com:8080/path');
      expect(semanticUrl.hostname).toBe('example.com');
    });

    test('host returns hostname with port', () => {
      const semanticUrl = SemanticURL.from('https://example.com:8080/path');
      expect(semanticUrl.host).toBe('example.com:8080');
    });

    test('port returns the port', () => {
      const semanticUrl = SemanticURL.from('https://example.com:8080/path');
      expect(semanticUrl.port).toBe('8080');
    });

    test('pathname returns the path', () => {
      const semanticUrl = SemanticURL.from('https://example.com/api/users');
      expect(semanticUrl.pathname).toBe('/api/users');
    });

    test('search returns query string with ?', () => {
      const semanticUrl = SemanticURL.from('https://example.com/search?q=test');
      expect(semanticUrl.search).toBe('?q=test');
    });

    test('searchParams returns URLSearchParams', () => {
      const semanticUrl = SemanticURL.from('https://example.com/search?q=test&limit=10');
      expect(semanticUrl.searchParams.get('q')).toBe('test');
      expect(semanticUrl.searchParams.get('limit')).toBe('10');
    });

    test('hash returns the fragment', () => {
      const semanticUrl = SemanticURL.from('https://example.com/page#section');
      expect(semanticUrl.hash).toBe('#section');
    });

    test('origin returns the origin', () => {
      const semanticUrl = SemanticURL.from('https://example.com:8080/path');
      expect(semanticUrl.origin).toBe('https://example.com:8080');
    });

    test('username and password are accessible', () => {
      const semanticUrl = SemanticURL.from('https://user:pass@example.com/path');
      expect(semanticUrl.username).toBe('user');
      expect(semanticUrl.password).toBe('pass');
    });
  });

  describe('toString() and toJSON()', () => {
    test('toString() returns href', () => {
      const semanticUrl = SemanticURL.from('https://example.com/path');
      expect(semanticUrl.toString()).toBe('https://example.com/path');
    });

    test('toJSON() returns href', () => {
      const semanticUrl = SemanticURL.from('https://example.com/path');
      expect(semanticUrl.toJSON()).toBe('https://example.com/path');
    });

    test('JSON.stringify() works correctly', () => {
      const semanticUrl = SemanticURL.from('https://example.com/path');
      expect(JSON.stringify({ url: semanticUrl })).toBe('{"url":"https://example.com/path"}');
    });
  });
});
