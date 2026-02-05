/**
 * Evaluation dataset for SemanticError.semanticallyEquals()
 * Tests semantic comparison of errors for equivalence despite different messages
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticError.semanticallyEquals',
  description: 'Evaluate semantic equality comparison between errors with different messages',
  version: '1.0.0',
  targetClass: 'SemanticError',
  targetMethod: 'semanticallyEquals',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: false,

  cases: [
    // ==========================================================================
    // Same Root Cause, Different Messages (Easy)
    // ==========================================================================
    {
      id: 'equivalent-timeout-variations',
      description: 'Should recognize two timeout errors with different wording as equivalent',
      input: {
        value: 'Request timeout after 30000ms',
        args: [new Error('Connection timed out waiting for response')],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Correctly identifies both as timeout errors',
        'Returns equivalent: true',
        'Confidence is appropriately high',
      ],
      tags: ['equivalent', 'timeout', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'equivalent-connection-refused',
      description: 'Should recognize connection refused errors as equivalent',
      input: {
        value: 'connect ECONNREFUSED 127.0.0.1:5432',
        args: [new Error('Connection refused to localhost on port 5432')],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.75, max: 1.0 },
      },
      criteria: [
        'Identifies same connection failure',
        'Recognizes ECONNREFUSED and "Connection refused" as equivalent',
      ],
      tags: ['equivalent', 'connection', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'equivalent-oom-variations',
      description: 'Should recognize OOM errors with different formatting as equivalent',
      input: {
        value: 'FATAL ERROR: Allocation failed - JavaScript heap out of memory',
        args: [new Error('Out of memory: heap allocation failed')],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Identifies both as out-of-memory errors',
        'Different phrasing does not prevent equivalence',
      ],
      tags: ['equivalent', 'memory', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Clearly Different Errors (Easy)
    // ==========================================================================
    {
      id: 'not-equivalent-timeout-vs-auth',
      description: 'Should recognize timeout and authentication errors as different',
      input: {
        value: 'Request timeout after 30000ms',
        args: [new Error('Authentication failed: invalid token')],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Correctly identifies errors as non-equivalent',
        'Timeout and auth are fundamentally different root causes',
        'High confidence in the distinction',
      ],
      tags: ['not-equivalent', 'different-category', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'not-equivalent-network-vs-validation',
      description: 'Should distinguish network error from validation error',
      input: {
        value: 'DNS resolution failed for api.example.com',
        args: [new Error('Validation error: email field is required')],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.9, max: 1.0 },
      },
      criteria: [
        'Identifies completely different error categories',
        'Very high confidence in the distinction',
      ],
      tags: ['not-equivalent', 'different-category', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Same Category, Different Subcause (Medium)
    // ==========================================================================
    {
      id: 'same-category-different-db-error',
      description: 'Should distinguish unique constraint from foreign key violation',
      input: {
        value: 'ERROR: duplicate key value violates unique constraint "users_email_key"',
        args: [new Error('ERROR: insert or update on table "orders" violates foreign key constraint "orders_user_id_fkey"')],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Recognizes both are database constraint errors',
        'Distinguishes unique constraint from foreign key violation',
        'Returns not equivalent despite same error family',
      ],
      tags: ['not-equivalent', 'database', 'nuance'],
      difficulty: 'medium',
    },
    {
      id: 'same-category-different-network',
      description: 'Should distinguish DNS failure from SSL error',
      input: {
        value: 'getaddrinfo ENOTFOUND api.example.com',
        args: [new Error('Error: SSL certificate has expired')],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Both are network-layer issues but different root causes',
        'DNS failure and SSL expiry are distinct problems',
      ],
      tags: ['not-equivalent', 'network', 'nuance'],
      difficulty: 'medium',
    },
    {
      id: 'equivalent-auth-403-variations',
      description: 'Should recognize different 403 error messages as equivalent',
      input: {
        value: 'HTTP 403 Forbidden: Access denied to /api/admin',
        args: [new Error('Forbidden: You do not have permission to access this resource')],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Recognizes both as authorization/permission errors',
        'Different messages, same access denied root cause',
      ],
      tags: ['equivalent', 'authentication', 'http'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Verbose vs Terse Messages (Medium)
    // ==========================================================================
    {
      id: 'equivalent-verbose-vs-terse',
      description: 'Should recognize verbose and terse versions of the same error',
      input: {
        value: 'ECONNRESET',
        args: [new Error('The connection was reset by the remote server while waiting for a response. This typically happens when the server closes the connection unexpectedly.')],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Recognizes ECONNRESET as a connection reset',
        'Matches terse code with verbose description',
        'Both describe the same underlying issue',
      ],
      tags: ['equivalent', 'verbose-terse', 'connection'],
      difficulty: 'medium',
    },
    {
      id: 'equivalent-stack-overflow',
      description: 'Should recognize stack overflow errors with different messages',
      input: {
        value: 'RangeError: Maximum call stack size exceeded',
        args: [new Error('Stack overflow: too much recursion')],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.75, max: 1.0 },
      },
      criteria: [
        'Both describe stack overflow conditions',
        'Different wording for the same runtime issue',
      ],
      tags: ['equivalent', 'runtime', 'recursion'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Subtle Differences (Hard)
    // ==========================================================================
    {
      id: 'subtle-read-vs-write-timeout',
      description: 'Should distinguish read timeout from connection timeout',
      input: {
        value: 'Read timed out after 30s waiting for response data',
        args: [new Error('Connection timed out: could not establish connection within 5s')],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.5, max: 0.9 },
      },
      criteria: [
        'Distinguishes read timeout (connection established, waiting for data) from connection timeout (cannot connect)',
        'Moderate confidence since both are timeouts but at different phases',
        'Recognizes the nuance between connection-phase and data-phase timeouts',
      ],
      tags: ['not-equivalent', 'timeout', 'nuance', 'subtle'],
      difficulty: 'hard',
    },
    {
      id: 'subtle-same-service-different-error',
      description: 'Should distinguish different failures on the same service',
      input: {
        value: 'Redis WRONGTYPE Operation against a key holding the wrong kind of value',
        args: [new Error('Redis connection to 127.0.0.1:6379 failed - connect ECONNREFUSED')],
      },
      expected: {
        equivalent: false,
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Both mention Redis but are fundamentally different errors',
        'One is a data type error, the other is a connection failure',
        'Does not conflate same service with same error',
      ],
      tags: ['not-equivalent', 'same-service', 'subtle'],
      difficulty: 'hard',
    },
    {
      id: 'subtle-cross-language-equivalent',
      description: 'Should recognize equivalent errors from different platforms',
      input: {
        value: 'java.sql.SQLSyntaxErrorException: Table "USERS" not found',
        args: [new Error("ERROR: relation \"users\" does not exist (PostgreSQL)")],
      },
      expected: {
        equivalent: true,
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Recognizes both describe a missing table error',
        'Cross-platform error messages with the same root cause',
        'Handles different naming conventions (Java vs PostgreSQL)',
      ],
      tags: ['equivalent', 'cross-platform', 'database'],
      difficulty: 'hard',
    },
  ],
};
