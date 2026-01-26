/**
 * Unit tests for SemanticConstructable
 */
/* eslint-disable @typescript-eslint/no-extraneous-class */

import { describe, test, expect } from 'bun:test';
import { SemanticConstructable } from '../constructable.ts';
import {
  createMockLLMClient,
  mockEquivalentConstructorsResponse,
  mockNotEquivalentConstructorsResponse,
  mockPartiallyEquivalentResponse,
  mockValidArgsResponse,
  mockInvalidArgsResponse,
  mockPartiallyValidArgsResponse,
  mockTypeMismatchResponse,
  mockUserInstanceShapeResponse,
  mockSimpleInstanceShapeResponse,
  mockComplexInstanceShapeResponse,
  mockUserExplanationResponse,
  mockServiceExplanationResponse,
  mockBuilderPatternResponse,
  mockFactoryPatternResponse,
  mockSingletonPatternResponse,
  mockMultiplePatternsResponse,
  mockNoPatternsResponse,
  mockJSDocResponse,
  mockMarkdownDocsResponse,
  mockPlainDocsResponse,
  mockValidationImprovementsResponse,
  mockDocumentationImprovementsResponse,
  mockNoImprovementsResponse,
  mockMultipleImprovementsResponse,
  MockUser,
  MockUserV2,
  MockProduct,
  MockBuilder,
} from './mocks.ts';

describe('SemanticConstructable', () => {
  describe('static factory method', () => {
    test('from() creates wrapper from constructor', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      expect(wrapper.valueOf()).toBe(MockUser);
    });

    test('from() accepts description parameter', () => {
      const wrapper = SemanticConstructable.from(MockUser, 'creates user instances');
      expect(wrapper.getDescription()).toBe('creates user instances');
    });

    test('from() preserves constructor name', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      expect(wrapper.name).toBe('MockUser');
    });

    test('from() accepts custom LLM client', () => {
      const client = createMockLLMClient(mockValidArgsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);
      expect(wrapper.valueOf()).toBe(MockUser);
    });
  });

  describe('valueOf', () => {
    test('returns the underlying constructor', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      expect(wrapper.valueOf()).toBe(MockUser);
    });

    test('returned constructor creates valid instances', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      const Ctor = wrapper.valueOf();
      const instance = new Ctor('John', 30);
      expect(instance.name).toBe('John');
      expect(instance.age).toBe(30);
    });
  });

  describe('semanticallyEquals', () => {
    test('returns equivalent for similar constructors', async () => {
      const client = createMockLLMClient(mockEquivalentConstructorsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.semanticallyEquals(MockUser);

      expect(result.equivalent).toBe(true);
      expect(result.instanceDifferences).toEqual([]);
      expect(result.confidence).toBe(0.95);
    });

    test('returns not equivalent for different constructors', async () => {
      const client = createMockLLMClient(mockNotEquivalentConstructorsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.semanticallyEquals(MockProduct);

      expect(result.equivalent).toBe(false);
      expect(result.instanceDifferences.length).toBeGreaterThan(0);
    });

    test('includes instance differences in result', async () => {
      const client = createMockLLMClient(mockNotEquivalentConstructorsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.semanticallyEquals(MockUserV2);

      expect(result.instanceDifferences).toContain(
        'Different property names: firstName vs first_name'
      );
    });

    test('handles partially equivalent constructors', async () => {
      const client = createMockLLMClient(mockPartiallyEquivalentResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.semanticallyEquals(MockUserV2);

      expect(result.equivalent).toBe(true);
      expect(result.instanceDifferences.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.9);
    });

    test('accepts test arguments for comparison', async () => {
      const client = createMockLLMClient(mockEquivalentConstructorsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.semanticallyEquals(MockUserV2, [
        ['John', 30],
        ['Jane', 25],
      ]);

      expect(result.equivalent).toBe(true);
    });
  });

  describe('validateArgs', () => {
    test('returns valid for correct arguments', async () => {
      const client = createMockLLMClient(mockValidArgsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.validateArgs(['John', 30]);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    test('returns invalid for incorrect arguments', async () => {
      const client = createMockLLMClient(mockInvalidArgsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.validateArgs(['', -5]);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBe(2);
      expect(result.issues).toContain('name must not be empty');
      expect(result.issues).toContain('age must be a positive number');
    });

    test('accepts additional validation rules', async () => {
      const client = createMockLLMClient(mockPartiallyValidArgsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.validateArgs(['John', 30], [
        'email must be a valid email address',
      ]);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('email format is invalid');
    });

    test('detects type mismatches', async () => {
      const client = createMockLLMClient(mockTypeMismatchResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.validateArgs([123, 'not a number'] as unknown as [
        string,
        number,
      ]);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('Expected string');
    });
  });

  describe('analyzeInstanceShape', () => {
    test('returns properties of created instances', async () => {
      const client = createMockLLMClient(mockUserInstanceShapeResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.analyzeInstanceShape();

      expect(result.properties).toHaveProperty('name');
      expect(result.properties.name).toBe('string');
      expect(result.properties.age).toBe('number');
    });

    test('returns methods of created instances', async () => {
      const client = createMockLLMClient(mockUserInstanceShapeResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.analyzeInstanceShape();

      expect(result.methods).toContain('greet');
      expect(result.methods).toContain('toJSON');
    });

    test('returns prototype chain', async () => {
      const client = createMockLLMClient(mockUserInstanceShapeResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.analyzeInstanceShape();

      expect(result.instanceOf).toContain('User');
      expect(result.instanceOf).toContain('Object');
    });

    test('handles simple classes', async () => {
      const client = createMockLLMClient(mockSimpleInstanceShapeResponse);
      const wrapper = SemanticConstructable.from(MockProduct, undefined, client);

      const result = await wrapper.analyzeInstanceShape();

      expect(result.properties).toHaveProperty('id');
      expect(result.methods).toContain('toString');
    });

    test('handles complex classes', async () => {
      const client = createMockLLMClient(mockComplexInstanceShapeResponse);
      class ComplexService {}
      const wrapper = SemanticConstructable.from(ComplexService, undefined, client);

      const result = await wrapper.analyzeInstanceShape();

      expect(result.methods).toContain('initialize');
      expect(result.methods).toContain('start');
      expect(result.methods).toContain('stop');
      expect(result.instanceOf.length).toBeGreaterThan(1);
    });
  });

  describe('explain', () => {
    test('returns human-readable explanation', async () => {
      const client = createMockLLMClient(mockUserExplanationResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const explanation = await wrapper.explain();

      expect(explanation).toContain('User');
      expect(explanation).toContain('name');
      expect(explanation).toContain('age');
      expect(explanation).toContain('greet');
    });

    test('explains service classes', async () => {
      const client = createMockLLMClient(mockServiceExplanationResponse);
      class Service {}
      const wrapper = SemanticConstructable.from(Service, undefined, client);

      const explanation = await wrapper.explain();

      expect(explanation).toContain('service');
    });
  });

  describe('detectPatterns', () => {
    test('detects builder pattern', async () => {
      const client = createMockLLMClient(mockBuilderPatternResponse);
      const wrapper = SemanticConstructable.from(MockBuilder, undefined, client);

      const result = await wrapper.detectPatterns();

      expect(result.patterns).toContain('builder');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('detects factory pattern', async () => {
      const client = createMockLLMClient(mockFactoryPatternResponse);
      class Factory {}
      const wrapper = SemanticConstructable.from(Factory, undefined, client);

      const result = await wrapper.detectPatterns();

      expect(result.patterns).toContain('factory-method');
    });

    test('detects singleton pattern', async () => {
      const client = createMockLLMClient(mockSingletonPatternResponse);
      class Singleton {}
      const wrapper = SemanticConstructable.from(Singleton, undefined, client);

      const result = await wrapper.detectPatterns();

      expect(result.patterns).toContain('singleton');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('detects multiple patterns', async () => {
      const client = createMockLLMClient(mockMultiplePatternsResponse);
      class MultiPattern {}
      const wrapper = SemanticConstructable.from(MultiPattern, undefined, client);

      const result = await wrapper.detectPatterns();

      expect(result.patterns?.length).toBeGreaterThan(1);
      expect(result.patterns).toContain('builder');
      expect(result.patterns).toContain('factory-method');
    });

    test('returns empty array when no patterns found', async () => {
      const client = createMockLLMClient(mockNoPatternsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.detectPatterns();

      expect(result.patterns).toEqual([]);
    });
  });

  describe('generateDocs', () => {
    test('generates JSDoc format by default', async () => {
      const client = createMockLLMClient(mockJSDocResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const docs = await wrapper.generateDocs();

      expect(docs).toContain('/**');
      expect(docs).toContain('@param');
      expect(docs).toContain('*/');
    });

    test('generates JSDoc format explicitly', async () => {
      const client = createMockLLMClient(mockJSDocResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const docs = await wrapper.generateDocs('jsdoc');

      expect(docs).toContain('@param name');
      expect(docs).toContain('@param age');
    });

    test('generates Markdown format', async () => {
      const client = createMockLLMClient(mockMarkdownDocsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const docs = await wrapper.generateDocs('markdown');

      expect(docs).toContain('# User');
      expect(docs).toContain('## Parameters');
      expect(docs).toContain('| Parameter |');
    });

    test('generates plain text format', async () => {
      const client = createMockLLMClient(mockPlainDocsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const docs = await wrapper.generateDocs('plain');

      expect(docs).toContain('User');
      expect(docs).toContain('name');
      expect(docs).toContain('age');
      expect(docs).not.toContain('/**');
      expect(docs).not.toContain('#');
    });
  });

  describe('suggestImprovements', () => {
    test('suggests validation improvements', async () => {
      const client = createMockLLMClient(mockValidationImprovementsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const suggestions = await wrapper.suggestImprovements();

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]?.suggestion).toContain('validation');
    });

    test('suggests documentation improvements', async () => {
      const client = createMockLLMClient(mockDocumentationImprovementsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const suggestions = await wrapper.suggestImprovements();

      expect(suggestions.some((s) => s.suggestion.includes('JSDoc'))).toBe(true);
    });

    test('returns empty array when no improvements needed', async () => {
      const client = createMockLLMClient(mockNoImprovementsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const suggestions = await wrapper.suggestImprovements();

      expect(suggestions).toEqual([]);
    });

    test('returns multiple suggestions', async () => {
      const client = createMockLLMClient(mockMultipleImprovementsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const suggestions = await wrapper.suggestImprovements();

      expect(suggestions.length).toBe(3);
      expect(suggestions.every((s) => s.suggestion && s.reason)).toBe(true);
    });
  });

  describe('isInstance', () => {
    test('returns true for instance of the constructor', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      const user = new MockUser('John', 30);

      expect(wrapper.isInstance(user)).toBe(true);
    });

    test('returns false for instance of different constructor', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      const product = new MockProduct('1', 'Test', 99);

      expect(wrapper.isInstance(product)).toBe(false);
    });

    test('returns false for plain objects', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      const plainObject = { name: 'John', age: 30 };

      expect(wrapper.isInstance(plainObject)).toBe(false);
    });

    test('returns false for null', () => {
      const wrapper = SemanticConstructable.from(MockUser);

      expect(wrapper.isInstance(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      const wrapper = SemanticConstructable.from(MockUser);

      expect(wrapper.isInstance(undefined)).toBe(false);
    });

    test('returns false for primitives', () => {
      const wrapper = SemanticConstructable.from(MockUser);

      expect(wrapper.isInstance('string')).toBe(false);
      expect(wrapper.isInstance(123)).toBe(false);
      expect(wrapper.isInstance(true)).toBe(false);
    });
  });

  describe('createValidated', () => {
    test('creates instance when validation passes', async () => {
      const client = createMockLLMClient(mockValidArgsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.createValidated('John', 30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.instance.name).toBe('John');
        expect(result.instance.age).toBe(30);
        expect(result.instance).toBeInstanceOf(MockUser);
      }
    });

    test('returns errors when validation fails', async () => {
      const client = createMockLLMClient(mockInvalidArgsResponse);
      const wrapper = SemanticConstructable.from(MockUser, undefined, client);

      const result = await wrapper.createValidated('', -5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBe(2);
        expect(result.errors).toContain('name must not be empty');
      }
    });

    test('handles construction errors gracefully', async () => {
      class ThrowingClass {
        constructor() {
          throw new Error('Construction failed');
        }
      }
      const client = createMockLLMClient(mockValidArgsResponse);
      const wrapper = SemanticConstructable.from(ThrowingClass, undefined, client);

      const result = await wrapper.createValidated();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]).toContain('Construction failed');
      }
    });
  });

  describe('create', () => {
    test('creates instance with arguments', () => {
      const wrapper = SemanticConstructable.from(MockUser);

      const user = wrapper.create('John', 30);

      expect(user.name).toBe('John');
      expect(user.age).toBe(30);
      expect(user).toBeInstanceOf(MockUser);
    });

    test('created instance has working methods', () => {
      const wrapper = SemanticConstructable.from(MockUser);

      const user = wrapper.create('Jane', 25);

      expect(user.greet()).toBe("Hello, I'm Jane");
    });

    test('throws on construction error', () => {
      class ThrowingClass {
        constructor() {
          throw new Error('Cannot construct');
        }
      }
      const wrapper = SemanticConstructable.from(ThrowingClass);

      expect(() => wrapper.create()).toThrow('Cannot construct');
    });
  });

  describe('utility methods', () => {
    test('name returns constructor name', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      expect(wrapper.name).toBe('MockUser');
    });

    test('getDescription returns description', () => {
      const wrapper = SemanticConstructable.from(MockUser, 'creates users');
      expect(wrapper.getDescription()).toBe('creates users');
    });

    test('getDescription returns undefined when no description', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      expect(wrapper.getDescription()).toBeUndefined();
    });

    test('toString returns descriptive string', () => {
      const wrapper = SemanticConstructable.from(MockUser);
      expect(wrapper.toString()).toBe('SemanticConstructable<MockUser>');
    });

    test('toString includes description when provided', () => {
      const wrapper = SemanticConstructable.from(MockUser, 'creates user instances');
      expect(wrapper.toString()).toBe(
        'SemanticConstructable<MockUser> (creates user instances)'
      );
    });
  });
});

describe('SemanticConstructable prompts', () => {
  test('createSemanticallyEqualsPrompt includes both constructors', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      'class User { constructor(name) {} }',
      'User',
      'class Person { constructor(name) {} }',
      'Person'
    );

    expect(prompt).toContain('Constructor 1 (User)');
    expect(prompt).toContain('Constructor 2 (Person)');
    expect(prompt).toContain('class User');
    expect(prompt).toContain('class Person');
  });

  test('createSemanticallyEqualsPrompt includes test arguments', async () => {
    const { createSemanticallyEqualsPrompt } = await import('../prompts.ts');
    const prompt = createSemanticallyEqualsPrompt(
      'class User {}',
      'User',
      'class Person {}',
      'Person',
      [['John', 30]]
    );

    expect(prompt).toContain('Test arguments');
    expect(prompt).toContain('John');
  });

  test('createValidateArgsPrompt includes arguments', async () => {
    const { createValidateArgsPrompt } = await import('../prompts.ts');
    const prompt = createValidateArgsPrompt(
      'class User { constructor(name, age) {} }',
      'User',
      ['John', 30]
    );

    expect(prompt).toContain('Arguments to validate');
    expect(prompt).toContain('John');
    expect(prompt).toContain('30');
  });

  test('createValidateArgsPrompt includes rules', async () => {
    const { createValidateArgsPrompt } = await import('../prompts.ts');
    const prompt = createValidateArgsPrompt(
      'class User {}',
      'User',
      ['John'],
      ['name must not be empty']
    );

    expect(prompt).toContain('Additional validation rules');
    expect(prompt).toContain('name must not be empty');
  });

  test('createAnalyzeInstanceShapePrompt includes constructor', async () => {
    const { createAnalyzeInstanceShapePrompt } = await import('../prompts.ts');
    const prompt = createAnalyzeInstanceShapePrompt(
      'class User { name; age; greet() {} }',
      'User'
    );

    expect(prompt).toContain('User');
    expect(prompt).toContain('properties');
    expect(prompt).toContain('methods');
  });

  test('createExplainPrompt includes constructor name', async () => {
    const { createExplainPrompt } = await import('../prompts.ts');
    const prompt = createExplainPrompt('class User {}', 'User');

    expect(prompt).toContain('Explain what the constructor User creates');
  });

  test('createDetectPatternsPrompt includes pattern types', async () => {
    const { createDetectPatternsPrompt } = await import('../prompts.ts');
    const prompt = createDetectPatternsPrompt('class Builder {}', 'Builder');

    expect(prompt).toContain('Builder pattern');
    expect(prompt).toContain('Factory pattern');
    expect(prompt).toContain('Singleton pattern');
  });

  test('createGenerateDocsPrompt includes format', async () => {
    const { createGenerateDocsPrompt } = await import('../prompts.ts');
    const prompt = createGenerateDocsPrompt('class User {}', 'User', 'jsdoc');

    expect(prompt).toContain('jsdoc');
    expect(prompt).toContain('@param');
  });

  test('createSuggestImprovementsPrompt includes considerations', async () => {
    const { createSuggestImprovementsPrompt } = await import('../prompts.ts');
    const prompt = createSuggestImprovementsPrompt('class User {}', 'User');

    expect(prompt).toContain('Parameter validation');
    expect(prompt).toContain('Error handling');
    expect(prompt).toContain('TypeScript');
  });
});
