/**
 * Evaluation dataset for SemanticString.classify()
 * Tests classification of text into predefined categories
 */

import type { EvalDataset } from '../../../../evaluation/types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticString.classify',
  description: 'Evaluate text classification into predefined categories',
  version: '1.0.0',
  targetClass: 'SemanticString',
  targetMethod: 'classify',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: true,

  cases: [
    // ==========================================================================
    // Sentiment Classification (Easy)
    // ==========================================================================
    {
      id: 'sentiment-positive-love',
      description: 'Should classify "I love this product" as positive',
      input: {
        value: 'I love this product!',
        args: [['positive', 'negative', 'neutral']],
      },
      expected: {
        category: 'positive',
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Correctly classifies as positive',
        'High confidence for clear sentiment',
        'Recognizes "love" as positive indicator',
      ],
      tags: ['sentiment', 'positive', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'sentiment-negative-terrible',
      description: 'Should classify "This is terrible" as negative',
      input: {
        value: 'This is terrible, I want a refund.',
        args: [['positive', 'negative', 'neutral']],
      },
      expected: {
        category: 'negative',
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Correctly classifies as negative',
        'Recognizes complaint language',
      ],
      tags: ['sentiment', 'negative', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'sentiment-neutral-info',
      description: 'Should classify factual statement as neutral',
      input: {
        value: 'The package arrived on Tuesday.',
        args: [['positive', 'negative', 'neutral']],
      },
      expected: {
        category: 'neutral',
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Correctly classifies factual statement as neutral',
        'No emotional indicators present',
      ],
      tags: ['sentiment', 'neutral', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Intent Classification (Medium)
    // ==========================================================================
    {
      id: 'intent-question',
      description: 'Should classify question intent correctly',
      input: {
        value: 'How do I reset my password?',
        args: [['question', 'command', 'statement', 'request']],
      },
      expected: {
        category: 'question',
        confidence: { min: 0.85, max: 1.0 },
      },
      criteria: [
        'Correctly identifies question intent',
        'Recognizes question word "how"',
        'High confidence for clear question',
      ],
      tags: ['intent', 'question', 'support'],
      difficulty: 'medium',
    },
    {
      id: 'intent-command',
      description: 'Should classify imperative as command',
      input: {
        value: 'Delete all temporary files now.',
        args: [['question', 'command', 'statement', 'request']],
      },
      expected: {
        category: 'command',
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Recognizes imperative mood',
        'Identifies direct instruction',
      ],
      tags: ['intent', 'command', 'imperative'],
      difficulty: 'medium',
    },
    {
      id: 'intent-polite-request',
      description: 'Should distinguish polite request from command',
      input: {
        value: 'Could you please send me the report?',
        args: [['question', 'command', 'statement', 'request']],
      },
      expected: {
        category: 'request',
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Distinguishes polite request from question',
        'Recognizes politeness markers',
        'Request is more accurate than question',
      ],
      tags: ['intent', 'request', 'polite'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Topic Classification (Medium)
    // ==========================================================================
    {
      id: 'topic-technology',
      description: 'Should classify tech content correctly',
      input: {
        value: 'The new CPU has 16 cores and runs at 5GHz.',
        args: [['technology', 'sports', 'politics', 'entertainment']],
      },
      expected: {
        category: 'technology',
        confidence: { min: 0.85, max: 1.0 },
      },
      criteria: [
        'Correctly identifies technology topic',
        'Recognizes technical terminology',
      ],
      tags: ['topic', 'technology'],
      difficulty: 'medium',
    },
    {
      id: 'topic-sports',
      description: 'Should classify sports content correctly',
      input: {
        value: 'The team scored a goal in the final minute to win the championship.',
        args: [['technology', 'sports', 'politics', 'entertainment']],
      },
      expected: {
        category: 'sports',
        confidence: { min: 0.85, max: 1.0 },
      },
      criteria: [
        'Correctly identifies sports topic',
        'Recognizes sports terminology',
      ],
      tags: ['topic', 'sports'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Ambiguous Cases (Hard)
    // ==========================================================================
    {
      id: 'ambiguous-mixed-sentiment',
      description: 'Should handle mixed sentiment appropriately',
      input: {
        value: 'The food was great but the service was slow.',
        args: [['positive', 'negative', 'neutral', 'mixed']],
      },
      expected: {
        category: 'mixed',
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Recognizes mixed sentiment',
        'Does not oversimplify to positive or negative',
        'Handles contrast in the text',
      ],
      tags: ['sentiment', 'mixed', 'ambiguous'],
      difficulty: 'hard',
    },
    {
      id: 'ambiguous-sarcasm',
      description: 'Should detect potential sarcasm',
      input: {
        value: 'Oh great, another meeting. Just what I needed.',
        args: [['positive', 'negative', 'neutral', 'sarcastic']],
        options: { context: 'workplace communication' },
      },
      expected: {
        category: 'sarcastic',
        confidence: { min: 0.5, max: 1.0 },
      },
      criteria: [
        'Detects sarcastic tone',
        'Does not take literal meaning at face value',
        'Uses context clues appropriately',
      ],
      tags: ['sentiment', 'sarcasm', 'tone'],
      difficulty: 'hard',
    },
    {
      id: 'ambiguous-indirect-question',
      description: 'Should handle indirect questions',
      input: {
        value: "I was wondering if you could help me.",
        args: [['question', 'command', 'statement', 'request']],
      },
      expected: {
        category: 'request',
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Recognizes indirect speech act',
        'Identifies underlying request intent',
        'Does not classify as literal statement',
      ],
      tags: ['intent', 'indirect', 'pragmatics'],
      difficulty: 'hard',
    },

    // ==========================================================================
    // Edge Cases (Hard)
    // ==========================================================================
    {
      id: 'edge-no-clear-category',
      description: 'Should handle text that does not fit categories well',
      input: {
        value: 'Hmm...',
        args: [['question', 'command', 'statement', 'greeting']],
      },
      expected: {
        confidence: { min: 0.0, max: 0.6 },
      },
      criteria: [
        'Low confidence for unclear content',
        'Does not force a confident classification',
        'Acknowledges ambiguity',
      ],
      tags: ['edge-case', 'unclear', 'low-confidence'],
      difficulty: 'hard',
    },
    {
      id: 'edge-multiple-categories',
      description: 'Should pick best category when multiple apply',
      input: {
        value: 'The AI assistant helps users with tech support questions.',
        args: [['technology', 'customer-service', 'business']],
      },
      expected: {
        confidence: { min: 0.5, max: 1.0 },
      },
      criteria: [
        'Picks most relevant category',
        'Handles overlapping categories',
        'Provides reasonable confidence',
      ],
      tags: ['edge-case', 'overlap', 'multi-category'],
      difficulty: 'hard',
    },
    {
      id: 'edge-empty-categories',
      description: 'Should handle unusual category sets',
      input: {
        value: 'The sun rises in the east.',
        args: [['fiction', 'opinion', 'fact', 'myth']],
      },
      expected: {
        category: 'fact',
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Correctly identifies factual statement',
        'Distinguishes fact from other categories',
        'High confidence for clear fact',
      ],
      tags: ['edge-case', 'fact-checking', 'epistemology'],
      difficulty: 'medium',
    },
  ],
};
