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
