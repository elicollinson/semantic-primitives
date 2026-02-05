/**
 * Evaluation dataset for SemanticError.inferRootCause()
 * Tests root cause analysis inference for errors
 */

import type { EvalDataset } from '../../../shared/eval-types.ts';

export const dataset: EvalDataset = {
  name: 'SemanticError.inferRootCause',
  description: 'Evaluate root cause inference from error messages and context',
  version: '1.0.0',
  targetClass: 'SemanticError',
  targetMethod: 'inferRootCause',
  isStaticMethod: false,
  factoryMethod: 'from',
  factoryAsync: false,

  cases: [
    // ==========================================================================
    // Obvious Root Causes (Easy)
    // ==========================================================================
    {
      id: 'root-cause-econnrefused',
      description: 'Should infer service not running from ECONNREFUSED',
      input: {
        value: 'connect ECONNREFUSED 127.0.0.1:5432',
      },
      expected: {
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Infers that the service (likely PostgreSQL on port 5432) is not running or not accepting connections',
        'Confidence is reasonably high for a clear error',
        'Root cause references the target service or process',
      ],
      tags: ['network', 'service-down', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'root-cause-oom',
      description: 'Should infer memory exhaustion from OOM error',
      input: {
        value: 'FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory',
      },
      expected: {
        confidence: { min: 0.8, max: 1.0 },
      },
      criteria: [
        'Infers memory exhaustion or leak as root cause',
        'May suggest heap size limit or memory leak',
        'High confidence for clear OOM condition',
      ],
      tags: ['memory', 'resource', 'basic'],
      difficulty: 'easy',
    },
    {
      id: 'root-cause-missing-env',
      description: 'Should infer missing configuration from undefined env variable',
      input: {
        value: "TypeError: Cannot read properties of undefined (reading 'split'). Error in config.ts:15 processing DATABASE_URL",
      },
      expected: {
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Infers that DATABASE_URL environment variable is not set or undefined',
        'References configuration or environment setup as root cause',
      ],
      tags: ['configuration', 'environment', 'basic'],
      difficulty: 'easy',
    },

    // ==========================================================================
    // Inferring Beyond the Immediate Error (Medium)
    // ==========================================================================
    {
      id: 'root-cause-pool-exhaustion',
      description: 'Should infer connection leak from pool exhaustion',
      input: {
        value: 'Error: connection pool exhausted, all 10 connections are in use. Waited 30s for available connection.',
      },
      expected: {
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Infers connection leak or insufficient pool size as root cause',
        'Goes beyond the surface error to suggest connections are not being released',
        'May suggest increasing pool size or fixing connection management',
      ],
      tags: ['database', 'pool', 'leak'],
      difficulty: 'medium',
    },
    {
      id: 'root-cause-cert-expired',
      description: 'Should infer certificate management issue from SSL error',
      input: {
        value: 'Error: SSL certificate has expired. Certificate valid until 2024-01-01T00:00:00Z.',
      },
      expected: {
        confidence: { min: 0.7, max: 1.0 },
      },
      criteria: [
        'Infers certificate renewal process failure as root cause',
        'References certificate management or auto-renewal',
        'Goes beyond "cert expired" to explain why',
      ],
      tags: ['ssl', 'certificate', 'management'],
      difficulty: 'medium',
    },
    {
      id: 'root-cause-disk-full',
      description: 'Should infer log rotation issue from disk full error',
      input: {
        value: 'ENOSPC: no space left on device, write to /var/log/app/output.log',
      },
      expected: {
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Infers excessive logging or missing log rotation as root cause',
        'Identifies /var/log as the location suggesting log-related cause',
        'May suggest log rotation or cleanup strategies',
      ],
      tags: ['disk', 'logging', 'resource'],
      difficulty: 'medium',
    },
    {
      id: 'root-cause-null-reference',
      description: 'Should infer missing data or race condition from null reference',
      input: {
        value: "TypeError: Cannot read properties of null (reading 'email'). at UserService.sendNotification (user-service.ts:45)",
      },
      expected: {
        confidence: { min: 0.5, max: 1.0 },
      },
      criteria: [
        'Infers that user object is null when it should not be',
        'May suggest missing null check, deleted user, or race condition',
        'References the specific code path or data flow',
      ],
      tags: ['runtime', 'null-reference', 'code-defect'],
      difficulty: 'medium',
    },

    // ==========================================================================
    // Complex Root Cause Analysis (Hard)
    // ==========================================================================
    {
      id: 'root-cause-cascade-failure',
      description: 'Should infer upstream service failure from cascading errors',
      input: {
        value: 'Multiple failures detected: OrderService timeout after PaymentService returned 503. CircuitBreaker opened for PaymentService.',
      },
      expected: {
        confidence: { min: 0.5, max: 1.0 },
      },
      criteria: [
        'Infers PaymentService as the origin of the cascade',
        'Recognizes the chain: PaymentService failure -> OrderService timeout -> Circuit breaker',
        'Identifies the upstream root rather than downstream symptoms',
      ],
      tags: ['cascade', 'microservices', 'complex'],
      difficulty: 'hard',
    },
    {
      id: 'root-cause-memory-leak-gradual',
      description: 'Should infer memory leak from gradual resource exhaustion',
      input: {
        value: 'Process killed by OOM killer. RSS memory grew from 256MB to 4GB over 72 hours. Last allocation request: 128MB for Buffer.',
      },
      expected: {
        confidence: { min: 0.6, max: 1.0 },
      },
      criteria: [
        'Infers gradual memory leak (not a single large allocation)',
        'Notes the 72-hour timeline as evidence of a slow leak',
        'May suggest profiling or identifying the leaking resource',
      ],
      tags: ['memory-leak', 'gradual', 'complex'],
      difficulty: 'hard',
    },
    {
      id: 'root-cause-race-condition',
      description: 'Should infer race condition from intermittent failure pattern',
      input: {
        value: 'Error: row was updated by another transaction. Conflict on table "inventory" column "quantity". Only occurs under high load (>100 req/s).',
      },
      expected: {
        confidence: { min: 0.5, max: 1.0 },
      },
      criteria: [
        'Infers race condition or insufficient transaction isolation',
        'Notes that high-load correlation suggests concurrency issue',
        'May reference optimistic locking or serialization strategies',
      ],
      tags: ['race-condition', 'concurrency', 'complex'],
      difficulty: 'hard',
    },
  ],
};
