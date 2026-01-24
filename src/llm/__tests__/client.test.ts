import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { LLMClient, getClient, clearProviderCache } from '../client.ts';

describe('LLMClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearProviderCache();
    process.env['LLM_PROVIDER'] = 'openai';
    process.env['OPENAI_API_KEY'] = 'sk-test-openai';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test-anthropic';
    process.env['GOOGLE_API_KEY'] = 'test-google-key';
  });

  afterEach(() => {
    clearProviderCache();
    process.env = { ...originalEnv };
  });

  describe('constructor', () => {
    test('creates client with default provider from environment', () => {
      const client = new LLMClient();
      expect(client).toBeInstanceOf(LLMClient);
    });

    test('creates client with explicit provider', () => {
      const client = new LLMClient({ provider: 'anthropic' });
      expect(client).toBeInstanceOf(LLMClient);
    });

    test('creates client with custom API keys', () => {
      delete process.env['OPENAI_API_KEY'];
      const client = new LLMClient({
        apiKeys: { openai: 'sk-custom-key' },
      });
      expect(client).toBeInstanceOf(LLMClient);
    });
  });

  describe('withProvider', () => {
    test('returns new client with different provider', () => {
      const client = new LLMClient({ provider: 'openai' });
      const anthropicClient = client.withProvider('anthropic');

      expect(anthropicClient).toBeInstanceOf(LLMClient);
      expect(anthropicClient).not.toBe(client);
    });
  });

  describe('complete', () => {
    test('method exists and accepts options', () => {
      const client = new LLMClient();
      expect(typeof client.complete).toBe('function');
    });
  });

  describe('chat', () => {
    test('method exists and accepts options', () => {
      const client = new LLMClient();
      expect(typeof client.chat).toBe('function');
    });
  });
});

describe('getClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearProviderCache();
    process.env['OPENAI_API_KEY'] = 'sk-test-key';
  });

  afterEach(() => {
    clearProviderCache();
    process.env = { ...originalEnv };
  });

  test('returns singleton instance', () => {
    const client1 = getClient();
    const client2 = getClient();
    expect(client1).toBe(client2);
  });

  test('returns new instance after clearProviderCache', () => {
    const client1 = getClient();
    clearProviderCache();
    const client2 = getClient();
    expect(client1).not.toBe(client2);
  });
});

describe('clearProviderCache', () => {
  beforeEach(() => {
    process.env['OPENAI_API_KEY'] = 'sk-test-key';
  });

  afterEach(() => {
    clearProviderCache();
  });

  test('clears the provider cache without error', () => {
    expect(() => clearProviderCache()).not.toThrow();
  });
});
