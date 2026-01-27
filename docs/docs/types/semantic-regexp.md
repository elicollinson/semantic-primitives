---
sidebar_position: 12
---

# SemanticRegExp

`SemanticRegExp` wraps regular expressions with pattern explanation, test case generation, simplification, and natural language pattern creation.

## Creating a SemanticRegExp

```typescript
import { SemanticRegExp } from 'semantic-primitives';

// From existing RegExp
const pattern = SemanticRegExp.from(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);

// From natural language description (async)
const emailPattern = await SemanticRegExp.from("email addresses");
const phonePattern = await SemanticRegExp.from("US phone numbers");
```

## Methods

### from (static)

Create a regex from natural language.

```typescript
const pattern = await SemanticRegExp.from("email addresses");
// Creates: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/

const datePattern = await SemanticRegExp.from("dates in YYYY-MM-DD format");
// Creates: /^\d{4}-\d{2}-\d{2}$/

const urlPattern = await SemanticRegExp.from("URLs starting with https");
// Creates: /^https:\/\/[\w\-\.]+\.\w{2,}(\/\S*)?$/
```

### testWithExplanation

Test a string and explain the result.

```typescript
const emailRegex = SemanticRegExp.from(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);

const result = await emailRegex.testWithExplanation("test@example.com");
// {
//   matches: true,
//   explanation: "The string matches the email pattern: 'test' is the local part, '@' separates it from the domain 'example.com'"
// }

const result2 = await emailRegex.testWithExplanation("invalid-email");
// {
//   matches: false,
//   explanation: "The string doesn't match because it lacks the '@' symbol and domain portion required for email addresses"
// }
```

### simplify

Simplify a complex regex while maintaining functionality.

```typescript
const complex = SemanticRegExp.from(
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
);

const simplified = await complex.simplify();
// {
//   original: '...',
//   simplified: '...',
//   explanation: "Pattern validates IPv4 addresses (0-255.0-255.0-255.0-255)",
//   equivalent: true
// }
```

### suggestImprovements

Get optimization suggestions.

```typescript
const pattern = SemanticRegExp.from(/.*hello.*/i);

const improvements = await pattern.suggestImprovements();
// [
//   {
//     improvement: "Use specific anchors instead of .*",
//     reason: "Greedy quantifiers can cause performance issues",
//     example: "/hello/i"
//   },
//   {
//     improvement: "Consider word boundaries",
//     reason: "Avoid matching 'hello' within other words",
//     example: "/\\bhello\\b/i"
//   }
// ]
```

### generateTestCases

Generate test cases for the pattern.

```typescript
const pattern = SemanticRegExp.from(/^\d{3}-\d{2}-\d{4}$/);

const testCases = await pattern.generateTestCases();
// {
//   shouldMatch: [
//     "123-45-6789",
//     "000-00-0000",
//     "999-99-9999"
//   ],
//   shouldNotMatch: [
//     "12-345-6789",
//     "123-456-789",
//     "abc-de-fghi",
//     "123456789"
//   ]
// }
```

### validate

Validate the regex for correctness and safety.

```typescript
const pattern = SemanticRegExp.from(/(a+)+$/);

const validation = await pattern.validate();
// {
//   valid: false,
//   issues: [
//     "Potential ReDoS vulnerability: nested quantifiers can cause catastrophic backtracking"
//   ],
//   suggestions: [
//     "Use atomic groups or possessive quantifiers if available",
//     "Simplify to /a+$/"
//   ]
// }
```

### suggestRelated

Get related patterns.

```typescript
const emailPattern = SemanticRegExp.from(/^[\w-\.]+@[\w-]+\.\w{2,}$/);

const related = await emailPattern.suggestRelated();
// [
//   { pattern: '/^[\w-\.]+@gmail\.com$/', reason: 'Gmail-specific validation' },
//   { pattern: '/^[\w-\.]+@[\w-]+\.(com|org|net)$/', reason: 'Common TLD validation' }
// ]
```

### inferType

Infer what the regex is designed to match.

```typescript
const pattern = SemanticRegExp.from(/^\d{4}-\d{2}-\d{2}$/);

const type = await pattern.inferType();
// {
//   type: 'date',
//   format: 'ISO 8601 (YYYY-MM-DD)',
//   confidence: 0.97
// }
```

## Implemented Interfaces

- `Semantic<RegExp>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Safety validation
- `TypeInferable` - Pattern type detection

## Examples

### Pattern Validation Service

```typescript
async function validatePattern(pattern: RegExp) {
  const semantic = SemanticRegExp.from(pattern);

  const [validation, type, improvements] = await Promise.all([
    semantic.validate(),
    semantic.inferType(),
    semantic.suggestImprovements()
  ]);

  return {
    pattern: pattern.source,
    matchesType: type.type,
    isValid: validation.valid,
    securityIssues: validation.issues,
    improvements
  };
}
```

### Test Case Generator

```typescript
async function generateRegexTests(pattern: RegExp, name: string) {
  const semantic = SemanticRegExp.from(pattern);

  const testCases = await semantic.generateTestCases();
  const type = await semantic.inferType();

  return `
describe('${name}', () => {
  const pattern = ${pattern};

  describe('should match valid ${type.type} values', () => {
    ${testCases.shouldMatch.map(tc => `
    it('matches "${tc}"', () => {
      expect(pattern.test("${tc}")).toBe(true);
    });`).join('\n')}
  });

  describe('should not match invalid values', () => {
    ${testCases.shouldNotMatch.map(tc => `
    it('rejects "${tc}"', () => {
      expect(pattern.test("${tc}")).toBe(false);
    });`).join('\n')}
  });
});
  `;
}
```

### Natural Language Pattern Builder

```typescript
async function buildPattern(description: string) {
  const pattern = await SemanticRegExp.from(description);

  const [validation, testCases, type] = await Promise.all([
    pattern.validate(),
    pattern.generateTestCases(),
    pattern.inferType()
  ]);

  if (!validation.valid) {
    console.warn('Pattern has issues:', validation.issues);
  }

  return {
    pattern: pattern.valueOf(),
    type: type.type,
    testCases,
    isValid: validation.valid
  };
}

// Usage
const result = await buildPattern("credit card numbers");
console.log(result.pattern); // /^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/
```

### Security Scanner

```typescript
async function scanPatternsForVulnerabilities(patterns: RegExp[]) {
  const results = await Promise.all(
    patterns.map(async (p) => {
      const semantic = SemanticRegExp.from(p);
      const validation = await semantic.validate();

      return {
        pattern: p.source,
        vulnerable: !validation.valid,
        issues: validation.issues,
        suggestions: validation.suggestions
      };
    })
  );

  return {
    safe: results.filter(r => !r.vulnerable),
    vulnerable: results.filter(r => r.vulnerable)
  };
}
```
