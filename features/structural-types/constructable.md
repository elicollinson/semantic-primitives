# SemanticConstructable

## Overview

The `SemanticConstructable` type wraps TypeScript constructor signatures with LLM-powered semantic understanding. It enables class analysis, constructor validation, and intelligent instantiation patterns.

**Core Principle**: Constructable types represent class contracts - semantic operations should understand what classes create, validate constructor args, and explain instance shapes.

---

## Interface

```typescript
interface SemanticConstructable<T extends new (...args: any[]) => any> {
  /**
   * Wrap a constructor with semantic capabilities.
   *
   * @param ctor - Constructor function/class
   * @param description - Optional description
   * @returns SemanticConstructable wrapper
   *
   * @example
   * SemanticConstructable.from(User, "creates user instances")
   */
  static from<T extends new (...args: any[]) => any>(
    ctor: T,
    description?: string
  ): SemanticConstructable<T>;

  /**
   * Check if two constructors create semantically equivalent instances.
   *
   * @param other - Constructor to compare
   * @param testArgs - Arguments to test with
   * @returns Equivalence result
   *
   * @example
   * UserV1.semanticallyEquals(UserV2, [["John", 30]])
   * // { equivalent: true, instanceDifferences: [] }
   */
  semanticallyEquals(
    other: new (...args: any[]) => any,
    testArgs?: ConstructorParameters<T>[]
  ): {
    equivalent: boolean;
    instanceDifferences: string[];
    confidence: number;
  };

  /**
   * Validate constructor arguments.
   *
   * @param args - Arguments to validate
   * @param rules - Additional validation rules
   * @returns Validation result
   *
   * @example
   * User.validateArgs(["", -5], [
   *   "name must not be empty",
   *   "age must be positive"
   * ])
   * // { valid: false, issues: ["name is empty", "age is negative"] }
   */
  validateArgs(
    args: ConstructorParameters<T>,
    rules?: string[]
  ): { valid: boolean; issues: string[] };

  /**
   * Analyze the shape of instances this constructor creates.
   *
   * @returns Instance shape analysis
   *
   * @example
   * User.analyzeInstanceShape()
   * // {
   * //   properties: { name: "string", age: "number" },
   * //   methods: ["greet", "toJSON"],
   * //   instanceOf: ["User", "Object"]
   * // }
   */
  analyzeInstanceShape(): {
    properties: Record<string, string>;
    methods: string[];
    instanceOf: string[];
  };

  /**
   * Explain what this constructor creates.
   *
   * @returns Human-readable explanation
   *
   * @example
   * User.explain()
   * // "Creates User instances with name and age properties and a greet() method"
   */
  explain(): string;

  /**
   * Detect design patterns used by this constructor.
   *
   * @returns Detected patterns
   *
   * @example
   * ctor.detectPatterns()
   * // { patterns: ["builder", "factory-method"], confidence: 0.85 }
   */
  detectPatterns(): {
    patterns: string[];
    confidence: number;
  };

  /**
   * Generate documentation for this constructor.
   *
   * @param format - Documentation format
   * @returns Generated documentation
   *
   * @example
   * User.generateDocs("jsdoc")
   * // "/**\n * Creates a new User instance\n * @param name - User's name\n * ..."
   */
  generateDocs(format?: "jsdoc" | "markdown" | "plain"): string;

  /**
   * Suggest improvements for the constructor.
   *
   * @returns Suggested improvements
   *
   * @example
   * ctor.suggestImprovements()
   * // [{ suggestion: "Add parameter validation", reason: "No null checks" }]
   */
  suggestImprovements(): Array<{
    suggestion: string;
    reason: string;
  }>;

  /**
   * Check if an instance was created by this constructor.
   *
   * @param instance - Instance to check
   * @returns Whether it's an instance of this constructor
   */
  isInstance(instance: unknown): instance is InstanceType<T>;

  /**
   * Create an instance with validation.
   *
   * @param args - Constructor arguments
   * @returns New instance or validation errors
   *
   * @example
   * User.createValidated("John", 30)
   * // { success: true, instance: User { name: "John", age: 30 } }
   */
  createValidated(
    ...args: ConstructorParameters<T>
  ): { success: true; instance: InstanceType<T> } | { success: false; errors: string[] };

  /**
   * Create an instance using the constructor.
   *
   * @param args - Constructor arguments
   * @returns New instance
   */
  create(...args: ConstructorParameters<T>): InstanceType<T>;

  /**
   * Get the underlying constructor.
   *
   * @returns Original constructor
   */
  valueOf(): T;
}
```

---

## Shared Types

The following shared types from `src/shared/types.ts` are available for this interface:

| Method | Return Type | Shared Type |
|--------|-------------|-------------|
| `semanticallyEquals()` | `{ equivalent: boolean; instanceDifferences: string[]; confidence: number }` | `SemanticEqualsResult` (extended) |
| `validateArgs()` | `{ valid: boolean; issues: string[] }` | `ValidateResult` |
| `detectPatterns()` | `{ patterns: string[]; confidence: number }` | `DetectPatternResult` |
| `suggestImprovements()` | `Array<{ suggestion: string; reason: string }>` | `ImprovementSuggestion[]` |

Import shared types:
```typescript
import {
  SemanticEqualsResult,
  ValidateResult,
  DetectPatternResult,
  ImprovementSuggestion
} from '../../shared/types.ts';
```

---

## Implementation Notes

### Location
- **Main class**: `src/types/constructable/constructable.ts`
- **Prompts**: `src/types/constructable/prompts.ts`
- **Exports**: `src/types/constructable/index.ts`
- **Tests**: `src/types/constructable/__tests__/constructable.test.ts`
- **Mocks**: `src/types/constructable/__tests__/mocks.ts`

### Key Implementation Details

1. **Constructor Type**: Uses `new (...args: any[]) => T` to support constructors with typed parameters. The `any[]` for args is necessary to allow type inference to work correctly with specific constructor signatures.

2. **Private Constructor Pattern**: The class uses a private constructor with a static `from()` factory method, following the same pattern as other semantic types in the library.

3. **Source Extraction**: The `getSource()` method uses `constructor.toString()` to get the source code representation of the constructor for LLM analysis.

4. **Async vs Sync Methods**:
   - `isInstance()`, `create()`, `valueOf()`, `toString()`, `toJSON()` - Synchronous (no LLM needed)
   - `semanticallyEquals()`, `validateArgs()`, `analyzeInstanceShape()`, `explain()`, `detectPatterns()`, `generateDocs()`, `suggestImprovements()`, `createValidated()` - Async (require LLM)

5. **Temperature Settings**:
   - `0.1` for deterministic operations (equals, validate, detect patterns, analyze shape)
   - `0.3` for creative operations (explain, generate docs, suggest improvements)

6. **Error Handling**: `createValidated()` catches construction errors and returns them in the `errors` array instead of throwing.

### Test Coverage

38 tests covering:
- Factory method (`from()`)
- Basic accessors (`valueOf()`, `name`, `toString()`, `toJSON()`)
- Instance creation (`create()`, `createValidated()`, `isInstance()`)
- Semantic equality comparison
- Argument validation
- Instance shape analysis
- Explanation generation
- Pattern detection
- Documentation generation (JSDoc, Markdown, plain text)
- Improvement suggestions
- Chained operations
- Edge cases (no methods, no parameters, inheritance)

### Exported Types

- `SemanticConstructable` - Main class
- `Constructor<T>` - Generic constructor type
- `ConstructableSemanticEqualsResult` - Extended equals result with instance differences
- `InstanceShapeResult` - Shape analysis result
- `CreateValidatedResult<T>` - Union type for validated creation
- `DocFormat` - Documentation format literal type

### Dependencies

Re-exports from shared types:
- `SemanticEqualsResult`
- `ValidateResult`
- `DetectPatternResult`
- `ImprovementSuggestion`
