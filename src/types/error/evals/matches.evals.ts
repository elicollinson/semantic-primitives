/**
 * Evaluation dataset for SemanticError.matches()
 * Tests whether errors match known error patterns
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticError.matches',
  description: 'Evaluate pattern matching of errors against known error categories',
  version: '1.0.0',
  targetClass: 'SemanticError',
  targetMethod: 'matches',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: false,

  cases: [
    // ==========================================================================
    // Clear Network Matches (Easy)
    // ==========================================================================
    {
      id: 'match-network-econnrefused',
      description: 'Should match ECONNREFUSED as network-related',
      input: {
        value: 'connect ECONNREFUSED 127.0.0.1:3000',
        args: ['network-related'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for ECONNREFUSED matching network-related pattern',
        'ECONNREFUSED is a clear network error',
      ],
      tags: ['network', 'match', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'match-timeout-pattern',
      description: 'Should match request timeout as timeout pattern',
      input: {
        value: 'Request timeout after 30000ms',
        args: ['timeout'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for timeout error matching timeout pattern',
        'Clear timeout message matches the pattern',
      ],
      tags: ['timeout', 'match', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'match-auth-failure',
      description: 'Should match invalid credentials as authentication-failure',
      input: {
        value: 'Authentication failed: invalid username or password',
        args: ['authentication-failure'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for auth failure matching authentication-failure pattern',
        'Clear authentication error message',
      ],
      tags: ['authentication', 'match', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'match-not-found',
      description: 'Should match 404 as not-found',
      input: {
        value: 'HTTP 404: Resource /api/users/999 not found',
        args: ['not-found'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for 404 matching not-found pattern',
        'HTTP 404 is a classic not-found error',
      ],
      tags: ['not-found', 'http', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Clear Non-Matches (Easy)
    // ==========================================================================
    {
      id: 'no-match-timeout-vs-auth',
      description: 'Should NOT match timeout error as authentication-failure',
      input: {
        value: 'Request timeout after 30000ms',
        args: ['authentication-failure'],
      },
      expected: {
        result: false,
      },
      criteria: [
        'Returns false since timeout is not an authentication failure',
        'Correctly distinguishes timeout from auth errors',
      ],
      tags: ['no-match', 'negative', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'no-match-validation-vs-network',
      description: 'Should NOT match validation error as network-related',
      input: {
        value: 'Validation error: email field must be a valid email address',
        args: ['network-related'],
      },
      expected: {
        result: false,
      },
      criteria: [
        'Returns false since validation is not network-related',
        'Correctly distinguishes input validation from network issues',
      ],
      tags: ['no-match', 'negative', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Database Pattern Matching (Medium)
    // ==========================================================================
    {
      id: 'match-database-constraint',
      description: 'Should match constraint violation as database-error',
      input: {
        value: 'ERROR: duplicate key value violates unique constraint "users_email_key"',
        args: ['database-error'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for constraint violation matching database-error',
        'SQL constraint errors are database errors',
      ],
      tags: ['database', 'match', 'constraint'],
      difficulty: 'medium',
    },
    {
      id: 'match-database-pool-exhausted',
      description: 'Should match connection pool exhaustion as database-error',
      input: {
        value: 'Error: connection pool exhausted, max connections reached',
        args: ['database-error'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for pool exhaustion matching database-error',
        'Connection pool errors are database infrastructure errors',
      ],
      tags: ['database', 'match', 'pool'],
      difficulty: 'medium',
    },
    {
      id: 'match-invalid-input',
      description: 'Should match format validation as invalid-input',
      input: {
        value: 'Invalid argument: expected positive integer but received -5',
        args: ['invalid-input'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for argument validation matching invalid-input',
        'Recognizes input validation failures',
      ],
      tags: ['validation', 'match', 'input'],
      difficulty: 'medium',
    },
    {
      id: 'match-memory-error',
      description: 'Should match heap allocation failure as memory-error',
      input: {
        value: 'FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory',
        args: ['memory-error'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true for OOM matching memory-error',
        'Heap allocation failure is a memory error',
      ],
      tags: ['memory', 'match', 'resource'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Indirect / Implicit Matches (Hard)
    // ==========================================================================
    {
      id: 'indirect-network-dns',
      description: 'Should match DNS failure as network-related even without explicit network keyword',
      input: {
        value: 'getaddrinfo ENOTFOUND unknown-host.example.com',
        args: ['network-related'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true since DNS resolution is network-related',
        'Recognizes getaddrinfo ENOTFOUND as a network issue',
        'Does not require explicit "network" keyword in error message',
      ],
      tags: ['network', 'dns', 'indirect'],
      difficulty: 'hard',
    },
    {
      id: 'indirect-timeout-socket',
      description: 'Should match socket hang up as timeout pattern',
      input: {
        value: 'Error: socket hang up',
        args: ['timeout'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Socket hang up is typically caused by timeouts or connection drops',
        'Recognizes implicit timeout pattern',
      ],
      tags: ['timeout', 'socket', 'indirect'],
      difficulty: 'hard',
    },
    {
      id: 'indirect-not-found-enoent',
      description: 'Should match ENOENT as not-found pattern',
      input: {
        value: "ENOENT: no such file or directory, open '/app/config.json'",
        args: ['not-found'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'Returns true since ENOENT means resource not found',
        'File system "not found" matches not-found pattern',
        'Generalizes not-found beyond HTTP 404',
      ],
      tags: ['not-found', 'filesystem', 'indirect'],
      difficulty: 'hard',
    },
    {
      id: 'ambiguous-connection-reset-vs-network',
      description: 'Should match connection reset as network-related',
      input: {
        value: 'Error: read ECONNRESET',
        args: ['network-related'],
      },
      expected: {
        result: true,
      },
      criteria: [
        'ECONNRESET indicates a network-level connection issue',
        'Returns true for network-related pattern',
      ],
      tags: ['network', 'connection', 'ambiguous'],
      difficulty: 'hard',
    },
  ],
};
