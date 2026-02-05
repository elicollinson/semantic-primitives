/**
 * Evaluation dataset for SemanticError.classify()
 * Tests error classification into categories with severity and retryability assessment
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticError.classify',
  description: 'Evaluate error classification into category, severity, and retryability',
  version: '1.0.0',
  targetClass: 'SemanticError',
  targetMethod: 'classify',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: false,

  cases: [
    // ==========================================================================
    // Network Errors (Easy)
    // ==========================================================================
    {
      id: 'network-connection-refused',
      description: 'Should classify ECONNREFUSED as a network error',
      input: {
        value: 'connect ECONNREFUSED 127.0.0.1:5432',
      },
      expected: {
        category: 'network',
        severity: 'recoverable',
        retryable: true,
      },
      criteria: [
        'Correctly identifies as network category',
        'Severity is recoverable since connection may come back',
        'Marked as retryable',
      ],
      tags: ['network', 'connection', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'network-timeout',
      description: 'Should classify request timeout as a network error',
      input: {
        value: 'Request timeout after 30000ms',
      },
      expected: {
        category: 'network',
        severity: 'recoverable',
        retryable: true,
      },
      criteria: [
        'Correctly identifies as network category',
        'Recognizes timeout pattern',
        'Marked as retryable since timeouts are transient',
      ],
      tags: ['network', 'timeout', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'network-dns-resolution',
      description: 'Should classify DNS resolution failure as a network error',
      input: {
        value: 'getaddrinfo ENOTFOUND api.example.com',
      },
      expected: {
        category: 'network',
        retryable: true,
      },
      criteria: [
        'Correctly identifies as network category',
        'Recognizes DNS resolution failure',
      ],
      tags: ['network', 'dns', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Database Errors (Easy)
    // ==========================================================================
    {
      id: 'database-connection-pool',
      description: 'Should classify connection pool exhaustion as a database error',
      input: {
        value: 'Error: connection pool exhausted, all 10 connections are in use',
      },
      expected: {
        category: 'database',
        severity: 'recoverable',
        retryable: true,
      },
      criteria: [
        'Correctly identifies as database category',
        'Severity is recoverable since pool can free up',
        'Marked as retryable',
      ],
      tags: ['database', 'connection-pool', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'database-unique-constraint',
      description: 'Should classify unique constraint violation as a database error',
      input: {
        value: 'ERROR: duplicate key value violates unique constraint "users_email_key"',
      },
      expected: {
        category: 'database',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as database category',
        'Not retryable since the same data will always fail',
      ],
      tags: ['database', 'constraint', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Authentication Errors (Medium)
    // ==========================================================================
    {
      id: 'auth-token-expired',
      description: 'Should classify expired JWT as an authentication error',
      input: {
        value: 'JsonWebTokenError: jwt expired at 2024-01-15T10:30:00Z',
      },
      expected: {
        category: 'authentication',
        severity: 'recoverable',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as authentication category',
        'Severity is recoverable since token can be refreshed',
        'Not directly retryable without token refresh',
      ],
      tags: ['authentication', 'jwt', 'token'],
      difficulty: 'medium',
    },
    {
      id: 'auth-invalid-credentials',
      description: 'Should classify invalid credentials as an authentication error',
      input: {
        value: 'Authentication failed: invalid username or password',
      },
      expected: {
        category: 'authentication',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as authentication category',
        'Not retryable with same credentials',
      ],
      tags: ['authentication', 'credentials'],
      difficulty: 'medium',
    },
    {
      id: 'auth-permission-denied',
      description: 'Should classify permission denied as an authentication error',
      input: {
        value: 'PermissionError: user does not have access to resource /admin/settings',
      },
      expected: {
        category: 'authentication',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as authentication category',
        'Not retryable without permission changes',
      ],
      tags: ['authentication', 'permissions', 'authorization'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Validation Errors (Medium)
    // ==========================================================================
    {
      id: 'validation-email-format',
      description: 'Should classify email format validation as a validation error',
      input: {
        value: 'Validation failed: "not-an-email" is not a valid email address',
      },
      expected: {
        category: 'validation',
        severity: 'warning',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as validation category',
        'Severity is warning since input can be corrected',
        'Not retryable with same input',
      ],
      tags: ['validation', 'format', 'input'],
      difficulty: 'medium',
    },
    {
      id: 'validation-type-error',
      description: 'Should classify type mismatch as a validation error',
      input: {
        value: 'TypeError: Expected number but received string for field "age"',
      },
      expected: {
        category: 'validation',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as validation category',
        'Not retryable with same input',
      ],
      tags: ['validation', 'type', 'input'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Resource Errors (Medium)
    // ==========================================================================
    {
      id: 'resource-out-of-memory',
      description: 'Should classify OOM as a resource error with critical severity',
      input: {
        value: 'FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory',
      },
      expected: {
        category: 'resource',
        severity: 'critical',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as resource category',
        'Severity is critical for OOM',
        'Not retryable without configuration changes',
      ],
      tags: ['resource', 'memory', 'critical'],
      difficulty: 'medium',
    },
    {
      id: 'resource-disk-full',
      description: 'Should classify disk full as a resource error',
      input: {
        value: 'ENOSPC: no space left on device, write',
      },
      expected: {
        category: 'resource',
        severity: 'critical',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as resource category',
        'Severity is critical since writes will continue failing',
        'Not retryable without freeing disk space',
      ],
      tags: ['resource', 'disk', 'critical'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Runtime Errors (Medium)
    // ==========================================================================
    {
      id: 'runtime-null-reference',
      description: 'Should classify null reference as a runtime error',
      input: {
        value: "TypeError: Cannot read properties of null (reading 'name')",
      },
      expected: {
        category: 'runtime',
        retryable: false,
      },
      criteria: [
        'Correctly identifies as runtime category',
        'Not retryable since it is a code defect',
      ],
      tags: ['runtime', 'null-reference', 'type-error'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Ambiguous / Cross-Category (Hard)
    // ==========================================================================
    {
      id: 'ambiguous-ssl-handshake',
      description: 'Should classify SSL handshake failure appropriately',
      input: {
        value: 'Error: SSL handshake failed: TLSV1_ALERT_PROTOCOL_VERSION',
      },
      expected: {
        category: 'network',
      },
      criteria: [
        'Classifies as network (SSL/TLS is part of the network layer)',
        'Recognizes this is a configuration or protocol mismatch issue',
      ],
      tags: ['network', 'ssl', 'ambiguous'],
      difficulty: 'hard',
    },
    {
      id: 'ambiguous-rate-limited',
      description: 'Should classify rate limiting as external/network error',
      input: {
        value: 'Error 429: Too Many Requests - Rate limit exceeded. Retry after 60 seconds.',
      },
      expected: {
        retryable: true,
      },
      criteria: [
        'Correctly identifies as retryable',
        'Recognizes rate limiting pattern',
        'Category is reasonable (external or network)',
      ],
      tags: ['external', 'rate-limit', 'ambiguous'],
      difficulty: 'hard',
    },
    {
      id: 'ambiguous-cascade-failure',
      description: 'Should classify cascading failure with mixed signals',
      input: {
        value: 'ServiceUnavailable: downstream service "payment-gateway" returned 503 after circuit breaker tripped',
      },
      expected: {
        severity: 'recoverable',
        retryable: true,
      },
      criteria: [
        'Identifies as recoverable since circuit breaker suggests transient failure',
        'Marked as retryable since downstream service may recover',
        'Category is reasonable (external or network)',
      ],
      tags: ['external', 'cascade', 'circuit-breaker'],
      difficulty: 'hard',
    },
    {
      id: 'ambiguous-data-corruption',
      description: 'Should classify data corruption with appropriate severity',
      input: {
        value: 'Error: checksum mismatch on block 0x4F2A - expected abc123 but got def456. Data file may be corrupted.',
      },
      expected: {
        severity: 'critical',
        retryable: false,
      },
      criteria: [
        'Severity is critical for data corruption',
        'Not retryable since data integrity is compromised',
        'Category is reasonable (database, system, or resource)',
      ],
      tags: ['data', 'corruption', 'critical'],
      difficulty: 'hard',
    },
  ],
};
