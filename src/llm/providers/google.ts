/**
 * Google Generative AI (Gemini) Provider Implementation
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import type {
  ChatOptions,
  CompletionOptions,
  LLMProviderInterface,
  LLMResponse,
  Message,
} from '../types.ts';
import { getEnvConfig } from '../types.ts';

/** Convert our message format to Google's format */
function toGoogleContents(messages: Message[]): Content[] {
  return messages
    .filter((msg) => msg.role !== 'system') // Google uses systemInstruction separately
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
}

/** Extract system message from messages array */
function extractSystemMessage(messages: Message[], systemPrompt?: string): string | undefined {
  if (systemPrompt) return systemPrompt;

  const systemMsg = messages.find((msg) => msg.role === 'system');
  return systemMsg?.content;
}

export class GoogleProvider implements LLMProviderInterface {
  readonly provider = 'google' as const;
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey?: string, model?: string) {
    const config = getEnvConfig();
    const key = apiKey || config.google.apiKey;

    if (!key) {
      throw new Error('Google API key is required. Set GOOGLE_API_KEY environment variable.');
    }

    this.client = new GoogleGenerativeAI(key);
    this.defaultModel = model || config.google.model;
  }

  async complete(options: CompletionOptions): Promise<LLMResponse> {
    const config = getEnvConfig();
    const modelName = options.model || this.defaultModel;

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: options.systemPrompt,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? config.defaults.maxTokens,
        temperature: options.temperature ?? config.defaults.temperature,
        topP: options.topP,
        stopSequences: options.stopSequences,
      },
    });

    const result = await model.generateContent(options.prompt);
    const response = result.response;
    const content = response.text();

    const usageMetadata = response.usageMetadata;

    return {
      content,
      provider: this.provider,
      model: modelName,
      usage: usageMetadata
        ? {
            promptTokens: usageMetadata.promptTokenCount ?? 0,
            completionTokens: usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
      raw: response,
    };
  }

  async chat(options: ChatOptions): Promise<LLMResponse> {
    const config = getEnvConfig();
    const modelName = options.model || this.defaultModel;

    const systemMessage = extractSystemMessage(options.messages, options.systemPrompt);

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemMessage,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? config.defaults.maxTokens,
        temperature: options.temperature ?? config.defaults.temperature,
        topP: options.topP,
        stopSequences: options.stopSequences,
      },
    });

    const contents = toGoogleContents(options.messages);

    // For chat, we need to use the chat interface or send all history
    const result = await model.generateContent({ contents });
    const response = result.response;
    const content = response.text();

    const usageMetadata = response.usageMetadata;

    return {
      content,
      provider: this.provider,
      model: modelName,
      usage: usageMetadata
        ? {
            promptTokens: usageMetadata.promptTokenCount ?? 0,
            completionTokens: usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
      raw: response,
    };
  }
}
