---
sidebar_position: 2
---

# SemanticArray

`SemanticArray<T>` wraps native arrays with powerful semantic operations including natural language filtering, sorting, searching, grouping, and pattern detection.

## Creating a SemanticArray

```typescript
import { SemanticArray } from 'semantic-primitives';

const arr = SemanticArray.from([1, 2, 3, 4, 5]);
const strings = SemanticArray.from(['apple', 'banana', 'cherry']);
const objects = SemanticArray.from([
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
]);
```

## Methods

### semanticallyEquals

Compare two arrays by semantic meaning, not just exact values.

```typescript
const arr1 = SemanticArray.from(['red', 'crimson', 'scarlet']);
const arr2 = SemanticArray.from(['red', 'ruby', 'vermillion']);

const result = await arr1.semanticallyEquals(arr2, {
  orderSignificant: false
});
// {
//   equivalent: true,
//   confidence: 0.87,
//   mappings: { 'crimson': 'ruby', 'scarlet': 'vermillion' }
// }
```

**Options:**
- `orderSignificant?: boolean` - Whether order matters (default: true)
- `tolerance?: number` - Similarity threshold

### semanticFilter

Filter elements using natural language criteria.

```typescript
const products = SemanticArray.from([
  'iPhone 15 Pro',
  'Samsung Galaxy S24',
  'MacBook Air',
  'Dell XPS 15',
  'iPad Pro'
]);

const phones = await products.semanticFilter("mobile phones");
// ['iPhone 15 Pro', 'Samsung Galaxy S24']

const apple = await products.semanticFilter("Apple products");
// ['iPhone 15 Pro', 'MacBook Air', 'iPad Pro']
```

### semanticSort

Sort elements by semantic criteria.

```typescript
const tasks = SemanticArray.from([
  'Fix critical bug in production',
  'Update documentation',
  'Add nice-to-have feature',
  'Security vulnerability patch'
]);

const sorted = await tasks.semanticSort("by urgency and importance");
// [
//   'Security vulnerability patch',
//   'Fix critical bug in production',
//   'Update documentation',
//   'Add nice-to-have feature'
// ]
```

### semanticGroup

Group elements by semantic criteria.

```typescript
const items = SemanticArray.from([
  'Python', 'JavaScript', 'Ferrari', 'BMW',
  'React', 'Vue', 'Toyota', 'Rust'
]);

const groups = await items.semanticGroup("by category");
// {
//   'Programming Languages': ['Python', 'JavaScript', 'Rust'],
//   'Car Brands': ['Ferrari', 'BMW', 'Toyota'],
//   'JavaScript Frameworks': ['React', 'Vue']
// }
```

### semanticSearch

Search for elements matching a query.

```typescript
const docs = SemanticArray.from([
  'Getting started with React',
  'Advanced TypeScript patterns',
  'Building REST APIs with Node.js',
  'React hooks deep dive',
  'Database optimization techniques'
]);

const results = await docs.semanticSearch("frontend frameworks");
// [
//   { item: 'Getting started with React', score: 0.95 },
//   { item: 'React hooks deep dive', score: 0.92 }
// ]
```

**Options:**
- `limit?: number` - Max results to return
- `threshold?: number` - Minimum relevance score

### semanticUnique

Deduplicate elements by semantic similarity.

```typescript
const items = SemanticArray.from([
  'car', 'automobile', 'vehicle',
  'house', 'home', 'residence',
  'computer'
]);

const unique = await items.semanticUnique({ threshold: 0.8 });
// ['car', 'house', 'computer']
```

### detectPatterns

Detect patterns in array elements.

```typescript
const data = SemanticArray.from([
  100, 200, 400, 800, 1600
]);

const patterns = await data.detectPatterns();
// {
//   patterns: ['geometric sequence', 'doubling pattern'],
//   confidence: 0.98
// }
```

### validate

Validate all elements against rules.

```typescript
const emails = SemanticArray.from([
  'valid@example.com',
  'invalid-email',
  'another@test.org'
]);

const result = await emails.validate([
  "all elements must be valid email addresses"
]);
// {
//   valid: false,
//   issues: ['Element at index 1 is not a valid email']
// }
```

### inferElementType

Detect the semantic type of elements.

```typescript
const data = SemanticArray.from([
  '2024-01-15', '2024-02-20', '2024-03-25'
]);

const type = await data.inferElementType();
// {
//   type: 'date',
//   format: 'ISO 8601',
//   confidence: 0.96
// }
```

### summarize

Get a human-readable summary.

```typescript
const logs = SemanticArray.from([
  'User login successful',
  'Database query completed',
  'API request processed',
  // ... many more entries
]);

const summary = await logs.summarize({ maxLength: 100 });
// "System logs showing successful operations: user authentication, database queries, and API requests"
```

### enrich

Add semantic annotations to elements.

```typescript
const items = SemanticArray.from(['apple', 'python', 'java']);

const enriched = await items.enrich();
// [
//   { value: 'apple', annotations: { category: 'fruit', isAmbiguous: true, alternativeMeanings: ['company'] } },
//   { value: 'python', annotations: { category: 'programming_language', isAmbiguous: true } },
//   { value: 'java', annotations: { category: 'programming_language', isAmbiguous: true } }
// ]
```

## Implemented Interfaces

- `Semantic<T[]>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Rule-based validation
- `Summarizable` - Content summarization
- `PatternDetectable` - Pattern detection
- `SemanticFilterable` - Natural language filtering
- `SemanticSortable` - Semantic sorting
- `SemanticSearchable` - Semantic search

## Examples

### E-commerce Product Filtering

```typescript
async function filterProducts(products: Product[], query: string) {
  const arr = SemanticArray.from(products);

  const filtered = await arr.semanticFilter(query);
  const sorted = await filtered.semanticSort("by popularity and rating");

  return sorted.valueOf();
}

await filterProducts(allProducts, "wireless headphones under $100");
```

### Log Analysis

```typescript
async function analyzeLogLevel(logs: string[]) {
  const arr = SemanticArray.from(logs);

  const groups = await arr.semanticGroup("by severity level");

  return {
    critical: groups['Critical'] || [],
    errors: groups['Error'] || [],
    warnings: groups['Warning'] || [],
    info: groups['Info'] || []
  };
}
```

### Content Recommendation

```typescript
async function recommendContent(
  userHistory: string[],
  allContent: string[]
) {
  const history = SemanticArray.from(userHistory);
  const content = SemanticArray.from(allContent);

  // Find patterns in user history
  const patterns = await history.detectPatterns();

  // Search for similar content
  const recommendations = await content.semanticSearch(
    patterns.patterns.join(' '),
    { limit: 10, threshold: 0.7 }
  );

  return recommendations.map(r => r.item);
}
```

### Data Deduplication

```typescript
async function deduplicateContacts(contacts: Contact[]) {
  const arr = SemanticArray.from(contacts.map(c => c.name));

  // Find semantic duplicates
  const unique = await arr.semanticUnique({ threshold: 0.85 });

  // Get original contacts for unique names
  return contacts.filter(c =>
    unique.valueOf().some(name =>
      name.toLowerCase() === c.name.toLowerCase()
    )
  );
}
```
