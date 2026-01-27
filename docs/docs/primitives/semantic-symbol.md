---
sidebar_position: 6
---

# SemanticSymbol

`SemanticSymbol` wraps the native `symbol` type with classification, validation, and alternative suggestion capabilities.

## Creating a SemanticSymbol

```typescript
import { SemanticSymbol } from 'semantic-primitives';

const sym = SemanticSymbol.from(Symbol('myUniqueKey'));
const sym2 = SemanticSymbol.from(Symbol.for('globalKey'));
```

## Methods

### classify

Classify the symbol's type and purpose.

```typescript
const sym = SemanticSymbol.from(Symbol('onClick'));

const result = await sym.classify();
// {
//   category: 'event_handler',
//   subcategory: 'click_event',
//   confidence: 0.92
// }
```

```typescript
const iteratorSym = SemanticSymbol.from(Symbol.iterator);

const result = await iteratorSym.classify();
// {
//   category: 'well_known_symbol',
//   subcategory: 'iteration_protocol',
//   confidence: 0.99
// }
```

### semanticallyEquals

Compare two symbols semantically.

```typescript
const sym1 = SemanticSymbol.from(Symbol('userId'));
const sym2 = SemanticSymbol.from(Symbol('user_id'));

const result = await sym1.semanticallyEquals(sym2);
// {
//   equivalent: true,
//   confidence: 0.88,
//   reason: "Both symbols represent user identifier with different naming conventions"
// }
```

### validate

Validate symbol usage against rules.

```typescript
const sym = SemanticSymbol.from(Symbol('_privateKey'));

const result = await sym.validate([
  "should not start with underscore for public API",
  "should be descriptive",
  "should follow camelCase convention"
]);
// {
//   valid: false,
//   issues: ["Symbol starts with underscore, suggesting private usage"]
// }
```

### suggestAlternative

Get suggested alternative symbol names.

```typescript
const sym = SemanticSymbol.from(Symbol('x'));

const result = await sym.suggestAlternative("coordinate system");
// {
//   suggestion: "xCoordinate",
//   reason: "More descriptive name for coordinate context"
// }
```

## Implemented Interfaces

- `Semantic<symbol>` - Base semantic interface
- `Comparable` - Semantic comparison
- `Validatable` - Rule-based validation
- `Classifiable` - Category classification

## Examples

### Symbol Registry Management

```typescript
async function registerSymbol(description: string) {
  const sym = Symbol(description);
  const semantic = SemanticSymbol.from(sym);

  const classification = await semantic.classify();
  const validation = await semantic.validate([
    "should be descriptive",
    "should follow naming conventions",
    "should not conflict with well-known symbols"
  ]);

  if (!validation.valid) {
    const alternative = await semantic.suggestAlternative(classification.category);
    console.warn(`Consider using: ${alternative.suggestion}`);
  }

  return {
    symbol: sym,
    category: classification.category,
    valid: validation.valid
  };
}
```

### API Design Validation

```typescript
async function validateSymbolAPI(symbols: symbol[]) {
  const results = await Promise.all(
    symbols.map(async (sym) => {
      const semantic = SemanticSymbol.from(sym);

      const [classification, validation] = await Promise.all([
        semantic.classify(),
        semantic.validate([
          "should be self-documenting",
          "should not duplicate existing symbols",
          "should follow consistent naming pattern"
        ])
      ]);

      return {
        symbol: sym.description,
        category: classification.category,
        issues: validation.issues
      };
    })
  );

  return {
    valid: results.every(r => r.issues.length === 0),
    symbols: results
  };
}
```

### Symbol Migration Helper

```typescript
async function suggestSymbolMigration(oldSymbol: symbol, context: string) {
  const semantic = SemanticSymbol.from(oldSymbol);

  const classification = await semantic.classify();
  const suggestion = await semantic.suggestAlternative(context);

  return {
    current: oldSymbol.description,
    suggested: suggestion.suggestion,
    reason: suggestion.reason,
    category: classification.category
  };
}

await suggestSymbolMigration(Symbol('cb'), 'event handling');
// {
//   current: 'cb',
//   suggested: 'onCallback',
//   reason: 'More descriptive name following event handler conventions',
//   category: 'callback'
// }
```
