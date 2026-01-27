/**
 * Evaluation dataset for SemanticString.semanticallyEquals()
 * Tests semantic comparison of strings for meaning equivalence
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticString.semanticallyEquals',
  description: 'Evaluate semantic equality comparison between strings',
  version: '1.0.0',
  targetClass: 'SemanticString',
  targetMethod: 'semanticallyEquals',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: true,

  cases: [
    // ==========================================================================
    // Synonym Recognition (Easy)
    // ==========================================================================
    {
      id: 'synonym-happy-joyful',
      description: 'Should recognize "happy" and "joyful" as semantically equivalent',
      input: {
        value: 'I am happy',
        args: ['I am joyful'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Correctly identifies strings as semantically equivalent',
        'Recognizes happy/joyful as synonyms',
        'Confidence is appropriately high',
      ],
      tags: ['synonyms', 'emotions', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'synonym-big-large',
      description: 'Should recognize "big" and "large" as equivalent in context',
      input: {
        value: 'The house is big',
        args: ['The house is large'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Identifies semantic equivalence',
        'Recognizes size-related synonyms',
      ],
      tags: ['synonyms', 'adjectives', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'synonym-fast-quick',
      description: 'Should recognize "fast" and "quick" as equivalent',
      input: {
        value: 'She runs fast',
        args: ['She runs quickly'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.75, max: 1.0 },
      },
      criteria: [
        'Handles adverb vs adjective form',
        'Recognizes speed-related synonyms',
      ],
      tags: ['synonyms', 'adverbs', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Paraphrase Recognition (Medium)
    // ==========================================================================
    {
      id: 'paraphrase-weather-nice',
      description: 'Should recognize different phrasings about nice weather',
      input: {
        value: 'The weather is nice today',
        args: ['Today has beautiful weather'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Recognizes paraphrased content',
        'Handles different sentence structures',
        'Identifies same semantic meaning',
      ],
      tags: ['paraphrase', 'sentence-structure'],
      difficulty: 'medium',
    },
    {
      id: 'paraphrase-active-passive',
      description: 'Should equate active and passive voice expressing same meaning',
      input: {
        value: 'The cat chased the mouse',
        args: ['The mouse was chased by the cat'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Handles active/passive voice transformation',
        'Same semantic content in different voice',
      ],
      tags: ['paraphrase', 'voice', 'grammar'],
      difficulty: 'medium',
    },
    {
      id: 'paraphrase-formal-informal',
      description: 'Should recognize formal and informal versions as equivalent',
      input: {
        value: 'I would like to request your assistance',
        args: ['Can you help me?'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.65, max: 1.0 },
      },
      criteria: [
        'Handles register differences',
        'Recognizes same intent in different formality levels',
      ],
      tags: ['paraphrase', 'register', 'formality'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Non-Equivalent Strings (Medium)
    // ==========================================================================
    {
      id: 'not-equivalent-opposite',
      description: 'Should recognize "happy" and "sad" as NOT equivalent',
      input: {
        value: 'I am happy',
        args: ['I am sad'],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Correctly identifies antonyms as non-equivalent',
        'High confidence in the difference',
      ],
      tags: ['antonyms', 'emotions', 'negative'],
      difficulty: 'medium',
    },
    {
      id: 'not-equivalent-different-topic',
      description: 'Should recognize completely different topics as non-equivalent',
      input: {
        value: 'The weather is nice',
        args: ['I like pizza'],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.9, max: 1.0 },
      },
      criteria: [
        'Identifies unrelated content',
        'Very high confidence in difference',
      ],
      tags: ['unrelated', 'topics', 'negative'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Context-Sensitive (Hard)
    // ==========================================================================
    {
      id: 'context-bank-financial',
      description: 'Should distinguish "bank" meanings based on financial context',
      input: {
        value: 'I went to the bank to deposit money',
        args: ['I visited the financial institution to make a deposit'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.75, max: 1.0 },
      },
      criteria: [
        'Uses context to disambiguate "bank"',
        'Recognizes financial institution meaning',
        'High confidence with clear context',
      ],
      tags: ['homonyms', 'context', 'disambiguation'],
      difficulty: 'hard',
    },
    {
      id: 'context-bank-river',
      description: 'Should distinguish river bank from financial bank',
      input: {
        value: 'I sat by the river bank',
        args: ['I went to the financial institution'],
        options: { context: 'outdoor activities' },
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Correctly distinguishes homonyms',
        'Uses context hint appropriately',
        'Different meanings = not equivalent',
      ],
      tags: ['homonyms', 'context', 'disambiguation', 'negative'],
      difficulty: 'hard',
    },
    {
      id: 'context-temporal',
      description: 'Should recognize temporal expressions referring to same time',
      input: {
        value: 'Meet me tomorrow at noon',
        args: ['See you at 12 PM the day after today'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Resolves temporal references correctly',
        'Understands "noon" = "12 PM"',
        'Understands "tomorrow" = "day after today"',
      ],
      tags: ['temporal', 'time', 'reference'],
      difficulty: 'hard',
    },

    // ==========================================================================
    // Semantic Nuance (Hard)
    // ==========================================================================
    {
      id: 'nuance-implication',
      description: 'Should recognize implied meaning as equivalent',
      input: {
        value: 'The restaurant was empty',
        args: ['There were no customers at the restaurant'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Recognizes implication (empty implies no customers)',
        'Handles inference correctly',
      ],
      tags: ['implication', 'inference', 'nuance'],
      difficulty: 'hard',
    },
    {
      id: 'nuance-partial-overlap',
      description: 'Should recognize partial semantic overlap as not fully equivalent',
      input: {
        value: 'All dogs are animals',
        args: ['All animals are dogs'],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Recognizes logical difference (subset vs superset)',
        'Does not conflate similar structures',
        'Understands quantifier scope',
      ],
      tags: ['logic', 'quantifiers', 'nuance', 'negative'],
      difficulty: 'hard',
    },
    {
      id: 'nuance-negation',
      description: 'Should correctly handle double negation as affirmative',
      input: {
        value: 'I am not unhappy',
        args: ['I am somewhat happy'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.5, max: 0.9 },
      },
      criteria: [
        'Handles double negation correctly',
        'Recognizes litotes/understatement',
        'Moderate confidence due to subtle meaning difference',
      ],
      tags: ['negation', 'litotes', 'nuance'],
      difficulty: 'hard',
    },

    // ==========================================================================
    // Edge Cases (Hard)
    // ==========================================================================
    {
      id: 'edge-empty-strings',
      description: 'Should handle comparison of minimal content',
      input: {
        value: 'Yes',
        args: ['Affirmative'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Handles short strings correctly',
        'Recognizes affirmative expressions',
      ],
      tags: ['edge-case', 'short-text'],
      difficulty: 'hard',
    },
    {
      id: 'edge-numbers-words',
      description: 'Should equate numeric and word representations',
      input: {
        value: 'I have 5 apples',
        args: ['I have five apples'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.9, max: 1.0 },
      },
      criteria: [
        'Equates numeric and spelled-out numbers',
        'Very high confidence for simple substitution',
      ],
      tags: ['edge-case', 'numbers'],
      difficulty: 'easy',
    },
    {
      id: 'edge-abbreviations',
      description: 'Should handle common abbreviations',
      input: {
        value: 'I live in the USA',
        args: ['I live in the United States of America'],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.85, max: 1.0 },
      },
      criteria: [
        'Expands common abbreviations',
        'Recognizes country name equivalence',
      ],
      tags: ['edge-case', 'abbreviations'],
      difficulty: 'medium',
    },
  ],
};
