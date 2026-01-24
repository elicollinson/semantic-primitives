# semantic-primitives

TypeScript library providing LLM-enhanced primitive types. Smart versions of bools, strings, numbers, and arrays with built-in semantic understanding, fuzzy matching, natural language parsing, and AI-powered operations. Drop-in replacements for native types that understand context and meaning.

## Installation

```bash
bun add semantic-primitives
```

Or with npm:

```bash
npm install semantic-primitives
```

## Quick Start

```typescript
import { complete, LLMClient } from 'semantic-primitives';

// Simple completion using default provider
const response = await complete('What is 2 + 2?');
console.log(response.content); // "4"

// Or use the client for more control
const client = new LLMClient();
const result = await client.complete({
  prompt: 'Explain quantum computing in one sentence.',
  maxTokens: 100,
});
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# LLM Provider Selection (openai, anthropic, or google)
# Default: google
LLM_PROVIDER=google

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Google Configuration (default provider)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-2.0-flash-lite

# Optional: Default settings
LLM_MAX_TOKENS=1024
LLM_TEMPERATURE=0.7
```

Bun automatically loads `.env` files, so no additional setup is required.

### Provider Configuration

#### Google (Default Provider)

Google's Gemini models are the default. To configure:

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set environment variables:

```bash
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-2.0-flash-lite  # Default model
```

Available models: `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`

#### OpenAI

To use OpenAI models:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set environment variables:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini  # Default model
```

Available models: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`

#### Anthropic

To use Anthropic's Claude models:

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Set environment variables:

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # Default model
```

Available models: `claude-opus-4-20250514`, `claude-sonnet-4-20250514`, `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`

### Programmatic Configuration

You can also configure providers in code without using environment variables:

```typescript
import { LLMClient } from 'semantic-primitives';

// Configure with explicit API keys
const client = new LLMClient({
  provider: 'anthropic',
  apiKeys: {
    openai: 'sk-...',
    anthropic: 'sk-ant-...',
    google: 'AIza...',
  },
});

// Override provider and model per-request
const response = await client.complete({
  prompt: 'Hello!',
  provider: 'openai',      // Use OpenAI for this request
  model: 'gpt-4o',         // Use specific model
  maxTokens: 500,
  temperature: 0.5,
});
```

### Configuration Priority

Settings are resolved in the following order (highest to lowest priority):

1. **Per-request options** - `provider`, `model`, etc. passed to `complete()` or `chat()`
2. **Client constructor** - Options passed when creating `LLMClient`
3. **Environment variables** - `LLM_PROVIDER`, `OPENAI_MODEL`, etc.
4. **Built-in defaults** - Google with `gemini-2.0-flash-lite`

## API Reference

### LLMClient

The main client class for interacting with LLM providers.

```typescript
import { LLMClient } from 'semantic-primitives';

const client = new LLMClient({
  provider: 'openai', // Optional: override LLM_PROVIDER env var
  apiKeys: {
    openai: 'sk-...',
    anthropic: 'sk-ant-...',
    google: 'AIza...',
  },
});
```

#### `client.complete(options)`

Generate a completion from a prompt.

```typescript
const response = await client.complete({
  prompt: 'Write a haiku about programming',
  systemPrompt: 'You are a creative poet.',
  maxTokens: 100,
  temperature: 0.8,
});

console.log(response.content);
console.log(response.usage); // { promptTokens, completionTokens, totalTokens }
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `prompt` | `string` | The prompt to send to the model (required) |
| `systemPrompt` | `string` | System message to set context |
| `provider` | `'openai' \| 'anthropic' \| 'google'` | Override the default provider |
| `model` | `string` | Override the default model |
| `maxTokens` | `number` | Maximum tokens to generate |
| `temperature` | `number` | Response randomness (0-2) |
| `topP` | `number` | Top-p sampling parameter |
| `stopSequences` | `string[]` | Stop sequences to end generation |

#### `client.chat(options)`

Generate a response in a multi-turn conversation.

```typescript
const response = await client.chat({
  messages: [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi there! How can I help you today?' },
    { role: 'user', content: 'What is the capital of France?' },
  ],
  systemPrompt: 'You are a helpful geography assistant.',
});

console.log(response.content); // "The capital of France is Paris."
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `messages` | `Message[]` | Array of conversation messages (required) |
| `systemPrompt` | `string` | System message (prepended to messages) |
| `provider` | `'openai' \| 'anthropic' \| 'google'` | Override the default provider |
| `model` | `string` | Override the default model |
| `maxTokens` | `number` | Maximum tokens to generate |
| `temperature` | `number` | Response randomness (0-2) |

#### `client.withProvider(provider)`

Create a new client instance with a different provider.

```typescript
const openaiClient = new LLMClient({ provider: 'openai' });
const anthropicClient = openaiClient.withProvider('anthropic');
```

### Convenience Functions

#### `complete(prompt, options?)`

Shorthand for simple completions using the default client.

```typescript
import { complete } from 'semantic-primitives';

const response = await complete('What is the meaning of life?');
```

#### `chat(options)`

Shorthand for chat completions using the default client.

```typescript
import { chat } from 'semantic-primitives';

const response = await chat({
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

#### `getClient()`

Get the singleton default client instance.

```typescript
import { getClient } from 'semantic-primitives';

const client = getClient();
```

### Direct Provider Access

For advanced use cases, you can instantiate providers directly:

```typescript
import { OpenAIProvider, AnthropicProvider, GoogleProvider } from 'semantic-primitives';

const openai = new OpenAIProvider('sk-...', 'gpt-4o');
const anthropic = new AnthropicProvider('sk-ant-...', 'claude-opus-4-20250514');
const google = new GoogleProvider('AIza...', 'gemini-2.0-flash-lite');
```

### Types

```typescript
import type {
  LLMProvider,        // 'openai' | 'anthropic' | 'google'
  Message,            // { role: MessageRole; content: string }
  MessageRole,        // 'system' | 'user' | 'assistant'
  LLMConfig,          // Base configuration options
  CompletionOptions,  // Options for complete()
  ChatOptions,        // Options for chat()
  LLMResponse,        // Response from LLM calls
} from 'semantic-primitives';
```

### Response Format

All LLM methods return an `LLMResponse`:

```typescript
interface LLMResponse {
  content: string;           // Generated text
  provider: LLMProvider;     // Provider that generated response
  model: string;             // Model that was used
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: unknown;             // Raw provider response
}
```

## Examples

### Switching Providers at Runtime

```typescript
import { LLMClient } from 'semantic-primitives';

const client = new LLMClient();

// Use OpenAI for creative tasks
const poem = await client.complete({
  prompt: 'Write a poem about the ocean',
  provider: 'openai',
  temperature: 0.9,
});

// Use Anthropic for analysis
const analysis = await client.complete({
  prompt: 'Analyze this poem: ' + poem.content,
  provider: 'anthropic',
  temperature: 0.3,
});
```

### Building a Chatbot

```typescript
import { LLMClient, type Message } from 'semantic-primitives';

const client = new LLMClient();
const conversationHistory: Message[] = [];

async function sendMessage(userMessage: string): Promise<string> {
  conversationHistory.push({ role: 'user', content: userMessage });

  const response = await client.chat({
    messages: conversationHistory,
    systemPrompt: 'You are a helpful assistant.',
  });

  conversationHistory.push({ role: 'assistant', content: response.content });
  return response.content;
}

// Usage
await sendMessage('Hello!');
await sendMessage('What can you help me with?');
```

### Error Handling

```typescript
import { LLMClient } from 'semantic-primitives';

const client = new LLMClient();

try {
  const response = await client.complete({
    prompt: 'Hello, world!',
  });
  console.log(response.content);
} catch (error) {
  if (error instanceof Error) {
    console.error('LLM Error:', error.message);
  }
}
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/elicollinson/semantic-primitives.git
cd semantic-primitives

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
# Edit .env with your API keys
```

### Scripts

```bash
# Run tests
bun test

# Type check
bun run typecheck

# Build library
bun run build

# Development mode with watch
bun run dev
```

### Project Structure

```
semantic-primitives/
├── src/
│   ├── index.ts              # Main library exports
│   └── llm/
│       ├── index.ts          # LLM module exports
│       ├── types.ts          # Type definitions
│       ├── client.ts         # Unified LLMClient
│       ├── providers/
│       │   ├── index.ts      # Provider exports
│       │   ├── openai.ts     # OpenAI implementation
│       │   ├── anthropic.ts  # Anthropic implementation
│       │   └── google.ts     # Google implementation
│       └── __tests__/
│           ├── types.test.ts
│           ├── providers.test.ts
│           └── client.test.ts
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Supported Providers

| Provider | Default Model | Other Models | Status |
|----------|---------------|--------------|--------|
| Google (default) | gemini-2.0-flash-lite | Gemini 2.0 Flash, Gemini 1.5 Pro, etc. | Supported |
| OpenAI | gpt-4o-mini | GPT-4o, GPT-4, etc. | Supported |
| Anthropic | claude-sonnet-4-20250514 | Claude Opus 4, etc. | Supported |

## License

MIT
