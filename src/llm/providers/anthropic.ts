/**
 * Anthropic Provider Implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ChatOptions,
  CompletionOptions,
  LLMProviderInterface,
  LLMResponse,
  Message,
} from '../types.ts';
import { getEnvConfig } from '../types.ts';

type AnthropicMessage = Anthropic.MessageParam;

/** Convert our message format to Anthropic's format */
function toAnthropicMessages(messages: Message[]): AnthropicMessage[] {
  return messages
    .filter((msg) => msg.role !== 'system') // Anthropic uses separate system param
    .map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
}

/** Extract system message from messages array */
function extractSystemMessage(messages: Message[], systemPrompt?: string): string | undefined {
  if (systemPrompt) return systemPrompt;

  const systemMsg = messages.find((msg) => msg.role === 'system');
  return systemMsg?.content;
}

export class AnthropicProvider implements LLMProviderInterface {
  readonly provider = 'anthropic' as const;
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey?: string, model?: string) {
    const config = getEnvConfig();
    const key = apiKey || config.anthropic.apiKey;

    if (!key) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
    }

    this.client = new Anthropic({ apiKey: key });
    this.defaultModel = model || config.anthropic.model;
  }

  async complete(options: CompletionOptions): Promise<LLMResponse> {
    const config = getEnvConfig();
    const model = options.model || this.defaultModel;

    const response = await this.client.messages.create({
      model,
      max_tokens: options.maxTokens ?? config.defaults.maxTokens,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.prompt }],
      temperature: options.temperature ?? config.defaults.temperature,
      top_p: options.topP,
      stop_sequences: options.stopSequences,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const content = textBlock?.type === 'text' ? textBlock.text : '';

    return {
      content,
      provider: this.provider,
      model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      raw: response,
    };
  }

  async chat(options: ChatOptions): Promise<LLMResponse> {
    const config = getEnvConfig();
    const model = options.model || this.defaultModel;

    const systemMessage = extractSystemMessage(options.messages, options.systemPrompt);
    const messages = toAnthropicMessages(options.messages);

    const response = await this.client.messages.create({
      model,
      max_tokens: options.maxTokens ?? config.defaults.maxTokens,
      system: systemMessage,
      messages,
      temperature: options.temperature ?? config.defaults.temperature,
      top_p: options.topP,
      stop_sequences: options.stopSequences,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const content = textBlock?.type === 'text' ? textBlock.text : '';

    return {
      content,
      provider: this.provider,
      model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      raw: response,
    };
  }
}
