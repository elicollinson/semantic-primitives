/**
 * Evaluation dataset for SemanticBoolean.from()
 * Tests the ability to parse natural language into boolean values
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticBoolean.from',
  description: 'Evaluate parsing of natural language expressions to boolean values',
  version: '1.0.0',
  targetClass: 'SemanticBoolean',
  targetMethod: 'from',
  isStaticMethod: true,
  factoryAsync: true,

  cases: [
    // ==========================================================================
    // Basic Affirmatives (Easy)
    // ==========================================================================
    {
      id: 'affirmative-yes',
      description: 'Should parse "yes" as true with high confidence',
      input: {
        value: 'yes',
      },
      expected: {
        value: true,
        confidence: { min: 0.9, max: 1.0 },
        category: 'affirmative',
      },
      criteria: [
        'Returns boolean value true',
        'Confidence is very high (>0.9)',
        'Category is classified as affirmative',
      ],
      tags: ['affirmative', 'basic', 'english'],
      difficulty: 'easy',
    },
    {
      id: 'affirmative-absolutely',
      description: 'Should parse emphatic "absolutely" as true',
      input: {
        value: 'absolutely',
      },
      expected: {
        value: true,
        confidence: { min: 0.85, max: 1.0 },
        category: 'affirmative',
      },
      criteria: [
        'Returns boolean value true',
        'Confidence is high (>0.85)',
        'Recognizes emphatic affirmative',
      ],
      tags: ['affirmative', 'emphatic', 'english'],
      difficulty: 'easy',
    },
    {
      id: 'affirmative-sure',
      description: 'Should parse casual "sure" as true',
      input: {
        value: 'sure',
      },
      expected: {
        value: true,
        confidence: { min: 0.7, max: 1.0 },
        category: 'affirmative',
      },
      criteria: [
        'Returns boolean value true',
        'Handles casual affirmative expression',
      ],
      tags: ['affirmative', 'casual', 'english'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Basic Negatives (Easy)
    // ==========================================================================
    {
      id: 'negative-no',
      description: 'Should parse "no" as false with high confidence',
      input: {
        value: 'no',
      },
      expected: {
        value: false,
        confidence: { min: 0.9, max: 1.0 },
        category: 'negative',
      },
      criteria: [
        'Returns boolean value false',
        'Confidence is very high (>0.9)',
        'Category is classified as negative',
      ],
      tags: ['negative', 'basic', 'english'],
      difficulty: 'easy',
    },
    {
      id: 'negative-nope',
      description: 'Should parse casual "nope" as false',
      input: {
        value: 'nope',
      },
      expected: {
        value: false,
        confidence: { min: 0.8, max: 1.0 },
        category: 'negative',
      },
      criteria: [
        'Returns boolean value false',
        'Handles casual negative expression',
      ],
      tags: ['negative', 'casual', 'english'],
      difficulty: 'easy',
    },
    {
      id: 'negative-never',
      description: 'Should parse emphatic "never" as false',
      input: {
        value: 'never',
      },
      expected: {
        value: false,
        confidence: { min: 0.85, max: 1.0 },
        category: 'negative',
      },
      criteria: [
        'Returns boolean value false',
        'Recognizes emphatic negative',
      ],
      tags: ['negative', 'emphatic', 'english'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Uncertain Expressions (Medium)
    // ==========================================================================
    {
      id: 'uncertain-maybe',
      description: 'Should recognize "maybe" as uncertain',
      input: {
        value: 'maybe',
      },
      expected: {
        category: 'uncertain',
        confidence: { min: 0.3, max: 0.7 },
      },
      criteria: [
        'Category is classified as uncertain',
        'Confidence reflects ambiguity (not too high or too low)',
        'Does not confidently assert true or false',
      ],
      tags: ['uncertain', 'basic'],
      difficulty: 'medium',
    },
    {
      id: 'uncertain-perhaps',
      description: 'Should recognize "perhaps" as uncertain',
      input: {
        value: 'perhaps',
      },
      expected: {
        category: 'uncertain',
        confidence: { min: 0.3, max: 0.7 },
      },
      criteria: [
        'Category is classified as uncertain',
        'Appropriately handles hedging language',
      ],
      tags: ['uncertain', 'formal'],
      difficulty: 'medium',
    },
    {
      id: 'uncertain-i-guess',
      description: 'Should recognize "I guess so" as weak affirmative or uncertain',
      input: {
        value: 'I guess so',
      },
      expected: {
        confidence: { min: 0.4, max: 0.8 },
      },
      criteria: [
        'Recognizes hesitant affirmation',
        'Confidence reflects the hesitation',
        'Either uncertain or weak affirmative is acceptable',
      ],
      tags: ['uncertain', 'hedging'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Conditional Expressions (Medium)
    // ==========================================================================
    {
      id: 'conditional-if-price',
      description: 'Should recognize "yes, if the price is right" as conditional',
      input: {
        value: 'yes, if the price is right',
      },
      expected: {
        value: true,
        category: 'conditional',
      },
      criteria: [
        'Returns boolean value true (the base answer is yes)',
        'Category is classified as conditional',
        'Recognizes the conditional clause',
      ],
      tags: ['conditional', 'clause'],
      difficulty: 'medium',
    },
    {
      id: 'conditional-depends',
      description: 'Should recognize "it depends" as conditional or uncertain',
      input: {
        value: 'it depends',
      },
      expected: {
        confidence: { min: 0.3, max: 0.7 },
      },
      criteria: [
        'Recognizes conditional/dependent nature',
        'Does not assign high confidence',
        'Category is conditional or uncertain',
      ],
      tags: ['conditional', 'ambiguous'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Context-Dependent (Hard)
    // ==========================================================================
    {
      id: 'context-professional-certainly',
      description: 'Should recognize "certainly" in professional context as strong affirmative',
      input: {
        value: 'certainly',
        options: { context: 'business meeting response' },
      },
      expected: {
        value: true,
        confidence: { min: 0.85, max: 1.0 },
        category: 'affirmative',
      },
      criteria: [
        'Returns true with high confidence',
        'Recognizes formal/professional affirmative',
        'Uses context appropriately',
      ],
      tags: ['affirmative', 'context', 'professional'],
      difficulty: 'hard',
    },
    {
      id: 'context-sarcasm-sure',
      description: 'Should handle potentially sarcastic "yeah, sure" with lower confidence',
      input: {
        value: 'yeah, sure',
        options: { context: 'skeptical response to unlikely claim' },
      },
      expected: {
        confidence: { min: 0.3, max: 0.8 },
      },
      criteria: [
        'Accounts for potential sarcasm',
        'Lower confidence than straightforward "sure"',
        'Context influences interpretation',
      ],
      tags: ['sarcasm', 'context', 'ambiguous'],
      difficulty: 'hard',
    },

    // ==========================================================================
    // Locale/Cultural (Hard)
    // ==========================================================================
    {
      id: 'locale-japanese-hai',
      description: 'Should recognize Japanese "hai" as affirmative',
      input: {
        value: 'hai',
        options: { locale: 'ja' },
      },
      expected: {
        value: true,
        confidence: { min: 0.7, max: 1.0 },
        category: 'affirmative',
      },
      criteria: [
        'Returns true',
        'Recognizes Japanese affirmative',
        'Uses locale hint appropriately',
      ],
      tags: ['locale', 'japanese', 'affirmative'],
      difficulty: 'hard',
    },
    {
      id: 'locale-spanish-si',
      description: 'Should recognize Spanish "sí" as affirmative',
      input: {
        value: 'sí',
        options: { locale: 'es' },
      },
      expected: {
        value: true,
        confidence: { min: 0.8, max: 1.0 },
        category: 'affirmative',
      },
      criteria: [
        'Returns true',
        'Recognizes Spanish affirmative with accent',
        'High confidence with locale hint',
      ],
      tags: ['locale', 'spanish', 'affirmative'],
      difficulty: 'hard',
    },
    {
      id: 'locale-german-nein',
      description: 'Should recognize German "nein" as negative',
      input: {
        value: 'nein',
        options: { locale: 'de' },
      },
      expected: {
        value: false,
        confidence: { min: 0.8, max: 1.0 },
        category: 'negative',
      },
      criteria: [
        'Returns false',
        'Recognizes German negative',
        'Uses locale appropriately',
      ],
      tags: ['locale', 'german', 'negative'],
      difficulty: 'hard',
    },

    // ==========================================================================
    // Edge Cases (Hard)
    // ==========================================================================
    {
      id: 'edge-double-negative',
      description: 'Should handle "not no" correctly as potential affirmative',
      input: {
        value: 'not no',
      },
      expected: {
        value: true,
      },
      criteria: [
        'Interprets double negative as affirmative',
        'Handles grammatical complexity',
      ],
      tags: ['edge-case', 'grammar', 'double-negative'],
      difficulty: 'hard',
    },
    {
      id: 'edge-litotes',
      description: 'Should handle litotes "not bad" appropriately',
      input: {
        value: 'not bad',
        options: { context: 'response to "do you like it?"' },
      },
      expected: {
        value: true,
        confidence: { min: 0.5, max: 0.9 },
      },
      criteria: [
        'Interprets litotes as mild affirmative',
        'Confidence reflects the understatement',
        'Not as confident as direct "yes"',
      ],
      tags: ['edge-case', 'litotes', 'understatement'],
      difficulty: 'hard',
    },
  ],
};
