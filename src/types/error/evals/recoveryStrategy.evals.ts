/**
 * Evaluation dataset for SemanticError.recoveryStrategy()
 * Tests recovery strategy suggestions for different error types
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticError.recoveryStrategy',
  description: 'Evaluate recovery strategy recommendations for errors',
  version: '1.0.0',
  targetClass: 'SemanticError',
  targetMethod: 'recoveryStrategy',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: false,

  cases: [
    // ==========================================================================
    // Retry Strategies (Easy)
    // ==========================================================================
    {
      id: 'recovery-retry-timeout',
      description: 'Should suggest retry strategy for timeout errors',
      input: {
        value: 'Request timeout after 30000ms to api.example.com',
      },
      expected: {
        strategy: 'retry',
      },
      criteria: [
        'Returns strategy "retry"',
        'Timeout errors are transient and retryable',
        'Should include maxAttempts suggestion',
      ],
      tags: ['retry', 'timeout', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'recovery-retry-connection-reset',
      description: 'Should suggest retry for connection reset',
      input: {
        value: 'Error: read ECONNRESET',
      },
      expected: {
        strategy: 'retry',
      },
      criteria: [
        'Returns strategy "retry"',
        'Connection resets are typically transient',
      ],
      tags: ['retry', 'connection', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'recovery-retry-rate-limit',
      description: 'Should suggest retry for rate limit with backoff',
      input: {
        value: 'Error 429: Too Many Requests. Retry-After: 60',
      },
      expected: {
        strategy: 'retry',
        backoff: 'constant',
      },
      criteria: [
        'Returns strategy "retry"',
        'Rate limits benefit from waiting and retrying',
        'Backoff should respect Retry-After header guidance',
      ],
      tags: ['retry', 'rate-limit', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Fallback Strategies (Medium)
    // ==========================================================================
    {
      id: 'recovery-fallback-service-unavailable',
      description: 'Should suggest fallback for service unavailable',
      input: {
        value: 'ServiceUnavailable: primary database cluster is down for maintenance',
      },
      expected: {
        strategy: 'fallback',
      },
      criteria: [
        'Returns strategy "fallback"',
        'Maintenance implies extended downtime making retries futile',
        'Fallback to secondary/read replica is appropriate',
      ],
      tags: ['fallback', 'database', 'maintenance'],
      difficulty: 'medium',
    },
    {
      id: 'recovery-fallback-feature-disabled',
      description: 'Should suggest fallback for disabled feature',
      input: {
        value: 'FeatureDisabledError: realtime-notifications feature flag is disabled',
      },
      expected: {
        strategy: 'fallback',
      },
      criteria: [
        'Returns strategy "fallback"',
        'Disabled features need an alternative path, not retries',
      ],
      tags: ['fallback', 'feature-flag'],
      difficulty: 'medium',
    },
    {
      id: 'recovery-fallback-cache-unavailable',
      description: 'Should suggest fallback when cache is down',
      input: {
        value: 'Redis connection failed: ECONNREFUSED 127.0.0.1:6379. Cache layer unavailable.',
      },
      expected: {
        strategy: 'fallback',
      },
      criteria: [
        'Returns strategy "fallback"',
        'Cache unavailability should fall back to direct data source',
        'Recognizes cache as non-critical dependency',
      ],
      tags: ['fallback', 'cache', 'redis'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Abort Strategies (Medium)
    // ==========================================================================
    {
      id: 'recovery-abort-data-corruption',
      description: 'Should suggest abort for data corruption',
      input: {
        value: 'FATAL: data file checksum mismatch, possible corruption detected in table "transactions"',
      },
      expected: {
        strategy: 'abort',
      },
      criteria: [
        'Returns strategy "abort"',
        'Data corruption should not be retried as it may worsen',
        'Immediate stop prevents further damage',
      ],
      tags: ['abort', 'corruption', 'critical'],
      difficulty: 'medium',
    },
    {
      id: 'recovery-abort-auth-failure',
      description: 'Should suggest abort for invalid credentials',
      input: {
        value: 'Authentication failed: API key is invalid or revoked',
      },
      expected: {
        strategy: 'abort',
      },
      criteria: [
        'Returns strategy "abort"',
        'Invalid/revoked credentials will never succeed on retry',
        'Continuing would waste resources and potentially trigger lockout',
      ],
      tags: ['abort', 'authentication'],
      difficulty: 'medium',
    },
    {
      id: 'recovery-abort-schema-mismatch',
      description: 'Should suggest abort for schema incompatibility',
      input: {
        value: 'MigrationError: database schema version 15 is incompatible with application version 12',
      },
      expected: {
        strategy: 'abort',
      },
      criteria: [
        'Returns strategy "abort"',
        'Schema mismatch requires code or database changes, not retries',
      ],
      tags: ['abort', 'database', 'migration'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Ignore Strategies (Medium)
    // ==========================================================================
    {
      id: 'recovery-ignore-deprecation',
      description: 'Should suggest ignore for deprecation warnings',
      input: {
        value: 'DeprecationWarning: util.isArray is deprecated. Use Array.isArray instead.',
      },
      expected: {
        strategy: 'ignore',
      },
      criteria: [
        'Returns strategy "ignore"',
        'Deprecation warnings do not affect current functionality',
        'Can be addressed in a future maintenance cycle',
      ],
      tags: ['ignore', 'deprecation'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Context-Dependent Strategies (Hard)
    // ==========================================================================
    {
      id: 'recovery-context-circuit-breaker',
      description: 'Should suggest appropriate strategy for circuit breaker open',
      input: {
        value: 'CircuitBreakerOpenError: circuit breaker for "payment-service" is open after 5 consecutive failures',
      },
      expected: {
        strategy: 'fallback',
      },
      criteria: [
        'Returns strategy "fallback"',
        'When circuit breaker is open, retries are explicitly blocked',
        'Fallback to degraded mode is the intended behavior',
      ],
      tags: ['fallback', 'circuit-breaker', 'context'],
      difficulty: 'hard',
    },
    {
      id: 'recovery-context-partial-failure',
      description: 'Should handle partial batch failure appropriately',
      input: {
        value: 'BatchProcessingError: 3 of 100 items failed processing. Failed items: [item-42, item-67, item-89]',
      },
      expected: {
        strategy: 'retry',
      },
      criteria: [
        'Returns strategy "retry"',
        'Partial failures suggest retrying only the failed items',
        'Most items succeeded so full abort would be wasteful',
      ],
      tags: ['retry', 'batch', 'partial-failure'],
      difficulty: 'hard',
    },
    {
      id: 'recovery-context-deadlock',
      description: 'Should suggest retry with backoff for deadlock',
      input: {
        value: 'ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction',
      },
      expected: {
        strategy: 'retry',
        backoff: 'exponential',
      },
      criteria: [
        'Returns strategy "retry"',
        'Deadlocks are resolved by retrying with a different timing',
        'Exponential backoff helps avoid repeated deadlocks',
      ],
      tags: ['retry', 'deadlock', 'database'],
      difficulty: 'hard',
    },
  ],
};
