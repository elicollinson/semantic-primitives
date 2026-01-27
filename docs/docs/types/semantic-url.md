---
sidebar_position: 10
---

# SemanticURL

`SemanticURL` wraps URL handling with intelligent classification, validation, query parsing, and suggestions.

## Creating a SemanticURL

```typescript
import { SemanticURL } from 'semantic-primitives';

// From URL string
const url = await SemanticURL.from("https://api.example.com/users?page=1");

// From partial URL
const github = await SemanticURL.from("github.com/user/repo");
```

## Methods

### semanticallyEquals

Compare URLs semantically.

```typescript
const url1 = await SemanticURL.from("https://example.com/users");
const url2 = await SemanticURL.from("https://example.com/users/");

const result = await url1.semanticallyEquals(url2);
// { equivalent: true, confidence: 0.99 }

const url3 = await SemanticURL.from("https://example.com/api/v1/users");
const url4 = await SemanticURL.from("https://example.com/api/v2/users");

const result2 = await url3.semanticallyEquals(url4);
// { equivalent: true, confidence: 0.85, note: "Same endpoint, different API versions" }
```

### classify

Categorize the URL type.

```typescript
const api = await SemanticURL.from("https://api.stripe.com/v1/charges");
const result = await api.classify();
// { category: 'api_endpoint', subcategory: 'payment_api', confidence: 0.94 }

const docs = await SemanticURL.from("https://docs.example.com/guide/intro");
const result2 = await docs.classify();
// { category: 'documentation', subcategory: 'user_guide', confidence: 0.92 }
```

### validateFor

Validate URL for a specific purpose.

```typescript
const url = await SemanticURL.from("http://localhost:3000/api");

const result = await url.validateFor("production API endpoint");
// {
//   valid: false,
//   issues: [
//     "URL uses localhost, not suitable for production",
//     "URL uses HTTP instead of HTTPS"
//   ]
// }

const prodUrl = await SemanticURL.from("https://api.example.com/v1");
const result2 = await prodUrl.validateFor("REST API endpoint");
// { valid: true, issues: [] }
```

### parseQuery

Extract and analyze query parameters.

```typescript
const url = await SemanticURL.from(
  "https://api.example.com/search?q=test&page=1&limit=10&sort=desc"
);

const params = await url.parseQuery();
// {
//   parameters: {
//     q: { value: 'test', purpose: 'search_query' },
//     page: { value: '1', purpose: 'pagination' },
//     limit: { value: '10', purpose: 'pagination' },
//     sort: { value: 'desc', purpose: 'ordering' }
//   },
//   paginationParams: ['page', 'limit'],
//   filterParams: ['q', 'sort']
// }
```

### getSuggestions

Get related URL suggestions.

```typescript
const url = await SemanticURL.from("https://api.example.com/users/123");

const suggestions = await url.getSuggestions();
// [
//   { url: '/users/123/profile', reason: 'User profile endpoint' },
//   { url: '/users/123/settings', reason: 'User settings endpoint' },
//   { url: '/users/123/posts', reason: 'User posts endpoint' }
// ]
```

### explain

Get a human-readable explanation.

```typescript
const url = await SemanticURL.from(
  "https://api.github.com/repos/owner/repo/pulls?state=open"
);

const explanation = await url.explain();
// "GitHub API endpoint for listing open pull requests in the owner/repo repository"
```

## Implemented Interfaces

- `Semantic<URL>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Classifiable` - Category classification
- `Describable` - Human-readable descriptions

## Examples

### URL Validation Service

```typescript
async function validateURLs(urls: string[], purpose: string) {
  const results = await Promise.all(
    urls.map(async (urlStr) => {
      const url = await SemanticURL.from(urlStr);
      const validation = await url.validateFor(purpose);
      const classification = await url.classify();

      return {
        url: urlStr,
        valid: validation.valid,
        issues: validation.issues,
        type: classification.category
      };
    })
  );

  return {
    valid: results.filter(r => r.valid),
    invalid: results.filter(r => !r.valid)
  };
}
```

### API Documentation Generator

```typescript
async function documentEndpoint(urlStr: string) {
  const url = await SemanticURL.from(urlStr);

  const [classification, explanation, query, suggestions] = await Promise.all([
    url.classify(),
    url.explain(),
    url.parseQuery(),
    url.getSuggestions()
  ]);

  return {
    endpoint: urlStr,
    type: classification.subcategory,
    description: explanation,
    parameters: query.parameters,
    relatedEndpoints: suggestions
  };
}
```

### Security URL Scanner

```typescript
async function scanURL(urlStr: string) {
  const url = await SemanticURL.from(urlStr);

  const validation = await url.validateFor("secure web resource");
  const classification = await url.classify();

  const securityIssues: string[] = [];

  if (urlStr.startsWith('http://')) {
    securityIssues.push('Uses insecure HTTP protocol');
  }

  if (urlStr.includes('password=') || urlStr.includes('token=')) {
    securityIssues.push('Contains sensitive data in URL');
  }

  return {
    url: urlStr,
    type: classification.category,
    secure: securityIssues.length === 0,
    issues: [...validation.issues, ...securityIssues]
  };
}
```
