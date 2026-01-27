---
sidebar_position: 10
---

# LLM Client

The `LLMClient` class provides a unified interface for interacting with multiple AI providers. It powers all semantic operations in the library.

## Overview

```typescript
import { LLMClient } from 'semantic-primitives';

const client = new LLMClient({
  provider: 'google',
  apiKeys: {
    google: 'your-api-key'
  }
});

const response = await client.complete({
  prompt: 'Explain semantic comparison'
});

console.log(response.content);
```

## Supported Providers

| Provider | Default Model | Environment Variable |
|----------|--------------|---------------------|
| Google Gemini | `gemini-2.5-flash-lite` | `GOOGLE_API_KEY` |
| OpenAI | `gpt-4.1-nano` | `OPENAI_API_KEY` |
| Anthropic Claude | `claude-haiku-4-20250514` | `ANTHROPIC_API_KEY` |

## Creating a Client

### Using Environment Variables

The simplest approach - set your API key and the client auto-configures:

```bash
export GOOGLE_API_KEY=your-api-key
export LLM_PROVIDER=google  # Optional, defaults to google
```

```typescript
import { LLMClient } from 'semantic-primitives';

// Uses environment variables automatically
const client = new LLMClient();
```

### Programmatic Configuration

```typescript
const client = new LLMClient({
  provider: 'openai',
  apiKeys: {
    openai: 'sk-...',
    google: 'AIza...',
    anthropic: 'sk-ant-...'
  }
});
```

## Methods

### complete

Generate a completion from a prompt.

```typescript
const response = await client.complete({
  prompt: 'What is semantic comparison?',
  systemPrompt: 'You are a helpful programming assistant.',
  maxTokens: 500,
  temperature: 0.7
});

console.log(response.content);
console.log(response.usage); // { promptTokens, completionTokens, totalTokens }
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prompt` | `string` | Required | The prompt to complete |
| `systemPrompt` | `string` | - | System context/instructions |
| `provider` | `LLMProvider` | Client default | Override provider |
| `model` | `string` | Provider default | Override model |
| `maxTokens` | `number` | 1024 | Maximum response tokens |
| `temperature` | `number` | 0.7 | Randomness (0-2) |
| `topP` | `number` | - | Nucleus sampling |
| `stopSequences` | `string[]` | - | Stop generation on these |

### chat

Send a multi-turn conversation.

```typescript
const response = await client.chat({
  messages: [
    { role: 'user', content: 'What is TypeScript?' },
    { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript.' },
    { role: 'user', content: 'How does it compare to JavaScript?' }
  ],
  systemPrompt: 'You are a programming expert.'
});

console.log(response.content);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `messages` | `Message[]` | Required | Conversation history |
| `systemPrompt` | `string` | - | System context |
| `provider` | `LLMProvider` | Client default | Override provider |
| `model` | `string` | Provider default | Override model |
| `maxTokens` | `number` | 1024 | Maximum response tokens |
| `temperature` | `number` | 0.7 | Randomness (0-2) |

### withProvider

Create a new client instance with a different provider.

```typescript
const googleClient = new LLMClient({ provider: 'google' });
const openaiClient = googleClient.withProvider('openai');

// Original client unchanged
await googleClient.complete({ prompt: 'Hello' }); // Uses Google
await openaiClient.complete({ prompt: 'Hello' }); // Uses OpenAI
```

## Response Format

```typescript
interface LLMResponse {
  content: string;          // The generated text
  provider: LLMProvider;    // Provider used
  model: string;            // Model used
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: unknown;            // Raw provider response
}
```

## Using with Semantic Types

Pass a custom client to any semantic type:

```typescript
const client = new LLMClient({ provider: 'anthropic' });

// Pass to factory method
const str = SemanticString.from("Hello world", client);

// All operations use the custom client
const result = await str.classify(['greeting', 'question']);
```

## Provider-Specific Notes

### Google Gemini

```typescript
const client = new LLMClient({
  provider: 'google',
  apiKeys: { google: 'AIza...' }
});

// Available models
await client.complete({
  prompt: 'Hello',
  model: 'gemini-2.5-flash-lite'  // Fast, cheap
  // or: 'gemini-2.0-flash'       // Balanced
  // or: 'gemini-1.5-pro'         // High capability
});
```

### OpenAI

```typescript
const client = new LLMClient({
  provider: 'openai',
  apiKeys: { openai: 'sk-...' }
});

// Available models
await client.complete({
  prompt: 'Hello',
  model: 'gpt-4.1-nano'    // Fast, cheap
  // or: 'gpt-4o'         // Latest
  // or: 'gpt-4-turbo'    // High capability
});
```

### Anthropic Claude

```typescript
const client = new LLMClient({
  provider: 'anthropic',
  apiKeys: { anthropic: 'sk-ant-...' }
});

// Available models
await client.complete({
  prompt: 'Hello',
  model: 'claude-haiku-4-20250514'    // Fast, efficient
  // or: 'claude-opus-4-20250514'      // Highest capability
  // or: 'claude-3-haiku-20240307'     // Fastest
});
```

## Caching

The client uses internal caching for efficiency:

```typescript
// Same configuration = same client instance
const client1 = new LLMClient({ provider: 'google' });
const client2 = new LLMClient({ provider: 'google' });
// client1 and client2 share the same underlying provider client

// Clear cache if needed
import { clearProviderCache } from 'semantic-primitives';
clearProviderCache();
```

## Error Handling

```typescript
try {
  const response = await client.complete({ prompt: 'Hello' });
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
    await delay(1000);
    // Retry...
  } else if (error.message.includes('invalid api key')) {
    // Handle authentication error
  } else {
    // Handle other errors
    console.error('LLM Error:', error);
  }
}
```

## Best Practices

### 1. Use Appropriate Models

```typescript
// For simple tasks, use smaller/faster models
await client.complete({
  prompt: 'Classify: complaint or question?',
  model: 'gpt-4.1-nano',  // Fast, cheap
  maxTokens: 10
});

// For complex reasoning, use capable models
await client.complete({
  prompt: 'Analyze this code architecture...',
  model: 'gpt-4o',  // More capable
  maxTokens: 2000
});
```

### 2. Optimize Token Usage

```typescript
// Set appropriate maxTokens
await client.complete({
  prompt: 'Is this a question? Answer yes or no.',
  maxTokens: 5  // Only need a short response
});

// Use system prompts for context
await client.complete({
  prompt: userInput,
  systemPrompt: 'Respond briefly in 1-2 sentences.',
  maxTokens: 100
});
```

### 3. Handle Rate Limits

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.message.includes('rate limit') && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      throw e;
    }
  }
  throw new Error('Max retries exceeded');
}

const response = await withRetry(() =>
  client.complete({ prompt: 'Hello' })
);
```

### 4. Provider Fallback

```typescript
async function robustComplete(prompt: string) {
  const providers: LLMProvider[] = ['google', 'openai', 'anthropic'];

  for (const provider of providers) {
    try {
      return await client.withProvider(provider).complete({ prompt });
    } catch (e) {
      console.warn(`${provider} failed:`, e.message);
      continue;
    }
  }

  throw new Error('All providers failed');
}
```
