/**
 * Mock utilities for LLM provider testing
 */

import { mock } from 'bun:test';

/** Mock OpenAI response */
export const mockOpenAIResponse = {
  id: 'chatcmpl-test',
  object: 'chat.completion',
  created: Date.now(),
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is a mock OpenAI response',
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
};

/** Mock Anthropic response */
export const mockAnthropicResponse = {
  id: 'msg-test',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'This is a mock Anthropic response',
    },
  ],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 10,
    output_tokens: 20,
  },
};

/** Mock Google response */
export const mockGoogleResponse = {
  text: () => 'This is a mock Google response',
  usageMetadata: {
    promptTokenCount: 10,
    candidatesTokenCount: 20,
    totalTokenCount: 30,
  },
};

/** Create a mock OpenAI client */
export function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: mock(() => Promise.resolve(mockOpenAIResponse)),
      },
    },
  };
}

/** Create a mock Anthropic client */
export function createMockAnthropicClient() {
  return {
    messages: {
      create: mock(() => Promise.resolve(mockAnthropicResponse)),
    },
  };
}

/** Create a mock Google GenerativeAI client */
export function createMockGoogleClient() {
  return {
    getGenerativeModel: mock(() => ({
      generateContent: mock(() =>
        Promise.resolve({
          response: mockGoogleResponse,
        })
      ),
    })),
  };
}
