import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { getEnvConfig, type LLMProvider } from '../types.ts';

describe('getEnvConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env['LLM_PROVIDER'];
    delete process.env['OPENAI_API_KEY'];
    delete process.env['OPENAI_MODEL'];
    delete process.env['ANTHROPIC_API_KEY'];
    delete process.env['ANTHROPIC_MODEL'];
    delete process.env['GOOGLE_API_KEY'];
    delete process.env['GOOGLE_MODEL'];
    delete process.env['LLM_MAX_TOKENS'];
    delete process.env['LLM_TEMPERATURE'];
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  test('returns default values when no env vars are set', () => {
    const config = getEnvConfig();

    expect(config.provider).toBe('google');
    expect(config.openai.model).toBe('gpt-4.1-nano');
    expect(config.anthropic.model).toBe('claude-haiku-4-20250514');
    expect(config.google.model).toBe('gemini-2.5-flash-lite');
    expect(config.defaults.maxTokens).toBe(1024);
    expect(config.defaults.temperature).toBe(0.7);
  });

  test('reads LLM_PROVIDER from environment', () => {
    process.env['LLM_PROVIDER'] = 'anthropic';
    const config = getEnvConfig();
    expect(config.provider).toBe('anthropic');
  });

  test('reads API keys from environment', () => {
    process.env['OPENAI_API_KEY'] = 'sk-test-openai';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test-anthropic';
    process.env['GOOGLE_API_KEY'] = 'test-google-key';

    const config = getEnvConfig();

    expect(config.openai.apiKey).toBe('sk-test-openai');
    expect(config.anthropic.apiKey).toBe('sk-test-anthropic');
    expect(config.google.apiKey).toBe('test-google-key');
  });

  test('reads custom models from environment', () => {
    process.env['OPENAI_MODEL'] = 'gpt-4o';
    process.env['ANTHROPIC_MODEL'] = 'claude-opus-4-20250514';
    process.env['GOOGLE_MODEL'] = 'gemini-1.5-pro';

    const config = getEnvConfig();

    expect(config.openai.model).toBe('gpt-4o');
    expect(config.anthropic.model).toBe('claude-opus-4-20250514');
    expect(config.google.model).toBe('gemini-1.5-pro');
  });

  test('reads custom defaults from environment', () => {
    process.env['LLM_MAX_TOKENS'] = '2048';
    process.env['LLM_TEMPERATURE'] = '0.5';

    const config = getEnvConfig();

    expect(config.defaults.maxTokens).toBe(2048);
    expect(config.defaults.temperature).toBe(0.5);
  });

  test('handles invalid number values gracefully', () => {
    process.env['LLM_MAX_TOKENS'] = 'invalid';
    process.env['LLM_TEMPERATURE'] = 'not-a-number';

    const config = getEnvConfig();

    expect(config.defaults.maxTokens).toBeNaN();
    expect(config.defaults.temperature).toBeNaN();
  });
});

describe('Type definitions', () => {
  test('LLMProvider type accepts valid providers', () => {
    const providers: LLMProvider[] = ['openai', 'anthropic', 'google'];
    expect(providers).toHaveLength(3);
  });
});
