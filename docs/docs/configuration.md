---
sidebar_position: 3
---

# Configuration

Semantic Primitives can be configured through environment variables or programmatically.

## Environment Variables

### Provider Selection

```bash
# Select the LLM provider (google, openai, or anthropic)
LLM_PROVIDER=google
```

### API Keys

```bash
# Google Gemini (default provider)
GOOGLE_API_KEY=AIza...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
```

### Model Selection

```bash
# Override the default model for each provider
GOOGLE_MODEL=gemini-2.0-flash-lite
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### Default Parameters

```bash
# Set default generation parameters
LLM_MAX_TOKENS=1024
LLM_TEMPERATURE=0.7
```

## Using with Bun

If you're using Bun, environment variables from `.env` files are loaded automatically:

```bash
# .env
GOOGLE_API_KEY=your-api-key
LLM_PROVIDER=google
```

No additional setup required - just run your code with `bun`.

## Programmatic Configuration

### Creating a Custom Client

```typescript
import { LLMClient } from 'semantic-primitives';

const client = new LLMClient({
  provider: 'openai',
  apiKeys: {
    openai: 'sk-your-api-key',
    google: 'your-google-key',
    anthropic: 'sk-ant-your-key',
  },
});
```

### Using a Custom Client with Types

Pass your custom client to semantic types:

```typescript
import { SemanticString, LLMClient } from 'semantic-primitives';

const client = new LLMClient({ provider: 'anthropic' });
const str = SemanticString.from("Hello world", client);

const result = await str.classify(['greeting', 'question']);
```

### Per-Request Configuration

Override settings for individual requests:

```typescript
const response = await client.complete({
  prompt: 'Analyze this text',
  provider: 'openai',        // Override provider
  model: 'gpt-4o',           // Override model
  maxTokens: 2048,           // Override max tokens
  temperature: 0.5,          // Override temperature
});
```

## Available Models

### Google Gemini

| Model | Description |
|-------|-------------|
| `gemini-2.0-flash-lite` | Fast, efficient (default) |
| `gemini-2.0-flash` | Balanced performance |
| `gemini-1.5-pro` | High capability |
| `gemini-1.5-flash` | Fast, good quality |

### OpenAI

| Model | Description |
|-------|-------------|
| `gpt-4o-mini` | Fast, cost-effective (default) |
| `gpt-4o` | Latest GPT-4 |
| `gpt-4-turbo` | High capability |
| `gpt-4` | Original GPT-4 |
| `gpt-3.5-turbo` | Fast, affordable |

### Anthropic Claude

| Model | Description |
|-------|-------------|
| `claude-sonnet-4-20250514` | Balanced (default) |
| `claude-opus-4-20250514` | Highest capability |
| `claude-3-5-sonnet-20241022` | Previous generation |
| `claude-3-haiku-20240307` | Fastest |

## Configuration Priority

Settings are applied in this order (highest priority first):

1. **Per-request options** - Passed to individual method calls
2. **Client constructor** - Passed when creating `LLMClient`
3. **Environment variables** - Set in your environment or `.env`
4. **Built-in defaults** - Google Gemini 2.0 Flash Lite

## Example: Multi-Provider Setup

```typescript
import { LLMClient, SemanticString } from 'semantic-primitives';

// Create a client with multiple providers configured
const client = new LLMClient({
  provider: 'google', // Default provider
  apiKeys: {
    google: process.env.GOOGLE_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
});

// Use default provider (Google)
const str1 = SemanticString.from("Hello", client);
await str1.classify(['greeting', 'question']);

// Switch to OpenAI for this operation
const response = await client.withProvider('openai').complete({
  prompt: 'Explain quantum computing',
  maxTokens: 500,
});

// Switch to Anthropic
const response2 = await client.withProvider('anthropic').complete({
  prompt: 'Write a haiku about code',
});
```

## Cost Optimization Tips

1. **Use smaller models for simple tasks** - `gpt-4o-mini` or `gemini-2.0-flash-lite` are fast and cheap
2. **Batch similar operations** - Process multiple items together when possible
3. **Cache results** - Store LLM responses for repeated queries
4. **Lower max tokens** - Set `maxTokens` to the minimum needed
5. **Use appropriate temperature** - Lower temperatures (0.1-0.3) for factual tasks, higher (0.7-0.9) for creative tasks
