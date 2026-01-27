---
sidebar_position: 5
---

# SemanticSet

`SemanticSet<T>` wraps the native `Set` type with semantic membership checking, theme detection, and intelligent set operations.

## Creating a SemanticSet

```typescript
import { SemanticSet } from 'semantic-primitives';

const tags = SemanticSet.from(new Set(['javascript', 'typescript', 'react']));
const numbers = SemanticSet.from(new Set([1, 2, 3, 4, 5]));
```

## Methods

### semanticallyEquals

Compare two sets by semantic meaning.

```typescript
const set1 = SemanticSet.from(new Set(['car', 'automobile', 'truck']));
const set2 = SemanticSet.from(new Set(['vehicle', 'auto', 'lorry']));

const result = await set1.semanticallyEquals(set2);
// {
//   equivalent: true,
//   confidence: 0.85,
//   note: "Both sets contain vehicle-related terms"
// }
```

### semanticHas

Check membership by semantic similarity.

```typescript
const skills = SemanticSet.from(new Set([
  'JavaScript',
  'React',
  'Node.js',
  'PostgreSQL'
]));

const hasBackend = await skills.semanticHas("backend development");
// { found: true, matchedItem: 'Node.js', confidence: 0.88 }

const hasML = await skills.semanticHas("machine learning");
// { found: false, confidence: 0.95 }
```

### semanticAdd

Add an item with semantic deduplication.

```typescript
const colors = SemanticSet.from(new Set(['red', 'blue', 'green']));

const result = await colors.semanticAdd('crimson');
// {
//   added: false,
//   reason: "Semantically similar to existing item 'red'",
//   existingItem: 'red',
//   similarity: 0.92
// }

const result2 = await colors.semanticAdd('yellow');
// { added: true }
```

### validate

Validate set contents against rules.

```typescript
const permissions = SemanticSet.from(new Set([
  'read',
  'write',
  'delete',
  'admin'
]));

const result = await permissions.validate([
  "should only contain valid permission names",
  "should not have overlapping permissions"
]);
// {
//   valid: false,
//   issues: ["'admin' overlaps with 'read', 'write', 'delete'"]
// }
```

### inferTheme

Detect the common theme of set elements.

```typescript
const items = SemanticSet.from(new Set([
  'Python', 'JavaScript', 'Go', 'Rust', 'TypeScript'
]));

const theme = await items.inferTheme();
// {
//   theme: 'programming languages',
//   subcategory: 'modern languages',
//   confidence: 0.98
// }
```

### summarize

Get a human-readable summary.

```typescript
const features = SemanticSet.from(new Set([
  'dark-mode',
  'auto-save',
  'cloud-sync',
  'offline-mode',
  'multi-language'
]));

const summary = await features.summarize();
// "Set of 5 application features focusing on user experience and accessibility: theme customization, data persistence, synchronization, and internationalization"
```

## Implemented Interfaces

- `Semantic<Set<T>>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Summarizable` - Content summarization
- `TypeInferable` - Element type detection

## Examples

### Tag Management

```typescript
async function addTagWithDedup(
  existingTags: Set<string>,
  newTag: string
) {
  const tags = SemanticSet.from(existingTags);

  const result = await tags.semanticAdd(newTag);

  if (!result.added) {
    console.log(`Tag "${newTag}" is similar to existing "${result.existingItem}"`);
    return existingTags;
  }

  existingTags.add(newTag);
  return existingTags;
}

// Usage
const tags = new Set(['javascript', 'react', 'frontend']);
await addTagWithDedup(tags, 'js'); // Not added (similar to javascript)
await addTagWithDedup(tags, 'backend'); // Added
```

### Skill Matching

```typescript
async function matchSkills(
  requiredSkills: Set<string>,
  candidateSkills: Set<string>
) {
  const required = SemanticSet.from(requiredSkills);
  const candidate = SemanticSet.from(candidateSkills);

  const matches: Array<{ required: string; matched: string; confidence: number }> = [];
  const missing: string[] = [];

  for (const skill of requiredSkills) {
    const hasSkill = await candidate.semanticHas(skill);

    if (hasSkill.found) {
      matches.push({
        required: skill,
        matched: hasSkill.matchedItem,
        confidence: hasSkill.confidence
      });
    } else {
      missing.push(skill);
    }
  }

  return {
    matchRate: matches.length / requiredSkills.size,
    matches,
    missing
  };
}
```

### Category Detection

```typescript
async function categorizeItems(items: Set<string>) {
  const set = SemanticSet.from(items);

  const theme = await set.inferTheme();
  const summary = await set.summarize();

  return {
    category: theme.theme,
    subcategory: theme.subcategory,
    summary,
    itemCount: items.size
  };
}

// Usage
const products = new Set(['iPhone', 'MacBook', 'AirPods', 'iPad']);
await categorizeItems(products);
// {
//   category: 'consumer electronics',
//   subcategory: 'Apple products',
//   summary: '...',
//   itemCount: 4
// }
```

### Permission System

```typescript
async function validatePermissions(
  userPermissions: Set<string>,
  requiredPermissions: Set<string>
) {
  const user = SemanticSet.from(userPermissions);
  const required = SemanticSet.from(requiredPermissions);

  const result = await user.semanticallyEquals(required);

  if (result.equivalent) {
    return { authorized: true };
  }

  // Check each required permission
  const missingPermissions: string[] = [];
  for (const perm of requiredPermissions) {
    const has = await user.semanticHas(perm);
    if (!has.found) {
      missingPermissions.push(perm);
    }
  }

  return {
    authorized: missingPermissions.length === 0,
    missing: missingPermissions
  };
}
```
