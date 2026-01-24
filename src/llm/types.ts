/**
 * LLM Provider Types and Interfaces
 * Provides a universal API for interacting with different LLM providers
 */

/** Supported LLM providers */
export type LLMProvider = 'openai' | 'anthropic' | 'google';

/** Role in a conversation message */
export type MessageRole = 'system' | 'user' | 'assistant';

/** A single message in a conversation */
export interface Message {
  role: MessageRole;
  content: string;
}

/** Configuration for LLM requests */
export interface LLMConfig {
  /** The provider to use (defaults to LLM_PROVIDER env var) */
  provider?: LLMProvider;
  /** Model identifier (uses provider-specific default if not set) */
  model?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for response randomness (0-2) */
  temperature?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Stop sequences to end generation */
  stopSequences?: string[];
}

/** Options for a completion request */
export interface CompletionOptions extends LLMConfig {
  /** The prompt to send to the model */
  prompt: string;
  /** Optional system message to set context */
  systemPrompt?: string;
}

/** Options for a chat request */
export interface ChatOptions extends LLMConfig {
  /** Array of messages in the conversation */
  messages: Message[];
  /** Optional system message (prepended to messages) */
  systemPrompt?: string;
}

/** Standard response from an LLM request */
export interface LLMResponse {
  /** The generated text content */
  content: string;
  /** The provider that generated the response */
  provider: LLMProvider;
  /** The model that was used */
  model: string;
  /** Token usage statistics (if available) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** The raw response from the provider (for advanced use) */
  raw?: unknown;
}

/** Interface that all LLM provider implementations must follow */
export interface LLMProviderInterface {
  /** Provider identifier */
  readonly provider: LLMProvider;

  /** Generate a completion from a prompt */
  complete(options: CompletionOptions): Promise<LLMResponse>;

  /** Generate a response in a chat conversation */
  chat(options: ChatOptions): Promise<LLMResponse>;
}

/** Environment configuration for LLM */
export interface LLMEnvironment {
  provider: LLMProvider;
  openai: {
    apiKey?: string;
    model: string;
  };
  anthropic: {
    apiKey?: string;
    model: string;
  };
  google: {
    apiKey?: string;
    model: string;
  };
  defaults: {
    maxTokens: number;
    temperature: number;
  };
}

/** Get environment configuration */
export function getEnvConfig(): LLMEnvironment {
  return {
    provider: (process.env['LLM_PROVIDER'] as LLMProvider) || 'openai',
    openai: {
      apiKey: process.env['OPENAI_API_KEY'],
      model: process.env['OPENAI_MODEL'] || 'gpt-4o-mini',
    },
    anthropic: {
      apiKey: process.env['ANTHROPIC_API_KEY'],
      model: process.env['ANTHROPIC_MODEL'] || 'claude-sonnet-4-20250514',
    },
    google: {
      apiKey: process.env['GOOGLE_API_KEY'],
      model: process.env['GOOGLE_MODEL'] || 'gemini-1.5-flash',
    },
    defaults: {
      maxTokens: parseInt(process.env['LLM_MAX_TOKENS'] || '1024', 10),
      temperature: parseFloat(process.env['LLM_TEMPERATURE'] || '0.7'),
    },
  };
}
