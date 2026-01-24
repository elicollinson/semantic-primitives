/**
 * Unified LLM Client
 * Provides a single interface to interact with multiple LLM providers
 */

import type {
  ChatOptions,
  CompletionOptions,
  LLMConfig,
  LLMProvider,
  LLMProviderInterface,
  LLMResponse,
} from './types.ts';
import { getEnvConfig } from './types.ts';
import { OpenAIProvider } from './providers/openai.ts';
import { AnthropicProvider } from './providers/anthropic.ts';
import { GoogleProvider } from './providers/google.ts';

/** Cache for provider instances */
const providerCache = new Map<string, LLMProviderInterface>();

/** Get or create a provider instance */
function getProvider(provider: LLMProvider, apiKey?: string, model?: string): LLMProviderInterface {
  const cacheKey = `${provider}:${apiKey || 'default'}:${model || 'default'}`;

  let instance = providerCache.get(cacheKey);
  if (!instance) {
    switch (provider) {
      case 'openai':
        instance = new OpenAIProvider(apiKey, model);
        break;
      case 'anthropic':
        instance = new AnthropicProvider(apiKey, model);
        break;
      case 'google':
        instance = new GoogleProvider(apiKey, model);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    providerCache.set(cacheKey, instance);
  }

  return instance;
}

/**
 * LLM Client - Unified interface for LLM operations
 *
 * Uses environment variables for configuration:
 * - LLM_PROVIDER: Which provider to use (openai, anthropic, google)
 * - Provider-specific API keys and models
 */
export class LLMClient {
  private defaultProvider: LLMProvider;
  private apiKeys: Partial<Record<LLMProvider, string>>;

  constructor(config?: {
    provider?: LLMProvider;
    apiKeys?: Partial<Record<LLMProvider, string>>;
  }) {
    const envConfig = getEnvConfig();
    this.defaultProvider = config?.provider || envConfig.provider;
    this.apiKeys = config?.apiKeys || {};
  }

  /** Get the API key for a provider */
  private getApiKey(provider: LLMProvider): string | undefined {
    return this.apiKeys[provider];
  }

  /** Resolve the provider from options or default */
  private resolveProvider(options?: LLMConfig): LLMProvider {
    return options?.provider || this.defaultProvider;
  }

  /**
   * Generate a completion from a prompt
   *
   * @example
   * ```ts
   * const client = new LLMClient();
   * const response = await client.complete({
   *   prompt: "What is the capital of France?",
   *   systemPrompt: "You are a helpful geography assistant."
   * });
   * console.log(response.content);
   * ```
   */
  async complete(options: CompletionOptions): Promise<LLMResponse> {
    const provider = this.resolveProvider(options);
    const instance = getProvider(provider, this.getApiKey(provider), options.model);
    return instance.complete(options);
  }

  /**
   * Generate a response in a chat conversation
   *
   * @example
   * ```ts
   * const client = new LLMClient();
   * const response = await client.chat({
   *   messages: [
   *     { role: "user", content: "Hello!" },
   *     { role: "assistant", content: "Hi there! How can I help?" },
   *     { role: "user", content: "What's the weather like?" }
   *   ]
   * });
   * console.log(response.content);
   * ```
   */
  async chat(options: ChatOptions): Promise<LLMResponse> {
    const provider = this.resolveProvider(options);
    const instance = getProvider(provider, this.getApiKey(provider), options.model);
    return instance.chat(options);
  }

  /**
   * Switch to a different provider
   */
  withProvider(provider: LLMProvider): LLMClient {
    return new LLMClient({
      provider,
      apiKeys: this.apiKeys,
    });
  }
}

/** Default client instance using environment configuration */
let defaultClient: LLMClient | null = null;

/**
 * Get the default LLM client (singleton)
 */
export function getClient(): LLMClient {
  if (!defaultClient) {
    defaultClient = new LLMClient();
  }
  return defaultClient;
}

/**
 * Convenience function for simple completions
 *
 * @example
 * ```ts
 * const response = await complete("What is 2 + 2?");
 * console.log(response.content); // "4"
 * ```
 */
export async function complete(
  prompt: string,
  options?: Omit<CompletionOptions, 'prompt'>
): Promise<LLMResponse> {
  return getClient().complete({ prompt, ...options });
}

/**
 * Convenience function for simple chat completions
 */
export async function chat(options: ChatOptions): Promise<LLMResponse> {
  return getClient().chat(options);
}

/**
 * Clear the provider cache (useful for testing or reconfiguration)
 */
export function clearProviderCache(): void {
  providerCache.clear();
  defaultClient = null;
}
