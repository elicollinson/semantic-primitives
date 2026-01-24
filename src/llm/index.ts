/**
 * LLM Module Exports
 * Unified API for interacting with multiple LLM providers
 */

// Types
export type {
  LLMProvider,
  MessageRole,
  Message,
  LLMConfig,
  CompletionOptions,
  ChatOptions,
  LLMResponse,
  LLMProviderInterface,
  LLMEnvironment,
} from './types.ts';

export { getEnvConfig } from './types.ts';

// Client
export {
  LLMClient,
  getClient,
  complete,
  chat,
  clearProviderCache,
} from './client.ts';

// Providers (for direct use if needed)
export { OpenAIProvider } from './providers/openai.ts';
export { AnthropicProvider } from './providers/anthropic.ts';
export { GoogleProvider } from './providers/google.ts';
