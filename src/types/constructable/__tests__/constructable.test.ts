/**
 * Tests for SemanticConstructable
 */

import { describe, test, expect } from 'bun:test';
import { SemanticConstructable } from '../constructable.ts';
import {
  createMockLLMClient,
  createSequentialMockLLMClient,
  mockEquivalentConstructorsResponse,
  mockNotEquivalentConstructorsResponse,
  mockValidArgsResponse,
  mockInvalidArgsResponse,
  mockUserShapeResponse,
  mockSimpleShapeResponse,
  mockUserExplanationResponse,
  mockBuilderPatternResponse,
  mockNoPatternsResponse,
  mockJSDocResponse,
  mockMarkdownDocsResponse,
  mockPlainDocsResponse,
  mockImprovementsResponse,
  mockNoImprovementsResponse,
} from './mocks.ts';

// =============================================================================
// TEST CLASSES
// =============================================================================

class User {
  name: string;
  age: number;
  email: string;

  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }

  greet(): string {
    return `Hello, I'm ${this.name}`;
  }

  toJSON() {
    return { name: this.name, age: this.age, email: this.email };
  }
}

class UserV2 {
  name: string;
  age: number;
  email: string;

  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }

  greet(): string {
    return `Hi, my name is ${this.name}`;
  }
}

class Product {
  id: string;
  price: number;

  constructor(id: string, price: number) {
    this.id = id;
    this.price = price;
  }
}

class SimpleValue {
  value: unknown;

  constructor(value: unknown) {
    this.value = value;
  }

  getValue(): unknown {
    return this.value;
  }

  setValue(value: unknown): void {
    this.value = value;
  }
}

// =============================================================================
// FACTORY AND BASIC TESTS
// =============================================================================

describe('SemanticConstructable', () => {
  describe('from()', () => {
    test('creates a SemanticConstructable from a class', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);

      expect(semantic).toBeInstanceOf(SemanticConstructable);
      expect(semantic.name).toBe('User');
    });

    test('creates a SemanticConstructable with description', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(
        User,
        'creates user instances',
        client
      );

      expect(semantic).toBeInstanceOf(SemanticConstructable);
      expect(semantic.name).toBe('User');
    });

    test('works with anonymous classes', () => {
      const client = createMockLLMClient({});
      const AnonymousClass = class {
        value: number;
        constructor(v: number) {
          this.value = v;
        }
      };
      const semantic = SemanticConstructable.from(AnonymousClass, undefined, client);

      expect(semantic).toBeInstanceOf(SemanticConstructable);
    });
  });

  describe('valueOf()', () => {
    test('returns the underlying constructor', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);

      expect(semantic.valueOf()).toBe(User);
    });
  });

  describe('name', () => {
    test('returns the constructor name', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);

      expect(semantic.name).toBe('User');
    });
  });

  describe('toString()', () => {
    test('returns string representation', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);

      expect(semantic.toString()).toBe('SemanticConstructable<User>');
    });
  });

  describe('toJSON()', () => {
    test('returns JSON representation', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(
        User,
        'user constructor',
        client
      );

      const json = semantic.toJSON();
      expect(json.name).toBe('User');
      expect(json.description).toBe('user constructor');
      expect(json.source).toContain('class User');
    });
  });
});

// =============================================================================
// INSTANCE CREATION TESTS
// =============================================================================

describe('Instance Creation', () => {
  describe('create()', () => {
    test('creates an instance with arguments', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);

      const user = semantic.create('John', 30, 'john@example.com');

      expect(user).toBeInstanceOf(User);
      expect(user.name).toBe('John');
      expect(user.age).toBe(30);
      expect(user.email).toBe('john@example.com');
    });

    test('creates instance with single argument', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(SimpleValue, undefined, client);

      const instance = semantic.create(42);

      expect(instance).toBeInstanceOf(SimpleValue);
      expect(instance.getValue()).toBe(42);
    });
  });

  describe('createValidated()', () => {
    test('creates instance when validation passes', async () => {
      const client = createMockLLMClient(mockValidArgsResponse);
      const semantic = SemanticConstructable.from(User, undefined, client);

      const result = await semantic.createValidated('John', 30, 'john@example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.instance).toBeInstanceOf(User);
        expect(result.instance.name).toBe('John');
      }
    });

    test('returns errors when validation fails', async () => {
      const client = createMockLLMClient(mockInvalidArgsResponse);
      const semantic = SemanticConstructable.from(User, undefined, client);

      const result = await semantic.createValidated('', -5, 'invalid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('name must not be empty');
        expect(result.errors).toContain('age must be a positive number');
      }
    });
  });

  describe('isInstance()', () => {
    test('returns true for instances of the constructor', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);
      const user = new User('John', 30, 'john@example.com');

      expect(semantic.isInstance(user)).toBe(true);
    });

    test('returns false for non-instances', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);
      const product = new Product('123', 99.99);

      expect(semantic.isInstance(product)).toBe(false);
    });

    test('returns false for primitives', () => {
      const client = createMockLLMClient({});
      const semantic = SemanticConstructable.from(User, undefined, client);

      expect(semantic.isInstance('string')).toBe(false);
      expect(semantic.isInstance(42)).toBe(false);
      expect(semantic.isInstance(null)).toBe(false);
    });
  });
});

// =============================================================================
// SEMANTIC EQUALS TESTS
// =============================================================================

describe('semanticallyEquals()', () => {
  test('returns equivalent for similar constructors', async () => {
    const client = createMockLLMClient(mockEquivalentConstructorsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.semanticallyEquals(UserV2);

    expect(result.equivalent).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.instanceDifferences).toEqual([]);
  });

  test('returns not equivalent for different constructors', async () => {
    const client = createMockLLMClient(mockNotEquivalentConstructorsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.semanticallyEquals(Product);

    expect(result.equivalent).toBe(false);
    expect(result.instanceDifferences.length).toBeGreaterThan(0);
  });

  test('accepts SemanticConstructable as argument', async () => {
    const client = createMockLLMClient(mockEquivalentConstructorsResponse);
    const semantic1 = SemanticConstructable.from(User, undefined, client);
    const semantic2 = SemanticConstructable.from(UserV2, undefined, client);

    const result = await semantic1.semanticallyEquals(semantic2);

    expect(result.equivalent).toBe(true);
  });

  test('accepts test arguments', async () => {
    const client = createMockLLMClient(mockEquivalentConstructorsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.semanticallyEquals(UserV2, [
      ['John', 30, 'john@example.com'],
    ]);

    expect(result.equivalent).toBe(true);
  });
});

// =============================================================================
// VALIDATE ARGS TESTS
// =============================================================================

describe('validateArgs()', () => {
  test('returns valid for correct arguments', async () => {
    const client = createMockLLMClient(mockValidArgsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.validateArgs(['John', 30, 'john@example.com']);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test('returns invalid for incorrect arguments', async () => {
    const client = createMockLLMClient(mockInvalidArgsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.validateArgs(['', -5, 'invalid']);

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  test('accepts additional validation rules', async () => {
    const client = createMockLLMClient(mockInvalidArgsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.validateArgs(['', -5, 'invalid'], [
      'name must not be empty',
      'age must be positive',
    ]);

    expect(result.valid).toBe(false);
  });
});

// =============================================================================
// ANALYZE INSTANCE SHAPE TESTS
// =============================================================================

describe('analyzeInstanceShape()', () => {
  test('returns properties, methods, and instanceof chain', async () => {
    const client = createMockLLMClient(mockUserShapeResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.analyzeInstanceShape();

    expect(result.properties).toHaveProperty('name');
    expect(result.properties).toHaveProperty('age');
    expect(result.properties).toHaveProperty('email');
    expect(result.methods).toContain('greet');
    expect(result.methods).toContain('toJSON');
    expect(result.instanceOf).toContain('User');
    expect(result.instanceOf).toContain('Object');
  });

  test('works with simple classes', async () => {
    const client = createMockLLMClient(mockSimpleShapeResponse);
    const semantic = SemanticConstructable.from(SimpleValue, undefined, client);

    const result = await semantic.analyzeInstanceShape();

    expect(result.properties).toHaveProperty('value');
    expect(result.methods).toContain('getValue');
    expect(result.methods).toContain('setValue');
  });
});

// =============================================================================
// EXPLAIN TESTS
// =============================================================================

describe('explain()', () => {
  test('returns human-readable explanation', async () => {
    const client = createMockLLMClient(mockUserExplanationResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const explanation = await semantic.explain();

    expect(explanation).toContain('User');
    expect(explanation.length).toBeGreaterThan(20);
  });

  test('uses provided description in explanation', async () => {
    const client = createMockLLMClient(mockUserExplanationResponse);
    const semantic = SemanticConstructable.from(
      User,
      'creates user instances for authentication',
      client
    );

    const explanation = await semantic.explain();

    expect(typeof explanation).toBe('string');
  });
});

// =============================================================================
// DETECT PATTERNS TESTS
// =============================================================================

describe('detectPatterns()', () => {
  test('detects design patterns', async () => {
    const client = createMockLLMClient(mockBuilderPatternResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const result = await semantic.detectPatterns();

    expect(result.patterns).toContain('builder');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('returns empty patterns for simple classes', async () => {
    const client = createMockLLMClient(mockNoPatternsResponse);
    const semantic = SemanticConstructable.from(SimpleValue, undefined, client);

    const result = await semantic.detectPatterns();

    expect(result.patterns).toEqual([]);
    expect(result.confidence).toBeGreaterThan(0.9);
  });
});

// =============================================================================
// GENERATE DOCS TESTS
// =============================================================================

describe('generateDocs()', () => {
  test('generates JSDoc documentation by default', async () => {
    const client = createMockLLMClient(mockJSDocResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const docs = await semantic.generateDocs();

    expect(docs).toContain('/**');
    expect(docs).toContain('@param');
  });

  test('generates JSDoc documentation explicitly', async () => {
    const client = createMockLLMClient(mockJSDocResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const docs = await semantic.generateDocs('jsdoc');

    expect(docs).toContain('/**');
    expect(docs).toContain('@param');
  });

  test('generates Markdown documentation', async () => {
    const client = createMockLLMClient(mockMarkdownDocsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const docs = await semantic.generateDocs('markdown');

    expect(docs).toContain('#');
    expect(docs).toContain('```');
  });

  test('generates plain text documentation', async () => {
    const client = createMockLLMClient(mockPlainDocsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const docs = await semantic.generateDocs('plain');

    expect(docs).toContain('Constructor');
    expect(docs).toContain('Parameters');
  });
});

// =============================================================================
// SUGGEST IMPROVEMENTS TESTS
// =============================================================================

describe('suggestImprovements()', () => {
  test('returns improvement suggestions', async () => {
    const client = createMockLLMClient(mockImprovementsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const suggestions = await semantic.suggestImprovements();

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toHaveProperty('suggestion');
    expect(suggestions[0]).toHaveProperty('reason');
  });

  test('returns empty array for well-designed constructors', async () => {
    const client = createMockLLMClient(mockNoImprovementsResponse);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const suggestions = await semantic.suggestImprovements();

    expect(suggestions).toEqual([]);
  });
});

// =============================================================================
// CHAINED OPERATIONS TESTS
// =============================================================================

describe('Chained operations', () => {
  test('can validate then create', async () => {
    const client = createSequentialMockLLMClient([
      mockValidArgsResponse,
    ]);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const validation = await semantic.validateArgs(['John', 30, 'john@example.com']);
    expect(validation.valid).toBe(true);

    const user = semantic.create('John', 30, 'john@example.com');
    expect(user).toBeInstanceOf(User);
  });

  test('can analyze then explain', async () => {
    const client = createSequentialMockLLMClient([
      mockUserShapeResponse,
      mockUserExplanationResponse,
    ]);
    const semantic = SemanticConstructable.from(User, undefined, client);

    const shape = await semantic.analyzeInstanceShape();
    expect(shape.properties).toHaveProperty('name');

    const explanation = await semantic.explain();
    expect(explanation.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge cases', () => {
  test('handles class with no methods', async () => {
    class DataOnly {
      x: number;
      y: number;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
      }
    }

    const shapeResponse = {
      properties: { x: 'number', y: 'number' },
      methods: [],
      instanceOf: ['DataOnly', 'Object'],
    };

    const client = createMockLLMClient(shapeResponse);
    const semantic = SemanticConstructable.from(DataOnly, undefined, client);

    const shape = await semantic.analyzeInstanceShape();
    expect(shape.methods).toEqual([]);
    expect(shape.properties).toHaveProperty('x');
  });

  test('handles class with no parameters', async () => {
    class Empty {
      createdAt: Date;
      constructor() {
        this.createdAt = new Date();
      }
    }

    const client = createMockLLMClient(mockValidArgsResponse);
    const semantic = SemanticConstructable.from(Empty, undefined, client);

    const result = await semantic.validateArgs([]);
    expect(result.valid).toBe(true);

    const instance = semantic.create();
    expect(instance).toBeInstanceOf(Empty);
  });

  test('handles inherited classes', async () => {
    class Base {
      id: string;
      constructor(id: string) {
        this.id = id;
      }
    }

    class Derived extends Base {
      name: string;
      constructor(id: string, name: string) {
        super(id);
        this.name = name;
      }
    }

    const shapeResponse = {
      properties: { id: 'string', name: 'string' },
      methods: [],
      instanceOf: ['Derived', 'Base', 'Object'],
    };

    const client = createMockLLMClient(shapeResponse);
    const semantic = SemanticConstructable.from(Derived, undefined, client);

    const shape = await semantic.analyzeInstanceShape();
    expect(shape.instanceOf).toContain('Base');
    expect(shape.instanceOf).toContain('Derived');
  });
});
