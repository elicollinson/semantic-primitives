import { describe, expect, test, mock, beforeAll, afterAll } from 'bun:test';
import {
  SemanticBun,
  SemanticBunFileRef,
  analyzeServerConfig,
  suggestServerConfig,
  isCommandSafe,
  explainCommand,
  suggestSaferCommand,
  validateEnv,
  detectSensitiveEnv,
  getEnv,
  type BunLLMClientInterface,
} from '../bun.ts';
import type { Message } from '../../../llm/types.ts';
import { join } from 'path';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(responses: Record<string, string>): BunLLMClientInterface {
  return {
    chat: mock(({ messages, systemPrompt }: { messages: Message[]; systemPrompt?: string }) => {
      // Find matching response based on system prompt or message content
      for (const [key, value] of Object.entries(responses)) {
        if (systemPrompt?.includes(key) || messages.some((m) => m.content.includes(key))) {
          return Promise.resolve({ content: value });
        }
      }
      // Default response
      return Promise.resolve({ content: '{"error": "No mock response found"}' });
    }),
  };
}

// Temporary test files directory
const TEST_DIR = join(import.meta.dir, '.test-files');
const TEST_JSON_FILE = join(TEST_DIR, 'test-package.json');
const TEST_TS_FILE = join(TEST_DIR, 'test.ts');

describe('SemanticBun', () => {
  beforeAll(() => {
    // Create test directory and files
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(
      TEST_JSON_FILE,
      JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          typescript: '^5.0.0',
        },
        devDependencies: {
          jest: '^29.0.0',
        },
      }, null, 2)
    );
    writeFileSync(
      TEST_TS_FILE,
      'export const hello = "world";\n'
    );
  });

  afterAll(() => {
    // Clean up test files
    try {
      unlinkSync(TEST_JSON_FILE);
      unlinkSync(TEST_TS_FILE);
      rmdirSync(TEST_DIR);
    } catch {
      // Ignore cleanup errors
    }
  });

  // ===========================================================================
  // SEMANTIC BUN FILE TESTS
  // ===========================================================================

  describe('SemanticBunFileRef', () => {
    describe('constructor', () => {
      test('creates instance with file path', () => {
        const fileRef = new SemanticBunFileRef('/path/to/file.json');
        expect(fileRef.path).toBe('/path/to/file.json');
      });

      test('creates instance with custom LLM client', () => {
        const mockClient = createMockLLMClient({});
        const fileRef = new SemanticBunFileRef('/path/to/file.json', mockClient);
        expect(fileRef.path).toBe('/path/to/file.json');
      });
    });

    describe('detectType()', () => {
      test('detects JSON file type', async () => {
        const mockClient = createMockLLMClient({
          'file type detection': JSON.stringify({
            type: 'json',
            subtype: 'package-json',
            confidence: 0.95,
          }),
        });

        const fileRef = new SemanticBunFileRef(TEST_JSON_FILE, mockClient);
        const result = await fileRef.detectType();
        expect(result.type).toBe('json');
        expect(result.subtype).toBe('package-json');
        expect(result.confidence).toBe(0.95);
      });

      test('detects TypeScript file type', async () => {
        const mockClient = createMockLLMClient({
          'file type detection': JSON.stringify({
            type: 'typescript',
            subtype: 'module',
            confidence: 0.92,
          }),
        });

        const fileRef = new SemanticBunFileRef(TEST_TS_FILE, mockClient);
        const result = await fileRef.detectType();
        expect(result.type).toBe('typescript');
        expect(result.subtype).toBe('module');
        expect(result.confidence).toBe(0.92);
      });

      test('detects file type from path when file does not exist', async () => {
        const mockClient = createMockLLMClient({
          'file type detection': JSON.stringify({
            type: 'yaml',
            subtype: 'config',
            confidence: 0.7,
          }),
        });

        const fileRef = new SemanticBunFileRef('/nonexistent/config.yaml', mockClient);
        const result = await fileRef.detectType();
        expect(result.type).toBe('yaml');
        expect(result.confidence).toBe(0.7);
      });
    });

    describe('explain()', () => {
      test('explains package.json contents', async () => {
        const mockClient = createMockLLMClient({
          'file content explanation': JSON.stringify({
            explanation: 'Node.js package.json with 1 production dependency (typescript) and 1 dev dependency (jest)',
          }),
        });

        const fileRef = new SemanticBunFileRef(TEST_JSON_FILE, mockClient);
        const result = await fileRef.explain();
        expect(result).toContain('package.json');
        expect(result).toContain('typescript');
      });

      test('explains TypeScript file contents', async () => {
        const mockClient = createMockLLMClient({
          'file content explanation': JSON.stringify({
            explanation: 'TypeScript module exporting a single constant named hello',
          }),
        });

        const fileRef = new SemanticBunFileRef(TEST_TS_FILE, mockClient);
        const result = await fileRef.explain();
        expect(result).toContain('TypeScript');
      });
    });

    describe('validateFor()', () => {
      test('validates file for production deployment', async () => {
        const mockClient = createMockLLMClient({
          'file validation': JSON.stringify({
            valid: false,
            issues: ['Contains devDependencies', 'No production scripts defined'],
          }),
        });

        const fileRef = new SemanticBunFileRef(TEST_JSON_FILE, mockClient);
        const result = await fileRef.validateFor('production deployment');
        expect(result.valid).toBe(false);
        expect(result.issues).toContain('Contains devDependencies');
      });

      test('validates file for development', async () => {
        const mockClient = createMockLLMClient({
          'file validation': JSON.stringify({
            valid: true,
            issues: [],
          }),
        });

        const fileRef = new SemanticBunFileRef(TEST_JSON_FILE, mockClient);
        const result = await fileRef.validateFor('development');
        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    describe('text()', () => {
      test('reads file as text', async () => {
        const fileRef = new SemanticBunFileRef(TEST_TS_FILE);
        const content = await fileRef.text();
        expect(content).toContain('export const hello');
      });
    });

    describe('json()', () => {
      test('reads and parses JSON file', async () => {
        const fileRef = new SemanticBunFileRef(TEST_JSON_FILE);
        const content = await fileRef.json<{ name: string; version: string }>();
        expect(content.name).toBe('test-package');
        expect(content.version).toBe('1.0.0');
      });
    });

    describe('exists()', () => {
      test('returns true for existing file', async () => {
        const fileRef = new SemanticBunFileRef(TEST_JSON_FILE);
        expect(await fileRef.exists()).toBe(true);
      });

      test('returns false for non-existing file', async () => {
        const fileRef = new SemanticBunFileRef('/nonexistent/file.json');
        expect(await fileRef.exists()).toBe(false);
      });
    });
  });

  describe('SemanticBun.file()', () => {
    test('creates SemanticBunFileRef instance', () => {
      const fileRef = SemanticBun.file('/path/to/file.json');
      expect(fileRef).toBeInstanceOf(SemanticBunFileRef);
      expect(fileRef.path).toBe('/path/to/file.json');
    });
  });

  // ===========================================================================
  // SEMANTIC SERVER TESTS
  // ===========================================================================

  describe('analyzeServerConfig()', () => {
    test('identifies insecure configuration', async () => {
      const mockClient = createMockLLMClient({
        'server configuration analyst': JSON.stringify({
          secure: false,
          issues: ['No HTTPS configured', 'No rate limiting'],
          suggestions: ['Enable TLS', 'Add rate limiting middleware'],
        }),
      });

      const result = await analyzeServerConfig(
        { port: 3000 },
        mockClient
      );
      expect(result.secure).toBe(false);
      expect(result.issues).toContain('No HTTPS configured');
      expect(result.suggestions).toContain('Enable TLS');
    });

    test('identifies secure configuration', async () => {
      const mockClient = createMockLLMClient({
        'server configuration analyst': JSON.stringify({
          secure: true,
          issues: [],
          suggestions: ['Consider adding request logging'],
        }),
      });

      const result = await analyzeServerConfig(
        { port: 443, tls: { key: 'key.pem', cert: 'cert.pem' } },
        mockClient
      );
      expect(result.secure).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('identifies WebSocket configuration issues', async () => {
      const mockClient = createMockLLMClient({
        'server configuration analyst': JSON.stringify({
          secure: false,
          issues: ['WebSocket has no authentication'],
          suggestions: ['Add authentication to WebSocket connections'],
        }),
      });

      const result = await analyzeServerConfig(
        { port: 3000, websocket: { open: () => {}, message: () => {} } },
        mockClient
      );
      expect(result.issues).toContain('WebSocket has no authentication');
    });
  });

  describe('suggestServerConfig()', () => {
    test('suggests REST API configuration', async () => {
      const mockClient = createMockLLMClient({
        'server configuration expert': JSON.stringify({
          port: 3000,
          hostname: '0.0.0.0',
          development: false,
        }),
      });

      const result = await suggestServerConfig(
        { purpose: 'REST API', scale: 'medium' },
        mockClient
      );
      expect(result).toHaveProperty('port');
    });

    test('suggests WebSocket server configuration', async () => {
      const mockClient = createMockLLMClient({
        'server configuration expert': JSON.stringify({
          port: 8080,
          websocket: {
            open: 'function',
            message: 'function',
            close: 'function',
          },
        }),
      });

      const result = await suggestServerConfig(
        { purpose: 'Real-time WebSocket server' },
        mockClient
      );
      expect(result).toHaveProperty('websocket');
    });

    test('suggests configuration for large scale', async () => {
      const mockClient = createMockLLMClient({
        'server configuration expert': JSON.stringify({
          port: 3000,
          maxRequestBodySize: 1024 * 1024 * 10,
          reusePort: true,
        }),
      });

      const result = await suggestServerConfig(
        { purpose: 'High-traffic API', scale: 'large' },
        mockClient
      );
      expect(result).toBeDefined();
    });
  });

  describe('SemanticBun.analyzeServerConfig()', () => {
    test('is accessible from namespace', async () => {
      const mockClient = createMockLLMClient({
        'server configuration analyst': JSON.stringify({
          secure: true,
          issues: [],
          suggestions: [],
        }),
      });

      const result = await SemanticBun.analyzeServerConfig({ port: 443 }, mockClient);
      expect(result.secure).toBe(true);
    });
  });

  // ===========================================================================
  // SEMANTIC SHELL TESTS
  // ===========================================================================

  describe('isCommandSafe()', () => {
    test('identifies dangerous rm -rf command', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety': JSON.stringify({
          safe: false,
          reason: 'Destructive command targeting root directory',
          risks: ['System destruction', 'Data loss', 'Irreversible'],
        }),
      });

      const result = await isCommandSafe('rm -rf /', mockClient);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Destructive');
      expect(result.risks).toContain('System destruction');
    });

    test('identifies safe ls command', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety': JSON.stringify({
          safe: true,
          risks: [],
        }),
      });

      const result = await isCommandSafe('ls -la', mockClient);
      expect(result.safe).toBe(true);
      expect(result.risks).toHaveLength(0);
    });

    test('identifies sudo command risks', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety': JSON.stringify({
          safe: false,
          reason: 'Requires elevated privileges',
          risks: ['Privilege escalation', 'System-wide changes'],
        }),
      });

      const result = await isCommandSafe('sudo apt install nginx', mockClient);
      expect(result.safe).toBe(false);
      expect(result.risks).toContain('Privilege escalation');
    });

    test('identifies command injection risks', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety': JSON.stringify({
          safe: false,
          reason: 'Potential command injection vulnerability',
          risks: ['Command injection'],
        }),
      });

      const result = await isCommandSafe('echo $USER; rm -rf /', mockClient);
      expect(result.safe).toBe(false);
    });
  });

  describe('explainCommand()', () => {
    test('explains find and wc command', async () => {
      const mockClient = createMockLLMClient({
        'shell command explanation': JSON.stringify({
          explanation: 'Counts total lines of code in all TypeScript files recursively',
        }),
      });

      const result = await explainCommand("find . -name '*.ts' | xargs wc -l", mockClient);
      expect(result).toContain('TypeScript');
      expect(result).toContain('lines');
    });

    test('explains git command', async () => {
      const mockClient = createMockLLMClient({
        'shell command explanation': JSON.stringify({
          explanation: 'Creates a new git commit with the specified message',
        }),
      });

      const result = await explainCommand('git commit -m "feat: add new feature"', mockClient);
      expect(result).toContain('commit');
    });

    test('explains complex piped command', async () => {
      const mockClient = createMockLLMClient({
        'shell command explanation': JSON.stringify({
          explanation: 'Lists all files, filters for .js files, sorts them, and displays the first 10',
        }),
      });

      const result = await explainCommand('ls -la | grep ".js" | sort | head -10', mockClient);
      expect(result).toContain('files');
    });
  });

  describe('suggestSaferCommand()', () => {
    test('suggests interactive mode for rm', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety advisor': JSON.stringify({
          command: 'rm -i file.txt',
          reason: 'Interactive mode prevents accidental deletion',
        }),
      });

      const result = await suggestSaferCommand('rm file.txt', mockClient);
      expect(result).not.toBeNull();
      expect(result?.command).toBe('rm -i file.txt');
      expect(result?.reason).toContain('Interactive');
    });

    test('returns null for already safe command', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety advisor': JSON.stringify({
          command: null,
          reason: 'Command is already safe',
        }),
      });

      const result = await suggestSaferCommand('ls -la', mockClient);
      expect(result).toBeNull();
    });

    test('suggests safer alternative for chmod', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety advisor': JSON.stringify({
          command: 'chmod 644 file.txt',
          reason: 'More restrictive permissions than 777',
        }),
      });

      const result = await suggestSaferCommand('chmod 777 file.txt', mockClient);
      expect(result).not.toBeNull();
      expect(result?.command).toContain('644');
    });
  });

  describe('SemanticBun shell methods', () => {
    test('isCommandSafe is accessible from namespace', async () => {
      const mockClient = createMockLLMClient({
        'shell command safety': JSON.stringify({
          safe: true,
          risks: [],
        }),
      });

      const result = await SemanticBun.isCommandSafe('echo hello', mockClient);
      expect(result.safe).toBe(true);
    });

    test('explainCommand is accessible from namespace', async () => {
      const mockClient = createMockLLMClient({
        'shell command explanation': JSON.stringify({
          explanation: 'Prints hello to stdout',
        }),
      });

      const result = await SemanticBun.explainCommand('echo hello', mockClient);
      expect(result).toContain('hello');
    });
  });

  // ===========================================================================
  // SEMANTIC ENV TESTS
  // ===========================================================================

  describe('validateEnv()', () => {
    test('identifies missing environment variables', async () => {
      const mockClient = createMockLLMClient({
        'environment variable validation': JSON.stringify({
          valid: false,
          missing: ['API_KEY'],
          suggestions: [
            { variable: 'API_KEY', example: 'sk-xxxxxxxxxxxxx' },
          ],
        }),
      });

      const result = await validateEnv(['DATABASE_URL', 'API_KEY'], mockClient);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('API_KEY');
      expect(result.suggestions[0]?.variable).toBe('API_KEY');
    });

    test('validates all present environment variables', async () => {
      const mockClient = createMockLLMClient({
        'environment variable validation': JSON.stringify({
          valid: true,
          missing: [],
          suggestions: [],
        }),
      });

      const result = await validateEnv(['PATH', 'HOME'], mockClient);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('detectSensitiveEnv()', () => {
    test('identifies sensitive environment variables', async () => {
      const mockClient = createMockLLMClient({
        'security analyst': JSON.stringify({
          sensitive: ['DATABASE_URL', 'API_KEY', 'SECRET_KEY'],
          recommendation: 'Store these in a secrets manager like AWS Secrets Manager or HashiCorp Vault',
        }),
      });

      const result = await detectSensitiveEnv(mockClient);
      expect(result.sensitive.length).toBeGreaterThanOrEqual(0);
      expect(result.recommendation).toBeDefined();
    });

    test('provides security recommendations', async () => {
      const mockClient = createMockLLMClient({
        'security analyst': JSON.stringify({
          sensitive: [],
          recommendation: 'No sensitive variables detected',
        }),
      });

      const result = await detectSensitiveEnv(mockClient);
      expect(result.recommendation).toBeDefined();
    });
  });

  describe('getEnv()', () => {
    test('returns direct match for exact variable name', async () => {
      const mockClient = createMockLLMClient({});
      // PATH should exist on all systems
      const result = await getEnv('PATH', mockClient);
      expect(result).toBeDefined();
    });

    test('uses semantic matching for description', async () => {
      const mockClient = createMockLLMClient({
        'environment variable matching': JSON.stringify({
          matchedVariable: 'HOME',
          confidence: 0.95,
        }),
      });

      const result = await getEnv('user home directory', mockClient);
      // HOME should exist on most systems
      expect(result).toBeDefined();
    });

    test('returns undefined for no match', async () => {
      const mockClient = createMockLLMClient({
        'environment variable matching': JSON.stringify({
          matchedVariable: null,
          confidence: 0,
        }),
      });

      const result = await getEnv('nonexistent variable description', mockClient);
      expect(result).toBeUndefined();
    });

    test('returns undefined for low confidence match', async () => {
      const mockClient = createMockLLMClient({
        'environment variable matching': JSON.stringify({
          matchedVariable: 'SOME_VAR',
          confidence: 0.3,
        }),
      });

      const result = await getEnv('vague description', mockClient);
      expect(result).toBeUndefined();
    });
  });

  describe('SemanticBun env methods', () => {
    test('validateEnv is accessible from namespace', async () => {
      const mockClient = createMockLLMClient({
        'environment variable validation': JSON.stringify({
          valid: true,
          missing: [],
          suggestions: [],
        }),
      });

      const result = await SemanticBun.validateEnv(['PATH'], mockClient);
      expect(result.valid).toBe(true);
    });

    test('detectSensitiveEnv is accessible from namespace', async () => {
      const mockClient = createMockLLMClient({
        'security analyst': JSON.stringify({
          sensitive: [],
          recommendation: 'No sensitive variables',
        }),
      });

      const result = await SemanticBun.detectSensitiveEnv(mockClient);
      expect(result.recommendation).toBeDefined();
    });

    test('getEnv is accessible from namespace', async () => {
      const mockClient = createMockLLMClient({});
      const result = await SemanticBun.getEnv('PATH', mockClient);
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // INTEGRATION TESTS
  // ===========================================================================

  describe('Integration scenarios', () => {
    test('full file analysis workflow', async () => {
      const mockClient = createMockLLMClient({
        'file type detection': JSON.stringify({
          type: 'json',
          subtype: 'package-json',
          confidence: 0.98,
        }),
        'file content explanation': JSON.stringify({
          explanation: 'Node.js package configuration file',
        }),
        'file validation': JSON.stringify({
          valid: true,
          issues: [],
        }),
      });

      const fileRef = SemanticBun.file(TEST_JSON_FILE, mockClient);

      // Check existence
      const exists = await fileRef.exists();
      expect(exists).toBe(true);

      // Detect type
      const typeResult = await fileRef.detectType();
      expect(typeResult.type).toBe('json');

      // Explain
      const explanation = await fileRef.explain();
      expect(explanation).toContain('package');

      // Validate
      const validation = await fileRef.validateFor('development');
      expect(validation.valid).toBe(true);

      // Read content
      const json = await fileRef.json<{ name: string }>();
      expect(json.name).toBe('test-package');
    });

    test('command safety and improvement workflow', async () => {
      // Create separate mock clients to avoid key collision
      const safetyMockClient = createMockLLMClient({
        'shell command safety analyst': JSON.stringify({
          safe: false,
          reason: 'No confirmation before deletion',
          risks: ['Accidental deletion'],
        }),
      });

      const explainMockClient = createMockLLMClient({
        'shell command explanation': JSON.stringify({
          explanation: 'Recursively removes the temp directory and all its contents',
        }),
      });

      const saferMockClient = createMockLLMClient({
        'safety advisor': JSON.stringify({
          command: 'rm -ri /tmp/mydir',
          reason: 'Interactive mode asks for confirmation',
        }),
      });

      const command = 'rm -r /tmp/mydir';

      // Check safety
      const safety = await SemanticBun.isCommandSafe(command, safetyMockClient);
      expect(safety.safe).toBe(false);

      // Explain
      const explanation = await SemanticBun.explainCommand(command, explainMockClient);
      expect(explanation).toContain('remove');

      // Get safer alternative
      const safer = await SemanticBun.suggestSaferCommand(command, saferMockClient);
      expect(safer).not.toBeNull();
      expect(safer?.command).toInclude('-ri');
    });
  });
});
