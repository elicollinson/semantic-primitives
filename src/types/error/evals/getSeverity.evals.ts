/**
 * Evaluation dataset for SemanticError.getSeverity()
 * Tests semantic severity level assessment of errors
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticError.getSeverity',
  description: 'Evaluate severity level assessment for different types of errors',
  version: '1.0.0',
  targetClass: 'SemanticError',
  targetMethod: 'getSeverity',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: false,

  cases: [
    // ==========================================================================
    // Critical Severity (Easy)
    // ==========================================================================
    {
      id: 'severity-critical-oom',
      description: 'Should assess out-of-memory as critical',
      input: {
        value: 'FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory',
      },
      expected: {
        result: 'critical',
      },
      criteria: [
        'Returns "critical" severity level',
        'Out-of-memory is a process-terminating condition',
      ],
      tags: ['critical', 'memory', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'severity-critical-data-corruption',
      description: 'Should assess data corruption as critical',
      input: {
        value: 'FATAL: database file is corrupted. WAL records do not match data checksum.',
      },
      expected: {
        result: 'critical',
      },
      criteria: [
        'Returns "critical" severity level',
        'Data corruption risks data loss and requires immediate attention',
      ],
      tags: ['critical', 'data', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Error Severity (Easy)
    // ==========================================================================
    {
      id: 'severity-error-connection-refused',
      description: 'Should assess connection refused as error level',
      input: {
        value: 'connect ECONNREFUSED 127.0.0.1:5432',
      },
      expected: {
        result: 'error',
      },
      criteria: [
        'Returns "error" severity level',
        'Connection failure prevents service operation but is not catastrophic',
      ],
      tags: ['error', 'network', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'severity-error-500',
      description: 'Should assess HTTP 500 as error level',
      input: {
        value: 'HTTP 500 Internal Server Error: unexpected condition encountered',
      },
      expected: {
        result: 'error',
      },
      criteria: [
        'Returns "error" severity level',
        'Internal server errors indicate a real failure that needs attention',
      ],
      tags: ['error', 'http', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Warning Severity (Medium)
    // ==========================================================================
    {
      id: 'severity-warning-deprecation',
      description: 'Should assess deprecation notice as warning',
      input: {
        value: 'DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use Buffer.alloc() or Buffer.from().',
      },
      expected: {
        result: 'warning',
      },
      criteria: [
        'Returns "warning" severity level',
        'Deprecation warnings are non-blocking but should be addressed',
      ],
      tags: ['warning', 'deprecation'],
      difficulty: 'medium',
    },
    {
      id: 'severity-warning-rate-limit',
      description: 'Should assess rate limit approaching as warning',
      input: {
        value: 'Warning: API rate limit 80% consumed. 200 of 1000 requests remaining.',
      },
      expected: {
        result: 'warning',
      },
      criteria: [
        'Returns "warning" severity level',
        'Rate limit approaching is a warning, not yet an error',
      ],
      tags: ['warning', 'rate-limit'],
      difficulty: 'medium',
    },
    {
      id: 'severity-warning-validation',
      description: 'Should assess input validation failure as warning',
      input: {
        value: 'Validation failed: field "age" must be a positive integer, received -1',
      },
      expected: {
        result: 'warning',
      },
      criteria: [
        'Returns "warning" severity level',
        'Input validation failures are user-correctable, not system failures',
      ],
      tags: ['warning', 'validation'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Info Severity (Medium)
    // ==========================================================================
    {
      id: 'severity-info-retry-success',
      description: 'Should assess retry success as info level',
      input: {
        value: 'Connection failed on attempt 1 of 3, retrying in 2 seconds...',
      },
      expected: {
        result: 'info',
      },
      criteria: [
        'Returns "info" severity level',
        'Retry in progress is informational, not an error condition',
      ],
      tags: ['info', 'retry'],
      difficulty: 'medium',
    },
    {
      id: 'severity-info-cache-miss',
      description: 'Should assess cache miss as info level',
      input: {
        value: 'Cache miss for key "user:123:profile". Falling back to database query.',
      },
      expected: {
        result: 'info',
      },
      criteria: [
        'Returns "info" severity level',
        'Cache miss with fallback is normal operation, not an error',
      ],
      tags: ['info', 'cache'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Ambiguous Severity (Hard)
    // ==========================================================================
    {
      id: 'severity-ambiguous-timeout',
      description: 'Should assess timeout severity based on context',
      input: {
        value: 'Request to payment service timed out after 30s during checkout',
      },
      expected: {
        result: 'error',
      },
      criteria: [
        'Returns "error" severity',
        'Payment service timeout during checkout is serious',
        'Impacts user transaction, making it more severe than a general timeout',
      ],
      tags: ['ambiguous', 'timeout', 'payment'],
      difficulty: 'hard',
    },
    {
      id: 'severity-ambiguous-disk-space',
      description: 'Should assess low disk space severity',
      input: {
        value: 'Warning: disk usage at 95%. Only 2GB remaining on /var/log.',
      },
      expected: {
        result: 'warning',
      },
      criteria: [
        'Returns "warning" severity since space is low but not exhausted',
        'Distinguishes approaching limit (warning) from exhausted (critical)',
      ],
      tags: ['ambiguous', 'resource', 'disk'],
      difficulty: 'hard',
    },
    {
      id: 'severity-ambiguous-auth-lockout',
      description: 'Should assess account lockout severity appropriately',
      input: {
        value: 'Account locked after 5 failed login attempts. Unlock available in 30 minutes.',
      },
      expected: {
        result: 'warning',
      },
      criteria: [
        'Returns "warning" severity',
        'Account lockout is a security measure, not a system error',
        'Temporary and self-resolving condition',
      ],
      tags: ['ambiguous', 'authentication', 'security'],
      difficulty: 'hard',
    },
  ],
};
