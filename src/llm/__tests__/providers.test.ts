import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { OpenAIProvider } from '../providers/openai.ts';
import { AnthropicProvider } from '../providers/anthropic.ts';
import { GoogleProvider } from '../providers/google.ts';

describe('OpenAIProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['OPENAI_API_KEY'] = 'sk-test-key';
    process.env['OPENAI_MODEL'] = 'gpt-4.1-nano';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('throws error when API key is not provided', () => {
    delete process.env['OPENAI_API_KEY'];
    expect(() => new OpenAIProvider()).toThrow('OpenAI API key is required');
  });

  test('creates instance with API key from environment', () => {
    const provider = new OpenAIProvider();
    expect(provider.provider).toBe('openai');
  });

  test('creates instance with explicit API key', () => {
    delete process.env['OPENAI_API_KEY'];
    const provider = new OpenAIProvider('sk-explicit-key');
    expect(provider.provider).toBe('openai');
  });

  test('complete method exists and is callable', () => {
    const provider = new OpenAIProvider();
    expect(typeof provider.complete).toBe('function');
  });

  test('chat method exists and is callable', () => {
    const provider = new OpenAIProvider();
    expect(typeof provider.chat).toBe('function');
  });
});

describe('AnthropicProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-test-key';
    process.env['ANTHROPIC_MODEL'] = 'claude-haiku-4-20250514';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('throws error when API key is not provided', () => {
    delete process.env['ANTHROPIC_API_KEY'];
    expect(() => new AnthropicProvider()).toThrow('Anthropic API key is required');
  });

  test('creates instance with API key from environment', () => {
    const provider = new AnthropicProvider();
    expect(provider.provider).toBe('anthropic');
  });

  test('creates instance with explicit API key', () => {
    delete process.env['ANTHROPIC_API_KEY'];
    const provider = new AnthropicProvider('sk-explicit-key');
    expect(provider.provider).toBe('anthropic');
  });

  test('complete method exists and is callable', () => {
    const provider = new AnthropicProvider();
    expect(typeof provider.complete).toBe('function');
  });

  test('chat method exists and is callable', () => {
    const provider = new AnthropicProvider();
    expect(typeof provider.chat).toBe('function');
  });
});

describe('GoogleProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['GOOGLE_API_KEY'] = 'test-google-key';
    process.env['GOOGLE_MODEL'] = 'gemini-1.5-flash';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('throws error when API key is not provided', () => {
    delete process.env['GOOGLE_API_KEY'];
    expect(() => new GoogleProvider()).toThrow('Google API key is required');
  });

  test('creates instance with API key from environment', () => {
    const provider = new GoogleProvider();
    expect(provider.provider).toBe('google');
  });

  test('creates instance with explicit API key', () => {
    delete process.env['GOOGLE_API_KEY'];
    const provider = new GoogleProvider('explicit-google-key');
    expect(provider.provider).toBe('google');
  });

  test('complete method exists and is callable', () => {
    const provider = new GoogleProvider();
    expect(typeof provider.complete).toBe('function');
  });

  test('chat method exists and is callable', () => {
    const provider = new GoogleProvider();
    expect(typeof provider.chat).toBe('function');
  });
});
