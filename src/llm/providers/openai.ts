/**
 * OpenAI Provider Implementation
 */

import OpenAI from 'openai';
import type {
  ChatOptions,
  CompletionOptions,
  LLMProviderInterface,
  LLMResponse,
  Message,
} from '../types.ts';
import { getEnvConfig } from '../types.ts';

type OpenAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/** Convert our message format to OpenAI's format */
function toOpenAIMessages(messages: Message[], systemPrompt?: string): OpenAIMessage[] {
  const result: OpenAIMessage[] = [];

  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    result.push({ role: msg.role, content: msg.content });
  }

  return result;
}

export class OpenAIProvider implements LLMProviderInterface {
  readonly provider = 'openai' as const;
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey?: string, model?: string) {
    const config = getEnvConfig();
    const key = apiKey || config.openai.apiKey;

    if (!key) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    this.client = new OpenAI({ apiKey: key });
    this.defaultModel = model || config.openai.model;
  }

  async complete(options: CompletionOptions): Promise<LLMResponse> {
    const config = getEnvConfig();
    const model = options.model || this.defaultModel;

    const messages = toOpenAIMessages(
      [{ role: 'user', content: options.prompt }],
      options.systemPrompt
    );

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens ?? config.defaults.maxTokens,
      temperature: options.temperature ?? config.defaults.temperature,
      top_p: options.topP,
      stop: options.stopSequences,
    });

    const choice = response.choices[0];
    const content = choice?.message.content ?? '';

    return {
      content,
      provider: this.provider,
      model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      raw: response,
    };
  }

  async chat(options: ChatOptions): Promise<LLMResponse> {
    const config = getEnvConfig();
    const model = options.model || this.defaultModel;

    const messages = toOpenAIMessages(options.messages, options.systemPrompt);

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens ?? config.defaults.maxTokens,
      temperature: options.temperature ?? config.defaults.temperature,
      top_p: options.topP,
      stop: options.stopSequences,
    });

    const choice = response.choices[0];
    const content = choice?.message.content ?? '';

    return {
      content,
      provider: this.provider,
      model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      raw: response,
    };
  }
}
